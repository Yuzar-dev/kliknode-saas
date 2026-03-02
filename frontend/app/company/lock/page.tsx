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
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <main className="max-w-4xl mx-auto space-y-8 font-display">
            <header className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <span className="material-icons text-primary text-3xl">lock_person</span>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Master Lock</h1>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-lg">
                    Verrouillez les champs pour garantir la cohérence de votre image de marque à travers l'organisation.
                </p>
            </header>

            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Restrictions globales</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Ces paramètres s'appliquent à tous les comptes employés non-administrateurs.</p>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {/* Lock Photo */}
                    <div className="p-6 flex items-start justify-between gap-4">
                        <div className="flex-1">
                            <label className="text-base font-medium text-slate-900 dark:text-white flex items-center gap-2">
                                Interdire la modification de la photo de profil
                                <span className="material-icons text-slate-400 text-sm cursor-help" title="Empêche les employés de remplacer leur photo professionnelle par une image personnelle.">info</span>
                            </label>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Empêche les employés de remplacer leur photo professionnelle par une image personnelle. Idéal pour l'uniformité.</p>
                        </div>
                        <button
                            onClick={() => toggleLock('lockPhoto')}
                            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-slate-900 ${branding.lockPhoto ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'}`}
                        >
                            <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${branding.lockPhoto ? 'translate-x-5' : 'translate-x-0'}`}></span>
                        </button>
                    </div>

                    {/* Lock Job Title */}
                    <div className="p-6 flex items-start justify-between gap-4">
                        <div className="flex-1">
                            <label className="text-base font-medium text-slate-900 dark:text-white flex items-center gap-2">
                                Interdire la modification du poste / titre
                            </label>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Garantit que les intitulés de poste restent conformes à la base de données RH et ne sont pas modifiés manuellement.</p>
                        </div>
                        <button
                            onClick={() => toggleLock('lockJobTitle')}
                            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-slate-900 ${branding.lockJobTitle ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'}`}
                        >
                            <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${branding.lockJobTitle ? 'translate-x-5' : 'translate-x-0'}`}></span>
                        </button>
                    </div>

                    {/* Force Corporate Logo */}
                    <div className="p-6 flex items-start justify-between gap-4">
                        <div className="flex-1">
                            <label className="text-base font-medium text-slate-900 dark:text-white flex items-center gap-2">
                                Forcer l'affichage du logo corporate sur toutes les cartes
                            </label>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Le logo de l'entreprise sera visible sur toutes les signatures email et cartes virtuelles, sans possibilité de le masquer.</p>
                        </div>
                        <button
                            onClick={() => toggleLock('forceLogo')}
                            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-slate-900 ${branding.forceLogo ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'}`}
                        >
                            <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${branding.forceLogo ? 'translate-x-5' : 'translate-x-0'}`}></span>
                        </button>
                    </div>

                    {/* Lock Social Links */}
                    <div className="p-6 flex items-start justify-between gap-4">
                        <div className="flex-1">
                            <label className="text-base font-medium text-slate-900 dark:text-white flex items-center gap-2">
                                Verrouiller les liens de réseaux sociaux
                            </label>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Si activé, les employés ne pourront pas ajouter ou modifier leurs liens LinkedIn, Twitter ou autres plateformes.</p>
                        </div>
                        <button
                            onClick={() => toggleLock('lockSocialLinks')}
                            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-slate-900 ${branding.lockSocialLinks ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'}`}
                        >
                            <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${branding.lockSocialLinks ? 'translate-x-5' : 'translate-x-0'}`}></span>
                        </button>
                    </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-4 flex items-center justify-end border-t border-slate-200 dark:border-slate-700 gap-3">
                    <button
                        onClick={fetchBranding}
                        className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                    >
                        Annuler
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-primary border border-transparent rounded-lg shadow-sm hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all disabled:opacity-50"
                    >
                        <span className="material-icons text-sm mr-2">{isSaving ? 'sync' : 'save'}</span>
                        {isSaving ? 'Enregistrement...' : 'Enregistrer les modifications'}
                    </button>
                </div>
            </div>

            <div className="flex gap-4 p-4 bg-primary/10 rounded-lg border border-primary/20">
                <span className="material-icons text-primary">tips_and_updates</span>
                <div>
                    <h4 className="text-sm font-semibold text-primary mb-1">Astuce Branding</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Verrouiller la photo de profil est recommandé si vous avez récemment organisé une séance photo professionnelle pour vos équipes.</p>
                </div>
            </div>
        </main>
    );
}
