'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { apiClient } from '@/lib/api-client';
import { AdminButton } from '@/components/ui/AdminButton';
import toast from 'react-hot-toast';

interface PromoCode {
    id: string;
    code: string;
    discountPercent: number | null;
    discountAmountEur: string | null;
    discountAmountMad: string | null;
    maxUses: number;
    usedCount: number;
    validFrom: string;
    validUntil: string;
    isActive: boolean;
}

export default function PromoCodesPage() {
    const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState<any>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPromo, setEditingPromo] = useState<Partial<PromoCode> | null>(null);

    const openModal = (promo?: PromoCode) => {
        if (promo) {
            setEditingPromo(promo);
        } else {
            setEditingPromo({
                code: '',
                discountPercent: null,
                discountAmountEur: null,
                discountAmountMad: null,
                maxUses: 100,
                validFrom: new Date().toISOString().split('T')[0],
                validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                isActive: true
            });
        }
        setIsModalOpen(true);
    };

    const handleSavePromo = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingPromo?.id) {
                const res = await apiClient.patch(`/api/admin/promo-codes/${editingPromo.id}`, editingPromo);
                if (res.data.success) toast.success('Code promo mis à jour');
            } else {
                const res = await apiClient.post('/api/admin/promo-codes', editingPromo);
                if (res.data.success) toast.success('Code promo créé');
            }
            setIsModalOpen(false);
            fetchPromoCodes();
        } catch (error) {
            toast.error('Erreur lors de l\'enregistrement');
        }
    };

    const fetchPromoCodes = async () => {
        setIsLoading(true);
        try {
            const response = await apiClient.get(`/api/admin/promo-codes?page=${page}&search=${search}`);
            if (response.data.success) {
                let codes = response.data.data.promoCodes;
                if (statusFilter === 'active') codes = codes.filter((c: PromoCode) => c.isActive);
                if (statusFilter === 'inactive') codes = codes.filter((c: PromoCode) => !c.isActive);
                setPromoCodes(codes);
                setPagination(response.data.data.pagination);
            }
        } catch (error) {
            console.error('Failed to fetch promo codes', error);
            toast.error('Impossible de charger les codes promo');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const timeout = setTimeout(() => {
            fetchPromoCodes();
        }, 300);
        return () => clearTimeout(timeout);
    }, [page, search, statusFilter]);

    const deletePromoCode = async (id: string) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer ce code promo ?')) return;
        try {
            const response = await apiClient.delete(`/api/admin/promo-codes/${id}`);
            if (response.data.success) {
                toast.success('Code promo supprimé');
                fetchPromoCodes();
            }
        } catch (error) {
            toast.error('Erreur lors de la suppression');
        }
    };

    const toggleStatus = async (id: string, currentStatus: boolean) => {
        try {
            const response = await apiClient.patch(`/api/admin/promo-codes/${id}`, {
                isActive: !currentStatus
            });
            if (response.data.success) {
                toast.success(`Code promo ${!currentStatus ? 'activé' : 'désactivé'}`);
                fetchPromoCodes();
            }
        } catch (error) {
            toast.error('Erreur lors de la modification du statut');
        }
    };

    return (
        <AdminLayout>
            <div className="flex flex-col gap-10 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <nav className="flex items-center gap-2 text-[10px] font-bold text-apple-secondary uppercase tracking-[0.2em] mb-4">
                            <span className="opacity-40">Finance & Plans</span>
                            <span className="opacity-20">/</span>
                            <span className="text-apple-textDark dark:text-white">Codes Promo</span>
                        </nav>
                        <h2 className="text-4xl font-bold text-apple-textDark dark:text-white tracking-tight">Gestion des Coupons</h2>
                        <p className="text-apple-secondary mt-1 font-medium">Créez et gérez vos offres promotionnelles pour vos clients B2B.</p>
                    </div>
                    <div className="flex gap-4">
                        <AdminButton onClick={() => openModal()} variant="primary" className="px-8 rounded-full shadow-xl shadow-primary/20 flex items-center gap-2">
                            <span className="material-symbols-outlined text-[20px]">add_circle</span>
                            Créer un Coupon
                        </AdminButton>
                    </div>
                </div>

                {/* Summary Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="klik-glass p-8 rounded-[32px] border border-white/40 dark:border-white/5 shadow-sm transition-all hover:translate-y-[-2px] hover:shadow-xl">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-[11px] font-bold text-apple-secondary uppercase tracking-[0.2em] opacity-60">Coupons Actifs</span>
                            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                <span className="material-symbols-outlined text-2xl">confirmation_number</span>
                            </div>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-bold text-apple-textDark dark:text-white tracking-tight">
                                {promoCodes.filter(p => p.isActive).length}
                            </span>
                            <span className="text-xs font-bold text-emerald-500 uppercase tracking-widest">En cours</span>
                        </div>
                    </div>

                    <div className="klik-glass p-8 rounded-[32px] border border-white/40 dark:border-white/5 shadow-sm transition-all hover:translate-y-[-2px] hover:shadow-xl">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-[11px] font-bold text-apple-secondary uppercase tracking-[0.2em] opacity-60">Utilisation Totale</span>
                            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary dark:text-white">
                                <span className="material-symbols-outlined text-2xl">analytics</span>
                            </div>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-bold text-apple-textDark dark:text-white tracking-tight">
                                {promoCodes.reduce((acc, curr) => acc + curr.usedCount, 0)}
                            </span>
                            <span className="text-xs font-bold text-apple-secondary uppercase tracking-widest">Rédemptions</span>
                        </div>
                    </div>

                    <div className="klik-glass p-8 rounded-[32px] border border-white/40 dark:border-white/5 shadow-sm transition-all hover:translate-y-[-2px] hover:shadow-xl">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-[11px] font-bold text-apple-secondary uppercase tracking-[0.2em] opacity-60">Performance Moyenne</span>
                            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                                <span className="material-symbols-outlined text-2xl">trending_up</span>
                            </div>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-bold text-apple-textDark dark:text-white tracking-tight">
                                {promoCodes.length > 0 
                                    ? Math.round((promoCodes.reduce((acc, curr) => acc + curr.usedCount, 0) / promoCodes.reduce((acc, curr) => acc + curr.maxUses, 0)) * 100) || 0 
                                    : 0}%
                            </span>
                            <span className="text-xs font-bold text-apple-secondary uppercase tracking-widest">Utilisation globale</span>
                        </div>
                    </div>
                </div>

                {/* Main Table Section */}
                <div className="bg-white/60 dark:bg-white/5 backdrop-blur-md rounded-[32px] border border-white/40 dark:border-white/5 shadow-sm overflow-hidden mb-10">
                    <div className="p-8 border-b border-gray-100/10 dark:border-white/5 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                        <h3 className="text-xl font-bold text-apple-textDark dark:text-white">Liste des Codes Promotionnels</h3>
                        <div className="flex gap-4 w-full lg:w-auto">
                            <div className="relative flex-1 lg:w-64 group">
                                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-apple-secondary group-focus-within:text-primary transition-colors">search</span>
                                <input
                                    type="text"
                                    placeholder="Rechercher un code..."
                                    value={search}
                                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                                    className="w-full pl-11 pr-4 py-3 bg-white/50 dark:bg-white/5 border border-white/40 dark:border-white/10 rounded-2xl focus:ring-2 focus:ring-primary/20 transition-all font-medium text-sm"
                                />
                            </div>
                            <select 
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value as any)}
                                className="bg-white/50 dark:bg-white/5 border border-white/40 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-apple-textDark dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none pr-10 relative cursor-pointer"
                            >
                                <option value="all">Tous les statuts</option>
                                <option value="active">Actifs</option>
                                <option value="inactive">Inactifs</option>
                            </select>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 dark:bg-white/5 border-b border-gray-100/10 dark:border-white/5 text-[11px] font-bold text-apple-secondary uppercase tracking-[0.2em] opacity-60">
                                    <th className="px-8 py-5">Code</th>
                                    <th className="px-8 py-5">Remise</th>
                                    <th className="px-8 py-5">Usage</th>
                                    <th className="px-8 py-5">Validité</th>
                                    <th className="px-8 py-5 text-center">Statut</th>
                                    <th className="px-8 py-5 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100/10 dark:divide-white/5">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={6} className="px-8 py-20 text-center">
                                            <div className="flex flex-col items-center gap-4">
                                                <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                                                <p className="text-apple-secondary font-medium animate-pulse">Chargement des coupons...</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : promoCodes.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-8 py-20 text-center text-apple-secondary font-medium">
                                            Aucun code promo configuré.
                                        </td>
                                    </tr>
                                ) : (
                                    promoCodes.map((promo) => {
                                        const usagePercent = Math.min(100, Math.round((promo.usedCount / promo.maxUses) * 100)) || 0;
                                        const isExpired = new Date(promo.validUntil) < new Date();

                                        return (
                                            <tr key={promo.id} className="hover:bg-white/40 dark:hover:bg-white/5 transition-all duration-300 group cursor-default">
                                                <td className="px-8 py-5">
                                                    <span className="px-4 py-2 bg-primary/10 text-primary rounded-xl font-bold text-sm tracking-wider uppercase">
                                                        {promo.code}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <p className="font-bold text-apple-textDark dark:text-white tracking-tight">
                                                        {promo.discountPercent ? `${promo.discountPercent}%` :
                                                            promo.discountAmountEur ? `${promo.discountAmountEur} €` :
                                                                `${promo.discountAmountMad} MAD`}
                                                    </p>
                                                    <p className="text-[10px] font-semibold text-apple-secondary opacity-60 uppercase tracking-wider">
                                                        {promo.discountPercent ? 'Sur le panier' : 'Remise fixe'}
                                                    </p>
                                                </td>
                                                <td className="px-8 py-5 w-48">
                                                    <div className="flex flex-col gap-2">
                                                        <div className="flex justify-between text-[10px] font-bold text-apple-secondary uppercase tracking-widest">
                                                            <span>{promo.usedCount} / {promo.maxUses}</span>
                                                            <span>{usagePercent}%</span>
                                                        </div>
                                                        <div className="h-1.5 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                                                            <div
                                                                className={`h-full rounded-full transition-all duration-1000 ${usagePercent > 90 ? 'bg-rose-500' : 'bg-primary'}`}
                                                                style={{ width: `${usagePercent}%` }}
                                                            ></div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <p className="text-xs font-bold text-apple-textDark dark:text-white">
                                                        Jusqu'au {new Date(promo.validUntil).toLocaleDateString('fr-FR')}
                                                    </p>
                                                    <p className={`text-[10px] font-semibold uppercase tracking-wider ${isExpired ? 'text-rose-500' : 'text-emerald-500'}`}>
                                                        {isExpired ? 'Expiré' : 'Valide'}
                                                    </p>
                                                </td>
                                                <td className="px-8 py-6 text-center">
                                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${promo.isActive && !isExpired
                                                            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                                            : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                                                        }`}>
                                                        {promo.isActive && !isExpired ? 'Actif' : 'Inactif'}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-6 text-right">
                                                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                                                        <button
                                                            onClick={() => toggleStatus(promo.id, promo.isActive)}
                                                            className="w-9 h-9 rounded-xl bg-white dark:bg-white/10 border border-white/40 dark:border-white/10 flex items-center justify-center text-apple-secondary hover:text-primary transition-all shadow-sm"
                                                            title={promo.isActive ? "Désactiver" : "Activer"}
                                                        >
                                                            <span className="material-symbols-outlined text-[18px]">
                                                                {promo.isActive ? 'pause' : 'play_arrow'}
                                                            </span>
                                                        </button>
                                                        <button
                                                            onClick={() => openModal(promo)}
                                                            className="w-9 h-9 rounded-xl bg-white dark:bg-white/10 border border-white/40 dark:border-white/10 flex items-center justify-center text-apple-secondary hover:text-amber-500 transition-all shadow-sm">
                                                            <span className="material-symbols-outlined text-[18px]">edit</span>
                                                        </button>
                                                        <button
                                                            onClick={() => deletePromoCode(promo.id)}
                                                            className="w-9 h-9 rounded-xl bg-white dark:bg-white/10 border border-white/40 dark:border-white/10 flex items-center justify-center text-apple-secondary hover:text-red-500 transition-all shadow-sm"
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

                    {/* Pagination */}
                    {pagination && pagination.totalPages > 1 && (
                        <div className="p-8 bg-slate-50/30 dark:bg-white/5 flex items-center justify-between border-t border-gray-100/10 dark:border-white/5">
                            <p className="text-[10px] font-bold text-apple-secondary uppercase tracking-[0.2em] opacity-40">
                                Page {page} sur {pagination.totalPages}
                            </p>
                            <div className="flex gap-2">
                                <AdminButton
                                    variant="secondary"
                                    className="px-4 py-2 rounded-xl disabled:opacity-30"
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                >
                                    <span className="material-symbols-outlined text-sm">chevron_left</span>
                                </AdminButton>
                                {Array.from({ length: pagination.totalPages }).map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setPage(i + 1)}
                                        className={`size-9 rounded-xl flex items-center justify-center text-xs font-bold transition-all ${page === i + 1
                                                ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                                : 'bg-white dark:bg-white/10 border border-white/40 dark:border-white/10 text-apple-secondary hover:text-apple-textDark dark:hover:text-white'
                                            }`}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                                <AdminButton
                                    variant="secondary"
                                    className="px-4 py-2 rounded-xl disabled:opacity-30"
                                    onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                                    disabled={page === pagination.totalPages}
                                >
                                    <span className="material-symbols-outlined text-sm">chevron_right</span>
                                </AdminButton>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            {/* Promo Code Modal */}
            {isModalOpen && editingPromo && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-[#1E293B] rounded-[32px] w-full max-w-2xl shadow-2xl overflow-hidden border border-white/40 dark:border-white/10 max-h-[90vh] overflow-y-auto">
                        <div className="p-8 border-b border-gray-100 dark:border-white/5 flex justify-between items-center bg-gray-50/50 dark:bg-white/5 sticky top-0 z-10">
                            <h3 className="text-2xl font-bold text-apple-textDark dark:text-white tracking-tight">
                                {editingPromo.id ? 'Modifier le Coupon' : 'Créer un Coupon'}
                            </h3>
                            <button type="button" onClick={() => setIsModalOpen(false)} className="w-10 h-10 rounded-full hover:bg-gray-200 dark:hover:bg-white/10 flex items-center justify-center text-apple-secondary transition-all">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <form onSubmit={handleSavePromo} className="p-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-apple-secondary uppercase tracking-widest mb-2">Code Promo</label>
                                    <input required type="text" value={editingPromo.code || ''} onChange={(e) => setEditingPromo({ ...editingPromo, code: e.target.value.toUpperCase() })} className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 font-bold uppercase tracking-widest text-apple-textDark dark:text-white" placeholder="ex: SUMMER2024" />
                                </div>
                                
                                <div>
                                    <label className="block text-xs font-bold text-apple-secondary uppercase tracking-widest mb-2">Remise (%)</label>
                                    <input type="number" value={editingPromo.discountPercent || ''} onChange={(e) => setEditingPromo({ ...editingPromo, discountPercent: parseInt(e.target.value) || null, discountAmountEur: null, discountAmountMad: null })} className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 text-apple-textDark dark:text-white" placeholder="ex: 20" />
                                </div>
                                
                                <div className="flex gap-2">
                                    <div className="flex-1">
                                        <label className="block text-xs font-bold text-apple-secondary uppercase tracking-widest mb-2">Remise Fixe (€)</label>
                                        <input type="number" step="0.01" value={editingPromo.discountAmountEur || ''} onChange={(e) => setEditingPromo({ ...editingPromo, discountAmountEur: e.target.value || null, discountPercent: null })} className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 text-apple-textDark dark:text-white" placeholder="ex: 50.00" />
                                    </div>
                                    <div className="flex-1">
                                        <label className="block text-xs font-bold text-apple-secondary uppercase tracking-widest mb-2">Remise Fixe (MAD)</label>
                                        <input type="number" step="0.01" value={editingPromo.discountAmountMad || ''} onChange={(e) => setEditingPromo({ ...editingPromo, discountAmountMad: e.target.value || null, discountPercent: null })} className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 text-apple-textDark dark:text-white" placeholder="ex: 500.00" />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-apple-secondary uppercase tracking-widest mb-2">Nombre max d'utilisations</label>
                                    <input required type="number" value={editingPromo.maxUses || 0} onChange={(e) => setEditingPromo({ ...editingPromo, maxUses: parseInt(e.target.value) || 0 })} className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 text-apple-textDark dark:text-white" />
                                </div>

                                <div className="md:col-span-2 grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-xs font-bold text-apple-secondary uppercase tracking-widest mb-2">Valide à partir de</label>
                                        <input required type="date" value={editingPromo.validFrom ? new Date(editingPromo.validFrom).toISOString().split('T')[0] : ''} onChange={(e) => setEditingPromo({ ...editingPromo, validFrom: e.target.value })} className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 text-apple-textDark dark:text-white" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-apple-secondary uppercase tracking-widest mb-2">Valide jusqu'au</label>
                                        <input required type="date" value={editingPromo.validUntil ? new Date(editingPromo.validUntil).toISOString().split('T')[0] : ''} onChange={(e) => setEditingPromo({ ...editingPromo, validUntil: e.target.value })} className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 text-apple-textDark dark:text-white" />
                                    </div>
                                </div>

                                <div className="md:col-span-2 flex items-center justify-between p-4 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/10 mt-2">
                                    <div>
                                        <p className="font-bold text-apple-textDark dark:text-white text-sm">Statut d'activation</p>
                                        <p className="text-xs text-apple-secondary">Rend ce coupon utilisable immédiatement.</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" checked={editingPromo.isActive} onChange={(e) => setEditingPromo({ ...editingPromo, isActive: e.target.checked })} className="sr-only peer" />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                                    </label>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 dark:border-white/5">
                                <AdminButton type="button" variant="secondary" onClick={() => setIsModalOpen(false)} className="px-6 py-3 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm">Annuler</AdminButton>
                                <AdminButton type="submit" variant="primary" className="px-8 py-3 rounded-xl shadow-lg shadow-primary/30 font-bold uppercase tracking-widest text-xs">
                                    {editingPromo.id ? 'Sauvegarder' : 'Créer le coupon'}
                                </AdminButton>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
