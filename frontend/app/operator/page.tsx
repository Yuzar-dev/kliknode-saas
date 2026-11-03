'use client';

import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import toast from 'react-hot-toast';
import { QRCodeSVG } from 'qrcode.react';
import apiClient from '@/lib/api-client';

interface PhysicalCard {
    id: string;
    uid: string;
    sku: string | null;
    batchTag: string | null;
    status: string;
    warehouse: string;
    createdAt: string;
    pairedCard: { id: string; publicSlug: string; firstName: string; lastName: string; email?: string } | null;
    company: { id: string; name: string } | null;
}

interface CompanyOption {
    id: string;
    name: string;
    status?: string;
    country?: string;
    orderedCards?: number;
    assignedCards?: number;
    remainingToAssign?: number;
}

interface Stats {
    total: number;
    inStock: number;
    reserved: number;
    paired: number;
    engagedTotal?: number;
    lost: number;
    today: number;
    thisWeek: number;
    byStatus: Record<string, number>;
    byWarehouse?: Record<string, number>;
    pendingOrdersCount?: number;
    totalOrderedCards?: number;
    remainingToAssignCards?: number;
}

const STATUS_BADGE: Record<string, { label: string; bg: string; text: string }> = {
    in_stock: { label: 'En Stock (Vierge)', bg: 'rgba(245,158,11,0.1)', text: '#F59E0B' },
    reserved: { label: 'Réservée B2B', bg: 'rgba(79,70,229,0.1)', text: '#4F46E5' },
    paired: { label: 'Pairée (Active)', bg: 'rgba(16,185,129,0.1)', text: '#059669' },
    lost: { label: 'Perdue', bg: 'rgba(239,68,68,0.1)', text: '#DC2626' },
};

// NFC UID prefixes with chip type labels (14-char hex format without colons)
const NFC_PREFIXES = [
    { value: '04', sku: 'NFC-NTAG213', label: 'NTAG213/215/216 (NXP - 04...)' },
    { value: '04', sku: 'NFC-MIFARE', label: 'MIFARE Ultralight (NXP - 04...)' },
    { value: 'E0', sku: 'NFC-ISO15693', label: 'ISO 15693 (Texas Inst. - E0...)' },
    { value: '08', sku: 'NFC-CLASSIC1K', label: 'MIFARE Classic 1K (08...)' },
    { value: '18', sku: 'NFC-CLASSIC4K', label: 'MIFARE Classic 4K (18...)' },
    { value: '20', sku: 'NFC-DESFIRE', label: 'DESFire EV1/EV2 (20...)' },
];

// Warehouses
const WAREHOUSES = [
    { value: 'paris', label: 'Paris Sud' },
    { value: 'oujda', label: 'Oujda Port' },
];

function createUniformUid(prefix = '04'): string {
    const bytes = [prefix.toUpperCase()];
    for (let b = 0; b < 6; b++) {
        bytes.push(Math.floor(Math.random() * 256).toString(16).padStart(2, '0').toUpperCase());
    }
    return bytes.join('');
}

