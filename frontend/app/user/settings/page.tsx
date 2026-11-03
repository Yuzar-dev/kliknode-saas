'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth-store';
import toast from 'react-hot-toast';

interface B2CPlan {
    id: string;
    name: string;
    slug: string;
    priceEur: number | string;
    priceMad: number | string;
    billingPeriod: string;
    features: any;
}

export default function SettingsPage() {
    const authUser = useAuthStore((s) => s.user);
    const updateUser = useAuthStore((s) => s.updateUser);

    const [profile, setProfile] = useState<{
        firstName: string;
        lastName: string;
        email: string;
        role: string;
        isPro: boolean;
    } | null>(null);
    const [b2cPlans, setB2cPlans] = useState<B2CPlan[]>([]);
    const [currentPlan, setCurrentPlan] = useState<B2CPlan | null>(null);
    const [isCompanyMember, setIsCompanyMember] = useState<boolean>(Boolean(authUser?.companyId));
    const [companyName, setCompanyName] = useState<string>(authUser?.companyName || '');
    const [companyAdminEmail, setCompanyAdminEmail] = useState<string>('');
    const [upgradeRequested, setUpgradeRequested] = useState<boolean>(false);
    const [loading, setLoading] = useState(true);
    const [subscribingId, setSubscribingId] = useState<string | null>(null);

    // Password change
    const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' });
    const [pwLoading, setPwLoading] = useState(false);

    useEffect(() => {
        loadProfileAndPlans();
    }, []);

    const loadProfileAndPlans = async () => {
        setLoading(true);
        try {
            const res = await apiClient.get('/api/user/plans');
            if (res.data.success) {
                const {
                    user,
                    plans,
                    currentPlan: activePlan,
                    isPro,
                    isCompanyMember: companyMember,
                    companyName: cName,
                    companyAdminEmail: cAdminEmail,
                    upgradeRequested: uReq,
                } = res.data.data;

                setIsCompanyMember(Boolean(companyMember || user?.companyId));
                setCompanyName(cName || user?.companyName || authUser?.companyName || '');
                setCompanyAdminEmail(cAdminEmail || '');
                setUpgradeRequested(Boolean(uReq));
                setB2cPlans(plans || []);
                setCurrentPlan(activePlan || null);
                setProfile({
                    firstName: user?.firstName || authUser?.firstName || '',
                    lastName: user?.lastName || authUser?.lastName || '',
                    email: user?.email || authUser?.email || '',
                    role: user?.role || authUser?.role || 'USER',
                    isPro: Boolean(isPro),
                });
                updateUser({
                    isPro: Boolean(isPro),
                    ...(user?.companyId !== undefined ? { companyId: user.companyId } : {}),
                    ...(cName ? { companyName: cName } : {}),
                });
            }
        } catch (err) {
            console.error(err);
            if (authUser) {
                setProfile({
                    firstName: authUser.firstName || '',
                    lastName: authUser.lastName || '',
                    email: authUser.email || '',
                    role: authUser.role || 'USER',
                    isPro: Boolean(authUser.isPro),
                });
            }
        } finally {
            setLoading(false);
        }
    };

    const handleRequestManagerUpgrade = async () => {
        setSubscribingId('manager-request');
        try {
            const res = await apiClient.post('/api/user/subscribe', { requestManagerApproval: true });
            if (res.data.success) {
                setUpgradeRequested(true);
                updateUser({ isPro: Boolean(res.data.data?.isPro) });
                toast.success(
                    res.data.data?.message || `Demande transmise au Manager (${companyAdminEmail || companyName})`,
                    { icon: '📩', duration: 5000 }
                );
            }
        } catch (err: any) {
            toast.error(err.response?.data?.error?.message || "Erreur lors de l'envoi de la demande");
        } finally {
            setSubscribingId(null);
        }
    };

    const handleSubscribeB2C = async (plan: B2CPlan) => {
        setSubscribingId(plan.id);
        try {
            const res = await apiClient.post('/api/user/subscribe', { planId: plan.id });
            if (res.data.success) {
                const data = res.data.data;
                if (data?.requiresManagerApproval) {
                    setUpgradeRequested(true);
                    toast.success(data.message || 'Demande envoyée au Manager.');
                    return;
                }
                if (data?.checkoutUrl) {
                    toast.loading('Redirection vers le paiement sécurisé Stripe...', { duration: 3000 });
                    window.location.href = data.checkoutUrl;
                    return;
                }
                if (data?.activated) {
                    const newIsPro = Boolean(data?.user?.isPro);
                    updateUser({ isPro: newIsPro });
                    setProfile(prev => prev ? { ...prev, isPro: newIsPro } : prev);
                    setCurrentPlan(plan);
                    toast.success(data?.message || `Offre ${plan.name} activée !`);
                }
            }
        } catch (err: any) {
            toast.error(err.response?.data?.error?.message || 'Paiement requis pour changer d\'offre');
        } finally {
            setSubscribingId(null);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (pwForm.newPw !== pwForm.confirm) return toast.error('Les mots de passe ne correspondent pas');
        if (pwForm.newPw.length < 6) return toast.error('Minimum 6 caractères');
        setPwLoading(true);
        try {
            const res = await apiClient.post('/api/user/change-password', {
                currentPassword: pwForm.current,
                newPassword: pwForm.newPw
            });
            if (res.data.success) {
                toast.success('Mot de passe mis à jour !');
                setPwForm({ current: '', newPw: '', confirm: '' });
            }
        } catch (err: any) {
            toast.error(err.response?.data?.error?.message || err.message || 'Erreur lors du changement de mot de passe');
        } finally {
            setPwLoading(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="animate-spin h-10 w-10 border-4 border-spaceGray dark:border-white border-t-transparent rounded-full" />
        </div>
    );

    return (
        <div className="pb-20 relative selection:bg-slate-200">
            <div className="max-w-3xl mx-auto relative z-10">
                <div className="mb-10">
                    <h1 className="text-4xl font-black text-apple-textDark dark:text-white tracking-tight">Réglages &amp; Abonnement</h1>
                    <p className="text-apple-secondary dark:text-gray-400 font-bold text-sm mt-2">Gérez votre offre B2C, votre sécurité et les paramètres de votre compte.</p>
                </div>

                {/* Section Abonnement (B2B Entreprise ou B2C Individuel) */}
                <div className="klik-glass p-6 sm:p-10 rounded-[2.5rem] border border-white/60 dark:border-white/5 shadow-lg mb-8 relative overflow-hidden">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                        <div>
                            <h3 className="text-xs font-black uppercase tracking-[0.25em] text-apple-secondary dark:text-gray-500">
                                {isCompanyMember ? 'Abonnement Entreprise (B2B)' : 'Mon Abonnement B2C'}
                            </h3>
                            <p className="text-2xl font-black text-apple-textDark dark:text-white mt-1">
                                {isCompanyMember
                                    ? `${companyName || 'Entreprise'} — Offre ${currentPlan?.name || 'Free'}`
                                    : (currentPlan?.name || (profile?.isPro ? 'KlikNode PRO' : 'Standard Gratuit'))}
                            </p>
                        </div>
                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border self-start sm:self-auto ${profile?.isPro
                            ? 'bg-amber-500/15 text-amber-600 border-amber-500/30'
                            : 'bg-slate-100 dark:bg-white/10 text-apple-secondary border-transparent'
                            }`}>
                            {profile?.isPro ? 'ACCÈS PRO ACTIF ⚡' : isCompanyMember ? `PLAN ENTREPRISE ${currentPlan?.name || 'FREE'}` : 'COMPTE STANDARD'}
                        </span>
                    </div>

                    {isCompanyMember ? (
                        <div className="p-6 rounded-3xl border border-gray-200/80 dark:border-white/10 bg-white/50 dark:bg-white/5 space-y-5">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                    <span className="material-symbols-outlined text-2xl" translate="no">domain</span>
                                </div>
                                <div>
                                    <h4 className="text-base font-black text-apple-textDark dark:text-white">
                                        Compte Collaborateur rattaché à {companyName || 'votre entreprise'}
                                    </h4>
                                    <p className="text-xs sm:text-sm font-medium text-apple-secondary dark:text-gray-400 mt-1 leading-relaxed">
                                        La facturation et les fonctionnalités PRO de votre carte dépendent exclusivement de l&apos;abonnement B2B souscrit par votre entreprise
                                        {companyAdminEmail ? ` (géré par ${companyAdminEmail})` : ''}. Vous ne pouvez pas activer d&apos;abonnement individuel sans la validation de votre Manager.
                                    </p>
                                </div>
                            </div>

                            {!profile?.isPro && (
                                <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-t border-gray-100 dark:border-white/5">
                                    <div className="text-xs font-bold text-apple-secondary">
                                        Besoin du CRM Prospects, des Analytics avancés ou du Pass Wallet ?
                                    </div>
                                    <button
                                        type="button"
                                        disabled={upgradeRequested || subscribingId === 'manager-request'}
                                        onClick={handleRequestManagerUpgrade}
                                        className={`px-6 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shrink-0 ${
                                            upgradeRequested
                                                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 cursor-default'
                                                : 'btn-obsidian btn-obsidian-primary text-white shadow-lg cursor-pointer hover:scale-[1.02]'
                                        }`}
                                    >
                                        {subscribingId === 'manager-request'
                                            ? 'Envoi en cours...'
                                            : upgradeRequested
                                                ? 'Demande envoyée au Manager ✓'
                                                : 'Demander l\'activation au Manager'}
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {b2cPlans.map((plan) => {
                                const isPaid = Number(plan.priceEur) > 0 || plan.features?.grantsPro === true;
                                const isCurrent = currentPlan?.id === plan.id || (profile?.isPro === isPaid && !currentPlan);

                                return (
                                    <div
                                        key={plan.id}
                                        className={`p-6 rounded-3xl border-2 flex flex-col justify-between transition-all ${isCurrent
                                            ? 'border-primary bg-primary/5'
                                            : 'border-gray-100 dark:border-white/10 bg-white/40 dark:bg-white/5'
                                            }`}
                                    >
                                        <div>
                                            <div className="flex items-center justify-between gap-2 mb-2">
                                                <h4 className="text-lg font-black text-apple-textDark dark:text-white">{plan.name}</h4>
                                                {isCurrent && (
                                                    <span className="px-2.5 py-0.5 rounded-full bg-primary text-white text-[9px] font-black uppercase tracking-widest">
                                                        Actuel
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-baseline gap-1.5 mb-4">
                                                <span className="text-3xl font-black text-apple-textDark dark:text-white">
                                                    {Number(plan.priceEur) === 0 ? 'Gratuit' : `${Number(plan.priceEur).toFixed(2)}€`}
                                                </span>
                                                {Number(plan.priceEur) > 0 && (
                                                    <span className="text-xs font-bold text-apple-secondary">
                                                        / {plan.billingPeriod === 'yearly' ? 'an' : 'mois'} ({plan.priceMad} MAD)
                                                    </span>
                                                )}
                                            </div>
                                            <ul className="space-y-2 mb-6 text-xs font-semibold text-apple-secondary">
                                                <li className="flex items-center gap-2">
                                                    <span className="material-symbols-outlined text-emerald-500 text-base">check_circle</span>
                                                    Profil digital NFC &amp; QR Code
                                                </li>
                                                {isPaid && (
                                                    <>
                                                        <li className="flex items-center gap-2 text-apple-textDark dark:text-white">
                                                            <span className="material-symbols-outlined text-amber-500 text-base">bolt</span>
                                                            CRM Prospect &amp; Capture de Leads
                                                        </li>
                                                        <li className="flex items-center gap-2 text-apple-textDark dark:text-white">
                                                            <span className="material-symbols-outlined text-amber-500 text-base">bolt</span>
                                                            Analytics avancés &amp; Apple Wallet
                                                        </li>
                                                    </>
                                                )}
                                            </ul>
                                        </div>
                                        <button
                                            type="button"
                                            disabled={isCurrent || subscribingId === plan.id}
                                            onClick={() => handleSubscribeB2C(plan)}
                                            className={`w-full py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${isCurrent
                                                ? 'bg-gray-100 dark:bg-white/10 text-apple-secondary cursor-default'
                                                : 'btn-obsidian btn-obsidian-primary text-white shadow-lg cursor-pointer hover:scale-[1.02]'
                                                }`}
                                        >
                                            {subscribingId === plan.id
                                                ? 'Traitement...'
                                                : isCurrent
                                                    ? 'Offre Active'
                                                    : isPaid
                                                        ? `Souscrire & Payer (${Number(plan.priceEur).toFixed(2)}€) ⚡`
                                                        : 'Revenir au plan Gratuit'}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Account info */}
                <div className="klik-glass p-10 rounded-[2.5rem] border border-white/60 dark:border-white/5 shadow-lg mb-8 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gray-100 dark:bg-white/5 blur-3xl opacity-30 -mr-16 -mt-16 group-hover:opacity-50 transition-all duration-700" />
                    <h3 className="text-xs font-black uppercase tracking-[0.25em] text-apple-secondary dark:text-gray-500 mb-8 px-1">Informations du compte</h3>

                    <div className="space-y-6">
                        <div className="flex justify-between items-center py-5 border-b border-gray-100 dark:border-white/5 px-4 rounded-2xl hover:bg-white/40 dark:hover:bg-white/5 transition-all">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-apple-secondary dark:text-gray-500 mb-1">Nom complet</p>
                                <p className="text-base font-black text-apple-textDark dark:text-white tracking-tight">{profile?.firstName} {profile?.lastName}</p>
                            </div>
                            <span className="material-symbols-outlined text-apple-secondary opacity-30" translate="no">person</span>
                        </div>
                        <div className="flex justify-between items-center py-5 border-b border-gray-100 dark:border-white/5 px-4 rounded-2xl hover:bg-white/40 dark:hover:bg-white/5 transition-all">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-apple-secondary dark:text-gray-500 mb-1">Email</p>
                                <p className="text-base font-black text-apple-textDark dark:text-white tracking-tight italic">{profile?.email}</p>
                            </div>
                            <span className="material-symbols-outlined text-apple-secondary opacity-30" translate="no">mail</span>
                        </div>
                        <div className="flex justify-between items-center py-5 px-4 rounded-2xl hover:bg-white/40 dark:hover:bg-white/5 transition-all">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-apple-secondary dark:text-gray-500 mb-1">Rôle</p>
                                <p className="text-base font-black text-apple-textDark dark:text-white tracking-tight capitalize">{profile?.role?.replace('_', ' ')}</p>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Actif</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Change password */}
                <div className="klik-glass p-10 rounded-[2.5rem] border border-white/60 dark:border-white/5 shadow-lg mb-8 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 dark:bg-blue-400/5 blur-3xl opacity-30 -mr-16 -mt-16 group-hover:opacity-50 transition-all duration-700" />
                    <h3 className="text-xs font-black uppercase tracking-[0.25em] text-apple-secondary dark:text-gray-500 mb-8 px-1">Sécurité</h3>
                    <p className="text-sm font-bold text-apple-secondary dark:text-gray-400 mb-10 px-1 leading-relaxed">Pour votre sécurité, utilisez un mot de passe fort d&apos;au moins 6 caractères mixant lettres et chiffres.</p>

                    <form onSubmit={handleChangePassword} className="space-y-8">
                        {[
                            { key: 'current', label: 'Mot de passe actuel', type: 'password', placeholder: '••••••••' },
                            { key: 'newPw', label: 'Nouveau mot de passe', type: 'password', placeholder: 'Minimum 6 caractères' },
                            { key: 'confirm', label: 'Confirmer le nouveau mot de passe', type: 'password', placeholder: '••••••••' },
                        ].map(f => (
                            <div key={f.key} className="space-y-3 group/input">
                                <label className="block text-[11px] font-black text-apple-secondary dark:text-gray-500 uppercase tracking-widest ml-1 group-focus-within/input:text-apple-textDark dark:group-focus-within/input:text-white transition-colors">{f.label}</label>
                                <input
                                    type={f.type}
                                    required
                                    value={(pwForm as any)[f.key]}
                                    onChange={e => setPwForm({ ...pwForm, [f.key]: e.target.value })}
                                    placeholder={f.placeholder}
                                    className={`w-full pr-12 rounded-[1.2rem] border bg-white/50 dark:bg-black/20 px-5 py-4 text-base text-apple-textDark dark:text-white focus:outline-none focus:ring-1 transition-all font-medium placeholder:text-gray-300 dark:placeholder:text-gray-600 ${f.key === 'confirm' && pwForm.confirm && pwForm.confirm !== pwForm.newPw
                                        ? 'border-red-300 dark:border-red-900/50 focus:ring-red-500/20'
                                        : 'border-gray-100 dark:border-white/5 focus:ring-apple-bgLight dark:focus:ring-white/10 focus:bg-white dark:focus:bg-black/40'
                                        }`}
                                />
                                {f.key === 'confirm' && pwForm.confirm && pwForm.confirm !== pwForm.newPw && (
                                    <p className="text-[10px] font-black text-red-500 uppercase tracking-widest ml-1">Les mots de passe ne correspondent pas</p>
                                )}
                            </div>
                        ))}

                        <button
                            type="submit"
                            disabled={pwLoading}
                            className="btn-obsidian btn-obsidian-primary w-full h-14 rounded-[1.2rem] shadow-xl active:scale-95 disabled:opacity-50 transition-all font-black text-base tracking-tight cursor-pointer"
                        >
                            {pwLoading ? 'Mise à jour...' : 'Mettre à jour le mot de passe'}
                        </button>
                    </form>
                </div>

                {/* Danger zone */}
                <div className="klik-glass p-10 rounded-[2.5rem] border border-red-500/10 dark:border-red-500/10 shadow-lg relative overflow-hidden group">
                    <h3 className="text-[11px] font-black uppercase tracking-[0.25em] text-red-500 mb-8 px-1">Zone critique</h3>
                    <p className="text-xs font-bold text-apple-secondary dark:text-gray-400 mb-10 px-1">Ces actions sont irréversibles et impactent directement votre service.</p>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-6 bg-red-500/5 dark:bg-red-500/5 rounded-3xl border border-red-500/10 group/item hover:bg-red-500/10 transition-all">
                            <div>
                                <p className="text-sm font-black text-apple-textDark dark:text-white tracking-tight">Déclarer ma carte perdue</p>
                                <p className="text-[10px] font-bold text-apple-secondary dark:text-gray-500 uppercase tracking-widest mt-1">Désactive la puce NFC physique</p>
                            </div>
                            <button
                                onClick={() => toast('Bientôt disponible', { icon: '🚨' })}
                                className="px-6 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-widest border border-red-200 dark:border-red-900/30 text-red-600 hover:bg-red-600 hover:text-white transition-all shadow-sm active:scale-95"
                            >
                                Déclarer perdue
                            </button>
                        </div>
                        <div className="flex items-center justify-between p-6 bg-red-500/5 dark:bg-red-500/5 rounded-3xl border border-red-500/10 group/item hover:bg-red-500/10 transition-all">
                            <div>
                                <p className="text-sm font-black text-apple-textDark dark:text-white tracking-tight">Supprimer mon compte</p>
                                <p className="text-[10px] font-bold text-apple-secondary dark:text-gray-500 uppercase tracking-widest mt-1">Suppression totale des données</p>
                            </div>
                            <button
                                onClick={() => toast('Contactez le support.', { icon: '🚨' })}
                                className="px-6 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-widest bg-red-600 text-white shadow-lg shadow-red-600/20 hover:scale-105 transition-all active:scale-95"
                            >
                                Supprimer
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

