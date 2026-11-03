'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { createClient } from '@/utils/supabase/client';
import { apiClient } from '@/lib/api-client';

interface WalletCardData {
    id: string;
    firstName: string | null;
    lastName: string | null;
    jobTitle: string | null;
    companyName: string | null;
    email: string | null;
    phoneMobile: string | null;
    avatarUrl: string | null;
    primaryColor: string | null;
    publicSlug: string;
}

export default function WalletPassPage() {
    const params = useParams();
    const slug = params?.slug as string;

    const [card, setCard] = useState<WalletCardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [showShortcutGuide, setShowShortcutGuide] = useState(false);
    const [publicProfileUrl, setPublicProfileUrl] = useState('');

    useEffect(() => {
        if (typeof window !== 'undefined' && slug) {
            setPublicProfileUrl(`${window.location.origin}/p/${slug}`);
        }
    }, [slug]);

    useEffect(() => {
        if (!slug) return;
        const loadWalletCard = async () => {
            try {
                // 1. Lecture prioritaire via l'API publique (inclut companyBranding & primaryColor)
                const res = await apiClient.get(`/api/public/card/${encodeURIComponent(slug)}`);
                if (res.data?.success && res.data?.data) {
                    const d = res.data.data;
                    setCard({
                        id: d.id,
                        firstName: d.firstName,
                        lastName: d.lastName,
                        jobTitle: d.jobTitle,
                        companyName: d.companyBranding?.companyName || d.companyName,
                        email: d.email,
                        phoneMobile: d.phoneMobile,
                        avatarUrl: d.avatarUrl,
                        primaryColor: d.companyBranding?.primaryColor || d.primaryColor,
                        publicSlug: d.publicSlug || d.userId || d.id,
                    });
                    setLoading(false);
                    return;
                }
            } catch {}

            try {
                // 2. Fallback directe Supabase
                const supabase = createClient();
                const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(slug);
                let query = supabase.from('cards').select('*');
                if (isUuid) {
                    query = query.or(`user_id.eq.${slug},public_slug.eq.${slug}`);
                } else {
                    query = query.eq('public_slug', slug);
                }
                const { data, error } = await query.single();
                if (!error && data) {
                    setCard({
                        id: data.id,
                        firstName: data.first_name,
                        lastName: data.last_name,
                        jobTitle: data.job_title,
                        companyName: data.company_name,
                        email: data.email,
                        phoneMobile: data.phone_mobile,
                        avatarUrl: data.avatar_url,
                        primaryColor: data.primary_color,
                        publicSlug: data.public_slug || data.user_id,
                    });
                }
            } catch (err) {
                console.warn('Wallet fetch fallback error:', err);
            } finally {
                setLoading(false);
            }
        };
        loadWalletCard();
    }, [slug]);

    const fullName = card
        ? `${card.firstName || ''} ${card.lastName || ''}`.trim() || 'Membre KlikNode'
        : 'Membre KlikNode';
    const accentColor = card?.primaryColor || '#0666EB';

    const handleDownloadWalletPng = async () => {
        if (!card) return;
        const svgElement = document.getElementById('wallet-qr-svg') as SVGSVGElement | null;
        if (!svgElement) {
            toast.error('QR Code introuvable');
            return;
        }

        const canvas = document.createElement('canvas');
        canvas.width = 1080;
        canvas.height = 1720;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Fond Apple Wallet sombre élégant
        const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
        grad.addColorStop(0, '#0F172A');
        grad.addColorStop(1, '#020617');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Bande supérieure couleur primaire
        ctx.fillStyle = accentColor;
        ctx.fillRect(0, 0, canvas.width, 28);

        // En-tête KlikNode Wallet
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '900 38px system-ui, -apple-system, sans-serif';
        ctx.fillText('KLIKNODE PASS', 80, 125);

        ctx.fillStyle = '#94A3B8';
        ctx.font = '700 24px system-ui, -apple-system, sans-serif';
        ctx.fillText('NFC & QR DIGITAL WALLET', 80, 165);

        // Nom & Poste
        ctx.fillStyle = '#94A3B8';
        ctx.font = '700 24px system-ui, -apple-system, sans-serif';
        ctx.fillText('TITULAIRE DE LA CARTE', 80, 290);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = '900 58px system-ui, -apple-system, sans-serif';
        ctx.fillText(fullName.toUpperCase(), 80, 360);

        ctx.fillStyle = accentColor;
        ctx.font = '700 34px system-ui, -apple-system, sans-serif';
        ctx.fillText(card.jobTitle || 'Professionnel', 80, 420);

        if (card.companyName) {
            ctx.fillStyle = '#CBD5E1';
            ctx.font = '700 30px system-ui, -apple-system, sans-serif';
            ctx.fillText(card.companyName.toUpperCase(), 80, 470);
        }

        // Cadre blanc pour le QR Code haute luminosité
        const qrBoxSize = 620;
        const qrBoxX = (canvas.width - qrBoxSize) / 2;
        const qrBoxY = 580;

        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.roundRect(qrBoxX, qrBoxY, qrBoxSize, qrBoxSize, 48);
        ctx.fill();

        // Convertir le SVG du QR Code en image
        const svgData = new XMLSerializer().serializeToString(svgElement);
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);

        const img = new Image();
        img.onload = () => {
            ctx.drawImage(img, qrBoxX + 60, qrBoxY + 60, qrBoxSize - 120, qrBoxSize - 120);
            URL.revokeObjectURL(url);

            ctx.fillStyle = '#64748B';
            ctx.font = '700 26px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(`kliknode.com/p/${card.publicSlug}`, canvas.width / 2, qrBoxY + qrBoxSize + 90);

            const pngUrl = canvas.toDataURL('image/png');
            const downloadLink = document.createElement('a');
            downloadLink.href = pngUrl;
            downloadLink.download = `wallet-pass-${card.publicSlug}.png`;
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
            toast.success('Image Pass Wallet HD téléchargée !');
        };
        img.src = url;
    };

    const handleSharePass = async () => {
        const shareUrl = typeof window !== 'undefined' ? window.location.href : publicProfileUrl;
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `${fullName} — Pass Wallet KlikNode`,
                    text: `Scannez ou ouvrez ma carte digitale ${fullName}`,
                    url: publicProfileUrl || shareUrl,
                });
                return;
            } catch {}
        }
        await navigator.clipboard.writeText(publicProfileUrl || shareUrl);
        toast.success('Lien de la carte copié !');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#050811] flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
            </div>
        );
    }

    if (!card) {
        return (
            <div className="min-h-screen bg-[#050811] text-white flex flex-col items-center justify-center p-6 text-center">
                <h1 className="text-2xl font-black mb-2">Pass Wallet introuvable</h1>
                <p className="text-slate-400 text-sm mb-6">Cette carte digitale n&apos;existe pas ou a été désactivée.</p>
                <Link href="/" className="px-6 py-3 rounded-full bg-blue-600 text-white text-xs font-black uppercase tracking-widest">
                    Retour
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#050811] text-white flex flex-col items-center justify-between py-6 px-4 select-none">
            {/* Top Bar style Apple Wallet */}
            <div className="w-full max-w-[400px] flex items-center justify-between px-2 mb-3">
                <Link
                    href={`/p/${card.publicSlug}`}
                    className="text-xs font-bold text-slate-300 hover:text-white flex items-center gap-1 bg-white/10 px-3.5 py-2 rounded-full"
                >
                    <span className="material-symbols-outlined text-[16px]">person</span>
                    Voir Profil Public
                </Link>
                <button
                    type="button"
                    onClick={() => setShowShortcutGuide(true)}
                    className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 bg-blue-500/15 border border-blue-500/30 px-3.5 py-2 rounded-full cursor-pointer"
                >
                    <span className="material-symbols-outlined text-[16px]">add_to_home_screen</span>
                    Raccourci iPhone
                </button>
            </div>

            {/* Pass Card Apple Wallet / Google Wallet */}
            <div
                className="w-full max-w-[400px] rounded-[32px] overflow-hidden shadow-[0_25px_70px_rgba(0,0,0,0.85)] border border-white/15 relative"
                style={{
                    background: 'linear-gradient(165deg, #161F33 0%, #0B101E 60%, #070A14 100%)',
                }}
            >
                {/* Liseré supérieur couleur primaire */}
                <div className="h-3 w-full" style={{ backgroundColor: accentColor }} />

                {/* Encoches latérales style Pass Wallet */}
                <div className="p-7 space-y-6">
                    {/* Header du Pass */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div
                                className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-white shadow-md"
                                style={{ backgroundColor: accentColor }}
                            >
                                <span className="material-symbols-outlined text-[22px]">contactless</span>
                            </div>
                            <div>
                                <p className="text-[11px] font-black tracking-[0.2em] uppercase text-white">KLIKNODE</p>
                                <p className="text-[9px] font-bold tracking-widest uppercase text-slate-400">Pass Wallet Officiel</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">STATUT</p>
                            <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-emerald-400">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                ACTIF
                            </span>
                        </div>
                    </div>

                    {/* Infos Titulaire */}
                    <div className="flex items-center justify-between gap-4 pt-2 border-t border-white/10">
                        <div className="min-w-0">
                            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400">TITULAIRE</p>
                            <h1 className="text-2xl font-black tracking-tight text-white truncate mt-0.5">{fullName}</h1>
                            <p className="text-xs font-bold mt-0.5 truncate" style={{ color: accentColor }}>
                                {card.jobTitle || 'Membre PRO'}
                            </p>
                        </div>
                        {card.avatarUrl ? (
                            <img
                                src={card.avatarUrl}
                                alt={fullName}
                                className="w-14 h-14 rounded-2xl object-cover border-2 border-white/20 shrink-0"
                            />
                        ) : (
                            <div
                                className="w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-black text-white shrink-0 border border-white/15"
                                style={{ backgroundColor: accentColor }}
                            >
                                {fullName.charAt(0).toUpperCase()}
                            </div>
                        )}
                    </div>

                    {/* Grille Entreprise & Contact */}
                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-white/10">
                        <div>
                            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400">ORGANISATION</p>
                            <p className="text-xs font-bold text-slate-200 truncate mt-0.5">
                                {card.companyName || 'Indépendant'}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400">ID PASS</p>
                            <p className="text-xs font-mono font-bold text-slate-300 truncate mt-0.5">
                                #{card.publicSlug.slice(0, 10).toUpperCase()}
                            </p>
                        </div>
                    </div>

                    {/* Zone QR Code Haute Luminosité style Apple Wallet */}
                    <div className="pt-2 flex flex-col items-center">
                        <div className="bg-white p-5 rounded-3xl shadow-2xl flex flex-col items-center justify-center">
                            {publicProfileUrl && (
                                <QRCodeSVG
                                    id="wallet-qr-svg"
                                    value={publicProfileUrl}
                                    size={210}
                                    level="H"
                                    includeMargin={false}
                                />
                            )}
                        </div>
                        <p className="text-[10px] font-mono text-slate-400 mt-3">
                            Présentez ce QR Code à l&apos;appareil photo de votre interlocuteur
                        </p>
                    </div>
                </div>
            </div>

            {/* Barre d'actions rapides en bas */}
            <div className="w-full max-w-[400px] grid grid-cols-2 gap-3 mt-5">
                <button
                    type="button"
                    onClick={handleDownloadWalletPng}
                    className="h-13 py-3.5 px-4 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                    <span className="material-symbols-outlined text-[18px]">download</span>
                    Image Carte HD
                </button>
                <button
                    type="button"
                    onClick={handleSharePass}
                    className="h-13 py-3.5 px-4 rounded-2xl text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg transition-all"
                    style={{ backgroundColor: accentColor }}
                >
                    <span className="material-symbols-outlined text-[18px]">ios_share</span>
                    Partager Carte
                </button>
            </div>

            {/* Modal Guide d'installation Raccourci iPhone / Écran d'accueil (0€ sans compte Apple Dev) */}
            {showShortcutGuide && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="bg-[#111827] border border-white/15 rounded-[32px] max-w-md w-full p-7 space-y-5">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-black text-white">Accès Rapide sur iPhone & Android</h3>
                            <button
                                type="button"
                                onClick={() => setShowShortcutGuide(false)}
                                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"
                            >
                                <span className="material-symbols-outlined text-[18px]">close</span>
                            </button>
                        </div>

                        <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
                            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1.5">
                                <p className="font-black text-white text-sm flex items-center gap-2">
                                    <span className="material-symbols-outlined text-blue-400 text-[18px]">smartphone</span>
                                    Option 1 : Icône Pass Plein Écran (Recommandé)
                                </p>
                                <p>
                                    1. Appuyez sur le bouton <strong>Partager</strong> de Safari/Chrome.<br />
                                    2. Choisissez <strong>« Sur l&apos;écran d&apos;accueil »</strong>.<br />
                                    3. Votre Pass Wallet s&apos;ouvrira en plein écran exactement comme une application native !
                                </p>
                            </div>

                            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1.5">
                                <p className="font-black text-white text-sm flex items-center gap-2">
                                    <span className="material-symbols-outlined text-emerald-400 text-[18px]">bolt</span>
                                    Option 2 : Bouton Action / Double-clic iPhone
                                </p>
                                <p>
                                    1. Ouvrez l&apos;app <strong>Raccourcis (Shortcuts)</strong> sur iPhone.<br />
                                    2. Ajoutez l&apos;action <strong>« Ouvrir l&apos;URL »</strong> et collez ce lien.<br />
                                    3. Associez ce raccourci au <strong>Bouton Action</strong> ou au <strong>Toucher le dos de l&apos;iPhone (2 fois)</strong> dans Réglages → Accessibilité → Toucher !
                                </p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => {
                                navigator.clipboard.writeText(window.location.href);
                                toast.success('Lien du Pass Wallet copié !');
                                setShowShortcutGuide(false);
                            }}
                            className="w-full py-3.5 rounded-2xl bg-blue-600 text-white font-black text-xs uppercase tracking-widest cursor-pointer"
                        >
                            Copier le lien de ce Pass Wallet
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
