import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

export default async function ActivatePage({
    params,
}: {
    params: Promise<{ uid: string }>
}) {
    const { uid: encodedUid } = await params;
    const uid = decodeURIComponent(encodedUid);
    const supabase = await createClient();

    const { data: physicalCard } = await supabase
        .from('physical_cards')
        .select(`status, paired_card_id`)
        .eq('uid', uid)
        .single();

    if (!physicalCard) {
        return <NotFound />;
    }

    if (physicalCard.status === 'in_stock' || physicalCard.status === 'reserved') {
        const headersList = await headers();
        const host = headersList.get('host') || '';
        const isNfcDomain = host.includes('k.kliknode.com');
        const appUrl = isNfcDomain ? 'https://app.kliknode.com' : '';

        redirect(`${appUrl}/signup?card_id=${uid}`);
    }

    if (physicalCard.status === 'paired') {
        const { data: virtualCard } = await supabase
            .from('cards')
            .select('id, public_slug, user_id')
            .eq('id', physicalCard.paired_card_id)
            .maybeSingle();

        const slug = virtualCard?.public_slug || virtualCard?.user_id;

        if (slug && virtualCard) {
            const headersList = await headers();
            const host = headersList.get('host') || '';
            const isNfcDomain = host.includes('k.kliknode.com');
            const appUrl = isNfcDomain ? 'https://app.kliknode.com' : '';

            // Increment scan count
            await supabase.rpc('increment_scan_count', { card_id_param: virtualCard.id });

            redirect(`${appUrl}/p/${slug}`);
        }
    }

    if (physicalCard.status === 'lost') {
        return <Lost />;
    }

    return <NotFound />;
}

function Screen({ icon, title, message }: { icon: string, title: string, message: string }) {
    return (
        <div className="min-h-screen flex items-center justify-center p-6" style={{
            background: 'linear-gradient(135deg, #E8EDFB 0%, #F0F2F5 40%, #EDE9FB 100%)',
            fontFamily: "'Inter', -apple-system, sans-serif",
        }}>
            <div className="w-full max-w-md">
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

                <div style={{
                    background: 'rgba(255,255,255,0.6)',
                    backdropFilter: 'blur(24px) saturate(200%)',
                    WebkitBackdropFilter: 'blur(24px) saturate(200%)',
                    border: '1px solid rgba(255,255,255,0.7)',
                    borderRadius: 24,
                    boxShadow: '0 20px 60px rgba(0,0,0,0.06)',
                    padding: 32,
                }}>
                    <div className="text-center py-6">
                        <span className="material-symbols-outlined text-5xl text-red-400 mb-3">{icon}</span>
                        <h2 className="text-xl font-bold text-slate-900 mb-2">{title}</h2>
                        <p className="text-sm text-slate-500">{message}</p>
                    </div>
                </div>

                <p className="text-center text-xs text-slate-400 mt-6">
                    Powered by <span className="font-semibold">KlikNode</span>
                </p>
            </div>
        </div>
    );
}

function NotFound() {
    return <Screen
        icon="error"
        title="Carte inconnue"
        message="Cette carte NFC n'est pas enregistrée dans notre système."
    />;
}

function Lost() {
    return <Screen
        icon="warning"
        title="Carte bloquée"
        message="Cette carte est marquée comme inutilisable."
    />;
}
