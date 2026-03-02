'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function CompanyDashboard() {
    const [stats, setStats] = useState({
        employees: 0,
        activeCards: 0,
        totalViews: 0
    });
    const [recentScans, setRecentScans] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const token = localStorage.getItem('accessToken');
                const response = await fetch('/api/company/dashboard', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.success) {
                        setStats(data.data.stats);
                        setRecentScans(data.data.recentScans);
                    }
                }
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8 font-display">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Tableau de Bord</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Gérez vos cartes d'entreprise et les accès employés.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-200 dark:focus:ring-slate-700 transition-all flex items-center gap-2">
                        <span className="material-icons text-[18px]">person_add</span>
                        Inviter Employés
                    </button>
                    <button className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-lg shadow-sm shadow-primary/20 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-slate-900 transition-all flex items-center gap-2">
                        <span className="material-icons text-[18px]">add_card</span>
                        Commander des cartes
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Total Cards */}
                <div className="bg-surface-light dark:bg-surface-dark p-5 rounded-xl border border-border-light dark:border-border-dark shadow-card">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-primary">
                            <span className="material-icons text-[24px]">credit_card</span>
                        </div>
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400">
                            +4 cette semaine
                        </span>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Cartes Actives</p>
                        <div className="flex items-baseline gap-2 mt-1">
                            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{stats.activeCards}</h3>
                            <span className="text-sm text-slate-400">/ ∞</span>
                        </div>
                    </div>
                    <div className="mt-4">
                        <div className="flex justify-between text-xs text-slate-500 mb-1">
                            <span>Utilisation</span>
                            <span>{stats.activeCards > 0 ? '100%' : '0%'}</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                            <div className="bg-primary h-1.5 rounded-full" style={{ width: stats.activeCards > 0 ? '100%' : '0%' }}></div>
                        </div>
                    </div>
                </div>

                {/* Scans This Month */}
                <div className="bg-surface-light dark:bg-surface-dark p-5 rounded-xl border border-border-light dark:border-border-dark shadow-card">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg text-indigo-600 dark:text-indigo-400">
                            <span className="material-icons text-[24px]">qr_code_scanner</span>
                        </div>
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400">
                            <span className="material-icons text-[14px]">trending_up</span>
                            12.5%
                        </span>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Vues Totales</p>
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{stats.totalViews}</h3>
                    </div>
                    <div className="mt-4 h-8 flex items-end gap-1">
                        <div className="w-1/6 bg-indigo-100 dark:bg-indigo-900/30 rounded-sm h-[40%]"></div>
                        <div className="w-1/6 bg-indigo-100 dark:bg-indigo-900/30 rounded-sm h-[60%]"></div>
                        <div className="w-1/6 bg-indigo-100 dark:bg-indigo-900/30 rounded-sm h-[50%]"></div>
                        <div className="w-1/6 bg-indigo-200 dark:bg-indigo-800/40 rounded-sm h-[70%]"></div>
                        <div className="w-1/6 bg-indigo-300 dark:bg-indigo-700/50 rounded-sm h-[85%]"></div>
                        <div className="w-1/6 bg-indigo-500 dark:bg-indigo-500 rounded-sm h-[100%]"></div>
                    </div>
                </div>

                {/* Top Employees (Mocked for now) */}
                <div className="bg-surface-light dark:bg-surface-dark p-5 rounded-xl border border-border-light dark:border-border-dark shadow-card flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg text-orange-600 dark:text-orange-400">
                            <span className="material-icons text-[24px]">groups</span>
                        </div>
                        <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                            <span className="material-icons text-[20px]">more_horiz</span>
                        </button>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Top Employés</p>
                        <div className="flex -space-x-3 mt-3 overflow-hidden">
                            {/* Mock Avatars - In real app, map from top employees API */}
                            <div className="h-10 w-10 rounded-full ring-2 ring-white dark:ring-surface-dark bg-slate-200 flex items-center justify-center text-xs">A</div>
                            <div className="h-10 w-10 rounded-full ring-2 ring-white dark:ring-surface-dark bg-slate-300 flex items-center justify-center text-xs">B</div>
                            <div className="h-10 w-10 rounded-full ring-2 ring-white dark:ring-surface-dark bg-slate-400 flex items-center justify-center text-xs">C</div>
                            <div className="h-10 w-10 rounded-full ring-2 ring-white dark:ring-surface-dark bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-xs font-medium text-slate-500 dark:text-slate-400">
                                +{stats.employees > 3 ? stats.employees - 3 : 0}
                            </div>
                        </div>
                    </div>
                    <div className="mt-4 text-xs text-slate-500">
                        Basé sur l'activité de scan
                    </div>
                </div>
            </div>

            {/* Recent Activity Table */}
            <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark shadow-card overflow-hidden">
                <div className="p-5 border-b border-border-light dark:border-border-dark flex items-center justify-between">
                    <h2 className="text-base font-semibold text-slate-900 dark:text-white">Activité Récente des Cartes</h2>
                    <div className="flex gap-2">
                        <button className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded hover:bg-slate-50 dark:hover:bg-slate-800 transition">
                            <span className="material-icons text-[20px]">filter_list</span>
                        </button>
                        <button className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded hover:bg-slate-50 dark:hover:bg-slate-800 transition">
                            <span className="material-icons text-[20px]">download</span>
                        </button>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-border-light dark:border-border-dark">
                                <th className="py-3 px-5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Employé</th>
                                <th className="py-3 px-5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Carte ID</th>
                                <th className="py-3 px-5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Statut</th>
                                <th className="py-3 px-5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Slug</th>
                                <th className="py-3 px-5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-right">Dernier Scan</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-light dark:divide-border-dark text-sm">
                            {recentScans.length > 0 ? (
                                recentScans.map((scan, index) => (
                                    <tr key={index} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                                        <td className="py-3 px-5">
                                            <div className="flex items-center gap-3">
                                                <div className="relative">
                                                    {/* Avatar Placeholder */}
                                                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs">
                                                        {scan.cardName.charAt(0)}
                                                    </div>
                                                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white dark:border-surface-dark rounded-full"></div>
                                                </div>
                                                <div>
                                                    <p className="font-medium text-slate-900 dark:text-white">{scan.cardName}</p>
                                                    <p className="text-xs text-slate-500">Employé</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-3 px-5 font-mono text-slate-600 dark:text-slate-400 text-xs">
                                            {scan.cardId.substring(0, 8)}...
                                        </td>
                                        <td className="py-3 px-5">
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-900">
                                                Active
                                            </span>
                                        </td>
                                        <td className="py-3 px-5 text-slate-600 dark:text-slate-400">{scan.card.publicSlug}</td>
                                        <td className="py-3 px-5 text-right text-slate-500 dark:text-slate-400 font-mono text-xs">
                                            {new Date(scan.scannedAt).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="py-8 text-center text-slate-500">Aucune activité récente</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6">
                <div className="bg-surface-light dark:bg-surface-dark p-5 rounded-xl border border-border-light dark:border-border-dark shadow-card">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">État du Système</h3>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                API Status
                            </div>
                            <span className="text-emerald-600 dark:text-emerald-400 font-medium">Opérationnel</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                Lecteurs NFC
                            </div>
                            <span className="text-emerald-600 dark:text-emerald-400 font-medium">99.9% Uptime</span>
                        </div>
                    </div>
                </div>
                <div className="bg-slate-900 dark:bg-slate-950 p-6 rounded-xl border border-slate-800 shadow-xl text-white relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 w-32 h-32 bg-primary/20 rounded-full blur-3xl group-hover:bg-primary/30 transition-all duration-500"></div>
                    <div className="relative z-10">
                        <h3 className="text-sm font-bold mb-2">Besoin d'aide ?</h3>
                        <p className="text-xs text-slate-400 mb-5 leading-relaxed">Contactez le support pour commander des cartes en gros ou personnaliser vos options.</p>
                        <button className="text-xs font-bold bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg transition-all shadow-sm shadow-primary/25">
                            Contact Support
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
