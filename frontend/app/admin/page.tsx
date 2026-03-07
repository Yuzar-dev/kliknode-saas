'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { AdminButton } from '@/components/ui/AdminButton';
import { apiClient } from '@/lib/api-client';

export default function AdminDashboard() {
    const [stats, setStats] = useState<any[]>([]);
    const [activities, setActivities] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await apiClient.get('/api/admin/stats');
                const data = response.data;

                const mockStats = [
                    { title: 'Utilisateurs', value: data.totalUsers.toString(), icon: 'group', trend: 'Inscrits globaux', trendUp: null },
                    { title: 'Cartes Actives', value: data.activeCards.toString(), icon: 'nfc', trend: 'En service', trendUp: true },
                    { title: 'Entreprises B2B', value: data.totalCompanies.toString(), icon: 'business', trend: 'Dossiers actifs', trendUp: true },
                    { title: 'MRR (Bêta)', value: '€124.5k', icon: 'payments', trend: '+8.2%', trendUp: true },
                    { title: 'Hardware Orders', value: '42', icon: 'memory', trend: 'En cours', trendUp: true },
                ];

                const mockActivities = [
                    {
                        icon: 'check_circle',
                        iconBg: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
                        title: 'Facture Tesla Inc. payée',
                        description: 'Facture #INV-2024-001 - €12,400',
                        time: 'il y a 2m',
                        badge: { text: 'Payé', variant: 'emerald' }
                    },
                    {
                        icon: 'warning',
                        iconBg: 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400',
                        title: 'Stock Casa critique',
                        description: 'Server Racks (SKU-992) < 5 unités',
                        time: 'il y a 45m',
                        badge: { text: 'Alerte Critique', variant: 'rose' }
                    },
                    {
                        icon: 'person_add',
                        iconBg: 'bg-blue-100 text-blue-600',
                        title: 'Nouvelle inscription utilisateur',
                        description: 'Sophia L. a rejoint l\'Équipe Ingénierie',
                        time: 'il y a 1h',
                        badge: { text: 'Nouvel Utilisateur', variant: 'blue' }
                    },
                    {
                        icon: 'file_download',
                        iconBg: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400',
                        title: 'Rapport Financier T3',
                        description: 'Exporté par l\'Équipe Finance',
                        time: 'il y a 3h',
                        badge: null
                    }
                ];

                setStats(mockStats);
                setActivities(mockActivities);

            } catch (error) {
                console.error('Failed to fetch dashboard stats', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (isLoading) return <AdminLayout><div>Chargement...</div></AdminLayout>;

    return (
        <AdminLayout>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                {stats.map((stat, index) => (
                    <div key={index} className="bg-white dark:bg-surface-dark p-5 rounded-xl border border-slate-200 dark:border-border-dark shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-2">
                            <p className="text-sm font-medium text-text-muted">{stat.title}</p>
                            <span className="material-icons-outlined text-slate-300 text-lg">{stat.icon}</span>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</h3>
                        </div>
                        <div className={`mt-2 flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded w-fit ${stat.trendUp === true ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20' :
                            stat.trendUp === false ? 'text-rose-600 bg-rose-50 dark:bg-rose-900/20' :
                                'text-slate-500 bg-slate-100 dark:bg-slate-800'
                            }`}>
                            {stat.trendUp !== null && (
                                <span className="material-icons-outlined text-[14px]">
                                    {stat.trendUp ? 'trending_up' : 'arrow_downward'}
                                </span>
                            )}
                            <span>{stat.trend}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                {/* Chart */}
                <div className="lg:col-span-2 bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-border-dark shadow-sm p-6 flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Comparaison Croissance Utilisateurs</h3>
                            <p className="text-sm text-text-muted">Répartition régionale : France vs Maroc (6 derniers mois)</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-blue-600"></span>
                                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">France</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Maroc</span>
                            </div>
                            <AdminButton variant="secondary" className="gap-2">
                                <span className="material-icons-outlined text-[18px] text-slate-500">calendar_today</span>
                                30 Derniers Jours
                            </AdminButton>
                        </div>
                    </div>

                    {/* SVG Chart */}
                    <div className="flex-1 w-full min-h-[300px] relative">
                        <svg className="w-full h-full" viewBox="0 0 800 300">
                            <defs>
                                <linearGradient id="gradientFrance" x1="0" x2="0" y1="0" y2="1">
                                    <stop offset="0%" stopColor="#2463eb" stopOpacity="0.2"></stop>
                                    <stop offset="100%" stopColor="#2463eb" stopOpacity="0"></stop>
                                </linearGradient>
                            </defs>

                            {/* Grid lines */}
                            <line className="stroke-slate-200 dark:stroke-slate-700 stroke-dasharray fill-[4]" strokeWidth="1" x1="0" x2="800" y1="250" y2="250"></line>
                            <line className="stroke-slate-200 dark:stroke-slate-700 stroke-dasharray-[4]" strokeWidth="1" x1="0" x2="800" y1="190" y2="190"></line>
                            <line className="stroke-slate-200 dark:stroke-slate-700 stroke-dasharray-[4]" strokeWidth="1" x1="0" x2="800" y1="130" y2="130"></line>
                            <line className="stroke-slate-200 dark:stroke-slate-700 stroke-dasharray-[4]" strokeWidth="1" x1="0" x2="800" y1="70" y2="70"></line>

                            {/* Morocco line */}
                            <path className="fill-none stroke-emerald-500 stroke-[3]" strokeLinecap="round" d="M0 220 C100 220, 160 200, 240 190 S400 150, 480 120 S600 150, 640 140 S750 100, 800 90"></path>

                            {/* France area */}
                            <path fill="url(#gradientFrance)" d="M0 180 C100 180, 160 150, 240 160 S400 120, 480 90 S600 80, 640 60 S750 50, 800 40 V300 H0 Z"></path>

                            {/* France line */}
                            <path className="fill-none stroke-blue-600 stroke-[3]" strokeLinecap="round" d="M0 180 C100 180, 160 150, 240 160 S400 120, 480 90 S600 80, 640 60 S750 50, 800 40"></path>
                        </svg>

                        {/* X-axis labels */}
                        <div className="absolute bottom-0 w-full flex justify-between text-xs text-text-muted px-2">
                            <span>Jan</span>
                            <span>Feb</span>
                            <span>Mar</span>
                            <span>Apr</span>
                            <span>May</span>
                            <span>Jun</span>
                        </div>
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-border-dark shadow-sm flex flex-col overflow-hidden">
                    <div className="p-5 border-b border-slate-200 dark:border-border-dark flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">Activité Récente</h3>
                        <a className="text-xs font-semibold text-primary hover:text-primary-hover" href="#">Tout Voir</a>
                    </div>
                    <div className="flex-1 overflow-y-auto p-0">
                        {activities.map((activity, index) => (
                            <div key={index} className={`flex gap-4 p-4 ${index !== activities.length - 1 ? 'border-b border-slate-200 dark:border-border-dark' : ''} hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group cursor-pointer`}>
                                <div className="mt-1 relative">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${activity.iconBg}`}>
                                        <span className="material-icons-outlined text-sm">{activity.icon}</span>
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <p className="text-sm font-medium text-slate-900 dark:text-white">{activity.title}</p>
                                        <span className="text-[10px] text-text-muted whitespace-nowrap">{activity.time}</span>
                                    </div>
                                    <p className="text-xs text-text-muted mt-0.5 mb-2">{activity.description}</p>
                                    {activity.badge && (
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-${activity.badge.variant}-50 text-${activity.badge.variant}-700 border border-${activity.badge.variant}-100`}>
                                            {activity.badge.text}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pb-8">
                {/* Upload Invoices */}
                <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-5 text-white shadow-lg shadow-blue-600/20 flex flex-col justify-between h-32 relative overflow-hidden group cursor-pointer">
                    <div className="absolute right-0 top-0 w-24 h-24 bg-white opacity-5 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
                    <div className="relative z-10">
                        <span className="material-icons-outlined text-2xl mb-2 opacity-80">cloud_upload</span>
                        <h4 className="font-bold">Télécharger Factures</h4>
                    </div>
                    <div className="relative z-10 flex items-center gap-2 text-sm font-medium opacity-90">
                        <span>Glisser & Déposer</span>
                        <span className="material-icons-outlined text-sm">arrow_forward</span>
                    </div>
                </div>

                {/* Track Shipment */}
                <div className="bg-white dark:bg-surface-dark rounded-xl p-5 border border-slate-200 dark:border-border-dark flex flex-col justify-between h-32 hover:border-blue-500/50 transition-colors cursor-pointer group">
                    <div>
                        <div className="flex justify-between items-start">
                            <span className="material-icons-outlined text-2xl text-slate-400 group-hover:text-primary transition-colors">local_shipping</span>
                            <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-1.5 py-0.5 rounded">LOGISTICS</span>
                        </div>
                        <h4 className="font-bold text-slate-900 dark:text-white mt-2">Suivre Livraison</h4>
                    </div>
                    <p className="text-xs text-text-muted">ID: #SHP-99281 en Transit</p>
                </div>

                {/* Pending Approvals */}
                <div className="bg-white dark:bg-surface-dark rounded-xl p-5 border border-slate-200 dark:border-border-dark flex flex-col justify-between h-32 hover:border-blue-500/50 transition-colors cursor-pointer group">
                    <div>
                        <div className="flex justify-between items-start">
                            <span className="material-icons-outlined text-2xl text-slate-400 group-hover:text-primary transition-colors">group_add</span>
                            <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-1.5 py-0.5 rounded">HR</span>
                        </div>
                        <h4 className="font-bold text-slate-900 dark:text-white mt-2">Approbations en Attente</h4>
                    </div>
                    <div className="flex -space-x-2 overflow-hidden">
                        <div className="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-blue-600 flex items-center justify-center text-[10px] text-white font-bold">S</div>
                        <div className="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-emerald-600 flex items-center justify-center text-[10px] text-white font-bold">M</div>
                        <div className="h-6 w-6 rounded-full ring-2 ring-white bg-slate-100 flex items-center justify-center text-[10px] text-slate-500 font-bold">+2</div>
                    </div>
                </div>

                {/* Live Operations Map */}
                <div className="bg-white dark:bg-surface-dark rounded-xl p-0 border border-slate-200 dark:border-border-dark h-32 overflow-hidden relative group">
                    <div className="w-full h-full bg-slate-800"></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent p-5 flex flex-col justify-end">
                        <h4 className="font-bold text-white">Carte Opérations en Direct</h4>
                        <div className="flex items-center gap-1 text-white/80 text-xs mt-1">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                            <span>Système Opérationnel</span>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
