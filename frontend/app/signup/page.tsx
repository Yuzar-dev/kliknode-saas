'use client';

import { useState, Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '@/store/auth-store';
import { createClient } from '@/utils/supabase/client';
import toast from 'react-hot-toast';

// Validation schema
const signupSchema = z.object({
    firstName: z.string().min(2, 'Le prénom doit contenir au moins 2 caractères'),
    lastName: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
    email: z.string().email('Email invalide'),
    password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
});

type SignupFormData = z.infer<typeof signupSchema>;

function SignupContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const cardId = searchParams?.get('card_id');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Blocage de sécurité : 1 carte = 1 compte
    useEffect(() => {
        if (!cardId) {
            toast.error("Création de compte réservée aux titulaires d'une carte valide.");
            router.push('/login');
        }
    }, [cardId, router]);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<SignupFormData>({
        resolver: zodResolver(signupSchema),
    });

    const onSubmit = async (data: SignupFormData) => {
        setIsLoading(true);
        try {
            const supabase = createClient();
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: data.email,
                password: data.password,
                options: {
                    data: {
                        first_name: data.firstName,
                        last_name: data.lastName,
                        card_id: cardId,
                    }
                }
            });

            if (authError) throw authError;
            if (!authData.user) throw new Error("Erreur de création d'utilisateur");

            const userId = authData.user.id;
            if (cardId) {
                await supabase.from('cards').update({
                    status: 'ACTIVE',
                    assigned_user_id: userId
                }).eq('uid', cardId).eq('status', 'UNASSIGNED');
            }

            if (!authData.session) {
                toast.success("Compte créé ! Veuillez confirmer votre email.");
                router.push('/login');
            } else {
                toast.success(`Bienvenue ${data.firstName} !`);
                router.push('/user/card');
            }
        } catch (error: any) {
            toast.error(error.message || 'Erreur lors de la création du compte.');
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
                    Héritage Numérique • Nouveau Membre
                </p>
            </div>

            {/* Main Card */}
            <div className="sm:mx-auto sm:w-full sm:max-w-[540px] relative z-10">
                <div className="klik-glass klik-glass-hover py-12 px-10 sm:px-14 rounded-[32px]">
                    <div className="text-center mb-10">
                        <h1 className="text-2xl font-bold text-apple-textDark dark:text-white tracking-tight">Créer mon compte</h1>
                        <p className="text-apple-secondary text-sm mt-3 font-medium">Rejoignez l'élite digitale et gérez votre réseau</p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="space-y-2.5">
                                <label className="block text-[11px] font-bold uppercase tracking-[0.15em] text-apple-secondary ml-1">Prénom</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <span className="material-symbols-outlined text-apple-secondary group-focus-within:text-spaceGray dark:group-focus-within:text-titanium transition-colors text-[18px] font-light" translate="no">person</span>
                                    </div>
                                    <input {...register('firstName')} placeholder="Jean" className="block w-full pl-11 pr-4 py-3.5 bg-white/40 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-2xl text-apple-textDark dark:text-apple-bgLight outline-none transition-all duration-300 sm:text-sm" />
                                </div>
                                {errors.firstName && <p className="mt-1.5 text-[11px] font-semibold text-red-500 ml-1">{errors.firstName.message}</p>}
                            </div>
                            <div className="space-y-2.5">
                                <label className="block text-[11px] font-bold uppercase tracking-[0.15em] text-apple-secondary ml-1">Nom</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <span className="material-symbols-outlined text-apple-secondary group-focus-within:text-spaceGray dark:group-focus-within:text-titanium transition-colors text-[18px] font-light" translate="no">person</span>
                                    </div>
                                    <input {...register('lastName')} placeholder="Dupont" className="block w-full pl-11 pr-4 py-3.5 bg-white/40 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-2xl text-apple-textDark dark:text-apple-bgLight outline-none transition-all duration-300 sm:text-sm" />
                                </div>
                                {errors.lastName && <p className="mt-1.5 text-[11px] font-semibold text-red-500 ml-1">{errors.lastName.message}</p>}
                            </div>
                        </div>

                        <div className="space-y-2.5">
                            <label className="block text-[11px] font-bold uppercase tracking-[0.15em] text-apple-secondary ml-1">Identité Numérique (Email)</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <span className="material-symbols-outlined text-apple-secondary group-focus-within:text-spaceGray dark:group-focus-within:text-titanium transition-colors text-[18px] font-light" translate="no">mail</span>
                                </div>
                                <input {...register('email')} placeholder="nom@heritage.com" className="block w-full pl-11 pr-4 py-3.5 bg-white/40 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-2xl text-apple-textDark dark:text-apple-bgLight outline-none transition-all duration-300 sm:text-sm" />
                            </div>
                            {errors.email && <p className="mt-1.5 text-[11px] font-semibold text-red-500 ml-1">{errors.email.message}</p>}
                        </div>

                        <div className="space-y-2.5">
                            <label className="block text-[11px] font-bold uppercase tracking-[0.15em] text-apple-secondary ml-1">Code Secret (Mot de passe)</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <span className="material-symbols-outlined text-apple-secondary group-focus-within:text-spaceGray dark:group-focus-within:text-titanium transition-colors text-[18px] font-light" translate="no">lock</span>
                                </div>
                                <input {...register('password')} type={showPassword ? 'text' : 'password'} placeholder="••••••••••••" className="block w-full pl-11 pr-12 py-3.5 bg-white/40 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-2xl text-apple-textDark dark:text-apple-bgLight outline-none transition-all duration-300 sm:text-sm" />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-4 flex items-center text-apple-secondary hover:text-apple-textDark dark:hover:text-white transition-colors">
                                    <span className="material-symbols-outlined text-[20px] font-light" translate="no">{showPassword ? 'visibility_off' : 'visibility'}</span>
                                </button>
                            </div>
                            {errors.password && <p className="mt-1.5 text-[11px] font-semibold text-red-500 ml-1">{errors.password.message}</p>}
                        </div>

                        <button type="submit" disabled={isLoading} className="w-full py-4 px-6 btn-titanium btn-titanium-primary flex justify-center items-center shadow-2xl disabled:opacity-50 transition-all font-bold mt-8">
                            {isLoading ? 'Création...' : 'Créer mon compte'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default function SignUpPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-apple-bgLight dark:bg-black flex items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" /></div>}>
            <SignupContent />
        </Suspense>
    );
}
