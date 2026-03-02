'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Subscription {
    status: string;
    currentPeriodEnd: string;
    plan: {
        name: string;
        priceEur: number;
        priceMad: number;
    };
    paymentMethod: string;
}

interface Invoice {
    id: string;
    createdAt: string;
    invoiceNumber: string | null;
    amount: number;
    currency: string;
    status: string;
}

export default function SubscriptionPage() {
    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [pagination, setPagination] = useState({
        total: 0,
        page: 1,
        limit: 5,
        totalPages: 1
    });

    useEffect(() => {
        fetchSubscription();
        fetchInvoices();
    }, [pagination.page]);

    const fetchSubscription = async () => {
        try {
            const response = await apiClient.get('/api/company/billing/subscription');
            if (response.data.success) {
                setSubscription(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching subscription:', error);
            // On ne bloque pas tout si l'abonnement n'est pas trouvé
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

    return (
        <main className="max-w-7xl mx-auto w-full space-y-10 font-display">
            <header>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Mon Abonnement</h1>
                <p className="mt-2 text-slate-500 dark:text-slate-400 text-lg">Gérez votre offre et vos moyens de paiement.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Plan Details Card */}
                <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 flex flex-col relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                        <span className="material-icons-round text-8xl text-primary">verified</span>
                    </div>
                    <div className="flex items-center justify-between mb-6 relative z-10">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                <span className="material-icons-round text-2xl">star</span>
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Plan Actuel</h3>
                                <p className="text-xl font-bold text-slate-900 dark:text-white">
                                    {subscription?.plan.name || 'Aucun pack actif'}
                                </p>
                            </div>
                        </div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${subscription?.status === 'active' || subscription?.status === 'trialing' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'}`}>
                            {subscription?.status === 'active' ? 'Actif' : subscription?.status === 'trialing' ? 'Essai' : 'Inactif'}
                        </span>
                    </div>
                    <div className="mb-6 relative z-10">
                        <div className="flex items-baseline">
                            <span className="text-4xl font-extrabold text-slate-900 dark:text-white">
                                {subscription?.plan.priceEur || 0}€
                            </span>
                            <span className="text-slate-500 ml-1">/ mois</span>
                        </div>
                        {subscription?.currentPeriodEnd && (
                            <p className="text-sm text-slate-500 mt-2 flex items-center gap-1">
                                <span className="material-icons-round text-sm">event</span>
                                Prochaine facture le {format(new Date(subscription.currentPeriodEnd), 'dd MMM yyyy', { locale: fr })}
                            </p>
                        )}
                    </div>
                    <div className="mt-auto relative z-10">
                        <button className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-slate-300 dark:border-slate-700 shadow-sm text-sm font-medium rounded-lg text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors">
                            Changer de plan
                        </button>
                    </div>
                </div>

                {/* Payment Method Card */}
                <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 flex flex-col">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                <span className="material-icons-round text-2xl">credit_card</span>
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Moyen de paiement</h3>
                                <p className="text-xl font-bold text-slate-900 dark:text-white">Mode {subscription?.paymentMethod || 'Stripe'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Visual Card representation */}
                    <div className="mb-6 p-4 bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl shadow-lg text-white max-w-sm w-full mx-auto md:mx-0 relative overflow-hidden">
                        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
                        <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-20 h-20 bg-primary/30 rounded-full blur-xl"></div>
                        <div className="flex justify-between items-start mb-6">
                            <div className="h-6 w-10 bg-white/20 rounded flex items-center justify-center font-bold text-[8px] tracking-tighter italic">VISA</div>
                            <span className="material-icons-round text-white/50">nfc</span>
                        </div>
                        <div className="mb-4">
                            <p className="font-mono text-lg tracking-widest text-white/90">•••• •••• •••• 4242</p>
                        </div>
                        <div className="flex justify-between items-end">
                            <div>
                                <p className="text-[10px] text-white/60 uppercase tracking-wide mb-0.5">Titulaire</p>
                                <p className="text-sm font-medium text-white/90">ADMIN COMPANY</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-white/60 uppercase tracking-wide mb-0.5">Expire</p>
                                <p className="text-sm font-medium text-white/90">12/25</p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-auto">
                        <button className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all">
                            <span className="material-icons-round text-sm mr-2">add</span>
                            Mettre à jour
                        </button>
                    </div>
                </div>
            </div>

            {/* Billing History Section */}
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Historique de facturation</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Retrouvez toutes vos factures passées.</p>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
                        <thead className="bg-slate-50 dark:bg-slate-800/50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider" scope="col">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider" scope="col">Description</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider" scope="col">Montant</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider" scope="col">Status</th>
                                <th className="relative px-6 py-3" scope="col">
                                    <span className="sr-only">Actions</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-800">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                                        Chargement de l'historique...
                                    </td>
                                </tr>
                            ) : invoices.length > 0 ? (
                                invoices.map((invoice) => (
                                    <tr key={invoice.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400 font-medium">
                                            {format(new Date(invoice.createdAt), 'dd MMM yyyy', { locale: fr })}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-semibold text-slate-900 dark:text-white">Facture {invoice.invoiceNumber || `#${invoice.id.slice(0, 8)}`}</span>
                                                <span className="text-xs text-slate-500">Paiement abonnement</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-bold text-slate-900 dark:text-white">{invoice.amount}€</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-bold rounded-full border ${invoice.status === 'succeeded' ? 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800' : 'bg-slate-100 text-slate-800 border-slate-200'}`}>
                                                {invoice.status === 'succeeded' ? 'Payée' : invoice.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button className="text-primary hover:text-primary-dark flex items-center justify-end gap-1 transition-colors group">
                                                Télécharger PDF
                                                <span className="material-icons-round text-base transform group-hover:translate-y-0.5 transition-transform">download</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                        Aucun historique trouvé
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900">
                        <p className="text-sm text-slate-700 dark:text-slate-400">
                            Page <span className="font-medium">{pagination.page}</span> sur <span className="font-medium">{pagination.totalPages}</span>
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                                disabled={pagination.page === 1}
                                className="px-3 py-1.5 text-sm font-medium border border-slate-200 dark:border-slate-700 rounded-lg disabled:opacity-50"
                            >
                                Précédent
                            </button>
                            <button
                                onClick={() => setPagination(prev => ({ ...prev, page: Math.min(pagination.totalPages, prev.page + 1) }))}
                                disabled={pagination.page === pagination.totalPages}
                                className="px-3 py-1.5 text-sm font-medium border border-slate-200 dark:border-slate-700 rounded-lg disabled:opacity-50"
                            >
                                Suivant
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <div className="text-center text-sm text-slate-500">
                <p>Vous avez une question concernant votre facturation ? <a className="text-primary hover:underline font-medium" href="#">Contactez le support</a>.</p>
            </div>
        </main>
    );
}
