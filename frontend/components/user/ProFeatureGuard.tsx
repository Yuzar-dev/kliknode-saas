'use client';

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { apiClient } from '@/lib/api-client';
import toast from 'react-hot-toast';
import { Sparkles, Check, Lock, Building2, Send } from 'lucide-react';

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
    description = "Prenez le contrôle total de vos contacts et analysez vos performances avec l'offre PRO de KlikNode."
}: ProFeatureGuardProps) {
    const user = useAuthStore((state) => state.user);
    const updateUser = useAuthStore((state) => state.updateUser);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [proPlans, setProPlans] = useState<B2CPlan[]>([]);
    const [selectedPlanId, setSelectedPlanId] = useState<string>('');
    const [isCompanyMember, setIsCompanyMember] = useState<boolean>(Boolean(user?.companyId));
    const [companyName, setCompanyName] = useState<string>(user?.companyName || '');
    const [companyAdminEmail, setCompanyAdminEmail] = useState<string>('');
    const [companyPlanName, setCompanyPlanName] = useState<string>('Free');
    const [upgradeRequested, setUpgradeRequested] = useState<boolean>(false);
    const [trialEligible, setTrialEligible] = useState<boolean>(true);
    const [pendingLeadsCount, setPendingLeadsCount] = useState<number>(0);
    const [submitError, setSubmitError] = useState<string>('');

    // Les ADMIN, MANAGER et abonnés PRO validés ont accès
    const hasAccess = user?.role === 'ADMIN' || user?.role === 'MANAGER' || user?.isPro === true;

    useEffect(() => {
        if (user?.role === 'ADMIN' || user?.role === 'MANAGER') return;
        const loadSubscriptionStatus = async () => {
            try {
                const res = await apiClient.get('/api/user/plans');
                if (res.data.success) {
                    const data = res.data.data;
                    const serverIsPro = Boolean(data?.isPro);
                    updateUser({
                        isPro: serverIsPro,
                        ...(data?.user?.companyId !== undefined ? { companyId: data.user.companyId } : {}),
                        ...(data?.companyName ? { companyName: data.companyName } : {}),
                    });

                    if (data?.isCompanyMember) {
                        setIsCompanyMember(true);
                        setCompanyName(data.companyName || user?.companyName || 'Votre entreprise');
                        setCompanyAdminEmail(data.companyAdminEmail || '');
                        setCompanyPlanName(data.companyPlan?.name || 'Free');
                        setUpgradeRequested(Boolean(data.upgradeRequested));
                        setTrialEligible(false);
                        return;
                    }

                    setIsCompanyMember(false);
                    setTrialEligible(data?.trialEligible !== undefined ? Boolean(data.trialEligible) : true);
                    setPendingLeadsCount(Number(data?.pendingLeadsCount || 0));
                    const allB2C: B2CPlan[] = data?.plans || [];
                    const paid = allB2C.filter(p => Number(p.priceEur) > 0 || p.features?.grantsPro === true);
                    setProPlans(paid);
                    if (paid.length > 0) {
                        setSelectedPlanId(paid[0].id);
                    }
                }
            } catch (err) {
                console.error('Failed to load subscription status:', err);
            }
        };
        loadSubscriptionStatus();
    }, [user?.role, user?.companyId, user?.companyName, updateUser]);

    const handleSubscribePro = async () => {
        setIsSubmitting(true);
        setSubmitError('');
        try {
            const response = await apiClient.post('/api/user/subscribe', {
                planId: selectedPlanId || undefined,
                requestManagerApproval: isCompanyMember,
            });

            if (response.data.success) {
                const data = response.data.data;

                // Cas 1 : Collaborateur d'entreprise -> Demande envoyée au Manager (ne débloque PAS sans validation du Manager)
                if (data?.requiresManagerApproval) {
                    setUpgradeRequested(true);
                    updateUser({ isPro: Boolean(data?.isPro) });
                    toast.success(
                        data.message || `Demande envoyée au Manager (${companyAdminEmail || companyName}).`,
                        {
                            icon: '📩',
                            duration: 5000,
                            style: {
                                borderRadius: '16px',
                                background: '#0f172a',
                                color: '#fff',
                                fontWeight: 'bold',
                            },
                        }
                    );
                    return;
                }

                // Cas 2 : Redirection vers Stripe Checkout pour paiement B2C
                if (data?.checkoutUrl) {
                    toast.loading('Redirection vers le paiement sécurisé Stripe...', { duration: 3000 });
                    window.location.href = data.checkoutUrl;
                    return;
                }

                // Cas 3 : Activation effective confirmée par le serveur (ex: essai gratuit 7 jours)
                if (data?.activated && data?.user?.isPro) {
                    updateUser({ isPro: true });
                    toast.success(data.message || "Félicitations ! Vos 7 jours d'essai PRO sont activés ⚡", {
                        icon: '🚀',
                        duration: 5000,
                    });
                }
            }
        } catch (error: any) {
            console.error('Upgrade error:', error);
            const msg = error.response?.data?.error?.message || "Paiement requis ou action non autorisée.";
            setSubmitError(msg);
            toast.error(msg, { duration: 5000 });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (hasAccess) {
        return <>{children}</>;
    }

    const activeSelectedPlan = proPlans.find(p => p.id === selectedPlanId) || proPlans[0];

    return (
        <div className="relative w-full rounded-[32px] overflow-hidden group/guard border border-gray-200/60 dark:border-white/10">
            {/* Contenu flouté coupé en arrière-plan et rendu inerte pour empêcher tout focus clavier fantôme */}
            <div
                {...({ inert: true } as any)}
                className="absolute inset-0 overflow-hidden select-none pointer-events-none filter blur-xl opacity-25 saturate-50"
            >
                {children}
            </div>

            {/* Overlay Premium Klik-Glass affiché immédiatement en haut de l'écran */}
            <div className="relative z-20 flex flex-col items-center justify-center py-5 sm:py-8 px-4 sm:px-8 bg-white/30 dark:bg-black/30 backdrop-blur-[12px] animate-in fade-in duration-300">
                <div className="w-full max-w-md p-6 sm:p-8 rounded-[2.5rem] bg-white/95 dark:bg-[#1C1C1E]/95 border border-white/80 dark:border-white/10 shadow-2xl flex flex-col items-center text-center relative overflow-hidden">
                    {/* Badge de verrouillage */}
                    <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-primary to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-primary/20 mb-3.5 border border-white/20">
                        {isCompanyMember ? <Building2 className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
                    </div>

                    {isCompanyMember ? (
                        <>
                            <span className="px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] font-black uppercase tracking-widest mb-3">
                                {companyName || 'Entreprise'} • Plan {companyPlanName}
                            </span>

                            <h3 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-tight mb-2">
                                Accès géré par votre entreprise
                            </h3>

                            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed mb-5">
                                Votre compte collaborateur est rattaché à l&apos;organisation <strong className="text-slate-900 dark:text-white">{companyName || 'votre entreprise'}</strong> (actuellement sous l&apos;abonnement <strong className="text-slate-900 dark:text-white">{companyPlanName}</strong>). Seul le Manager de votre entreprise{companyAdminEmail ? ` (${companyAdminEmail})` : ''} peut souscrire et activer l&apos;offre PRO.
                            </p>

                            <div className="w-full space-y-2.5 mb-5 text-left bg-slate-50/70 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/50">
                                <div className="flex items-center gap-3 text-xs font-semibold text-slate-700 dark:text-slate-300">
                                    <div className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20 shrink-0">
                                        <Check className="w-3 h-3" />
                                    </div>
                                    CRM Prospect intelligent (&quot;Échangeons nos contacts&quot;)
                                </div>
                                <div className="flex items-center gap-3 text-xs font-semibold text-slate-700 dark:text-slate-300">
                                    <div className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20 shrink-0">
                                        <Check className="w-3 h-3" />
                                    </div>
                                    Moteur d&apos;Analytics avancé (Clics &amp; Taux de conversion)
                                </div>
                                <div className="flex items-center gap-3 text-xs font-semibold text-slate-700 dark:text-slate-300">
                                    <div className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20 shrink-0">
                                        <Check className="w-3 h-3" />
                                    </div>
                                    Exportation Apple Wallet &amp; Google Wallet Premium
                                </div>
                            </div>

                            <button
                                onClick={handleSubscribePro}
                                disabled={isSubmitting || upgradeRequested}
                                className={`w-full h-13 rounded-full flex items-center justify-center gap-2.5 text-xs font-black uppercase tracking-wider transition-all px-4 ${
                                    upgradeRequested
                                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 cursor-default'
                                        : 'btn-titanium btn-titanium-primary text-white shadow-xl cursor-pointer'
                                }`}
                            >
                                {isSubmitting ? (
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : upgradeRequested ? (
                                    <>
                                        <Check className="w-4 h-4 shrink-0" />
                                        <span>Demande transmise au Manager</span>
                                    </>
                                ) : (
                                    <>
                                        <Send className="w-4 h-4 shrink-0" />
                                        <span>Demander l&apos;activation au Manager</span>
                                    </>
                                )}
                            </button>

                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-3.5">
                                Validation requise par l&apos;administrateur d&apos;entreprise
                            </p>
                        </>
                    ) : (
                        <>
                            {pendingLeadsCount > 0 && (
                                <div className="w-full mb-3 p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/25 text-indigo-700 dark:text-indigo-300 text-xs font-bold leading-snug">
                                    📩 Vous avez {pendingLeadsCount} contact{pendingLeadsCount > 1 ? 's' : ''} reçu{pendingLeadsCount > 1 ? 's' : ''} en attente !{' '}
                                    {trialEligible
                                        ? 'Activez vos 7 jours gratuits ci-dessous pour afficher leurs coordonnées.'
                                        : 'Activez votre offre PRO pour consulter leurs coordonnées.'}
                                </div>
                            )}

                            {trialEligible && (
                                <span className="px-3.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-[10px] font-black uppercase tracking-widest mb-2.5">
                                    🎁 1 Semaine d&apos;essai gratuit (7 jours)
                                </span>
                            )}

                            <h3 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-tight mb-2">
                                {title}
                            </h3>

                            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed mb-4 max-w-xs">
                                {description}
                            </p>

                            {proPlans.length > 0 && (
                                <div className="w-full space-y-2 mb-4">
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
                                                <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                                                    {trialEligible
                                                        ? `7 jours gratuits • puis ${Number(plan.priceEur).toFixed(2)}€/${plan.billingPeriod === 'yearly' ? 'an' : 'mois'}`
                                                        : (plan.billingPeriod === 'monthly' ? 'Mensuel' : plan.billingPeriod === 'yearly' ? 'Annuel' : 'À vie')}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                {trialEligible ? (
                                                    <>
                                                        <span className="text-base font-black text-emerald-600 dark:text-emerald-400">0,00€</span>
                                                        <span className="block text-[10px] font-bold text-slate-400">puis {Number(plan.priceEur).toFixed(2)}€ ({plan.priceMad} MAD)</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <span className="text-base font-black text-slate-900 dark:text-white">{Number(plan.priceEur).toFixed(2)}€</span>
                                                        <span className="block text-[10px] font-bold text-slate-400">{plan.priceMad} MAD</span>
                                                    </>
                                                )}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}

                            <div className="w-full space-y-2 mb-5 text-left bg-slate-50/70 dark:bg-slate-800/40 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800/50">
                                <div className="flex items-center gap-3 text-xs font-semibold text-slate-700 dark:text-slate-300">
                                    <div className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20 shrink-0">
                                        <Check className="w-3 h-3" />
                                    </div>
                                    CRM Prospect intelligent (&quot;Échangeons nos contacts&quot;)
                                </div>
                                <div className="flex items-center gap-3 text-xs font-semibold text-slate-700 dark:text-slate-300">
                                    <div className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20 shrink-0">
                                        <Check className="w-3 h-3" />
                                    </div>
                                    Moteur d&apos;Analytics avancé (Clics &amp; Taux de conversion)
                                </div>
                                <div className="flex items-center gap-3 text-xs font-semibold text-slate-700 dark:text-slate-300">
                                    <div className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20 shrink-0">
                                        <Check className="w-3 h-3" />
                                    </div>
                                    Exportation Apple Wallet &amp; Google Wallet Premium
                                </div>
                            </div>

                            {submitError && (
                                <div role="alert" className="w-full mb-3.5 p-3 rounded-2xl bg-red-500/10 border border-red-500/25 text-red-600 dark:text-red-400 text-xs font-bold">
                                    {submitError}
                                </div>
                            )}

                            <button
                                type="button"
                                onClick={handleSubscribePro}
                                disabled={isSubmitting}
                                className="w-full h-13 rounded-full btn-titanium btn-titanium-primary flex items-center justify-center gap-2.5 text-xs font-black uppercase tracking-wider text-white shadow-xl disabled:opacity-50 disabled:cursor-not-allowed group/btn cursor-pointer px-4"
                            >
                                {isSubmitting ? (
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <Sparkles className="w-4 h-4 text-amber-300 group-hover/btn:rotate-12 transition-transform shrink-0" />
                                        <span>
                                            {trialEligible
                                                ? 'Essayer 7 jours gratuitement'
                                                : activeSelectedPlan
                                                    ? `Souscrire & Payer (${Number(activeSelectedPlan.priceEur).toFixed(2)}€)`
                                                    : 'Souscrire à la version PRO'}
                                        </span>
                                    </>
                                )}
                            </button>

                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-3.5">
                                {trialEligible && activeSelectedPlan
                                    ? `0,00€ pendant 7 jours • Puis ${Number(activeSelectedPlan.priceEur).toFixed(2)}€/mois • Sans engagement`
                                    : 'Paiement sécurisé Stripe • Sans engagement'}
                            </p>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

