'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import toast from 'react-hot-toast';

interface Lead {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    phone: string | null;
    notes: string | null;
    createdAt: string;
}

export default function LeadsPage() {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);

    useEffect(() => {
        loadLeads();
    }, []);

    const loadLeads = async () => {
        setLoading(true);
        try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error, count } = await supabase
                .from('contacts')
                .select('*', { count: 'exact' })
                .eq('profile_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (data) {
                const mappedLeads: Lead[] = data.map(item => ({
                    id: item.id,
                    firstName: item.first_name,
                    lastName: item.last_name,
                    email: item.email,
                    phone: item.phone,
                    notes: item.notes,
                    createdAt: item.created_at
                }));
                setLeads(mappedLeads);
                setTotal(count || mappedLeads.length);
            }
        } catch (e: any) {
            console.error(e);
            toast.error('Erreur lors du chargement');
        } finally {
            setLoading(false);
        }
    };

    const exportCSV = () => {
        const header = ['Prénom', 'Nom', 'Email', 'Téléphone', 'Notes', 'Date'];
        const rows = leads.map(l => [
            l.firstName || '',
            l.lastName || '',
            l.email || '',
            l.phone || '',
            (l.notes || '').replace(/,/g, ' '),
            new Date(l.createdAt).toLocaleDateString('fr-FR'),
        ]);
        const csv = [header, ...rows].map(r => r.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `leads-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const thisMonth = leads.filter(l => {
        const d = new Date(l.createdAt);
        const now = new Date();
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;

    const stats = [
        { label: 'Total contacts', value: total, icon: 'people', color: 'from-blue-500/20 to-indigo-500/20', textColor: 'text-blue-600 dark:text-blue-400' },
        { label: 'Ce mois', value: thisMonth, icon: 'calendar_month', color: 'from-emerald-500/20 to-teal-500/20', textColor: 'text-emerald-600 dark:text-emerald-400' },
        { label: 'Nouveaux (30j)', value: leads.filter(l => (Date.now() - new Date(l.createdAt).getTime()) < 30 * 86400000).length, icon: 'person_add', color: 'from-amber-500/20 to-orange-500/20', textColor: 'text-amber-600 dark:text-amber-400' },
    ];

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="animate-spin h-10 w-10 border-4 border-spaceGray dark:border-white border-t-transparent rounded-full" />
        </div>
    );

    return (
        <div className="pb-20 relative selection:bg-slate-200">
            <div className="relative z-10 px-4 md:px-0">
                <div className="mb-8 md:mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-black text-apple-textDark dark:text-white tracking-tight">Mes Contacts</h1>
                        <p className="text-apple-secondary dark:text-gray-400 font-bold text-sm mt-2">Gérez les relations créées via votre carte NFC.</p>
                    </div>
                    {leads.length > 0 && (
                        <button onClick={exportCSV}
                            className="btn-obsidian btn-obsidian-secondary h-12 md:h-14 flex items-center justify-center gap-2.5 px-6 md:px-8 rounded-full shadow-lg border border-gray-200 dark:border-white/10 active:scale-95 transition-all font-bold text-sm"
                        >
                            <span className="material-symbols-outlined text-[20px] font-light">download</span>
                            Exporter CSV
                        </button>
                    )}
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8 md:mb-10">
                    {stats.map((s) => (
                        <div key={s.label} className="klik-glass p-6 md:p-8 rounded-[2rem] border border-white/60 dark:border-white/5 shadow-sm group hover:shadow-xl transition-all duration-500 overflow-hidden relative">
                            <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${s.color} blur-3xl opacity-30 -mr-12 -mt-12 group-hover:opacity-50 transition-all duration-700`} />
                            <div className="flex flex-col gap-4 md:gap-6">
                                <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center bg-white dark:bg-white/5 shadow-sm border border-gray-100 dark:border-white/10">
                                    <span className={`material-symbols-outlined text-[24px] md:text-[28px] font-light ${s.textColor}`}>{s.icon}</span>
                                </div>
                                <div className="flex flex-col">
                                    <p className="text-3xl md:text-4xl font-black tracking-tighter text-apple-textDark dark:text-white">{s.value}</p>
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-apple-secondary dark:text-gray-500 mt-1">{s.label}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Table Section */}
                <div className="klik-glass p-0 md:p-10 rounded-[1.5rem] md:rounded-[3rem] border border-white/60 dark:border-white/5 shadow-2xl relative overflow-hidden">
                    <div className="p-6 md:p-0">
                        <h3 className="text-lg md:text-xl font-black text-apple-textDark dark:text-white tracking-tight md:mb-8">Liste des contacts</h3>
                    </div>

                    {leads.length === 0 ? (
                        <div className="m-6 md:m-0 text-center py-16 md:py-20 bg-white/40 dark:bg-white/5 rounded-[2rem] border border-dashed border-gray-200 dark:border-white/10">
                            <span className="material-symbols-outlined text-5xl md:text-6xl text-apple-secondary dark:text-gray-700 mb-6 font-light">person_search</span>
                            <p className="text-apple-textDark dark:text-white font-black text-lg md:text-xl">Aucun contact pour l'instant</p>
                            <p className="text-apple-secondary dark:text-gray-500 font-bold text-xs md:text-sm mt-2 px-6 md:px-10">Vos contacts apparaîtront ici lorsque quelqu'un échangera ses informations avec vous.</p>
                        </div>
                    ) : (
                        <>
                            {/* Mobile View (Cards) */}
                            <div className="md:hidden space-y-4 px-6 pb-8 h-[600px] overflow-y-auto custom-scrollbar">
                                {leads.map(lead => (
                                    <div key={lead.id} className="bg-white/40 dark:bg-white/5 p-5 rounded-3xl border border-white/60 dark:border-white/5 shadow-sm active:scale-[0.98] transition-all">
                                        <div className="flex items-center gap-4 mb-4">
                                            <div className="w-12 h-12 rounded-full flex items-center justify-center text-xs font-black text-white shadow-lg shrink-0"
                                                style={{ background: 'linear-gradient(135deg, #0666EB, #7C3AED)' }}>
                                                {lead.firstName?.[0] || '?'}{lead.lastName?.[0] || ''}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-black text-apple-textDark dark:text-white tracking-tight text-base leading-tight uppercase">{lead.firstName} {lead.lastName}</span>
                                                <span className="text-[10px] font-black text-apple-secondary dark:text-gray-500 uppercase tracking-widest mt-0.5">
                                                    {new Date(lead.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <div className="flex items-center gap-3">
                                                <span className="material-symbols-outlined text-[18px] text-apple-secondary dark:text-gray-500">mail</span>
                                                <span className="text-xs font-black text-apple-secondary dark:text-gray-400 break-all">{lead.email || '—'}</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="material-symbols-outlined text-[18px] text-apple-secondary dark:text-gray-500">call</span>
                                                <span className="text-xs font-black text-apple-secondary dark:text-gray-400 font-mono italic">{lead.phone || '—'}</span>
                                            </div>
                                            {lead.notes && (
                                                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-white/5">
                                                    <p className="text-[10px] font-bold text-apple-secondary dark:text-gray-400 leading-relaxed italic">
                                                        "{lead.notes}"
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Desktop View (Table) */}
                            <div className="hidden md:block overflow-x-auto custom-scrollbar">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b border-gray-100 dark:border-white/5">
                                            <th className="px-10 py-5 text-[11px] font-black text-apple-secondary dark:text-gray-500 uppercase tracking-widest">Contact</th>
                                            <th className="px-10 py-5 text-[11px] font-black text-apple-secondary dark:text-gray-500 uppercase tracking-widest">Email</th>
                                            <th className="px-10 py-5 text-[11px] font-black text-apple-secondary dark:text-gray-500 uppercase tracking-widest">Téléphone</th>
                                            <th className="px-10 py-5 text-[11px] font-black text-apple-secondary dark:text-gray-500 uppercase tracking-widest">Note</th>
                                            <th className="px-10 py-5 text-[11px] font-black text-apple-secondary dark:text-gray-500 uppercase tracking-widest text-right">Date</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                                        {leads.map(lead => (
                                            <tr key={lead.id} className="group hover:bg-white/40 dark:hover:bg-white/5 transition-all duration-300">
                                                <td className="px-10 py-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-black text-white shadow-lg shrink-0"
                                                            style={{ background: 'linear-gradient(135deg, #0666EB, #7C3AED)' }}>
                                                            {lead.firstName?.[0] || '?'}{lead.lastName?.[0] || ''}
                                                        </div>
                                                        <span className="font-black text-apple-textDark dark:text-white tracking-tight uppercase">{lead.firstName} {lead.lastName}</span>
                                                    </div>
                                                </td>
                                                <td className="px-10 py-6 text-sm font-bold text-apple-secondary dark:text-gray-400">{lead.email || '—'}</td>
                                                <td className="px-10 py-6 text-sm font-bold text-apple-secondary dark:text-gray-400 font-mono italic">{lead.phone || '—'}</td>
                                                <td className="px-10 py-6">
                                                    <p className="text-sm font-bold text-apple-secondary dark:text-gray-400 max-w-[200px] truncate leading-relaxed">
                                                        {lead.notes || '—'}
                                                    </p>
                                                </td>
                                                <td className="px-10 py-6 text-[11px] font-black text-apple-secondary dark:text-gray-500 uppercase tracking-widest text-right">
                                                    {new Date(lead.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
