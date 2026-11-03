import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function EmployeeJoinPage({
    searchParams,
}: {
    searchParams: Promise<{ card_id?: string; company_id?: string }>
}) {
    const { card_id, company_id } = await searchParams;

    if (!card_id || !company_id) {
        redirect('/login');
    }

    const supabase = await createClient();

    // Fetch company info
    const { data: company } = await supabase
        .from('companies')
        .select('name')
        .eq('id', company_id)
        .single();

    if (!company) {
        redirect('/login');
    }

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
                        Intégration Employé
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
                    <div className="text-center">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                            <span className="material-symbols-outlined text-3xl text-blue-600" translate="no">badge</span>
                        </div>
                        
                        <h2 className="text-2xl font-black tracking-tight text-slate-900 mb-2">
                            Bienvenue chez {company.name}
                        </h2>
                        <p className="text-sm text-slate-500 mb-8 font-medium">
                            Votre carte professionnelle B2B a été détectée. Veuillez créer votre compte employé pour l'activer et la personnaliser.
                        </p>

                        <div className="space-y-4">
                            <Link href={`/signup?card_id=${card_id}`}
                                className="w-full h-14 bg-gradient-to-r from-blue-600 to-blue-700 text-white flex items-center justify-center gap-2 rounded-[1.2rem] shadow-xl hover:shadow-2xl transition-all active:scale-95 font-bold"
                            >
                                <span className="material-symbols-outlined text-[20px] font-light" translate="no">person_add</span>
                                Créer mon compte
                            </Link>
                            
                            <Link href={`/login?card_id=${encodeURIComponent(card_id)}&company_id=${encodeURIComponent(company_id)}`}
                                className="w-full h-14 bg-white/50 text-slate-700 flex items-center justify-center gap-2 rounded-[1.2rem] border border-slate-200 hover:bg-white transition-all active:scale-95 font-bold"
                            >
                                J&apos;ai déjà un compte (Activer ma carte)
                            </Link>
                        </div>
                    </div>
                </div>

                <p className="text-center text-xs text-slate-400 mt-6 font-medium">
                    Sécurisé par <span className="font-semibold text-slate-500">KlikNode</span>
                </p>
            </div>
        </div>
    );
}
