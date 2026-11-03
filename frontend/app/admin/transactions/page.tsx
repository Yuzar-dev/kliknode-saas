'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { apiClient } from '@/lib/api-client';
import { AdminButton } from '@/components/ui/AdminButton';
import toast from 'react-hot-toast';

interface Transaction {
    id: string;
    amount: string;
    currency: string;
    status: string;
    paymentMethod: string;
    invoiceNumber: string;
    invoicePdfUrl?: string | null;
    notes?: string | null;
    createdAt: string;
    company: {
        name: string;
    };
}

interface Stats {
    totalRevenue: number;
    pendingCount: number;
    failedAmount: number;
    failedCount: number;
}

export default function TransactionsPage() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState<any>(null);
    const [sortOrder, setSortOrder] = useState('desc');
    const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [companiesDropdown, setCompaniesDropdown] = useState<{id:string, name:string}[]>([]);
    const [invoiceForm, setInvoiceForm] = useState({
        companyId: '',
        amount: '',
        currency: 'EUR',
        paymentMethod: 'stripe',
        notes: ''
    });
    const [generatedPaymentLink, setGeneratedPaymentLink] = useState<string | null>(null);
    const [isCreatingInvoice, setIsCreatingInvoice] = useState(false);

    // Stripe Keys Config Modal
    const [isStripeModalOpen, setIsStripeModalOpen] = useState(false);
    const [stripeStatus, setStripeStatus] = useState<{
        isConfigured: boolean;
        mode: string;
        publishableKey: string;
        maskedSecretKey: string;
    }>({ isConfigured: false, mode: 'unconfigured', publishableKey: '', maskedSecretKey: '' });
    const [stripeForm, setStripeForm] = useState({ secretKey: '', publishableKey: '', webhookSecret: '' });
    const [isSavingStripe, setIsSavingStripe] = useState(false);

    const fetchStripeStatus = async () => {
        try {
            const res = await apiClient.get('/api/admin/transactions/stripe-config');
            if (res.data.success && res.data.data) {
                setStripeStatus(res.data.data);
                setStripeForm(prev => ({
                    ...prev,
                    publishableKey: res.data.data.publishableKey || ''
                }));
            }
        } catch {}
    };

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [txResponse, statsResponse] = await Promise.all([
                apiClient.get(`/api/admin/transactions?page=${page}&status=${filter}&search=${search}&sort=${sortOrder}`),
                apiClient.get('/api/admin/transactions/stats')
            ]);

            if (txResponse.data.success) {
                setTransactions(txResponse.data.data.transactions);
                setPagination(txResponse.data.data.pagination);
            }
            if (statsResponse.data.success) {
                setStats(statsResponse.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch transactions data', error);
            toast.error('Impossible de charger les données');
        } finally {
            setIsLoading(false);
        }
    };

    const openModal = async () => {
        setGeneratedPaymentLink(null);
        setIsModalOpen(true);
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

    const handleCreateInvoice = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsCreatingInvoice(true);
        try {
            const res = await apiClient.post('/api/admin/transactions/invoice', invoiceForm);
            if (res.data.success) {
                const paymentUrl = res.data.data?.paymentUrl || res.data.data?.invoicePdfUrl;
                if (paymentUrl) {
                    setGeneratedPaymentLink(paymentUrl);
                    navigator.clipboard.writeText(paymentUrl).catch(() => {});
                    toast.success('Lien de paiement Stripe généré et copié !');
                } else {
                    toast.success('Facture créée avec succès');
                    setIsModalOpen(false);
                }
                setInvoiceForm({ companyId: '', amount: '', currency: 'EUR', paymentMethod: 'stripe', notes: '' });
                fetchData();
            }
        } catch (error: any) {
            toast.error(error.response?.data?.error?.message || 'Erreur lors de la génération de la facture');
        } finally {
            setIsCreatingInvoice(false);
        }
    };

    const handleSaveStripeKeys = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSavingStripe(true);
        try {
            const res = await apiClient.post('/api/admin/transactions/stripe-config', stripeForm);
            if (res.data.success) {
                setStripeStatus(res.data.data);
                setStripeForm(prev => ({ ...prev, secretKey: '' }));
                toast.success('Clés Stripe connectées avec succès !');
                setIsStripeModalOpen(false);
            }
        } catch (err: any) {
            toast.error(err.response?.data?.error?.message || 'Erreur lors de la sauvegarde Stripe');
        } finally {
            setIsSavingStripe(false);
        }
    };

    const handleGeneratePaymentLinkForTx = async (tx: Transaction) => {
        setOpenDropdownId(null);
        if (tx.invoicePdfUrl && tx.invoicePdfUrl.startsWith('http')) {
            await navigator.clipboard.writeText(tx.invoicePdfUrl);
            toast.success('Lien de paiement Stripe copié dans le presse-papiers !');
            return;
        }
        const loadingToast = toast.loading('Génération du lien Stripe...');
        try {
            const res = await apiClient.post(`/api/admin/transactions/${tx.id}/payment-link`);
            toast.dismiss(loadingToast);
            if (res.data.success && res.data.data?.paymentUrl) {
                await navigator.clipboard.writeText(res.data.data.paymentUrl);
                toast.success('Lien Stripe généré et copié dans le presse-papiers !');
                fetchData();
            }
        } catch (err: any) {
            toast.dismiss(loadingToast);
            toast.error(err.response?.data?.error?.message || 'Veuillez d\'abord configurer votre clé Stripe');
            setIsStripeModalOpen(true);
        }
    };

    const handleMarkAsPaid = async (txId: string) => {
        setOpenDropdownId(null);
        try {
            const res = await apiClient.patch(`/api/admin/transactions/${txId}/status`, { status: 'succeeded' });
            if (res.data.success) {
                toast.success('Facture marquée comme Payée !');
                fetchData();
            }
        } catch {
            toast.error('Erreur lors de la validation du paiement');
        }
    };

    useEffect(() => {
        fetchStripeStatus();
    }, []);

    useEffect(() => {
        const timeout = setTimeout(() => {
            fetchData();
        }, 300);
        return () => clearTimeout(timeout);
    }, [page, filter, search, sortOrder]);

    const handleActionClick = (id: string) => {
        setOpenDropdownId(openDropdownId === id ? null : id);
    };

    const handleRefund = async (id: string) => {
        if (!confirm('Êtes-vous sûr de vouloir rembourser cette transaction ?')) return;
        try {
            const res = await apiClient.post(`/api/admin/transactions/${id}/refund`);
            if (res.data.success) {
                toast.success('Remboursement initié avec succès');
                fetchData();
            }
        } catch (error) {
            toast.error('Erreur lors du remboursement');
        }
        setOpenDropdownId(null);
    };

    const downloadInvoice = (tx: Transaction) => {
        if (tx.invoicePdfUrl) {
            window.open(tx.invoicePdfUrl, '_blank');
        } else {
            toast.error('Aucune facture PDF disponible pour cette transaction');
        }
        setOpenDropdownId(null);
    };

    const getStatusStyles = (status: string) => {
        switch (status) {
            case 'succeeded':
                return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
            case 'pending':
                return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
            case 'failed':
                return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
            case 'refunded':
                return 'bg-slate-500/10 text-apple-secondary border-slate-500/20';
            default:
                return 'bg-slate-100 text-slate-500 border-slate-200';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'succeeded': return 'Succès';
            case 'pending': return 'En attente';
            case 'failed': return 'Échoué';
            case 'refunded': return 'Remboursé';
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
                            <span className="opacity-40">Finance & Plans</span>
                            <span className="opacity-20">/</span>
                            <span className="text-apple-textDark dark:text-white">Transactions & Factures</span>
                        </nav>
                        <h2 className="text-4xl font-bold text-apple-textDark dark:text-white tracking-tight">Historique de Facturation</h2>
                        <p className="text-apple-secondary mt-1 font-medium">Gérez vos revenus, les factures en attente et les rapports financiers.</p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <AdminButton
                            onClick={() => setIsStripeModalOpen(true)}
                            variant="secondary"
                            className="px-6 rounded-full flex items-center gap-2 border border-white/40 dark:border-white/10"
                        >
                            <span className={`w-2.5 h-2.5 rounded-full ${stripeStatus.isConfigured ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-amber-500'}`} />
                            <span className="material-symbols-outlined text-[18px]">key</span>
                            {stripeStatus.isConfigured
                                ? `Stripe Connecté (${stripeStatus.mode.toUpperCase()})`
                                : 'Configurer Clés Stripe'}
                        </AdminButton>
                        <AdminButton onClick={openModal} variant="primary" className="px-8 rounded-full shadow-xl shadow-primary/20 flex items-center gap-2">
                            <span className="material-symbols-outlined text-[20px]">add_link</span>
                            Créer Facture / Lien Paiement Stripe
                        </AdminButton>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="klik-glass p-8 rounded-[32px] border border-white/40 dark:border-white/5 shadow-sm transition-all hover:translate-y-[-2px] hover:shadow-xl">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-[11px] font-bold text-apple-secondary uppercase tracking-[0.2em] opacity-60">Revenu Global</span>
                            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                <span className="material-symbols-outlined text-2xl">payments</span>
                            </div>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-bold text-apple-textDark dark:text-white tracking-tight">
                                {stats ? `${(stats.totalRevenue).toLocaleString('fr-FR')}€` : '0€'}
                            </span>
                            <span className="text-xs font-bold text-emerald-500 uppercase tracking-widest">+12%</span>
                        </div>
                    </div>

                    <div className="klik-glass p-8 rounded-[32px] border border-white/40 dark:border-white/5 shadow-sm transition-all hover:translate-y-[-2px] hover:shadow-xl">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-[11px] font-bold text-apple-secondary uppercase tracking-[0.2em] opacity-60">Factures en Attente</span>
                            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                                <span className="material-symbols-outlined text-2xl">pending_actions</span>
                            </div>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-bold text-apple-textDark dark:text-white tracking-tight">{stats?.pendingCount || 0}</span>
                            <span className="text-xs font-bold text-amber-500 uppercase tracking-widest px-2 py-1 bg-amber-500/5 rounded-full">Traitement direct requis</span>
                        </div>
                    </div>

                    <div className="klik-glass p-8 rounded-[32px] border border-white/40 dark:border-white/5 shadow-sm transition-all hover:translate-y-[-2px] hover:shadow-xl">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-[11px] font-bold text-apple-secondary uppercase tracking-[0.2em] opacity-60">Échecs de Txn</span>
                            <div className="w-10 h-10 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-500">
                                <span className="material-symbols-outlined text-2xl">error</span>
                            </div>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-bold text-apple-textDark dark:text-white tracking-tight">
                                {stats ? `${(stats.failedAmount).toLocaleString('fr-FR')}€` : '0€'}
                            </span>
                            <span className="text-xs font-bold text-rose-500 uppercase tracking-widest">{stats?.failedCount || 0} échecs</span>
                        </div>
                    </div>
                </div>

                {/* Filters Section */}
                <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
                    <div className="flex p-1.5 space-x-1 bg-black/5 dark:bg-white/5 rounded-[24px] w-full lg:w-auto overflow-x-auto no-scrollbar">
                        {[
                            { id: 'all', label: 'Toutes' },
                            { id: 'succeeded', label: 'Succès' },
                            { id: 'pending', label: 'En attente' },
                            { id: 'failed', label: 'Échecs' },
                            { id: 'refunded', label: 'Remboursées' },
                        ].map((btn) => (
                            <button
                                key={btn.id}
                                onClick={() => { setFilter(btn.id); setPage(1); }}
                                className={`px-6 py-2 text-sm font-semibold rounded-[20px] transition-all whitespace-nowrap ${filter === btn.id
                                        ? 'bg-white dark:bg-white/10 text-apple-textDark dark:text-white shadow-sm'
                                        : 'text-apple-secondary hover:text-apple-textDark dark:hover:text-white'
                                    }`}
                            >
                                {btn.label}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-4 w-full lg:w-auto">
                        <div className="relative flex-1 lg:w-72 group">
                            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-apple-secondary group-focus-within:text-primary transition-colors">search</span>
                            <input
                                type="text"
                                placeholder="ID, Client, Facture..."
                                value={search}
                                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                                className="w-full pl-11 pr-4 py-3 bg-white/50 dark:bg-white/5 border border-white/40 dark:border-white/10 rounded-2xl focus:ring-2 focus:ring-primary/20 transition-all font-medium text-sm"
                            />
                        </div>
                        <AdminButton onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')} variant={sortOrder === 'asc' ? "primary" : "secondary"} className="px-5 rounded-xl border border-white/40 dark:border-white/10 flex items-center gap-2 transition-all">
                            <span className="material-symbols-outlined text-[20px]">
                                {sortOrder === 'desc' ? 'arrow_downward' : 'arrow_upward'}
                            </span>
                            Date
                        </AdminButton>
                    </div>
                </div>

                {/* Data Table */}
                <div className="klik-glass rounded-[32px] overflow-visible shadow-2xl shadow-slate-200/50 dark:shadow-none border-white/40 dark:border-white/5">
                    <div className="overflow-visible">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-gray-200/40 dark:border-white/5 bg-white/30 dark:bg-white/5">
                                    <th className="px-8 py-6 text-[11px] font-bold text-apple-secondary uppercase tracking-[0.2em] opacity-60">ID Transaction</th>
                                    <th className="px-6 py-6 text-[11px] font-bold text-apple-secondary uppercase tracking-[0.2em] opacity-60">Client / Plan</th>
                                    <th className="px-6 py-6 text-[11px] font-bold text-apple-secondary uppercase tracking-[0.2em] opacity-60 text-right">Montant</th>
                                    <th className="px-6 py-6 text-[11px] font-bold text-apple-secondary uppercase tracking-[0.2em] opacity-60">Méthode</th>
                                    <th className="px-6 py-6 text-[11px] font-bold text-apple-secondary uppercase tracking-[0.2em] opacity-60 text-center">Statut</th>
                                    <th className="px-6 py-6 text-[11px] font-bold text-apple-secondary uppercase tracking-[0.2em] opacity-60">Date</th>
                                    <th className="px-8 py-6 text-[11px] font-bold text-apple-secondary uppercase tracking-[0.2em] opacity-60 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100/10 dark:divide-white/5">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={7} className="px-8 py-20 text-center">
                                            <div className="flex flex-col items-center gap-4">
                                                <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                                                <p className="text-apple-secondary font-medium animate-pulse">Chargement des transactions...</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : transactions.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-8 py-20 text-center text-apple-secondary font-medium">
                                            Aucune transaction trouvée.
                                        </td>
                                    </tr>
                                ) : (
                                    transactions.map((tx) => (
                                        <tr key={tx.id} className="hover:bg-white/40 dark:hover:bg-white/5 transition-all duration-300 group cursor-default">
                                            <td className="px-8 py-5">
                                                <span className="text-xs font-bold font-mono text-primary/60 dark:text-white/40">#{tx.id.split('-')[0].toUpperCase()}</span>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary dark:text-white font-bold text-[10px]">
                                                        {tx.company.name.charAt(0)}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="font-bold text-apple-textDark dark:text-white truncate tracking-tight">{tx.company.name}</p>
                                                        <p className="text-[10px] font-medium text-apple-secondary truncate uppercase tracking-tighter">Enterprise Plan</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-right font-mono font-bold text-sm text-apple-textDark dark:text-white">
                                                {parseFloat(tx.amount).toLocaleString('fr-FR', { style: 'currency', currency: tx.currency })}
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-2 text-apple-secondary">
                                                    <span className="material-symbols-outlined text-lg">
                                                        {tx.paymentMethod === 'stripe' ? 'credit_card' : 'account_balance'}
                                                    </span>
                                                    <span className="text-xs font-semibold">{tx.paymentMethod === 'stripe' ? 'Stripe' : 'Virement'}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-center">
                                                <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusStyles(tx.status)}`}>
                                                    {getStatusLabel(tx.status)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className="text-xs font-medium text-apple-secondary">
                                                    {new Date(tx.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5 text-right relative">
                                                <button onClick={() => handleActionClick(tx.id)} className="w-9 h-9 rounded-xl hover:bg-white dark:hover:bg-white/10 flex items-center justify-center text-apple-secondary hover:text-primary transition-all shadow-sm">
                                                    <span className="material-symbols-outlined text-[20px]">more_horiz</span>
                                                </button>
                                                
                                                {openDropdownId === tx.id && (
                                                    <div className="absolute right-8 top-12 z-50 w-56 bg-white dark:bg-[#1E293B] rounded-2xl shadow-xl border border-gray-100 dark:border-white/10 overflow-hidden animate-in fade-in zoom-in duration-200">
                                                        <div className="flex flex-col text-left">
                                                            <button onClick={() => handleGeneratePaymentLinkForTx(tx)} className="w-full px-4 py-3 text-xs font-bold text-primary hover:bg-primary/5 flex items-center gap-2 transition-colors">
                                                                <span className="material-symbols-outlined text-[18px]">link</span>
                                                                {tx.invoicePdfUrl ? 'Copier Lien Stripe' : 'Générer Lien Stripe'}
                                                            </button>
                                                            {tx.status === 'pending' && (
                                                                <button onClick={() => handleMarkAsPaid(tx.id)} className="w-full px-4 py-3 text-xs font-bold text-emerald-500 hover:bg-emerald-500/10 flex items-center gap-2 transition-colors border-t border-gray-100 dark:border-white/5">
                                                                    <span className="material-symbols-outlined text-[18px]">check_circle</span>
                                                                    Marquer comme Payée
                                                                </button>
                                                            )}
                                                            <button onClick={() => downloadInvoice(tx)} className="w-full px-4 py-3 text-xs font-semibold text-apple-textDark dark:text-white hover:bg-gray-50 dark:hover:bg-white/5 flex items-center gap-2 transition-colors border-t border-gray-100 dark:border-white/5">
                                                                <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                                                                Ouvrir Lien / Facture
                                                            </button>
                                                            <button onClick={() => handleRefund(tx.id)} className="w-full px-4 py-3 text-xs font-semibold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 flex items-center gap-2 transition-colors border-t border-gray-100 dark:border-white/5">
                                                                <span className="material-symbols-outlined text-[18px]">restart_alt</span>
                                                                Rembourser
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))
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
                                Précédent
                            </AdminButton>
                            <AdminButton
                                variant="secondary"
                                className="px-4 py-2 rounded-xl disabled:opacity-30"
                                onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                                disabled={page === pagination.totalPages}
                            >
                                Suivant
                            </AdminButton>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal de génération de facture / Lien de paiement Stripe */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-[#1E293B] rounded-[32px] w-full max-w-xl shadow-2xl overflow-hidden border border-white/40 dark:border-white/10">
                        <div className="p-8 border-b border-gray-100 dark:border-white/5 flex justify-between items-center bg-gray-50/50 dark:bg-white/5">
                            <div>
                                <h3 className="text-2xl font-bold text-apple-textDark dark:text-white tracking-tight">
                                    Facturation & Lien Stripe B2B
                                </h3>
                                <p className="text-xs text-apple-secondary mt-1">
                                    Créez une facture pour un client Pro et obtenez un lien de paiement Stripe à lui envoyer.
                                </p>
                            </div>
                            <button type="button" onClick={() => setIsModalOpen(false)} className="w-10 h-10 rounded-full hover:bg-gray-200 dark:hover:bg-white/10 flex items-center justify-center text-apple-secondary transition-all">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        {generatedPaymentLink ? (
                            <div className="p-8 space-y-6">
                                <div className="p-6 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 space-y-3">
                                    <div className="flex items-center gap-2 text-emerald-500 font-bold text-sm">
                                        <span className="material-symbols-outlined">check_circle</span>
                                        Lien de paiement Stripe prêt à envoyer au client !
                                    </div>
                                    <p className="text-xs text-apple-secondary">
                                        Envoyez ce lien par WhatsApp ou Email à votre client Pro. Il pourra régler par Carte Bancaire ou Apple Pay :
                                    </p>
                                    <div className="flex items-center gap-2 bg-white dark:bg-black/30 p-3 rounded-xl border border-emerald-500/20">
                                        <input
                                            type="text"
                                            readOnly
                                            value={generatedPaymentLink}
                                            className="w-full bg-transparent text-xs font-mono text-apple-textDark dark:text-white outline-none"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                navigator.clipboard.writeText(generatedPaymentLink);
                                                toast.success('Lien Stripe copié !');
                                            }}
                                            className="px-4 py-2 rounded-lg bg-emerald-500 text-white text-xs font-bold shrink-0"
                                        >
                                            Copier
                                        </button>
                                    </div>
                                </div>
                                <div className="flex justify-end gap-3">
                                    <AdminButton type="button" variant="secondary" onClick={() => window.open(generatedPaymentLink, '_blank')} className="px-6 py-3 rounded-xl">
                                        Tester le lien
                                    </AdminButton>
                                    <AdminButton type="button" variant="primary" onClick={() => setIsModalOpen(false)} className="px-8 py-3 rounded-xl">
                                        Terminer
                                    </AdminButton>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleCreateInvoice} className="p-8">
                                <div className="flex flex-col gap-6 mb-8">
                                    <div>
                                        <label className="block text-xs font-bold text-apple-secondary uppercase tracking-widest mb-2">Entreprise (Client B2B)</label>
                                        <select required value={invoiceForm.companyId} onChange={(e) => setInvoiceForm({...invoiceForm, companyId: e.target.value})} className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 transition-all text-apple-textDark dark:text-white font-medium">
                                            <option value="">Sélectionnez un client</option>
                                            {companiesDropdown.map(c => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-xs font-bold text-apple-secondary uppercase tracking-widest mb-2">Montant Total</label>
                                            <input type="number" step="0.01" required value={invoiceForm.amount} onChange={(e) => setInvoiceForm({...invoiceForm, amount: e.target.value})} className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 transition-all text-apple-textDark dark:text-white font-mono font-bold" placeholder="ex: 237.00" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-apple-secondary uppercase tracking-widest mb-2">Devise</label>
                                            <select required value={invoiceForm.currency} onChange={(e) => setInvoiceForm({...invoiceForm, currency: e.target.value})} className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 transition-all text-apple-textDark dark:text-white">
                                                <option value="EUR">Euro (€)</option>
                                                <option value="MAD">Dirham (MAD)</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-apple-secondary uppercase tracking-widest mb-2">Mode de Règlement</label>
                                        <div className="grid grid-cols-2 gap-3">
                                            <button
                                                type="button"
                                                onClick={() => setInvoiceForm({ ...invoiceForm, paymentMethod: 'stripe' })}
                                                className={`p-3.5 rounded-xl border text-left transition-all ${
                                                    invoiceForm.paymentMethod === 'stripe'
                                                        ? 'border-primary bg-primary/10 text-primary font-bold'
                                                        : 'border-gray-200 dark:border-white/10 text-apple-secondary'
                                                }`}
                                            >
                                                <div className="flex items-center gap-2 text-xs font-bold">
                                                    <span className="material-symbols-outlined text-[18px]">credit_card</span>
                                                    Lien Stripe Checkout
                                                </div>
                                                <p className="text-[10px] opacity-80 mt-1">Génère un lien CB / Apple Pay à envoyer au client</p>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setInvoiceForm({ ...invoiceForm, paymentMethod: 'manual_transfer' })}
                                                className={`p-3.5 rounded-xl border text-left transition-all ${
                                                    invoiceForm.paymentMethod === 'manual_transfer'
                                                        ? 'border-primary bg-primary/10 text-primary font-bold'
                                                        : 'border-gray-200 dark:border-white/10 text-apple-secondary'
                                                }`}
                                            >
                                                <div className="flex items-center gap-2 text-xs font-bold">
                                                    <span className="material-symbols-outlined text-[18px]">account_balance</span>
                                                    Virement / Manuel
                                                </div>
                                                <p className="text-[10px] opacity-80 mt-1">Crée la facture en attente de virement</p>
                                            </button>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-apple-secondary uppercase tracking-widest mb-2">Détail de la commande (affiché sur Stripe)</label>
                                        <textarea value={invoiceForm.notes} onChange={(e) => setInvoiceForm({...invoiceForm, notes: e.target.value})} className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 transition-all text-apple-textDark dark:text-white min-h-[80px]" placeholder="Ex: 3 Cartes NFC PVC Sur-Mesure + Abonnement KlikNode Pro Annuel"></textarea>
                                    </div>
                                </div>
                                <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 dark:border-white/5">
                                    <AdminButton type="button" variant="secondary" onClick={() => setIsModalOpen(false)} className="px-6 py-3 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm">Annuler</AdminButton>
                                    <AdminButton type="submit" disabled={isCreatingInvoice} variant="primary" className="px-8 py-3 rounded-xl shadow-lg shadow-primary/30 font-bold uppercase tracking-widest text-xs">
                                        {isCreatingInvoice
                                            ? 'Génération...'
                                            : invoiceForm.paymentMethod === 'stripe'
                                                ? 'Générer Facture & Lien Stripe'
                                                : 'Créer la Facture'}
                                    </AdminButton>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}

            {/* Modal Configuration Clés Stripe */}
            {isStripeModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-[#1E293B] rounded-[32px] w-full max-w-lg shadow-2xl overflow-hidden border border-white/40 dark:border-white/10">
                        <div className="p-8 border-b border-gray-100 dark:border-white/5 flex justify-between items-center bg-gray-50/50 dark:bg-white/5">
                            <div>
                                <h3 className="text-xl font-bold text-apple-textDark dark:text-white">Connexion API Stripe</h3>
                                <p className="text-xs text-apple-secondary mt-1">Renseignez vos clés Stripe pour générer des liens de paiement</p>
                            </div>
                            <button type="button" onClick={() => setIsStripeModalOpen(false)} className="w-10 h-10 rounded-full hover:bg-gray-200 dark:hover:bg-white/10 flex items-center justify-center text-apple-secondary">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <form onSubmit={handleSaveStripeKeys} className="p-8 space-y-5">
                            {stripeStatus.isConfigured && (
                                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between text-xs">
                                    <span className="font-bold text-emerald-500">Clé active : {stripeStatus.maskedSecretKey}</span>
                                    <span className="px-2.5 py-1 rounded-full bg-emerald-500 text-white font-black uppercase text-[10px]">
                                        Mode {stripeStatus.mode}
                                    </span>
                                </div>
                            )}
                            <div>
                                <label className="block text-xs font-bold text-apple-secondary uppercase tracking-widest mb-2">
                                    Clé Secrète Stripe (STRIPE_SECRET_KEY)
                                </label>
                                <input
                                    type="password"
                                    required={!stripeStatus.isConfigured}
                                    placeholder={stripeStatus.isConfigured ? 'Laisser vide pour conserver la clé actuelle (sk_...)' : 'sk_live_... ou sk_test_...'}
                                    value={stripeForm.secretKey}
                                    onChange={e => setStripeForm({ ...stripeForm, secretKey: e.target.value })}
                                    className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-mono text-apple-textDark dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-apple-secondary uppercase tracking-widest mb-2">
                                    Clé Publique Stripe (STRIPE_PUBLISHABLE_KEY - Optionnel)
                                </label>
                                <input
                                    type="text"
                                    placeholder="pk_live_... ou pk_test_..."
                                    value={stripeForm.publishableKey}
                                    onChange={e => setStripeForm({ ...stripeForm, publishableKey: e.target.value })}
                                    className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-mono text-apple-textDark dark:text-white"
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-white/5">
                                <AdminButton type="button" variant="secondary" onClick={() => setIsStripeModalOpen(false)} className="px-6 py-3 rounded-xl">
                                    Annuler
                                </AdminButton>
                                <AdminButton type="submit" disabled={isSavingStripe} variant="primary" className="px-8 py-3 rounded-xl">
                                    {isSavingStripe ? 'Connexion...' : 'Enregistrer les Clés Stripe'}
                                </AdminButton>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
