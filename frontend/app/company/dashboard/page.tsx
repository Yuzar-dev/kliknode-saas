'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import toast from 'react-hot-toast';

export default function CompanyDashboard() {
    const router = useRouter();
    const [stats, setStats] = useState({
        employees: 0,
        activeCards: 0,
        totalViews: 0
    });
    const [recentScans, setRecentScans] = useState<any[]>([]);
    const [hardwareOrders, setHardwareOrders] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [scanSearch, setScanSearch] = useState('');
    const [showScanFilter, setShowScanFilter] = useState(false);

    // Order Modal State
    const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
    const [orderQuantity, setOrderQuantity] = useState(10);
    const [shippingAddress, setShippingAddress] = useState('');
    const [warehouse, setWarehouse] = useState<'paris' | 'oujda'>('paris');
    const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);

    const fetchDashboardData = async () => {
        try {
            const response = await apiClient.get('/api/company/dashboard');
            if (response.data.success) {
                setStats(response.data.data.stats);
                setRecentScans(response.data.data.recentScans || []);
                setHardwareOrders(response.data.data.hardwareOrders || []);
            }
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            toast.error('Impossible de charger les statistiques');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const handleCreateOrder = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmittingOrder(true);
        try {
            const response = await apiClient.post('/api/company/hardware-orders', {
                quantity: orderQuantity,
                shippingAddress,
                warehouse
            });
            if (response.data.success) {
                toast.success(response.data.message || 'Commande enregistrée avec succès !');
                setIsOrderModalOpen(false);
                setShippingAddress('');
                fetchDashboardData();
            }
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Erreur lors de la commande');
        } finally {
            setIsSubmittingOrder(false);
        }
    };

    const handleExportScansCsv = () => {
        if (recentScans.length === 0) {
            toast.error('Aucune activité de scan à exporter');
            return;
        }
        const headers = ['Employé', 'Carte ID', 'Slug Public', 'Appareil', 'Ville', 'Date du Scan'];
        const rows = recentScans.map(s => [
            s.cardName,
            s.cardId,
            `/${s.card?.publicSlug || ''}`,
            s.deviceType || 'mobile',
            s.city || 'N/A',
            new Date(s.scannedAt).toISOString()
        ]);
        const csvContent = [
            headers.join(','),
            ...rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
        ].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `activite-cartes-${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('Activité exportée en CSV');
    };

    const filteredScans = recentScans.filter(scan =>
        !scanSearch ||
        (scan.cardName || '').toLowerCase().includes(scanSearch.toLowerCase()) ||
        (scan.card?.publicSlug || '').toLowerCase().includes(scanSearch.toLowerCase())
    );

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                <p className="text-apple-secondary font-medium animate-pulse tracking-tight">Chargement du tableau de bord...</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-4xl md:text-5xl font-black text-apple-textDark dark:text-white tracking-tighter">Tableau de Bord</h1>
                    <p className="text-[11px] font-black uppercase tracking-[0.25em] text-apple-secondary dark:text-slate-500 mt-3">Gérez vos cartes d'entreprise et les accès employés.</p>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={() => router.push('/company/employees?action=invite')}
                        className="px-8 h-14 rounded-full klik-glass border border-white/40 dark:border-white/10 hover:bg-white/80 dark:hover:bg-white/10 transition-all flex items-center gap-3 text-xs font-black uppercase tracking-widest text-apple-textDark dark:text-white shadow-sm cursor-pointer active:scale-95"
                    >
                        <span className="material-symbols-outlined text-[22px]">person_add</span>
                        Inviter Employés
                    </button>
                    <button
                        onClick={() => setIsOrderModalOpen(true)}
                        className="px-10 h-14 rounded-full btn-titanium btn-titanium-primary shadow-2xl shadow-primary/30 flex items-center gap-3 text-xs font-black uppercase tracking-widest text-white transition-all group cursor-pointer"
                    >
                        <span className="material-symbols-outlined text-[22px] group-hover:scale-110 transition-transform">add_card</span>
                        Commander
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Total Cards */}
                <div className="klik-glass p-8 rounded-[32px] border border-white/40 dark:border-white/5 shadow-lg group">
                    <div className="flex justify-between items-start mb-6">
                        <div className="w-12 h-12 rounded-[1.2rem] glass flex items-center justify-center text-primary shadow-sm border border-white/40 dark:border-white/10">
                            <span className="material-symbols-outlined text-[24px]">credit_card</span>
                        </div>
                        <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-[9px] font-black uppercase tracking-widest border border-emerald-500/20">
                            {stats.employees} Collaborateurs
                        </span>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-apple-secondary uppercase tracking-[0.2em] opacity-80">Total Cartes Actives</p>
                        <div className="flex items-baseline gap-2 mt-2">
                            <h3 className="text-5xl font-black text-apple-textDark dark:text-white tracking-tighter">{stats.activeCards}</h3>
                            <span className="text-sm font-bold text-apple-secondary">/ {stats.employees || '∞'}</span>
                        </div>
                    </div>
                    <div className="mt-8">
                        <div className="flex justify-between text-[10px] font-bold text-apple-secondary uppercase tracking-widest mb-2">
                            <span>Utilisation</span>
                            <span className="text-apple-textDark dark:text-white">
                                {stats.employees > 0 ? `${Math.round((stats.activeCards / stats.employees) * 100)}%` : '0%'}
                            </span>
                        </div>
                        <div className="w-full bg-gray-200/50 dark:bg-white/10 rounded-full h-1.5 overflow-hidden">
                            <div
                                className="bg-primary h-1.5 rounded-full shadow-[0_0_10px_rgba(var(--primary),0.8)]"
                                style={{ width: stats.employees > 0 ? `${Math.min(100, Math.round((stats.activeCards / stats.employees) * 100))}%` : '0%' }}
                            ></div>
                        </div>
                    </div>
                </div>

                {/* Scans */}
                <div className="klik-glass p-8 rounded-[32px] border border-white/40 dark:border-white/5 shadow-lg group">
                    <div className="flex justify-between items-start mb-6">
                        <div className="w-12 h-12 rounded-[1.2rem] glass flex items-center justify-center text-indigo-500 dark:text-indigo-400 shadow-sm border border-white/40 dark:border-white/10">
                            <span className="material-symbols-outlined text-[24px]">qr_code_scanner</span>
                        </div>
                        <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-[9px] font-black uppercase tracking-widest border border-emerald-500/20">
                            <span className="material-symbols-outlined text-[14px]">trending_up</span>
                            Actif
                        </span>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-apple-secondary uppercase tracking-[0.2em] opacity-80">Vues Totales</p>
                        <h3 className="text-5xl font-black text-apple-textDark dark:text-white tracking-tighter mt-2">{stats.totalViews}</h3>
                    </div>
                    <div className="mt-8 h-8 flex items-end gap-1.5 opacity-80">
                        <div className="w-1/6 bg-indigo-500/20 rounded-t-sm h-[40%] hover:bg-indigo-500 transition-colors"></div>
                        <div className="w-1/6 bg-indigo-500/30 rounded-t-sm h-[60%] hover:bg-indigo-500 transition-colors"></div>
                        <div className="w-1/6 bg-indigo-500/40 rounded-t-sm h-[50%] hover:bg-indigo-500 transition-colors"></div>
                        <div className="w-1/6 bg-indigo-500/60 rounded-t-sm h-[70%] hover:bg-indigo-500 transition-colors"></div>
                        <div className="w-1/6 bg-indigo-500/80 rounded-t-sm h-[85%] hover:bg-indigo-500 transition-colors"></div>
                        <div className="w-1/6 bg-indigo-500 rounded-t-sm h-[100%] shadow-[0_0_10px_rgba(99,102,241,0.5)]"></div>
                    </div>
                </div>

                {/* Top Employees */}
                <div className="klik-glass p-8 rounded-[32px] border border-white/40 dark:border-white/5 shadow-lg flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-6">
                        <div className="w-12 h-12 rounded-[1.2rem] glass flex items-center justify-center text-amber-500 dark:text-amber-400 shadow-sm border border-white/40 dark:border-white/10">
                            <span className="material-symbols-outlined text-[24px]">groups</span>
                        </div>
                        <button
                            onClick={() => router.push('/company/employees')}
                            title="Voir l'annuaire complet"
                            className="w-8 h-8 rounded-full flex items-center justify-center text-apple-secondary hover:text-apple-textDark dark:hover:text-white hover:bg-white/40 dark:hover:bg-white/10 transition-all cursor-pointer"
                        >
                            <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                        </button>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-apple-secondary uppercase tracking-[0.2em] opacity-80">Équipe Active</p>
                        <div className="flex items-center justify-between mt-4">
                            <div className="flex -space-x-4">
                                <div className="h-12 w-12 rounded-full border-2 border-white dark:border-[#1C1C1E] bg-gradient-to-br from-gray-100 to-gray-300 dark:from-gray-700 dark:to-gray-900 flex items-center justify-center text-sm font-black shadow-sm z-30">Y</div>
                                <div className="h-12 w-12 rounded-full border-2 border-white dark:border-[#1C1C1E] bg-gradient-to-br from-gray-100 to-gray-300 dark:from-gray-700 dark:to-gray-900 flex items-center justify-center text-sm font-black shadow-sm z-20">M</div>
                                <div className="h-12 w-12 rounded-full border-2 border-white dark:border-[#1C1C1E] glass flex items-center justify-center text-[10px] font-black text-apple-secondary z-0">
                                    {stats.employees}
                                </div>
                            </div>
                            <Link
                                href="/company/employees"
                                className="text-xs font-black uppercase tracking-widest text-primary hover:underline"
                            >
                                Gérer →
                            </Link>
                        </div>
                    </div>
                    <div className="mt-8 text-[10px] font-bold text-apple-secondary uppercase tracking-widest opacity-60">
                        {hardwareOrders.length > 0 ? `${hardwareOrders.length} commande(s) de cartes en cours` : 'Basé sur l\'activité de scan'}
                    </div>
                </div>
            </div>

            {/* Recent Activity Table */}
            <div className="klik-glass rounded-[40px] border border-white/40 dark:border-white/5 shadow-2xl overflow-hidden mt-8">
                <div className="px-8 py-6 border-b border-gray-100/10 dark:border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/30 dark:bg-black/10">
                    <h2 className="text-lg font-black text-apple-textDark dark:text-white tracking-tight">Activité Récente des Cartes</h2>
                    <div className="flex items-center gap-3">
                        {showScanFilter && (
                            <input
                                type="text"
                                value={scanSearch}
                                onChange={(e) => setScanSearch(e.target.value)}
                                placeholder="Filtrer par employé ou slug..."
                                className="h-10 px-4 rounded-full bg-white/70 dark:bg-white/10 border border-white/40 dark:border-white/10 text-xs font-bold text-apple-textDark dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20"
                            />
                        )}
                        <button
                            onClick={() => setShowScanFilter(prev => !prev)}
                            title="Filtrer l'activité"
                            className={`w-10 h-10 rounded-full glass flex items-center justify-center transition-colors border border-white/20 dark:border-white/5 cursor-pointer ${showScanFilter ? 'text-primary bg-primary/10' : 'text-apple-secondary hover:text-primary'}`}
                        >
                            <span className="material-symbols-outlined text-[20px]">filter_list</span>
                        </button>
                        <button
                            onClick={handleExportScansCsv}
                            title="Exporter en CSV"
                            className="w-10 h-10 rounded-full glass flex items-center justify-center text-apple-secondary hover:text-primary transition-colors border border-white/20 dark:border-white/5 cursor-pointer"
                        >
                            <span className="material-symbols-outlined text-[20px]">download</span>
                        </button>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-gray-100/10 dark:border-white/5 bg-gray-50/30 dark:bg-white/5">
                                <th className="px-8 py-5 text-[11px] font-bold text-apple-secondary uppercase tracking-[0.2em] opacity-60">Employé</th>
                                <th className="px-6 py-5 text-[11px] font-bold text-apple-secondary uppercase tracking-[0.2em] opacity-60">Carte ID</th>
                                <th className="px-6 py-5 text-[11px] font-bold text-apple-secondary uppercase tracking-[0.2em] opacity-60">Statut</th>
                                <th className="px-6 py-5 text-[11px] font-bold text-apple-secondary uppercase tracking-[0.2em] opacity-60">Slug Public</th>
                                <th className="px-8 py-5 text-[11px] font-bold text-apple-secondary uppercase tracking-[0.2em] opacity-60 text-right">Dernier Scan</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100/10 dark:divide-white/5">
                            {filteredScans.length > 0 ? (
                                filteredScans.map((scan, index) => (
                                    <tr key={index} className="hover:bg-white/40 dark:hover:bg-white/5 transition-all duration-300 group">
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-4 group/item">
                                                <div className="relative">
                                                    <div className="w-12 h-12 rounded-[1.2rem] btn-titanium-primary flex items-center justify-center text-white font-black text-lg shadow-lg">
                                                        {(scan.cardName || 'K').charAt(0)}
                                                    </div>
                                                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white dark:border-[#1C1C1E] rounded-full shadow-sm"></div>
                                                </div>
                                                <div>
                                                    <p className="font-black text-lg text-apple-textDark dark:text-white tracking-tight group-hover/item:text-primary transition-colors">{scan.cardName}</p>
                                                    <p className="text-[9px] font-black text-apple-secondary uppercase tracking-[0.2em] opacity-80 mt-0.5">Employé</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <p className="font-mono text-sm font-semibold text-apple-secondary dark:text-slate-400">
                                                {scan.cardId?.substring(0, 8)}
                                            </p>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className="px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest border border-emerald-500/20 bg-emerald-500/10 text-emerald-500 shadow-sm">
                                                Active
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 text-sm font-bold text-apple-textDark dark:text-white tracking-tight">
                                            <Link
                                                href={`/p/${scan.card?.publicSlug}`}
                                                target="_blank"
                                                className="hover:text-primary hover:underline inline-flex items-center gap-1"
                                            >
                                                /{scan.card?.publicSlug}
                                                <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                                            </Link>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <p className="text-sm font-bold text-apple-secondary">
                                                {new Date(scan.scannedAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </p>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center justify-center gap-4 opacity-50">
                                            <span className="material-symbols-outlined text-4xl text-apple-secondary">hourglass_empty</span>
                                            <p className="text-sm font-bold text-apple-secondary tracking-tight">Aucune activité récente pour vos cartes.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Bottom Widgets */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-10">
                {/* System State */}
                <div className="klik-glass p-8 rounded-[32px] border border-white/40 dark:border-white/5 shadow-lg">
                    <h3 className="text-lg font-black text-apple-textDark dark:text-white tracking-tight mb-6">État du Système</h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between bg-white/40 dark:bg-white/5 p-4 rounded-2xl border border-white/20 dark:border-white/5 transition-all hover:bg-white/60 dark:hover:bg-white/10">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
                                </div>
                                <span className="text-sm font-bold text-apple-textDark dark:text-white">API Status</span>
                            </div>
                            <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-widest rounded-lg border border-emerald-500/20">
                                Opérationnel
                            </span>
                        </div>
                        <div className="flex items-center justify-between bg-white/40 dark:bg-white/5 p-4 rounded-2xl border border-white/20 dark:border-white/5 transition-all hover:bg-white/60 dark:hover:bg-white/10">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
                                </div>
                                <span className="text-sm font-bold text-apple-textDark dark:text-white">Lecteurs NFC</span>
                            </div>
                            <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-widest rounded-lg border border-emerald-500/20">
                                99.9% Uptime
                            </span>
                        </div>
                    </div>
                </div>

                {/* Need Help */}
                <div className="btn-titanium-primary p-10 rounded-[32px] text-white shadow-2xl shadow-primary/20 relative overflow-hidden group">
                    <div className="absolute -right-10 -top-10 w-48 h-48 bg-primary/30 rounded-full blur-3xl group-hover:bg-primary/50 transition-all duration-700"></div>
                    <div className="relative z-10 flex flex-col h-full justify-between">
                        <div>
                            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-xl border border-white/20 mb-6">
                                <span className="material-symbols-outlined text-white text-[24px]">support_agent</span>
                            </div>
                            <h3 className="text-2xl font-black mb-2 tracking-tight">Besoin d'aide ?</h3>
                            <p className="text-sm text-white/70 font-medium leading-relaxed max-w-sm">
                                Contactez notre équipe support pour toute question, commande de cartes en gros, ou pour personnaliser vos options d'intégration.
                            </p>
                        </div>
                        <a
                            href="mailto:service@kliknode.com?subject=Support%20Entreprise%20KlikNode"
                            onClick={() => toast.success('Ouverture de votre client mail vers service@kliknode.com')}
                            className="mt-8 bg-white text-apple-textDark hover:bg-gray-100 px-6 h-12 rounded-full font-black text-xs uppercase tracking-widest shadow-xl transition-all self-start flex items-center gap-2"
                        >
                            <span className="material-symbols-outlined text-[18px]">chat_bubble</span>
                            Contacter le Support
                        </a>
                    </div>
                </div>
            </div>

            {/* Modal Commander des Cartes NFC */}
            {isOrderModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsOrderModalOpen(false)}></div>
                    <div className="bg-white dark:bg-[#1C1C1E] w-full max-w-lg rounded-[40px] shadow-2xl relative z-10 overflow-hidden border border-white/20">
                        <div className="px-10 py-8 border-b border-gray-100 dark:border-white/10 flex justify-between items-center">
                            <div>
                                <h3 className="text-2xl font-black text-apple-textDark dark:text-white tracking-tight">Commander des Cartes NFC</h3>
                                <p className="text-[10px] font-bold text-apple-secondary uppercase tracking-widest mt-1">Expédition directe vers vos bureaux</p>
                            </div>
                            <button
                                onClick={() => setIsOrderModalOpen(false)}
                                className="h-10 w-10 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 flex items-center justify-center transition-all"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <form onSubmit={handleCreateOrder} className="p-10 space-y-6">
                            <div className="space-y-3">
                                <label className="text-[11px] font-bold text-apple-secondary uppercase tracking-widest ml-1">Quantité de cartes</label>
                                <div className="grid grid-cols-4 gap-3">
                                    {[5, 10, 25, 50].map((qty) => (
                                        <button
                                            key={qty}
                                            type="button"
                                            onClick={() => setOrderQuantity(qty)}
                                            className={`py-3 rounded-2xl font-black text-sm border-2 transition-all ${orderQuantity === qty
                                                ? 'border-primary bg-primary/10 text-primary'
                                                : 'border-slate-100 dark:border-white/10 text-apple-secondary hover:border-slate-200'
                                                }`}
                                        >
                                            {qty}
                                        </button>
                                    ))}
                                </div>
                                <input
                                    type="number"
                                    min={1}
                                    max={500}
                                    value={orderQuantity}
                                    onChange={(e) => setOrderQuantity(Number(e.target.value))}
                                    className="w-full h-12 px-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm font-bold text-apple-textDark dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[11px] font-bold text-apple-secondary uppercase tracking-widest ml-1">Hub Logistique</label>
                                <div className="flex gap-3">
                                    {(['paris', 'oujda'] as const).map((w) => (
                                        <button
                                            key={w}
                                            type="button"
                                            onClick={() => setWarehouse(w)}
                                            className={`flex-1 py-3.5 rounded-2xl border-2 transition-all text-[11px] font-bold uppercase tracking-widest ${warehouse === w
                                                ? 'bg-primary/10 border-primary text-primary'
                                                : 'bg-white dark:bg-white/5 border-slate-100 dark:border-white/10 text-apple-secondary'
                                                }`}
                                        >
                                            {w === 'paris' ? 'France / Europe (Paris)' : 'Maroc / Afrique (Oujda)'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[11px] font-bold text-apple-secondary uppercase tracking-widest ml-1">Adresse de livraison</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ex: 15 Avenue des Champs-Élysées, 75008 Paris"
                                    value={shippingAddress}
                                    onChange={(e) => setShippingAddress(e.target.value)}
                                    className="w-full h-12 px-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm font-medium text-apple-textDark dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmittingOrder}
                                className="w-full h-14 mt-4 btn-titanium btn-titanium-primary text-white rounded-full font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 cursor-pointer"
                            >
                                {isSubmittingOrder ? (
                                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined text-[20px]">local_shipping</span>
                                        Valider la commande ({orderQuantity} cartes)
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
