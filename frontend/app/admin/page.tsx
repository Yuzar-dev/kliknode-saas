'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { AdminButton } from '@/components/ui/AdminButton';
import { apiClient } from '@/lib/api-client';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
    const [stats, setStats] = useState<any[]>([]);
    const [activities, setActivities] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await apiClient.get('/api/admin/stats');
                // The API returns { success: true, data: { totalUsers: X, ... } }
                const data = response.data.data;

                const realStats = [
                    { title: 'Utilisateurs', value: data.totalUsers.toString(), icon: 'group', trend: 'Inscrits globaux', trendUp: null },
                    { title: 'Cartes Actives', value: data.activeCards.toString(), icon: 'nfc', trend: 'En service', trendUp: true },
                    { title: 'Entreprises B2B', value: data.totalCompanies.toString(), icon: 'business', trend: 'Dossiers actifs', trendUp: true },
                    { title: 'MRR (Bêta)', value: `€${(data.mrrEur || 0).toLocaleString()}`, icon: 'payments', trend: '30 Derniers Jours', trendUp: true },
                    { title: 'Hardware Orders', value: (data.hardwareOrdersPending || 0).toString(), icon: 'memory', trend: 'En attente', trendUp: true },
                ];

                let realActivities = data.recentActivities || [];
                if (realActivities.length === 0) {
                    realActivities = [
                        {
                            icon: 'info',
                            iconBg: 'bg-slate-100 text-slate-600',
                            title: 'Aucune activité récente',
                            description: 'Le journal est vide.',
                            time: '',
                            badge: null
                        }
                    ];
                }

                setStats(realStats);
                setActivities(realActivities);

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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-10">
                {stats.map((stat, index) => (
                    <div key={index} className="klik-glass p-8 rounded-[2.5rem] border border-white/40 dark:border-white/5 shadow-glass-light dark:shadow-glass-dark hover:scale-[1.05] transition-all duration-500 group overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/10 blur-2xl -mr-8 -mt-8 group-hover:bg-blue-500/20 transition-all"></div>
                        <div className="flex justify-between items-start mb-6">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-apple-secondary dark:text-slate-500">{stat.title}</p>
                            <span className="material-icons-outlined text-blue-500/40 group-hover:text-blue-500 transition-colors text-xl">{stat.icon}</span>
                        </div>
                        <div className="flex items-baseline gap-2 mb-4">
                            <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">{stat.value}</h3>
                        </div>
                        <div className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl w-fit border ${stat.trendUp === true ? 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20' :
                            stat.trendUp === false ? 'text-rose-600 bg-rose-500/10 border-rose-500/20' :
                                'text-slate-500 bg-slate-500/10 border-slate-500/20'
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
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                {/* Chart */}
                <div className="lg:col-span-2 klik-glass rounded-[2.5rem] border border-white/40 dark:border-white/5 shadow-glass-light dark:shadow-glass-dark p-10 flex flex-col">
                    <div className="flex justify-between items-center mb-10">
                        <div>
                            <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Comparaison Croissance Utilisateurs</h3>
                            <p className="text-[11px] font-bold text-apple-secondary dark:text-slate-500 uppercase tracking-widest mt-1">Répartition régionale : France vs Maroc (6 derniers mois)</p>
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
                <div className="klik-glass rounded-[2.5rem] border border-white/40 dark:border-white/5 shadow-glass-light dark:shadow-glass-dark mb-8 flex flex-col overflow-hidden">
                    <div className="p-8 border-b border-white/10 flex justify-between items-center bg-white/5 dark:bg-black/20">
                        <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Activité Récente</h3>
                        <a className="text-[10px] font-black uppercase tracking-widest text-blue-500 hover:text-blue-600 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 transition-all" href="#">Tout Voir</a>
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
                                        <span className="text-[10px] text-text-muted whitespace-nowrap">{new Date(activity.time).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
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
                <div onClick={() => router.push('/admin/transactions')} className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-[24px] p-6 text-white shadow-lg shadow-blue-600/20 flex flex-col justify-between h-36 relative overflow-hidden group cursor-pointer transition-all duration-300 hover:scale-[1.02]">
                    <div className="absolute right-0 top-0 w-24 h-24 bg-white opacity-5 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
                    <div className="relative z-10">
                        <span className="material-icons-outlined text-2xl mb-2 opacity-80">receipt_long</span>
                        <h4 className="font-bold">Gérer Factures</h4>
                    </div>
                    <div className="relative z-10 flex items-center gap-2 text-sm font-medium opacity-90">
                        <span>Ouvrir</span>
                        <span className="material-icons-outlined text-sm">arrow_forward</span>
                    </div>
                </div>

                {/* Track Shipment */}
                <div onClick={() => router.push('/admin/hardware-orders')} className="klik-glass rounded-[24px] p-6 border-none shadow-glass-light dark:shadow-glass-dark flex flex-col justify-between h-36 hover:scale-[1.02] transition-all duration-300 cursor-pointer group">
                    <div>
                        <div className="flex justify-between items-start">
                            <span className="material-icons-outlined text-2xl text-slate-400 group-hover:text-primary transition-colors">local_shipping</span>
                            <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-bold px-2 py-0.5 rounded-full">LOGISTICS</span>
                        </div>
                        <h4 className="font-bold text-slate-900 dark:text-white mt-2">Suivre Commandes</h4>
                    </div>
                    <p className="text-xs text-text-muted">{stats[4]?.value} commande(s) en attente</p>
                </div>

                {/* Pending Approvals */}
                <div onClick={() => router.push('/admin/companies/new')} className="klik-glass rounded-[24px] p-6 border-none shadow-glass-light dark:shadow-glass-dark flex flex-col justify-between h-36 hover:scale-[1.02] transition-all duration-300 cursor-pointer group">
                    <div>
                        <div className="flex justify-between items-start">
                            <span className="material-icons-outlined text-2xl text-slate-400 group-hover:text-primary transition-colors">group_add</span>
                            <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-bold px-2 py-0.5 rounded-full">SALES</span>
                        </div>
                        <h4 className="font-bold text-slate-900 dark:text-white mt-2">Nouveaux Dossiers B2B</h4>
                    </div>
                    <div className="flex -space-x-2 overflow-hidden">
                        <div className="inline-block h-6 w-6 rounded-full ring-2 ring-white dark:ring-black bg-blue-600 flex items-center justify-center text-[10px] text-white font-bold">+</div>
                    </div>
                </div>

                {/* Live Operations Map */}
                <div onClick={() => router.push('/admin/batch-generator')} className="klik-glass rounded-[24px] p-0 border-none h-36 overflow-hidden relative group cursor-pointer hover:scale-[1.02] transition-all duration-300">
                    <div className="w-full h-full bg-slate-800"></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent p-6 flex flex-col justify-end">
                        <h4 className="font-bold text-white">Générateur Lots B2B</h4>
                        <div className="flex items-center gap-2 text-white/80 text-xs mt-1">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]"></span>
                            <span>Système Prêt</span>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
