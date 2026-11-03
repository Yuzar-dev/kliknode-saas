'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { apiClient } from '@/lib/api-client';
import { AdminButton } from '@/components/ui/AdminButton';
import toast from 'react-hot-toast';

interface HardwareOrder {
    id: string;
    orderNumber: string;
    quantity: number;
    status: 'pending' | 'processing' | 'shipped' | 'delivered';
    warehouse: string;
    shippingAddress: string;
    trackingNumber: string | null;
    shippedAt: string | null;
    deliveredAt: string | null;
    createdAt: string;
    company: {
        id: string;
        name: string;
        adminEmail: string;
    };
}

interface OrderStats {
    pending: number;
    pendingCards?: number;
    inTransit: number;
    inTransitCards?: number;
    deliveredMonth: number;
    deliveredMonthCards?: number;
}

export default function HardwareOrdersPage() {
    const [orders, setOrders] = useState<HardwareOrder[]>([]);
    const [stats, setStats] = useState<OrderStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState<any>(null);

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<HardwareOrder | null>(null);
    const [companiesDropdown, setCompaniesDropdown] = useState<{id:string, name:string}[]>([]);

    const [createForm, setCreateForm] = useState({ companyId: '', quantity: 1, warehouse: 'paris', shippingAddress: '' });
    const [editForm, setEditForm] = useState({ status: 'pending', trackingNumber: '', warehouse: 'paris' });

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [ordersResponse, statsResponse] = await Promise.all([
                apiClient.get(`/api/admin/hardware-orders?page=${page}&search=${search}&status=${statusFilter}`),
                apiClient.get('/api/admin/hardware-orders/stats')
            ]);

            if (ordersResponse.data.success) {
                setOrders(ordersResponse.data.data.orders);
                setPagination(ordersResponse.data.data.pagination);
            }
            if (statsResponse.data.success) {
                setStats(statsResponse.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch hardware orders data', error);
            toast.error('Impossible de charger les commandes hardware');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const timeout = setTimeout(() => {
            fetchData();
        }, 300);
        return () => clearTimeout(timeout);
    }, [page, search, statusFilter]);

    const openCreateModal = async () => {
        setIsCreateModalOpen(true);
        if (companiesDropdown.length === 0) {
            try {
                const res = await apiClient.get('/api/admin/companies?limit=100');
                if (res.data.success) {
                    setCompaniesDropdown(res.data.data.companies || []);
                }
            } catch (err) {
                console.error(err);
            }
        }
    };

    const handleCreateOrder = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await apiClient.post('/api/admin/hardware-orders', createForm);
            if (res.data.success) {
                toast.success('Commande créée avec succès');
                setIsCreateModalOpen(false);
                setCreateForm({ companyId: '', quantity: 1, warehouse: 'paris', shippingAddress: '' });
                fetchData();
            }
        } catch (error) {
            toast.error('Erreur lors de la création de la commande');
        }
    };

    const openEditModal = (order: HardwareOrder) => {
        setSelectedOrder(order);
        setEditForm({
            status: order.status,
            trackingNumber: order.trackingNumber || '',
            warehouse: order.warehouse
        });
        setIsEditModalOpen(true);
    };

    const handleEditOrder = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedOrder) return;
        try {
            const res = await apiClient.patch(`/api/admin/hardware-orders/${selectedOrder.id}`, editForm);
            if (res.data.success) {
                toast.success('Commande mise à jour');
                setIsEditModalOpen(false);
                fetchData();
            }
        } catch (error) {
            toast.error('Erreur lors de la mise à jour');
        }
    };

    const handleDeleteOrder = async (order: HardwareOrder) => {
        if (!confirm(`Voulez-vous vraiment supprimer la commande #${order.orderNumber} (${order.company.name}) ?`)) {
            return;
        }
        try {
            const res = await apiClient.delete(`/api/admin/hardware-orders/${order.id}`);
            if (res.data.success) {
                toast.success(`Commande #${order.orderNumber} supprimée`);
                fetchData();
            }
        } catch (error) {
            toast.error('Erreur lors de la suppression de la commande');
        }
    };

    const handleExportOrders = async () => {
        try {
            const res = await apiClient.get(`/api/admin/hardware-orders?page=1&limit=1000&search=${search}&status=${statusFilter}`);
            const list: HardwareOrder[] = res.data?.data?.orders || orders;
            if (!list || list.length === 0) {
                toast.error('Aucune commande à exporter');
                return;
            }
            const header = 'NumeroCommande,Client,EmailClient,Entrepot,Quantite,Statut,NumeroSuivi,AdresseLivraison,DateCreation\n';
            const rows = list.map(o =>
                `"${o.orderNumber}","${(o.company?.name || '').replace(/"/g, '""')}","${o.company?.adminEmail || ''}","${o.warehouse === 'paris' ? 'Paris Sud' : 'Oujda Port'}",${o.quantity},"${getStatusLabel(o.status)}","${o.trackingNumber || ''}","${(o.shippingAddress || '').replace(/"/g, '""').replace(/\n/g, ' ')}","${new Date(o.createdAt).toISOString()}"`
            ).join('\n');

            const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `commandes-hardware-${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
            URL.revokeObjectURL(url);
            toast.success(`${list.length} commande(s) exportée(s) en CSV`);
        } catch (error) {
            toast.error('Erreur lors de l\'exportation des commandes');
        }
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'pending':
                return 'bg-amber-100 text-amber-800 border-amber-200';
            case 'processing':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'shipped':
                return 'bg-primary/10 text-primary border-primary/20';
            case 'delivered':
                return 'bg-emerald-100 text-emerald-800 border-emerald-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'pending': return 'À préparer';
            case 'processing': return 'En cours';
            case 'shipped': return 'Expédié';
            case 'delivered': return 'Livré';
            default: return status;
        }
    };

    return (
        <AdminLayout>
            <div className="flex flex-col gap-10 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <nav className="flex items-center gap-2 text-[10px] font-bold text-apple-secondary uppercase tracking-[0.2em] mb-4">
                            <span className="opacity-40">Logistique</span>
                            <span className="opacity-20">/</span>
                            <span className="text-apple-textDark dark:text-white">Commandes Hardware</span>
                        </nav>
                        <h2 className="text-4xl font-bold text-apple-textDark dark:text-white tracking-tight">Commandes Hardware</h2>
                        <p className="text-apple-secondary mt-1 font-medium">Gérez les demandes de matériel et les expéditions.</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="relative group">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-apple-secondary group-focus-within:text-primary transition-colors">search</span>
                            <input
                                type="text"
                                placeholder="Rechercher une commande..."
                                value={search}
                                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                                className="pl-10 pr-4 py-3 bg-white/50 dark:bg-white/5 border border-white/40 dark:border-white/10 rounded-2xl focus:ring-2 focus:ring-primary/20 transition-all font-medium text-sm w-72 placeholder-klik-secondary"
                            />
                        </div>
                        <AdminButton onClick={handleExportOrders} variant="primary" className="px-6 py-3 rounded-full shadow-lg flex items-center gap-2 hover:scale-105 transition-transform">
                            <span className="material-symbols-outlined text-lg">download</span>
                            Exporter
                        </AdminButton>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-white/80 dark:bg-white/5 rounded-[32px] p-8 border border-white/60 dark:border-white/10 shadow-sm flex items-start justify-between transition-all hover:translate-y-[-2px] hover:shadow-xl">
                        <div>
                            <p className="text-[11px] font-bold text-apple-secondary uppercase tracking-[0.2em] mb-2 opacity-60">À préparer</p>
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-3xl font-bold text-apple-textDark dark:text-white">{stats?.pending ?? 0}</h3>
                                <span className="text-xs font-bold text-apple-secondary">cmd(s)</span>
                            </div>
                            <p className="text-[11px] font-bold text-amber-600 mt-1.5">
                                {stats?.pendingCards ?? 0} carte(s) réservée(s) en stock
                            </p>
                        </div>
                        <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-2xl">
                            <span className="material-symbols-outlined text-amber-600 text-3xl">pending_actions</span>
                        </div>
                    </div>

                    <div className="bg-white/80 dark:bg-white/5 rounded-[32px] p-8 border border-white/60 dark:border-white/10 shadow-sm flex items-start justify-between transition-all hover:translate-y-[-2px] hover:shadow-xl">
                        <div>
                            <p className="text-[11px] font-bold text-apple-secondary uppercase tracking-[0.2em] mb-2 opacity-60">En transit</p>
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-3xl font-bold text-apple-textDark dark:text-white">{stats?.inTransit ?? 0}</h3>
                                <span className="text-xs font-bold text-apple-secondary">cmd(s)</span>
                            </div>
                            <p className="text-[11px] font-bold text-blue-600 mt-1.5">
                                {stats?.inTransitCards ?? 0} carte(s) expédiée(s)
                            </p>
                        </div>
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl">
                            <span className="material-symbols-outlined text-blue-600 text-3xl">local_shipping</span>
                        </div>
                    </div>

                    <div className="bg-white/80 dark:bg-white/5 rounded-[32px] p-8 border border-white/60 dark:border-white/10 shadow-sm flex items-start justify-between transition-all hover:translate-y-[-2px] hover:shadow-xl">
                        <div>
                            <p className="text-[11px] font-bold text-apple-secondary uppercase tracking-[0.2em] mb-2 opacity-60">Livrées (Mois)</p>
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-3xl font-bold text-apple-textDark dark:text-white">{stats?.deliveredMonth ?? 0}</h3>
                                <span className="text-xs font-bold text-apple-secondary">cmd(s)</span>
                            </div>
                            <p className="text-[11px] font-bold text-emerald-600 mt-1.5">
                                {stats?.deliveredMonthCards ?? 0} carte(s) livrée(s)
                            </p>
                        </div>
                        <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl">
                            <span className="material-symbols-outlined text-emerald-600 text-3xl">check_circle</span>
                        </div>
                    </div>

                    <div onClick={openCreateModal} className="bg-primary rounded-[32px] p-8 shadow-xl flex flex-col justify-center items-center text-center text-white group cursor-pointer hover:bg-zinc-800 transition-all">
                        <p className="font-bold mb-4 uppercase text-[11px] tracking-[0.2em] opacity-80">Nouvelle Demande</p>
                        <button className="bg-white/20 hover:bg-white/30 backdrop-blur-md px-8 py-3 rounded-full text-sm font-bold transition-all flex items-center gap-2 pointer-events-none">
                            <span className="material-symbols-outlined">add</span>
                            Créer
                        </button>
                    </div>
                </div>

                {/* Filter Bar & Table */}
                <div className="bg-white/70 dark:bg-white/5 backdrop-blur-md border border-white/80 dark:border-white/10 rounded-[32px] shadow-sm overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-gray-100/10 dark:border-white/10 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            {['', 'pending', 'shipped', 'delivered'].map((f) => (
                                <button
                                    key={f}
                                    onClick={() => { setStatusFilter(f); setPage(1); }}
                                    className={`px-6 py-2.5 text-xs font-bold rounded-full transition-all uppercase tracking-widest ${statusFilter === f
                                            ? 'bg-primary text-white shadow-lg'
                                            : 'text-apple-secondary hover:text-primary'
                                        }`}
                                >
                                    {f === '' ? 'Tous' : getStatusLabel(f)}
                                </button>
                            ))}
                        </div>
                        <div>
                            <select className="bg-white/50 dark:bg-white/5 border-0 text-xs font-bold uppercase tracking-widest rounded-2xl py-3 pl-5 pr-12 focus:ring-2 focus:ring-primary/20 ring-1 ring-black/5 dark:ring-white/5 outline-none">
                                <option>Derniers 30 jours</option>
                                <option>Cette semaine</option>
                                <option>Aujourd'hui</option>
                            </select>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 dark:bg-white/5 border-b border-gray-100/10 dark:border-white/5 text-[11px] font-bold text-apple-secondary uppercase tracking-[0.2em] opacity-60">
                                    <th className="px-8 py-5 w-12">
                                        <input type="checkbox" className="rounded-lg border-slate-200 text-primary focus:ring-primary/20 h-5 w-5 bg-white/50" />
                                    </th>
                                    <th className="px-6 py-5">Commande</th>
                                    <th className="px-6 py-5">Client</th>
                                    <th className="px-6 py-5">Article / Entrepôt</th>
                                    <th className="px-6 py-5 text-center">Qté</th>
                                    <th className="px-6 py-5">Status</th>
                                    <th className="px-6 py-5">Date</th>
                                    <th className="px-8 py-5 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100/10 dark:divide-white/5">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={8} className="px-8 py-20 text-center">
                                            <div className="flex flex-col items-center gap-4">
                                                <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                                                <p className="text-apple-secondary font-medium animate-pulse">Chargement des commandes...</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : orders.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="px-8 py-20 text-center text-apple-secondary font-medium">
                                            Aucune commande trouvée.
                                        </td>
                                    </tr>
                                ) : (
                                    orders.map((order) => (
                                        <tr key={order.id} className="group hover:bg-white/40 dark:hover:bg-white/5 transition-all duration-300">
                                            <td className="px-8 py-4">
                                                <input type="checkbox" className="rounded-lg border-slate-200 text-primary focus:ring-primary/20 h-5 w-5 bg-white/50" />
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm font-bold text-apple-textDark dark:text-white tracking-tight">#{order.orderNumber}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-9 w-9 rounded-full bg-primary/5 text-primary flex items-center justify-center text-xs font-bold border border-primary/10">
                                                        {order.company.name.substring(0, 2).toUpperCase()}
                                                    </div>
                                                    <div className="text-sm font-semibold text-apple-textDark dark:text-white">{order.company.name}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-apple-textDark dark:text-white">NFC Card Premium</span>
                                                    <span className="text-[10px] font-bold text-apple-secondary uppercase tracking-widest opacity-60">
                                                        {order.warehouse === 'paris' ? 'Paris Sud' : 'Oujda Port'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="text-sm font-bold text-apple-textDark dark:text-white">{order.quantity}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border ${getStatusStyle(order.status)}`}>
                                                    {getStatusLabel(order.status)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm font-medium text-apple-secondary">
                                                {new Date(order.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </td>
                                            <td className="px-8 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button onClick={() => window.print()} className="p-2.5 text-apple-secondary hover:text-primary bg-white dark:bg-white/10 shadow-sm border border-black/5 dark:border-white/5 rounded-full transition-all hover:scale-110 active:scale-90 cursor-pointer" title="Imprimer Bon de Livraison">
                                                        <span className="material-symbols-outlined text-[20px]">print</span>
                                                    </button>
                                                    <button onClick={() => openEditModal(order)} className="p-2.5 text-apple-secondary hover:text-amber-500 bg-white dark:bg-white/10 shadow-sm border border-black/5 dark:border-white/5 rounded-full transition-all hover:scale-110 active:scale-90 cursor-pointer" title="Modifier la commande">
                                                        <span className="material-symbols-outlined text-[20px]">edit</span>
                                                    </button>
                                                    <button onClick={() => handleDeleteOrder(order)} className="p-2.5 text-apple-secondary hover:text-rose-500 bg-white dark:bg-white/10 shadow-sm border border-black/5 dark:border-white/5 rounded-full transition-all hover:scale-110 active:scale-90 cursor-pointer" title="Supprimer la commande">
                                                        <span className="material-symbols-outlined text-[20px]">delete</span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>


                    {/* Pagination */}
                    {pagination && pagination.totalPages > 1 && (
                        <div className="px-8 py-6 border-t border-gray-100/10 dark:border-white/5 flex items-center justify-between">
                            <p className="text-[11px] font-bold text-apple-secondary uppercase tracking-[0.2em] opacity-40">
                                Affichage de {orders.length} sur {pagination.total} commandes
                            </p>
                            <div className="flex items-center gap-2">
                                <AdminButton
                                    variant="secondary"
                                    className="p-2.5 rounded-full border border-black/5 dark:border-white/5 bg-white dark:bg-white/10 disabled:opacity-30"
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                >
                                    <span className="material-symbols-outlined">chevron_left</span>
                                </AdminButton>
                                <AdminButton
                                    variant="secondary"
                                    className="p-2.5 rounded-full border border-black/5 dark:border-white/5 bg-white dark:bg-white/10 disabled:opacity-30"
                                    onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                                    disabled={page === pagination.totalPages}
                                >
                                    <span className="material-symbols-outlined">chevron_right</span>
                                </AdminButton>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex justify-center pb-10">
                    <p className="text-[10px] font-bold text-apple-secondary uppercase tracking-[0.2em] opacity-40 flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">info</span>
                        Les commandes marquées comme "Livrées" sont archivées automatiquement après 30 jours.
                    </p>
                </div>
            </div>

            {/* Create Order Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-[#1E293B] rounded-[32px] w-full max-w-xl shadow-2xl overflow-hidden border border-white/40 dark:border-white/10">
                        <div className="p-8 border-b border-gray-100 dark:border-white/5 flex justify-between items-center bg-gray-50/50 dark:bg-white/5">
                            <h3 className="text-2xl font-bold text-apple-textDark dark:text-white tracking-tight">
                                Nouvelle Commande Hardware
                            </h3>
                            <button type="button" onClick={() => setIsCreateModalOpen(false)} className="w-10 h-10 rounded-full hover:bg-gray-200 dark:hover:bg-white/10 flex items-center justify-center text-apple-secondary transition-all">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <form onSubmit={handleCreateOrder} className="p-8">
                            <div className="flex flex-col gap-6 mb-8">
                                <div>
                                    <label className="block text-xs font-bold text-apple-secondary uppercase tracking-widest mb-2">Entreprise (Client)</label>
                                    <select required value={createForm.companyId} onChange={(e) => setCreateForm({...createForm, companyId: e.target.value})} className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 transition-all text-apple-textDark dark:text-white font-medium">
                                        <option value="">Sélectionnez un client</option>
                                        {companiesDropdown.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-xs font-bold text-apple-secondary uppercase tracking-widest mb-2">Quantité</label>
                                        <input type="number" min="1" required value={createForm.quantity} onChange={(e) => setCreateForm({...createForm, quantity: parseInt(e.target.value) || 1})} className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 transition-all text-apple-textDark dark:text-white font-mono font-bold" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-apple-secondary uppercase tracking-widest mb-2">Entrepôt source</label>
                                        <select required value={createForm.warehouse} onChange={(e) => setCreateForm({...createForm, warehouse: e.target.value})} className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 transition-all text-apple-textDark dark:text-white">
                                            <option value="paris">Paris Sud</option>
                                            <option value="oujda">Oujda Port</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-apple-secondary uppercase tracking-widest mb-2">Adresse de livraison</label>
                                    <textarea required value={createForm.shippingAddress} onChange={(e) => setCreateForm({...createForm, shippingAddress: e.target.value})} className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 transition-all text-apple-textDark dark:text-white min-h-[80px]"></textarea>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 dark:border-white/5">
                                <AdminButton type="button" variant="secondary" onClick={() => setIsCreateModalOpen(false)} className="px-6 py-3 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm">Annuler</AdminButton>
                                <AdminButton type="submit" variant="primary" className="px-8 py-3 rounded-xl shadow-lg shadow-primary/30 font-bold uppercase tracking-widest text-xs">Créer Commande</AdminButton>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Order Modal */}
            {isEditModalOpen && selectedOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-[#1E293B] rounded-[32px] w-full max-w-md shadow-2xl overflow-hidden border border-white/40 dark:border-white/10">
                        <div className="p-8 border-b border-gray-100 dark:border-white/5 flex justify-between items-center bg-gray-50/50 dark:bg-white/5">
                            <h3 className="text-2xl font-bold text-apple-textDark dark:text-white tracking-tight">
                                Mettre à jour #{selectedOrder.orderNumber}
                            </h3>
                            <button type="button" onClick={() => setIsEditModalOpen(false)} className="w-10 h-10 rounded-full hover:bg-gray-200 dark:hover:bg-white/10 flex items-center justify-center text-apple-secondary transition-all">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <form onSubmit={handleEditOrder} className="p-8">
                            <div className="flex flex-col gap-6 mb-8">
                                <div>
                                    <label className="block text-xs font-bold text-apple-secondary uppercase tracking-widest mb-2">Statut de la commande</label>
                                    <select required value={editForm.status} onChange={(e) => setEditForm({...editForm, status: e.target.value})} className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 transition-all text-apple-textDark dark:text-white font-medium">
                                        <option value="pending">À préparer</option>
                                        <option value="processing">En cours</option>
                                        <option value="shipped">Expédié</option>
                                        <option value="delivered">Livré</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-apple-secondary uppercase tracking-widest mb-2">Numéro de suivi (Tracking)</label>
                                    <input type="text" value={editForm.trackingNumber} onChange={(e) => setEditForm({...editForm, trackingNumber: e.target.value})} className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 transition-all text-apple-textDark dark:text-white font-mono" placeholder="ex: 1Z9999999999999999" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-apple-secondary uppercase tracking-widest mb-2">Entrepôt assigné</label>
                                    <select required value={editForm.warehouse} onChange={(e) => setEditForm({...editForm, warehouse: e.target.value})} className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 transition-all text-apple-textDark dark:text-white">
                                        <option value="paris">Paris Sud</option>
                                        <option value="oujda">Oujda Port</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 dark:border-white/5">
                                <AdminButton type="button" variant="secondary" onClick={() => setIsEditModalOpen(false)} className="px-6 py-3 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm">Annuler</AdminButton>
                                <AdminButton type="submit" variant="primary" className="px-8 py-3 rounded-xl shadow-lg shadow-primary/30 font-bold uppercase tracking-widest text-xs">Mettre à jour</AdminButton>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
