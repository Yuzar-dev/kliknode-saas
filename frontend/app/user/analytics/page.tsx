'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';

interface AnalyticsData {
    totalViews: number;
    totalScans: number;
    recentScans: number;
    totalContacts: number;
    dailyScans: Record<string, number>;
}

export default function AnalyticsPage() {
    const [stats, setStats] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadAnalytics();
    }, []);

    const loadAnalytics = async () => {
        try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // 1. Fetch card stats (views and scans)
            const { data: cardData, error: cardError } = await supabase
                .from('cards')
                .select('view_count, scan_count')
                .eq('assigned_user_id', user.id)
                .single();

            // 2. Fetch contact count
            const { count: contactCount, error: contactError } = await supabase
                .from('contacts')
                .select('*', { count: 'exact', head: true })
                .eq('profile_id', user.id);

            setStats({
                totalViews: cardData?.view_count || 0,
                totalScans: cardData?.scan_count || 0,
                recentScans: cardData?.scan_count || 0, // Simplified for now
                totalContacts: contactCount || 0,
                dailyScans: {} // Mock for now until we have scan_logs table
            });
        } catch (e) {
            console.error(e);
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

    const statCards = [
        {
            label: 'Vues totales', value: stats?.totalViews || 0, icon: 'visibility',
            color: 'from-blue-500/20 to-cyan-500/20', textColor: 'text-blue-600 dark:text-blue-400'
        },
        {
            label: 'Scans (30j)', value: stats?.recentScans || 0, icon: 'nfc',
            color: 'from-purple-500/20 to-indigo-500/20', textColor: 'text-purple-600 dark:text-purple-400'
        },
        {
            label: 'Contacts échangés', value: stats?.totalContacts || 0, icon: 'swap_horiz',
            color: 'from-emerald-500/20 to-teal-500/20', textColor: 'text-emerald-600 dark:text-emerald-400'
        },
        {
            label: 'Scans totaux', value: stats?.totalScans || 0, icon: 'qr_code_scanner',
            color: 'from-amber-500/20 to-orange-500/20', textColor: 'text-amber-600 dark:text-amber-400'
        },
    ];

    // Generate last 30 days for chart
    const days: string[] = [];
    for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        days.push(d.toISOString().split('T')[0]);
    }
    const scansArr = days.map(d => stats?.dailyScans?.[d] || 0);
    const maxScans = Math.max(...scansArr, 5);

    return (
        <div className="pb-20 relative selection:bg-slate-200 px-4 md:px-0">
            <div className="relative z-10">
                <div className="mb-8 md:mb-10">
                    <h1 className="text-3xl md:text-4xl font-black text-apple-textDark dark:text-white tracking-tight">Analytics</h1>
                    <p className="text-apple-secondary dark:text-gray-400 font-bold text-sm mt-2">Mesurez l'impact de votre présence numérique.</p>
                </div>

                {/* Stat Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8 md:mb-10">
                    {statCards.map((s) => (
                        <div key={s.label} className="klik-glass p-6 md:p-8 rounded-[2rem] border border-white/60 dark:border-white/5 shadow-sm group hover:shadow-xl transition-all duration-500 overflow-hidden relative">
                            <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${s.color} blur-3xl opacity-30 -mr-12 -mt-12 group-hover:opacity-50 transition-all duration-700`} />

                            <div className="flex flex-col gap-4 md:gap-6">
                                <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center bg-white dark:bg-white/5 shadow-sm border border-gray-100 dark:border-white/10">
                                    <span className={`material-symbols-outlined text-[24px] md:text-[28px] font-light ${s.textColor}`}>{s.icon}</span>
                                </div>
                                <div className="flex flex-col">
                                    <p className="text-3xl md:text-4xl font-black tracking-tighter text-apple-textDark dark:text-white">{s.value.toLocaleString()}</p>
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-apple-secondary dark:text-gray-500 mt-1">{s.label}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Chart Section */}
                <div className="klik-glass p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] border border-white/60 dark:border-white/5 shadow-2xl relative overflow-hidden">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 md:mb-12">
                        <div>
                            <h3 className="text-lg md:text-xl font-black text-apple-textDark dark:text-white tracking-tight">Activité des Scans</h3>
                            <p className="text-apple-secondary dark:text-gray-500 font-bold text-xs mt-1">Évolution sur les 30 derniers jours</p>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 bg-white/40 dark:bg-white/5 rounded-full border border-gray-100 dark:border-white/10 w-fit">
                            <span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-apple-secondary dark:text-gray-400">Temps Réel</span>
                        </div>
                    </div>

                    <div className="flex items-end gap-1 md:gap-2 h-[180px] md:h-[240px] px-1 md:px-2">
                        {scansArr.map((count, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center justify-end h-full group cursor-pointer relative">
                                {/* Bar */}
                                <div
                                    className="w-full rounded-full transition-all duration-500 group-hover:ring-4 group-hover:ring-blue-500/10 group-hover:scale-y-[1.02] relative"
                                    style={{
                                        height: `${(count / maxScans) * 100}%`,
                                        minHeight: count > 0 ? 8 : 4,
                                        background: count > 0
                                            ? 'linear-gradient(180deg, #0666EB, #7C3AED)'
                                            : 'rgba(0,0,0,0.03)',
                                        opacity: count > 0 ? 1 : 0.4,
                                    }}
                                >
                                    {/* Tooltip */}
                                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-xl bg-black dark:bg-white text-white dark:text-black text-[10px] font-black opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none shadow-2xl z-20 whitespace-nowrap">
                                        {count} scan{count > 1 ? 's' : ''}
                                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-black dark:border-t-white" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Day labels — show every 5 or 7 on mobile */}
                    <div className="flex mt-6 px-1 md:px-2 border-t border-gray-100 dark:border-white/5 pt-6 overflow-hidden">
                        {days.map((d, i) => (
                            <span key={d} className="flex-1 text-center text-[8px] md:text-[9px] font-black uppercase tracking-widest text-apple-secondary dark:text-gray-600 truncate">
                                {i % 6 === 0 ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) : ''}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
