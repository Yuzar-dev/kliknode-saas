'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import toast from 'react-hot-toast';

export default function SettingsPage() {
    const [profile, setProfile] = useState<{ firstName: string, lastName: string, email: string, role: string } | null>(null);
    const [loading, setLoading] = useState(true);

    // Password change
    const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' });
    const [pwLoading, setPwLoading] = useState(false);

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('users')
                .select('first_name, last_name, email, role')
                .eq('id', user.id)
                .single();

            if (error) throw error;
            if (data) {
                setProfile({
                    firstName: data.first_name || '',
                    lastName: data.last_name || '',
                    email: data.email || '',
                    role: data.role || 'employee'
                });
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (pwForm.newPw !== pwForm.confirm) return toast.error('Les mots de passe ne correspondent pas');
        if (pwForm.newPw.length < 8) return toast.error('Minimum 8 caractères');
        setPwLoading(true);
        try {
            const supabase = createClient();
            const { error } = await supabase.auth.updateUser({
                password: pwForm.newPw
            });
            if (error) throw error;

            toast.success('Mot de passe mis à jour !');
            setPwForm({ current: '', newPw: '', confirm: '' });
        } catch (err: any) {
            toast.error(err.message || 'Erreur');
        } finally {
            setPwLoading(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="animate-spin h-10 w-10 border-4 border-spaceGray dark:border-white border-t-transparent rounded-full" />
        </div>
    );

    return (
        <div className="pb-20 relative selection:bg-slate-200">
            <div className="max-w-3xl mx-auto relative z-10">
                <div className="mb-10">
                    <h1 className="text-4xl font-black text-apple-textDark dark:text-white tracking-tight">Réglages</h1>
                    <p className="text-apple-secondary dark:text-gray-400 font-bold text-sm mt-2">Gérez la sécurité et les paramètres de votre compte.</p>
                </div>

                {/* Account info */}
                <div className="klik-glass p-10 rounded-[2.5rem] border border-white/60 dark:border-white/5 shadow-lg mb-8 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gray-100 dark:bg-white/5 blur-3xl opacity-30 -mr-16 -mt-16 group-hover:opacity-50 transition-all duration-700" />
                    <h3 className="text-xs font-black uppercase tracking-[0.25em] text-apple-secondary dark:text-gray-500 mb-8 px-1">Informations du compte</h3>

                    <div className="space-y-6">
                        <div className="flex justify-between items-center py-5 border-b border-gray-100 dark:border-white/5 px-4 rounded-2xl hover:bg-white/40 dark:hover:bg-white/5 transition-all">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-apple-secondary dark:text-gray-500 mb-1">Nom complet</p>
                                <p className="text-base font-black text-apple-textDark dark:text-white tracking-tight">{profile?.firstName} {profile?.lastName}</p>
                            </div>
                            <span className="material-symbols-outlined text-apple-secondary opacity-30">person</span>
                        </div>
                        <div className="flex justify-between items-center py-5 border-b border-gray-100 dark:border-white/5 px-4 rounded-2xl hover:bg-white/40 dark:hover:bg-white/5 transition-all">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-apple-secondary dark:text-gray-500 mb-1">Email</p>
                                <p className="text-base font-black text-apple-textDark dark:text-white tracking-tight italic">{profile?.email}</p>
                            </div>
                            <span className="material-symbols-outlined text-apple-secondary opacity-30">mail</span>
                        </div>
                        <div className="flex justify-between items-center py-5 px-4 rounded-2xl hover:bg-white/40 dark:hover:bg-white/5 transition-all">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-apple-secondary dark:text-gray-500 mb-1">Rôle</p>
                                <p className="text-base font-black text-apple-textDark dark:text-white tracking-tight capitalize">{profile?.role?.replace('_', ' ')}</p>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Actif</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Change password */}
                <div className="klik-glass p-10 rounded-[2.5rem] border border-white/60 dark:border-white/5 shadow-lg mb-8 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 dark:bg-blue-400/5 blur-3xl opacity-30 -mr-16 -mt-16 group-hover:opacity-50 transition-all duration-700" />
                    <h3 className="text-xs font-black uppercase tracking-[0.25em] text-apple-secondary dark:text-gray-500 mb-8 px-1">Sécurité</h3>
                    <p className="text-sm font-bold text-apple-secondary dark:text-gray-400 mb-10 px-1 leading-relaxed">Pour votre sécurité, utilisez un mot de passe fort d'au moins 8 caractères mixant lettres, chiffres et symboles.</p>

                    <form onSubmit={handleChangePassword} className="space-y-8">
                        {[
                            { key: 'current', label: 'Mot de passe actuel', type: 'password', placeholder: '••••••••' },
                            { key: 'newPw', label: 'Nouveau mot de passe', type: 'password', placeholder: 'Minimum 8 caractères' },
                            { key: 'confirm', label: 'Confirmer le nouveau mot de passe', type: 'password', placeholder: '••••••••' },
                        ].map(f => (
                            <div key={f.key} className="space-y-3 group/input">
                                <label className="block text-[11px] font-black text-apple-secondary dark:text-gray-500 uppercase tracking-widest ml-1 group-focus-within/input:text-apple-textDark dark:group-focus-within/input:text-white transition-colors">{f.label}</label>
                                <input
                                    type={f.type}
                                    required
                                    value={(pwForm as any)[f.key]}
                                    onChange={e => setPwForm({ ...pwForm, [f.key]: e.target.value })}
                                    placeholder={f.placeholder}
                                    className={`w-full pr-12 rounded-[1.2rem] border bg-white/50 dark:bg-black/20 px-5 py-4 text-base text-apple-textDark dark:text-white focus:outline-none focus:ring-1 transition-all font-medium placeholder:text-gray-300 dark:placeholder:text-gray-600 ${f.key === 'confirm' && pwForm.confirm && pwForm.confirm !== pwForm.newPw
                                        ? 'border-red-300 dark:border-red-900/50 focus:ring-red-500/20'
                                        : 'border-gray-100 dark:border-white/5 focus:ring-apple-bgLight dark:focus:ring-white/10 focus:bg-white dark:focus:bg-black/40'
                                        }`}
                                />
                                {f.key === 'confirm' && pwForm.confirm && pwForm.confirm !== pwForm.newPw && (
                                    <p className="text-[10px] font-black text-red-500 uppercase tracking-widest ml-1">Les mots de passe ne correspondent pas</p>
                                )}
                            </div>
                        ))}

                        <button
                            type="submit"
                            disabled={pwLoading}
                            className="btn-obsidian btn-obsidian-primary w-full h-14 rounded-[1.2rem] shadow-xl active:scale-95 disabled:opacity-50 transition-all font-black text-base tracking-tight"
                        >
                            {pwLoading ? 'Mise à jour...' : 'Mettre à jour le mot de passe'}
                        </button>
                    </form>
                </div>

                {/* Danger zone */}
                <div className="klik-glass p-10 rounded-[2.5rem] border border-red-500/10 dark:border-red-500/10 shadow-lg relative overflow-hidden group">
                    <h3 className="text-[11px] font-black uppercase tracking-[0.25em] text-red-500 mb-8 px-1">Zone critique</h3>
                    <p className="text-xs font-bold text-apple-secondary dark:text-gray-400 mb-10 px-1">Ces actions sont irréversibles et impactent directement votre service.</p>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-6 bg-red-500/5 dark:bg-red-500/5 rounded-3xl border border-red-500/10 group/item hover:bg-red-500/10 transition-all">
                            <div>
                                <p className="text-sm font-black text-apple-textDark dark:text-white tracking-tight">Déclarer ma carte perdue</p>
                                <p className="text-[10px] font-bold text-apple-secondary dark:text-gray-500 uppercase tracking-widest mt-1">Désactive la puce NFC physique</p>
                            </div>
                            <button
                                onClick={() => toast('Bientôt disponible', { icon: '🚨' })}
                                className="px-6 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-widest border border-red-200 dark:border-red-900/30 text-red-600 hover:bg-red-600 hover:text-white transition-all shadow-sm active:scale-95"
                            >
                                Déclarer perdue
                            </button>
                        </div>
                        <div className="flex items-center justify-between p-6 bg-red-500/5 dark:bg-red-500/5 rounded-3xl border border-red-500/10 group/item hover:bg-red-500/10 transition-all">
                            <div>
                                <p className="text-sm font-black text-apple-textDark dark:text-white tracking-tight">Supprimer mon compte</p>
                                <p className="text-[10px] font-bold text-apple-secondary dark:text-gray-500 uppercase tracking-widest mt-1">Suppression totale des données</p>
                            </div>
                            <button
                                onClick={() => toast('Contactez le support.', { icon: '🚨' })}
                                className="px-6 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-widest bg-red-600 text-white shadow-lg shadow-red-600/20 hover:scale-105 transition-all active:scale-95"
                            >
                                Supprimer
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
