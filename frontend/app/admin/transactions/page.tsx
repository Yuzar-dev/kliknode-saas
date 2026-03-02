'use client';

import { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Pagination } from '@/components/ui/Pagination';
import { AdminButton } from '@/components/ui/AdminButton';

type TransactionStatus = 'success' | 'pending' | 'failed' | 'refunded';

export default function TransactionsPage() {
    const [activeTab, setActiveTab] = useState<'all' | TransactionStatus>('all');

    // Mock data - will be replaced with API call
    const stats = [
        {
            label: 'Revenu Total (Ce Mois)',
            value: '48 290,00€',
            badge: '+12%',
            badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
            icon: 'payments',
            iconColor: 'text-slate-400'
        },
        {
            label: 'Factures Manuelles en Attente',
            value: '5',
            badge: 'Nécessite Attention',
            badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
            icon: 'pending_actions',
            iconColor: 'text-slate-400'
        },
        {
            label: 'Transactions Échouées',
            value: '1 200,50€',
            badge: '3 échouées',
            badgeColor: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400',
            icon: 'error',
            iconColor: 'text-slate-400'
        }
    ];

    const transactions = [
        {
            id: '#TRX-9821',
            clientName: 'Acme Corp',
            clientInitials: 'AC',
            clientColor: 'bg-indigo-100 text-indigo-700',
            plan: 'Enterprise Plan',
            amount: '499,00€',
            method: 'Stripe',
            methodIcon: 'payment',
            status: 'success' as TransactionStatus,
            date: '24 Oct, 2023',
            isPending: false
        },
        {
            id: '#INV-2023-002',
            clientName: 'Globex Inc.',
            clientInitials: 'GL',
            clientColor: 'bg-blue-100 text-blue-700',
            plan: 'Pro Plan',
            amount: '1 250,00€',
            method: 'Virement Manuel',
            methodIcon: 'account_balance',
            status: 'pending' as TransactionStatus,
            date: '23 Oct, 2023',
            isPending: true
        },
        {
            id: '#TRX-9820',
            clientName: 'Stark Ind',
            clientInitials: 'ST',
            clientColor: 'bg-purple-100 text-purple-700',
            plan: 'Basic Plan',
            amount: '29,00€',
            method: 'Stripe',
            methodIcon: 'payment',
            status: 'failed' as TransactionStatus,
            date: '22 Oct, 2023',
            isPending: false
        },
        {
            id: '#TRX-9819',
            clientName: 'Wayne Corp',
            clientInitials: 'WC',
            clientColor: 'bg-pink-100 text-pink-700',
            plan: 'Enterprise Plan',
            amount: '499,00€',
            method: 'Stripe',
            methodIcon: 'payment',
            status: 'refunded' as TransactionStatus,
            date: '21 Oct, 2023',
            isPending: false
        },
        {
            id: '#TRX-9818',
            clientName: 'Dunder Mifflin',
            clientInitials: 'DL',
            clientColor: 'bg-teal-100 text-teal-700',
            plan: 'Pro Plan',
            amount: '149,00€',
            method: 'Stripe',
            methodIcon: 'payment',
            status: 'success' as TransactionStatus,
            date: '20 Oct, 2023',
            isPending: false
        }
    ];

    const getStatusBadge = (status: TransactionStatus) => {
        const badges = {
            success: {
                label: 'Succès',
                className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
            },
            pending: {
                label: 'En Attente',
                className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800'
            },
            failed: {
                label: 'Échoué',
                className: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400 border-rose-200 dark:border-rose-800'
            },
            refunded: {
                label: 'Remboursé',
                className: 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-600'
            }
        };
        return badges[status];
    };

    const filteredTransactions = activeTab === 'all'
        ? transactions
        : transactions.filter(t => t.status === activeTab);

    const itemsPerPage = 5;
    const [currentPage, setCurrentPage] = useState(1);

    const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedTransactions = filteredTransactions.slice(startIndex, startIndex + itemsPerPage);

    return (
        <AdminLayout>
            <div className="flex-1 overflow-y-auto p-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
                    <div>
                        <nav aria-label="Breadcrumb" className="flex mb-2">
                            <ol className="inline-flex items-center space-x-1 text-sm text-slate-500">
                                <li className="inline-flex items-center hover:text-slate-700 transition-colors cursor-pointer">
                                    Finance &amp; Abonnements
                                </li>
                                <li>
                                    <span className="material-icons-outlined text-base mx-1 text-slate-400">chevron_right</span>
                                </li>
                                <li className="font-medium text-slate-900 dark:text-white">
                                    Transactions &amp; Factures
                                </li>
                            </ol>
                        </nav>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                            Transactions &amp; Factures
                        </h1>
                        <p className="text-sm text-slate-500 mt-1">
                            Gérez tout votre historique de facturation et la génération de factures en un seul endroit.
                        </p>
                    </div>

                    <AdminButton
                        variant="primary"
                        onClick={() => alert('Génération de facture manuelle - À implémenter')}
                    >
                        <span className="material-icons-outlined text-lg mr-2">add</span>
                        Générer Facture Manuelle
                    </AdminButton>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {stats.map((stat, index) => (
                        <div
                            key={index}
                            className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <span className="text-sm font-medium text-slate-500 truncate">
                                    {stat.label}
                                </span>
                                <span className={`material-symbols-outlined ${stat.iconColor}`}>
                                    {stat.icon}
                                </span>
                            </div>
                            <div className="flex items-baseline justify-between">
                                <span className="text-3xl font-bold text-slate-900 dark:text-white">
                                    {stat.value}
                                </span>
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${stat.badgeColor}`}>
                                    {stat.badge.includes('+') && (
                                        <span className="material-icons-outlined text-sm mr-1">trending_up</span>
                                    )}
                                    {stat.badge}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Filters Bar */}
                <div className="bg-white dark:bg-slate-800 rounded-t-xl border border-slate-200 dark:border-slate-700 border-b-0 p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-sm">
                    {/* Tabs */}
                    <div className="flex p-1 space-x-1 bg-slate-100 dark:bg-slate-700/50 rounded-lg w-full lg:w-auto overflow-x-auto">
                        <button
                            onClick={() => setActiveTab('all')}
                            className={`px-4 py-2 text-sm font-medium rounded-md transition-all whitespace-nowrap ${activeTab === 'all'
                                ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm ring-1 ring-black/5'
                                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-600'
                                }`}
                        >
                            Toutes les Transactions
                        </button>
                        <button
                            onClick={() => setActiveTab('success')}
                            className={`px-4 py-2 text-sm font-medium rounded-md transition-all whitespace-nowrap ${activeTab === 'success'
                                ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm ring-1 ring-black/5'
                                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-600'
                                }`}
                        >
                            Succès
                        </button>
                        <button
                            onClick={() => setActiveTab('failed')}
                            className={`px-4 py-2 text-sm font-medium rounded-md transition-all whitespace-nowrap ${activeTab === 'failed'
                                ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm ring-1 ring-black/5'
                                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-600'
                                }`}
                        >
                            Échoué
                        </button>
                        <button
                            onClick={() => setActiveTab('refunded')}
                            className={`px-4 py-2 text-sm font-medium rounded-md transition-all whitespace-nowrap ${activeTab === 'refunded'
                                ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm ring-1 ring-black/5'
                                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-600'
                                }`}
                        >
                            Remboursé
                        </button>
                    </div>

                    {/* Search and Filters */}
                    <div className="flex items-center gap-3 w-full lg:w-auto">
                        <div className="relative w-full lg:w-64">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <span className="material-icons-outlined text-slate-400 text-lg">search</span>
                            </div>
                            <input
                                type="text"
                                className="block w-full pl-10 pr-3 py-2 border border-slate-200 dark:border-slate-600 rounded-full bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-0 focus:border-blue-500 focus:shadow-[0_0_10px_rgba(59,130,246,0.5)] text-sm transition-shadow"
                                placeholder="Rechercher par ID ou Client..."
                            />
                        </div>
                        <AdminButton variant="secondary" className="gap-2">
                            <span className="material-icons-outlined text-lg text-slate-500">calendar_today</span>
                            Date
                        </AdminButton>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-b-xl shadow-sm overflow-hidden mb-8">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                            <thead className="bg-slate-50 dark:bg-slate-900/50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                        ID Transaction
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                        Nom du Client
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                        Montant
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                        Méthode
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                        Statut
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                        Date
                                    </th>
                                    <th scope="col" className="relative px-6 py-3">
                                        <span className="sr-only">Actions</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                                {paginatedTransactions.map((transaction) => {
                                    const statusBadge = getStatusBadge(transaction.status);
                                    return (
                                        <tr
                                            key={transaction.id}
                                            className={`hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${transaction.isPending ? 'bg-amber-50/40 dark:bg-amber-900/5' : ''
                                                }`}
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary font-mono">
                                                <a href="#" className="hover:underline">
                                                    {transaction.id}
                                                </a>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-white">
                                                <div className="flex items-center">
                                                    <div className={`h-8 w-8 rounded-full ${transaction.clientColor} flex items-center justify-center font-bold text-xs mr-3 ring-1 ring-white`}>
                                                        {transaction.clientInitials}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium">{transaction.clientName}</div>
                                                        <div className="text-xs text-slate-500">{transaction.plan}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-white text-right font-medium">
                                                {transaction.amount}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                                <div className="flex items-center">
                                                    <span className="material-icons-outlined text-indigo-500 mr-2 text-base">
                                                        {transaction.methodIcon}
                                                    </span>
                                                    {transaction.method}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusBadge.className}`}>
                                                    {statusBadge.label}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                                {transaction.date}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex items-center justify-end gap-2">
                                                    {transaction.isPending && (
                                                        <button className="text-xs font-semibold text-slate-700 hover:text-slate-900 hover:underline decoration-2 underline-offset-4 mr-2 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded transition-colors">
                                                            Marquer Payé
                                                        </button>
                                                    )}
                                                    <button className="text-slate-400 hover:text-primary transition-colors p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700">
                                                        <span className="material-icons-outlined text-xl">more_horiz</span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="bg-white dark:bg-slate-800 px-4 py-3 flex items-center justify-between border-t border-slate-200 dark:border-slate-700 sm:px-6">
                        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm text-slate-500">
                                    Affichage <span className="font-medium text-slate-900 dark:text-white">{Math.min(filteredTransactions.length, startIndex + 1)}</span> à{' '}
                                    <span className="font-medium text-slate-900 dark:text-white">{Math.min(filteredTransactions.length, startIndex + itemsPerPage)}</span> sur{' '}
                                    <span className="font-medium text-slate-900 dark:text-white">{filteredTransactions.length}</span> résultats
                                </p>
                            </div>
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={setCurrentPage}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout >
    );
}
