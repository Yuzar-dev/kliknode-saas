'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { apiClient } from '@/lib/api-client';
import { AdminButton } from '@/components/ui/AdminButton';
import toast from 'react-hot-toast';

interface InventoryItem {
    id: string;
    sku: string;
    warehouse: 'paris' | 'oujda';
    quantityPhysical: number;
    quantityReserved: number;
    quantityAvailable: number;
    lastAdjustmentAt: string | null;
    updatedAt: string;
}

interface InventoryStats {
    totalSkus: number;
    lowStockCount: number;
    totalValue: number;
    totalPhysical?: number;
    totalReserved?: number;
    totalAvailable?: number;
}

export default function InventoryPage() {
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [stats, setStats] = useState<InventoryStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [warehouseFilter, setWarehouseFilter] = useState<string>('');
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState<any>(null);

    const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
    const [adjustForm, setAdjustForm] = useState<{
        id?: string;
        sku: string;
        warehouse: string;
        quantityPhysical: number;
    }>({ sku: '', warehouse: 'paris', quantityPhysical: 0 });

    const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
    const [transferForm, setTransferForm] = useState({
        sku: '',
        fromWarehouse: 'paris',
        toWarehouse: 'oujda',
        quantity: 1
    });

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [invResponse, statsResponse] = await Promise.all([
                apiClient.get(`/api/admin/inventory?page=${page}&search=${search}&warehouse=${warehouseFilter}`),
                apiClient.get('/api/admin/inventory/stats')
            ]);

            if (invResponse.data.success) {
                setInventory(invResponse.data.data.inventory);
                setPagination(invResponse.data.data.pagination);
            }
            if (statsResponse.data.success) {
                setStats(statsResponse.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch inventory data', error);
            toast.error('Impossible de charger les données d\'inventaire');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const timeout = setTimeout(() => {
            fetchData();
        }, 300);
        return () => clearTimeout(timeout);
    }, [page, search, warehouseFilter]);

    const handleAdjustStock = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await apiClient.patch('/api/admin/inventory/adjust', adjustForm);
            if (response.data.success) {
                toast.success(adjustForm.id ? 'Produit mis à jour avec succès' : 'Stock ajusté avec succès');
                setIsAdjustModalOpen(false);
                fetchData();
            }
        } catch (error: any) {
            toast.error(error?.response?.data?.error?.message || 'Erreur lors de la mise à jour du stock');
        }
    };

    const handleTransferStock = async (e: React.FormEvent) => {
        e.preventDefault();
        if (transferForm.fromWarehouse === transferForm.toWarehouse) {
            toast.error('Les entrepôts source et destination doivent être différents');
            return;
        }
        try {
            const response = await apiClient.post('/api/admin/inventory/transfer', transferForm);
            if (response.data.success) {
                toast.success(response.data.data?.message || 'Transfert inter-entrepôts effectué avec succès');
                setIsTransferModalOpen(false);
                fetchData();
            }
        } catch (error: any) {
            toast.error(error?.response?.data?.error?.message || 'Erreur lors du transfert inter-entrepôts');
        }
    };

    const handleDeleteItem = async (item: InventoryItem) => {
        if (!confirm(`Supprimer le produit "${item.sku}" de l'entrepôt ${item.warehouse === 'paris' ? 'Paris Sud' : 'Oujda Port'} ?`)) {
            return;
        }
        try {
            const response = await apiClient.delete(`/api/admin/inventory/${item.id}`);
            if (response.data.success) {
                toast.success('Ligne de stock supprimée');
                fetchData();
            }
        } catch (error: any) {
            toast.error(error?.response?.data?.error?.message || 'Erreur lors de la suppression');
        }
    };

    const handleExportCsv = () => {
        if (inventory.length === 0) {
            toast.error('Aucune donnée à exporter');
            return;
        }
        const header = 'SKU,Entrepot,QuantitePhysique,QuantiteReservee,QuantiteDisponible,DernierAjustement\n';
        const rows = inventory.map(item =>
            `"${item.sku}","${item.warehouse === 'paris' ? 'Paris Sud' : 'Oujda Port'}",${item.quantityPhysical},${item.quantityReserved},${item.quantityAvailable},"${item.lastAdjustmentAt || item.updatedAt}"`
        ).join('\n');
        const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `inventaire-kliknode-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success('Inventaire exporté en CSV');
    };

    const openAdjustModal = (item?: InventoryItem) => {
        if (item) {
            setAdjustForm({
                id: item.id,
                sku: item.sku,
                warehouse: item.warehouse,
                quantityPhysical: item.quantityPhysical
            });
        } else {
            setAdjustForm({ id: undefined, sku: '', warehouse: 'paris', quantityPhysical: 0 });
        }
        setIsAdjustModalOpen(true);
    };

    const openTransferModal = (item?: InventoryItem) => {
        if (item) {
            setTransferForm({
                sku: item.sku,
                fromWarehouse: item.warehouse,
                toWarehouse: item.warehouse === 'paris' ? 'oujda' : 'paris',
                quantity: Math.min(10, Math.max(1, item.quantityAvailable))
            });
        } else {
            const firstItem = inventory[0];
            setTransferForm({
                sku: firstItem?.sku || 'NFC-CARD-V2',
                fromWarehouse: firstItem?.warehouse || 'paris',
                toWarehouse: firstItem?.warehouse === 'paris' ? 'oujda' : 'paris',
                quantity: 10
            });
        }
        setIsTransferModalOpen(true);
    };

    const handleResetAllStock = async () => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer TOUT le stock (cartes physiques, lots et commandes hardware) pour repartir de zéro ?')) {
            return;
        }
        try {
            const res = await apiClient.post('/api/admin/inventory/reset');
            if (res.data?.success) {
                toast.success('Tout le stock a été remis à zéro !');
                fetchData();
            }
        } catch (err: any) {
            toast.error(err.response?.data?.error?.message || 'Erreur lors de la remise à zéro du stock');
        }
    };

    const uniqueSkus = Array.from(new Set(inventory.map(i => i.sku)));

    return (
        <AdminLayout>
            <div className="flex flex-col gap-10 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <nav className="flex items-center gap-2 text-[10px] font-bold text-apple-secondary uppercase tracking-[0.2em] mb-4">
                            <span className="opacity-40">Logistique & Matériel</span>
                            <span className="opacity-20">/</span>
                            <span className="text-apple-textDark dark:text-white">Gestion des Stocks</span>
                        </nav>
                        <h2 className="text-4xl font-bold text-apple-textDark dark:text-white tracking-tight">Inventaire Global</h2>
                        <p className="text-apple-secondary mt-1 font-medium">Suivez et gérez vos stocks en temps réel à travers vos entrepôts.</p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <AdminButton onClick={() => openAdjustModal()} variant="primary" className="px-6 py-3 rounded-2xl shadow-lg shadow-primary/20 flex items-center gap-2">
                            <span className="material-symbols-outlined text-xl">add_circle</span>
                            Ajuster Stock
                        </AdminButton>
                        <AdminButton onClick={() => openTransferModal()} variant="secondary" className="px-6 py-3 rounded-2xl border border-slate-200 dark:border-white/10 flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-white/5 transition-all">
                            <span className="material-symbols-outlined text-xl">sync_alt</span>
                            Transfert Inter-Entrepôts
                        </AdminButton>
                        <AdminButton onClick={handleResetAllStock} variant="secondary" className="px-5 py-3 rounded-2xl border border-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center gap-2 hover:bg-rose-500/10 transition-all">
                            <span className="material-symbols-outlined text-xl">delete_sweep</span>
                            Purger Stock (0)
                        </AdminButton>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="klik-glass p-7 rounded-[32px] border border-white/40 dark:border-white/5 shadow-sm transition-all hover:translate-y-[-2px] hover:shadow-xl">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-[11px] font-bold text-apple-secondary uppercase tracking-[0.2em] opacity-60">Stock Physique Total</span>
                            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                                <span className="material-symbols-outlined text-2xl">credit_card</span>
                            </div>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-bold text-apple-textDark dark:text-white tracking-tight">
                                {(stats?.totalPhysical ?? inventory.reduce((s, i) => s + i.quantityPhysical, 0)).toLocaleString('fr-FR')}
                            </span>
                            <span className="text-xs font-bold text-apple-secondary uppercase tracking-widest">Cartes ({stats?.totalSkus || 0} SKUs)</span>
                        </div>
                    </div>

                    <div className="klik-glass p-7 rounded-[32px] border border-white/40 dark:border-white/5 shadow-sm transition-all hover:translate-y-[-2px] hover:shadow-xl">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-[11px] font-bold text-apple-secondary uppercase tracking-[0.2em] opacity-60">Stock Disponible</span>
                            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                <span className="material-symbols-outlined text-2xl">inventory_2</span>
                            </div>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-bold text-apple-textDark dark:text-white tracking-tight">
                                {(stats?.totalAvailable ?? inventory.reduce((s, i) => s + i.quantityAvailable, 0)).toLocaleString('fr-FR')}
                            </span>
                            <span className="text-xs font-bold text-emerald-500 uppercase tracking-widest">Cartes vierges</span>
                        </div>
                    </div>

                    <div className="klik-glass p-7 rounded-[32px] border border-white/40 dark:border-white/5 shadow-sm transition-all hover:translate-y-[-2px] hover:shadow-xl">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-[11px] font-bold text-apple-secondary uppercase tracking-[0.2em] opacity-60">Réservées & Pairées</span>
                            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                                <span className="material-symbols-outlined text-2xl">local_shipping</span>
                            </div>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-bold text-apple-textDark dark:text-white tracking-tight">
                                {(stats?.totalReserved ?? inventory.reduce((s, i) => s + i.quantityReserved, 0)).toLocaleString('fr-FR')}
                            </span>
                            <span className="text-xs font-bold text-indigo-500 uppercase tracking-widest">B2B + Actives</span>
                        </div>
                    </div>

                    <div className="klik-glass p-7 rounded-[32px] border border-white/40 dark:border-white/5 shadow-sm transition-all hover:translate-y-[-2px] hover:shadow-xl">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-[11px] font-bold text-apple-secondary uppercase tracking-[0.2em] opacity-60">Valeur Stock</span>
                            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                                <span className="material-symbols-outlined text-2xl">trending_up</span>
                            </div>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-bold text-apple-textDark dark:text-white tracking-tight">
                                {stats?.totalValue?.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }) || '0 €'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Filters & Search */}
                <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4 w-full lg:w-auto">
                        <div className="relative flex-1 lg:w-72 group">
                            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-apple-secondary group-focus-within:text-primary transition-colors">search</span>
                            <input
                                type="text"
                                placeholder="Rechercher un SKU..."
                                value={search}
                                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                                className="w-full pl-11 pr-4 py-3 bg-white/50 dark:bg-white/5 border border-white/40 dark:border-white/10 rounded-2xl focus:ring-2 focus:ring-primary/20 transition-all font-medium text-sm"
                            />
                        </div>
                        <select
                            value={warehouseFilter}
                            onChange={(e) => { setWarehouseFilter(e.target.value); setPage(1); }}
                            className="px-4 py-3 bg-white/50 dark:bg-white/5 border border-white/40 dark:border-white/10 rounded-2xl text-sm font-semibold text-apple-secondary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                        >
                            <option value="">Tous les Entrepôts</option>
                            <option value="paris">Paris</option>
                            <option value="oujda">Oujda</option>
                        </select>
                    </div>

                    <button
                        onClick={handleExportCsv}
                        title="Exporter l'inventaire en CSV"
                        className="p-3 rounded-xl bg-white/50 dark:bg-white/5 border border-white/40 dark:border-white/10 text-apple-secondary hover:text-primary transition-all cursor-pointer flex items-center gap-2 px-4 text-xs font-bold uppercase tracking-widest"
                    >
                        <span className="material-symbols-outlined text-lg">file_download</span>
                        Exporter CSV
                    </button>
                </div>

                {/* Data Table */}
                <div className="klik-glass rounded-[32px] overflow-hidden shadow-2xl shadow-slate-200/50 dark:shadow-none border-white/40 dark:border-white/5 mb-10">
                    <div className="p-8 border-b border-gray-100/10 dark:border-white/5">
                        <h4 className="font-bold text-lg text-apple-textDark dark:text-white">Détails des Stocks</h4>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 dark:bg-white/5 border-b border-gray-100/10 dark:border-white/5 text-[11px] font-bold text-apple-secondary uppercase tracking-[0.2em] opacity-60">
                                    <th className="px-8 py-5">Produit (SKU)</th>
                                    <th className="px-6 py-5">Entrepôt</th>
                                    <th className="px-6 py-5 text-right">Qty Physique</th>
                                    <th className="px-6 py-5 text-right">Qty Réservée</th>
                                    <th className="px-6 py-5 text-right">Qty Dispo</th>
                                    <th className="px-8 py-5">Statut</th>
                                    <th className="px-8 py-5 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100/10 dark:divide-white/5">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={7} className="px-8 py-20 text-center">
                                            <div className="flex flex-col items-center gap-4">
                                                <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                                                <p className="text-apple-secondary font-medium animate-pulse">Chargement de l'inventaire...</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : inventory.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-8 py-20 text-center text-apple-secondary font-medium">
                                            Aucun produit trouvé dans l'inventaire.
                                        </td>
                                    </tr>
                                ) : (
                                    inventory.map((item) => {
                                        const status = item.quantityAvailable <= 0 ? 'out_of_stock' : item.quantityAvailable < 10 ? 'low_stock' : 'in_stock';

                                        return (
                                            <tr key={item.id} className="hover:bg-white/40 dark:hover:bg-white/5 transition-all duration-300 group cursor-default">
                                                <td className="px-8 py-5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="size-10 rounded-xl bg-slate-100 dark:bg-white/10 flex items-center justify-center">
                                                            <span className="material-symbols-outlined text-apple-secondary">qr_code_2</span>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold text-apple-textDark dark:text-white tracking-tight">{item.sku}</p>
                                                            <p className="text-[10px] font-semibold text-apple-secondary uppercase tracking-widest opacity-60">Hardware Card V2</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${item.warehouse === 'paris'
                                                            ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                                                            : 'bg-indigo-500/10 text-indigo-500 border border-indigo-500/20'
                                                        }`}>
                                                        {item.warehouse === 'paris' ? 'Paris Sud' : 'Oujda Port'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-5 text-right font-bold text-sm text-apple-textDark dark:text-white">
                                                    {item.quantityPhysical}
                                                </td>
                                                <td className="px-6 py-5 text-right font-medium text-sm text-apple-secondary">
                                                    {item.quantityReserved}
                                                </td>
                                                <td className="px-6 py-5 text-right font-bold text-sm text-apple-textDark dark:text-white">
                                                    {item.quantityAvailable}
                                                </td>
                                                <td className="px-8 py-5">
                                                    <div className={`flex items-center gap-2 font-bold text-[10px] uppercase tracking-wider ${status === 'in_stock' ? 'text-emerald-500' :
                                                            status === 'low_stock' ? 'text-primary' : 'text-rose-500'
                                                        }`}>
                                                        <span className={`size-2 rounded-full ${status === 'in_stock' ? 'bg-emerald-500' :
                                                                status === 'low_stock' ? 'bg-primary' : 'bg-rose-500'
                                                            }`}></span>
                                                        {status === 'in_stock' ? 'En Stock' : status === 'low_stock' ? 'Critique' : 'Rupture'}
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => openTransferModal(item)}
                                                            title="Transférer vers un autre entrepôt"
                                                            className="w-9 h-9 rounded-xl bg-white dark:bg-white/10 border border-white/40 dark:border-white/10 flex items-center justify-center text-apple-secondary hover:text-indigo-500 transition-all shadow-sm cursor-pointer"
                                                        >
                                                            <span className="material-symbols-outlined text-[18px]">sync_alt</span>
                                                        </button>
                                                        <button
                                                            onClick={() => openAdjustModal(item)}
                                                            title="Modifier le produit / l'entrepôt / la quantité"
                                                            className="w-9 h-9 rounded-xl bg-white dark:bg-white/10 border border-white/40 dark:border-white/10 flex items-center justify-center text-apple-secondary hover:text-primary transition-all shadow-sm cursor-pointer"
                                                        >
                                                            <span className="material-symbols-outlined text-[18px]">edit</span>
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteItem(item)}
                                                            title="Supprimer cette ligne de stock"
                                                            className="w-9 h-9 rounded-xl bg-white dark:bg-white/10 border border-white/40 dark:border-white/10 flex items-center justify-center text-apple-secondary hover:text-rose-500 transition-all shadow-sm cursor-pointer"
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

                {/* Pagination */}
                {pagination && pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between pb-10">
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

            {/* Adjust Stock Modal */}
            {isAdjustModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-[#1E293B] rounded-[32px] w-full max-w-md shadow-2xl overflow-hidden border border-white/40 dark:border-white/10">
                        <div className="p-8 border-b border-gray-100 dark:border-white/5 flex justify-between items-center bg-gray-50/50 dark:bg-white/5">
                            <h3 className="text-2xl font-bold text-apple-textDark dark:text-white tracking-tight">
                                {adjustForm.id ? 'Modifier le Stock' : 'Ajouter / Ajuster le Stock'}
                            </h3>
                            <button type="button" onClick={() => setIsAdjustModalOpen(false)} className="w-10 h-10 rounded-full hover:bg-gray-200 dark:hover:bg-white/10 flex items-center justify-center text-apple-secondary transition-all">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <form onSubmit={handleAdjustStock} className="p-8">
                            <div className="flex flex-col gap-6 mb-8">
                                <div>
                                    <label className="block text-xs font-bold text-apple-secondary uppercase tracking-widest mb-2">SKU du Produit</label>
                                    <input required type="text" value={adjustForm.sku} onChange={(e) => setAdjustForm({ ...adjustForm, sku: e.target.value })} className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 transition-all font-bold text-apple-textDark dark:text-white" placeholder="ex: CARD-V2-BLACK" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-apple-secondary uppercase tracking-widest mb-2">Entrepôt</label>
                                    <select required value={adjustForm.warehouse} onChange={(e) => setAdjustForm({ ...adjustForm, warehouse: e.target.value })} className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 transition-all text-apple-textDark dark:text-white font-medium">
                                        <option value="paris">Paris Sud</option>
                                        <option value="oujda">Oujda Port</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-apple-secondary uppercase tracking-widest mb-2">Quantité Physique Actuelle</label>
                                    <input required type="number" min="0" value={adjustForm.quantityPhysical} onChange={(e) => setAdjustForm({ ...adjustForm, quantityPhysical: parseInt(e.target.value) || 0 })} className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 transition-all text-apple-textDark dark:text-white font-mono font-bold" />
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 dark:border-white/5">
                                <AdminButton type="button" variant="secondary" onClick={() => setIsAdjustModalOpen(false)} className="px-6 py-3 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm">Annuler</AdminButton>
                                <AdminButton type="submit" variant="primary" className="px-8 py-3 rounded-xl shadow-lg shadow-primary/30 font-bold uppercase tracking-widest text-xs">
                                    {adjustForm.id ? 'Enregistrer' : 'Ajuster'}
                                </AdminButton>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Transfert Inter-Entrepôts Modal */}
            {isTransferModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-[#1E293B] rounded-[32px] w-full max-w-md shadow-2xl overflow-hidden border border-white/40 dark:border-white/10">
                        <div className="p-8 border-b border-gray-100 dark:border-white/5 flex justify-between items-center bg-gray-50/50 dark:bg-white/5">
                            <div>
                                <h3 className="text-2xl font-bold text-apple-textDark dark:text-white tracking-tight">
                                    Transfert Inter-Entrepôts
                                </h3>
                                <p className="text-xs text-apple-secondary mt-1">Déplacez du stock disponible entre Paris et Oujda</p>
                            </div>
                            <button type="button" onClick={() => setIsTransferModalOpen(false)} className="w-10 h-10 rounded-full hover:bg-gray-200 dark:hover:bg-white/10 flex items-center justify-center text-apple-secondary transition-all">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <form onSubmit={handleTransferStock} className="p-8">
                            <div className="flex flex-col gap-6 mb-8">
                                <div>
                                    <label className="block text-xs font-bold text-apple-secondary uppercase tracking-widest mb-2">Produit (SKU)</label>
                                    {uniqueSkus.length > 0 ? (
                                        <select
                                            required
                                            value={transferForm.sku}
                                            onChange={(e) => setTransferForm({ ...transferForm, sku: e.target.value })}
                                            className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 transition-all font-bold text-apple-textDark dark:text-white"
                                        >
                                            {uniqueSkus.map(s => (
                                                <option key={s} value={s}>{s}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <input
                                            required
                                            type="text"
                                            value={transferForm.sku}
                                            onChange={(e) => setTransferForm({ ...transferForm, sku: e.target.value })}
                                            className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 transition-all font-bold text-apple-textDark dark:text-white"
                                            placeholder="ex: NFC-CARD-V2"
                                        />
                                    )}
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-apple-secondary uppercase tracking-widest mb-2">Depuis (Source)</label>
                                        <select
                                            required
                                            value={transferForm.fromWarehouse}
                                            onChange={(e) => {
                                                const from = e.target.value;
                                                const to = from === 'paris' ? 'oujda' : 'paris';
                                                setTransferForm({ ...transferForm, fromWarehouse: from, toWarehouse: to });
                                            }}
                                            className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 transition-all text-apple-textDark dark:text-white font-medium"
                                        >
                                            <option value="paris">Paris Sud</option>
                                            <option value="oujda">Oujda Port</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-apple-secondary uppercase tracking-widest mb-2">Vers (Destination)</label>
                                        <select
                                            required
                                            value={transferForm.toWarehouse}
                                            onChange={(e) => {
                                                const to = e.target.value;
                                                const from = to === 'paris' ? 'oujda' : 'paris';
                                                setTransferForm({ ...transferForm, toWarehouse: to, fromWarehouse: from });
                                            }}
                                            className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 transition-all text-apple-textDark dark:text-white font-medium"
                                        >
                                            <option value="paris">Paris Sud</option>
                                            <option value="oujda">Oujda Port</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-apple-secondary uppercase tracking-widest mb-2">Quantité à transférer</label>
                                    <input
                                        required
                                        type="number"
                                        min="1"
                                        value={transferForm.quantity}
                                        onChange={(e) => setTransferForm({ ...transferForm, quantity: parseInt(e.target.value) || 1 })}
                                        className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 transition-all text-apple-textDark dark:text-white font-mono font-bold"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 dark:border-white/5">
                                <AdminButton type="button" variant="secondary" onClick={() => setIsTransferModalOpen(false)} className="px-6 py-3 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm">Annuler</AdminButton>
                                <AdminButton type="submit" variant="primary" className="px-8 py-3 rounded-xl shadow-lg shadow-primary/30 font-bold uppercase tracking-widest text-xs">Transférer</AdminButton>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}

