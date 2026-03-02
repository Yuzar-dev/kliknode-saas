import sgMail from '@sendgrid/mail';
import logger from '../utils/logger.util';

// Initialisation de SendGrid
const apiKey = process.env.SENDGRID_API_KEY || '';
if (apiKey && apiKey !== 'SG.replace_with_your_api_key') {
    sgMail.setApiKey(apiKey);
} else {
    logger.warn('SendGrid API Key is missing or placeholders are used. Emails will not be sent.');
}

const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'noreply@vcard.io';
const FROM_NAME = process.env.SENDGRID_FROM_NAME || 'V-Card';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3001';

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
            from: {
                email: FROM_EMAIL,
                name: FROM_NAME,
            },
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
            if (!apiKey || apiKey === 'SG.replace_with_your_api_key') {
                logger.error(`Cannot send email to ${email}: SendGrid API Key is not configured.`);
                return false;
            }
            await sgMail.send(msg);
            logger.info(`Password reset email sent successfully to ${email}`);
            return true;
        } catch (error: any) {
            logger.error('Error sending password reset email:', error);
            if (error.response) {
                logger.error(JSON.stringify(error.response.body));
            }
            return false;
        }
    },
};
