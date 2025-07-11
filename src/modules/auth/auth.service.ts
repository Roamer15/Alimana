import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm'; //décorateur de TypeORM pour injecter un dépôt (Repository) d'entité spécifique.
import { Repository } from 'typeorm'; //fournit des méthodes pour interagir avec la base de données (enregistrer, trouver, supprimer des entités).
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { JwtService } from '@nestjs/jwt';
import { AppConfigService } from '../../config/config.service';
import { AuthProvider, User } from '../../entities/User.entity';
import { UserRefreshToken } from '../../entities/user-refresh-token.entity';
import { StoreUser, StoreUserStatus } from '../../entities/store-user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { v4 as uuidv4 } from 'uuid'; //pour générer des identifiants uniques universels (UUID), utilisée ici pour les jetons de rafraîchissement.
import { ErrorCode } from '../../common/errors/error-codes.enum';
import { throwHttpError } from '../../common/errors/http-exception.helper';
import { Profile } from 'passport-google-oauth20';
import { Request } from 'express';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(UserRefreshToken)
    private userRefreshTokensRepository: Repository<UserRefreshToken>,
    @InjectRepository(StoreUser)
    private storeUsersRepository: Repository<StoreUser>,
    private jwtService: JwtService,
    private configService: AppConfigService,
  ) {}

  //  Création de compte
  async registerLocal(registerDto: RegisterDto): Promise<User> {
    const { fullName, email, password, phone } = registerDto;

    const existingUser = await this.usersRepository.findOne({ where: { email } });
    if (existingUser) {
      throwHttpError(ErrorCode.EMAIL_ALREADY_USED, { email: email });
    }

    const hashedPassword = await bcrypt.hash(password!, 10);

    const newUser = this.usersRepository.create({
      fullName,
      email,
      password: hashedPassword,
      phone,
      canCreateStore: true,
    });

    await this.usersRepository.save(newUser);
    return newUser;
  }

  async validateUser(email: string, pass: string): Promise<User | null> {
    const user = await this.usersRepository.findOne({ where: { email } });

    // Si l'utilisateur n'est pas trouvé, lever une erreur USER_NOT_FOUND
    // C'est préférable à "EMAIL_ALREADY_USED" qui est pour l'enregistrement.
    // Pour des raisons de sécurité (prévention de l'énumération d'utilisateurs),
    // certains préfèrent une erreur générique "Identifiants invalides" pour les deux cas (utilisateur non trouvé ou mot de passe incorrect).
    if (!user) {
      throwHttpError(ErrorCode.USER_NOT_FOUND, { email: email });
    }

    // Si l'utilisateur est trouvé mais que le mot de passe est nul/indéfini dans la DB,
    // cela indique un problème de données ou un utilisateur sans mot de passe,
    // ce qui devrait empêcher la connexion. On traite cela comme des identifiants invalides.
    // Normalement, après l'enregistrement, user.password ne devrait pas être null.
    if (!user.password) {
      throwHttpError(ErrorCode.INVALID_CREDENTIALS, { reason: 'User has no password set' });
    }

    // Comparer le mot de passe fourni avec le mot de passe haché de l'utilisateur
    const isPasswordValid = await bcrypt.compare(pass, user.password);

    if (isPasswordValid) {
      // Exclure le mot de passe de l'objet utilisateur retourné pour des raisons de sécurité
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...result } = user;
      return result as User;
    } else {
      // Si le mot de passe n'est pas valide, lever une erreur INVALID_CREDENTIALS
      throwHttpError(ErrorCode.INVALID_CREDENTIALS);
    }
  }

  async findOrCreateGoogleUser(profile: Profile): Promise<User> {
    const email = profile.emails?.[0]?.value;
    const googleId = profile.id;
    const fullName = profile.displayName;
    const avatarUrl = profile.photos?.[0]?.value;

    //  Validation des données de profil Google entrantes
    if (!email || !googleId || !fullName) {
      throwHttpError(ErrorCode.VALIDATION_FAILED, {
        reason: 'Profil Google incomplet',
        details: {
          emailProvided: !!email,
          googleIdProvided: !!googleId,
          fullNameProvided: !!fullName,
        },
      });
    }

    //  Tenter de trouver l'utilisateur par son ID Google (providerId)
    let user = await this.usersRepository.findOne({
      where: { providerId: googleId, authProvider: AuthProvider.GOOGLE },
    });

    if (user) {
      return user;
    }

    // 3. Si non trouvé par ID Google, tenter de trouver l'utilisateur par son email.
    user = await this.usersRepository.findOne({ where: { email } });

    if (user) {
      // Utilisateur trouvé par email.
      if (user.authProvider === AuthProvider.GOOGLE) {
        // L'email est déjà associé à un compte Google, mais peut-être que le providerId n'était pas défini
        // ou qu'il y a eu un problème lors de la première recherche.
        // Mettre à jour le providerId si manquant, pour s'assurer que le compte est bien lié.
        if (!user.providerId) {
          user.providerId = googleId;
          await this.usersRepository.save(user);
        }
        return user;
      } else {
        // L'email existe, mais est lié à un fournisseur d'authentification différent (ex: local, Facebook).
        // C'est un conflit. L'utilisateur doit se connecter avec sa méthode originale
        // ou lier explicitement les comptes (logique non implémentée ici pour simplifier).
        throwHttpError(ErrorCode.EMAIL_ALREADY_USED, {
          email: email,
          reason: `Cet email est déjà enregistré avec le fournisseur ${user.authProvider}.`,
        });
      }
    }

    //  Si aucun utilisateur n'est trouvé (ni par ID Google, ni par email), créer un nouvel utilisateur.
    user = this.usersRepository.create({
      providerId: googleId,
      email,
      fullName,
      avatarUrl,
      authProvider: AuthProvider.GOOGLE,
      canCreateStore: true, // Permission par défaut pour les nouveaux utilisateurs
    });

    await this.usersRepository.save(user);
    return user;
  }

  //  Authentification & Génération de Tokens
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async generateTokens(user: User, storeUser?: StoreUser, req?: Request) {
    const payload = {
      userId: user.id,
      email: user.email,
      canCreateStore: user.canCreateStore,
      ...(storeUser && {
        storeUserId: storeUser.id,
        storeId: storeUser.store.id,
        roleId: storeUser.role.id,
        roleName: storeUser.role.name,
        permissions: storeUser.role.permissions,
      }),
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.jwtAccessTokenExpiration,
    });

    const refreshTokenValue = uuidv4(); // Token brut à retourner au client
    const refreshTokenHash = this.hashToken(refreshTokenValue);

    const refreshExpiresIn = new Date();
    refreshExpiresIn.setDate(
      refreshExpiresIn.getDate() +
        parseInt(this.configService.jwtRefrehTokenExpiration?.replace('d', '') || '7', 10),
    );

    const newRefreshToken = this.userRefreshTokensRepository.create({
      tokenHash: refreshTokenHash,
      expiresAt: refreshExpiresIn,
      user,
      ...(storeUser && { storeUser }), // ajout conditionnel propre
    });

    await this.userRefreshTokensRepository.save(newRefreshToken);

    return {
      accessToken,
      refreshToken: refreshTokenValue, // C’est celui-ci qu’on envoie au client
    };
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private compareTokenHash(plainToken: string, hashedToken: string): boolean {
    return this.hashToken(plainToken) === hashedToken;
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.generateTokens(user);
  }

  // --- 4. Sélection de boutique ---
  async selectStore(userId: number, storeUserId: number) {
    const storeUser = await this.storeUsersRepository.findOne({
      where: { id: storeUserId, user: { id: userId } },
      relations: ['user', 'store', 'role', 'role.permissions'],
    });

    if (!storeUser) {
      throwHttpError(ErrorCode.INVALID_CREDENTIALS, {
        reason: "Sélection de boutique invalide ou non associée à l'utilisateur.",
        details: { userId, storeUserId },
      });
    }

    if (storeUser.status !== StoreUserStatus.ACTIVE) {
      throwHttpError(ErrorCode.ACCESS_DENIED, {
        reason: 'Votre accès à la boutique a été désactivé.',
        details: { storeUserId, status: storeUser.status },
      });
    }

    // Mettre à jour l'utilisateur avec le contexte actif de la boutique
    await this.usersRepository.update(userId, { lastSelectedStoreUserId: storeUserId });

    // Générer de nouveaux tokens incluant les informations de la boutique
    return this.generateTokens(storeUser.user, storeUser);
  }

  // --- 6. Refresh Token ---
  async refreshTokens(refreshToken: string, req?: Request) {
    // Calculer le hash du refreshToken fourni
    const hashedToken = this.hashToken(refreshToken);

    // Trouver le token non révoqué avec ce hash
    const storedToken = await this.userRefreshTokensRepository.findOne({
      where: { revoked: false, tokenHash: hashedToken },
      relations: ['user', 'storeUser'], // Charger les relations nécessaires
    });

    if (!storedToken || storedToken.expiresAt < new Date()) {
      // Si le token est invalide ou expiré, révoquer tous les tokens non révoqués de cet utilisateur (sécurité)
      if (storedToken?.user) {
        await this.userRefreshTokensRepository.update(
          { user: storedToken.user, revoked: false },
          { revoked: true },
        );
      }
      throwHttpError(ErrorCode.INVALID_CREDENTIALS, {
        reason: 'Jeton de rafraîchissement invalide ou expiré.',
      });
    }

    // Révoquer le token de rafraîchissement utilisé
    storedToken.revoked = true;
    await this.userRefreshTokensRepository.save(storedToken);

    const user = storedToken.user;
    const associatedStoreUser = storedToken.storeUser; // Récupérer l'utilisateur de magasin associé

    // Générer de nouveaux tokens
    return this.generateTokens(user, associatedStoreUser, req);
  }

  async logout(refreshToken: string) {
    const hashed = this.hashToken(refreshToken);

    const token = await this.userRefreshTokensRepository.findOne({
      where: { tokenHash: hashed, revoked: false },
    });

    if (token) {
      token.revoked = true;
      await this.userRefreshTokensRepository.save(token);
    }
  }
}
