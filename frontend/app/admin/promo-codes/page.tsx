'use client';

import React, { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Pagination } from '@/components/ui/Pagination';
import { AdminButton } from '@/components/ui/AdminButton';

export default function PromoCodesPage() {
    // Mock data for promo codes
    const promoCodes = [
        {
            code: 'WELCOME20',
            created: 'Créé il y a 2 jours',
            discount: '20% de Réduction',
            scope: 'Tous les Plans',
            duration: 'Pour toujours',
            durationIcon: 'all_inclusive',
            used: 45,
            limit: 100,
            status: 'active',
            color: 'indigo'
        },
        {
            code: 'SUMMER50',
            created: 'Créé il y a 2 mois',
            discount: '50% de Réduction',
            scope: '3 premiers mois',
            duration: 'Récurrent',
            durationIcon: 'repeat',
            used: 500,
            limit: 500,
            status: 'expired',
            color: 'pink'
        },
        {
            code: 'BLACKFRIDAY',
            created: 'Planifié pour le 24 Nov',
            discount: '100€ de Réduction',
            scope: 'Montant Fixe',
            duration: 'Une fois',
            durationIcon: 'looks_one',
            used: 0,
            limit: null, // Unlimited
            status: 'scheduled',
            color: 'orange'
        },
        {
            code: 'VIP2024',
            created: 'Créé hier',
            discount: '15% de Réduction',
            scope: 'Plans Pro Uniquement',
            duration: 'Pour toujours',
            durationIcon: 'all_inclusive',
            used: 12,
            limit: 50,
            status: 'active',
            color: 'indigo'
        },
        {
            code: 'TESTCODE',
            created: 'Créé il y a 5 min',
            discount: '100% de Réduction',
            scope: 'Test uniquement',
            duration: 'Une fois',
            durationIcon: 'looks_one',
            used: 0,
            limit: 5,
            status: 'draft',
            color: 'slate'
        }
    ];

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'active':
                return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
            case 'expired':
                return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400';
            case 'scheduled':
                return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
            case 'draft':
                return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700';
            default:
                return 'bg-slate-100 text-slate-600';
        }
    };

    const getStatusDot = (status: string) => {
        switch (status) {
            case 'active': return 'bg-emerald-500';
            case 'expired': return 'bg-slate-400';
            case 'scheduled': return 'bg-amber-500';
            case 'draft': return 'bg-slate-400';
            default: return 'bg-slate-400';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'active': return 'Actif';
            case 'expired': return 'Expiré';
            case 'scheduled': return 'Planifié';
            case 'draft': return 'Brouillon';
            default: return status;
        }
    };

    const getIconColor = (color: string) => {
        const colors: { [key: string]: string } = {
            indigo: 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400',
            pink: 'bg-pink-50 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400',
            orange: 'bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
            slate: 'bg-slate-100 dark:bg-slate-800 text-slate-500'
        };
        return colors[color] || colors.slate;
    };


    const itemsPerPage = 5;
    const [currentPage, setCurrentPage] = useState(1);

    const totalPages = Math.ceil(promoCodes.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedPromoCodes = promoCodes.slice(startIndex, startIndex + itemsPerPage);

    return (
        <AdminLayout>
            <div className="flex-1 overflow-y-auto p-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
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
                                    Codes Promo
                                </li>
                            </ol>
                        </nav>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                            Gestion des Codes Promo
                        </h1>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            Gérez vos coupons de réduction et suivez leurs performances.
                        </p>
                    </div>

                    <AdminButton
                        variant="primary"
                        onClick={() => alert('Création de code promo - À implémenter')}
                    >
                        <span className="material-icons-outlined text-[20px] mr-2">add</span>
                        Créer un Code Promo
                    </AdminButton>
                </div>

                {/* Search & Filter */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-1 mb-6 shadow-sm flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                        <span className="material-icons-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">search</span>
                        <input
                            type="text"
                            className="w-full pl-10 pr-4 py-2 bg-transparent border-none text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:ring-0 rounded-full"
                            placeholder="Rechercher par code..."
                        />
                    </div>
                    <div className="flex items-center gap-2 px-2 border-l border-slate-200 dark:border-slate-700 pl-4">
                        <button className="px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors flex items-center gap-2">
                            <span className="material-icons-outlined text-[18px]">filter_list</span>
                            Filtrer
                        </button>
                        <button className="px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors flex items-center gap-2">
                            <span className="material-icons-outlined text-[18px]">sort</span>
                            Trier
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Code</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Réduction</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Durée</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Limite d&apos;Usage</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Statut</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-700 text-sm">
                                {paginatedPromoCodes.map((promo, index) => (
                                    <tr key={index} className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded ${getIconColor(promo.color)}`}>
                                                    <span className="material-icons-outlined text-[18px]">local_activity</span>
                                                </div>
                                                <div>
                                                    <div className="font-mono font-bold text-slate-900 dark:text-white text-base">{promo.code}</div>
                                                    <div className="text-xs text-slate-500">{promo.created}</div>
                                                </div>
                                                <button className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-primary transition-opacity" title="Copier le code">
                                                    <span className="material-icons-outlined text-[16px]">content_copy</span>
                                                </button>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="font-bold text-primary text-base">{promo.discount}</span>
                                            <span className="block text-xs text-slate-400 mt-0.5">{promo.scope}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-slate-600 dark:text-slate-300">
                                            <div className="flex items-center gap-1.5">
                                                <span className="material-icons-outlined text-[16px] text-slate-400">{promo.durationIcon}</span>
                                                {promo.duration}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="w-32">
                                                <div className="flex justify-between text-xs mb-1.5">
                                                    <span className="font-medium text-slate-700 dark:text-slate-300">{promo.used} utilisés</span>
                                                    <span className="text-slate-400">{promo.limit ? `sur ${promo.limit}` : 'Illimité'}</span>
                                                </div>
                                                <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full ${promo.status === 'expired' ? 'bg-slate-400' : 'bg-slate-900 dark:bg-primary'}`}
                                                        style={{ width: promo.limit ? `${(promo.used / promo.limit) * 100}%` : '0%' }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusStyle(promo.status)}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${getStatusDot(promo.status)}`}></span>
                                                {getStatusLabel(promo.status)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                                                <span className="material-icons-outlined text-[20px]">more_vert</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50/30 dark:bg-slate-800/20 flex items-center justify-between">
                        <div className="text-sm text-slate-500 dark:text-slate-400">
                            Affichage <span className="font-medium text-slate-900 dark:text-white">{Math.min(promoCodes.length, startIndex + 1)}</span> à <span className="font-medium text-slate-900 dark:text-white">{Math.min(promoCodes.length, startIndex + itemsPerPage)}</span> sur <span className="font-medium text-slate-900 dark:text-white">{promoCodes.length}</span> résultats
                        </div>
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage}
                        />
                    </div>
                </div>

                {/* Bottom Stats Grid */}
                <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600">
                                <span className="material-icons-outlined">savings</span>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-500">Total des Réductions</p>
                                <p className="text-2xl font-bold text-slate-900 dark:text-white">12 450€</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg text-emerald-600">
                                <span className="material-icons-outlined">redeem</span>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-500">Coupons Actifs</p>
                                <p className="text-2xl font-bold text-slate-900 dark:text-white">8</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-purple-600">
                                <span className="material-icons-outlined">confirmation_number</span>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-500">Total des Utilisations</p>
                                <p className="text-2xl font-bold text-slate-900 dark:text-white">1 204</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout >
    );
}
