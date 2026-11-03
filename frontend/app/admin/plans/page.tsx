'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { apiClient } from '@/lib/api-client';
import { AdminButton } from '@/components/ui/AdminButton';
import toast from 'react-hot-toast';

interface Plan {
    id: string;
    name: string;
    slug: string;
    priceEur: string | number;
    priceMad: string | number;
    billingPeriod: string;
    maxLicenses: number;
    targetAudience?: 'B2B' | 'B2C';
    subscriberCount?: number;
    features: any;
    isActive: boolean;
    createdAt: string;
}

interface CompanySubItem {
    id: string;
    name: string;
    adminEmail: string;
    status: string;
    usersCount: number;
    subscription: {
        id: string;
        planId: string;
        planName: string;
        priceEur: number;
        maxLicenses: number;
        status: string;
        paymentMethod: string;
        currentPeriodEnd: string;
    } | null;
}

interface B2CUserItem {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    role: string;
    isPro: boolean;
    isActive: boolean;
    planId: string | null;
    planName: string;
    company: { id: string; name: string } | null;
}

const FEATURE_OPTIONS = [
    { key: 'lead_gen', label: 'CRM Prospect & Capture de Leads' },
    { key: 'analytics', label: 'Analytics Avancés & Statistiques' },
    { key: 'wallet_pass', label: 'Apple Wallet & Google Wallet' },
    { key: 'custom_branding', label: 'Personnalisation & Charte Graphique' },
    { key: 'api_access', label: 'Accès API & Webhooks CRM' },
    { key: 'priority_support', label: 'Support Prioritaire 24/7' },
];