export default function OperatorPage() {
    const { user, logout } = useAuthStore();
    const router = useRouter();

    // 1. Manual Single Card Encode
    const [uid, setUid] = useState('');
    const [warehouse, setWarehouse] = useState('paris');
    const [encodeStatus, setEncodeStatus] = useState('in_stock');
    const [encoding, setEncoding] = useState(false);

    // Table & Stats state
    const [cards, setCards] = useState<PhysicalCard[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterWarehouse, setFilterWarehouse] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    // Dropdown with fixed positioning
    const [openStatusMenu, setOpenStatusMenu] = useState<string | null>(null);
    const [dropdownPos, setDropdownPos] = useState<{ top?: number; bottom?: number; right: number }>({ top: 0, right: 0 });
    const statusMenuRef = useRef<HTMLDivElement>(null);

    // 2. Batch Generator state
    const [batchQty, setBatchQty] = useState(5);
    const [batchWarehouse, setBatchWarehouse] = useState('paris');
    const [batchStatus, setBatchStatus] = useState('in_stock');
    const [batchPrefixIdx, setBatchPrefixIdx] = useState(0);
    const [generatedUids, setGeneratedUids] = useState<string[]>([]);
    const [batchEncoding, setBatchEncoding] = useState(false);

    // 3. B2B Assignment state
    const [companies, setCompanies] = useState<CompanyOption[]>([]);
    const [digitalCards, setDigitalCards] = useState<{ id: string; firstName: string; lastName: string; email: string; publicSlug: string; company?: { name: string } }[]>([]);
    const [selectedCompanyId, setSelectedCompanyId] = useState('');
    const [assignQty, setAssignQty] = useState<number>(5);
    const [assignUidsText, setAssignUidsText] = useState('');
    const [assigning, setAssigning] = useState(false);

    // Pairing Modal state
    const [pairingCard, setPairingCard] = useState<PhysicalCard | null>(null);
    const [selectedDigitalCardId, setSelectedDigitalCardId] = useState('');
    const [isPairingSubmitting, setIsPairingSubmitting] = useState(false);

    useEffect(() => {
        loadData();
    }, [filterStatus, filterWarehouse]);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (statusMenuRef.current && !statusMenuRef.current.contains(e.target as Node)) {
                setOpenStatusMenu(null);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    useEffect(() => {
        loadCompaniesAndProfiles();
    }, []);

    const loadCompaniesAndProfiles = async () => {
        try {
            const res = await apiClient.get('/api/operator/companies');
            if (res.data?.success) {
                setCompanies(res.data.data || []);
                if (res.data.digitalCards) {
                    setDigitalCards(res.data.digitalCards);
                }
            }
        } catch (error) {
            console.error('Failed to load companies', error);
        }
    };

    const loadData = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                limit: '200',
                status: filterStatus,
                warehouse: filterWarehouse,
            });
            if (searchQuery.trim()) {
                params.set('search', searchQuery.trim());
            }

            const [cardsRes, statsRes] = await Promise.all([
                apiClient.get(`/api/operator/cards?${params.toString()}`),
                apiClient.get('/api/operator/stats'),
            ]);

            if (cardsRes.data?.success) {
                setCards(cardsRes.data.data.cards || []);
            }
            if (statsRes.data?.success) {
                setStats(statsRes.data.data);
            }
            loadCompaniesAndProfiles();
        } catch (err) {
            console.error('Failed to load operator data:', err);
            toast.error('Impossible de charger le registre des cartes');
        } finally {
            setLoading(false);
        }
    };

    const generateSingleAutoUid = () => {
        setUid(createUniformUid('04'));
    };

    const handleEncode = async () => {
        const targetUid = uid.trim() || createUniformUid('04');
        setEncoding(true);
        try {
            const res = await apiClient.post('/api/operator/encode', {
                uid: targetUid,
                warehouse,
                status: encodeStatus,
                sku: 'NFC-NTAG213',
            });
            if (res.data?.success) {
                toast.success(`Carte ${res.data.data.uid} encodée et ajoutée au stock !`);
                setUid('');
                loadData();
            }
        } catch (err: any) {
            toast.error(err.response?.data?.error?.message || err.message || 'Erreur lors de l\'encodage');
        } finally {
            setEncoding(false);
        }
    };

    const handleChangeStatus = async (cardId: string, newStatus: string) => {
        setOpenStatusMenu(null);
        try {
            const res = await apiClient.patch(`/api/operator/cards/${cardId}/status`, { status: newStatus });
            if (res.data?.success) {
                toast.success(`Statut mis à jour : ${STATUS_BADGE[newStatus]?.label || newStatus}`);
                loadData();
            }
        } catch (err: any) {
            toast.error(err.response?.data?.error?.message || 'Erreur lors du changement de statut');
        }
    };

    const handleDeleteCard = async (cardId: string, cardUid: string) => {
        setOpenStatusMenu(null);
        if (!confirm(`Supprimer définitivement la carte ${cardUid} du stock ?`)) return;
        try {
            const res = await apiClient.delete(`/api/operator/cards/${cardId}`);
            if (res.data?.success) {
                toast.success(`Carte ${cardUid} supprimée et stock synchronisé`);
                loadData();
            }
        } catch (err: any) {
            toast.error(err.response?.data?.error?.message || 'Erreur lors de la suppression');
        }
    };

    const handlePairCardSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!pairingCard || !selectedDigitalCardId) {
            return toast.error('Sélectionnez un profil utilisateur à associer');
        }
        setIsPairingSubmitting(true);
        try {
            const res = await apiClient.post('/api/operator/pair', {
                uid: pairingCard.uid,
                cardId: selectedDigitalCardId,
            });
            if (res.data?.success) {
                toast.success(`Carte ${pairingCard.uid} appairée avec succès !`);
                setPairingCard(null);
                setSelectedDigitalCardId('');
                loadData();
            }
        } catch (err: any) {
            toast.error(err.response?.data?.error?.message || 'Erreur lors de l\'appairage');
        } finally {
            setIsPairingSubmitting(false);
        }
    };

    const openDropdown = (cardId: string, e: React.MouseEvent<HTMLButtonElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;

        if (spaceBelow < 260) {
            setDropdownPos({ bottom: window.innerHeight - rect.top + 6, right: window.innerWidth - rect.right });
        } else {
            setDropdownPos({ top: rect.bottom + 6, right: window.innerWidth - rect.right });
        }
        setOpenStatusMenu(openStatusMenu === cardId ? null : cardId);
    };

    const generateUids = () => {
        const prefix = NFC_PREFIXES[batchPrefixIdx].value;
        const uids: string[] = [];
        for (let i = 0; i < batchQty; i++) {
            uids.push(createUniformUid(prefix));
        }
        setGeneratedUids(uids);
        toast.success(`${uids.length} UIDs générés en aperçu`);
    };

    // Fonctionne en 1 clic même si l'opérateur n'a pas cliqué sur "Aperçu UIDs" avant !
    const handleBatchEncode = async () => {
        setBatchEncoding(true);
        try {
            const selectedChip = NFC_PREFIXES[batchPrefixIdx];
            const uidsToSend =
                generatedUids.length > 0
                    ? generatedUids
                    : Array.from({ length: batchQty }, () => createUniformUid(selectedChip?.value || '04'));

            const res = await apiClient.post('/api/operator/encode-batch', {
                uids: uidsToSend,
                quantity: batchQty,
                prefix: selectedChip?.value || '04',
                warehouse: batchWarehouse,
                status: batchStatus,
                sku: selectedChip?.sku || 'NFC-NTAG213',
            });

            if (res.data?.success) {
                const count = res.data.data?.createdCount ?? uidsToSend.length;
                setGeneratedUids([]);
                loadData();
                toast.success(`${count} carte(s) générée(s) et ajoutée(s) au stock !`);
            }
        } catch (e: any) {
            toast.error(e.response?.data?.error?.message || e.message || 'Erreur lors du batch encode');
        } finally {
            setBatchEncoding(false);
        }
    };

    // Cartes éligibles à l'attribution B2B : d'abord les cartes "Réservée B2B" non encore attribuées à une entreprise, puis les cartes "En stock (Vierge)"
    const getAssignableB2BCards = () => {
        const reservedUnassigned = cards.filter(c => c.status === 'reserved' && !c.company && !c.pairedCard);
        const inStockUnassigned = cards.filter(c => c.status === 'in_stock' && !c.company && !c.pairedCard);
        return [...reservedUnassigned, ...inStockUnassigned];
    };

    // Quand on choisit une entreprise dans "3. Assignation B2B",
    // on pré-remplit automatiquement le nombre de cartes qu'il reste à lui attribuer (ou ce qu'elle a commandé) !
    const handleSelectCompanyForB2B = (companyId: string) => {
        setSelectedCompanyId(companyId);
        const comp = companies.find(c => c.id === companyId);
        if (comp) {
            const defaultCount =
                comp.remainingToAssign && comp.remainingToAssign > 0
                    ? comp.remainingToAssign
                    : comp.orderedCards && comp.orderedCards > 0
                    ? comp.orderedCards
                    : 5;
            setAssignQty(defaultCount);
            // Pré-remplir automatiquement les UIDs depuis le lot B2B non attribué ou le stock vierge disponible
            const assignableCards = getAssignableB2BCards();
            if (assignableCards.length > 0) {
                const picked = assignableCards.slice(0, defaultCount).map(c => c.uid);
                setAssignUidsText(picked.join('\n'));
            }
        }
    };

    const autoFillB2BUidsFromStock = (count = assignQty) => {
        const qty = Math.max(1, Number(count) || 1);
        const assignableCards = getAssignableB2BCards();
        if (assignableCards.length === 0) {
            return toast.error('Aucune carte disponible (En stock ou Réservée B2B non attribuée) dans la liste');
        }
        const picked = assignableCards.slice(0, qty).map(c => c.uid);
        setAssignUidsText(picked.join('\n'));
        toast.success(`${picked.length} UID(s) sélectionnés depuis le stock / lot B2B`);
    };

    const handleBatchAssign = async () => {
        if (!selectedCompanyId) return toast.error('Sélectionnez d\'abord une entreprise cible');

        const manualUids = assignUidsText
            .split(/[\n,]+/)
            .map(u => u.trim())
            .filter(u => u);

        setAssigning(true);
        try {
            const res = await apiClient.post('/api/operator/assign-batch', {
                uids: manualUids,
                quantity: manualUids.length > 0 ? manualUids.length : assignQty,
                companyId: selectedCompanyId,
            });

            if (res.data?.success) {
                toast.success(res.data.data.message);
                setAssignUidsText('');
                loadData();
            } else {
                throw new Error(res.data?.error?.message || 'Erreur');
            }
        } catch (e: any) {
            toast.error(e.response?.data?.error?.message || e.message || 'Erreur lors de l\'assignation B2B');
        } finally {
            setAssigning(false);
        }
    };

    const handleLogout = async () => {
        logout();
        router.push('/login');
    };

    const downloadQRCode = (cardUid: string) => {
        const canvas = document.createElement('canvas');
        const qrSize = 512;
        canvas.width = qrSize;
        canvas.height = qrSize;

        const svgElement = document.getElementById(`qr-svg-${cardUid}`);
        if (!svgElement) return;

        const xml = new XMLSerializer().serializeToString(svgElement);
        const svgWithXmlns = xml.includes('xmlns=')
            ? xml
            : xml.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');

        const svg64 = btoa(unescape(encodeURIComponent(svgWithXmlns)));
        const image64 = 'data:image/svg+xml;base64,' + svg64;

        const img = new Image();
        img.onload = () => {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.clearRect(0, 0, qrSize, qrSize);
                ctx.globalCompositeOperation = 'source-over';
                ctx.drawImage(img, 0, 0, qrSize, qrSize);
                const pngUrl = canvas.toDataURL('image/png');
                const downloadLink = document.createElement('a');
                downloadLink.href = pngUrl;
                downloadLink.download = `QR_${cardUid.replace(/:/g, '-')}.png`;
                document.body.appendChild(downloadLink);
                downloadLink.click();
                document.body.removeChild(downloadLink);
                toast.success('QR Code téléchargé');
            }
        };
        img.src = image64;
    };

    const currentMenuCard = openStatusMenu ? cards.find(c => c.id === openStatusMenu) : null;
    const selectedCompanyObj = companies.find(c => c.id === selectedCompanyId);

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
                            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-gray-400 mt-1 leading-none">Escale Opérateur · Stock Unifié</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.push('/operator/guides')}
                            className="px-4 py-2 rounded-full text-xs font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 transition-all flex items-center gap-2 cursor-pointer"
                        >
                            <span className="material-symbols-outlined text-[16px]" translate="no">menu_book</span>
                            Guides & NFC Tools
                        </button>
                        {user?.role === 'ADMIN' && (
                            <button
                                onClick={() => router.push('/admin/inventory')}
                                className="px-4 py-2 rounded-full text-xs font-bold bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 transition-all flex items-center gap-2 cursor-pointer"
                            >
                                <span className="material-symbols-outlined text-[16px]" translate="no">arrow_back</span>
                                Retour Admin Stocks
                            </button>
                        )}
                        <div className="flex flex-col items-end">
                            <span className="text-[11px] font-black text-apple-textDark dark:text-white">{user?.firstName} {user?.lastName}</span>
                            <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">Synchronisé Temps Réel</span>
                        </div>
                        <div className="h-8 w-px bg-gray-200 dark:bg-white/10" />
                        <div className="flex items-center gap-3">
                            <button onClick={loadData} title="Rafraîchir et synchroniser" className="w-10 h-10 rounded-full flex items-center justify-center text-apple-secondary hover:text-apple-textDark dark:hover:text-white bg-white/40 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 transition-all active:scale-95 cursor-pointer">
                                <span className="material-symbols-outlined text-[20px] font-light" translate="no">refresh</span>
                            </button>
                            <button onClick={handleLogout} title="Déconnexion" className="w-10 h-10 rounded-full flex items-center justify-center text-apple-secondary hover:text-red-500 bg-white/40 dark:bg-white/5 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all active:scale-95 cursor-pointer">
                                <span className="material-symbols-outlined text-[20px] font-light" translate="no">logout</span>
                            </button>
                        </div>
                    </div>
                </header>

                <div className="max-w-7xl mx-auto p-8 relative z-10">
                    {/* Stats Section - 100% Aligned with Admin Inventory */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                        {[
                            {
                                label: 'Total Cartes Physiques',
                                value: stats?.total || 0,
                                sub: `Paris: ${stats?.byWarehouse?.paris || 0} · Oujda: ${stats?.byWarehouse?.oujda || 0}`,
                                icon: 'credit_card',
                                color: 'from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900',
                                textColor: 'text-apple-textDark dark:text-white',
                            },
                            {
                                label: 'En Stock (Vierges)',
                                value: stats?.inStock || 0,
                                sub: 'Disponibles immédiatement (= Qty Dispo)',
                                icon: 'inventory_2',
                                color: 'from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20',
                                textColor: 'text-amber-600 dark:text-amber-400',
                            },
                            {
                                label: 'Réservées B2B',
                                value: stats?.reserved || 0,
                                sub:
                                    stats?.remainingToAssignCards && stats.remainingToAssignCards > 0
                                        ? `Reste ${stats.remainingToAssignCards} à attribuer (sur ${stats.totalOrderedCards} commandées)`
                                        : stats?.totalOrderedCards
                                        ? `Commandes (${stats.totalOrderedCards} cartes) attribuées`
                                        : 'Attribuées à une entreprise',
                                icon: 'business_center',
                                color: 'from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20',
                                textColor: 'text-indigo-600 dark:text-indigo-400',
                            },
                            {
                                label: 'Cartes Pairées (Actives)',
                                value: stats?.paired || 0,
                                sub: `Total engagées (Réservées + Pairées) : ${(stats?.reserved || 0) + (stats?.paired || 0)}`,
                                icon: 'link',
                                color: 'from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20',
                                textColor: 'text-emerald-600 dark:text-emerald-400',
                            },
                        ].map(s => (
                            <div key={s.label} className="klik-glass p-6 rounded-[2rem] border border-white/60 dark:border-white/5 shadow-sm group hover:shadow-xl transition-all duration-500 overflow-hidden relative">
                                <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${s.color} blur-3xl opacity-20 -mr-10 -mt-10`} />
                                <div className="flex flex-col gap-3">
                                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-white dark:bg-white/5 shadow-sm border border-gray-100 dark:border-white/10">
                                        <span className={`material-symbols-outlined text-[24px] font-light ${s.textColor}`} translate="no">{s.icon}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <p className="text-3xl font-black tracking-tight">{s.value}</p>
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-apple-secondary dark:text-gray-500 mt-0.5">{s.label}</p>
                                        <p className="text-[11px] font-semibold text-apple-secondary/80 dark:text-gray-400 mt-1">{s.sub}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Actions Grid - The 3 Operator Workflows */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
                        {/* 1. Manual Single Card Encode */}
                        <div className="klik-glass p-8 rounded-[2.5rem] border border-white/60 dark:border-white/5 shadow-lg relative overflow-hidden group flex flex-col justify-between">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100 dark:bg-blue-900/10 blur-3xl opacity-30 -mr-16 -mt-16 group-hover:opacity-50 transition-all duration-700" />
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-3">
                                        <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 font-light text-2xl" translate="no">nfc</span>
                                        <h2 className="text-xl font-black tracking-tight">1. Encoder une carte</h2>
                                    </div>
                                    <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">Unitaire</span>
                                </div>
                                <p className="text-xs text-apple-secondary mb-6">
                                    Scannez une puce avec un lecteur NFC USB ou générez un UID automatique au format standard (14 caractères).
                                </p>

                                <div className="flex flex-col gap-5">
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <label className="text-[11px] font-black text-apple-secondary dark:text-gray-500 uppercase tracking-widest ml-1">UID NFC (14 car.)</label>
                                            <button
                                                type="button"
                                                onClick={generateSingleAutoUid}
                                                className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                                            >
                                                <span className="material-symbols-outlined text-[13px]" translate="no">autorenew</span>
                                                Générer un UID auto
                                            </button>
                                        </div>
                                        <input
                                            type="text"
                                            value={uid}
                                            onChange={(e) => setUid(e.target.value)}
                                            placeholder="Ex: 04A3B2C1D4E5F6 (ou vide = auto)"
                                            className="w-full rounded-[1.2rem] border border-gray-200 dark:border-white/10 bg-white/40 dark:bg-black/20 px-5 py-3.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/20 focus:bg-white dark:focus:bg-black/40 transition-all font-mono font-bold"
                                            onKeyDown={(e) => e.key === 'Enter' && handleEncode()}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[11px] font-black text-apple-secondary dark:text-gray-500 uppercase tracking-widest ml-1">Entrepôt</label>
                                            <select
                                                value={warehouse}
                                                onChange={(e) => setWarehouse(e.target.value)}
                                                className="w-full rounded-[1.2rem] border border-gray-200 dark:border-white/10 bg-white/40 dark:bg-black/20 px-4 py-3.5 text-xs focus:outline-none font-bold"
                                            >
                                                {WAREHOUSES.map(w => <option key={w.value} value={w.value}>{w.label}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[11px] font-black text-apple-secondary dark:text-gray-500 uppercase tracking-widest ml-1">Statut</label>
                                            <select
                                                value={encodeStatus}
                                                onChange={(e) => setEncodeStatus(e.target.value)}
                                                className="w-full rounded-[1.2rem] border border-gray-200 dark:border-white/10 bg-white/40 dark:bg-black/20 px-4 py-3.5 text-xs focus:outline-none font-bold"
                                            >
                                                <option value="in_stock">En stock (Vierge)</option>
                                                <option value="reserved">Réservée B2B</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6">
                                <button
                                    onClick={handleEncode}
                                    disabled={encoding}
                                    className="w-full h-13 btn-obsidian btn-obsidian-primary flex items-center justify-center gap-2 rounded-[1.2rem] shadow-xl disabled:opacity-50 transition-all active:scale-95 cursor-pointer"
                                >
                                    <span className="material-symbols-outlined text-[20px] font-light" translate="no">bolt</span>
                                    <span className="font-bold tracking-tight">{encoding ? 'Encodage...' : 'Encoder la carte (+1 stock)'}</span>
                                </button>
                            </div>
                        </div>

                        {/* 2. Batch Generator */}
                        <div className="klik-glass p-8 rounded-[2.5rem] border border-white/60 dark:border-white/5 shadow-lg relative overflow-hidden group flex flex-col justify-between">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-100 dark:bg-emerald-900/10 blur-3xl opacity-30 -mr-16 -mt-16 group-hover:opacity-50 transition-all duration-700" />
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-3">
                                        <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400 font-light text-2xl" translate="no">dynamic_feed</span>
                                        <h2 className="text-xl font-black tracking-tight">2. Générateur Batch</h2>
                                    </div>
                                    <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">Par Lot</span>
                                </div>
                                <p className="text-xs text-apple-secondary mb-6">
                                    Créez plusieurs cartes d&apos;un coup selon le modèle de puce NFC. Cliquez directement sur Lancer.
                                </p>

                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black text-apple-secondary dark:text-gray-500 uppercase tracking-widest ml-1">Quantité</label>
                                        <select
                                            value={batchQty}
                                            onChange={(e) => {
                                                setBatchQty(Number(e.target.value));
                                                setGeneratedUids([]);
                                            }}
                                            className="w-full rounded-[1.2rem] border border-gray-200 dark:border-white/10 bg-white/40 dark:bg-black/20 px-4 py-3.5 text-xs focus:outline-none font-bold"
                                        >
                                            {[5, 10, 25, 50, 100].map(n => <option key={n} value={n}>{n} Cartes</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black text-apple-secondary dark:text-gray-500 uppercase tracking-widest ml-1">Entrepôt</label>
                                        <select
                                            value={batchWarehouse}
                                            onChange={(e) => setBatchWarehouse(e.target.value)}
                                            className="w-full rounded-[1.2rem] border border-gray-200 dark:border-white/10 bg-white/40 dark:bg-black/20 px-4 py-3.5 text-xs focus:outline-none font-bold"
                                        >
                                            {WAREHOUSES.map(w => <option key={w.value} value={w.value}>{w.label}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black text-apple-secondary dark:text-gray-500 uppercase tracking-widest ml-1">Puce NFC</label>
                                        <select
                                            value={batchPrefixIdx}
                                            onChange={(e) => setBatchPrefixIdx(Number(e.target.value))}
                                            className="w-full rounded-[1.2rem] border border-gray-200 dark:border-white/10 bg-white/40 dark:bg-black/20 px-4 py-3.5 text-xs focus:outline-none font-bold"
                                        >
                                            {NFC_PREFIXES.map((p, i) => <option key={i} value={i}>{p.label}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black text-apple-secondary dark:text-gray-500 uppercase tracking-widest ml-1">Statut Initial</label>
                                        <select
                                            value={batchStatus}
                                            onChange={(e) => setBatchStatus(e.target.value)}
                                            className="w-full rounded-[1.2rem] border border-gray-200 dark:border-white/10 bg-white/40 dark:bg-black/20 px-4 py-3.5 text-xs focus:outline-none font-bold"
                                        >
                                            <option value="in_stock">En stock (Vierge)</option>
                                            <option value="reserved">Réservée B2B</option>
                                        </select>
                                    </div>
                                </div>

                                {generatedUids.length > 0 && (
                                    <div className="p-3 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 mb-2">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-1">
                                            {generatedUids.length} UIDs générés en aperçu :
                                        </p>
                                        <p className="text-[10px] font-mono text-apple-secondary truncate">
                                            {generatedUids.slice(0, 3).join(', ')} {generatedUids.length > 3 ? `... (+${generatedUids.length - 3})` : ''}
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={generateUids}
                                    className="px-4 h-13 rounded-[1.2rem] text-xs font-bold text-apple-textDark dark:text-white bg-white/60 dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:bg-white dark:hover:bg-white/10 transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                                    title="Prévisualiser les UIDs avant génération"
                                >
                                    <span className="material-symbols-outlined text-[18px] font-light" translate="no">shuffle</span>
                                    Aperçu
                                </button>
                                <button
                                    type="button"
                                    onClick={handleBatchEncode}
                                    disabled={batchEncoding}
                                    className="flex-1 h-13 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white rounded-[1.2rem] shadow-xl disabled:opacity-50 transition-all active:scale-95 flex items-center justify-center gap-2 text-xs font-bold cursor-pointer"
                                >
                                    <span className="material-symbols-outlined text-[18px] font-light" translate="no">cloud_done</span>
                                    <span>{batchEncoding ? 'Génération...' : `Lancer (${generatedUids.length || batchQty} cartes)`}</span>
                                </button>
                            </div>
                        </div>

                        {/* 3. B2B Assignment */}
                        <div className="klik-glass p-8 rounded-[2.5rem] border border-white/60 dark:border-white/5 shadow-lg relative overflow-hidden group flex flex-col justify-between">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-100 dark:bg-purple-900/10 blur-3xl opacity-30 -mr-16 -mt-16 group-hover:opacity-50 transition-all duration-700" />
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-3">
                                        <span className="material-symbols-outlined text-purple-600 dark:text-purple-400 font-light text-2xl" translate="no">business</span>
                                        <h2 className="text-xl font-black tracking-tight">3. Assignation B2B</h2>
                                    </div>
                                    <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400">Entreprises</span>
                                </div>
                                <p className="text-xs text-apple-secondary mb-5">
                                    Attribuez les cartes commandées par une entreprise cliente (ajuste automatiquement le nombre selon sa commande).
                                </p>

                                <div className="flex flex-col gap-3.5">
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-black text-apple-secondary dark:text-gray-500 uppercase tracking-widest ml-1">Entreprise Cible</label>
                                        <select
                                            value={selectedCompanyId}
                                            onChange={(e) => handleSelectCompanyForB2B(e.target.value)}
                                            className="w-full rounded-[1.2rem] border border-gray-200 dark:border-white/10 bg-white/40 dark:bg-black/20 px-4 py-3 text-xs focus:outline-none font-bold"
                                        >
                                            <option value="">-- Sélectionner une entreprise --</option>
                                            {companies.map(c => (
                                                <option key={c.id} value={c.id}>
                                                    {c.name}
                                                    {c.orderedCards && c.orderedCards > 0
                                                        ? ` (Cmd: ${c.orderedCards} · Attribuées: ${c.assignedCards || 0} · Reste: ${c.remainingToAssign || 0})`
                                                        : c.assignedCards && c.assignedCards > 0
                                                        ? ` (${c.assignedCards} attribuées)`
                                                        : ''}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {selectedCompanyObj && (selectedCompanyObj.orderedCards || 0) > 0 && (
                                        <div className="px-3.5 py-2 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-between text-[11px] font-bold text-purple-700 dark:text-purple-300">
                                            <span>Commandées : {selectedCompanyObj.orderedCards}</span>
                                            <span>Déjà attribuées : {selectedCompanyObj.assignedCards || 0}</span>
                                            <span className="underline">Reste : {selectedCompanyObj.remainingToAssign || 0}</span>
                                        </div>
                                    )}

                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-black text-apple-secondary dark:text-gray-500 uppercase tracking-widest ml-1">
                                            Nombre de cartes à prendre du stock
                                        </label>
                                        <div className="flex gap-2">
                                            <input
                                                type="number"
                                                min={1}
                                                max={500}
                                                value={assignQty}
                                                onChange={(e) => setAssignQty(Math.max(1, parseInt(e.target.value) || 1))}
                                                className="w-24 rounded-xl border border-gray-200 dark:border-white/10 bg-white/60 dark:bg-black/20 px-3.5 py-2.5 text-xs font-mono font-black text-center focus:outline-none"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => autoFillB2BUidsFromStock(assignQty)}
                                                className="flex-1 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/20 text-xs font-bold px-3 py-2.5 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                                            >
                                                <span className="material-symbols-outlined text-[15px]" translate="no">auto_awesome</span>
                                                Sélectionner {assignQty} du stock
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-apple-secondary dark:text-gray-500 uppercase tracking-widest ml-1">
                                            UIDs sélectionnés ({assignUidsText.split(/[\n,]+/).map(u => u.trim()).filter(Boolean).length || 0})
                                        </label>
                                        <textarea
                                            value={assignUidsText}
                                            onChange={(e) => setAssignUidsText(e.target.value)}
                                            placeholder="Les UIDs s'affichent ici automatiquement (ou collez vos UIDs)"
                                            className="w-full h-20 rounded-[1.2rem] border border-gray-200 dark:border-white/10 bg-white/40 dark:bg-black/20 px-4 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500/20 focus:bg-white dark:focus:bg-black/40 transition-all font-mono font-bold resize-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="mt-5">
                                <button
                                    type="button"
                                    onClick={handleBatchAssign}
                                    disabled={assigning}
                                    className="w-full h-13 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white flex items-center justify-center gap-2 rounded-[1.2rem] shadow-xl disabled:opacity-50 transition-all active:scale-95 text-sm cursor-pointer"
                                >
                                    <span className="material-symbols-outlined text-[20px] font-light" translate="no">send_to_mobile</span>
                                    <span className="font-bold tracking-tight">
                                        {assigning
                                            ? 'Attribution...'
                                            : `Assigner (${assignUidsText.split(/[\n,]+/).map(u => u.trim()).filter(Boolean).length || assignQty} cartes)`}
                                    </span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Cards Table Section */}
                    <div className="klik-glass p-8 rounded-[3rem] border border-white/60 dark:border-white/5 shadow-2xl relative overflow-visible" ref={statusMenuRef}>
                        <div className="flex items-center justify-between mb-8 flex-wrap gap-4 px-2">
                            <div>
                                <h2 className="text-2xl font-black tracking-tight">Registre des Cartes ({cards.length})</h2>
                                <p className="text-[11px] font-bold text-apple-secondary dark:text-gray-500 uppercase tracking-widest mt-1">
                                    Synchronisé à 100% avec Gestion des Stocks (/admin/inventory) & Générateur de Lots (/admin/batch-generator)
                                </p>
                            </div>

                            <div className="flex items-center gap-3 flex-wrap">
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-apple-secondary text-[18px]" translate="no">search</span>
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && loadData()}
                                        placeholder="Rechercher UID ou Lot..."
                                        className="pl-9 pr-4 py-2.5 rounded-xl bg-white/60 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs font-bold focus:outline-none"
                                    />
                                </div>

                                <select
                                    value={filterWarehouse}
                                    onChange={(e) => setFilterWarehouse(e.target.value)}
                                    className="px-4 py-2.5 rounded-xl bg-white/60 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs font-bold focus:outline-none"
                                >
                                    <option value="all">Tous Entrepôts</option>
                                    <option value="paris">Paris Sud</option>
                                    <option value="oujda">Oujda Port</option>
                                </select>

                                <div className="flex gap-1.5 p-1.5 bg-gray-100 dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/5 shadow-inner">
                                    {['all', 'in_stock', 'reserved', 'paired', 'lost'].map((s: string) => (
                                        <button
                                            key={s}
                                            onClick={() => setFilterStatus(s)}
                                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 cursor-pointer ${
                                                filterStatus === s
                                                    ? 'bg-white dark:bg-[#1C1C1E] text-apple-textDark dark:text-white shadow-md border border-gray-100 dark:border-white/10'
                                                    : 'text-apple-secondary dark:text-gray-500 hover:text-apple-textDark dark:hover:text-white'
                                            }`}
                                        >
                                            {s === 'all' ? 'Tous' : STATUS_BADGE[s]?.label || s}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-24 gap-4">
                                <div className="animate-spin h-12 w-12 border-[5px] border-blue-500 border-t-transparent rounded-full" />
                                <p className="text-xs font-bold text-apple-secondary uppercase tracking-widest animate-pulse">Chargement du registre...</p>
                            </div>
                        ) : cards.length === 0 ? (
                            <div className="text-center py-24 bg-white/20 dark:bg-black/20 rounded-[2rem] border border-dashed border-gray-200 dark:border-white/10">
                                <span className="material-symbols-outlined text-7xl text-gray-200 dark:text-gray-800 font-light mb-4" translate="no">inventory_2</span>
                                <p className="text-base font-bold text-apple-secondary">Aucune carte trouvée pour ce filtre.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b border-gray-100 dark:border-white/5">
                                            <th className="px-6 py-5 text-[11px] font-black text-apple-secondary dark:text-gray-500 uppercase tracking-widest">UID NFC & Lot</th>
                                            <th className="px-6 py-5 text-[11px] font-black text-apple-secondary dark:text-gray-500 uppercase tracking-widest text-center">QR</th>
                                            <th className="px-6 py-5 text-[11px] font-black text-apple-secondary dark:text-gray-500 uppercase tracking-widest">Entrepôt</th>
                                            <th className="px-6 py-5 text-[11px] font-black text-apple-secondary dark:text-gray-500 uppercase tracking-widest">Statut</th>
                                            <th className="px-6 py-5 text-[11px] font-black text-apple-secondary dark:text-gray-500 uppercase tracking-widest">Affectation (Profil / B2B)</th>
                                            <th className="px-6 py-5 text-[11px] font-black text-apple-secondary dark:text-gray-500 uppercase tracking-widest text-right">Date d&apos;ajout</th>
                                            <th className="px-6 py-5 text-[11px] font-black text-apple-secondary dark:text-gray-500 uppercase tracking-widest text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                                        {cards.map(card => {
                                            const badge = STATUS_BADGE[card.status] || { label: card.status, bg: 'rgba(0,0,0,0.05)', text: '#666' };
                                            return (
                                                <tr key={card.id} className="group hover:bg-white/40 dark:hover:bg-white/5 transition-all duration-300">
                                                    <td className="px-6 py-5">
                                                        <div className="flex flex-col gap-1">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-2 h-2 rounded-full bg-blue-500/30 group-hover:bg-blue-500 transition-colors" />
                                                                <span className="font-mono text-xs font-bold tracking-wider">{card.uid}</span>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        const origin = typeof window !== 'undefined' ? window.location.origin : 'https://app.kliknode.com';
                                                                        const link = `${origin}/activate/${card.uid}`;
                                                                        navigator.clipboard.writeText(link);
                                                                        toast.success(`Lien NFC copié : ${link}`);
                                                                    }}
                                                                    title="Copier le lien d'activation pour NFC Tools"
                                                                    className="px-2 py-0.5 rounded-md bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 text-[9px] font-black uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer"
                                                                >
                                                                    <span className="material-symbols-outlined text-[11px]" translate="no">content_copy</span>
                                                                    Lien NFC
                                                                </button>
                                                            </div>
                                                            <span className="text-[10px] font-bold text-apple-secondary ml-4">
                                                                {card.sku || 'NFC-NTAG213'} {card.batchTag ? `· ${card.batchTag}` : ''}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-5 text-center">
                                                        <div className="flex flex-col items-center gap-1.5 group/qr relative">
                                                            <div className="p-2 bg-white rounded-lg shadow-sm border border-gray-100 dark:border-white/5 transition-transform group-hover/qr:scale-110 duration-300">
                                                                <QRCodeSVG
                                                                    id={`qr-svg-${card.uid}`}
                                                                    value={`${typeof window !== 'undefined' ? window.location.origin : ''}/activate/${card.uid}`}
                                                                    size={38}
                                                                    level="M"
                                                                    includeMargin={false}
                                                                    bgColor="transparent"
                                                                    fgColor="#000000"
                                                                />
                                                            </div>
                                                            <button
                                                                onClick={() => downloadQRCode(card.uid)}
                                                                className="flex items-center gap-1 text-[9px] font-black uppercase tracking-tighter text-blue-600 dark:text-blue-400 opacity-0 group-hover/qr:opacity-100 transition-opacity hover:underline cursor-pointer"
                                                            >
                                                                <span className="material-symbols-outlined text-[12px]" translate="no">download</span>
                                                                PNG
                                                            </button>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-5">
                                                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-white/10 text-[10px] font-black uppercase tracking-widest text-apple-secondary dark:text-gray-400">
                                                            <span className="material-symbols-outlined text-[14px]" translate="no">inventory</span>
                                                            {WAREHOUSES.find(w => w.value === card.warehouse)?.label || card.warehouse}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-5">
                                                        <span
                                                            className="px-4 py-2 rounded-full whitespace-nowrap text-[10px] font-black uppercase tracking-widest border border-current opacity-85"
                                                            style={{ color: badge.text, backgroundColor: badge.bg }}
                                                        >
                                                            {badge.label}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-5">
                                                        {card.pairedCard ? (
                                                            <a
                                                                href={`/p/${card.pairedCard.publicSlug}`}
                                                                target="_blank"
                                                                className="flex items-center gap-2 text-xs font-bold text-apple-textDark dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                                            >
                                                                <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 flex items-center justify-center text-[10px] uppercase font-black">
                                                                    {(card.pairedCard.firstName || 'U')[0]}
                                                                </div>
                                                                <div className="flex flex-col">
                                                                    <span>{card.pairedCard.firstName} {card.pairedCard.lastName}</span>
                                                                    {card.company && (
                                                                        <span className="text-[10px] text-purple-600 font-semibold">{card.company.name}</span>
                                                                    )}
                                                                </div>
                                                            </a>
                                                        ) : card.company ? (
                                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs font-bold">
                                                                <span className="material-symbols-outlined text-[14px]" translate="no">business</span>
                                                                {card.company.name}
                                                            </span>
                                                        ) : (
                                                            <span className="text-[10px] font-bold text-gray-400 dark:text-gray-600 uppercase tracking-widest">Non assignée</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-5 text-right font-bold text-[11px] text-apple-secondary dark:text-gray-500 tabular-nums">
                                                        {new Date(card.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                    </td>
                                                    <td className="px-6 py-5 text-right">
                                                        <button
                                                            onClick={(e) => openDropdown(card.id, e)}
                                                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-apple-secondary dark:text-gray-400 bg-white/60 dark:bg-white/5 border border-gray-100 dark:border-white/10 hover:bg-white dark:hover:bg-white/20 hover:text-apple-textDark dark:hover:text-white transition-all shadow-sm active:scale-95 cursor-pointer"
                                                        >
                                                            Options
                                                            <span className="material-symbols-outlined text-[16px] font-light" translate="no">expand_more</span>
                                                        </button>
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

            {/* Status & Actions dropdown Portal */}
            {openStatusMenu && currentMenuCard && typeof document !== 'undefined' && createPortal(
                <div
                    className="fixed z-[9999] w-64 rounded-[1.5rem] shadow-2xl border border-white/60 dark:border-white/10 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
                    style={{
                        ...(dropdownPos.top !== undefined ? { top: dropdownPos.top } : {}),
                        ...(dropdownPos.bottom !== undefined ? { bottom: dropdownPos.bottom } : {}),
                        right: dropdownPos.right,
                        background: 'rgba(255,255,255,0.97)',
                        backdropFilter: 'blur(30px)',
                    }}
                    ref={statusMenuRef}
                >
                    <div className="p-3 bg-gray-50/80 border-b border-gray-100">
                        <span className="text-[10px] font-black uppercase tracking-widest text-apple-secondary block">
                            Carte {currentMenuCard.uid}
                        </span>
                    </div>
                    <div className="p-1.5 flex flex-col gap-1">
                        {currentMenuCard.status !== 'paired' && (
                            <button
                                onClick={() => {
                                    setPairingCard(currentMenuCard);
                                    setOpenStatusMenu(null);
                                }}
                                className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-bold rounded-xl hover:bg-emerald-50 text-emerald-700 transition-all cursor-pointer"
                            >
                                <div className="flex items-center gap-2.5">
                                    <span className="material-symbols-outlined text-[16px]" translate="no">link</span>
                                    Associer à un Profil (Pairer)
                                </div>
                            </button>
                        )}

                        {Object.entries(STATUS_BADGE)
                            .filter(([k]) => k !== 'paired' && k !== currentMenuCard.status)
                            .map(([k, v]) => (
                                <button
                                    key={k}
                                    onClick={() => handleChangeStatus(currentMenuCard.id, k)}
                                    className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-bold rounded-xl hover:bg-gray-100 text-apple-textDark transition-all group cursor-pointer"
                                >
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: v.text }} />
                                        Passer en : {v.label}
                                    </div>
                                </button>
                            ))}

                        <div className="h-px bg-gray-100 my-1" />

                        <button
                            onClick={() => handleDeleteCard(currentMenuCard.id, currentMenuCard.uid)}
                            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold rounded-xl hover:bg-rose-50 text-rose-600 transition-all cursor-pointer"
                        >
                            <span className="material-symbols-outlined text-[16px]" translate="no">delete</span>
                            Supprimer du stock
                        </button>
                    </div>
                </div>,
                document.body
            )}

            {/* Modal d'Appairage Carte Physique -> Profil Utilisateur */}
            {pairingCard && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-[#1C1C1E] rounded-[2rem] w-full max-w-md shadow-2xl border border-white/40 dark:border-white/10 overflow-hidden">
                        <div className="p-6 border-b border-gray-100 dark:border-white/10 flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-black text-apple-textDark dark:text-white">Appairer la carte NFC</h3>
                                <p className="text-xs font-mono text-apple-secondary mt-0.5">{pairingCard.uid}</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setPairingCard(null)}
                                className="w-9 h-9 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 flex items-center justify-center"
                            >
                                <span className="material-symbols-outlined text-[18px]" translate="no">close</span>
                            </button>
                        </div>
                        <form onSubmit={handlePairCardSubmit} className="p-6 space-y-5">
                            <div>
                                <label className="block text-[11px] font-black text-apple-secondary uppercase tracking-widest mb-2">
                                    Profil Digital (Employé / Utilisateur)
                                </label>
                                <select
                                    required
                                    value={selectedDigitalCardId}
                                    onChange={(e) => setSelectedDigitalCardId(e.target.value)}
                                    className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/20 px-4 py-3 text-xs font-bold focus:outline-none"
                                >
                                    <option value="">-- Choisir un profil non appairé --</option>
                                    {digitalCards.map(dc => (
                                        <option key={dc.id} value={dc.id}>
                                            {dc.firstName} {dc.lastName} ({dc.email}) {dc.company?.name ? `· ${dc.company.name}` : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setPairingCard(null)}
                                    className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gray-100 dark:bg-white/10"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    disabled={isPairingSubmitting}
                                    className="px-6 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 text-white shadow-lg"
                                >
                                    {isPairingSubmitting ? 'Appairage...' : 'Valider l\'appairage'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
