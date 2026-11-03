'use client';

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { apiClient } from '@/lib/api-client';
import toast from 'react-hot-toast';
import { Sparkles, Check, Lock } from 'lucide-react';

interface ProFeatureGuardProps {
    children: React.ReactNode;
    title?: string;
    description?: string;
}

interface B2CPlan {
    id: string;
    name: string;
    slug: string;
    priceEur: number | string;
    priceMad: number | string;
    billingPeriod: string;
    features: any;
}

export default function ProFeatureGuard({
    children,
    title = "Débloquez les fonctionnalités PRO",
    description = "Prenez le contrôle total de vos contacts et analysez vos performances avec l'offre B2C PRO de KlikNode."
}: ProFeatureGuardProps) {
    const user = useAuthStore((state) => state.user);
    const updateUser = useAuthStore((state) => state.updateUser);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [proPlans, setProPlans] = useState<B2CPlan[]>([]);
    const [selectedPlanId, setSelectedPlanId] = useState<string>('');

    // Les ADMIN, MANAGER et abonnés PRO ont directement accès
    const hasAccess = user?.role === 'ADMIN' || user?.role === 'MANAGER' || user?.isPro === true;

    useEffect(() => {
        if (hasAccess) return;
        const loadB2CPlans = async () => {
            try {
                const res = await apiClient.get('/api/user/plans');
                if (res.data.success) {
                    if (res.data.data?.isPro) {
                        updateUser({ isPro: true });
                        return;
                    }
                    const allB2C: B2CPlan[] = res.data.data?.plans || [];
                    const paid = allB2C.filter(p => Number(p.priceEur) > 0 || p.features?.grantsPro === true);
                    setProPlans(paid);
                    if (paid.length > 0) {
                        setSelectedPlanId(paid[0].id);
                    }
                }
            } catch (err) {
                console.error('Failed to load B2C plans:', err);
            }
        };
        loadB2CPlans();
    }, [hasAccess, updateUser]);

    const handleSubscribePro = async () => {
        setIsSubmitting(true);
        try {
            const response = selectedPlanId
                ? await apiClient.post('/api/user/subscribe', { planId: selectedPlanId })
                : await apiClient.post('/api/user/upgrade-simulate', {});

            if (response.data.success) {
                updateUser({ isPro: true });
                toast.success(response.data.data?.message || "Félicitations ! Vous êtes maintenant membre PRO ⚡", {
                    icon: '🚀',
                    duration: 5000,
                    style: {
                        borderRadius: '16px',
                        background: '#0f172a',
                        color: '#fff',
                        fontWeight: 'bold',
                    }
                });
            }
        } catch (error: any) {
            console.error('Upgrade error:', error);
            toast.error("Erreur lors de la mise à niveau. Veuillez réessayer.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (hasAccess) {
        return <>{children}</>;
    }

    const activeSelectedPlan = proPlans.find(p => p.id === selectedPlanId) || proPlans[0];

    return (
        <div className="relative w-full rounded-[32px] overflow-hidden group/guard border border-gray-100/10 dark:border-white/5">
            {/* Contenu flouté et interactivité bloquée */}
            <div className="select-none pointer-events-none filter blur-xl opacity-30 saturate-50 transition-all duration-700">
                {children}
            </div>

            {/* Overlay Premium Klik-Glass */}
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-8 bg-white/10 dark:bg-black/20 backdrop-blur-md animate-in fade-in duration-500">
                <div className="w-full max-w-md p-8 rounded-[2.5rem] bg-white/80 dark:bg-slate-900/90 border border-white/50 dark:border-white/10 shadow-2xl flex flex-col items-center text-center relative overflow-hidden transform hover:scale-[1.01] transition-transform duration-500">
                    {/* Effets lumineux d'arrière-plan */}
                    <div className="absolute -top-16 -left-16 w-32 h-32 bg-primary/20 rounded-full blur-2xl"></div>
                    <div className="absolute -bottom-16 -right-16 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl"></div>

                    {/* Badge de verrouillage */}
                    <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-primary to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-primary/20 mb-5 border border-white/20 animate-pulse">
                        <Lock className="w-6 h-6" />
                    </div>

                    <h3 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-tight mb-2">
                        {title}
                    </h3>

                    <p className="text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed mb-5 max-w-xs">
                        {description}
                    </p>

                    {/* Sélection dynamique des plans B2C PRO configurés dans /admin/plans */}
                    {proPlans.length > 0 && (
                        <div className="w-full space-y-2 mb-5">
                            {proPlans.map(plan => (
                                <button
                                    key={plan.id}
                                    type="button"
                                    onClick={() => setSelectedPlanId(plan.id)}
                                    className={`w-full p-3.5 rounded-2xl border-2 flex items-center justify-between transition-all cursor-pointer ${selectedPlanId === plan.id
                                        ? 'border-primary bg-primary/5'
                                        : 'border-slate-200/80 dark:border-white/10 bg-white/50 dark:bg-white/5'
                                        }`}
                                >
                                    <div className="text-left">
                                        <p className="text-xs font-black text-slate-900 dark:text-white">{plan.name}</p>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                            {plan.billingPeriod === 'monthly' ? 'Mensuel' : plan.billingPeriod === 'yearly' ? 'Annuel' : 'À vie'}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-base font-black text-slate-900 dark:text-white">{Number(plan.priceEur).toFixed(2)}€</span>
                                        <span className="block text-[10px] font-bold text-slate-400">{plan.priceMad} MAD</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Liste des bénéfices PRO */}
                    <div className="w-full space-y-2.5 mb-6 text-left bg-slate-50/70 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/50">
                        <div className="flex items-center gap-3 text-xs font-semibold text-slate-700 dark:text-slate-300">
                            <div className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20">
                                <Check className="w-3 h-3" />
                            </div>
                            CRM Prospect intelligent (&quot;Échangeons nos contacts&quot;)
                        </div>
                        <div className="flex items-center gap-3 text-xs font-semibold text-slate-700 dark:text-slate-300">
                            <div className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20">
                                <Check className="w-3 h-3" />
                            </div>
                            Moteur d&apos;Analytics avancé (Clics &amp; Taux de conversion)
                        </div>
                        <div className="flex items-center gap-3 text-xs font-semibold text-slate-700 dark:text-slate-300">
                            <div className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20">
                                <Check className="w-3 h-3" />
                            </div>
                            Exportation Apple Wallet &amp; Google Wallet Premium
                        </div>
                    </div>

                    {/* Bouton Titanium CTA */}
                    <button
                        onClick={handleSubscribePro}
                        disabled={isSubmitting}
                        className="w-full h-14 rounded-2xl btn-titanium-primary flex items-center justify-center gap-3 text-xs font-black uppercase tracking-wider text-white shadow-xl shadow-primary/20 transition-all hover:scale-[1.03] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed group/btn cursor-pointer"
                    >
                        {isSubmitting ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <>
                                <Sparkles className="w-4 h-4 text-amber-300 group-hover/btn:rotate-12 transition-transform" />
                                {activeSelectedPlan
                                    ? `Activer ${activeSelectedPlan.name} (${Number(activeSelectedPlan.priceEur).toFixed(2)}€)`
                                    : 'Passer à la version PRO'}
                            </>
                        )}
                    </button>

                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-4">
                        Activation instantanée • Sans engagement
                    </p>
                </div>
            </div>
        </div>
    );
}

