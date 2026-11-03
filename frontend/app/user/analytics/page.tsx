'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import ProFeatureGuard from '@/components/user/ProFeatureGuard';
import { apiClient } from '@/lib/api-client';
import { Eye, Nfc, Users, MousePointer, Share2, Sparkles, TrendingUp, HelpCircle } from 'lucide-react';
import dynamic from 'next/dynamic';

// Dynamically import Recharts to avoid SSR hydration mismatch
const ResponsiveContainer = dynamic(
    () => import('recharts').then((mod) => mod.ResponsiveContainer),
    { ssr: false }
);
const AreaChart = dynamic(
    () => import('recharts').then((mod) => mod.AreaChart),
    { ssr: false }
);
const Area = dynamic(
    () => import('recharts').then((mod) => mod.Area),
    { ssr: false }
);
const BarChart = dynamic(
    () => import('recharts').then((mod) => mod.BarChart),
    { ssr: false }
);
const Bar = dynamic(
    () => import('recharts').then((mod) => mod.Bar),
    { ssr: false }
);
const PieChart = dynamic(
    () => import('recharts').then((mod) => mod.PieChart),
    { ssr: false }
);
const Pie = dynamic(
    () => import('recharts').then((mod) => mod.Pie),
    { ssr: false }
);
const Cell = dynamic(
    () => import('recharts').then((mod) => mod.Cell),
    { ssr: false }
);
const XAxis = dynamic(
    () => import('recharts').then((mod) => mod.XAxis),
    { ssr: false }
);
const YAxis = dynamic(
    () => import('recharts').then((mod) => mod.YAxis),
    { ssr: false }
);
const Tooltip = dynamic(
    () => import('recharts').then((mod) => mod.Tooltip),
    { ssr: false }
);

interface AnalyticsData {
    totalViews: number;
    totalScans: number;
    recentScans: number;
    totalContacts: number;
    dailyScans: Record<string, number>;
    totalClicks: number;
    clickStats: Record<string, number>;
}

const COLORS = ['#0666EB', '#7C3AED', '#10B981', '#F59E0B', '#F43F5E', '#14B8A6', '#8B5CF6'];

