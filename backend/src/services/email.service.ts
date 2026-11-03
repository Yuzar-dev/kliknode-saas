import nodemailer from 'nodemailer';
import logger from '../utils/logger.util';

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3001';
const EMAIL_FROM = process.env.EMAIL_FROM || '"Kliknode" <service@kliknode.com>';

// Configuration du transporteur SMTP (Hostinger)
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.hostinger.com',
    port: parseInt(process.env.SMTP_PORT || '465', 10),
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

// Vérifier la configuration au démarrage
if (!process.env.SMTP_PASS || process.env.SMTP_PASS === 'votre_mot_de_passe_ici') {
    logger.warn('SMTP password is not configured. Emails will not be sent.');
} else {
    transporter.verify((error) => {
        if (error) {
            logger.error('SMTP Connection error:', error);
        } else {
            logger.info('SMTP Server is ready to take our messages');
        }
    });
}

/**
 * Service pour la gestion des emails via SendGrid
 */
export const emailService = {
    /**
     * Envoie un email de réinitialisation de mot de passe
     */
    async sendPasswordResetEmail(email: string, token: string) {
        const resetLink = `${FRONTEND_URL}/reset-password/${token}`;

        const msg = {
            to: email,
            from: EMAIL_FROM,
            subject: 'Réinitialisation de votre mot de passe - Kliknode',
            html: `
                <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1e293b;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h2 style="color: #0666EB; margin: 0;">Kliknode</h2>
                    </div>
                    <div style="background-color: #ffffff; padding: 40px; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                        <h1 style="font-size: 24px; font-weight: 700; margin-bottom: 16px; color: #0f172a;">Réinitialisation de mot de passe</h1>
                        <p style="font-size: 16px; line-height: 24px; margin-bottom: 24px;">
                            Bonjour,<br><br>
                            Nous avons reçu une demande de réinitialisation de mot de passe pour votre compte Kliknode.
                        </p>
                        <div style="text-align: center; margin-bottom: 32px;">
                            <a href="${resetLink}" style="background-color: #0666EB; color: #ffffff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">
                                Réinitialiser mon mot de passe
                            </a>
                        </div>
                        <p style="font-size: 14px; color: #64748b; line-height: 20px;">
                            Ce lien expirera dans 1 heure. Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email en toute sécurité.
                        </p>
                    </div>
                    <div style="text-align: center; margin-top: 24px; font-size: 12px; color: #94a3b8;">
                        <p>© 2026 Kliknode. Tous droits réservés.</p>
                    </div>
                </div>
            `,
        };

        try {
            if (!process.env.SMTP_PASS || process.env.SMTP_PASS === 'votre_mot_de_passe_ici') {
                logger.error(`Cannot send email to ${email}: SMTP password is not configured.`);
                return false;
            }
            await transporter.sendMail(msg);
            logger.info(`Password reset email sent successfully to ${email}`);
            return true;
        } catch (error: any) {
            logger.error('Error sending password reset email:', error);
            return false;
        }
    },

    /**
     * Envoie un email d'invitation pour un nouveau compte Manager
     */
    async sendCompanyInvitationEmail(email: string, companyName: string, token: string) {
        const joinLink = `${FRONTEND_URL}/join/${token}`;

        const msg = {
            to: email,
            from: EMAIL_FROM,
            subject: `Bienvenue sur Kliknode - Configurez le compte de ${companyName}`,
            html: `
                <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1e293b;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h2 style="color: #0666EB; margin: 0;">Kliknode</h2>
                    </div>
                    <div style="background-color: #ffffff; padding: 40px; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                        <h1 style="font-size: 24px; font-weight: 700; margin-bottom: 16px; color: #0f172a;">Bienvenue !</h1>
                        <p style="font-size: 16px; line-height: 24px; margin-bottom: 24px;">
                            Bonjour,<br><br>
                            Votre espace d'entreprise pour <strong>${companyName}</strong> a été créé avec succès sur Kliknode.
                            Pour activer votre compte administrateur et définir votre mot de passe, veuillez cliquer sur le bouton ci-dessous :
                        </p>
                        <div style="text-align: center; margin-bottom: 32px;">
                            <a href="${joinLink}" style="background-color: #0666EB; color: #ffffff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">
                                Activer mon compte
                            </a>
                        </div>
                        <p style="font-size: 14px; color: #64748b; line-height: 20px;">
                            Ce lien expirera dans 7 jours. Si vous n'êtes pas au courant de cette création de compte, vous pouvez ignorer cet email.
                        </p>
                    </div>
                    <div style="text-align: center; margin-top: 24px; font-size: 12px; color: #94a3b8;">
                        <p>© 2026 Kliknode. Tous droits réservés.</p>
                    </div>
                </div>
            `,
        };

        try {
            if (!process.env.SMTP_PASS || process.env.SMTP_PASS === 'votre_mot_de_passe_ici') {
                logger.error(`Cannot send invitation email to ${email}: SMTP password is not configured.`);
                return false;
            }
            await transporter.sendMail(msg);
            logger.info(`Invitation email sent successfully to ${email}`);
            return true;
        } catch (error: any) {
            logger.error('Error sending invitation email:', error);
            return false;
        }
    },
};
