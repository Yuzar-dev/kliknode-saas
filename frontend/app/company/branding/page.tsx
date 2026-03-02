'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { endpoints } from '@/lib/api-config';
import toast from 'react-hot-toast';

export default function BrandingPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // State matching Prisma CompanyBranding model
    const [branding, setBranding] = useState({
        logoLightUrl: '',
        logoDarkUrl: '',
        primaryColor: '#2766ec',
        fontFamily: 'Inter',
        lockPhoto: false,
        lockJobTitle: false,
        forceLogo: false
    });

    const [previewColor, setPreviewColor] = useState('#2766ec');

    useEffect(() => {
        fetchBranding();
    }, []);

    const fetchBranding = async () => {
        setIsLoading(true);
        try {
            const response = await apiClient.get('/api/company/branding');
            if (response.data.success) {
                const data = response.data.data;
                setBranding(data);
                setPreviewColor(data.primaryColor || '#2766ec');
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
            const response = await apiClient.patch('/api/company/branding', {
                ...branding,
                primaryColor: previewColor
            });
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

    const handleDiscard = () => {
        fetchBranding();
        toast.success('Changements annulés');
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <main className="max-w-7xl mx-auto space-y-8 font-display">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Identité Visuelle</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Configurez l'identité visuelle de votre entreprise sur l'ensemble de la plateforme.</p>
                </div>
                <div className="flex space-x-3 w-full sm:w-auto">
                    <button
                        onClick={handleDiscard}
                        className="flex-1 sm:flex-none px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-200 transition-all"
                    >
                        Annuler
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex-1 sm:flex-none px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-lg shadow-sm shadow-primary/20 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-slate-900 transition-all disabled:opacity-50"
                    >
                        {isSaving ? 'Enregistrement...' : 'Enregistrer'}
                    </button>
                </div>
            </header>

            <div className="py-2">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Settings Form */}
                    <div className="w-full lg:w-3/5 space-y-6">
                        {/* Logo Section */}
                        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
                            <div className="mb-5">
                                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Logo de la marque</h2>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Téléchargez votre logo pour les fonds clairs et sombres. SVG ou PNG recommandé.</p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Logo (Fond Clair)</label>
                                    <div className="relative group border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg p-6 flex flex-col items-center justify-center text-center hover:border-primary/50 hover:bg-primary/5 transition-colors cursor-pointer min-h-[160px]">
                                        <div className="mb-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-full shadow-sm">
                                            <span className="material-icons text-slate-400">upload_file</span>
                                        </div>
                                        <span className="text-sm text-primary font-medium">Cliquer pour charger</span>
                                        <span className="text-xs text-slate-400 mt-1">ou glisser-déposer</span>
                                        <span className="text-xs text-slate-300 dark:text-slate-600 mt-4 uppercase">SVG, PNG, JPG (max 2MB)</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Logo (Fond Sombre)</label>
                                    <div className="relative group border border-slate-200 dark:border-slate-700 rounded-lg p-6 flex flex-col items-center justify-center text-center bg-slate-900 min-h-[160px]">
                                        <div className="mb-3 p-3 bg-slate-800 rounded-full shadow-sm">
                                            <span className="material-icons text-slate-500">upload_file</span>
                                        </div>
                                        <span className="text-sm text-slate-400 font-medium">Charger le logo blanc</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Colors Section */}
                        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
                            <div className="mb-5">
                                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Couleurs de la marque</h2>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Sélectionnez votre couleur primaire. Elle sera utilisée pour les boutons et les liens.</p>
                            </div>
                            <div className="flex flex-col sm:flex-row items-start gap-6">
                                <div className="flex-1 w-full">
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Couleur Primaire</label>
                                    <div className="flex items-center space-x-3">
                                        <div className="h-10 w-10 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden relative cursor-pointer ring-2 ring-offset-2 dark:ring-offset-slate-900 ring-transparent hover:ring-primary/50 transition-all">
                                            <input
                                                className="absolute -top-2 -left-2 w-16 h-16 cursor-pointer p-0 border-0"
                                                type="color"
                                                value={previewColor}
                                                onChange={(e) => setPreviewColor(e.target.value)}
                                            />
                                        </div>
                                        <div className="relative flex-1">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <span className="text-slate-400 text-sm">#</span>
                                            </div>
                                            <input
                                                type="text"
                                                value={previewColor.replace('#', '')}
                                                onChange={(e) => setPreviewColor(`#${e.target.value}`)}
                                                className="pl-7 block w-full rounded-lg border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white sm:text-sm focus:ring-primary focus:border-primary uppercase font-mono tracking-wider"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="flex-1 w-full">
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Aperçu</label>
                                    <div className="flex space-x-2">
                                        <div
                                            className="h-10 w-full rounded-lg shadow-sm flex items-center justify-center text-white text-xs font-medium transition-colors"
                                            style={{ backgroundColor: previewColor }}
                                        >
                                            Bouton
                                        </div>
                                        <div
                                            className="h-10 w-full rounded-lg border flex items-center justify-center text-xs font-medium transition-colors"
                                            style={{
                                                backgroundColor: `${previewColor}1A`, // 10% opacity
                                                borderColor: `${previewColor}33`, // 20% opacity
                                                color: previewColor
                                            }}
                                        >
                                            Étiquette
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Typography Section */}
                        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
                            <div className="mb-5">
                                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Typographie</h2>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Choisissez une police qui correspond à l'identité de votre marque.</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Police de caractères</label>
                                <select
                                    className="block w-full pl-3 pr-10 py-2.5 text-base border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-lg"
                                    value={branding.fontFamily || 'Inter'}
                                    onChange={(e) => setBranding({ ...branding, fontFamily: e.target.value })}
                                >
                                    <option value="Inter">Inter (Par défaut)</option>
                                    <option value="Roboto">Roboto</option>
                                    <option value="Open Sans">Open Sans</option>
                                    <option value="Montserrat">Montserrat</option>
                                </select>
                                <div className="mt-4 p-6 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700">
                                    <p className="text-2xl font-bold text-slate-900 dark:text-white mb-2" style={{ fontFamily: branding.fontFamily || 'Inter' }}>
                                        L'élégance est la seule beauté qui ne se fane jamais.
                                    </p>
                                    <p className="text-base text-slate-600 dark:text-slate-400" style={{ fontFamily: branding.fontFamily || 'Inter' }}>
                                        Voici un aperçu de votre police avec différents styles de texte.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Mobile Preview */}
                    <div className="w-full lg:w-2/5 flex flex-col items-center">
                        <div className="sticky top-28 w-full max-w-[320px]">
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest text-center mb-6">Aperçu Mobile</h3>

                            <div className="relative mx-auto w-full aspect-[9/18.5] bg-slate-900 rounded-[3rem] shadow-2xl border-8 border-slate-900 overflow-hidden ring-1 ring-slate-900/5">
                                {/* Notch */}
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 h-6 w-32 bg-slate-900 z-20 rounded-b-2xl"></div>

                                <div className="bg-white h-full w-full overflow-hidden flex flex-col relative transition-all duration-300" style={{ fontFamily: branding.fontFamily || 'Inter' }}>
                                    {/* Card Header Background */}
                                    <div className="h-32 transition-colors duration-500" style={{ backgroundColor: previewColor }}>
                                        <div className="absolute top-10 left-0 right-0 px-4 flex justify-between items-center text-white">
                                            <span className="material-icons text-xl">menu</span>
                                            <span className="text-sm font-medium opacity-90">Profil</span>
                                            <span className="material-icons text-xl">notifications</span>
                                        </div>
                                    </div>

                                    {/* Profile Content */}
                                    <div className="-mt-12 px-4 flex flex-col items-center relative z-10">
                                        <div className="h-24 w-24 rounded-full bg-white p-1 shadow-lg mb-3">
                                            <div className="h-full w-full rounded-full bg-slate-100 flex items-center justify-center text-slate-300">
                                                <span className="material-icons text-4xl">person</span>
                                            </div>
                                        </div>
                                        <h2 className="text-xl font-bold text-slate-900">David Miller</h2>
                                        <p className="text-xs text-slate-500 mb-4">Directeur Produit @ CorpTech</p>

                                        {/* Action Buttons */}
                                        <div className="w-full grid grid-cols-2 gap-3 mb-6">
                                            <button
                                                className="text-white py-2.5 rounded-lg text-xs font-semibold shadow-lg transition-all duration-300"
                                                style={{ backgroundColor: previewColor, boxShadow: `0 4px 14px 0 ${previewColor}40` }}
                                            >
                                                Contact
                                            </button>
                                            <button className="bg-white border border-slate-200 text-slate-700 py-2.5 rounded-lg text-xs font-semibold">
                                                Message
                                            </button>
                                        </div>
                                    </div>

                                    {/* Links List Preview */}
                                    <div className="flex-1 bg-slate-50 px-4 py-4 space-y-3 overflow-hidden">
                                        {[1, 2, 3].map((i) => (
                                            <div key={i} className="p-3 bg-white rounded-lg border border-slate-100 shadow-sm flex items-center space-x-3">
                                                <div
                                                    className="h-8 w-8 rounded-lg flex items-center justify-center transition-all"
                                                    style={{ backgroundColor: `${previewColor}1A`, color: previewColor }}
                                                >
                                                    <span className="material-icons text-sm">{i === 1 ? 'badge' : i === 2 ? 'link' : 'business'}</span>
                                                </div>
                                                <div className="flex-1">
                                                    <div className="h-2 w-24 bg-slate-200 rounded mb-1.5"></div>
                                                    <div className="h-1.5 w-16 bg-slate-100 rounded"></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Bottom Nav */}
                                    <div className="h-16 bg-white border-t border-slate-100 flex justify-around items-center px-4 pb-2">
                                        <div className="flex flex-col items-center" style={{ color: previewColor }}>
                                            <span className="material-icons text-xl">home</span>
                                            <span className="text-[10px] font-bold mt-1">Accueil</span>
                                        </div>
                                        <div className="flex flex-col items-center text-slate-300">
                                            <span className="material-icons text-xl">search</span>
                                        </div>
                                        <div className="flex flex-col items-center text-slate-300">
                                            <span className="material-icons text-xl">person</span>
                                        </div>
                                    </div>

                                    {/* Home Indicator */}
                                    <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-24 h-1 bg-slate-200 rounded-full"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
