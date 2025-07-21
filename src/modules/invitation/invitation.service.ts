import { throwHttpError } from 'src/common/errors/http-exception.helper';
import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcrypt';
import { RequestContextService } from 'src/common/context/request-context/request-context.service';
import { AppConfigService } from 'src/config/config.service';
import { Invitation, InvitationStatus } from 'src/entities/invitation.entity';
import { Role } from 'src/entities/role.entity';
import { StoreUser, StoreUserStatus } from 'src/entities/store-user.entity';
import { Store } from 'src/entities/store.entity';
import { User, AuthProvider } from 'src/entities/User.entity';
import { MyLoggerService } from 'src/my-logger/my-logger.service';
import { AuthService } from '../auth/auth.service';
import { CreateInvitationDto, AcceptInvitationDto } from './dto/invitation.dto';
import { EmailService } from 'src/common/email/email.service';
import { ErrorCode } from 'src/common/errors/error-codes.enum';

@Injectable()
export class InvitationService {
  constructor(
    @InjectRepository(Invitation)
    private invitationRepository: Repository<Invitation>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Store)
    private storeRepository: Repository<Store>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(StoreUser)
    private storeUserRepository: Repository<StoreUser>,
    private readonly emailService: EmailService,
    private readonly configService: AppConfigService,
    private readonly logger: MyLoggerService,
    private readonly requestContextService: RequestContextService,
    private dataSource: DataSource, // Pour les transactions
    private readonly authService: AuthService, // Pour générer les tokens après acceptation
  ) {}

  /**
   * Crée et envoie une invitation à un utilisateur pour rejoindre une boutique.
   * @param dto Les données de l'invitation (email, roleId, fullName).
   * @returns L'invitation créée.
   */
  async createInvitation(dto: CreateInvitationDto): Promise<Invitation> {
    const { email, roleId } = dto;
    const { storeId, storeUserId: inviterStoreUserId } = this.requestContextService.getContext();

    if (!storeId || !inviterStoreUserId) {
      throwHttpError(ErrorCode.CONTEXT_INFO_NOTFOUND);
    }

    const store = await this.storeRepository.findOne({ where: { id: storeId } });
    if (!store) {
      throw new NotFoundException(`Boutique avec l'ID ${storeId} non trouvée.`);
    }

    const role = await this.roleRepository.findOne({
      where: { id: roleId, store: { id: storeId } },
    });
    if (!role) {
      throw new NotFoundException(
        `Rôle avec l'ID ${roleId} non trouvé ou n'appartient pas à cette boutique.`,
      );
    }

    //  Vérifier si l'email est déjà un StoreUser ACTIF dans cette boutique
    const existingStoreUser = await this.storeUserRepository.findOne({
      where: { user: { email: email }, store: { id: storeId }, status: StoreUserStatus.ACTIVE },
    });
    if (existingStoreUser) {
      throw new ConflictException(
        `L'utilisateur avec l'email "${email}" est déjà un employé actif de la boutique "${store.name}".`,
      );
    }

    // 4. Vérifier si une invitation PENDING existe déjà pour cet email et cette boutique
    const existingPendingInvitation = await this.invitationRepository.findOne({
      where: { email: email, store: { id: storeId }, status: InvitationStatus.PENDING },
    });
    if (existingPendingInvitation) {
      throw new ConflictException(
        `Une invitation en attente existe déjà pour l'email "${email}" dans la boutique "${store.name}".`,
      );
    }

    // 5. Générer un token unique et hacher
    const rawToken = uuidv4(); // Utilise UUID pour un token unique
    const tokenHash = await bcrypt.hash(rawToken, 10); // Hache le token pour le stockage

    const expiresAt = new Date();
    expiresAt.setDate(
      expiresAt.getDate() +
        parseInt(this.configService.jwtRefrehTokenExpiration?.replace('d', '') || '7', 10),
    );

    // 6. Récupérer l'inviteur pour l'audit et l'email
    const inviter = await this.storeUserRepository.findOne({
      where: { id: inviterStoreUserId },
      relations: ['user'], // Pour obtenir le nom complet de l'inviteur
    });
    if (!inviter) {
      this.logger.warn(
        `Inviter StoreUser with ID ${inviterStoreUserId} not found for audit log.`,
        'InvitationService',
      );
      throw new NotFoundException(`Inviteur non trouvé.`);
    }

    if (!inviter.user) {
      throw new NotFoundException('Utilisateur de l’inviteur introuvable.');
    }

    // 7. Créer et sauvegarder l'invitation
    const invitation = this.invitationRepository.create({
      email,
      token: tokenHash,
      expiresAt,
      status: InvitationStatus.PENDING,
      store,
      storeId: store.id,
      role,
      roleId: role.id,
      invitedBy: inviter,
      invitedById: inviterStoreUserId,
    });
    await this.invitationRepository.save(invitation);
    this.logger.log(
      `Invitation créée pour ${email} à rejoindre ${store.name} avec le rôle ${role.name}.`,
      'InvitationService',
    );

    // 8. Envoyer l'email d'invitation
    const invitationLink = `${this.configService.frontendUrl}/accept-invite?token=${rawToken}`; // URL de votre frontend
    await this.emailService.sendInvitationEmail(
      email,
      invitationLink,
      inviter?.user?.fullName || 'Un administrateur', // Nom de l'inviteur
      store.name,
      role.name,
    );

    return invitation;
  }

  /**
   * Accepte une invitation.
   * Cette méthode gère la création/liaison de l'utilisateur global et la création du StoreUser.
   * @returns Les tokens d'authentification pour la boutique.
   */
  async acceptInvitation(
    rawToken: string,
    dto: AcceptInvitationDto,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const { password, fullName, phone, avatarUrl } = dto;

    if (!password) {
      throw new BadRequestException('Mot de passe manquant.');
    }

    // 1. Trouver et valider l'invitation
    const invitations = await this.invitationRepository.find({
      where: { status: InvitationStatus.PENDING }, // Ne chercher que les invitations en attente
      relations: ['store', 'role', 'role.permissions', 'invitedBy', 'invitedBy.user'],
    });

    let validInvitation: Invitation | null = null;
    for (const inv of invitations) {
      if (await bcrypt.compare(rawToken, inv.token)) {
        validInvitation = inv;
        break;
      }
    }

    if (!validInvitation) {
      throw new BadRequestException("Jeton d'invitation invalide ou introuvable.");
    }
    if (validInvitation.expiresAt < new Date()) {
      validInvitation.status = InvitationStatus.EXPIRED;
      await this.invitationRepository.save(validInvitation);
      throw new BadRequestException("Le lien d'invitation a expiré.");
    }

    let user: User | null;
    let storeUser: StoreUser;

    try {
      const tokens = await this.dataSource.transaction(async (manager) => {
        // 2. Trouver ou créer l'utilisateur global
        user = await manager
          .getRepository(User)
          .findOne({ where: { email: validInvitation.email } });
        if (user) {
          // 3. Créer l'entrée StoreUser
          const existingStoreUserForUserAndStore = await manager.getRepository(StoreUser).findOne({
            where: { user: { id: user.id }, store: { id: validInvitation.storeId } },
          });
          if (existingStoreUserForUserAndStore) {
            // Si l'utilisateur est déjà un StoreUser pour cette boutique (même s'il était inactif ou en attente)
            // Mettre à jour son rôle et son statut si nécessaire.
            storeUser = existingStoreUserForUserAndStore;
            if (
              storeUser.status !== StoreUserStatus.ACTIVE ||
              storeUser.roleId !== validInvitation.roleId
            ) {
              storeUser.status = StoreUserStatus.ACTIVE;
              storeUser.role = validInvitation.role;
              storeUser.roleId = validInvitation.roleId;
              await manager.getRepository(StoreUser).save(storeUser);
              this.logger.log(
                `Existing StoreUser ${storeUser.id} updated via invitation acceptance.`,
                'InvitationService',
              );
              // 4. Marquer l'invitation comme acceptée
              validInvitation.status = InvitationStatus.ACCEPTED;
              await manager.getRepository(Invitation).save(validInvitation);
              this.logger.log(
                `Invitation ${validInvitation.id} acceptée par ${user.email}.`,
                'InvitationService',
              );
            }
          } else {
            // Créer une nouvelle entrée StoreUser
            storeUser = manager.getRepository(StoreUser).create({
              user: user,
              userId: user.id,
              store: validInvitation.store,
              storeId: validInvitation.store.id,
              role: validInvitation.role,
              roleId: validInvitation.role.id,
              status: StoreUserStatus.ACTIVE,
              joinedAt: new Date(),
            });
            await manager.getRepository(StoreUser).save(storeUser);
            this.logger.log(
              `New StoreUser created for ${user.email} in store ${validInvitation.store.name}.`,
              'InvitationService',
            );
            // 4. Marquer l'invitation comme acceptée
            validInvitation.status = InvitationStatus.ACCEPTED;
            await manager.getRepository(Invitation).save(validInvitation);
            this.logger.log(
              `Invitation ${validInvitation.id} acceptée par ${user.email}.`,
              'InvitationService',
            );
          }
        } else {
          const hashedPassword = await bcrypt.hash(password, 10);
          user = manager.getRepository(User).create({
            email: validInvitation.email,
            fullName: fullName,
            password: hashedPassword,
            isActive: true,
            authProvider: AuthProvider.LOCAL,
            phone,
            avatarUrl,
            canCreateStore: false, // Les utilisateurs invités ne peuvent pas créer de boutiques par défaut
          });
          await manager.getRepository(User).save(user);
          this.logger.log(`New user ${user.email} created via invitation.`, 'InvitationService');

          // Créer une nouvelle entrée StoreUser
          storeUser = manager.getRepository(StoreUser).create({
            user: user,
            userId: user.id,
            store: validInvitation.store,
            storeId: validInvitation.store.id,
            role: validInvitation.role,
            roleId: validInvitation.role.id,
            status: StoreUserStatus.ACTIVE,
            joinedAt: new Date(),
          });
          await manager.getRepository(StoreUser).save(storeUser);
          this.logger.log(
            `New StoreUser created for ${user.email} in store ${validInvitation.store.name}.`,
            'InvitationService',
          );

          // 4. Marquer l'invitation comme acceptée
          validInvitation.status = InvitationStatus.ACCEPTED;
          await manager.getRepository(Invitation).save(validInvitation);
          this.logger.log(
            `Invitation ${validInvitation.id} acceptée par ${user.email}.`,
            'InvitationService',
          );
        }
        //  Générer et retourner les tokens d'authentification pour la nouvelle session de boutique
        const finalStoreUser = await this.storeUserRepository.findOne({
          where: { id: storeUser.id },
          relations: ['user', 'store', 'role', 'role.permissions'],
        });
        if (!finalStoreUser) {
          throw new Error('Erreur interne: StoreUser non trouvé après la transaction.');
        }
        return this.authService.generateTokens(finalStoreUser.user, finalStoreUser);
      });
      return tokens;
    } catch (error) {
      const err = error as Error;

      this.logger.error(
        `Échec de l'acceptation de l'invitation par ${validInvitation?.email || 'inconnu'}: ${err.message}`,
        err.stack,
        'InvitationService',
      );
      throw error;
    }
  }

  /**
   * Révoque une invitation en attente.
   * @param storeId L'ID de la boutique.
   * @param invitationId L'ID de l'invitation à révoquer.
   * @param revokerStoreUserId L'ID du StoreUser qui révoque l'invitation.
   * @returns L'invitation révoquée.
   */
  async revokeInvitation(
    storeId: number,
    invitationId: number,
    revokerStoreUserId: number,
  ): Promise<Invitation> {
    // 2. Trouver l'invitation
    const invitation = await this.invitationRepository.findOne({
      where: { id: invitationId, store: { id: storeId } },
      relations: ['store', 'role', 'invitedBy', 'invitedBy.user'],
    });

    if (!invitation) {
      throw new NotFoundException(
        `Invitation avec l'ID ${invitationId} non trouvée pour la boutique ${storeId}.`,
      );
    }
    if (invitation.status !== InvitationStatus.PENDING) {
      throw new BadRequestException(
        `L'invitation avec l'ID ${invitationId} n'est pas en attente et ne peut pas être révoquée.`,
      );
    }

    invitation.status = InvitationStatus.CANCELLED;
    await this.invitationRepository.save(invitation);
    this.logger.log(
      `Invitation ${invitation.id} révoquée par StoreUser ${revokerStoreUserId}.`,
      'InvitationService',
    );

    return invitation;
  }

  /**
   * Récupère toutes les invitations pour une boutique donnée.
   * @param storeId L'ID de la boutique.
   * @returns Liste des invitations.
   */
  async findAllInvitations(storeId: number): Promise<Invitation[]> {
    const invitations = await this.invitationRepository.find({
      where: { store: { id: storeId } },
      relations: ['role', 'invitedBy', 'invitedBy.user'],
      order: { createdAt: 'DESC' },
    });

    return invitations;
  }
}