export default function PlansPage() {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [companies, setCompanies] = useState<CompanySubItem[]>([]);
    const [b2cUsers, setB2cUsers] = useState<B2CUserItem[]>([]);
    const [stats, setStats] = useState({
        totalSubscribers: 0,
        b2bSubscribers: 0,
        b2cProSubscribers: 0,
        totalRevenueEur: '0.00',
        averageRevenueEur: '0.00'
    });
    const [isLoading, setIsLoading] = useState(true);

    // Navigation & Filters
    const [activeSection, setActiveSection] = useState<'plans' | 'b2b_subs' | 'b2c_subs'>('plans');
    const [audienceFilter, setAudienceFilter] = useState<'ALL' | 'B2B' | 'B2C'>('ALL');
    const [isFilterActive, setIsFilterActive] = useState(false);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPlan, setEditingPlan] = useState<Partial<Plan> | null>(null);

    const fetchPlans = async () => {
        setIsLoading(true);
        try {
            const response = await apiClient.get('/api/admin/plans');
            if (response.data.success) {
                setPlans(response.data.data.plans || []);
                setCompanies(response.data.data.companies || []);
                setB2cUsers(response.data.data.b2cUsers || []);
                setStats(response.data.data.stats || {
                    totalSubscribers: 0,
                    b2bSubscribers: 0,
                    b2cProSubscribers: 0,
                    totalRevenueEur: '0.00',
                    averageRevenueEur: '0.00'
                });
            }
        } catch (error) {
            console.error('Failed to fetch plans', error);
            toast.error('Impossible de charger les abonnements');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchPlans();
    }, []);

    const togglePlanStatus = async (id: string, currentStatus: boolean) => {
        try {
            const response = await apiClient.patch(`/api/admin/plans/${id}`, {
                isActive: !currentStatus
            });
            if (response.data.success) {
                toast.success(`Plan ${!currentStatus ? 'activé' : 'désactivé'} avec succès`);
                fetchPlans();
            }
        } catch (error) {
            toast.error('Erreur lors de la modification du statut');
        }
    };

    const deletePlan = async (id: string) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer ou désactiver ce plan ?')) return;
        try {
            const response = await apiClient.delete(`/api/admin/plans/${id}`);
            if (response.data.success) {
                toast.success(response.data.data?.message || 'Plan supprimé avec succès');
                fetchPlans();
            }
        } catch (error) {
            toast.error('Erreur lors de la suppression du plan');
        }
    };

    const openCreateModal = (defaultAudience: 'B2B' | 'B2C' = 'B2B') => {
        setEditingPlan({
            name: '',
            slug: '',
            priceEur: defaultAudience === 'B2C' ? '9.99' : '49.00',
            priceMad: defaultAudience === 'B2C' ? '99' : '490',
            billingPeriod: 'monthly',
            maxLicenses: defaultAudience === 'B2C' ? 1 : 25,
            targetAudience: defaultAudience,
            isActive: true,
            features: {
                targetAudience: defaultAudience,
                grantsPro: true,
                lead_gen: true,
                analytics: true,
                wallet_pass: true,
                custom_branding: defaultAudience === 'B2B',
                api_access: false,
                priority_support: false
            }
        });
        setIsModalOpen(true);
    };

    const openEditModal = (plan: Plan) => {
        const audience = plan.targetAudience || (plan.features?.targetAudience === 'B2C' || plan.maxLicenses === 1 ? 'B2C' : 'B2B');
        setEditingPlan({
            ...plan,
            targetAudience: audience,
            features: {
                ...(plan.features && typeof plan.features === 'object' ? plan.features : {}),
                targetAudience: audience,
                grantsPro: audience === 'B2C' ? (plan.features?.grantsPro ?? Number(plan.priceEur) > 0) : true
            }
        });
        setIsModalOpen(true);
    };

    const savePlan = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingPlan) return;
        try {
            const audience = editingPlan.targetAudience || editingPlan.features?.targetAudience || 'B2B';
            const payload = {
                ...editingPlan,
                targetAudience: audience,
                maxLicenses: audience === 'B2C' ? 1 : (Number(editingPlan.maxLicenses) || 10),
                features: {
                    ...(editingPlan.features || {}),
                    targetAudience: audience,
                    grantsPro: audience === 'B2C'
                        ? (editingPlan.features?.grantsPro ?? Number(editingPlan.priceEur) > 0)
                        : true
                }
            };
            if (editingPlan.id) {
                const response = await apiClient.patch(`/api/admin/plans/${editingPlan.id}`, payload);
                if (response.data.success) toast.success('Plan modifié avec succès');
            } else {
                const response = await apiClient.post('/api/admin/plans', payload);
                if (response.data.success) toast.success('Plan créé avec succès');
            }
            setIsModalOpen(false);
            setEditingPlan(null);
            fetchPlans();
        } catch (error) {
            toast.error('Erreur lors de l\'enregistrement du plan');
        }
    };

    const handleAssignCompanyPlan = async (companyId: string, planId: string) => {
        if (!planId) return;
        try {
            const res = await apiClient.post('/api/admin/plans/assign-company', {
                companyId,
                planId,
                status: 'active'
            });
            if (res.data.success) {
                toast.success('Abonnement Entreprise (B2B) mis à jour !');
                fetchPlans();
            }
        } catch (error) {
            toast.error('Erreur lors de l\'attribution du plan B2B');
        }
    };

    const handleAssignUserB2C = async (userId: string, planId: string) => {
        try {
            const res = await apiClient.post('/api/admin/plans/assign-user', {
                userId,
                planId
            });
            if (res.data.success) {
                toast.success('Abonnement Utilisateur (B2C) mis à jour !');
                fetchPlans();
            }
        } catch (error) {
            toast.error('Erreur lors de la mise à jour de l\'abonnement B2C');
        }
    };

    const handleToggleUserPro = async (user: B2CUserItem) => {
        try {
            const res = await apiClient.post('/api/admin/plans/assign-user', {
                userId: user.id,
                isPro: !user.isPro
            });
            if (res.data.success) {
                toast.success(`Statut PRO ${!user.isPro ? 'activé ⚡' : 'désactivé'} pour ${user.firstName || user.email}`);
                fetchPlans();
            }
        } catch (error) {
            toast.error('Erreur lors du changement de statut PRO');
        }
    };

    const b2bPlans = plans.filter(p => (p.targetAudience || 'B2B') === 'B2B');
    const b2cPlans = plans.filter(p => p.targetAudience === 'B2C');

    const filteredPlans = plans.filter(p => {
        if (isFilterActive && !p.isActive) return false;
        if (audienceFilter !== 'ALL' && p.targetAudience !== audienceFilter) return false;
        return true;
    });

    return (
        <AdminLayout>
            <div className="flex flex-col gap-10 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <nav className="flex items-center gap-2 text-[10px] font-bold text-apple-secondary uppercase tracking-[0.2em] mb-4">
                            <span className="opacity-40">Finance & Plans</span>
                            <span className="opacity-20">/</span>
                            <span className="text-apple-textDark dark:text-white">Gestion des Abonnements B2B & B2C</span>
                        </nav>
                        <h2 className="text-4xl font-bold text-apple-textDark dark:text-white tracking-tight">Abonnements B2B & B2C</h2>
                        <p className="text-apple-secondary mt-1 font-medium">
                            Configurez vos offres Entreprises (B2B) et Utilisateurs (B2C) et appliquez-les directement aux comptes.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <AdminButton
                            onClick={() => openCreateModal('B2C')}
                            variant="secondary"
                            className="px-6 py-3 rounded-full border border-slate-200 dark:border-white/10 flex items-center gap-2"
                        >
                            <span className="material-symbols-outlined text-[20px]">person_add</span>
                            + Plan B2C (Solo)
                        </AdminButton>
                        <AdminButton
                            onClick={() => openCreateModal('B2B')}
                            variant="primary"
                            className="px-8 py-3 rounded-full shadow-xl shadow-primary/20 flex items-center gap-2"
                        >
                            <span className="material-symbols-outlined text-[20px]">add_circle</span>
                            + Plan B2B (Entreprise)
                        </AdminButton>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="klik-glass p-7 rounded-[32px] border border-white/40 dark:border-white/5 shadow-sm transition-all hover:translate-y-[-2px] hover:shadow-xl">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-[11px] font-bold text-apple-secondary uppercase tracking-[0.2em] opacity-60">Offres Actives</span>
                            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                <span className="material-symbols-outlined text-2xl">check_circle</span>
                            </div>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-bold text-apple-textDark dark:text-white tracking-tight">{plans.filter(p => p.isActive).length}</span>
                            <span className="text-xs font-bold text-apple-secondary">({b2bPlans.length} B2B • {b2cPlans.length} B2C)</span>
                        </div>
                    </div>

                    <div className="klik-glass p-7 rounded-[32px] border border-white/40 dark:border-white/5 shadow-sm transition-all hover:translate-y-[-2px] hover:shadow-xl">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-[11px] font-bold text-apple-secondary uppercase tracking-[0.2em] opacity-60">Entreprises B2B</span>
                            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                                <span className="material-symbols-outlined text-2xl">domain</span>
                            </div>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-bold text-apple-textDark dark:text-white tracking-tight">{stats.b2bSubscribers}</span>
                            <span className="text-xs font-bold text-blue-500 uppercase tracking-widest">Abonnées</span>
                        </div>
                    </div>

                    <div className="klik-glass p-7 rounded-[32px] border border-white/40 dark:border-white/5 shadow-sm transition-all hover:translate-y-[-2px] hover:shadow-xl">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-[11px] font-bold text-apple-secondary uppercase tracking-[0.2em] opacity-60">Membres PRO B2C</span>
                            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                                <span className="material-symbols-outlined text-2xl">bolt</span>
                            </div>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-bold text-apple-textDark dark:text-white tracking-tight">{stats.b2cProSubscribers}</span>
                            <span className="text-xs font-bold text-amber-500 uppercase tracking-widest">Utilisateurs PRO</span>
                        </div>
                    </div>

                    <div className="klik-glass p-7 rounded-[32px] border border-white/40 dark:border-white/5 shadow-sm transition-all hover:translate-y-[-2px] hover:shadow-xl">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-[11px] font-bold text-apple-secondary uppercase tracking-[0.2em] opacity-60">MRR Estimé</span>
                            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary dark:text-white">
                                <span className="material-symbols-outlined text-2xl">payments</span>
                            </div>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-bold text-apple-textDark dark:text-white tracking-tight">{stats.totalRevenueEur}€</span>
                            <span className="text-xs font-bold text-apple-secondary uppercase tracking-widest">/ mois</span>
                        </div>
                    </div>
                </div>

                {/* Main Navigation Tabs */}
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200/40 dark:border-white/10 pb-4">
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setActiveSection('plans')}
                            className={`px-6 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2 cursor-pointer ${activeSection === 'plans'
                                ? 'bg-primary text-white shadow-lg'
                                : 'bg-white/60 dark:bg-white/5 text-apple-secondary hover:text-primary'
                                }`}
                        >
                            <span className="material-symbols-outlined text-[18px]">layers</span>
                            Catalogue des Plans ({plans.length})
                        </button>
                        <button
                            onClick={() => setActiveSection('b2b_subs')}
                            className={`px-6 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2 cursor-pointer ${activeSection === 'b2b_subs'
                                ? 'bg-primary text-white shadow-lg'
                                : 'bg-white/60 dark:bg-white/5 text-apple-secondary hover:text-primary'
                                }`}
                        >
                            <span className="material-symbols-outlined text-[18px]">apartment</span>
                            Abonnements Entreprises B2B ({companies.length})
                        </button>
                        <button
                            onClick={() => setActiveSection('b2c_subs')}
                            className={`px-6 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2 cursor-pointer ${activeSection === 'b2c_subs'
                                ? 'bg-primary text-white shadow-lg'
                                : 'bg-white/60 dark:bg-white/5 text-apple-secondary hover:text-primary'
                                }`}
                        >
                            <span className="material-symbols-outlined text-[18px]">person</span>
                            Abonnements Utilisateurs B2C ({b2cUsers.length})
                        </button>
                    </div>

                    {activeSection === 'plans' && (
                        <div className="flex items-center gap-2">
                            {(['ALL', 'B2B', 'B2C'] as const).map(aud => (
                                <button
                                    key={aud}
                                    onClick={() => setAudienceFilter(aud)}
                                    className={`px-4 py-2 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all cursor-pointer ${audienceFilter === aud
                                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                                        : 'bg-white/50 dark:bg-white/5 text-apple-secondary hover:text-primary'
                                        }`}
                                >
                                    {aud === 'ALL' ? 'Tous' : aud === 'B2B' ? 'B2B Entreprise' : 'B2C Utilisateur'}
                                </button>
                            ))}
                            <button
                                onClick={() => setIsFilterActive(!isFilterActive)}
                                className={`px-4 py-2 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all cursor-pointer border ${isFilterActive
                                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600'
                                    : 'border-transparent bg-white/50 dark:bg-white/5 text-apple-secondary'
                                    }`}
                            >
                                {isFilterActive ? 'Actifs seuls ✓' : 'Tous statuts'}
                            </button>
                        </div>
                    )}
                </div>

                {/* SECTION 1: CATALOGUE DES PLANS (B2B & B2C) */}
                {activeSection === 'plans' && (
                    <div className="klik-glass rounded-[32px] overflow-hidden shadow-2xl shadow-slate-200/50 dark:shadow-none border-white/40 dark:border-white/5">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-gray-200/40 dark:border-white/5 bg-white/30 dark:bg-white/5">
                                        <th className="px-8 py-6 text-[11px] font-bold text-apple-secondary uppercase tracking-[0.2em] opacity-60">Désignation du Plan</th>
                                        <th className="px-6 py-6 text-[11px] font-bold text-apple-secondary uppercase tracking-[0.2em] opacity-60">Cible</th>
                                        <th className="px-6 py-6 text-[11px] font-bold text-apple-secondary uppercase tracking-[0.2em] opacity-60 text-right">Prix (EUR / MAD)</th>
                                        <th className="px-6 py-6 text-[11px] font-bold text-apple-secondary uppercase tracking-[0.2em] opacity-60">Licences & Fonctionnalités</th>
                                        <th className="px-6 py-6 text-[11px] font-bold text-apple-secondary uppercase tracking-[0.2em] opacity-60 text-center">Abonnés</th>
                                        <th className="px-6 py-6 text-[11px] font-bold text-apple-secondary uppercase tracking-[0.2em] opacity-60 text-center">Statut</th>
                                        <th className="px-8 py-6 text-[11px] font-bold text-apple-secondary uppercase tracking-[0.2em] opacity-60 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100/10 dark:divide-white/5">
                                    {isLoading ? (
                                        <tr>
                                            <td colSpan={7} className="px-8 py-20 text-center">
                                                <div className="flex flex-col items-center gap-4">
                                                    <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                                                    <p className="text-apple-secondary font-medium animate-pulse">Chargement des offres...</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : filteredPlans.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="px-8 py-20 text-center text-apple-secondary font-medium">
                                                Aucun plan trouvé pour ce filtre.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredPlans.map((plan) => {
                                            const isB2C = plan.targetAudience === 'B2C';
                                            const feat = plan.features || {};
                                            const enabledFeatures = FEATURE_OPTIONS.filter(f => feat[f.key]);

                                            return (
                                                <tr key={plan.id} className={`hover:bg-white/40 dark:hover:bg-white/5 transition-all duration-300 group cursor-default ${!plan.isActive ? 'opacity-60 grayscale' : ''}`}>
                                                    <td className="px-8 py-5">
                                                        <div className="flex items-center gap-4">
                                                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white font-bold shadow-sm shrink-0 ${Number(plan.priceEur) === 0 ? 'bg-slate-400' : isB2C ? 'bg-amber-500' : 'btn-titanium-primary'}`}>
                                                                <span className="material-symbols-outlined text-[20px]">
                                                                    {Number(plan.priceEur) === 0 ? 'star_outline' : isB2C ? 'bolt' : 'rocket_launch'}
                                                                </span>
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="font-bold text-apple-textDark dark:text-white truncate tracking-tight">{plan.name}</p>
                                                                <p className="text-[11px] font-semibold text-apple-secondary opacity-60 uppercase tracking-wider">
                                                                    {plan.slug} • {plan.billingPeriod === 'monthly' ? 'Mensuel' : plan.billingPeriod === 'yearly' ? 'Annuel' : 'À vie'}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-5">
                                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${isB2C
                                                            ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                                                            : 'bg-blue-500/10 text-blue-600 border-blue-500/20'
                                                            }`}>
                                                            <span className="material-symbols-outlined text-[14px]">
                                                                {isB2C ? 'person' : 'domain'}
                                                            </span>
                                                            {isB2C ? 'B2C User' : 'B2B Entreprise'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-5 text-right">
                                                        <p className="text-sm font-bold text-apple-textDark dark:text-white font-mono">
                                                            {Number(plan.priceEur).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                                                        </p>
                                                        <p className="text-xs font-semibold text-apple-secondary font-mono">
                                                            {Number(plan.priceMad).toLocaleString('fr-FR')} MAD
                                                        </p>
                                                    </td>
                                                    <td className="px-6 py-5">
                                                        <div className="flex flex-col gap-1.5">
                                                            <span className="text-xs font-bold text-apple-textDark dark:text-white">
                                                                {isB2C ? '1 Compte Individuel' : `Jusqu'à ${plan.maxLicenses} licences équipe`}
                                                                {isB2C && feat.grantsPro && (
                                                                    <span className="ml-2 px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-600 text-[10px] font-black uppercase">
                                                                        Statut PRO ⚡
                                                                    </span>
                                                                )}
                                                            </span>
                                                            <div className="flex flex-wrap gap-1">
                                                                {enabledFeatures.length > 0 ? (
                                                                    enabledFeatures.map(f => (
                                                                        <span key={f.key} className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/10 text-[10px] font-semibold text-apple-secondary">
                                                                            {f.label.split(' ')[0]}
                                                                        </span>
                                                                    ))
                                                                ) : (
                                                                    <span className="text-[10px] text-apple-secondary opacity-60">Fonctionnalités de base</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-5 text-center">
                                                        <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-slate-100 dark:bg-white/10 text-xs font-bold text-apple-textDark dark:text-white">
                                                            {plan.subscriberCount || 0}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-5 text-center">
                                                        <div className={`flex items-center justify-center gap-1.5 ${plan.isActive ? 'text-emerald-500' : 'text-apple-secondary opacity-40'}`}>
                                                            <span className="material-symbols-outlined text-[18px]">
                                                                {plan.isActive ? 'check_circle' : 'pause_circle'}
                                                            </span>
                                                            <span className="text-[10px] font-bold uppercase tracking-widest">
                                                                {plan.isActive ? 'Actif' : 'Inactif'}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-5 text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <button
                                                                onClick={() => togglePlanStatus(plan.id, plan.isActive)}
                                                                className="w-9 h-9 rounded-xl bg-white dark:bg-white/10 border border-black/5 dark:border-white/10 flex items-center justify-center text-apple-secondary hover:text-primary transition-all shadow-sm cursor-pointer"
                                                                title={plan.isActive ? "Désactiver" : "Activer"}
                                                            >
                                                                <span className="material-symbols-outlined text-[18px]">
                                                                    {plan.isActive ? 'pause' : 'play_arrow'}
                                                                </span>
                                                            </button>
                                                            <button
                                                                onClick={() => openEditModal(plan)}
                                                                className="w-9 h-9 rounded-xl bg-white dark:bg-white/10 border border-black/5 dark:border-white/10 flex items-center justify-center text-apple-secondary hover:text-amber-500 transition-all shadow-sm cursor-pointer"
                                                                title="Modifier"
                                                            >
                                                                <span className="material-symbols-outlined text-[18px]">edit</span>
                                                            </button>
                                                            <button
                                                                onClick={() => deletePlan(plan.id)}
                                                                className="w-9 h-9 rounded-xl bg-white dark:bg-white/10 border border-black/5 dark:border-white/10 flex items-center justify-center text-apple-secondary hover:text-red-500 transition-all shadow-sm cursor-pointer"
                                                                title="Supprimer"
                                                            >
                                                                <span className="material-symbols-outlined text-[18px]">delete</span>
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* SECTION 2: ABONNEMENTS ENTREPRISES (B2B) */}
                {activeSection === 'b2b_subs' && (
                    <div className="klik-glass rounded-[32px] overflow-hidden shadow-2xl shadow-slate-200/50 dark:shadow-none border-white/40 dark:border-white/5">
                        <div className="p-8 border-b border-gray-100/10 dark:border-white/5 flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-bold text-apple-textDark dark:text-white">Attribution des Plans aux Entreprises (B2B)</h3>
                                <p className="text-xs text-apple-secondary mt-1">Changement immédiat visible dans l&apos;interface Manager (<code className="font-mono">/company/subscription</code>)</p>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-gray-200/40 dark:border-white/5 bg-white/30 dark:bg-white/5 text-[11px] font-bold text-apple-secondary uppercase tracking-[0.2em] opacity-60">
                                        <th className="px-8 py-5">Entreprise</th>
                                        <th className="px-6 py-5">Plan B2B Actuel</th>
                                        <th className="px-6 py-5">Licences Utilisées</th>
                                        <th className="px-6 py-5">Statut</th>
                                        <th className="px-8 py-5 text-right">Changer le Plan B2B</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100/10 dark:divide-white/5">
                                    {companies.map(comp => (
                                        <tr key={comp.id} className="hover:bg-white/40 dark:hover:bg-white/5 transition-all">
                                            <td className="px-8 py-5">
                                                <p className="font-bold text-sm text-apple-textDark dark:text-white">{comp.name}</p>
                                                <p className="text-xs text-apple-secondary">{comp.adminEmail}</p>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className="font-bold text-sm text-apple-textDark dark:text-white">
                                                    {comp.subscription?.planName || 'Aucun plan actif'}
                                                </span>
                                                {comp.subscription && (
                                                    <span className="block text-xs text-apple-secondary font-mono">
                                                        {comp.subscription.priceEur}€ / mois
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className="text-sm font-bold text-apple-textDark dark:text-white">
                                                    {comp.usersCount} / {comp.subscription?.maxLicenses || '∞'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${comp.subscription?.status === 'active'
                                                    ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                                                    : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                                                    }`}>
                                                    {comp.subscription?.status || 'Non abonné'}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <select
                                                    value={comp.subscription?.planId || ''}
                                                    onChange={(e) => handleAssignCompanyPlan(comp.id, e.target.value)}
                                                    className="px-4 py-2.5 rounded-xl bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 text-xs font-bold text-apple-textDark dark:text-white outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                                                >
                                                    <option value="" disabled>Choisir un plan B2B...</option>
                                                    {b2bPlans.map(p => (
                                                        <option key={p.id} value={p.id}>
                                                            {p.name} ({p.priceEur}€ - {p.maxLicenses} lic.)
                                                        </option>
                                                    ))}
                                                </select>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* SECTION 3: ABONNEMENTS UTILISATEURS (B2C) */}
                {activeSection === 'b2c_subs' && (
                    <div className="klik-glass rounded-[32px] overflow-hidden shadow-2xl shadow-slate-200/50 dark:shadow-none border-white/40 dark:border-white/5">
                        <div className="p-8 border-b border-gray-100/10 dark:border-white/5 flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-bold text-apple-textDark dark:text-white">Attribution des Plans aux Utilisateurs (B2C)</h3>
                                <p className="text-xs text-apple-secondary mt-1">Débloque immédiatement les fonctionnalités PRO (<code className="font-mono">/user/leads</code>, <code className="font-mono">/user/analytics</code>, <code className="font-mono">/user/settings</code>)</p>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-gray-200/40 dark:border-white/5 bg-white/30 dark:bg-white/5 text-[11px] font-bold text-apple-secondary uppercase tracking-[0.2em] opacity-60">
                                        <th className="px-8 py-5">Utilisateur</th>
                                        <th className="px-6 py-5">Type de Compte</th>
                                        <th className="px-6 py-5">Offre B2C Actuelle</th>
                                        <th className="px-6 py-5 text-center">Statut PRO</th>
                                        <th className="px-8 py-5 text-right">Appliquer un Plan B2C / Statut</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100/10 dark:divide-white/5">
                                    {b2cUsers.map(u => (
                                        <tr key={u.id} className="hover:bg-white/40 dark:hover:bg-white/5 transition-all">
                                            <td className="px-8 py-5">
                                                <p className="font-bold text-sm text-apple-textDark dark:text-white">
                                                    {u.firstName || u.lastName ? `${u.firstName || ''} ${u.lastName || ''}` : 'Utilisateur'}
                                                </p>
                                                <p className="text-xs text-apple-secondary">{u.email}</p>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className="text-xs font-bold text-apple-secondary uppercase tracking-wider">
                                                    {u.company ? `Employé (${u.company.name})` : 'B2C Individuel'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className="font-bold text-sm text-apple-textDark dark:text-white">
                                                    {u.planName}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5 text-center">
                                                <button
                                                    onClick={() => handleToggleUserPro(u)}
                                                    className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all cursor-pointer ${u.isPro
                                                        ? 'bg-amber-500/15 text-amber-600 border-amber-500/30'
                                                        : 'bg-slate-100 dark:bg-white/10 text-apple-secondary border-transparent'
                                                        }`}
                                                >
                                                    {u.isPro ? 'PRO ACTIF ⚡' : 'STANDARD (FREE)'}
                                                </button>
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <div className="flex items-center justify-end gap-3">
                                                    <select
                                                        value={u.planId || ''}
                                                        onChange={(e) => handleAssignUserB2C(u.id, e.target.value)}
                                                        className="px-4 py-2 rounded-xl bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 text-xs font-bold text-apple-textDark dark:text-white outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                                                    >
                                                        <option value="" disabled>Choisir une offre B2C...</option>
                                                        {b2cPlans.map(p => (
                                                            <option key={p.id} value={p.id}>
                                                                {p.name} ({Number(p.priceEur) === 0 ? 'Gratuit' : `${p.priceEur}€`})
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                <div className="text-center pb-10">
                    <p className="text-[10px] font-bold text-apple-secondary uppercase tracking-[0.2em] opacity-20">
                        © 2026 Kliknode SaaS Platform. Tous droits réservés.
                    </p>
                </div>
            </div>

            {/* Modal Créer / Modifier Plan (B2B ou B2C) */}
            {isModalOpen && editingPlan && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-[#1E293B] rounded-[32px] w-full max-w-2xl shadow-2xl overflow-hidden border border-white/40 dark:border-white/10 max-h-[92vh] flex flex-col">
                        <div className="p-8 border-b border-gray-100 dark:border-white/5 flex justify-between items-center bg-gray-50/50 dark:bg-white/5">
                            <div>
                                <h3 className="text-2xl font-bold text-apple-textDark dark:text-white tracking-tight">
                                    {editingPlan.id ? 'Modifier le Plan' : 'Créer un Nouveau Plan'}
                                </h3>
                                <p className="text-xs text-apple-secondary mt-1">Configurez une offre B2B (Entreprise) ou B2C (Utilisateur individuel)</p>
                            </div>
                            <button type="button" onClick={() => setIsModalOpen(false)} className="w-10 h-10 rounded-full hover:bg-gray-200 dark:hover:bg-white/10 flex items-center justify-center text-apple-secondary transition-all">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <form onSubmit={savePlan} className="p-8 overflow-y-auto space-y-6">
                            {/* Sélecteur B2B vs B2C */}
                            <div>
                                <label className="block text-xs font-bold text-apple-secondary uppercase tracking-widest mb-2">Type d&apos;Abonnement (Cible)</label>
                                <div className="grid grid-cols-2 gap-4">
                                    {([
                                        { id: 'B2B', label: 'B2B — Entreprise', desc: 'Multi-licences pour équipes (/company)' },
                                        { id: 'B2C', label: 'B2C — Utilisateur Solo', desc: 'Compte individuel & statut PRO (/user)' }
                                    ] as const).map(tab => {
                                        const isSelected = (editingPlan.targetAudience || 'B2B') === tab.id;
                                        return (
                                            <button
                                                key={tab.id}
                                                type="button"
                                                onClick={() => setEditingPlan({
                                                    ...editingPlan,
                                                    targetAudience: tab.id,
                                                    maxLicenses: tab.id === 'B2C' ? 1 : (editingPlan.maxLicenses === 1 ? 25 : editingPlan.maxLicenses || 25),
                                                    features: {
                                                        ...(editingPlan.features || {}),
                                                        targetAudience: tab.id
                                                    }
                                                })}
                                                className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${isSelected
                                                    ? 'border-primary bg-primary/5'
                                                    : 'border-gray-200 dark:border-white/10 hover:border-primary/40'
                                                    }`}
                                            >
                                                <p className="text-sm font-bold text-apple-textDark dark:text-white">{tab.label}</p>
                                                <p className="text-[11px] text-apple-secondary mt-0.5">{tab.desc}</p>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="col-span-2 md:col-span-1">
                                    <label className="block text-xs font-bold text-apple-secondary uppercase tracking-widest mb-2">Nom du plan</label>
                                    <input
                                        type="text"
                                        required
                                        value={editingPlan.name || ''}
                                        onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })}
                                        className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 transition-all text-apple-textDark dark:text-white font-bold"
                                        placeholder={editingPlan.targetAudience === 'B2C' ? 'ex: KlikNode PRO Solo' : 'ex: Business Team'}
                                    />
                                </div>
                                <div className="col-span-2 md:col-span-1">
                                    <label className="block text-xs font-bold text-apple-secondary uppercase tracking-widest mb-2">Identifiant (slug)</label>
                                    <input
                                        type="text"
                                        required
                                        value={editingPlan.slug || ''}
                                        onChange={(e) => setEditingPlan({ ...editingPlan, slug: e.target.value })}
                                        className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 transition-all font-mono text-apple-textDark dark:text-white"
                                        placeholder={editingPlan.targetAudience === 'B2C' ? 'ex: pro-b2c' : 'ex: business-team'}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-apple-secondary uppercase tracking-widest mb-2">Prix (EUR)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        required
                                        value={editingPlan.priceEur ?? ''}
                                        onChange={(e) => setEditingPlan({ ...editingPlan, priceEur: e.target.value })}
                                        className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 transition-all text-apple-textDark dark:text-white font-mono font-bold"
                                        placeholder="ex: 9.99"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-apple-secondary uppercase tracking-widest mb-2">Prix (MAD)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        required
                                        value={editingPlan.priceMad ?? ''}
                                        onChange={(e) => setEditingPlan({ ...editingPlan, priceMad: e.target.value })}
                                        className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 transition-all text-apple-textDark dark:text-white font-mono font-bold"
                                        placeholder="ex: 99"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-apple-secondary uppercase tracking-widest mb-2">Périodicité</label>
                                    <select
                                        value={editingPlan.billingPeriod || 'monthly'}
                                        onChange={(e) => setEditingPlan({ ...editingPlan, billingPeriod: e.target.value })}
                                        className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 transition-all text-apple-textDark dark:text-white"
                                    >
                                        <option value="monthly">Mensuel</option>
                                        <option value="yearly">Annuel</option>
                                        <option value="lifetime">À vie (Lifetime)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-apple-secondary uppercase tracking-widest mb-2">
                                        {editingPlan.targetAudience === 'B2C' ? 'Licences (B2C = 1 compte)' : 'Licences Max (Collaborateurs)'}
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        required
                                        disabled={editingPlan.targetAudience === 'B2C'}
                                        value={editingPlan.targetAudience === 'B2C' ? 1 : (editingPlan.maxLicenses || '')}
                                        onChange={(e) => setEditingPlan({ ...editingPlan, maxLicenses: parseInt(e.target.value) || 1 })}
                                        className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 transition-all text-apple-textDark dark:text-white font-mono disabled:opacity-50"
                                        placeholder="ex: 50"
                                    />
                                </div>
                            </div>

                            {/* Fonctionnalités incluses */}
                            <div className="space-y-3 pt-2">
                                <label className="block text-xs font-bold text-apple-secondary uppercase tracking-widest">
                                    Fonctionnalités débloquées par ce plan
                                </label>
                                {editingPlan.targetAudience === 'B2C' && (
                                    <label className="flex items-center justify-between p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 cursor-pointer">
                                        <div>
                                            <span className="text-sm font-bold text-apple-textDark dark:text-white">Active le statut Membre PRO B2C ⚡</span>
                                            <span className="block text-xs text-apple-secondary">Déverrouille ProFeatureGuard (Leads & Analytics) sur l&apos;interface /user</span>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={editingPlan.features?.grantsPro ?? true}
                                            onChange={(e) => setEditingPlan({
                                                ...editingPlan,
                                                features: { ...(editingPlan.features || {}), grantsPro: e.target.checked }
                                            })}
                                            className="w-5 h-5 rounded text-primary focus:ring-primary"
                                        />
                                    </label>
                                )}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {FEATURE_OPTIONS.map(opt => {
                                        const checked = Boolean(editingPlan.features?.[opt.key]);
                                        return (
                                            <label
                                                key={opt.key}
                                                className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${checked
                                                    ? 'border-primary/40 bg-primary/5 text-apple-textDark dark:text-white'
                                                    : 'border-gray-200 dark:border-white/10 text-apple-secondary'
                                                    }`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={checked}
                                                    onChange={(e) => setEditingPlan({
                                                        ...editingPlan,
                                                        features: {
                                                            ...(editingPlan.features || {}),
                                                            [opt.key]: e.target.checked
                                                        }
                                                    })}
                                                    className="w-4 h-4 rounded text-primary focus:ring-primary"
                                                />
                                                <span className="text-xs font-bold">{opt.label}</span>
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 dark:border-white/5">
                                <AdminButton type="button" variant="secondary" onClick={() => setIsModalOpen(false)} className="px-6 py-3 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm">Annuler</AdminButton>
                                <AdminButton type="submit" variant="primary" className="px-8 py-3 rounded-xl shadow-lg shadow-primary/30 font-bold uppercase tracking-widest text-xs">
                                    Enregistrer le Plan
                                </AdminButton>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}

