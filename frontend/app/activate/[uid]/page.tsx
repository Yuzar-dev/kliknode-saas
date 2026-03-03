'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

type Status = 'loading' | 'not_found' | 'reserved' | 'lost' | 'activating';

export default function ActivatePage() {
    const params = useParams();
    const router = useRouter();
    const uidRaw = params?.uid as string;
    const uid = uidRaw ? decodeURIComponent(uidRaw) : '';

    const [status, setStatus] = useState<Status>('loading');

    useEffect(() => {
        checkCard();
    }, [uid]);

    const checkCard = async () => {
        try {
            const supabase = createClient();

            // Fetch physical card by UID
            const { data: physicalCard, error } = await supabase
                .from('physical_cards')
                .select(`
                    status,
                    cards ( public_slug, user_id )
                `)
                .eq('uid', uid)
                .single();

            if (error || !physicalCard) {
                console.error("Card fetch error:", error);
                setStatus('not_found');
                return;
            }

            if (physicalCard.status === 'in_stock' || physicalCard.status === 'reserved') {
                setStatus('activating');
                // Redirect to global signup page with card reference
                const isNfcDomain = typeof window !== 'undefined' && window.location.hostname.includes('k.kliknode.com');
                const appUrl = isNfcDomain ? 'https://app.kliknode.com' : (typeof window !== 'undefined' ? window.location.origin : '');

                setTimeout(() => window.location.href = `${appUrl}/signup?card_id=${uid}`, 1000);
                return;
            }

            if (physicalCard.status === 'paired') {
                setStatus('activating');
                const virtualCard = physicalCard.cards as any;
                const slug = virtualCard?.public_slug || virtualCard?.user_id;

                if (slug) {
                    const isNfcDomain = typeof window !== 'undefined' && window.location.hostname.includes('k.kliknode.com');
                    const appUrl = isNfcDomain ? 'https://app.kliknode.com' : (typeof window !== 'undefined' ? window.location.origin : '');

                    setTimeout(() => window.location.href = `${appUrl}/p/${slug}`, 1000);
                } else {
                    setStatus('not_found');
                }
                return;
            }

            // Other statuses
            if (physicalCard.status === 'lost') setStatus('lost');
            else setStatus('not_found');

        } catch (e) {
            console.error("Activate page error:", e);
            setStatus('not_found');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-6" style={{
            background: 'linear-gradient(135deg, #E8EDFB 0%, #F0F2F5 40%, #EDE9FB 100%)',
            fontFamily: "'Inter', -apple-system, sans-serif",
        }}>
            <div className="w-full max-w-md">
                {/* Brand / Logo Area */}
                <div className="mb-12 flex flex-col items-center relative z-10 transition-all duration-500 px-4">
                    <div className="mb-6 flex items-center justify-center transform hover:scale-105 transition-transform duration-500">
                        <img src="/logo-icon-black.svg" alt="KlikNode" className="h-[48px] w-auto" />
                    </div>
                    <h2 className="text-center text-5xl font-extrabold tracking-tighter text-[#1D1D1F] leading-none">
                        kliknode
                    </h2>
                    <p className="mt-8 text-center text-[10px] font-bold tracking-[0.4em] text-[#86868B] uppercase">
                        Héritage Numérique • Activation
                    </p>
                </div>

                {/* Card */}
                <div style={{
                    background: 'rgba(255,255,255,0.6)',
                    backdropFilter: 'blur(24px) saturate(200%)',
                    WebkitBackdropFilter: 'blur(24px) saturate(200%)',
                    border: '1px solid rgba(255,255,255,0.7)',
                    borderRadius: 24,
                    boxShadow: '0 20px 60px rgba(0,0,0,0.06)',
                    padding: 32,
                }}>
                    {/* Loading */}
                    {status === 'loading' && (
                        <div className="text-center py-8">
                            <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-3" />
                            <p className="text-sm text-slate-500">Vérification de votre carte…</p>
                        </div>
                    )}

                    {/* Not Found */}
                    {status === 'not_found' && (
                        <div className="text-center py-6">
                            <span className="material-symbols-outlined text-5xl text-red-400 mb-3">error</span>
                            <h2 className="text-xl font-bold text-slate-900 mb-2">Carte inconnue</h2>
                            <p className="text-sm text-slate-500">Cette carte NFC n'est pas enregistrée dans notre système.</p>
                        </div>
                    )}

                    {/* Activating / Redirecting */}
                    {status === 'activating' && (
                        <div className="text-center py-6">
                            <span className="material-symbols-outlined text-5xl text-blue-500 mb-3 animate-pulse">sync</span>
                            <h2 className="text-xl font-bold text-slate-900 mb-2">Redirection en cours...</h2>
                            <p className="text-sm text-slate-500">Veuillez patienter quelques instants.</p>
                        </div>
                    )}


                </div>

                {/* Footer */}
                <p className="text-center text-xs text-slate-400 mt-6">
                    Powered by <span className="font-semibold">KlikNode</span>
                </p>
            </div>
        </div>
    );
}