export default function AnalyticsPage() {
    const [stats, setStats] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadAnalytics();
    }, []);

    const loadAnalytics = async () => {
        try {
            const response = await apiClient.get('/api/user/analytics');
            if (response.data.success) {
                setStats(response.data.data);
            }
        } catch (e: any) {
            console.error('Failed to load analytics:', e);
            toast.error('Impossible de charger les statistiques.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin h-10 w-10 border-4 border-spaceGray dark:border-white border-t-transparent rounded-full" />
            </div>
        );
    }

    const totalViews = stats?.totalViews || 0;
    const totalScans = stats?.totalScans || 0;
    const totalContacts = stats?.totalContacts || 0;
    const totalClicks = stats?.totalClicks || 0;
    
    // Taux de conversion NFC (contacts créés / scans totaux)
    const nfcConversionRate = totalScans > 0 
        ? Math.min(100, Math.round((totalContacts / totalScans) * 100)) 
        : 0;

    // Taux d'interaction (clics sur liens / vues de la page)
    const interactionRate = totalViews > 0 
        ? Math.min(100, Math.round((totalClicks / totalViews) * 100)) 
        : 0;

    const statCards = [
        {
            label: 'Vues du Profil',
            value: totalViews,
            icon: Eye,
            color: 'from-blue-500/20 to-indigo-500/20',
            textColor: 'text-blue-600 dark:text-blue-400',
            desc: 'Nombre total d\'affichages du profil public'
        },
        {
            label: 'Scans NFC & QR',
            value: totalScans,
            icon: Nfc,
            color: 'from-purple-500/20 to-pink-500/20',
            textColor: 'text-purple-600 dark:text-purple-400',
            desc: 'Scans physiques ou scans de QR code direct'
        },
        {
            label: 'Prospects Capturés',
            value: totalContacts,
            icon: Users,
            color: 'from-emerald-500/20 to-teal-500/20',
            textColor: 'text-emerald-600 dark:text-emerald-400',
            desc: 'Formulaires "Échangeons nos contacts" remplis'
        },
        {
            label: 'Clics sur Liens',
            value: totalClicks,
            icon: MousePointer,
            color: 'from-amber-500/20 to-orange-500/20',
            textColor: 'text-amber-600 dark:text-amber-400',
            desc: 'Clics sur vos réseaux, boutons ou site web'
        },
    ];

    // Generate last 30 days for scan evolution chart
    const days: string[] = [];
    for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        days.push(d.toISOString().split('T')[0]);
    }
    const chartDataScans = days.map(d => ({
        date: new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
        'Scans': stats?.dailyScans?.[d] || 0
    }));

    // Clicks grouped by platform / link type for the pie chart
    const clickData = Object.entries(stats?.clickStats || {}).map(([key, value]) => ({
        name: key.charAt(0).toUpperCase() + key.slice(1),
        value: value
    })).sort((a, b) => b.value - a.value);

    return (
        <ProFeatureGuard 
            title="Découvrez votre Moteur d'Analytics PRO" 
            description="Analysez précisément l'engagement de votre audience. Suivez l'évolution de vos scans et découvrez quels liens performent le mieux."
        >
            <div className="pb-20 relative selection:bg-slate-200 px-4 md:px-0">
                <div className="relative z-10">
                    <div className="mb-8 md:mb-10 flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl md:text-4xl font-black text-apple-textDark dark:text-white tracking-tight flex items-center gap-2">
                                Moteur d'Analytics
                                <span className="text-xs bg-gradient-to-r from-primary to-indigo-600 text-white font-black px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm animate-pulse">PRO</span>
                            </h1>
                            <p className="text-apple-secondary dark:text-gray-400 font-bold text-sm mt-2">
                                Mesurez scientifiquement la performance de vos rencontres et de votre réseau.
                            </p>
                        </div>
                    </div>

                    {/* Stat Cards Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8 md:mb-10">
                        {statCards.map((s) => (
                            <div key={s.label} className="klik-glass p-6 rounded-[2rem] border border-white/60 dark:border-white/5 shadow-sm group hover:shadow-xl transition-all duration-500 overflow-hidden relative">
                                <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${s.color} blur-3xl opacity-30 -mr-12 -mt-12 group-hover:opacity-50 transition-all duration-700`} />
                                <div className="flex flex-col gap-4">
                                    <div className="flex items-center justify-between">
                                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-white dark:bg-white/5 shadow-sm border border-gray-100 dark:border-white/10">
                                            <s.icon className={`w-6 h-6 ${s.textColor}`} />
                                        </div>
                                        <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider bg-slate-50 dark:bg-slate-800/40 px-2.5 py-1 rounded-full border border-slate-100 dark:border-slate-800/20">30 jours</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <p className="text-3xl font-black tracking-tighter text-apple-textDark dark:text-white">
                                            {s.value.toLocaleString()}
                                        </p>
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-apple-secondary dark:text-gray-500 mt-1">
                                            {s.label}
                                        </p>
                                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold mt-2 leading-tight">
                                            {s.desc}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Conversion Indicators & Rates */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-8 md:mb-10">
                        {/* NFC Scan to Contact Conversion Card */}
                        <div className="klik-glass p-8 rounded-[2rem] border border-white/60 dark:border-white/5 shadow-md relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-6">
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <TrendingUp className="w-5 h-5 text-emerald-500" />
                                    <h4 className="text-sm font-black text-apple-textDark dark:text-white uppercase tracking-wider">Taux de Conversion NFC</h4>
                                </div>
                                <p className="text-xs text-apple-secondary dark:text-gray-400 font-semibold leading-relaxed max-w-sm">
                                    Le pourcentage de personnes ayant scanné votre carte physique ou QR Code et qui ont activement choisi d'échanger leurs contacts avec vous.
                                </p>
                            </div>
                            <div className="relative shrink-0 flex items-center justify-center w-28 h-28 rounded-full border-4 border-emerald-500/10 bg-emerald-500/5 shadow-inner">
                                <div className="text-center">
                                    <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{nfcConversionRate}%</span>
                                    <p className="text-[8px] font-black text-emerald-500 uppercase tracking-widest mt-0.5">Prospects/Scans</p>
                                </div>
                            </div>
                        </div>

                        {/* Interactive Click Engagement Card */}
                        <div className="klik-glass p-8 rounded-[2rem] border border-white/60 dark:border-white/5 shadow-md relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-6">
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <Share2 className="w-5 h-5 text-blue-500" />
                                    <h4 className="text-sm font-black text-apple-textDark dark:text-white uppercase tracking-wider">Taux d'Interaction Liens</h4>
                                </div>
                                <p className="text-xs text-apple-secondary dark:text-gray-400 font-semibold leading-relaxed max-w-sm">
                                    Le pourcentage cumulé d'interactions sur vos boutons sociaux, réseaux ou sites par rapport au volume global de consultations de votre profil.
                                </p>
                            </div>
                            <div className="relative shrink-0 flex items-center justify-center w-28 h-28 rounded-full border-4 border-blue-500/10 bg-blue-500/5 shadow-inner">
                                <div className="text-center">
                                    <span className="text-3xl font-black text-blue-600 dark:text-blue-400">{interactionRate}%</span>
                                    <p className="text-[8px] font-black text-blue-500 uppercase tracking-widest mt-0.5">Clics/Vues</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Charts Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 md:mb-10">
                        {/* Scan activity evolution */}
                        <div className="klik-glass p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] border border-white/60 dark:border-white/5 shadow-lg lg:col-span-2 flex flex-col">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h3 className="text-lg md:text-xl font-black text-apple-textDark dark:text-white tracking-tight">Activité des Scans</h3>
                                    <p className="text-apple-secondary dark:text-gray-500 font-bold text-xs mt-1">Évolution sur les 30 derniers jours</p>
                                </div>
                                <div className="flex items-center gap-2 px-4 py-2 bg-white/40 dark:bg-white/5 rounded-full border border-gray-100 dark:border-white/10">
                                    <span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)] animate-pulse" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-apple-secondary dark:text-gray-400">Temps Réel</span>
                                </div>
                            </div>

                            <div className="h-[280px] w-full mt-auto">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={chartDataScans} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorScans" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#0666EB" stopOpacity={0.4}/>
                                                <stop offset="95%" stopColor="#7C3AED" stopOpacity={0.0}/>
                                            </linearGradient>
                                        </defs>
                                        <XAxis 
                                            dataKey="date" 
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fontSize: 9, fontWeight: 'bold', fill: '#94a3b8' }}
                                        />
                                        <YAxis 
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fontSize: 9, fontWeight: 'bold', fill: '#94a3b8' }}
                                            allowDecimals={false}
                                        />
                                        <Tooltip 
                                            contentStyle={{ 
                                                backgroundColor: '#0f172a', 
                                                borderRadius: '16px',
                                                border: 'none',
                                                color: '#fff',
                                                fontSize: '11px',
                                                fontWeight: 'bold',
                                                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)'
                                            }}
                                        />
                                        <Area 
                                            type="monotone" 
                                            dataKey="Scans" 
                                            stroke="#0666EB" 
                                            strokeWidth={3}
                                            fillOpacity={1} 
                                            fill="url(#colorScans)" 
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Link clicks pie distribution */}
                        <div className="klik-glass p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] border border-white/60 dark:border-white/5 shadow-lg flex flex-col">
                            <div>
                                <h3 className="text-lg md:text-xl font-black text-apple-textDark dark:text-white tracking-tight">Répartition des Clics</h3>
                                <p className="text-apple-secondary dark:text-gray-500 font-bold text-xs mt-1">Quels liens ou boutons performent le mieux</p>
                            </div>

                            {clickData.length === 0 ? (
                                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 my-6 bg-slate-50/50 dark:bg-slate-900/40 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                                    <Share2 className="w-10 h-10 text-slate-400 mb-3" />
                                    <p className="text-sm font-black text-apple-textDark dark:text-white">Aucun clic enregistré</p>
                                    <p className="text-xs text-slate-400 mt-1 max-w-xs font-semibold">
                                        Les clics sur vos boutons de réseaux sociaux apparaîtront sous forme de graphique circulaire dès qu'ils seront sollicités.
                                    </p>
                                </div>
                            ) : (
                                <>
                                    <div className="h-[200px] w-full relative my-auto">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={clickData}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={60}
                                                    outerRadius={80}
                                                    paddingAngle={3}
                                                    dataKey="value"
                                                >
                                                    {clickData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip
                                                    contentStyle={{
                                                        backgroundColor: '#0f172a',
                                                        borderRadius: '12px',
                                                        border: 'none',
                                                        color: '#fff',
                                                        fontSize: '11px',
                                                        fontWeight: 'bold'
                                                    }}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                            <span className="text-2xl font-black text-apple-textDark dark:text-white">{totalClicks}</span>
                                            <span className="text-[8px] font-black uppercase text-slate-400 tracking-wider">Clics</span>
                                        </div>
                                    </div>

                                    {/* Legends list */}
                                    <div className="space-y-2 mt-auto">
                                        {clickData.slice(0, 4).map((entry, index) => (
                                            <div key={entry.name} className="flex items-center justify-between text-xs">
                                                <div className="flex items-center gap-2 font-bold text-slate-700 dark:text-slate-300">
                                                    <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                                    <span className="truncate max-w-[120px]">{entry.name}</span>
                                                </div>
                                                <span className="font-mono font-black text-slate-900 dark:text-white">
                                                    {entry.value} clics ({Math.round((entry.value / totalClicks) * 100)}%)
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </ProFeatureGuard>
    );
}
