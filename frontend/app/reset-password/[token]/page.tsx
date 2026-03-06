'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import { endpoints } from '@/lib/api-config';
import toast from 'react-hot-toast';

// Validation schema
const resetPasswordSchema = z.object({
    password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
});

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

// Password strength calculator
function calculatePasswordStrength(password: string) {
    let strength = 0;
    const checks = {
        hasMinLength: password.length >= 8,
        hasUpperCase: /[A-Z]/.test(password),
        hasNumber: /[0-9]/.test(password),
        hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };

    if (checks.hasMinLength) strength++;
    if (checks.hasUpperCase) strength++;
    if (checks.hasNumber) strength++;
    if (checks.hasSpecialChar) strength++;

    return { strength, checks };
}

export default function ResetPasswordPage() {
    const router = useRouter();
    const params = useParams();
    const token = params?.token as string;

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState({
        strength: 0, checks: {
            hasMinLength: false,
            hasUpperCase: false,
            hasNumber: false,
            hasSpecialChar: false,
        }
    });

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm<ResetPasswordFormData>({
        resolver: zodResolver(resetPasswordSchema),
    });

    const password = watch('password', '');

    useEffect(() => {
        if (password) {
            setPasswordStrength(calculatePasswordStrength(password));
        }
    }, [password]);

    const onSubmit = async (data: ResetPasswordFormData) => {
        setIsLoading(true);

        try {
            const response = await apiClient.post(endpoints.auth.resetPassword, {
                token,
                newPassword: data.password,
            });

            if (response.data.success) {
                toast.success('Mot de passe réinitialisé avec succès !');
                setTimeout(() => {
                    router.push('/login');
                }, 1500);
            }
        } catch (error: any) {
            console.error('Reset password error:', error);
            const errorMessage = error.response?.data?.error?.message || 'Erreur lors de la réinitialisation du mot de passe.';
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const strengthLabels = ['Minimal', 'Sécurisé', 'Robuste', 'Inviolable'];
    const strengthColors = ['bg-red-500/50', 'bg-orange-500/50', 'bg-gold/50', 'bg-gold-light'];

    return (
        <div className="min-h-screen flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-apple-bgLight dark:bg-black transition-colors duration-500">
            {/* Ambient Background Glows */}
            <div className="ambient-glow top-[-10%] left-[-10%] w-[600px] h-[600px] bg-gray-400 dark:bg-gray-800" />
            <div className="ambient-glow bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-gray-300 dark:bg-gray-900" />

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
                    Héritage Numérique • Réinitialisation
                </p>
            </div>

            {/* Main Card - TITANIUM GLASS FLOW */}
            <div className="sm:mx-auto sm:w-full sm:max-w-[500px] relative z-10">
                <div className="klik-glass klik-glass-hover py-12 px-10 sm:px-14 rounded-[32px]">
                    <div className="text-center mb-10">
                        <h1 className="text-2xl font-bold text-apple-textDark dark:text-white tracking-tight">Nouveau Code Scellé</h1>
                        <p className="text-apple-secondary text-sm mt-3 font-medium">Renforcez la sécurité de votre accès prestige</p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-7">
                        {/* New Password Field */}
                        <div className="space-y-3">
                            <label htmlFor="password" className="block text-[11px] font-bold uppercase tracking-[0.15em] text-apple-secondary ml-1">
                                Nouveau Code Secret
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <span className="material-symbols-outlined text-apple-secondary group-focus-within:text-spaceGray dark:group-focus-within:text-titanium transition-colors text-[20px] font-light" translate="no">lock_open</span>
                                </div>
                                <input
                                    {...register('password')}
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    className={`block w-full pl-12 pr-12 py-4 bg-white/40 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-2xl text-apple-textDark dark:text-apple-bgLight placeholder:text-gray-400 focus:bg-white/60 dark:focus:bg-black/40 focus:border-spaceGray dark:focus:border-titanium focus:ring-1 focus:ring-spaceGray/20 dark:focus:ring-titanium/20 outline-none transition-all duration-300 sm:text-sm ${errors.password ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20' : ''
                                        }`}
                                    placeholder="••••••••••••"
                                />
                                <button
                                    type="button"
                                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-apple-secondary hover:text-apple-textDark dark:hover:text-white transition-colors focus:outline-none"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    <span className="material-symbols-outlined text-[20px] font-light" translate="no">
                                        {showPassword ? 'visibility_off' : 'visibility'}
                                    </span>
                                </button>
                            </div>
                            {errors.password && (
                                <p className="mt-1.5 text-[11px] font-semibold text-red-500 ml-1">{errors.password.message}</p>
                            )}
                        </div>

                        {/* Password Strength Meter */}
                        {password && (
                            <div className="space-y-4 pt-1 px-1 animate-in fade-in slide-in-from-top-2 duration-500">
                                <div className="flex gap-2 h-1 w-full">
                                    {[0, 1, 2, 3].map((index) => (
                                        <div
                                            key={index}
                                            className={`h-full flex-1 rounded-full ${index < passwordStrength.strength ? strengthColors[passwordStrength.strength - 1] : 'bg-gray-200 dark:bg-white/10'} transition-all duration-700`}
                                        />
                                    ))}
                                </div>
                                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.1em]">
                                    <span className="text-apple-secondary">Niveau de sécurité</span>
                                    <span className={`${passwordStrength.strength > 2 ? 'text-green-500' : 'text-apple-secondary'} transition-colors duration-500`}>
                                        {passwordStrength.strength > 0 ? strengthLabels[passwordStrength.strength - 1] : 'Saisie en cours...'}
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Confirm Password Field */}
                        <div className="space-y-3">
                            <label htmlFor="confirmPassword" className="block text-[11px] font-bold uppercase tracking-[0.15em] text-apple-secondary ml-1">
                                Confirmation du Code
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <span className="material-symbols-outlined text-apple-secondary group-focus-within:text-spaceGray dark:group-focus-within:text-titanium transition-colors text-[20px] font-light" translate="no">verified_user</span>
                                </div>
                                <input
                                    {...register('confirmPassword')}
                                    id="confirmPassword"
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    className={`block w-full pl-12 pr-12 py-4 bg-white/40 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-2xl text-apple-textDark dark:text-apple-bgLight placeholder:text-gray-400 focus:bg-white/60 dark:focus:bg-black/40 focus:border-spaceGray dark:focus:border-titanium focus:ring-1 focus:ring-spaceGray/20 dark:focus:ring-titanium/20 outline-none transition-all duration-300 sm:text-sm ${errors.confirmPassword ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20' : ''
                                        }`}
                                    placeholder="••••••••••••"
                                />
                                <button
                                    type="button"
                                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-apple-secondary hover:text-apple-textDark dark:hover:text-white transition-colors focus:outline-none"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                >
                                    <span className="material-symbols-outlined text-[20px] font-light" translate="no">
                                        {showConfirmPassword ? 'visibility_off' : 'visibility'}
                                    </span>
                                </button>
                            </div>
                            {errors.confirmPassword && (
                                <p className="mt-1.5 text-[11px] font-semibold text-red-500 ml-1">{errors.confirmPassword.message}</p>
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
                                    <span className="tracking-wide">Scellage...</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 tracking-wide font-bold">
                                    <span>Valider le nouveau code</span>
                                    <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1.5 transition-transform font-light" translate="no">lock_reset</span>
                                </div>
                            )}
                        </button>
                    </form>

                    {/* Footer */}
                    <div className="mt-12 pt-8 border-t border-gray-200 dark:border-white/5 flex justify-center">
                        <Link href="/login" className="inline-flex items-center gap-3 group text-xs font-bold text-apple-secondary hover:text-apple-textDark dark:hover:text-white transition-colors uppercase tracking-[0.1em]">
                            <span className="material-symbols-outlined text-[18px] group-hover:-translate-x-1.5 transition-transform font-light" translate="no">arrow_back</span>
                            Annuler et revenir
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
