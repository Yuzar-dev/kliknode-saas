'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth-store';
import { createClient } from '@/utils/supabase/client';
import toast from 'react-hot-toast';

// Validation schema
const loginSchema = z.object({
    email: z.string().email('Email invalide'),
    password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
    rememberMe: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectUrl = searchParams?.get('redirect') || '/';

    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (data: LoginFormData) => {
        setIsLoading(true);

        try {
            const supabase = createClient();

            // 1. Authenticate with Supabase
            const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                email: data.email,
                password: data.password,
            });

            if (authError) throw authError;
            if (!authData.user) throw new Error("Erreur de connexion");

            // 2. Fetch profile to get role
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('role, first_name')
                .eq('id', authData.user.id)
                .single();

            if (profileError) throw profileError;

            const role = profile?.role || 'employee';

            // Show success message
            toast.success(`Bienvenue ${profile.first_name || data.email} !`);

            // 3. Redirect based on role
            if (role === 'super_admin') {
                router.push('/admin');
            } else if (role === 'company_admin') {
                router.push('/company');
            } else if (role === 'employee') {
                router.push('/user');
            } else if (role === 'operator') {
                router.push('/operator');
            } else {
                router.push(redirectUrl);
            }
        } catch (error: any) {
            console.error('Login error:', error);
            const errorMessage = error.message || 'Erreur de connexion. Veuillez réessayer.';
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
                    Héritage Numérique • Accès Privé
                </p>
            </div>

            {/* Main Card - TITANIUM GLASS FLOW */}
            <div className="sm:mx-auto sm:w-full sm:max-w-[480px] relative z-10">
                <div className="klik-glass klik-glass-hover py-12 px-10 sm:px-14 rounded-[32px]">
                    <div className="text-center mb-10">
                        <h1 className="text-2xl font-bold text-apple-textDark dark:text-white tracking-tight">Connexion</h1>
                        <p className="text-apple-secondary text-sm mt-3 font-medium">Identifiez-vous pour accéder à votre espace</p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                        {/* Email Field */}
                        <div className="space-y-3">
                            <label htmlFor="email" className="block text-[11px] font-bold uppercase tracking-[0.15em] text-apple-secondary ml-1">
                                Identité Numérique
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
                                    placeholder="nom@exemple.com"
                                />
                            </div>
                            {errors.email && (
                                <p className="mt-1.5 text-[11px] font-semibold text-red-500 ml-1 flex items-center gap-1.5 animate-in fade-in slide-in-from-left-1">
                                    <span className="material-symbols-outlined text-[14px]">error_outline</span>
                                    {errors.email.message}
                                </p>
                            )}
                        </div>

                        {/* Password Field */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between ml-1">
                                <label htmlFor="password" className="block text-[11px] font-bold uppercase tracking-[0.15em] text-apple-secondary">
                                    Code Secret
                                </label>
                                <Link href="/forgot-password" title="Mot de passe oublié" className="text-[11px] font-bold text-apple-secondary hover:text-apple-textDark dark:hover:text-white transition-colors tracking-wide">
                                    Oublié ?
                                </Link>
                            </div>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <span className="material-symbols-outlined text-apple-secondary group-focus-within:text-spaceGray dark:group-focus-within:text-titanium transition-colors text-[20px] font-light">lock</span>
                                </div>
                                <input
                                    {...register('password')}
                                    type={showPassword ? 'text' : 'password'}
                                    id="password"
                                    autoComplete="current-password"
                                    className={`block w-full pl-12 pr-12 py-4 bg-white/40 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-2xl text-apple-textDark dark:text-apple-bgLight placeholder:text-gray-400 focus:bg-white/60 dark:focus:bg-black/40 focus:border-spaceGray dark:focus:border-titanium focus:ring-1 focus:ring-spaceGray/20 dark:focus:ring-titanium/20 outline-none transition-all duration-300 sm:text-sm ${errors.password ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20' : ''
                                        }`}
                                    placeholder="••••••••••••"
                                />
                                <button
                                    type="button"
                                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-apple-secondary hover:text-apple-textDark dark:hover:text-white transition-colors"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    <span className="material-symbols-outlined text-[20px] font-light">
                                        {showPassword ? 'visibility_off' : 'visibility'}
                                    </span>
                                </button>
                            </div>
                            {errors.password && (
                                <p className="mt-1.5 text-[11px] font-semibold text-red-500 ml-1 flex items-center gap-1.5 animate-in fade-in slide-in-from-left-1">
                                    <span className="material-symbols-outlined text-[14px]">error_outline</span>
                                    {errors.password.message}
                                </p>
                            )}
                        </div>

                        {/* Remember Me */}
                        <div className="flex items-center ml-1">
                            <div className="relative flex items-center">
                                <input
                                    {...register('rememberMe')}
                                    id="remember-me"
                                    type="checkbox"
                                    className="h-4 w-4 rounded border-gray-300 dark:border-white/20 bg-white/50 dark:bg-black/50 text-spaceGray focus:ring-spaceGray/20 transition-all cursor-pointer"
                                />
                            </div>
                            <label htmlFor="remember-me" className="ml-3 block text-xs font-medium text-apple-secondary cursor-pointer hover:text-apple-textDark dark:hover:text-apple-bgLight transition-colors">
                                Rester connecté à cet appareil
                            </label>
                        </div>

                        {/* Submit Button - TITANIUM ROUNDED */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex justify-center items-center py-4 px-6 btn-titanium btn-titanium-primary"
                        >
                            {isLoading ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                    <span className="tracking-wide">Vérification...</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 tracking-wide font-bold">
                                    <span>Entrer dans l'espace</span>
                                    <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1.5 transition-transform font-light">arrow_forward</span>
                                </div>
                            )}
                        </button>
                    </form>

                    {/* Footer Auth */}
                    <div className="mt-12 text-center">
                        <p className="text-xs text-apple-secondary font-medium tracking-wide">
                            Pas encore membre de l'héritage ?{' '}
                            <Link href="/signup" className="text-apple-textDark dark:text-white font-bold hover:underline transition-all">
                                Rejoindre maintenant
                            </Link>
                        </p>
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

export default function LoginPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-apple-bgLight dark:bg-black"><div className="animate-spin h-8 w-8 border-4 border-spaceGray border-t-transparent rounded-full"></div></div>}>
            <LoginForm />
        </Suspense>
    );
}
