// // src/common/email/email.service.ts
// import { Injectable } from '@nestjs/common';
// import { MyLoggerService } from 'src/my-logger/my-logger.service';
// import { AppConfigService } from 'src/config/config.service';

// @Injectable()
// export class EmailService {
//   constructor(
//     private readonly logger: MyLoggerService,
//     private readonly configService: AppConfigService,
//   ) {}

//   async sendInvitationEmail(
//     to: string,
//     invitationLink: string,
//     inviterName: string,
//     storeName: string,
//     roleName: string,
//   ): Promise<void> {
//     const subject = `Invitation à rejoindre la boutique ${storeName} sur Alimana`;
//     const text = `Bonjour,

// ${inviterName} vous a invité à rejoindre la boutique "${storeName}" en tant que ${roleName} sur la plateforme Alimana.

// Pour accepter l'invitation et créer votre compte (ou vous connecter si vous en avez déjà un), veuillez cliquer sur le lien suivant :
// ${invitationLink}

// Ce lien expirera le ${new Date(Date.now() + this.configService.invitationTokenExpirationMs).toLocaleString()}.

// Si vous n'avez pas demandé cette invitation, veuillez ignorer cet e-mail.

// Cordialement,
// L'équipe Alimana`;

//     // En production, vous utiliseriez un service d'envoi d'emails comme SendGrid, Nodemailer, etc.
//     // Exemple conceptuel avec Nodemailer:
//     /*
//     const transporter = nodemailer.createTransport({
//       host: this.configService.emailHost,
//       port: this.configService.emailPort,
//       secure: this.configService.emailSecure,
//       auth: {
//         user: this.configService.emailUser,
//         pass: this.configService.emailPass,
//       },
//     });

//     await transporter.sendMail({
//       from: this.configService.emailFrom,
//       to,
//       subject,
//       text,
//       html: `<p>Bonjour,</p><p>${inviterName} vous a invité à rejoindre la boutique "<b>${storeName}</b>" en tant que <b>${roleName}</b> sur la plateforme Alimana.</p><p>Pour accepter l'invitation et créer votre compte (ou vous connecter si vous en avez déjà un), veuillez cliquer sur le lien suivant :</p><p><a href="${invitationLink}">${invitationLink}</a></p><p>Ce lien expirera le ${new Date(Date.now() + this.configService.invitationTokenExpirationMs).toLocaleString()}.</p><p>Si vous n'avez pas demandé cette invitation, veuillez ignorer cet e-mail.</p><p>Cordialement,<br/>L'équipe Alimana</p>`,
//     });
//     */

//     this.logger.log(
//       `Email d'invitation envoyé à ${to} pour la boutique ${storeName}. Lien: ${invitationLink}`,
//       'EmailService',
//     );
//   }
// }

import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { MyLoggerService } from 'src/my-logger/my-logger.service';
import { AppConfigService } from 'src/config/config.service';
import { Resend } from 'resend'; // Importez le SDK Resend

@Injectable()
export class EmailService {
  private resend: Resend; // Déclarez une instance de Resend

  constructor(
    private readonly logger: MyLoggerService,
    private readonly configService: AppConfigService,
  ) {
    // Initialisez Resend avec votre clé API au démarrage du service
    const resendApiKey = this.configService.resendApiKey;
    if (!resendApiKey) {
      this.logger.error("RESEND_API_KEY n'est pas défini dans la configuration.", 'EmailService');
      throw new InternalServerErrorException("Configuration du service d'email manquante.");
    }
    this.resend = new Resend(resendApiKey); // Créez une nouvelle instance de Resend
    this.logger.log('Resend initialisé avec succès.', 'EmailService');
  }

  /**
   * Envoie un email d'invitation via SendGrid.
   * @param to L'adresse e-mail du destinataire.
   * @param invitationLink Le lien d'invitation unique.
   * @param inviterName Le nom de la personne qui invite.
   * @param storeName Le nom de la boutique.
   * @param roleName Le nom du rôle attribué.
   */
  async sendInvitationEmail(
    to: string,
    invitationLink: string,
    inviterName: string,
    storeName: string,
    roleName: string,
  ): Promise<void> {
    const subject = `Invitation à rejoindre la boutique ${storeName} sur Alimana`;
    const senderEmail = this.configService.resendSenderEmail; // L'adresse e-mail de l'expéditeur configurée dans Resend
    console.log('Email destinataire :', to); // doit afficher une adresse email

    if (!senderEmail) {
      this.logger.error(
        "resend EMAIL n'est pas défini dans la configuration.",

        'EmailService',
      );
      throw new InternalServerErrorException("Adresse e-mail de l'expéditeur manquante.");
    }

    const expirationDate = new Date(
      Date.now() + parseInt(process.env.INVITATION_TOKEN_EXPIRATION_MS || '86400000', 10),
    ).toLocaleString('fr-FR');

    const htmlContent = `
      <p>Bonjour,</p>
      <p>${inviterName} vous a invité à rejoindre la boutique "<b>${storeName}</b>" en tant que <b>${roleName}</b> sur la plateforme Alimana.</p>
      <p>Pour accepter l'invitation et créer votre compte (ou vous connecter si vous en avez déjà un), veuillez cliquer sur le lien suivant :</p>
      <p><a href="${invitationLink}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">Accepter l'invitation</a></p>
      <p>Ce lien expirera le ${expirationDate}.</p>
      <p>Si vous n'avez pas demandé cette invitation, veuillez ignorer cet e-mail.</p>
      <p>Cordialement,<br/>L'équipe Alimana</p>
    `;

    try {
      const { data, error } = await this.resend.emails.send({
        from: senderEmail, // Doit être une adresse e-mail vérifiée par Resend
        to: to,
        subject: subject,
        html: htmlContent,
        text: `Bonjour, ${inviterName} vous a invité à rejoindre la boutique "${storeName}" en tant que ${roleName} sur la plateforme Alimana. Pour accepter l'invitation, veuillez cliquer sur le lien : ${invitationLink}. Ce lien expirera le ${expirationDate}. Si vous n'avez pas demandé cette invitation, veuillez ignorer cet e-mail. Cordialement, L'équipe Alimana.`,
      });

      if (error) {
        const err = error as Error;
        this.logger.error(
          `Erreur Resend lors de l'envoi de l'email à ${to}: ${JSON.stringify(error, null, 2)}`,
          'EmailService',
        );
        this.logger.error(
          `Erreur Resend lors de l'envoi de l'email à ${to}: ${error.message}`,
          err.stack,
          'EmailService',
        );
        throw new InternalServerErrorException("Échec de l'envoi de l'email d'invitation.");
      }

      this.logger.log(
        `Email d'invitation envoyé à ${to} pour la boutique ${storeName}. ID Resend: ${data?.id}`,
        'EmailService',
      );
    } catch (error) {
      const err = error as Error;

      this.logger.error(
        `Échec de l'envoi de l'email d'invitation à ${to}: ${err.message}`,
        err.stack,
        'EmailService',
      );
      throw new InternalServerErrorException("Échec de l'envoi de l'email d'invitation.");
    }
  }
}
