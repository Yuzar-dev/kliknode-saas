'use client';

import React, { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Pagination } from '@/components/ui/Pagination';
import { AdminButton } from '@/components/ui/AdminButton';

type AuditLog = {
    id: string;
    actor: {
        name: string;
        email: string;
        avatar?: string;
        initials?: string;
        color?: string; // bg-color class
        isSystem?: boolean;
    };
    action: {
        type: 'Critical' | 'Update' | 'System' | 'Warning' | 'Access' | 'Config' | 'Deletion';
        title: string;
        description: string;
    };
    date: string;
    ip: string;
};

export default function AuditLogsPage() {
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Mock Data based on HTML
    const logs: AuditLog[] = [
        {
            id: '1',
            actor: {
                name: 'Alice Smith',
                email: 'alice@corp.com',
                avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuARRtCtECFTxCHsahM93bGdiUBhuK09WidsDmyC1cT2spMCedWe3fLhlbosh2MrmYIHK7Oi0H_kPVaUdSxm8iJIujRJdpUo1FO8kuO5QuJV9O2am-w6OZwcKhnh2yfdI3H58oaNDKgB0vgKehsvsPRdSjStubO-NAjU1Q96vGVDgVyF6Kj_K2rnuzFf6fNJbrtDbwYcvU4zhjX2_Ta2RQ26A48djUY_IPNrI6Q7Y0Rx-dxZfD0sinNpZ0yHTXsY-aWJBu8T3APWD5U'
            },
            action: {
                type: 'Critical',
                title: 'Deleted Plan',
                description: '"Enterprise-2023"'
            },
            date: 'Oct 24, 2023 14:32:01',
            ip: '192.168.1.45'
        },
        {
            id: '2',
            actor: {
                name: 'Bob Jones',
                email: 'bob@corp.com',
                initials: 'BJ',
                color: 'bg-purple-100 text-purple-700'
            },
            action: {
                type: 'Update',
                title: 'Updated Role',
                description: '"Admin" for User ID #442'
            },
            date: 'Oct 24, 2023 14:30:15',
            ip: '10.0.0.12'
        },
        {
            id: '3',
            actor: {
                name: 'System Bot',
                email: 'automated@sys.corp',
                isSystem: true
            },
            action: {
                type: 'System',
                title: 'Auto-Backup',
                description: 'Database snapshot'
            },
            date: 'Oct 24, 2023 12:00:00',
            ip: '127.0.0.1'
        },
        {
            id: '4',
            actor: {
                name: 'David Miller',
                email: 'david@corp.com',
                avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCVw_IfUE4GTvMNkC4HmZSZLs_mz-c-vUVaDNUyg-rrNoe4Iccok6xjpcKzXtSovoNzMbtCYNamVAWZrQ25Gfy6x_w5VHC5KVW6SZF1YsP5bD1vPNH_XVD662mK0dAi4gXDpq6lnOJxZbPC6YbrgfdkH3-rXh-lLOV0VM8biph5H5yPR-4T7ne33H8f5wIq0dqwAwkk5dfLIGPIM-ZlMdNLBsp8feZXY9sX-yKa8BkGq8zbz5KinMlbXfY5L_zAr82tIcPxwb3-y8M'
            },
            action: {
                type: 'Warning',
                title: 'Failed Login',
                description: '3 attempts'
            },
            date: 'Oct 24, 2023 11:45:12',
            ip: '89.23.120.1'
        },
        {
            id: '5',
            actor: {
                name: 'Sarah Jenkins',
                email: 'sarah@corp.com',
                initials: 'SJ',
                color: 'bg-pink-100 text-pink-700'
            },
            action: {
                type: 'Access',
                title: 'Exported Data',
                description: 'Client List CSV'
            },
            date: 'Oct 24, 2023 10:12:44',
            ip: '192.168.1.102'
        },
        {
            id: '6',
            actor: {
                name: 'Elena Rodriguez',
                email: 'elena@corp.com',
                avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCswXunCyrIwUQJif5bQiFY1_0n7t_jKEmpm12OsFEUW62GCT7RUG7QhDV12pKsRvBcxN7aw_chpikhJ09Qy8NYVi7dvcu_zZYlsZUhZ69o1LCZsjNd4T2dJL93EmFjYHXSdE2R9gfMvjb5LcSjjBEoUxYVYMUj8xRMeWfDuR708pJw5IdAhurCyzafiQk809z3dx8jFhLATWccTV9Rmh1f_UZidOW3ZYrBSSB2oP22ueebCXtiiOKzdX0Mmk_qJ7BDx9BOxry--xg'
            },
            action: {
                type: 'Config',
                title: 'Changed Settings',
                description: 'Email Notification Templates'
            },
            date: 'Oct 24, 2023 09:30:10',
            ip: '45.21.11.8'
        },
        {
            id: '7',
            actor: {
                name: 'Kevin White',
                email: 'kevin@corp.com',
                initials: 'KW',
                color: 'bg-orange-100 text-orange-700'
            },
            action: {
                type: 'Deletion',
                title: 'Removed User',
                description: '"guest_user_22"'
            },
            date: 'Oct 23, 2023 18:15:00',
            ip: '192.168.1.18'
        }
    ];

    const totalItems = 2450; // Mock total
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    const getActionBadgeColor = (type: string) => {
        switch (type) {
            case 'Critical': return 'bg-red-50 text-red-700 border-red-100';
            case 'Update': return 'bg-blue-50 text-blue-700 border-blue-100';
            case 'System': return 'bg-green-50 text-green-700 border-green-100';
            case 'Warning': return 'bg-amber-50 text-amber-700 border-amber-100';
            case 'Access': return 'bg-slate-100 text-slate-700 border-slate-200';
            case 'Config': return 'bg-blue-50 text-blue-700 border-blue-100';
            case 'Deletion': return 'bg-red-50 text-red-700 border-red-100';
            default: return 'bg-slate-50 text-slate-700 border-slate-100';
        }
    };

    return (
        <AdminLayout>
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-50 dark:bg-slate-900">
                <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-8 py-5 flex items-center justify-between flex-shrink-0 shadow-sm z-0 relative">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">Journal d'Audit Système</h1>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Suivez et surveillez les actions sensibles effectuées dans votre organisation.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700 flex items-center">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block mr-2 animate-pulse"></span>
                            Surveillance en Direct
                        </span>
                        <AdminButton variant="secondary" className="gap-2">
                            <span className="material-icons-outlined text-lg">download</span>
                            Exporter les Logs
                        </AdminButton>
                    </div>
                </header>

                <div className="px-8 py-6 h-full overflow-y-auto">
                    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden mb-6">
                        {/* Filters */}
                        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-3 flex-1">
                                <div className="relative max-w-sm w-full">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <span className="material-icons-outlined text-slate-400 text-lg">search</span>
                                    </div>
                                    <input
                                        className="block w-full pl-10 pr-3 py-2 border border-slate-300 dark:border-slate-600 rounded-full leading-5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-0 focus:border-blue-500 focus:shadow-[0_0_10px_rgba(59,130,246,0.5)] sm:text-sm shadow-sm transition-all"
                                        placeholder="Rechercher par utilisateur, IP, ou action..."
                                        type="text"
                                    />
                                </div>
                                <div className="relative">
                                    <AdminButton variant="secondary" className="gap-2">
                                        <span className="material-icons-outlined text-slate-400 text-lg">filter_list</span>
                                        Filtrer
                                    </AdminButton>
                                </div>
                                <div className="relative">
                                    <AdminButton variant="secondary" className="gap-2">
                                        <span className="material-icons-outlined text-slate-400 text-lg">calendar_today</span>
                                        30 Derniers Jours
                                    </AdminButton>
                                </div>
                            </div>
                            <div className="text-sm text-slate-500 dark:text-slate-400">
                                Affichage de <span className="font-bold text-slate-900 dark:text-white">1</span> à <span className="font-bold text-slate-900 dark:text-white">{itemsPerPage}</span> sur <span className="font-bold text-slate-900 dark:text-white">{totalItems.toLocaleString()}</span> événements
                            </div>
                        </div>

                        {/* Table */}
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800">
                                <thead className="bg-slate-50 dark:bg-slate-800/50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider" scope="col">Acteur</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider" scope="col">Action</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider" scope="col">Date & Heure</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider" scope="col">Adresse IP</th>
                                        <th className="relative px-6 py-3" scope="col"><span className="sr-only">Détails</span></th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800">
                                    {logs.map((log) => (
                                        <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                                            {/* Actor */}
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0 h-9 w-9">
                                                        {log.actor.isSystem ? (
                                                            <div className="h-9 w-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 ring-1 ring-slate-200 dark:ring-slate-700">
                                                                <span className="material-icons-outlined text-base">smart_toy</span>
                                                            </div>
                                                        ) : log.actor.avatar ? (
                                                            <img
                                                                alt={log.actor.name}
                                                                className="h-9 w-9 rounded-full ring-1 ring-slate-100 dark:ring-slate-700 object-cover"
                                                                src={log.actor.avatar}
                                                            />
                                                        ) : (
                                                            <div className={`h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold ring-1 ring-opacity-50 ${log.actor.color}`}>
                                                                {log.actor.initials}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="ml-3">
                                                        <div className="text-sm font-semibold text-slate-900 dark:text-white">{log.actor.name}</div>
                                                        <div className="text-xs text-slate-500 dark:text-slate-400">{log.actor.email}</div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Action */}
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full border mr-3 ${getActionBadgeColor(log.action.type)}`}>
                                                        {log.action.type}
                                                    </span>
                                                    <div className="text-sm text-slate-900 dark:text-white font-medium">
                                                        {log.action.title} <span className="font-normal text-slate-500 dark:text-slate-400">{log.action.description}</span>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Date */}
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-slate-500 dark:text-slate-400 font-mono bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded inline-block">
                                                    {log.date}
                                                </div>
                                            </td>

                                            {/* IP */}
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400 font-mono">
                                                {log.ip}
                                            </td>

                                            {/* Details */}
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button className="text-primary hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 opacity-0 group-hover:opacity-100 transition-opacity font-semibold">
                                                    Détails
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className="bg-white dark:bg-slate-900 px-4 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between sm:px-6">
                            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                <div>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        Affichage de <span className="font-bold text-slate-900 dark:text-white">1</span> à <span className="font-bold text-slate-900 dark:text-white">{itemsPerPage}</span> sur <span className="font-bold text-slate-900 dark:text-white">{totalItems.toLocaleString()}</span> résultats
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
            </div>
        </AdminLayout>
    );
}
