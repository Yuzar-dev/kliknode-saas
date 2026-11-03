import nodemailer from 'nodemailer';
import logger from '../utils/logger.util';

const EMAIL_FROM = process.env.EMAIL_FROM || '"Kliknode" <service@kliknode.com>';
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.hostinger.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '465', 10);
const SMTP_SECURE = process.env.SMTP_SECURE ? process.env.SMTP_SECURE === 'true' : SMTP_PORT === 465;
const SMTP_USER = process.env.SMTP_USER || 'service@kliknode.com';
const SMTP_PASS =
    process.env.SMTP_PASS && process.env.SMTP_PASS !== 'votre_mot_de_passe_ici'
        ? process.env.SMTP_PASS
        : 'Nc3:pU7q:';

export const resolveFrontendUrl = (originOrHost?: string): string => {
    if (originOrHost && !originOrHost.includes('localhost') && !originOrHost.includes('127.0.0.1')) {
        return originOrHost.startsWith('http') ? originOrHost.replace(/\/$/, '') : `https://${originOrHost.replace(/\/$/, '')}`;
    }
    if (
        process.env.FRONTEND_URL &&
        !process.env.FRONTEND_URL.includes('localhost') &&
        !process.env.FRONTEND_URL.includes('127.0.0.1')
    ) {
        return process.env.FRONTEND_URL.replace(/\/$/, '');
    }
    if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
        return 'https://app.kliknode.com';
    }
    return process.env.FRONTEND_URL || 'http://localhost:3001';
};

// Configuration du transporteur SMTP (Hostinger)
const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_SECURE,
    auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
    },
});

/**
 * Service pour la gestion des emails Transactionnels (Hostinger SMTP)
 */
export const emailService = {
    /**
     * Envoie un email de réinitialisation de mot de passe
     */
    async sendPasswordResetEmail(email: string, token: string, baseUrl?: string) {
        const frontendUrl = resolveFrontendUrl(baseUrl);
        const resetLink = `${frontendUrl}/reset-password/${token}`;

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
    async sendCompanyInvitationEmail(email: string, companyName: string, token: string, baseUrl?: string) {
        const frontendUrl = resolveFrontendUrl(baseUrl);
        const joinLink = `${frontendUrl}/join/${token}`;

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
                        <p style="font-size: 13px; color: #64748b; line-height: 20px; word-break: break-all;">
                            Lien direct : <a href="${joinLink}" style="color: #0666EB;">${joinLink}</a>
                        </p>
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
            await transporter.sendMail(msg);
            logger.info(`Invitation email sent successfully to ${email}`);
            return true;
        } catch (error: any) {
            logger.error('Error sending invitation email:', error);
            return false;
        }
    },
};
