'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Plan {
    id: string;
    name: string;
    slug: string;
    priceEur: number;
    priceMad: number;
    billingPeriod: string;
    maxLicenses: number;
}

interface Subscription {
    id: string;
    planId: string;
    status: string;
    currentPeriodEnd: string;
    plan: Plan;
    paymentMethod: string;
    usedLicenses?: number;
}

interface Invoice {
    id: string;
    createdAt: string;
    invoiceNumber: string | null;
    invoicePdfUrl?: string | null;
    amount: number;
    currency: string;
    status: string;
}

export default function SubscriptionPage() {
    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const [plans, setPlans] = useState<Plan[]>([]);
    const [usedLicenses, setUsedLicenses] = useState(0);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [pagination, setPagination] = useState({
        total: 0,
        page: 1,
        limit: 5,
        totalPages: 1
    });

    // Modals
    const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'stripe' | 'manual_transfer'>('stripe');
    const [isUpdating, setIsUpdating] = useState(false);

    useEffect(() => {
        fetchSubscription();
        fetchInvoices();
    }, [pagination.page]);

    const fetchSubscription = async () => {
        try {
            const response = await apiClient.get('/api/company/billing/subscription');
            if (response.data.success) {
                setSubscription(response.data.data);
                setPlans(response.data.plans || []);
                setUsedLicenses(response.data.usedLicenses || 0);
                if (response.data.data?.paymentMethod) {
                    setSelectedPaymentMethod(response.data.data.paymentMethod);
                }
            }
        } catch (error) {
            console.error('Error fetching subscription:', error);
        }
    };

    const fetchInvoices = async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams({
                page: pagination.page.toString(),
                limit: pagination.limit.toString()
            });
            const response = await apiClient.get(`/api/company/billing/invoices?${params}`);
            if (response.data.success) {
                setInvoices(response.data.data);
                setPagination(response.data.pagination);
            }
        } catch (error) {
            console.error('Error fetching invoices:', error);
            toast.error('Erreur lors du chargement des factures');
        } finally {
            setIsLoading(false);
        }
    };

    const handleChangePlan = async (planId: string) => {
        setIsUpdating(true);
        try {
            const res = await apiClient.patch('/api/company/billing/subscription', { planId });
            if (res.data.success) {
                toast.success(res.data.message || 'Plan mis à jour avec succès');
                setIsPlanModalOpen(false);
                fetchSubscription();
            }
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Erreur lors du changement de plan');
        } finally {
            setIsUpdating(false);
        }
    };

    const handleUpdatePaymentMethod = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsUpdating(true);
        try {
            const res = await apiClient.patch('/api/company/billing/subscription', {
                paymentMethod: selectedPaymentMethod,
                planId: subscription?.planId || plans[0]?.id
            });
            if (res.data.success) {
                toast.success('Moyen de paiement mis à jour');
                setIsPaymentModalOpen(false);
                fetchSubscription();
            }
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Erreur lors de la mise à jour');
        } finally {
            setIsUpdating(false);
        }
    };

    const handleDownloadInvoice = (invoice: Invoice) => {
        if (invoice.invoicePdfUrl) {
            window.open(invoice.invoicePdfUrl, '_blank');
            return;
        }
        const invoiceNum = invoice.invoiceNumber || `INV-${invoice.id.slice(0, 8).toUpperCase()}`;
        const dateStr = format(new Date(invoice.createdAt), 'dd MMMM yyyy', { locale: fr });
        const htmlContent = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<title>Facture ${invoiceNum} - KlikNode</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 48px; color: #1D1D1F; max-width: 720px; margin: 0 auto; }
  .header { display: flex; justify-content: space-between; border-bottom: 2px solid #F5F5F7; padding-bottom: 24px; margin-bottom: 32px; }
  .title { font-size: 28px; font-weight: 900; }
  .badge { background: #10B98120; color: #059669; padding: 6px 12px; border-radius: 999px; font-size: 12px; font-weight: 700; text-transform: uppercase; }
  table { width: 100%; border-collapse: collapse; margin-top: 24px; }
  th, td { padding: 16px; text-align: left; border-bottom: 1px solid #E5E7EB; }
  .total { font-size: 22px; font-weight: 900; text-align: right; margin-top: 24px; }
</style>
</head>
<body>
  <div class="header">
    <div>
      <div class="title">KLIKNODE</div>
      <p>Facture N° ${invoiceNum}<br/>Date : ${dateStr}</p>
    </div>
    <div><span class="badge">${invoice.status === 'succeeded' ? 'Payée' : invoice.status}</span></div>
  </div>
  <table>
    <thead><tr><th>Description</th><th>Plan</th><th>Montant</th></tr></thead>
    <tbody>
      <tr>
        <td>Abonnement SaaS KlikNode Entreprise</td>
        <td>${subscription?.plan?.name || 'Business'}</td>
        <td>${invoice.amount} ${invoice.currency || 'EUR'}</td>
      </tr>
    </tbody>
  </table>
  <div class="total">Total TTC : ${invoice.amount} ${invoice.currency || 'EUR'}</div>
  <script>window.print();</script>
</body>
</html>`;

        const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        toast.success(`Facture ${invoiceNum} générée`);
    };

    return (
        <main className="max-w-7xl mx-auto w-full space-y-10 font-display animate-in fade-in slide-in-from-bottom-4 duration-700">
            <header className="mb-10">
                <h1 className="text-4xl md:text-5xl font-black text-apple-textDark dark:text-white tracking-tighter">Mon Abonnement</h1>
                <p className="text-[11px] font-black uppercase tracking-[0.25em] text-apple-secondary dark:text-slate-500 mt-3">Gérez votre offre et vos moyens de paiement.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Plan Details Card */}
                <div className="klik-glass p-10 rounded-[40px] border border-white/40 dark:border-white/5 shadow-2xl flex flex-col relative overflow-hidden group">
                    <div className="absolute -top-24 -right-24 p-10 opacity-[0.03] group-hover:opacity-10 transition-all duration-700 group-hover:rotate-12 pointer-events-none">
                        <span className="material-symbols-outlined text-[300px] text-primary">workspace_premium</span>
                    </div>
                    <div className="flex items-center justify-between mb-8 relative z-10">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-[1.2rem] glass flex items-center justify-center text-primary shadow-sm border border-white/20">
                                <span className="material-symbols-outlined text-[28px]">star</span>
                            </div>
                            <div>
                                <h3 className="text-[10px] font-bold text-apple-secondary uppercase tracking-[0.2em]">Plan Actuel</h3>
                                <p className="text-2xl font-black text-apple-textDark dark:text-white tracking-tight mt-1">
                                    {subscription?.plan?.name || 'Aucun pack actif'}
                                </p>
                            </div>
                        </div>
                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ${subscription?.status === 'active' || subscription?.status === 'trialing' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-gray-100 dark:bg-[#1C1C1E] text-gray-800 dark:text-gray-300 border border-gray-200 dark:border-white/10'}`}>
                            {subscription?.status === 'active' ? 'Actif' : subscription?.status === 'trialing' ? 'Essai' : 'Inactif'}
                        </span>
                    </div>
                    <div className="mb-8 relative z-10">
                        <div className="flex items-baseline">
                            <span className="text-6xl font-black text-apple-textDark dark:text-white tracking-tighter">
                                {subscription?.plan?.priceEur || 0}€
                            </span>
                            <span className="text-sm font-bold text-apple-secondary uppercase tracking-widest ml-2">/ mois</span>
                        </div>
                        <p className="text-xs font-bold text-apple-secondary mt-3">
                            Licences utilisées : <span className="text-apple-textDark dark:text-white font-black">{usedLicenses}</span> / {subscription?.plan?.maxLicenses || '∞'}
                        </p>
                        {subscription?.currentPeriodEnd && (
                            <p className="text-[11px] font-bold text-apple-secondary uppercase tracking-[0.1em] mt-3 flex items-center gap-2">
                                <span className="material-symbols-outlined text-[16px]">event</span>
                                Prochaine facture le {format(new Date(subscription.currentPeriodEnd), 'dd MMM yyyy', { locale: fr })}
                            </p>
                        )}
                    </div>
                    <div className="mt-auto relative z-10">
                        <button
                            onClick={() => setIsPlanModalOpen(true)}
                            className="w-full sm:w-auto h-12 px-8 rounded-full klik-glass border border-white/40 dark:border-white/10 hover:bg-white/80 dark:hover:bg-white/10 transition-all flex items-center justify-center gap-3 text-xs font-black uppercase tracking-widest text-apple-textDark dark:text-white shadow-sm cursor-pointer active:scale-95"
                        >
                            <span className="material-symbols-outlined text-[18px]">swap_horiz</span>
                            Changer de plan
                        </button>
                    </div>
                </div>

                {/* Payment Method Card */}
                <div className="klik-glass p-10 rounded-[40px] border border-white/40 dark:border-white/5 shadow-2xl flex flex-col relative overflow-hidden">
                    <div className="flex items-center justify-between mb-8 relative z-10">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-[1.2rem] glass flex items-center justify-center text-primary shadow-sm border border-white/20">
                                <span className="material-symbols-outlined text-[28px]">credit_card</span>
                            </div>
                            <div>
                                <h3 className="text-[10px] font-bold text-apple-secondary uppercase tracking-[0.2em]">Moyen de paiement</h3>
                                <p className="text-2xl font-black text-apple-textDark dark:text-white tracking-tight mt-1">
                                    {subscription?.paymentMethod === 'manual_transfer' ? 'Virement Bancaire' : 'Carte Bancaire (Stripe)'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Visual Card representation */}
                    <div className="mb-8 p-6 bg-gradient-to-br from-[#1C1C1E] to-black rounded-[2rem] shadow-2xl text-white w-full max-w-[340px] mx-auto relative overflow-hidden border border-white/10 transform transition-transform hover:scale-[1.02] duration-500">
                        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-40 h-40 bg-white/5 rounded-full blur-2xl"></div>
                        <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-32 h-32 bg-primary/20 rounded-full blur-2xl"></div>
                        <div className="flex justify-between items-start mb-10 relative z-10">
                            <div className="h-8 px-3 bg-white/20 backdrop-blur-md rounded-md flex items-center justify-center font-black text-[10px] tracking-tighter italic border border-white/10 shadow-sm">
                                {subscription?.paymentMethod === 'manual_transfer' ? 'SEPA / IBAN' : 'VISA'}
                            </div>
                            <span className="material-symbols-outlined text-white/50 text-3xl">contactless</span>
                        </div>
                        <div className="mb-6 relative z-10">
                            <p className="font-mono text-xl tracking-[0.25em] text-white/90 drop-shadow-md">•••• •••• •••• 4242</p>
                        </div>
                        <div className="flex justify-between items-end relative z-10">
                            <div>
                                <p className="text-[8px] text-white/50 font-black uppercase tracking-[0.2em] mb-1">Titulaire</p>
                                <p className="text-sm font-black text-white/90 tracking-widest uppercase">ENTREPRISE KLIKNODE</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[8px] text-white/50 font-black uppercase tracking-[0.2em] mb-1">Expire</p>
                                <p className="text-sm font-black text-white/90 tracking-widest">12/28</p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-auto relative z-10">
                        <button
                            onClick={() => setIsPaymentModalOpen(true)}
                            className="w-full h-12 rounded-full btn-titanium btn-titanium-primary shadow-xl shadow-primary/30 flex items-center justify-center gap-3 text-xs font-black uppercase tracking-widest text-white transition-all group cursor-pointer"
                        >
                            <span className="material-symbols-outlined text-[20px] group-hover:scale-110 transition-transform">edit</span>
                            Mettre à jour
                        </button>
                    </div>
                </div>
            </div>

            {/* Billing History Section */}
            <div className="klik-glass rounded-[40px] border border-white/40 dark:border-white/5 shadow-2xl overflow-hidden mt-10">
                <div className="px-10 py-8 border-b border-gray-100/10 dark:border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/30 dark:bg-white/5">
                    <div>
                        <h2 className="text-2xl font-black text-apple-textDark dark:text-white tracking-tight">Historique de facturation</h2>
                        <p className="text-[10px] font-bold text-apple-secondary uppercase tracking-widest mt-2">Retrouvez toutes vos factures passées.</p>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/30 dark:bg-white/5 border-b border-gray-100/10 dark:border-white/5">
                                <th className="px-10 py-6 text-[11px] font-bold text-apple-secondary uppercase tracking-[0.2em] opacity-60" scope="col">Date</th>
                                <th className="px-6 py-6 text-[11px] font-bold text-apple-secondary uppercase tracking-[0.2em] opacity-60" scope="col">Description</th>
                                <th className="px-6 py-6 text-[11px] font-bold text-apple-secondary uppercase tracking-[0.2em] opacity-60" scope="col">Montant</th>
                                <th className="px-6 py-6 text-[11px] font-bold text-apple-secondary uppercase tracking-[0.2em] opacity-60" scope="col">Status</th>
                                <th className="relative px-10 py-6 text-right text-[11px] font-bold text-apple-secondary uppercase tracking-[0.2em] opacity-60" scope="col">
                                    Facture
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100/10 dark:divide-white/5 bg-white/10 dark:bg-transparent">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="px-10 py-20 text-center">
                                        <div className="flex flex-col items-center justify-center gap-4 opacity-50">
                                            <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                                        </div>
                                    </td>
                                </tr>
                            ) : invoices.length > 0 ? (
                                invoices.map((invoice) => (
                                    <tr key={invoice.id} className="hover:bg-white/40 dark:hover:bg-white/5 transition-colors group">
                                        <td className="px-10 py-6 whitespace-nowrap">
                                            <span className="text-sm font-bold text-apple-textDark dark:text-white">
                                                {format(new Date(invoice.createdAt), 'dd MMM yyyy', { locale: fr })}
                                            </span>
                                        </td>
                                        <td className="px-6 py-6 whitespace-nowrap">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-black text-apple-textDark dark:text-white tracking-tight">Facture {invoice.invoiceNumber || `#${invoice.id.slice(0, 8)}`}</span>
                                                <span className="text-[10px] font-bold text-apple-secondary uppercase tracking-widest mt-1">Paiement abonnement</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6 whitespace-nowrap">
                                            <div className="text-lg font-black text-apple-textDark dark:text-white tracking-tighter">{invoice.amount}€</div>
                                        </td>
                                        <td className="px-6 py-6 whitespace-nowrap">
                                            <span className={`px-4 py-1.5 inline-flex text-[10px] font-black uppercase tracking-widest rounded-full border shadow-sm ${invoice.status === 'succeeded' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-gray-100 dark:bg-[#1C1C1E] text-gray-800 dark:text-gray-300 border-gray-200 dark:border-white/10'}`}>
                                                {invoice.status === 'succeeded' ? 'Payée' : invoice.status}
                                            </span>
                                        </td>
                                        <td className="px-10 py-6 whitespace-nowrap text-right">
                                            <button
                                                onClick={() => handleDownloadInvoice(invoice)}
                                                className="h-10 px-6 rounded-full glass border border-white/20 flex items-center justify-end gap-2 text-xs font-black uppercase tracking-widest text-primary hover:bg-white/60 dark:hover:bg-white/10 transition-all group/btn ml-auto shadow-sm cursor-pointer"
                                            >
                                                Télécharger PDF
                                                <span className="material-symbols-outlined text-[18px] group-hover/btn:translate-y-0.5 transition-transform">download</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-10 py-20 text-center">
                                        <div className="flex flex-col items-center justify-center gap-4 opacity-50">
                                            <span className="material-symbols-outlined text-4xl text-apple-secondary">receipt_long</span>
                                            <p className="text-sm font-bold text-apple-secondary tracking-tight">Aucun historique trouvé</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                    <div className="px-10 py-6 border-t border-gray-100/10 dark:border-white/5 flex items-center justify-between bg-white/30 dark:bg-white/5">
                        <p className="text-[11px] font-bold text-apple-secondary uppercase tracking-[0.1em]">
                            Page <span className="text-apple-textDark dark:text-white">{pagination.page}</span> sur <span className="text-apple-textDark dark:text-white">{pagination.totalPages}</span>
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                                disabled={pagination.page === 1}
                                className="w-10 h-10 rounded-full glass flex items-center justify-center text-apple-textDark dark:text-white hover:bg-white/40 dark:hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all border border-white/20 dark:border-white/5 shadow-sm"
                            >
                                <span className="material-symbols-outlined text-[20px]">chevron_left</span>
                            </button>
                            <button
                                onClick={() => setPagination(prev => ({ ...prev, page: Math.min(pagination.totalPages, prev.page + 1) }))}
                                disabled={pagination.page === pagination.totalPages}
                                className="w-10 h-10 rounded-full glass flex items-center justify-center text-apple-textDark dark:text-white hover:bg-white/40 dark:hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all border border-white/20 dark:border-white/5 shadow-sm"
                            >
                                <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <div className="text-center mt-12 pb-10">
                <p className="text-[11px] font-bold text-apple-secondary uppercase tracking-widest">
                    Vous avez une question concernant votre facturation ?{' '}
                    <a
                        className="text-primary hover:text-primary-dark transition-colors border-b border-primary/30 hover:border-primary pb-0.5"
                        href="mailto:service@kliknode.com?subject=Facturation%20KlikNode"
                    >
                        Contactez le support
                    </a>.
                </p>
            </div>

            {/* Modal Changer de Plan */}
            {isPlanModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsPlanModalOpen(false)}></div>
                    <div className="bg-white dark:bg-[#1C1C1E] w-full max-w-2xl rounded-[40px] shadow-2xl relative z-10 overflow-hidden border border-white/20">
                        <div className="px-10 py-8 border-b border-gray-100 dark:border-white/10 flex justify-between items-center">
                            <div>
                                <h3 className="text-2xl font-black text-apple-textDark dark:text-white tracking-tight">Choisir une offre</h3>
                                <p className="text-[10px] font-bold text-apple-secondary uppercase tracking-widest mt-1">Évoluez à tout moment selon la taille de votre équipe</p>
                            </div>
                            <button onClick={() => setIsPlanModalOpen(false)} className="h-10 w-10 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 flex items-center justify-center">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="p-10 space-y-4 max-h-[70vh] overflow-y-auto">
                            {plans.length === 0 ? (
                                <p className="text-center text-sm text-apple-secondary py-8">Aucun plan disponible pour le moment.</p>
                            ) : (
                                plans.map((plan) => {
                                    const isCurrent = subscription?.planId === plan.id;
                                    return (
                                        <div
                                            key={plan.id}
                                            className={`p-6 rounded-3xl border-2 flex items-center justify-between transition-all ${isCurrent
                                                ? 'border-primary bg-primary/5'
                                                : 'border-slate-100 dark:border-white/10 hover:border-primary/40'
                                                }`}
                                        >
                                            <div>
                                                <div className="flex items-center gap-3">
                                                    <h4 className="text-xl font-black text-apple-textDark dark:text-white">{plan.name}</h4>
                                                    {isCurrent && (
                                                        <span className="px-3 py-1 rounded-full bg-primary text-white text-[9px] font-black uppercase tracking-widest">
                                                            Plan Actuel
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs font-bold text-apple-secondary mt-1">
                                                    Jusqu'à {plan.maxLicenses} licences collaborateurs • Facturation {plan.billingPeriod === 'yearly' ? 'annuelle' : 'mensuelle'}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="text-right">
                                                    <span className="text-2xl font-black text-apple-textDark dark:text-white">{plan.priceEur}€</span>
                                                    <span className="text-[10px] font-bold text-apple-secondary block">/ mois</span>
                                                </div>
                                                <button
                                                    disabled={isCurrent || isUpdating}
                                                    onClick={() => handleChangePlan(plan.id)}
                                                    className={`px-6 h-11 rounded-full text-xs font-black uppercase tracking-widest transition-all ${isCurrent
                                                        ? 'bg-slate-100 dark:bg-white/10 text-apple-secondary cursor-default'
                                                        : 'btn-titanium btn-titanium-primary text-white cursor-pointer'
                                                        }`}
                                                >
                                                    {isCurrent ? 'Sélectionné' : 'Choisir'}
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Moyen de Paiement */}
            {isPaymentModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsPaymentModalOpen(false)}></div>
                    <div className="bg-white dark:bg-[#1C1C1E] w-full max-w-md rounded-[40px] shadow-2xl relative z-10 overflow-hidden border border-white/20">
                        <div className="px-8 py-6 border-b border-gray-100 dark:border-white/10 flex justify-between items-center">
                            <h3 className="text-xl font-black text-apple-textDark dark:text-white tracking-tight">Moyen de paiement</h3>
                            <button onClick={() => setIsPaymentModalOpen(false)} className="h-9 w-9 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 flex items-center justify-center">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <form onSubmit={handleUpdatePaymentMethod} className="p-8 space-y-6">
                            <div className="space-y-3">
                                {[
                                    { id: 'stripe', label: 'Carte Bancaire (Stripe)', desc: 'Prélèvement automatique sécurisé' },
                                    { id: 'manual_transfer', label: 'Virement Bancaire SEPA', desc: 'Paiement sur facture à 30 jours' }
                                ].map((m) => (
                                    <div
                                        key={m.id}
                                        onClick={() => setSelectedPaymentMethod(m.id as any)}
                                        className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${selectedPaymentMethod === m.id
                                            ? 'border-primary bg-primary/5'
                                            : 'border-slate-100 dark:border-white/10'
                                            }`}
                                    >
                                        <p className="text-sm font-black text-apple-textDark dark:text-white">{m.label}</p>
                                        <p className="text-xs text-apple-secondary mt-0.5">{m.desc}</p>
                                    </div>
                                ))}
                            </div>
                            <button
                                type="submit"
                                disabled={isUpdating}
                                className="w-full h-14 btn-titanium btn-titanium-primary text-white rounded-full font-black text-xs uppercase tracking-widest shadow-xl cursor-pointer"
                            >
                                {isUpdating ? 'Enregistrement...' : 'Valider le mode de paiement'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </main>
    );
}
