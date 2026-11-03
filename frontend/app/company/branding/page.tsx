'use client';

import { useState, useEffect, useRef } from 'react';
import { apiClient } from '@/lib/api-client';
import toast from 'react-hot-toast';

export default function BrandingPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const lightLogoInputRef = useRef<HTMLInputElement>(null);
    const darkLogoInputRef = useRef<HTMLInputElement>(null);

    // State matching Prisma CompanyBranding model
    const [branding, setBranding] = useState({
        logoLightUrl: '',
        logoDarkUrl: '',
        primaryColor: '#2766ec',
        fontFamily: 'Inter',
        lockPhoto: false,
        lockJobTitle: false,
        lockSocialLinks: false,
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
                setBranding({
                    logoLightUrl: data.logoLightUrl || '',
                    logoDarkUrl: data.logoDarkUrl || '',
                    primaryColor: data.primaryColor || '#2766ec',
                    fontFamily: data.fontFamily || 'Inter',
                    lockPhoto: Boolean(data.lockPhoto),
                    lockJobTitle: Boolean(data.lockJobTitle),
                    lockSocialLinks: Boolean(data.lockSocialLinks),
                    forceLogo: Boolean(data.forceLogo),
                });
                setPreviewColor(data.primaryColor || '#2766ec');
            }
        } catch (error) {
            console.error('Error fetching branding:', error);
            toast.error('Erreur lors du chargement des paramètres');
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogoUpload = (type: 'light' | 'dark', e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
            toast.error('Le fichier ne doit pas dépasser 2 Mo');
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            const dataUrl = reader.result as string;
            setBranding(prev => ({
                ...prev,
                [type === 'light' ? 'logoLightUrl' : 'logoDarkUrl']: dataUrl
            }));
            toast.success(`Logo (${type === 'light' ? 'Fond Clair' : 'Fond Sombre'}) chargé ! Pensez à enregistrer.`);
        };
        reader.readAsDataURL(file);
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
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                <p className="text-apple-secondary font-medium animate-pulse tracking-tight">Chargement de l'identité visuelle...</p>
            </div>
        );
    }

    return (
        <main className="max-w-7xl mx-auto space-y-10 font-display animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-4xl md:text-5xl font-black text-apple-textDark dark:text-white tracking-tighter">Identité Visuelle</h1>
                    <p className="text-[11px] font-black uppercase tracking-[0.25em] text-apple-secondary dark:text-slate-500 mt-3">Configurez l'identité visuelle de votre entreprise sur l'ensemble de la plateforme.</p>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={handleDiscard}
                        className="px-8 h-14 rounded-full klik-glass border border-white/40 dark:border-white/10 hover:bg-white/80 dark:hover:bg-white/10 transition-all flex items-center gap-3 text-xs font-black uppercase tracking-widest text-apple-textDark dark:text-white shadow-sm cursor-pointer"
                    >
                        Annuler
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-10 h-14 rounded-full btn-titanium btn-titanium-primary shadow-2xl shadow-primary/30 flex items-center gap-3 text-xs font-black uppercase tracking-widest text-white transition-all disabled:opacity-50 cursor-pointer"
                    >
                        {isSaving ? (
                            <span className="material-symbols-outlined text-[22px] animate-spin">sync</span>
                        ) : (
                            <span className="material-symbols-outlined text-[22px]">save</span>
                        )}
                        {isSaving ? 'Enregistrement...' : 'Enregistrer'}
                    </button>
                </div>
            </div>

            <div className="py-2">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Settings Form */}
                    <div className="w-full lg:w-3/5 space-y-8">
                        {/* Logo Section */}
                        <div className="klik-glass p-8 rounded-[32px] border border-white/40 dark:border-white/5 shadow-lg">
                            <div className="mb-6">
                                <h2 className="text-2xl font-black text-apple-textDark dark:text-white tracking-tight">Logo de la marque</h2>
                                <p className="text-[10px] font-bold text-apple-secondary uppercase tracking-widest mt-2">Téléchargez votre logo pour les fonds clairs et sombres. SVG ou PNG recommandé.</p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Light Logo */}
                                <div>
                                    <label className="block text-[11px] font-black text-apple-textDark dark:text-white uppercase tracking-widest mb-3">Logo (Fond Clair)</label>
                                    <input
                                        ref={lightLogoInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleLogoUpload('light', e)}
                                        className="hidden"
                                    />
                                    <div
                                        onClick={() => lightLogoInputRef.current?.click()}
                                        className="relative group border-2 border-dashed border-gray-300 dark:border-white/20 rounded-[24px] p-6 flex flex-col items-center justify-center text-center hover:border-primary hover:bg-primary/5 transition-all cursor-pointer min-h-[200px] klik-glass"
                                    >
                                        {branding.logoLightUrl ? (
                                            <div className="flex flex-col items-center gap-3">
                                                <img src={branding.logoLightUrl} alt="Logo Clair" className="max-h-24 max-w-[180px] object-contain rounded-lg" />
                                                <div className="flex gap-2 mt-2">
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-primary underline">Changer</span>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setBranding(prev => ({ ...prev, logoLightUrl: '' }));
                                                        }}
                                                        className="text-[10px] font-black uppercase tracking-widest text-rose-500 hover:underline"
                                                    >
                                                        Supprimer
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="mb-4 w-14 h-14 bg-white dark:bg-[#1C1C1E] rounded-full shadow-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                                                    <span className="material-symbols-outlined text-primary text-2xl">upload_file</span>
                                                </div>
                                                <span className="text-sm font-black text-primary tracking-tight">Cliquer pour charger</span>
                                                <span className="text-xs text-apple-secondary font-medium mt-1">ou glisser-déposer</span>
                                                <span className="text-[9px] font-black text-apple-secondary uppercase tracking-[0.2em] mt-4 opacity-70">SVG, PNG, JPG (max 2MB)</span>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Dark Logo */}
                                <div>
                                    <label className="block text-[11px] font-black text-apple-textDark dark:text-white uppercase tracking-widest mb-3">Logo (Fond Sombre)</label>
                                    <input
                                        ref={darkLogoInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleLogoUpload('dark', e)}
                                        className="hidden"
                                    />
                                    <div
                                        onClick={() => darkLogoInputRef.current?.click()}
                                        className="relative group border-2 border-dashed border-gray-600 dark:border-white/20 rounded-[24px] p-6 flex flex-col items-center justify-center text-center bg-[#1C1C1E] transition-all cursor-pointer min-h-[200px] hover:border-primary/50"
                                    >
                                        {branding.logoDarkUrl ? (
                                            <div className="flex flex-col items-center gap-3">
                                                <img src={branding.logoDarkUrl} alt="Logo Sombre" className="max-h-24 max-w-[180px] object-contain rounded-lg" />
                                                <div className="flex gap-2 mt-2">
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-white/80 underline">Changer</span>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setBranding(prev => ({ ...prev, logoDarkUrl: '' }));
                                                        }}
                                                        className="text-[10px] font-black uppercase tracking-widest text-rose-400 hover:underline"
                                                    >
                                                        Supprimer
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="mb-4 w-14 h-14 bg-white/10 rounded-full shadow-lg flex items-center justify-center backdrop-blur-md group-hover:scale-110 transition-transform">
                                                    <span className="material-symbols-outlined text-white/70 text-2xl">upload_file</span>
                                                </div>
                                                <span className="text-sm font-black text-white/90 tracking-tight">Charger le logo blanc</span>
                                                <span className="text-[9px] font-black text-white/50 uppercase tracking-[0.2em] mt-4">SVG, PNG, JPG (max 2MB)</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Colors Section */}
                        <div className="klik-glass p-8 rounded-[32px] border border-white/40 dark:border-white/5 shadow-lg">
                            <div className="mb-6">
                                <h2 className="text-2xl font-black text-apple-textDark dark:text-white tracking-tight">Couleurs de la marque</h2>
                                <p className="text-[10px] font-bold text-apple-secondary uppercase tracking-widest mt-2">Sélectionnez votre couleur primaire. Elle sera utilisée pour les boutons et les liens.</p>
                            </div>
                            <div className="flex flex-col sm:flex-row items-start gap-8">
                                <div className="flex-1 w-full">
                                    <label className="block text-[11px] font-black text-apple-textDark dark:text-white uppercase tracking-widest mb-3">Couleur Primaire</label>
                                    <div className="flex items-center gap-4">
                                        <div className="h-14 w-14 rounded-[1.2rem] border border-white/20 shadow-lg overflow-hidden relative cursor-pointer ring-2 ring-offset-2 dark:ring-offset-[#1C1C1E] ring-transparent hover:ring-primary/50 transition-all flex-shrink-0">
                                            <input
                                                className="absolute -top-2 -left-2 w-20 h-20 cursor-pointer p-0 border-0"
                                                type="color"
                                                value={previewColor}
                                                onChange={(e) => setPreviewColor(e.target.value)}
                                            />
                                        </div>
                                        <div className="relative flex-1">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                <span className="text-apple-secondary font-black">#</span>
                                            </div>
                                            <input
                                                type="text"
                                                value={previewColor.replace('#', '')}
                                                onChange={(e) => setPreviewColor(`#${e.target.value}`)}
                                                className="pl-8 block w-full h-14 rounded-full border border-white/40 dark:border-white/10 bg-white/40 dark:bg-white/5 text-apple-textDark dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 uppercase font-mono tracking-widest text-sm font-bold shadow-sm transition-all"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="flex-1 w-full">
                                    <label className="block text-[11px] font-black text-apple-textDark dark:text-white uppercase tracking-widest mb-3">Aperçu</label>
                                    <div className="flex gap-3">
                                        <div
                                            className="h-14 w-full rounded-full shadow-lg flex items-center justify-center text-white text-[11px] font-black uppercase tracking-widest transition-colors"
                                            style={{ backgroundColor: previewColor }}
                                        >
                                            Bouton
                                        </div>
                                        <div
                                            className="h-14 w-full rounded-full border-2 flex items-center justify-center text-[11px] font-black uppercase tracking-widest transition-colors"
                                            style={{
                                                backgroundColor: `${previewColor}1A`,
                                                borderColor: `${previewColor}33`,
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
                        <div className="klik-glass p-8 rounded-[32px] border border-white/40 dark:border-white/5 shadow-lg">
                            <div className="mb-6">
                                <h2 className="text-2xl font-black text-apple-textDark dark:text-white tracking-tight">Typographie</h2>
                                <p className="text-[10px] font-bold text-apple-secondary uppercase tracking-widest mt-2">Choisissez une police qui correspond à l'identité de votre marque.</p>
                            </div>
                            <div>
                                <label className="block text-[11px] font-black text-apple-textDark dark:text-white uppercase tracking-widest mb-3">Police de caractères</label>
                                <div className="relative">
                                    <select
                                        className="block w-full pl-6 pr-12 h-14 text-sm font-black border border-white/40 dark:border-white/10 bg-white/40 dark:bg-white/5 text-apple-textDark dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 rounded-full shadow-sm appearance-none cursor-pointer transition-all"
                                        value={branding.fontFamily || 'Inter'}
                                        onChange={(e) => setBranding({ ...branding, fontFamily: e.target.value })}
                                    >
                                        <option value="Inter">Inter (Par défaut)</option>
                                        <option value="Roboto">Roboto</option>
                                        <option value="Open Sans">Open Sans</option>
                                        <option value="Montserrat">Montserrat</option>
                                        <option value="Poppins">Poppins</option>
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-5 text-apple-secondary">
                                        <span className="material-symbols-outlined text-[24px]">expand_more</span>
                                    </div>
                                </div>
                                <div className="mt-6 p-8 glass rounded-[24px] border border-white/20 dark:border-white/5 shadow-inner">
                                    <p className="text-3xl font-black text-apple-textDark dark:text-white mb-3 tracking-tighter" style={{ fontFamily: branding.fontFamily || 'Inter' }}>
                                        L'élégance est la seule beauté qui ne se fane jamais.
                                    </p>
                                    <p className="text-sm font-medium text-apple-secondary leading-relaxed" style={{ fontFamily: branding.fontFamily || 'Inter' }}>
                                        Voici un aperçu de votre police avec différents styles de texte. La typographie joue un rôle crucial dans la perception de votre marque.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Governance / Locks Section */}
                        <div className="klik-glass p-8 rounded-[32px] border border-white/40 dark:border-white/5 shadow-lg space-y-6">
                            <div>
                                <h2 className="text-2xl font-black text-apple-textDark dark:text-white tracking-tight">Gouvernance des Cartes</h2>
                                <p className="text-[10px] font-bold text-apple-secondary uppercase tracking-widest mt-2">Définissez les éléments que vos collaborateurs ne peuvent pas modifier.</p>
                            </div>
                            <div className="space-y-4">
                                {[
                                    { key: 'forceLogo', label: 'Imposer le logo de l\'entreprise sur toutes les cartes', desc: 'Affiche automatiquement votre logo sur les profils publics' },
                                    { key: 'lockJobTitle', label: 'Verrouiller l\'intitulé de poste', desc: 'Seul le Manager peut modifier la fonction des collaborateurs' },
                                    { key: 'lockPhoto', label: 'Verrouiller la photo de profil', desc: 'Empêche les collaborateurs de remplacer leur photo officielle' },
                                    { key: 'lockSocialLinks', label: 'Restreindre les réseaux sociaux personnels', desc: 'Seuls les liens validés par l\'entreprise sont affichés' },
                                ].map((item) => {
                                    const checked = Boolean((branding as any)[item.key]);
                                    return (
                                        <div
                                            key={item.key}
                                            onClick={() => setBranding(prev => ({ ...prev, [item.key]: !checked }))}
                                            className="flex items-center justify-between p-4 rounded-2xl bg-white/40 dark:bg-white/5 border border-white/40 dark:border-white/10 cursor-pointer hover:bg-white/60 dark:hover:bg-white/10 transition-all"
                                        >
                                            <div>
                                                <p className="text-sm font-bold text-apple-textDark dark:text-white">{item.label}</p>
                                                <p className="text-xs text-apple-secondary mt-0.5">{item.desc}</p>
                                            </div>
                                            <div className={`w-12 h-7 rounded-full p-1 transition-colors ${checked ? 'bg-primary' : 'bg-gray-300 dark:bg-white/20'}`}>
                                                <div className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Mobile Preview */}
                    <div className="w-full lg:w-2/5 flex flex-col items-center">
                        <div className="sticky top-28 w-full max-w-[340px]">
                            <h3 className="text-[11px] font-black text-apple-secondary uppercase tracking-[0.25em] text-center mb-8">Aperçu Mobile</h3>

                            <div className="relative mx-auto w-full aspect-[9/19] bg-[#1C1C1E] rounded-[3.5rem] shadow-2xl border-[12px] border-[#1C1C1E] overflow-hidden ring-1 ring-white/10">
                                {/* Notch */}
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 h-7 w-36 bg-[#1C1C1E] z-30 rounded-b-3xl"></div>

                                <div className="bg-white h-full w-full overflow-hidden flex flex-col relative transition-all duration-300" style={{ fontFamily: branding.fontFamily || 'Inter' }}>
                                    {/* Card Header Background */}
                                    <div className="h-40 transition-colors duration-500 relative" style={{ backgroundColor: previewColor }}>
                                        <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-transparent"></div>
                                        <div className="absolute top-12 left-0 right-0 px-6 flex justify-between items-center text-white z-20">
                                            <span className="material-symbols-outlined text-2xl">menu</span>
                                            {branding.logoDarkUrl || branding.logoLightUrl ? (
                                                <img
                                                    src={branding.logoDarkUrl || branding.logoLightUrl}
                                                    alt="Logo"
                                                    className="h-6 max-w-[100px] object-contain"
                                                />
                                            ) : (
                                                <span className="text-sm font-bold tracking-tight">Profil</span>
                                            )}
                                            <span className="material-symbols-outlined text-2xl">notifications</span>
                                        </div>
                                    </div>

                                    {/* Profile Content */}
                                    <div className="-mt-16 px-6 flex flex-col items-center relative z-20">
                                        <div className="h-28 w-28 rounded-[2rem] bg-white p-1 shadow-2xl mb-4 border border-gray-100">
                                            <div className="h-full w-full rounded-[1.8rem] bg-gray-100 flex items-center justify-center text-gray-400">
                                                <span className="material-symbols-outlined text-5xl">person</span>
                                            </div>
                                        </div>
                                        <h2 className="text-2xl font-black text-gray-900 tracking-tight">David Miller</h2>
                                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1 mb-6">Directeur Produit @ CorpTech</p>

                                        {/* Action Buttons */}
                                        <div className="w-full grid grid-cols-2 gap-4 mb-8">
                                            <button
                                                className="text-white h-12 rounded-xl text-xs font-black uppercase tracking-widest shadow-xl transition-all duration-300 flex items-center justify-center"
                                                style={{ backgroundColor: previewColor, boxShadow: `0 8px 24px -6px ${previewColor}80` }}
                                            >
                                                Contact
                                            </button>
                                            <button className="bg-white border-2 border-gray-200 text-gray-800 h-12 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center">
                                                Message
                                            </button>
                                        </div>
                                    </div>

                                    {/* Links List Preview */}
                                    <div className="flex-1 bg-gray-50 px-6 py-4 space-y-4 overflow-hidden rounded-t-[2rem] border-t border-gray-100">
                                        {[1, 2, 3].map((i) => (
                                            <div key={i} className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm flex items-center space-x-4">
                                                <div
                                                    className="h-10 w-10 rounded-xl flex items-center justify-center transition-all"
                                                    style={{ backgroundColor: `${previewColor}1A`, color: previewColor }}
                                                >
                                                    <span className="material-symbols-outlined text-xl">{i === 1 ? 'badge' : i === 2 ? 'link' : 'business'}</span>
                                                </div>
                                                <div className="flex-1">
                                                    <div className="h-2.5 w-24 bg-gray-200 rounded-full mb-2"></div>
                                                    <div className="h-2 w-16 bg-gray-100 rounded-full"></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Bottom Nav */}
                                    <div className="h-20 bg-white/80 backdrop-blur-xl border-t border-gray-100 flex justify-around items-center px-6 pb-4 absolute bottom-0 w-full z-30">
                                        <div className="flex flex-col items-center" style={{ color: previewColor }}>
                                            <span className="material-symbols-outlined text-2xl">home</span>
                                            <span className="text-[9px] font-black uppercase tracking-widest mt-1">Accueil</span>
                                        </div>
                                        <div className="flex flex-col items-center text-gray-300">
                                            <span className="material-symbols-outlined text-2xl">search</span>
                                        </div>
                                        <div className="flex flex-col items-center text-gray-300">
                                            <span className="material-symbols-outlined text-2xl">person</span>
                                        </div>
                                    </div>

                                    {/* Home Indicator */}
                                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1.5 bg-black rounded-full z-40"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
