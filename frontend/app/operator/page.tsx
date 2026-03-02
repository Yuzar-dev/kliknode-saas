'use client';

import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { createClient } from '@/utils/supabase/client';
import toast from 'react-hot-toast';
import { QRCodeSVG } from 'qrcode.react';

interface PhysicalCard {
    id: string;
    uid: string;
    status: string;
    warehouse: string;
    createdAt: string;
    pairedCard: { publicSlug: string; firstName: string; lastName: string } | null;
}

interface Stats {
    total: number;
    today: number;
    thisWeek: number;
    paired: number;
    byStatus: Record<string, number>;
}

const GLASS = {
    background: 'rgba(255,255,255,0.55)',
    backdropFilter: 'blur(20px) saturate(180%)',
    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
    border: '1px solid rgba(255,255,255,0.6)',
    borderRadius: 20,
};

const STATUS_BADGE: Record<string, { label: string; bg: string; text: string }> = {
    in_stock: { label: 'En Stock', bg: 'rgba(245,158,11,0.1)', text: '#F59E0B' },
    reserved: { label: 'Réservée / Encodée', bg: 'rgba(79,70,229,0.1)', text: '#4F46E5' },
    paired: { label: 'Pairée (Active)', bg: 'rgba(16,185,129,0.1)', text: '#059669' },
    lost: { label: 'Perdue', bg: 'rgba(239,68,68,0.1)', text: '#DC2626' },
};

// NFC UID prefixes with chip type labels
const NFC_PREFIXES = [
    { value: '04', label: 'NTAG213/215 / 216 (NXP)' },
    { value: '04', label: 'MIFARE Ultralight (NXP)' },
    { value: 'E0', label: 'ISO 15693 (Texas Instruments)' },
    { value: '08', label: 'MIFARE Classic 1K' },
    { value: '18', label: 'MIFARE Classic 4K' },
    { value: '20', label: 'DESFire EV1/EV2' },
];

// Warehouses
const WAREHOUSES = [
    { value: 'oujda', label: 'Oujda' },
    { value: 'paris', label: 'Paris' },
];

