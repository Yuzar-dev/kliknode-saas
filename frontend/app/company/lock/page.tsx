'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import toast from 'react-hot-toast';

export default function MasterLockPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const [branding, setBranding] = useState({
        lockPhoto: false,
        lockJobTitle: false,
        lockSocialLinks: false,
        forceLogo: false
    });

    useEffect(() => {
        fetchBranding();
    }, []);

    const fetchBranding = async () => {
        setIsLoading(true);
        try {
            const response = await apiClient.get('/api/company/branding');
            if (response.data.success) {
                setBranding(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching branding:', error);
            toast.error('Erreur lors du chargement des paramètres');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const response = await apiClient.patch('/api/company/branding', branding);
            if (response.data.success) {
                toast.success('Paramètres enregistrés avec succès');
                setBranding(response.data.data);
            }
        } catch (error) {
            console.error('Error saving branding:', error);
            toast.error('Erreur lors de l\'enregistrement');
        } finally {
            setIsSaving(false);
        }
    };

    const toggleLock = (key: keyof typeof branding) => {
        setBranding(prev => ({ ...prev, [key]: !prev[key] }));
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                <p className="text-apple-secondary font-medium animate-pulse tracking-tight">Chargement des paramètres Master Lock...</p>
            </div>
        );
    }

    return (
        <main className="max-w-4xl mx-auto space-y-10 font-display animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <div className="flex items-center gap-4 mb-2">
                        <div className="w-12 h-12 rounded-[1.2rem] glass flex items-center justify-center text-primary shadow-sm border border-white/20">
                            <span className="material-symbols-outlined text-[28px]">lock_person</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-apple-textDark dark:text-white tracking-tighter">Master Lock</h1>
                    </div>
                    <p className="text-[11px] font-black uppercase tracking-[0.25em] text-apple-secondary dark:text-slate-500 mt-4">
                        Verrouillez les champs pour garantir la cohérence de votre image de marque à travers l'organisation.
                    </p>
                </div>
            </div>

            <div className="klik-glass rounded-[40px] border border-white/40 dark:border-white/5 shadow-2xl overflow-hidden mt-8">
                <div className="px-8 py-6 border-b border-gray-100/10 dark:border-white/5 bg-white/30 dark:bg-white/5">
                    <h3 className="text-2xl font-black text-apple-textDark dark:text-white tracking-tight">Restrictions globales</h3>
                    <p className="text-[10px] font-bold text-apple-secondary uppercase tracking-widest mt-2">Ces paramètres s'appliquent à tous les comptes employés non-administrateurs.</p>
                </div>

                <div className="divide-y divide-gray-100/20 dark:divide-white/10">
                    {/* Lock Photo */}
                    <div className="p-8 flex items-start justify-between gap-6 hover:bg-white/40 dark:hover:bg-white/5 transition-colors">
                        <div className="flex-1">
                            <label className="text-lg font-black text-apple-textDark dark:text-white tracking-tight flex items-center gap-3">
                                Interdire la modification de la photo de profil
                                <span className="material-symbols-outlined text-apple-secondary text-[20px] cursor-help" title="Empêche les employés de remplacer leur photo professionnelle par une image personnelle.">info</span>
                            </label>
                            <p className="text-[11px] font-bold text-apple-secondary uppercase tracking-widest mt-2 leading-relaxed">Empêche les employés de remplacer leur photo professionnelle par une image personnelle. Idéal pour l'uniformité.</p>
                        </div>
                        <button
                            onClick={() => toggleLock('lockPhoto')}
                            className={`relative inline-flex h-8 w-14 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary/20 ${branding.lockPhoto ? 'bg-primary shadow-lg shadow-primary/30' : 'bg-gray-200 dark:bg-[#1C1C1E]'}`}
                        >
                            <span className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow-sm ring-0 transition duration-300 ease-in-out ${branding.lockPhoto ? 'translate-x-6' : 'translate-x-0'}`}></span>
                        </button>
                    </div>

                    {/* Lock Job Title */}
                    <div className="p-8 flex items-start justify-between gap-6 hover:bg-white/40 dark:hover:bg-white/5 transition-colors">
                        <div className="flex-1">
                            <label className="text-lg font-black text-apple-textDark dark:text-white tracking-tight flex items-center gap-3">
                                Interdire la modification du poste / titre
                            </label>
                            <p className="text-[11px] font-bold text-apple-secondary uppercase tracking-widest mt-2 leading-relaxed">Garantit que les intitulés de poste restent conformes à la base de données RH et ne sont pas modifiés manuellement.</p>
                        </div>
                        <button
                            onClick={() => toggleLock('lockJobTitle')}
                            className={`relative inline-flex h-8 w-14 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary/20 ${branding.lockJobTitle ? 'bg-primary shadow-lg shadow-primary/30' : 'bg-gray-200 dark:bg-[#1C1C1E]'}`}
                        >
                            <span className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow-sm ring-0 transition duration-300 ease-in-out ${branding.lockJobTitle ? 'translate-x-6' : 'translate-x-0'}`}></span>
                        </button>
                    </div>

                    {/* Force Corporate Logo */}
                    <div className="p-8 flex items-start justify-between gap-6 hover:bg-white/40 dark:hover:bg-white/5 transition-colors">
                        <div className="flex-1">
                            <label className="text-lg font-black text-apple-textDark dark:text-white tracking-tight flex items-center gap-3">
                                Forcer l'affichage du logo corporate sur toutes les cartes
                            </label>
                            <p className="text-[11px] font-bold text-apple-secondary uppercase tracking-widest mt-2 leading-relaxed">Le logo de l'entreprise sera visible sur toutes les signatures email et cartes virtuelles, sans possibilité de le masquer.</p>
                        </div>
                        <button
                            onClick={() => toggleLock('forceLogo')}
                            className={`relative inline-flex h-8 w-14 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary/20 ${branding.forceLogo ? 'bg-primary shadow-lg shadow-primary/30' : 'bg-gray-200 dark:bg-[#1C1C1E]'}`}
                        >
                            <span className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow-sm ring-0 transition duration-300 ease-in-out ${branding.forceLogo ? 'translate-x-6' : 'translate-x-0'}`}></span>
                        </button>
                    </div>

                    {/* Lock Social Links */}
                    <div className="p-8 flex items-start justify-between gap-6 hover:bg-white/40 dark:hover:bg-white/5 transition-colors">
                        <div className="flex-1">
                            <label className="text-lg font-black text-apple-textDark dark:text-white tracking-tight flex items-center gap-3">
                                Verrouiller les liens de réseaux sociaux
                            </label>
                            <p className="text-[11px] font-bold text-apple-secondary uppercase tracking-widest mt-2 leading-relaxed">Si activé, les employés ne pourront pas ajouter ou modifier leurs liens LinkedIn, Twitter ou autres plateformes.</p>
                        </div>
                        <button
                            onClick={() => toggleLock('lockSocialLinks')}
                            className={`relative inline-flex h-8 w-14 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary/20 ${branding.lockSocialLinks ? 'bg-primary shadow-lg shadow-primary/30' : 'bg-gray-200 dark:bg-[#1C1C1E]'}`}
                        >
                            <span className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow-sm ring-0 transition duration-300 ease-in-out ${branding.lockSocialLinks ? 'translate-x-6' : 'translate-x-0'}`}></span>
                        </button>
                    </div>
                </div>

                <div className="bg-white/30 dark:bg-white/5 px-8 py-6 flex flex-col sm:flex-row items-center justify-end border-t border-gray-100/10 dark:border-white/5 gap-4">
                    <button
                        onClick={fetchBranding}
                        className="w-full sm:w-auto px-8 h-12 rounded-full glass border border-white/40 dark:border-white/10 hover:bg-white/40 dark:hover:bg-white/5 transition-all flex items-center justify-center gap-3 text-xs font-black uppercase tracking-widest text-apple-textDark dark:text-white shadow-sm"
                    >
                        Annuler
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="w-full sm:w-auto px-10 h-12 rounded-full btn-titanium-primary shadow-xl shadow-primary/30 flex items-center justify-center gap-3 text-xs font-black uppercase tracking-widest text-white transition-all disabled:opacity-50"
                    >
                        {isSaving ? (
                            <span className="material-symbols-outlined text-[20px] animate-spin">sync</span>
                        ) : (
                            <span className="material-symbols-outlined text-[20px]">save</span>
                        )}
                        {isSaving ? 'Enregistrement...' : 'Enregistrer les modifications'}
                    </button>
                </div>
            </div>

            {/* Tip Card */}
            <div className="klik-glass p-6 rounded-[24px] border border-primary/20 bg-primary/5 flex gap-4 mt-8">
                <div className="w-12 h-12 rounded-[1.2rem] glass border border-primary/20 flex items-center justify-center text-primary flex-shrink-0">
                    <span className="material-symbols-outlined text-[24px]">tips_and_updates</span>
                </div>
                <div>
                    <h4 className="text-lg font-black text-primary tracking-tight mb-2">Astuce Branding</h4>
                    <p className="text-[11px] font-bold text-apple-secondary uppercase tracking-widest leading-relaxed">Verrouiller la photo de profil est recommandé si vous avez récemment organisé une séance photo professionnelle pour vos équipes.</p>
                </div>
            </div>
        </main>
    );
}
