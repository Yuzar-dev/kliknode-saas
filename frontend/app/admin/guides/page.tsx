'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import AdminLayout from '@/components/admin/AdminLayout';
import { AdminButton } from '@/components/ui/AdminButton';
import { useAuthStore } from '@/store/auth-store';
import apiClient from '@/lib/api-client';
import toast from 'react-hot-toast';
import { QRCodeSVG } from 'qrcode.react';

interface PhysicalCardItem {
    id: string;
    uid: string;
    sku: string | null;
    batchTag: string | null;
    status: string;
    warehouse: string;
    pairedCard: { firstName: string; lastName: string; publicSlug: string } | null;
    company: { name: string } | null;
}

type GuideTab = 'nfc-tools' | 'stock-architecture' | 'sop-operations';

function generateAutoUid(prefix = '04'): string {
    const bytes = [prefix.toUpperCase()];
    for (let b = 0; b < 6; b++) {
        bytes.push(Math.floor(Math.random() * 256).toString(16).padStart(2, '0').toUpperCase());
    }
    return bytes.join('');
}

export default function AdminGuidesPage() {
    const router = useRouter();
    const pathname = usePathname();
    const { user, logout } = useAuthStore();
    const isOperatorView = pathname?.startsWith('/operator') || (user && user.role !== 'ADMIN');
    const [activeTab, setActiveTab] = useState<GuideTab>('nfc-tools');

    // État du générateur interactif NFC Tools (Guide 3)
    const [cards, setCards] = useState<PhysicalCardItem[]>([]);
    const [loadingCards, setLoadingCards] = useState(false);
    const [selectedUid, setSelectedUid] = useState('');
    const [newCardUid, setNewCardUid] = useState('');
    const [newCardWarehouse, setNewCardWarehouse] = useState<'paris' | 'oujda'>('paris');
    const [creatingCard, setCreatingCard] = useState(false);
    const [baseUrlMode, setBaseUrlMode] = useState<'local' | 'prod' | 'short'>('local');
    const [customBaseUrl, setCustomBaseUrl] = useState('https://app.kliknode.com');

    useEffect(() => {
        fetchCards();
    }, []);

    const fetchCards = async () => {
        setLoadingCards(true);
        try {
            const res = await apiClient.get('/api/operator/cards?limit=100');
            if (res.data?.success) {
                const fetched: PhysicalCardItem[] = res.data.data?.cards || [];
                setCards(fetched);
                if (fetched.length > 0 && !selectedUid) {
                    setSelectedUid(fetched[0].uid);
                }
            }
        } catch (err) {
            console.error('Failed to load cards for guide:', err);
        } finally {
            setLoadingCards(false);
        }
    };

    const handleQuickCreateCard = async () => {
        const targetUid = (newCardUid.trim() || generateAutoUid('04')).replace(/:/g, '').toUpperCase();
        setCreatingCard(true);
        try {
            const res = await apiClient.post('/api/operator/encode', {
                uid: targetUid,
                warehouse: newCardWarehouse,
                status: 'in_stock',
                sku: 'NFC-NTAG213',
            });
            if (res.data?.success) {
                const createdUid = res.data.data.uid;
                toast.success(`Carte ${createdUid} créée et ajoutée au stock !`);
                setNewCardUid('');
                await fetchCards();
                setSelectedUid(createdUid);
            }
        } catch (err: any) {
            toast.error(err.response?.data?.error?.message || 'Erreur lors de la création de la carte');
        } finally {
            setCreatingCard(false);
        }
    };

    const getEffectiveBaseUrl = () => {
        if (baseUrlMode === 'local') {
            return typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3001';
        }
        if (baseUrlMode === 'short') {
            return 'https://k.kliknode.com';
        }
        return customBaseUrl.replace(/\/+$/, '');
    };

    const activeUid = (selectedUid || '04A3B2C1D4E5F6').replace(/:/g, '').toUpperCase();
    const generatedNfcUrl = `${getEffectiveBaseUrl()}/activate/${activeUid}`;
    const urlWithoutHttps = generatedNfcUrl.replace(/^https?:\/\//, '');
    const selectedCardObj = cards.find(c => c.uid === selectedUid);

    const copyToClipboard = (text: string, label = 'Lien NFC copié !') => {
        navigator.clipboard.writeText(text);
        toast.success(label);
    };

    const downloadGuideQrPng = (uidToExport: string) => {
        const svgElement = document.getElementById('guide-qr-svg');
        if (!svgElement) return;
        const canvas = document.createElement('canvas');
        const qrSize = 512;
        canvas.width = qrSize;
        canvas.height = qrSize;

        const xml = new XMLSerializer().serializeToString(svgElement);
        const svgWithXmlns = xml.includes('xmlns=')
            ? xml
            : xml.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
        const svg64 = btoa(unescape(encodeURIComponent(svgWithXmlns)));
        const img = new Image();
        img.onload = () => {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, qrSize, qrSize);
                ctx.drawImage(img, 32, 32, qrSize - 64, qrSize - 64);
                const pngUrl = canvas.toDataURL('image/png');
                const a = document.createElement('a');
                a.href = pngUrl;
                a.download = `QR_KlikNode_${uidToExport}.png`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                toast.success(`QR Code ${uidToExport} téléchargé en PNG`);
            }
        };
        img.src = 'data:image/svg+xml;base64,' + svg64;
    };

    const guidesContent = (
            <div className="flex flex-col gap-8 animate-in fade-in duration-300">
                {/* En-tête de la page */}
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                    <div>
                        <nav className="flex items-center gap-2 text-[10px] font-bold text-apple-secondary uppercase tracking-[0.2em] mb-3">
                            <span className="opacity-40">{isOperatorView ? 'Escale Opérateur' : 'Système & Sécurité'}</span>
                            <span className="opacity-20">/</span>
                            <span className="text-apple-textDark dark:text-white">Centre de Documentation & Guides</span>
                        </nav>
                        <h1 className="text-3xl md:text-4xl font-bold text-apple-textDark dark:text-white tracking-tight">
                            Guides Opérationnels & Encodage NFC
                        </h1>
                        <p className="text-sm text-apple-secondary mt-1.5 font-medium max-w-3xl">
                            Retrouvez vos 3 manuels officiels KlikNode : le workflow d&apos;encodage avec l&apos;application <strong>NFC Tools</strong>, l&apos;architecture complète des stocks et le manuel opérationnel de la commande jusqu&apos;au SAV.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <AdminButton
                            onClick={() => router.push('/operator')}
                            variant="primary"
                            className="px-5 py-2.5 rounded-full flex items-center gap-2 text-xs"
                        >
                            <span className="material-symbols-outlined text-[18px]" translate="no">{isOperatorView ? 'arrow_back' : 'contactless'}</span>
                            {isOperatorView ? 'Retour Escale Opérateur' : 'Ouvrir Escale Opérateur'}
                        </AdminButton>
                        {!isOperatorView && user?.role === 'ADMIN' && (
                            <AdminButton
                                onClick={() => router.push('/admin/inventory')}
                                variant="secondary"
                                className="px-5 py-2.5 rounded-full flex items-center gap-2 text-xs"
                            >
                                <span className="material-symbols-outlined text-[18px]" translate="no">inventory_2</span>
                                Gestion des Stocks
                            </AdminButton>
                        )}
                    </div>
                </div>

                {/* Barre de sélection des 3 Guides */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                        {
                            id: 'nfc-tools' as GuideTab,
                            badge: 'GUIDE N°1 · ATELIER NFC',
                            title: 'Coder une Carte avec NFC Tools',
                            subtitle: 'Workflow : Créer la carte → Générer le lien → Programmer la puce sur NFC Tools',
                            icon: 'tap_and_play',
                            accent: 'text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20',
                        },
                        {
                            id: 'stock-architecture' as GuideTab,
                            badge: 'GUIDE N°2 · LOGISTIQUE & SCHÉMAS',
                            title: 'Architecture & Fonctionnement des Stocks',
                            subtitle: 'Qty Physique, Réservée, Dispo, Tables Supabase et Cas d’usage Paris / Oujda',
                            icon: 'account_tree',
                            accent: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
                        },
                        {
                            id: 'sop-operations' as GuideTab,
                            badge: 'GUIDE N°3 · MANUEL OPÉRATIONNEL (SOP)',
                            title: 'De la Commande jusqu’au SAV',
                            subtitle: 'Parcours réel B2B & B2C : Commande, Préparation, Livraison et 6 cas de SAV',
                            icon: 'menu_book',
                            accent: 'text-purple-600 dark:text-purple-400 bg-purple-500/10 border-purple-500/20',
                        },
                    ].map((tab) => {
                        const isSelected = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setActiveTab(tab.id)}
                                className={`text-left p-6 rounded-[24px] transition-all duration-300 cursor-pointer border ${
                                    isSelected
                                        ? 'klik-glass border-apple-textDark/30 dark:border-white/30 shadow-xl ring-2 ring-apple-textDark/10 dark:ring-white/15 -translate-y-0.5'
                                        : 'klik-glass border-white/50 dark:border-white/5 opacity-75 hover:opacity-100 hover:-translate-y-0.5'
                                }`}
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${tab.accent}`}>
                                        {tab.badge}
                                    </span>
                                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${tab.accent}`}>
                                        <span className="material-symbols-outlined text-[22px]" translate="no">{tab.icon}</span>
                                    </div>
                                </div>
                                <h2 className="text-lg font-bold text-apple-textDark dark:text-white tracking-tight">
                                    {tab.title}
                                </h2>
                                <p className="text-xs text-apple-secondary mt-1 leading-relaxed">
                                    {tab.subtitle}
                                </p>
                            </button>
                        );
                    })}
                </div>

                {/* =====================================================================
                    ONGLET 1 : GUIDE ENCODAGE NFC TOOLS + WORKFLOW INTERACTIF
                   ===================================================================== */}
                {activeTab === 'nfc-tools' && (
                    <div className="flex flex-col gap-8 animate-in fade-in duration-300">
                        {/* Bannière Schéma du Workflow en 4 Étapes */}
                        <div className="klik-glass p-6 md:p-8 rounded-[28px] border border-white/60 dark:border-white/10">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-[22px]" translate="no">route</span>
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-apple-textDark dark:text-white tracking-tight">
                                        Vue d&apos;ensemble du Workflow d&apos;Encodage avec NFC Tools
                                    </h3>
                                    <p className="text-xs text-apple-secondary">
                                        Une carte KlikNode ne contient jamais les coordonnées en dur : elle contient un <strong>lien d&apos;activation unique</strong> (<code>/activate/[UID]</code>) qui s&apos;adapte automatiquement au statut de la carte.
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                {[
                                    {
                                        step: 'ÉTAPE 1',
                                        title: 'Créer la Carte en Base',
                                        desc: 'Créez la carte ci-dessous (ou dans /operator) pour enregistrer son UID de 14 caractères dans votre stock Paris ou Oujda.',
                                        icon: 'add_card',
                                        color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
                                    },
                                    {
                                        step: 'ÉTAPE 2',
                                        title: 'Générer & Copier le Lien',
                                        desc: 'Copiez le lien unique /activate/[UID] généré automatiquement pour cette carte (et téléchargez le QR Code PNG si besoin).',
                                        icon: 'link',
                                        color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
                                    },
                                    {
                                        step: 'ÉTAPE 3',
                                        title: 'Écrire avec NFC Tools',
                                        desc: 'Ouvrez NFC Tools → Écrire → Ajouter un enregistrement → URL / URI → Collez le lien et approchez la carte physique.',
                                        icon: 'tap_and_play',
                                        color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
                                    },
                                    {
                                        step: 'ÉTAPE 4',
                                        title: 'Tester ou Attribuer',
                                        desc: 'Approchez votre téléphone : si la carte est vierge elle ouvre l’inscription, si elle est pairée elle ouvre le profil digital !',
                                        icon: 'verified',
                                        color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
                                    },
                                ].map((item, i) => (
                                    <div key={i} className="p-5 rounded-[20px] bg-white/50 dark:bg-white/5 border border-gray-200/60 dark:border-white/10 flex flex-col justify-between">
                                        <div>
                                            <div className="flex items-center justify-between mb-3">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-apple-secondary">
                                                    {item.step}
                                                </span>
                                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${item.color}`}>
                                                    <span className="material-symbols-outlined text-[18px]" translate="no">{item.icon}</span>
                                                </div>
                                            </div>
                                            <h4 className="font-bold text-sm text-apple-textDark dark:text-white mb-1.5">
                                                {item.title}
                                            </h4>
                                            <p className="text-xs text-apple-secondary leading-relaxed">
                                                {item.desc}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* STUDIO INTERACTIF : CRÉER UNE CARTE & GÉNÉRER LE LIEN POUR NFC TOOLS */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                            {/* Colonne Gauche : Étape 1 (Créer ou choisir la carte) */}
                            <div className="lg:col-span-5 klik-glass p-6 md:p-8 rounded-[28px] border border-white/60 dark:border-white/10 flex flex-col justify-between gap-6">
                                <div className="space-y-5">
                                    <div className="flex items-center justify-between">
                                        <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-widest">
                                            Action Directe · Étape 1
                                        </span>
                                        <button
                                            type="button"
                                            onClick={fetchCards}
                                            className="text-xs font-bold text-apple-secondary hover:text-apple-textDark dark:hover:text-white flex items-center gap-1 cursor-pointer"
                                        >
                                            <span className="material-symbols-outlined text-[15px]" translate="no">refresh</span>
                                            Actualiser ({cards.length})
                                        </button>
                                    </div>

                                    <div>
                                        <h3 className="text-xl font-bold text-apple-textDark dark:text-white tracking-tight">
                                            1. Choisir ou Créer la Carte à Coder
                                        </h3>
                                        <p className="text-xs text-apple-secondary mt-1">
                                            Sélectionnez une carte déjà en stock ou créez-en une nouvelle en 1 clic pour obtenir immédiatement son lien NFC Tools.
                                        </p>
                                    </div>

                                    {/* Option A : Sélectionner une carte existante */}
                                    <div className="p-4 rounded-2xl bg-white/60 dark:bg-white/5 border border-gray-200/70 dark:border-white/10 space-y-2.5">
                                        <label className="block text-[11px] font-black uppercase tracking-widest text-apple-secondary">
                                            A. Choisir une carte existante dans votre stock
                                        </label>
                                        <select
                                            value={selectedUid}
                                            onChange={(e) => setSelectedUid(e.target.value)}
                                            disabled={loadingCards}
                                            className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1C1C1E] px-3.5 py-3 text-xs font-mono font-bold text-apple-textDark dark:text-white focus:outline-none"
                                        >
                                            {cards.length === 0 ? (
                                                <option value="">-- Aucune carte en stock (créez-en une ci-dessous) --</option>
                                            ) : (
                                                cards.map((c) => (
                                                    <option key={c.id} value={c.uid}>
                                                        {c.uid} · {c.warehouse === 'oujda' ? 'Oujda' : 'Paris'} ·{' '}
                                                        {c.status === 'in_stock'
                                                            ? 'Vierge (En stock)'
                                                            : c.status === 'reserved'
                                                            ? `Réservée (${c.company?.name || 'B2B'})`
                                                            : c.status === 'paired'
                                                            ? `Pairée (${c.pairedCard?.firstName || ''} ${c.pairedCard?.lastName || ''})`
                                                            : 'Perdue'}
                                                    </option>
                                                ))
                                            )}
                                        </select>
                                        {selectedCardObj && (
                                            <div className="flex items-center justify-between text-[11px] pt-1 text-apple-secondary font-medium">
                                                <span>Entrepôt : <strong className="text-apple-textDark dark:text-white">{selectedCardObj.warehouse === 'oujda' ? 'Oujda Port' : 'Paris Sud'}</strong></span>
                                                <span>Statut : <strong className="text-apple-textDark dark:text-white">{selectedCardObj.status}</strong></span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Séparateur */}
                                    <div className="flex items-center gap-3">
                                        <div className="h-px bg-gray-200 dark:bg-white/10 flex-1" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-apple-secondary">OU</span>
                                        <div className="h-px bg-gray-200 dark:bg-white/10 flex-1" />
                                    </div>

                                    {/* Option B : Créer une nouvelle carte à la volée */}
                                    <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/20 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <label className="text-[11px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400">
                                                B. Créer une nouvelle carte au stock
                                            </label>
                                            <button
                                                type="button"
                                                onClick={() => setNewCardUid(generateAutoUid('04'))}
                                                className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                                            >
                                                <span className="material-symbols-outlined text-[13px]" translate="no">autorenew</span>
                                                Générer UID
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                            <input
                                                type="text"
                                                value={newCardUid}
                                                onChange={(e) => setNewCardUid(e.target.value)}
                                                placeholder="UID (vide = auto 04...)"
                                                className="sm:col-span-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1C1C1E] px-3.5 py-2.5 text-xs font-mono font-bold text-apple-textDark dark:text-white focus:outline-none"
                                            />
                                            <select
                                                value={newCardWarehouse}
                                                onChange={(e) => setNewCardWarehouse(e.target.value as 'paris' | 'oujda')}
                                                className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1C1C1E] px-3 py-2.5 text-xs font-bold text-apple-textDark dark:text-white focus:outline-none"
                                            >
                                                <option value="paris">Paris Sud</option>
                                                <option value="oujda">Oujda Port</option>
                                            </select>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={handleQuickCreateCard}
                                            disabled={creatingCard}
                                            className="w-full py-3 rounded-full btn-titanium btn-titanium-primary text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
                                        >
                                            <span className="material-symbols-outlined text-[16px]" translate="no">add_circle</span>
                                            {creatingCard ? 'Création en cours...' : 'Créer la carte & Générer son lien'}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Colonne Droite : Étape 2 (Lien généré prêt à copier dans NFC Tools + QR Code) */}
                            <div className="lg:col-span-7 klik-glass p-6 md:p-8 rounded-[28px] border border-white/60 dark:border-white/10 flex flex-col justify-between gap-6">
                                <div className="space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-widest">
                                            Action Directe · Étape 2
                                        </span>
                                        <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-white/5 p-1 rounded-full border border-gray-200/60 dark:border-white/10">
                                            {[
                                                { id: 'local', label: 'Test Local (localhost)' },
                                                { id: 'prod', label: 'Production (app.kliknode.com)' },
                                                { id: 'short', label: 'Court (k.kliknode.com)' },
                                            ].map((m) => (
                                                <button
                                                    key={m.id}
                                                    type="button"
                                                    onClick={() => setBaseUrlMode(m.id as any)}
                                                    className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
                                                        baseUrlMode === m.id
                                                            ? 'bg-white dark:bg-[#1C1C1E] text-apple-textDark dark:text-white shadow-sm'
                                                            : 'text-apple-secondary hover:text-apple-textDark dark:hover:text-white'
                                                    }`}
                                                >
                                                    {m.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-xl font-bold text-apple-textDark dark:text-white tracking-tight">
                                            2. Votre Lien Prêt à Copier dans NFC Tools
                                        </h3>
                                        <p className="text-xs text-apple-secondary mt-1">
                                            C&apos;est ce lien exact qu&apos;il faut écrire en tant qu&apos;enregistrement <strong>URL / URI</strong> sur votre puce NFC avec l&apos;application <strong>NFC Tools</strong>.
                                        </p>
                                    </div>

                                    {baseUrlMode === 'prod' && (
                                        <div className="flex items-center gap-3">
                                            <span className="text-[11px] font-bold text-apple-secondary whitespace-nowrap">Domaine :</span>
                                            <input
                                                type="text"
                                                value={customBaseUrl}
                                                onChange={(e) => setCustomBaseUrl(e.target.value)}
                                                className="flex-1 rounded-xl border border-gray-200 dark:border-white/10 bg-white/60 dark:bg-white/5 px-3.5 py-2 text-xs font-mono font-bold text-apple-textDark dark:text-white focus:outline-none"
                                            />
                                        </div>
                                    )}

                                    {/* Boîte du lien complet */}
                                    <div className="p-5 rounded-2xl bg-slate-900 text-white border border-slate-700 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 flex items-center gap-1.5">
                                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                                URL Complète d&apos;Activation (Carte {activeUid})
                                            </span>
                                            <span className="text-[10px] font-mono text-slate-400">
                                                { generatedNfcUrl.length } octets
                                            </span>
                                        </div>

                                        <div className="p-3.5 rounded-xl bg-black/50 border border-white/10 font-mono text-xs md:text-sm text-emerald-300 break-all select-all">
                                            {generatedNfcUrl}
                                        </div>

                                        <div className="flex flex-wrap gap-2.5">
                                            <button
                                                type="button"
                                                onClick={() => copyToClipboard(generatedNfcUrl, 'URL complète copiée !')}
                                                className="flex-1 min-w-[180px] py-2.5 px-4 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                                            >
                                                <span className="material-symbols-outlined text-[17px]" translate="no">content_copy</span>
                                                Copier l&apos;URL complète
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => copyToClipboard(urlWithoutHttps, 'Lien sans https:// copié (idéal pour NFC Tools) !')}
                                                className="py-2.5 px-4 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                                                title="Dans NFC Tools, si vous choisissez le préfixe https:// dans la liste, collez cette version sans https:// pour éviter https://https://"
                                            >
                                                <span className="material-symbols-outlined text-[16px]" translate="no">link</span>
                                                Copier sans &quot;https://&quot;
                                            </button>

                                            <a
                                                href={generatedNfcUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="py-2.5 px-4 rounded-full bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/30 text-blue-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                                            >
                                                <span className="material-symbols-outlined text-[16px]" translate="no">open_in_new</span>
                                                Tester le lien
                                            </a>
                                        </div>
                                    </div>

                                    {/* QR Code associé */}
                                    <div className="p-4 rounded-2xl bg-white/60 dark:bg-white/5 border border-gray-200/70 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className="p-2.5 bg-white rounded-2xl shadow-sm border border-gray-100 shrink-0">
                                                <QRCodeSVG
                                                    id="guide-qr-svg"
                                                    value={generatedNfcUrl}
                                                    size={68}
                                                    level="M"
                                                    includeMargin={false}
                                                />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-bold text-apple-textDark dark:text-white">
                                                    QR Code Imprimable (Secours sans NFC)
                                                </h4>
                                                <p className="text-xs text-apple-secondary mt-0.5">
                                                    Ce QR Code pointe exactement vers le même lien <code>/activate/{activeUid}</code> pour les téléphones anciens.
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => downloadGuideQrPng(activeUid)}
                                            className="px-4 py-2.5 rounded-full btn-titanium btn-titanium-primary text-xs font-bold flex items-center gap-2 shrink-0 cursor-pointer"
                                        >
                                            <span className="material-symbols-outlined text-[16px]" translate="no">download</span>
                                            Télécharger PNG
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* TUTORIEL ÉCRAN PAR ÉCRAN DANS L'APPLICATION NFC TOOLS */}
                        <div className="klik-glass p-6 md:p-8 rounded-[28px] border border-white/60 dark:border-white/10 space-y-6">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200/60 dark:border-white/10 pb-5">
                                <div>
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400">
                                        TUTORIEL PAS-À-PAS · APPLICATION MOBILE & PC
                                    </span>
                                    <h3 className="text-2xl font-bold text-apple-textDark dark:text-white tracking-tight mt-1">
                                        3. Comment écrire le lien sur la carte avec l&apos;application NFC Tools
                                    </h3>
                                </div>
                                <span className="px-3.5 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-500/20">
                                    Compatible NTAG213 · NTAG215 · NTAG216
                                </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {[
                                    {
                                        num: '1',
                                        screen: 'Onglet « Écrire » (Write)',
                                        action: 'Ouvrez NFC Tools sur votre téléphone',
                                        details: 'Au lancement de NFC Tools, vous êtes sur l’onglet « Lire ». Appuyez sur le 2ème onglet en haut appelé « Écrire » (Write).',
                                        tip: 'Si vous aviez déjà d’anciens enregistrements dans la liste, supprimez-les pour n’avoir qu’une seule ligne.',
                                    },
                                    {
                                        num: '2',
                                        screen: '« Ajouter un enregistrement »',
                                        action: 'Appuyez sur le bouton Ajouter un enregistrement',
                                        details: 'Une liste de formats s’affiche (Texte, URL/URI, URL personnalisée, Réseaux sociaux, Contact...).',
                                        tip: 'N’utilisez JAMAIS « Contact (vCard) » en dur, sinon le client ne pourra plus modifier sa fiche en ligne !',
                                    },
                                    {
                                        num: '3',
                                        screen: 'Choisir « URL / URI » ou « URL personnalisée »',
                                        action: 'Collez votre lien /activate/[UID]',
                                        details: '• Si vous choisissez « URL personnalisée » : collez l’URL complète (avec https://).\n• Si vous choisissez « URL / URI » (où https:// est déjà sélectionné) : collez la version sans https://.',
                                        tip: 'Vérifiez bien sur l’aperçu qu’il est écrit https://.../activate/04... et non pas https://https://...',
                                    },
                                    {
                                        num: '4',
                                        screen: 'Valider sur « OK » puis « Écrire / XX Octets »',
                                        action: 'Lancez l’écriture sur la puce',
                                        details: 'De retour sur l’écran Écrire, vous voyez votre ligne URI (~42 octets). Appuyez sur « Écrire / 42 Octets ».',
                                        tip: 'Une puce NTAG213 dispose de 144 octets : le lien KlikNode (42 octets) rentre très largement !',
                                    },
                                    {
                                        num: '5',
                                        screen: 'Approcher la carte NFC du téléphone',
                                        action: 'Maintenez la carte 1 seconde contre le capteur',
                                        details: '• Sur iPhone : collez la carte contre le bord supérieur arrière (à côté de la caméra).\n• Sur Android : collez la carte au milieu du dos du téléphone.',
                                        tip: 'Attendez le bip et la coche verte « Écriture terminée ! » avant de retirer la carte.',
                                    },
                                    {
                                        num: '6',
                                        screen: 'Optionnel : Protéger par mot de passe',
                                        action: 'Empêcher un tiers d’écraser la carte',
                                        details: 'Allez dans l’onglet « Autres » (Other) → « Définir un mot de passe » (Set password) et choisissez votre code secret KlikNode.',
                                        tip: '⚠️ NE CLIQUEZ PAS sur « Verrouiller la puce » (Lock tag) : le verrouillage rend la puce non-modifiable à vie !',
                                    },
                                ].map((step) => (
                                    <div key={step.num} className="p-6 rounded-[24px] bg-white/60 dark:bg-white/5 border border-gray-200/70 dark:border-white/10 flex flex-col justify-between gap-4">
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-apple-textDark dark:bg-white text-white dark:text-black font-black text-sm flex items-center justify-center shrink-0">
                                                    {step.num}
                                                </div>
                                                <div>
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 block">
                                                        {step.screen}
                                                    </span>
                                                    <h4 className="font-bold text-sm text-apple-textDark dark:text-white">
                                                        {step.action}
                                                    </h4>
                                                </div>
                                            </div>
                                            <p className="text-xs text-apple-secondary whitespace-pre-line leading-relaxed">
                                                {step.details}
                                            </p>
                                        </div>
                                        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-800 dark:text-amber-300 font-medium">
                                            💡 <strong>Astuce :</strong> {step.tip}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* POURQUOI ON ÉCRIT /activate/[UID] : LES 4 ÉTATS AUTOMATIQUES */}
                        <div className="klik-glass p-6 md:p-8 rounded-[28px] border border-white/60 dark:border-white/10 space-y-6">
                            <div>
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-600 dark:text-purple-400">
                                    INTELLIGENCE DU LIEN DYNAMIQUE KLIKNODE
                                </span>
                                <h3 className="text-2xl font-bold text-apple-textDark dark:text-white tracking-tight mt-1">
                                    4. Que se passe-t-il quand on scanne la carte selon son statut ?
                                </h3>
                                <p className="text-xs text-apple-secondary mt-1">
                                    Vous n&apos;encodez la carte avec NFC Tools <strong>qu&apos;une seule fois dans sa vie</strong>. Ensuite, tout se pilote à distance depuis KlikNode :
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {[
                                    {
                                        status: 'En Stock (Vierge)',
                                        code: 'in_stock',
                                        badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
                                        redirect: '/signup?card_id=[UID]',
                                        behavior: 'Le client particulier (B2C) scanne sa nouvelle carte : elle ouvre automatiquement la page de création de compte et s’associe toute seule à son profil !',
                                    },
                                    {
                                        status: 'Réservée B2B',
                                        code: 'reserved',
                                        badgeClass: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
                                        redirect: '/join/employee?card_id=[UID]&company_id=...',
                                        behavior: 'La carte a été assignée à une entreprise dans /operator : l’employé qui la scanne rejoint directement l’espace de son entreprise !',
                                    },
                                    {
                                        status: 'Pairée (Active)',
                                        code: 'paired',
                                        badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
                                        redirect: '/p/[publicSlug]',
                                        behavior: 'La carte est associée à un utilisateur : chaque scan ouvre instantanément sa carte de visite digitale et ajoute +1 au compteur de scans !',
                                    },
                                    {
                                        status: 'Perdue (Bloquée)',
                                        code: 'lost',
                                        badgeClass: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
                                        redirect: 'Écran de sécurité « Carte bloquée »',
                                        behavior: 'Si le client perd sa carte, passez-la en « Perdue » sur /operator : ses coordonnées sont immédiatement protégées.',
                                    },
                                ].map((item) => (
                                    <div key={item.code} className="p-5 rounded-[22px] bg-white/60 dark:bg-white/5 border border-gray-200/70 dark:border-white/10 flex flex-col justify-between gap-4">
                                        <div className="space-y-3">
                                            <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${item.badgeClass}`}>
                                                {item.status}
                                            </span>
                                            <div className="p-2.5 rounded-xl bg-black/5 dark:bg-black/40 font-mono text-[11px] font-bold text-apple-textDark dark:text-white break-all">
                                                → {item.redirect}
                                            </div>
                                            <p className="text-xs text-apple-secondary leading-relaxed">
                                                {item.behavior}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* =====================================================================
                    ONGLET 2 : GUIDE 1 — ARCHITECTURE & FONCTIONNEMENT DES STOCKS
                   ===================================================================== */}
                {activeTab === 'stock-architecture' && (
                    <div className="flex flex-col gap-8 animate-in fade-in duration-300">
                        {/* Formule Mathématique et Explication des 3 Quantités */}
                        <div className="klik-glass p-6 md:p-8 rounded-[28px] border border-white/60 dark:border-white/10 space-y-6">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div>
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400">
                                        LA RÈGLE D&apos;OR DU STOCK KLIKNODE
                                    </span>
                                    <h3 className="text-2xl font-bold text-apple-textDark dark:text-white tracking-tight mt-1">
                                        1. Comprendre Qty Physique, Qty Réservée et Qty Disponible
                                    </h3>
                                </div>
                                <div className="px-5 py-3 rounded-2xl bg-slate-900 text-white font-mono text-xs md:text-sm font-bold border border-slate-700">
                                    Qty Disponible = Qty Physique − Qty Réservée
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="p-6 rounded-[24px] bg-blue-500/5 border border-blue-500/20 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-widest">
                                            1. Qty Physique
                                        </span>
                                        <span className="material-symbols-outlined text-blue-500" translate="no">credit_card</span>
                                    </div>
                                    <h4 className="text-lg font-bold text-apple-textDark dark:text-white">
                                        Total des Cartes Existantes
                                    </h4>
                                    <p className="text-xs text-apple-secondary leading-relaxed">
                                        C&apos;est le <strong>total exact de toutes les cartes créées</strong> dans cet entrepôt (Vierges + Réservées B2B + Pairées). Ce chiffre est strictement identique au total affiché sur <code>/operator</code>.
                                    </p>
                                    <div className="pt-2 border-t border-blue-500/10 text-[11px] text-apple-secondary space-y-1">
                                        <p>📈 <strong>Augmente quand :</strong> vous générez un lot, encodez 1 carte ou augmentez le stock.</p>
                                        <p>📉 <strong>Diminue quand :</strong> vous supprimez une carte/lot ou transférez vers l&apos;autre entrepôt.</p>
                                    </div>
                                </div>

                                <div className="p-6 rounded-[24px] bg-indigo-500/5 border border-indigo-500/20 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-widest">
                                            2. Qty Réservée & Pairée
                                        </span>
                                        <span className="material-symbols-outlined text-indigo-500" translate="no">business_center</span>
                                    </div>
                                    <h4 className="text-lg font-bold text-apple-textDark dark:text-white">
                                        Cartes Engagées (B2B + Actives)
                                    </h4>
                                    <p className="text-xs text-apple-secondary leading-relaxed">
                                        Toutes les cartes qui <strong>ne sont plus libres</strong> parce qu&apos;elles ont été attribuées à une entreprise B2B (statut <code>reserved</code>) ou déjà associées à un profil utilisateur (statut <code>paired</code>).
                                    </p>
                                    <div className="pt-2 border-t border-indigo-500/10 text-[11px] text-apple-secondary space-y-1">
                                        <p>📈 <strong>Augmente quand :</strong> vous faites une <em>Assignation B2B</em> ou un <em>Appairage</em> sur <code>/operator</code>.</p>
                                        <p>📉 <strong>Diminue quand :</strong> vous remettez une carte en statut <em>En Stock (Vierge)</em>.</p>
                                    </div>
                                </div>

                                <div className="p-6 rounded-[24px] bg-emerald-500/5 border border-emerald-500/20 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-widest">
                                            3. Qty Disponible (Dispo)
                                        </span>
                                        <span className="material-symbols-outlined text-emerald-500" translate="no">inventory_2</span>
                                    </div>
                                    <h4 className="text-lg font-bold text-apple-textDark dark:text-white">
                                        Cartes 100% Vierges Libres
                                    </h4>
                                    <p className="text-xs text-apple-secondary leading-relaxed">
                                        Vos cartes <strong>vierges en tiroir</strong> (statut <code>in_stock</code>), prêtes immédiatement pour une nouvelle commande B2B ou un nouveau client B2C.
                                    </p>
                                    <div className="pt-2 border-t border-emerald-500/10 text-[11px] text-apple-secondary space-y-1">
                                        <p>✅ <strong>Égal à :</strong> <code>En Stock (Vierges)</code> sur la page Opérateur.</p>
                                        <p>🔄 <strong>Transférable :</strong> seules les cartes disponibles peuvent être transférées entre Paris et Oujda.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Les 3 Tables Supabase et Comment les 4 Pages Communiquent */}
                        <div className="klik-glass p-6 md:p-8 rounded-[28px] border border-white/60 dark:border-white/10 space-y-6">
                            <div>
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400">
                                    BASE DE DONNÉES SUPABASE (POSTGRESQL)
                                </span>
                                <h3 className="text-2xl font-bold text-apple-textDark dark:text-white tracking-tight mt-1">
                                    2. Où tout est stocké et qui lit quoi ?
                                </h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {[
                                    {
                                        table: 'Table 1 : physical_cards',
                                        role: 'La vérité terrain carte par carte',
                                        desc: 'Chaque ligne = 1 vraie carte NFC avec son numéro unique UID (14 caractères), son modèle (SKU), son lot (batch_tag), son entrepôt (paris / oujda) et son statut (in_stock, reserved, paired, lost).',
                                        pages: 'Lue par /operator et /admin/batch-generator',
                                    },
                                    {
                                        table: 'Table 2 : inventory',
                                        role: 'La synthèse comptable par entrepôt',
                                        desc: 'Contient les totaux calculés automatiquement par stock-sync.service.ts pour chaque modèle de carte dans chaque entrepôt (Paris Sud et Oujda Port).',
                                        pages: 'Lue par /admin/inventory (Gestion des Stocks)',
                                    },
                                    {
                                        table: 'Table 3 : hardware_orders',
                                        role: 'Le carnet de commandes clients B2B',
                                        desc: 'Chaque ligne = 1 bon de commande passé par une entreprise (quantité commandée, statut À préparer / Expédié / Livré, numéro de suivi). Indique à l’opérateur combien de cartes il reste à attribuer !',
                                        pages: 'Lue par /admin/hardware-orders et /operator (Bloc 3)',
                                    },
                                ].map((t) => (
                                    <div key={t.table} className="p-6 rounded-[24px] bg-white/60 dark:bg-white/5 border border-gray-200/70 dark:border-white/10 flex flex-col justify-between gap-4">
                                        <div className="space-y-2">
                                            <span className="font-mono text-xs font-black text-blue-600 dark:text-blue-400">
                                                {t.table}
                                            </span>
                                            <h4 className="font-bold text-base text-apple-textDark dark:text-white">
                                                {t.role}
                                            </h4>
                                            <p className="text-xs text-apple-secondary leading-relaxed">
                                                {t.desc}
                                            </p>
                                        </div>
                                        <div className="px-3 py-2 rounded-xl bg-black/5 dark:bg-white/5 text-[11px] font-bold text-apple-textDark dark:text-white">
                                            🔗 {t.pages}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Matrice de Décision : Quelle interface utiliser selon le besoin */}
                        <div className="klik-glass p-6 md:p-8 rounded-[28px] border border-white/60 dark:border-white/10 space-y-6">
                            <div>
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-600 dark:text-purple-400">
                                    MATRICE DE DÉCISION RAPIDE
                                </span>
                                <h3 className="text-2xl font-bold text-apple-textDark dark:text-white tracking-tight mt-1">
                                    3. Quelle page utiliser selon votre situation ?
                                </h3>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-gray-200 dark:border-white/10 text-[10px] font-black uppercase tracking-widest text-apple-secondary">
                                            <th className="py-3.5 px-4">Situation / Besoin</th>
                                            <th className="py-3.5 px-4">Interface à ouvrir</th>
                                            <th className="py-3.5 px-4">Action à réaliser</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200/50 dark:divide-white/5 text-xs">
                                        {[
                                            {
                                                need: '📦 Vous recevez un carton de 100 ou 500 cartes vierges du fournisseur',
                                                page: 'Admin > Générateur de Lots (/admin/batch-generator)',
                                                action: 'Saisir Quantité + Nom du lot + Entrepôt (Paris ou Oujda) → Generate Batch puis télécharger le CSV.',
                                            },
                                            {
                                                need: '👤 Votre associé a un particulier qui veut 1 seule carte (B2C)',
                                                page: 'Escale Opérateur (/operator) ou ce Guide (Onglet 1)',
                                                action: 'Prendre 1 carte vierge en stock (ou en créer 1) → Copier son Lien NFC → L’écrire avec NFC Tools → Donner la carte au client.',
                                            },
                                            {
                                                need: '🏢 Un client en France commande 3 cartes pour son entreprise (B2B)',
                                                page: '1. Admin > Commandes Hardware\n2. Escale Opérateur (/operator)',
                                                action: '1. Créer la commande de 3 cartes pour l’entreprise.\n2. Sur /operator (Bloc 3 Assignation B2B), sélectionner l’entreprise (propose 3 automatiquement) et cliquer Assigner.',
                                            },
                                            {
                                                need: '✈️ Vous envoyez 30 cartes vierges de Paris vers Oujda',
                                                page: 'Admin > Gestion des Stocks (/admin/inventory)',
                                                action: 'Cliquer sur « Transfert Inter-Entrepôts » → De Paris Sud vers Oujda Port (Quantité : 30).',
                                            },
                                            {
                                                need: '🧮 Vous recomptez votre tiroir et voulez corriger le stock total',
                                                page: 'Admin > Gestion des Stocks (/admin/inventory)',
                                                action: 'Cliquer sur « Ajuster Stock » (ou l’icône crayon sur la ligne) et saisir la nouvelle quantité physique réelle.',
                                            },
                                        ].map((row, i) => (
                                            <tr key={i} className="hover:bg-white/40 dark:hover:bg-white/5 transition-colors">
                                                <td className="py-4 px-4 font-bold text-apple-textDark dark:text-white">{row.need}</td>
                                                <td className="py-4 px-4 font-mono text-[11px] text-blue-600 dark:text-blue-400 whitespace-pre-line">{row.page}</td>
                                                <td className="py-4 px-4 text-apple-secondary whitespace-pre-line">{row.action}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* =====================================================================
                    ONGLET 3 : GUIDE 2 — MANUEL OPÉRATIONNEL DE LA COMMANDE AU SAV
                   ===================================================================== */}
                {activeTab === 'sop-operations' && (
                    <div className="flex flex-col gap-8 animate-in fade-in duration-300">
                        {/* Les 4 Phases d'une Commande Client */}
                        <div className="klik-glass p-6 md:p-8 rounded-[28px] border border-white/60 dark:border-white/10 space-y-6">
                            <div>
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-600 dark:text-purple-400">
                                    PROCÉDURE OPÉRATIONNELLE STANDARD (SOP)
                                </span>
                                <h3 className="text-2xl font-bold text-apple-textDark dark:text-white tracking-tight mt-1">
                                    Du Premier Contact Client jusqu&apos;à la Livraison
                                </h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Scénario A : Client Entreprise B2B */}
                                <div className="p-6 rounded-[24px] bg-blue-500/5 border border-blue-500/20 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-widest">
                                            Scénario A · Client Entreprise (B2B)
                                        </span>
                                        <span className="text-xs font-bold text-apple-secondary">Ex: 3 cartes en France</span>
                                    </div>
                                    <h4 className="text-lg font-bold text-apple-textDark dark:text-white">
                                        Parcours Complet d&apos;une Commande Entreprise
                                    </h4>
                                    <ol className="space-y-3 text-xs text-apple-secondary">
                                        <li className="flex gap-3">
                                            <span className="font-black text-blue-600 dark:text-blue-400">1.</span>
                                            <span><strong>Créer l&apos;entreprise :</strong> Allez dans <code>/admin/companies/new</code> (Onboarding) pour créer la société et son Manager.</span>
                                        </li>
                                        <li className="flex gap-3">
                                            <span className="font-black text-blue-600 dark:text-blue-400">2.</span>
                                            <span><strong>Activer son abonnement :</strong> Dans <code>/admin/plans</code> (onglet B2B), attribuez-lui son forfait (ex: Business).</span>
                                        </li>
                                        <li className="flex gap-3">
                                            <span className="font-black text-blue-600 dark:text-blue-400">3.</span>
                                            <span><strong>Enregistrer la commande :</strong> Dans <code>/admin/hardware-orders</code>, cliquez sur <strong>Créer</strong> (Quantité : 3, Entrepôt : Paris Sud).</span>
                                        </li>
                                        <li className="flex gap-3">
                                            <span className="font-black text-blue-600 dark:text-blue-400">4.</span>
                                            <span><strong>Attribuer & Coder les 3 cartes :</strong> Sur <code>/operator</code> → <strong>Bloc 3 (Assignation B2B)</strong>, choisissez l&apos;entreprise (le chiffre <code>3</code> se pré-remplit tout seul) et cliquez <strong>Assigner</strong>. Écrivez le lien NFC de chaque carte avec <strong>NFC Tools</strong>.</span>
                                        </li>
                                        <li className="flex gap-3">
                                            <span className="font-black text-blue-600 dark:text-blue-400">5.</span>
                                            <span><strong>Expédier :</strong> Dans <code>/admin/hardware-orders</code>, imprimez le bon de livraison (🖨️), puis passez la commande en <strong>Expédié</strong> avec le numéro de suivi.</span>
                                        </li>
                                    </ol>
                                </div>

                                {/* Scénario B : Client Particulier B2C */}
                                <div className="p-6 rounded-[24px] bg-emerald-500/5 border border-emerald-500/20 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-widest">
                                            Scénario B · Client Particulier (B2C)
                                        </span>
                                        <span className="text-xs font-bold text-apple-secondary">Ex: 1 carte en direct</span>
                                    </div>
                                    <h4 className="text-lg font-bold text-apple-textDark dark:text-white">
                                        Parcours Complet d&apos;une Carte Individuelle
                                    </h4>
                                    <ol className="space-y-3 text-xs text-apple-secondary">
                                        <li className="flex gap-3">
                                            <span className="font-black text-emerald-600 dark:text-emerald-400">1.</span>
                                            <span><strong>Prendre 1 carte vierge :</strong> Sur <code>/operator</code> (ou l&apos;onglet 1 de ce guide), prenez une carte en statut <code>En Stock (Vierge)</code> de votre entrepôt.</span>
                                        </li>
                                        <li className="flex gap-3">
                                            <span className="font-black text-emerald-600 dark:text-emerald-400">2.</span>
                                            <span><strong>Coder avec NFC Tools :</strong> Copiez son lien <code>/activate/[UID]</code> et écrivez-le sur la puce avec l&apos;application <strong>NFC Tools</strong>.</span>
                                        </li>
                                        <li className="flex gap-3">
                                            <span className="font-black text-emerald-600 dark:text-emerald-400">3.</span>
                                            <span><strong>Deux modes de remise au choix :</strong>
                                                <br />• <em>Mode Libre-Service :</em> Donnez la carte vierge au client. Dès qu&apos;il la scanne avec son téléphone, il crée son profil tout seul !
                                                <br />• <em>Mode Clé-en-main VIP :</em> Sur <code>/operator</code>, cliquez sur <code>Options → Associer à un Profil</code> pour relier la carte à son compte avant de lui remettre.
                                            </span>
                                        </li>
                                        <li className="flex gap-3">
                                            <span className="font-black text-emerald-600 dark:text-emerald-400">4.</span>
                                            <span><strong>Activer l&apos;offre Pro B2C (si souscrite) :</strong> Allez dans <code>/admin/plans</code> → onglet <strong>Particuliers (B2C)</strong> → <strong>Attribuer à un Utilisateur</strong>.</span>
                                        </li>
                                    </ol>
                                </div>
                            </div>
                        </div>

                        {/* Les 6 Cas d'Intervention SAV Après Livraison */}
                        <div className="klik-glass p-6 md:p-8 rounded-[28px] border border-white/60 dark:border-white/10 space-y-6">
                            <div>
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-600 dark:text-rose-400">
                                    GESTION APRÈS-VENTE (SAV EN 30 SECONDES)
                                </span>
                                <h3 className="text-2xl font-bold text-apple-textDark dark:text-white tracking-tight mt-1">
                                    Les 6 Cas d&apos;Intervention Après la Livraison
                                </h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                {[
                                    {
                                        title: '1. Carte Perdue, Volée ou Cassée',
                                        badge: 'Sécurité Immédiate',
                                        steps: [
                                            'Allez sur /operator et cherchez l’ancienne carte du client.',
                                            'Cliquez sur Options → Passer en : Perdue (bloque immédiatement la carte trouvée dans la rue).',
                                            'Prenez une nouvelle carte vierge et cliquez Options → Associer à un Profil sur le même client : il conserve son profil et toutes ses stats !',
                                        ],
                                    },
                                    {
                                        title: '2. Un Employé Quitte l’Entreprise',
                                        badge: 'Réutilisation 0€',
                                        steps: [
                                            'Si l’entreprise a récupéré la carte physique : aucune nouvelle carte à encoder !',
                                            'Dans /company/employees, modifiez simplement le Prénom, Nom et Email sur la fiche de l’employé.',
                                            'Si l’employé est parti avec la carte : passez l’ancienne en Perdue sur /operator et associez une nouvelle carte.',
                                        ],
                                    },
                                    {
                                        title: '3. Aide à la Configuration / Branding',
                                        badge: 'Impersonation',
                                        steps: [
                                            'Allez dans Admin > Entreprises (/admin/companies) et cliquez sur l’entreprise.',
                                            'Cliquez en haut à droite sur « Se connecter en tant que (Impersonate) ».',
                                            'Configurez directement son logo et ses couleurs dans /company/branding sans lui demander son mot de passe.',
                                        ],
                                    },
                                    {
                                        title: '4. Réassort (Commande de Cartes en +)',
                                        badge: 'Croissance B2B',
                                        steps: [
                                            'Vérifiez le plafond de licences de l’entreprise dans /admin/plans.',
                                            'Créez la nouvelle commande dans /admin/hardware-orders (ex: +5 cartes).',
                                            'Allez sur /operator → Bloc 3 : sélectionnez l’entreprise (affiche « Reste : 5 ») et cliquez Assigner.',
                                        ],
                                    },
                                    {
                                        title: '5. Upgrade vers Pro ou Suspension',
                                        badge: 'Abonnements',
                                        steps: [
                                            'Pour passer un particulier en Pro : /admin/plans → onglet Particuliers (B2C) → Attribuer à un Utilisateur.',
                                            'En cas d’impayé B2B : /admin/companies/[id] → bouton « Suspendre l’entreprise ».',
                                            'Pour rembourser une facture : /admin/transactions → icône Rembourser.',
                                        ],
                                    },
                                    {
                                        title: '6. Mot de Passe Oublié / Accès',
                                        badge: 'Support Compte',
                                        steps: [
                                            'Pour un Manager B2B : dans /admin/companies/[id], cliquez sur « Renvoyer l’invitation ».',
                                            'Pour un employé : dans /company/employees, cliquez sur l’icône Clé (🔑) pour définir un nouveau mot de passe temporaire.',
                                        ],
                                    },
                                ].map((sav, idx) => (
                                    <div key={idx} className="p-6 rounded-[24px] bg-white/60 dark:bg-white/5 border border-gray-200/70 dark:border-white/10 flex flex-col justify-between gap-4">
                                        <div className="space-y-3">
                                            <span className="px-2.5 py-1 rounded-full bg-black/5 dark:bg-white/10 text-[10px] font-black uppercase tracking-widest text-apple-secondary">
                                                {sav.badge}
                                            </span>
                                            <h4 className="font-bold text-base text-apple-textDark dark:text-white">
                                                {sav.title}
                                            </h4>
                                            <ul className="space-y-2 text-xs text-apple-secondary">
                                                {sav.steps.map((s, i) => (
                                                    <li key={i} className="flex gap-2 leading-relaxed">
                                                        <span className="text-blue-500 font-bold">•</span>
                                                        <span>{s}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
    );

    if (isOperatorView) {
        return (
            <div className="min-h-screen bg-[#F5F5F7] dark:bg-black font-display text-apple-textDark dark:text-white">
                <header className="sticky top-0 z-30 px-8 h-20 flex items-center justify-between backdrop-blur-3xl bg-white/60 dark:bg-black/40 border-b border-white/60 dark:border-white/5 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center">
                            <img src="/logo-icon-black.svg" alt="KlikNode" className="h-[32px] w-auto dark:hidden shrink-0" />
                            <img src="/logo-icon-white.svg" alt="KlikNode" className="h-[32px] w-auto hidden dark:block shrink-0" />
                        </div>
                        <div className="flex flex-col justify-center">
                            <span className="font-black text-[22px] tracking-tight leading-[0.9] text-apple-textDark dark:text-white">KlikNode</span>
                            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-gray-400 mt-1 leading-none">Escale Opérateur · Guides &amp; NFC Tools</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.push('/operator')}
                            className="px-4 py-2 rounded-full text-xs font-bold bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 transition-all flex items-center gap-2 cursor-pointer"
                        >
                            <span className="material-symbols-outlined text-[16px]" translate="no">arrow_back</span>
                            Retour Escale Opérateur
                        </button>
                        <div className="flex flex-col items-end">
                            <span className="text-[11px] font-black text-apple-textDark dark:text-white">{user?.firstName} {user?.lastName}</span>
                            <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">Opérateur Stock</span>
                        </div>
                        <button
                            onClick={() => { logout(); router.push('/login'); }}
                            title="Déconnexion"
                            className="w-10 h-10 rounded-full flex items-center justify-center text-apple-secondary hover:text-red-500 bg-white/40 dark:bg-white/5 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all active:scale-95 cursor-pointer"
                        >
                            <span className="material-symbols-outlined text-[20px] font-light" translate="no">logout</span>
                        </button>
                    </div>
                </header>
                <div className="max-w-7xl mx-auto p-8">
                    {guidesContent}
                </div>
            </div>
        );
    }

    return (
        <AdminLayout>
            {guidesContent}
        </AdminLayout>
    );
}