export default function OperatorPage() {
    const { user, logout } = useAuthStore();
    const router = useRouter();

    const [uid, setUid] = useState('');
    const [warehouse, setWarehouse] = useState('oujda');
    const [encodeStatus, setEncodeStatus] = useState('in_stock');
    const [encoding, setEncoding] = useState(false);
    const [cards, setCards] = useState<PhysicalCard[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('all');

    // Dropdown with fixed positioning
    const [openStatusMenu, setOpenStatusMenu] = useState<string | null>(null);
    const [dropdownPos, setDropdownPos] = useState({ top: 0, right: 0 });
    const statusMenuRef = useRef<HTMLDivElement>(null);

    // Batch generator state
    const [batchQty, setBatchQty] = useState(5);
    const [batchWarehouse, setBatchWarehouse] = useState('oujda');
    const [batchStatus, setBatchStatus] = useState('in_stock');
    const [batchPrefixIdx, setBatchPrefixIdx] = useState(0);
    const [generatedUids, setGeneratedUids] = useState<string[]>([]);
    const [batchEncoding, setBatchEncoding] = useState(false);

    useEffect(() => {
        loadData();
        const supabase = createClient();
        const channel = supabase
            .channel('operator-cards-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'physical_cards' }, () => loadData())
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [filterStatus]);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (statusMenuRef.current && !statusMenuRef.current.contains(e.target as Node)) {
                setOpenStatusMenu(null);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const supabase = createClient();
            let query = supabase.from('physical_cards')
                .select(`id, uid, status, warehouse, created_at, cards(public_slug, users(first_name, last_name))`)
                .order('created_at', { ascending: false })
                .limit(100);

            if (filterStatus !== 'all') query = query.eq('status', filterStatus);

            const { data: cardsData } = await query;

            if (cardsData) {
                setCards(cardsData.map((c: any) => {
                    const virtualCard = c.cards ? (Array.isArray(c.cards) ? c.cards[0] : c.cards) : null;
                    const user = virtualCard?.users ? (Array.isArray(virtualCard.users) ? virtualCard.users[0] : virtualCard.users) : null;

                    return {
                        id: c.id, uid: c.uid, status: c.status, warehouse: c.warehouse, createdAt: c.created_at,
                        pairedCard: virtualCard && user ? {
                            publicSlug: virtualCard.public_slug || 'unknown',
                            firstName: user.first_name || '',
                            lastName: user.last_name || ''
                        } : null
                    };
                }));
            }

            const { data: allCards } = await supabase.from('physical_cards').select('status, created_at');
            if (allCards) {
                const today = new Date(); today.setHours(0, 0, 0, 0);
                const thisWeek = new Date(); thisWeek.setDate(today.getDate() - today.getDay());

                const statsObj: Stats = {
                    total: allCards.length,
                    today: allCards.filter((c: any) => new Date(c.created_at) >= today).length,
                    thisWeek: allCards.filter((c: any) => new Date(c.created_at) >= thisWeek).length,
                    paired: allCards.filter((c: any) => c.status === 'paired').length,
                    byStatus: {} as any
                };
                allCards.forEach((c: any) => { statsObj.byStatus[c.status] = (statsObj.byStatus[c.status] || 0) + 1; });
                setStats(statsObj);
            }
        } catch { /* ignore */ } finally { setLoading(false); }
    };

    const handleEncode = async () => {
        if (!uid.trim()) return toast.error('UID requis');
        setEncoding(true);
        try {
            const supabase = createClient();
            const { error } = await supabase.from('physical_cards').insert({ uid: uid.trim(), warehouse, status: encodeStatus });
            if (error) {
                if (error.code === '23505') throw new Error('Cette carte existe déjà');
                throw error;
            }
            toast.success('Carte encodée !'); setUid(''); loadData();
        } catch (err: any) { toast.error(err.message || 'Erreur'); } finally { setEncoding(false); }
    };

    const handleChangeStatus = async (cardId: string, newStatus: string) => {
        setOpenStatusMenu(null);
        try {
            const supabase = createClient();
            const { error } = await supabase.from('physical_cards').update({ status: newStatus }).eq('id', cardId);
            if (error) throw error;
            toast.success(`Statut mis à jour : ${STATUS_BADGE[newStatus]?.label || newStatus}`);
            loadData();
        } catch (err: any) { toast.error(err.message || 'Erreur'); }
    };

    const openDropdown = (cardId: string, e: React.MouseEvent<HTMLButtonElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setDropdownPos({ top: rect.bottom + 6, right: window.innerWidth - rect.right });
        setOpenStatusMenu(openStatusMenu === cardId ? null : cardId);
    };

    const generateUids = () => {
        const prefix = NFC_PREFIXES[batchPrefixIdx].value;
        const uids: string[] = [];
        for (let i = 0; i < batchQty; i++) {
            const bytes = [prefix];
            for (let b = 0; b < 6; b++) bytes.push(Math.floor(Math.random() * 256).toString(16).padStart(2, '0').toUpperCase());
            uids.push(bytes.join(':'));
        }
        setGeneratedUids(uids);
    };

    const handleBatchEncode = async () => {
        if (generatedUids.length === 0) return toast.error('Générez des UIDs d\'abord');
        setBatchEncoding(true);
        try {
            const supabase = createClient();
            let success = 0; let failed = 0;
            for (const u of generatedUids) {
                const { error } = await supabase.from('physical_cards').insert({ uid: u, warehouse: batchWarehouse, status: batchStatus });
                if (!error) success++; else failed++;
            }
            setGeneratedUids([]); loadData();
            toast.success(`${success} carte(s) encodée(s)${failed > 0 ? `, ${failed} erreur(s)` : ''}`);
        } catch (e: any) { toast.error(e.message || 'Erreur lors du batch encode'); } finally { setBatchEncoding(false); }
    };

    const handleLogout = async () => {
        const supabase = createClient(); await supabase.auth.signOut();
        logout(); router.push('/login');
    };

    const downloadQRCode = (uid: string) => {
        const url = `${window.location.origin}/activate/${uid}`;
        const canvas = document.createElement('canvas');
        const qrSize = 512;
        canvas.width = qrSize;
        canvas.height = qrSize;

        // Use a temporary div to render the QR code on a canvas
        const svgElement = document.getElementById(`qr-svg-${uid}`);
        if (!svgElement) return;

        const xml = new XMLSerializer().serializeToString(svgElement);
        // Ensure xmlns is present for cross-browser canvas drawing
        const svgWithXmlns = xml.includes('xmlns=')
            ? xml
            : xml.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');

        const svg64 = btoa(unescape(encodeURIComponent(svgWithXmlns)));
        const b64Start = 'data:image/svg+xml;base64,';
        const image64 = b64Start + svg64;

        const img = new Image();
        img.onload = () => {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.clearRect(0, 0, qrSize, qrSize);
                // Ensure the context is using 'source-over' to keep transparency
                ctx.globalCompositeOperation = 'source-over';
                ctx.drawImage(img, 0, 0, qrSize, qrSize);
                const pngUrl = canvas.toDataURL('image/png');
                const downloadLink = document.createElement('a');
                downloadLink.href = pngUrl;
                downloadLink.download = `QR_${uid.replace(/:/g, '-')}.png`;
                document.body.appendChild(downloadLink);
                downloadLink.click();
                document.body.removeChild(downloadLink);
                toast.success('QR Code téléchargé');
            }
        };
        img.src = image64;
    };

    return (
        <>
            <div className="min-h-screen bg-[#F5F5F7] dark:bg-black font-display text-apple-textDark dark:text-white selection:bg-spaceGray/20">

                {/* Header - Glass Flow */}
                <header className="sticky top-0 z-30 px-8 h-20 flex items-center justify-between backdrop-blur-3xl bg-white/60 dark:bg-black/40 border-b border-white/60 dark:border-white/5 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center">
                            <img src="/logo-icon-black.svg" alt="KlikNode" className="h-[32px] w-auto dark:hidden shrink-0" />
                            <img src="/logo-icon-white.svg" alt="KlikNode" className="h-[32px] w-auto hidden dark:block shrink-0" />
                        </div>
                        <div className="flex flex-col justify-center">
                            <span className="font-black text-[22px] tracking-tight leading-[0.9] text-apple-textDark dark:text-white">KlikNode</span>
                            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-gray-400 mt-1 leading-none">Escale Opérateur</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="flex flex-col items-end">
                            <span className="text-[11px] font-black text-apple-textDark dark:text-white">{user?.firstName} {user?.lastName}</span>
                            <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">Connecté</span>
                        </div>
                        <div className="h-8 w-px bg-gray-200 dark:bg-white/10" />
                        <div className="flex items-center gap-3">
                            <button onClick={loadData} title="Rafraîchir" className="w-10 h-10 rounded-full flex items-center justify-center text-apple-secondary hover:text-apple-textDark dark:hover:text-white bg-white/40 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 transition-all active:scale-95">
                                <span className="material-symbols-outlined text-[20px] font-light">refresh</span>
                            </button>
                            <button onClick={handleLogout} className="w-10 h-10 rounded-full flex items-center justify-center text-apple-secondary hover:text-red-500 bg-white/40 dark:bg-white/5 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all active:scale-95">
                                <span className="material-symbols-outlined text-[20px] font-light">logout</span>
                            </button>
                        </div>
                    </div>
                </header>

                <div className="max-w-7xl mx-auto p-8 relative z-10">
                    {/* Stats Section */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                        {[
                            { label: 'Total Cartes', value: stats?.total || 0, icon: 'credit_card', color: 'from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900', textColor: 'text-apple-textDark dark:text-white' },
                            { label: "Aujourd'hui", value: stats?.today || 0, icon: 'today', color: 'from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20', textColor: 'text-blue-600 dark:text-blue-400' },
                            { label: 'Cette Semaine', value: stats?.thisWeek || 0, icon: 'date_range', color: 'from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20', textColor: 'text-emerald-600 dark:text-emerald-400' },
                            { label: 'Cartes Pairées', value: stats?.paired || 0, icon: 'link', color: 'from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20', textColor: 'text-amber-600 dark:text-amber-400' },
                        ].map(s => (
                            <div key={s.label} className="klik-glass p-6 rounded-[2rem] border border-white/60 dark:border-white/5 shadow-sm group hover:shadow-xl transition-all duration-500 overflow-hidden relative">
                                <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${s.color} blur-3xl opacity-20 -mr-10 -mt-10`} />
                                <div className="flex flex-col gap-4">
                                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-white dark:bg-white/5 shadow-sm border border-gray-100 dark:border-white/10">
                                        <span className={`material-symbols-outlined text-[24px] font-light ${s.textColor}`}>{s.icon}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <p className="text-3xl font-black tracking-tight">{s.value}</p>
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-apple-secondary dark:text-gray-500">{s.label}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Actions Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
                        {/* Manual Encode */}
                        <div className="klik-glass p-10 rounded-[2.5rem] border border-white/60 dark:border-white/5 shadow-lg relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100 dark:bg-blue-900/10 blur-3xl opacity-30 -mr-16 -mt-16 group-hover:opacity-50 transition-all duration-700" />
                            <div className="flex items-center gap-3 mb-8">
                                <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 font-light text-2xl">nfc</span>
                                <h2 className="text-xl font-black tracking-tight">Encoder une carte</h2>
                            </div>
                            <div className="flex flex-col gap-6">
                                <div className="space-y-3">
                                    <label className="text-[11px] font-black text-apple-secondary dark:text-gray-500 uppercase tracking-widest ml-1">UID NFC</label>
                                    <input
                                        type="text"
                                        value={uid}
                                        onChange={(e) => setUid(e.target.value)}
                                        placeholder="04:A3:B2:C1:D4:E5:F6"
                                        className="w-full rounded-[1.2rem] border border-gray-200 dark:border-white/10 bg-white/40 dark:bg-black/20 px-5 py-4 text-base focus:outline-none focus:ring-1 focus:ring-blue-500/20 focus:bg-white dark:focus:bg-black/40 transition-all font-mono font-bold"
                                        onKeyDown={(e) => e.key === 'Enter' && handleEncode()}
                                    />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-3">
                                        <label className="text-[11px] font-black text-apple-secondary dark:text-gray-500 uppercase tracking-widest ml-1">Entrepôt</label>
                                        <select value={warehouse} onChange={(e) => setWarehouse(e.target.value)}
                                            className="w-full rounded-[1.2rem] border border-gray-200 dark:border-white/10 bg-white/40 dark:bg-black/20 px-5 py-4 text-sm focus:outline-none appearance-none font-bold"
                                        >
                                            {WAREHOUSES.map(w => <option key={w.value} value={w.value}>{w.label}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[11px] font-black text-apple-secondary dark:text-gray-500 uppercase tracking-widest ml-1">Statut</label>
                                        <select value={encodeStatus} onChange={(e) => setEncodeStatus(e.target.value)}
                                            className="w-full rounded-[1.2rem] border border-gray-200 dark:border-white/10 bg-white/40 dark:bg-black/20 px-5 py-4 text-sm focus:outline-none appearance-none font-bold"
                                        >
                                            <option value="in_stock">En stock (Vierge)</option>
                                            <option value="reserved">Réservée (Encodée)</option>
                                            <option value="paired">Pairée (Active)</option>
                                            <option value="lost">Perdue</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="mt-2">
                                    <button onClick={handleEncode} disabled={encoding}
                                        className="w-full h-14 btn-obsidian btn-obsidian-primary flex items-center justify-center gap-2 rounded-[1.2rem] shadow-xl disabled:opacity-50 transition-all active:scale-95"
                                    >
                                        <span className="material-symbols-outlined text-[20px] font-light">bolt</span>
                                        <span className="font-bold tracking-tight">{encoding ? 'Patience...' : 'Encoder'}</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Batch Generator */}
                        <div className="klik-glass p-10 rounded-[2.5rem] border border-white/60 dark:border-white/5 shadow-lg relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-100 dark:bg-emerald-900/10 blur-3xl opacity-30 -mr-16 -mt-16 group-hover:opacity-50 transition-all duration-700" />
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-3">
                                    <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400 font-light text-2xl">dynamic_feed</span>
                                    <h2 className="text-xl font-black tracking-tight">Générateur Batch</h2>
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">Alpha</span>
                            </div>

                            <div className="grid grid-cols-3 gap-4 mb-6">
                                <div className="space-y-3">
                                    <label className="text-[11px] font-black text-apple-secondary dark:text-gray-500 uppercase tracking-widest ml-1">Quantité</label>
                                    <select value={batchQty} onChange={(e) => setBatchQty(Number(e.target.value))}
                                        className="w-full rounded-[1.2rem] border border-gray-200 dark:border-white/10 bg-white/40 dark:bg-black/20 px-4 py-4 text-xs focus:outline-none appearance-none font-bold"
                                    >
                                        {[5, 10, 25, 50, 100].map(n => <option key={n} value={n}>{n} Cartes</option>)}
                                    </select>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[11px] font-black text-apple-secondary dark:text-gray-500 uppercase tracking-widest ml-1">Entrepôt</label>
                                    <select value={batchWarehouse} onChange={(e) => setBatchWarehouse(e.target.value)}
                                        className="w-full rounded-[1.2rem] border border-gray-200 dark:border-white/10 bg-white/40 dark:bg-black/20 px-4 py-4 text-xs focus:outline-none appearance-none font-bold"
                                    >
                                        {WAREHOUSES.map(w => <option key={w.value} value={w.value}>{w.label}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[11px] font-black text-apple-secondary dark:text-gray-500 uppercase tracking-widest ml-1">Type NFC</label>
                                    <select value={batchPrefixIdx} onChange={(e) => setBatchPrefixIdx(Number(e.target.value))}
                                        className="w-full rounded-[1.2rem] border border-gray-200 dark:border-white/10 bg-white/40 dark:bg-black/20 px-4 py-4 text-xs focus:outline-none appearance-none font-bold"
                                    >
                                        {NFC_PREFIXES.map((p, i) => <option key={i} value={i}>{p.label.split(' ')[0]}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[11px] font-black text-apple-secondary dark:text-gray-500 uppercase tracking-widest ml-1">Statut Initial</label>
                                    <select value={batchStatus} onChange={(e) => setBatchStatus(e.target.value)}
                                        className="w-full rounded-[1.2rem] border border-gray-200 dark:border-white/10 bg-white/40 dark:bg-black/20 px-4 py-4 text-xs focus:outline-none appearance-none font-bold"
                                    >
                                        <option value="in_stock">En stock (Vierge)</option>
                                        <option value="reserved">Réservée (Encodée)</option>
                                        <option value="paired">Pairée (Active)</option>
                                        <option value="lost">Perdue</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <button onClick={generateUids}
                                    className="flex-1 h-14 rounded-[1.2rem] text-sm font-bold text-apple-textDark dark:text-white bg-white/50 dark:bg-white/5 border border-gray-100 dark:border-white/10 hover:bg-white dark:hover:bg-white/10 transition-all active:scale-95"
                                >
                                    <span className="material-symbols-outlined text-[20px] font-light align-middle mr-2">shuffle</span>
                                    Simuler UIDs
                                </button>
                                {generatedUids.length > 0 && (
                                    <button onClick={handleBatchEncode} disabled={batchEncoding}
                                        className="flex-1 h-14 btn-obsidian bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-[1.2rem] shadow-xl disabled:opacity-50 transition-all active:scale-95 flex items-center justify-center gap-2"
                                    >
                                        <span className="material-symbols-outlined text-[20px] font-light">cloud_done</span>
                                        <span className="font-bold tracking-tight">{batchEncoding ? 'Batch...' : `Lancer ${generatedUids.length}`}</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Cards Table Section */}
                    <div className="klik-glass p-8 rounded-[3rem] border border-white/60 dark:border-white/5 shadow-2xl relative overflow-visible" ref={statusMenuRef}>
                        <div className="flex items-center justify-between mb-10 flex-wrap gap-6 px-2">
                            <div>
                                <h2 className="text-2xl font-black tracking-tight">Cartes Encodées</h2>
                                <p className="text-[11px] font-bold text-apple-secondary dark:text-gray-500 uppercase tracking-widest mt-1">Registre de l'inventaire en temps réel</p>
                            </div>
                            <div className="flex gap-2 p-1.5 bg-gray-100 dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/5 shadow-inner">
                                {['all', 'in_stock', 'reserved', 'paired', 'lost'].map((s: string) => (
                                    <button key={s} onClick={() => setFilterStatus(s)}
                                        className={`px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all duration-500 ${filterStatus === s
                                            ? 'bg-white dark:bg-[#1C1C1E] text-apple-textDark dark:text-white shadow-lg border border-gray-100 dark:border-white/10'
                                            : 'text-apple-secondary dark:text-gray-500 hover:text-apple-textDark dark:hover:text-white'
                                            }`}
                                    >
                                        {s === 'all' ? 'Tous' : STATUS_BADGE[s]?.label || s}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-24 gap-4">
                                <div className="animate-spin h-12 w-12 border-[5px] border-blue-500 border-t-transparent rounded-full" />
                                <p className="text-xs font-bold text-apple-secondary uppercase tracking-widest animate-pulse">Chargement du registre...</p>
                            </div>
                        ) : cards.length === 0 ? (
                            <div className="text-center py-24 bg-white/20 dark:bg-black/20 rounded-[2rem] border border-dashed border-gray-200 dark:border-white/10">
                                <span className="material-symbols-outlined text-7xl text-gray-200 dark:text-gray-800 font-light mb-4">inventory_2</span>
                                <p className="text-base font-bold text-apple-secondary">Aucun enregistrement disponible.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b border-gray-100 dark:border-white/5">
                                            <th className="px-6 py-5 text-[11px] font-black text-apple-secondary dark:text-gray-500 uppercase tracking-widest">UID NFC</th>
                                            <th className="px-6 py-5 text-[11px] font-black text-apple-secondary dark:text-gray-500 uppercase tracking-widest text-center">QR</th>
                                            <th className="px-6 py-5 text-[11px] font-black text-apple-secondary dark:text-gray-500 uppercase tracking-widest">Entrepôt</th>
                                            <th className="px-6 py-5 text-[11px] font-black text-apple-secondary dark:text-gray-500 uppercase tracking-widest">Statut</th>
                                            <th className="px-6 py-5 text-[11px] font-black text-apple-secondary dark:text-gray-500 uppercase tracking-widest">Propriétaire</th>
                                            <th className="px-6 py-5 text-[11px] font-black text-apple-secondary dark:text-gray-500 uppercase tracking-widest text-right">Date d'ajout</th>
                                            <th className="px-6 py-5 text-[11px] font-black text-apple-secondary dark:text-gray-500 uppercase tracking-widest text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                                        {cards.map(card => {
                                            const badge = STATUS_BADGE[card.status] || { label: card.status, bg: 'rgba(0,0,0,0.05)', text: '#666' };
                                            return (
                                                <tr key={card.id} className="group hover:bg-white/40 dark:hover:bg-white/5 transition-all duration-300">
                                                    <td className="px-6 py-5">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-2 h-2 rounded-full bg-blue-500/20 group-hover:bg-blue-500 transition-colors" />
                                                            <span className="font-mono text-xs font-bold tracking-wider">{card.uid}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-5 text-center">
                                                        <div className="flex flex-col items-center gap-2 group/qr relative">
                                                            <div className="p-2 bg-white rounded-lg shadow-sm border border-gray-100 dark:border-white/5 transition-transform group-hover/qr:scale-110 duration-300">
                                                                <QRCodeSVG
                                                                    id={`qr-svg-${card.uid}`}
                                                                    value={`${typeof window !== 'undefined' ? window.location.origin : ''}/activate/${card.uid}`}
                                                                    size={40}
                                                                    level="M"
                                                                    includeMargin={false}
                                                                    bgColor="transparent"
                                                                    fgColor="#000000"
                                                                />
                                                            </div>
                                                            <button
                                                                onClick={() => downloadQRCode(card.uid)}
                                                                className="flex items-center gap-1 text-[9px] font-black uppercase tracking-tighter text-blue-600 dark:text-blue-400 opacity-0 group-hover/qr:opacity-100 transition-opacity hover:underline"
                                                            >
                                                                <span className="material-symbols-outlined text-[12px]">download</span>
                                                                PNG
                                                            </button>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-5">
                                                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-white/10 text-[10px] font-black uppercase tracking-widest text-apple-secondary dark:text-gray-400">
                                                            <span className="material-symbols-outlined text-[14px]">inventory</span>
                                                            {WAREHOUSES.find(w => w.value === card.warehouse)?.label || card.warehouse}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-5">
                                                        <span className="px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border border-current opacity-80"
                                                            style={{ color: badge.text, backgroundColor: badge.bg }}
                                                        >
                                                            {badge.label}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-5">
                                                        {card.pairedCard ? (
                                                            <a href={`/p/${card.pairedCard.publicSlug}`} target="_blank"
                                                                className="flex items-center gap-2 text-xs font-bold text-apple-textDark dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                                                                <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-[10px] uppercase">{card.pairedCard.firstName[0]}</div>
                                                                {card.pairedCard.firstName} {card.pairedCard.lastName}
                                                            </a>
                                                        ) : (
                                                            <span className="text-[10px] font-bold text-gray-300 dark:text-gray-700 uppercase tracking-widest">—</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-5 text-right font-bold text-[11px] text-apple-secondary dark:text-gray-500 tabular-nums">
                                                        {new Date(card.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                    </td>
                                                    <td className="px-6 py-5 text-right">
                                                        {card.status !== 'paired' ? (
                                                            <button
                                                                onClick={(e) => openDropdown(card.id, e)}
                                                                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-apple-secondary dark:text-gray-400 bg-white/60 dark:bg-white/5 border border-gray-100 dark:border-white/10 hover:bg-white dark:hover:bg-white/20 hover:text-apple-textDark dark:hover:text-white transition-all shadow-sm active:scale-95"
                                                            >
                                                                Options
                                                                <span className="material-symbols-outlined text-[16px] font-light">expand_more</span>
                                                            </button>
                                                        ) : (
                                                            <button
                                                                onClick={() => handleChangeStatus(card.id, 'lost')}
                                                                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-red-500 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/30 transition-all active:scale-95"
                                                            >
                                                                <span className="material-symbols-outlined text-[16px] font-light">warning</span>
                                                                Perdue
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Status dropdown Portal */}
            {openStatusMenu && typeof document !== 'undefined' && createPortal(
                <div
                    className="fixed z-[9999] w-56 rounded-[1.5rem] shadow-2xl border border-white/60 dark:border-white/10 overflow-hidden animate-in fade-in zoom-in-95 duration-300"
                    style={{ top: dropdownPos.top, right: dropdownPos.right, background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(30px)' }}
                    ref={statusMenuRef}
                >
                    <div className="p-3 bg-gray-50/50 dark:bg-white/5 border-b border-gray-100 dark:border-white/5">
                        <span className="text-[10px] font-black uppercase tracking-widest text-apple-secondary dark:text-gray-500">Modifier le Statut</span>
                    </div>
                    <div className="p-1.5 flex flex-col gap-1">
                        {Object.entries(STATUS_BADGE)
                            .filter(([k]) => {
                                const current = cards.find(c => c.id === openStatusMenu);
                                return k !== 'paired' && k !== current?.status;
                            })
                            .map(([k, v]) => (
                                <button key={k}
                                    onClick={() => handleChangeStatus(openStatusMenu!, k)}
                                    className="w-full flex items-center justify-between px-4 py-3 text-xs font-bold rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 text-apple-textDark dark:text-white transition-all group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-2.5 h-2.5 rounded-full shadow-inner" style={{ backgroundColor: v.text }} />
                                        {v.label}
                                    </div>
                                    <span className="material-symbols-outlined text-[16px] opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all">chevron_right</span>
                                </button>
                            ))
                        }
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}
