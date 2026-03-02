'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import { endpoints } from '@/lib/api-config';
import toast from 'react-hot-toast';

// Validation schema
const forgotPasswordSchema = z.object({
    email: z.string().email('Email invalide'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [emailSent, setEmailSent] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
        getValues,
    } = useForm<ForgotPasswordFormData>({
        resolver: zodResolver(forgotPasswordSchema),
    });

    const onSubmit = async (data: ForgotPasswordFormData) => {
        setIsLoading(true);

        try {
            const response = await apiClient.post(endpoints.auth.forgotPassword, {
                email: data.email,
            });

            if (response.data.success) {
                setEmailSent(true);
                toast.success('Email de réinitialisation envoyé !');
            }
        } catch (error: any) {
            console.error('Forgot password error:', error);
            const errorMessage = error.response?.data?.error?.message || 'Erreur lors de l\'envoi de l\'email.';
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-apple-bgLight dark:bg-black transition-colors duration-500">
            {/* Brand / Logo Area */}
            <div className="sm:mx-auto sm:w-full sm:max-w-md mb-12 flex flex-col items-center relative z-10 transition-all duration-500">
                <div className="mb-6 flex items-center justify-center transform hover:scale-105 transition-transform duration-500">
                    <img src="/logo-icon-black.svg" alt="KlikNode" className="h-[48px] w-auto dark:hidden" />
                    <img src="/logo-icon-white.svg" alt="KlikNode" className="h-[48px] w-auto hidden dark:block" />
                </div>
                <h2 className="text-center text-5xl font-extrabold tracking-tighter text-[#1D1D1F] dark:text-white leading-none">
                    kliknode
                </h2>
                <p className="mt-8 text-center text-[12px] font-bold tracking-[0.45em] text-[#86868B] uppercase">
                    Héritage Numérique • Sécurité
                </p>
            </div>

            {/* Main Card - TITANIUM GLASS FLOW */}
            <div className="sm:mx-auto sm:w-full sm:max-w-[500px] relative z-10">
                <div className="klik-glass klik-glass-hover py-12 px-10 sm:px-14 rounded-[32px]">
                    {!emailSent ? (
                        <>
                            <div className="text-center mb-10">
                                <div className="mx-auto w-16 h-16 bg-gray-100 dark:bg-[#1C1C1E] rounded-2xl flex items-center justify-center mb-6 text-apple-textDark dark:text-white shadow-xl border border-gray-200 dark:border-white/10">
                                    <span className="material-symbols-outlined text-[32px] font-light">lock_reset</span>
                                </div>
                                <h1 className="text-2xl font-bold text-apple-textDark dark:text-white tracking-tight">Accès Oublié ?</h1>
                                <p className="text-apple-secondary text-sm mt-3 font-medium leading-relaxed">
                                    Indiquez votre adresse de membre pour recevoir une clé de réinitialisation temporaire.
                                </p>
                            </div>

                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                                {/* Email Field */}
                                <div className="space-y-3">
                                    <label htmlFor="email" className="block text-[11px] font-bold uppercase tracking-[0.15em] text-apple-secondary ml-1">
                                        Adresse de Membre
                                    </label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <span className="material-symbols-outlined text-apple-secondary group-focus-within:text-spaceGray dark:group-focus-within:text-titanium transition-colors text-[20px] font-light">mail</span>
                                        </div>
                                        <input
                                            {...register('email')}
                                            type="email"
                                            id="email"
                                            autoComplete="email"
                                            className={`block w-full pl-12 pr-4 py-4 bg-white/40 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-2xl text-apple-textDark dark:text-apple-bgLight placeholder:text-gray-400 focus:bg-white/60 dark:focus:bg-black/40 focus:border-spaceGray dark:focus:border-titanium focus:ring-1 focus:ring-spaceGray/20 dark:focus:ring-titanium/20 outline-none transition-all duration-300 sm:text-sm ${errors.email ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20' : ''
                                                }`}
                                            placeholder="nom@heritage.com"
                                        />
                                    </div>
                                    {errors.email && (
                                        <p className="mt-1.5 text-[11px] font-semibold text-red-500 ml-1 flex items-center gap-1.5 animate-in fade-in slide-in-from-left-1">
                                            <span className="material-symbols-outlined text-[14px]">error_outline</span>
                                            {errors.email.message}
                                        </p>
                                    )}
                                </div>

                                {/* Submit Button - TITANIUM ROUNDED */}
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full flex justify-center items-center py-4 px-6 btn-titanium btn-titanium-primary mt-10"
                                >
                                    {isLoading ? (
                                        <div className="flex items-center gap-2">
                                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                            <span className="tracking-wide">Demande...</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 tracking-wide font-bold">
                                            <span>Envoyer la clé</span>
                                            <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1.5 transition-transform font-light">send</span>
                                        </div>
                                    )}
                                </button>
                            </form>
                        </>
                    ) : (
                        <div className="text-center py-4 animate-in fade-in zoom-in duration-500">
                            <div className="mx-auto w-20 h-20 bg-green-50 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-8 text-green-500 dark:text-green-400 shadow-2xl border border-green-200 dark:border-green-500/20">
                                <span className="material-symbols-outlined text-[48px] font-light">check_circle</span>
                            </div>
                            <h2 className="text-2xl font-bold text-apple-textDark dark:text-white mb-4">Transmission Réussie</h2>
                            <p className="text-apple-secondary text-sm leading-relaxed mb-10 px-4 font-medium">
                                Une clé de réinitialisation a été envoyée à <br />
                                <strong className="text-apple-textDark dark:text-apple-bgLight font-bold">{getValues('email')}</strong>. <br />
                                <span className="mt-4 block text-[11px] uppercase tracking-wider text-apple-secondary/60">Vérifiez vos plis confidentiels (Spams)</span>
                            </p>

                            <button
                                onClick={() => setEmailSent(false)}
                                className="text-apple-textDark dark:text-white font-bold text-xs hover:underline"
                            >
                                Renvoyer une nouvelle clé
                            </button>
                        </div>
                    )}

                    {/* Back to Login */}
                    <div className="mt-12 pt-8 border-t border-gray-200 dark:border-white/5 flex justify-center">
                        <Link href="/login" className="inline-flex items-center gap-3 group text-xs font-bold text-apple-secondary hover:text-apple-textDark dark:hover:text-white transition-colors uppercase tracking-[0.1em]">
                            <span className="material-symbols-outlined text-[18px] group-hover:-translate-x-1.5 transition-transform font-light">arrow_back</span>
                            Retour à l'espace membre
                        </Link>
                    </div>
                </div>

                {/* Footer Links */}
                <div className="mt-10 flex items-center justify-center gap-8 text-[10px] font-bold text-apple-secondary uppercase tracking-[0.2em]">
                    <Link href="/legal/privacy" className="hover:text-apple-textDark dark:hover:text-white transition-colors">Privé</Link>
                    <div className="w-1.5 h-1.5 bg-gray-300 dark:bg-white/10 rounded-full" />
                    <Link href="/legal/cgu" className="hover:text-apple-textDark dark:hover:text-white transition-colors">Charte</Link>
                    <div className="w-1.5 h-1.5 bg-gray-300 dark:bg-white/10 rounded-full" />
                    <span className="text-apple-secondary/60">© 2026 Kliknode</span>
                </div>
            </div>
        </div>
    );
}
