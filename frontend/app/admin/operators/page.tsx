'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/admin/AdminLayout';
import { apiClient } from '@/lib/api-client';
import { AdminButton } from '@/components/ui/AdminButton';
import toast from 'react-hot-toast';

interface Operator {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    isActive: boolean;
    warehouse: string | null;
    lastLoginAt: string | null;
    createdAt: string;
}

interface OperatorStats {
    total: number;
    activeWarehouses: number;
    logins24h: number;
}

export default function OperatorManagementPage() {
    const router = useRouter();
    const [operators, setOperators] = useState<Operator[]>([]);
    const [stats, setStats] = useState<OperatorStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Create Form State
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        warehouse: 'paris'
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [opsResponse, statsResponse] = await Promise.all([
                apiClient.get('/api/admin/operators'),
                apiClient.get('/api/admin/operators/stats')
            ]);

            if (opsResponse.data.success) {
                setOperators(opsResponse.data.data);
            }
            if (statsResponse.data.success) {
                setStats(statsResponse.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch operators data', error);
            toast.error('Impossible de charger les données des opérateurs');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleCreateOperator = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const response = await apiClient.post('/api/admin/operators', formData);
            if (response.data.success) {
                toast.success('Compte opérateur créé avec succès');
                setIsModalOpen(false);
                setFormData({ email: '', password: '', firstName: '', lastName: '', warehouse: 'paris' });
                fetchData();
            }
        } catch (error: any) {
            toast.error(error.response?.data?.error?.message || 'Erreur lors de la création');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleToggleStatus = async (id: string, currentStatus: boolean) => {
        const action = currentStatus ? 'révoquer' : 'réactiver';
        if (!confirm(`Êtes-vous sûr de vouloir ${action} cet accès ?`)) return;

        try {
            const response = await apiClient.patch(`/api/admin/operators/${id}/revoke`, { isActive: !currentStatus });
            if (response.data.success) {
                toast.success(`Accès ${currentStatus ? 'révoqué' : 'réactivé'} avec succès`);
                fetchData();
            }
        } catch (error) {
            toast.error('Erreur lors de la modification des accès');
        }
    };

    const filteredOperators = operators.filter(op =>
        op.email.toLowerCase().includes(search.toLowerCase()) ||
        (op.firstName?.toLowerCase() || '').includes(search.toLowerCase()) ||
        (op.lastName?.toLowerCase() || '').includes(search.toLowerCase())
    );

    return (
        <AdminLayout>
            <div className="flex flex-col gap-10 animate-in fade-in slide-in-from-bottom-4 duration-1000 pb-20">
                {/* Hero Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <nav className="flex items-center gap-2 text-[10px] font-bold text-apple-secondary uppercase tracking-[0.2em] mb-4">
                            <span className="opacity-40">Système & Sécurité</span>
                            <span className="opacity-20">/</span>
                            <span className="text-apple-textDark dark:text-white">Gestion Opérateurs</span>
                        </nav>
                        <h2 className="text-4xl font-bold text-apple-textDark dark:text-white tracking-tight">Gestion des Opérateurs</h2>
                        <p className="text-apple-secondary mt-1 font-medium">Supervisez les accès système et les comptes logistiques.</p>
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="btn-titanium btn-titanium-primary text-white px-8 h-14 rounded-full font-bold text-sm flex items-center gap-3 shadow-xl shadow-slate-900/20 hover:translate-y-[-2px] transition-all active:scale-95 group"
                    >
                        <span className="material-symbols-outlined group-hover:rotate-90 transition-transform">add</span>
                        Créer compte Logistique
                    </button>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white/80 dark:bg-white/5 rounded-[32px] p-8 border border-white/60 dark:border-white/10 shadow-sm flex items-start justify-between transition-all hover:translate-y-[-2px]">
                        <div>
                            <p className="text-[11px] font-bold text-apple-secondary uppercase tracking-[0.2em] mb-2 opacity-60">Total Opérateurs</p>
                            <h3 className="text-3xl font-bold text-apple-textDark dark:text-white">{stats?.total || '0'}</h3>
                        </div>
                        <div className="p-4 bg-primary/10 rounded-2xl text-primary">
                            <span className="material-symbols-outlined text-3xl text-primary">group</span>
                        </div>
                    </div>

                    <div className="bg-white/80 dark:bg-white/5 rounded-[32px] p-8 border border-white/60 dark:border-white/10 shadow-sm flex items-start justify-between transition-all hover:translate-y-[-2px]">
                        <div>
                            <p className="text-[11px] font-bold text-apple-secondary uppercase tracking-[0.2em] mb-2 opacity-60">Entrepôts Actifs</p>
                            <h3 className="text-3xl font-bold text-apple-textDark dark:text-white">{stats?.activeWarehouses || '0'} / 2</h3>
                        </div>
                        <div className="p-4 bg-blue-500/10 rounded-2xl text-blue-500">
                            <span className="material-symbols-outlined text-3xl">warehouse</span>
                        </div>
                    </div>

                    <div className="bg-white/80 dark:bg-white/5 rounded-[32px] p-8 border border-white/60 dark:border-white/10 shadow-sm flex items-start justify-between transition-all hover:translate-y-[-2px]">
                        <div>
                            <p className="text-[11px] font-bold text-apple-secondary uppercase tracking-[0.2em] mb-2 opacity-60">Connexions (24h)</p>
                            <h3 className="text-3xl font-bold text-apple-textDark dark:text-white">{stats?.logins24h || '0'}</h3>
                        </div>
                        <div className="p-4 bg-emerald-500/10 rounded-2xl text-emerald-500">
                            <span className="material-symbols-outlined text-3xl">lock_open</span>
                        </div>
                    </div>
                </div>

                {/* Main Table Card */}
                <div className="bg-white/70 dark:bg-white/5 backdrop-blur-md border border-white/80 dark:border-white/10 rounded-[32px] shadow-sm overflow-hidden flex flex-col">
                    <div className="px-8 py-6 border-b border-gray-100/10 dark:border-white/10 flex items-center justify-between bg-white/50 dark:bg-transparent">
                        <div className="flex items-center gap-4 flex-1">
                            <h3 className="font-bold text-apple-textDark dark:text-white">Liste des opérateurs</h3>
                            <div className="relative group max-w-sm w-full">
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-apple-secondary text-sm opacity-60">search</span>
                                <input
                                    type="text"
                                    placeholder="Rechercher par nom ou email..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-9 pr-4 py-2 bg-slate-50 dark:bg-white/5 border-none rounded-xl text-xs font-medium w-full focus:ring-2 focus:ring-primary/20 transition-all"
                                />
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => fetchData()}
                                className="p-2.5 bg-white dark:bg-white/10 rounded-xl border border-black/5 dark:border-white/10 shadow-sm text-apple-secondary hover:text-primary transition-all"
                            >
                                <span className="material-symbols-outlined text-[20px]">refresh</span>
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 dark:bg-white/5 border-b border-gray-100/10 dark:border-white/5 text-[11px] font-bold text-apple-secondary uppercase tracking-[0.2em] opacity-60">
                                    <th className="px-8 py-5">Nom / Opérateur</th>
                                    <th className="px-8 py-5">Email</th>
                                    <th className="px-8 py-5 text-center">Entrepôt assigné</th>
                                    <th className="px-8 py-5">Dernière connexion</th>
                                    <th className="px-8 py-5">Status</th>
                                    <th className="px-8 py-5 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100/10 dark:divide-white/5">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={6} className="px-8 py-20 text-center">
                                            <div className="flex flex-col items-center gap-4">
                                                <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                                                <p className="text-apple-secondary font-medium animate-pulse">Chargement des opérateurs...</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredOperators.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-8 py-20 text-center text-apple-secondary font-medium">
                                            Aucun opérateur trouvé.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredOperators.map((op) => (
                                        <tr key={op.id} className="group hover:bg-white/40 dark:hover:bg-white/5 transition-all duration-300">
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-full btn-titanium-primary text-white flex items-center justify-center text-xs font-bold shadow-lg border-2 border-white/20">
                                                        {(op.firstName?.[0] || '') + (op.lastName?.[0] || '') || 'OP'}
                                                    </div>
                                                    <span className="text-sm font-bold text-apple-textDark dark:text-white tracking-tight">
                                                        {op.firstName} {op.lastName}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 text-sm font-medium text-apple-secondary">
                                                {op.email}
                                            </td>
                                            <td className="px-8 py-5 text-center">
                                                <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-all ${op.warehouse === 'paris'
                                                        ? 'bg-indigo-50 text-indigo-700 border-indigo-100 shadow-sm shadow-indigo-100/50'
                                                        : 'bg-orange-50 text-orange-700 border-orange-100 shadow-sm shadow-orange-100/50'
                                                    }`}>
                                                    Entrepôt {op.warehouse === 'paris' ? 'Paris Sud' : 'Oujda Port'}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5 text-sm font-medium text-apple-secondary opacity-60">
                                                {op.lastLoginAt
                                                    ? new Date(op.lastLoginAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                                                    : 'Jamais'}
                                            </td>
                                            <td className="px-8 py-5">
                                                <span className={`h-2.5 w-2.5 rounded-full inline-block mr-2 ${op.isActive ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-rose-500 opacity-40'}`} />
                                                <span className={`text-[10px] font-bold uppercase tracking-widest ${op.isActive ? 'text-emerald-600' : 'text-rose-600 opacity-40'}`}>
                                                    {op.isActive ? 'Actif' : 'Révoqué'}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <button
                                                    onClick={() => handleToggleStatus(op.id, op.isActive)}
                                                    className={`text-[10px] font-bold uppercase tracking-[0.15em] transition-all hover:underline ${op.isActive ? 'text-primary' : 'text-emerald-600'
                                                        }`}
                                                >
                                                    {op.isActive ? 'Révoquer accès' : 'Réactiver compte'}
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Secondary Action Section */}
                <div className="bg-white/80 dark:bg-white/5 rounded-[40px] p-12 border border-white/60 dark:border-white/10 relative overflow-hidden group shadow-sm">
                    <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 rounded-full -mr-32 -mt-32 blur-[80px] group-hover:bg-primary/10 transition-all duration-700"></div>
                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
                        <div className="max-w-xl text-center md:text-left">
                            <h3 className="text-3xl font-bold text-apple-textDark dark:text-white mb-3 tracking-tight">Besoin d'un audit complet ?</h3>
                            <p className="text-apple-secondary font-medium leading-relaxed">Accédez aux journaux d'activité pour suivre toutes les modifications effectuées par les opérateurs sur le système.</p>
                        </div>
                        <AdminButton
                            variant="primary"
                            onClick={() => router.push('/admin/audit-logs')}
                            className="px-10 h-14 rounded-full font-bold text-sm transition-all duration-300 shadow-lg"
                        >
                            Consulter les Audit Logs
                        </AdminButton>
                    </div>
                </div>
            </div>

            {/* Modal de création */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
                    <div className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-[40px] shadow-2xl relative z-10 overflow-hidden border border-white/20">
                        <div className="px-10 py-8 border-b border-gray-100 dark:border-white/5 flex justify-between items-center">
                            <h3 className="text-2xl font-bold text-primary tracking-tight">Nouvel Opérateur</h3>
                            <button onClick={() => setIsModalOpen(false)} className="h-10 w-10 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 flex items-center justify-center transition-all">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <form onSubmit={handleCreateOperator} className="p-10 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-apple-secondary uppercase tracking-widest ml-1">Prénom</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.firstName}
                                        onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                                        className="w-full h-12 px-4 rounded-2xl bg-slate-50 dark:bg-white/5 border-none focus:ring-2 focus:ring-primary/20 transition-all text-sm font-medium"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-apple-secondary uppercase tracking-widest ml-1">Nom</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.lastName}
                                        onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                                        className="w-full h-12 px-4 rounded-2xl bg-slate-50 dark:bg-white/5 border-none focus:ring-2 focus:ring-primary/20 transition-all text-sm font-medium"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[11px] font-bold text-apple-secondary uppercase tracking-widest ml-1">Email Professionnel</label>
                                <input
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full h-12 px-4 rounded-2xl bg-slate-50 dark:bg-white/5 border-none focus:ring-2 focus:ring-primary/20 transition-all text-sm font-medium"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[11px] font-bold text-apple-secondary uppercase tracking-widest ml-1">Mot de passe temporaire</label>
                                <input
                                    type="password"
                                    required
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    className="w-full h-12 px-4 rounded-2xl bg-slate-50 dark:bg-white/5 border-none focus:ring-2 focus:ring-primary/20 transition-all text-sm font-medium"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[11px] font-bold text-apple-secondary uppercase tracking-widest ml-1">Affectation Entrepôt</label>
                                <div className="flex gap-3">
                                    {['paris', 'oujda'].map((w) => (
                                        <button
                                            key={w}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, warehouse: w })}
                                            className={`flex-1 py-3.5 rounded-2xl border-2 transition-all text-[11px] font-bold uppercase tracking-widest ${formData.warehouse === w
                                                    ? 'bg-primary/5 border-primary text-primary'
                                                    : 'bg-white dark:bg-white/5 border-slate-100 dark:border-white/10 text-apple-secondary hover:border-slate-200'
                                                }`}
                                        >
                                            {w === 'paris' ? 'Paris Sud' : 'Oujda Port'}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full h-14 mt-4 btn-titanium btn-titanium-primary text-white rounded-full font-bold text-sm shadow-xl shadow-slate-900/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                            >
                                {isSubmitting ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : 'Créer et envoyer les accès'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
