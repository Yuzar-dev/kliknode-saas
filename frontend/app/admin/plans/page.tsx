'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/admin/AdminLayout';
import { Pagination } from '@/components/ui/Pagination';
import { AdminButton } from '@/components/ui/AdminButton';

export default function SubscriptionPlansPage() {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');

    // Mock data - will be replaced with API call
    const plans = [
        {
            id: 1,
            name: 'Gratuit',
            subtitle: 'Accès basique',
            icon: 'star_outline',
            iconBg: 'bg-slate-100 dark:bg-slate-800',
            iconColor: 'text-slate-500',
            priceEUR: '0.00',
            priceMAD: '0',
            status: 'active',
            isLegacy: false
        },
        {
            id: 2,
            name: 'Pro Mensuel',
            subtitle: 'Plus populaire',
            icon: 'rocket_launch',
            iconBg: 'bg-primary/10',
            iconColor: 'text-primary',
            priceEUR: '29.00',
            priceMAD: '290',
            status: 'active',
            isLegacy: false
        },
        {
            id: 3,
            name: 'Pro Annuel',
            subtitle: 'Facturation annuelle',
            icon: 'workspace_premium',
            iconBg: 'bg-primary/10',
            iconColor: 'text-primary',
            priceEUR: '290.00',
            priceMAD: '2900',
            status: 'active',
            isLegacy: false
        },
        {
            id: 4,
            name: 'Business Corp',
            subtitle: 'Prêt pour les entreprises',
            icon: 'domain',
            iconBg: 'bg-indigo-50 dark:bg-indigo-900/20',
            iconColor: 'text-indigo-600 dark:text-indigo-400',
            priceEUR: '99.00',
            priceMAD: '990',
            status: 'archived',
            isLegacy: false
        },
        {
            id: 5,
            name: 'Legacy Starter',
            subtitle: 'Déprécié 2023',
            icon: 'history',
            iconBg: 'bg-slate-100 dark:bg-slate-800',
            iconColor: 'text-slate-400',
            priceEUR: '15.00',
            priceMAD: '150',
            status: 'archived',
            isLegacy: true
        }
    ];

    const stats = [
        {
            label: 'Plans Actifs',
            value: '4',
            badge: 'Actif',
            icon: 'check_circle',
            iconBg: 'bg-green-50 dark:bg-green-900/20',
            iconColor: 'text-green-600 dark:text-green-400',
            badgeColor: 'text-green-600 dark:text-green-400'
        },
        {
            label: 'Total Abonnés',
            value: '1,240',
            badge: '+12%',
            icon: 'groups',
            iconBg: 'bg-blue-50 dark:bg-blue-900/20',
            iconColor: 'text-primary',
            badgeColor: 'text-green-600 dark:text-green-400'
        },
        {
            label: 'Revenu Moy. / Utilisateur',
            value: '45.20€',
            badge: 'Mensuel',
            icon: 'payments',
            iconBg: 'bg-purple-50 dark:bg-purple-900/20',
            iconColor: 'text-purple-600 dark:text-purple-400',
            badgeColor: 'text-slate-400 dark:text-slate-500'
        }
    ];


    const itemsPerPage = 5;
    const [currentPage, setCurrentPage] = useState(1);

    const totalPages = Math.ceil(plans.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedPlans = plans.slice(startIndex, startIndex + itemsPerPage);

    return (
        <AdminLayout>
            <div className="flex-1 overflow-y-auto p-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                            Gestion des Abonnements
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                            Gérez vos paliers de tarification, devises et fonctionnalités des plans.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium text-sm transition-all shadow-sm">
                            <span className="material-icons-outlined text-[20px]">filter_list</span>
                            Filtrer
                        </button>
                        <AdminButton variant="primary" onClick={() => alert('Modal de création de plan - À implémenter')}>
                            <span className="material-icons-outlined text-[20px] mr-2">add</span>
                            Créer un Plan
                        </AdminButton>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {stats.map((stat, index) => (
                        <div
                            key={index}
                            className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm"
                        >
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                    {stat.label}
                                </span>
                                <div className={`p-2 ${stat.iconBg} rounded-lg`}>
                                    <span className={`material-icons-outlined ${stat.iconColor} text-xl`}>
                                        {stat.icon}
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-bold text-slate-900 dark:text-white">
                                    {stat.value}
                                </span>
                                <span className={`text-sm font-medium ${stat.badgeColor}`}>
                                    {stat.badge}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Table */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 dark:bg-slate-700/30 border-b border-slate-200 dark:border-slate-700">
                                    <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                        Nom du Plan
                                    </th>
                                    <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-right">
                                        Prix (EUR)
                                    </th>
                                    <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-right">
                                        Prix (MAD)
                                    </th>
                                    <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                        Fonctionnalités
                                    </th>
                                    <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-center">
                                        Statut
                                    </th>
                                    <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-right">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                {paginatedPlans.map((plan) => (
                                    <tr
                                        key={plan.id}
                                        className="group hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
                                    >
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-lg ${plan.iconBg} flex items-center justify-center ${plan.iconColor}`}>
                                                    <span className="material-icons-outlined">{plan.icon}</span>
                                                </div>
                                                <div>
                                                    <div className={`font-medium ${plan.isLegacy ? 'text-slate-500 dark:text-slate-400' : 'text-slate-900 dark:text-white'}`}>
                                                        {plan.name}
                                                    </div>
                                                    <div className={`text-xs ${plan.isLegacy ? 'text-slate-400' : 'text-slate-500'}`}>
                                                        {plan.subtitle}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className={`py-4 px-6 text-right font-mono text-sm ${plan.isLegacy ? 'text-slate-400 dark:text-slate-500' : 'text-slate-600 dark:text-slate-300'}`}>
                                            {plan.priceEUR}€
                                        </td>
                                        <td className={`py-4 px-6 text-right font-mono text-sm ${plan.isLegacy ? 'text-slate-400 dark:text-slate-500' : 'text-slate-600 dark:text-slate-300'}`}>
                                            {plan.priceMAD} MAD
                                        </td>
                                        <td className="py-4 px-6">
                                            <button className={`text-xs font-medium ${plan.isLegacy ? 'text-slate-400 hover:text-primary' : 'text-primary hover:text-primary-hover dark:hover:text-primary/80'} flex items-center gap-1 transition-colors`}>
                                                <span className="material-icons-outlined text-[16px]">data_object</span>
                                                Voir config
                                            </button>
                                        </td>
                                        <td className="py-4 px-6 text-center">
                                            {plan.status === 'active' ? (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-100 dark:border-green-800">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                                    Actif
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400 border border-slate-200 dark:border-slate-600">
                                                    Archivé
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                                                {plan.status === 'active' ? (
                                                    <>
                                                        <button
                                                            className="p-1.5 rounded-full text-slate-500 hover:text-primary hover:bg-primary/10 transition-colors"
                                                            title="Modifier le Prix"
                                                        >
                                                            <span className="material-icons-outlined text-[20px]">edit</span>
                                                        </button>
                                                        <button
                                                            className="p-1.5 rounded-full text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                                            title="Archiver"
                                                        >
                                                            <span className="material-icons-outlined text-[20px]">archive</span>
                                                        </button>
                                                    </>
                                                ) : (
                                                    <button
                                                        className="p-1.5 rounded-full text-slate-500 hover:text-primary hover:bg-primary/10 transition-colors"
                                                        title="Restaurer"
                                                    >
                                                        <span className="material-icons-outlined text-[20px]">restore_from_trash</span>
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Affichage <span className="font-medium text-slate-900 dark:text-white">{Math.min(plans.length, startIndex + 1)}</span> à{' '}
                            <span className="font-medium text-slate-900 dark:text-white">{Math.min(plans.length, startIndex + itemsPerPage)}</span> sur{' '}
                            <span className="font-medium text-slate-900 dark:text-white">{plans.length}</span> résultats
                        </p>
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage}
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-8 text-center text-xs text-slate-400">
                    © 2024 V-Card SaaS Platform. Tous droits réservés.
                </div>
            </div>
        </AdminLayout>
    );
}
