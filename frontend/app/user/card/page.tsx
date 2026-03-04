'use client';

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import toast from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';
import CardPreview, { COVER_PRESETS } from '@/components/user/CardPreview';

interface CardData {
    id: string;
    firstName: string; lastName: string;
    jobTitle: string; companyName: string;
    bio: string; email: string;
    phoneMobile: string; phoneOffice: string;
    city: string; country: string;
    website: string;
    avatarUrl: string; coverUrl: string;
    primaryColor: string;
    theme: string;
    bioVisible: boolean;
    socialLinks: any[];
    publicSlug?: string;
}

const COLOR_PRESETS = [
    '#0666EB', '#7C3AED', '#059669', '#D97706', '#DB2777', '#0891B2', '#DC2626', '#374151'
];

const formatUrl = (url: string) => {
    if (!url) return '';
    let trimmed = url.trim();
    if (trimmed.match(/^[a-z0-9]+:\/\//i) || trimmed.startsWith('mailto:') || trimmed.startsWith('tel:')) {
        return trimmed;
    }
    return `https://${trimmed}`;
};

export default function CardEditorPage() {
    const [card, setCard] = useState<CardData | null>(null);
    const [form, setForm] = useState<Partial<CardData>>({});
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'identity' | 'style'>('identity');
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const avatarInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => { loadCard(); }, []);

    const loadCard = async () => {
        setLoading(true);
        try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase.from('cards').select('*').eq('user_id', user.id).single();
            if (error && error.code !== 'PGRST116') throw error;

            if (data) {
                const mappedData = {
                    id: data.id,
                    firstName: data.first_name || '', lastName: data.last_name || '',
                    jobTitle: data.job_title || '', companyName: data.company_name || '',
                    bio: data.bio || '', email: data.email || '',
                    phoneMobile: data.phone_mobile || '', phoneOffice: data.phone_office || '',
                    city: data.city || '', country: data.country || '',
                    website: data.website || '',
                    avatarUrl: data.avatar_url || '', coverUrl: data.cover_url || '',
                    primaryColor: data.primary_color || '#0666EB',
                    theme: data.theme || 'light',
                    bioVisible: data.bio_visible !== false, // Default to true
                    socialLinks: data.social_links || [],
                    publicSlug: data.public_slug || user.id, // Fallback to user.id for slug
                };
                setCard(mappedData as any);
                setForm(mappedData);
            } else {
                // If no card exists yet, pull the basic details from user
                const { data: userData } = await supabase.from('users').select('first_name, last_name, email').eq('id', user.id).single();
                if (userData) {
                    setForm({
                        firstName: userData.first_name || '', lastName: userData.last_name || '', email: userData.email || '', primaryColor: '#0666EB', theme: 'light', bioVisible: true
                    });
                }
            }
        } catch (e: any) {
            console.error(e);
            toast.error('Erreur lors du chargement');
        } finally { setLoading(false); }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Non authentifié');

            const formattedWebsite = formatUrl(form.website || '');

            const updatePayload = {
                id: card?.id || uuidv4(),
                user_id: user.id,
                first_name: form.firstName, last_name: form.lastName,
                job_title: form.jobTitle, company_name: form.companyName,
                bio: form.bio, phone_mobile: form.phoneMobile,
                phone_office: form.phoneOffice, city: form.city, country: form.country,
                website: formattedWebsite,
                cover_url: form.coverUrl, primary_color: form.primaryColor, theme: form.theme,
                bio_visible: form.bioVisible,
                avatar_url: form.avatarUrl,
                public_slug: card?.publicSlug || user.id, // Make sure public_slug is saved during upsert
                updated_at: new Date().toISOString(),
            };

            const { error } = await supabase.from('cards').upsert(updatePayload, { onConflict: 'user_id' });
            if (error) throw error;

            if (!card?.socialLinks?.length) {
                toast((t) => (
                    <div className="flex flex-col gap-2">
                        <span className="font-bold">Carte sauvegardée ! 🎉</span>
                        <span className="text-sm">N'oubliez pas d'ajouter vos réseaux sociaux.</span>
                        <a href="/user/links" onClick={() => toast.dismiss(t.id)} className="bg-blue-500 text-white text-xs px-3 py-1.5 rounded-lg text-center font-bold mt-1 hover:bg-blue-600 transition-colors">
                            Ajouter mes liens
                        </a>
                    </div>
                ), { duration: 6000 });
            } else {
                toast.success('Carte sauvegardée !');
            }
            setCard({ ...form, website: formattedWebsite } as any);
        } catch (err: any) {
            toast.error(err.message || 'Erreur');
        } finally { setSaving(false); }
    };

    const handleAvatarUpload = async (file: File) => {
        const localUrl = URL.createObjectURL(file);
        setForm(f => ({ ...f, avatarUrl: localUrl }));
        setUploadingAvatar(true);
        try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Non authentifié');

            const fileExt = file.name.split('.').pop() || 'png';
            const fileName = `${user.id}-${Date.now()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file, { upsert: true });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            setForm(f => ({ ...f, avatarUrl: publicUrl }));
            await supabase.from('cards').upsert({ id: card?.id || uuidv4(), user_id: user.id, avatar_url: publicUrl, public_slug: card?.publicSlug || user.id, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
            toast.success('Photo mise à jour !');
        } catch (e: any) {
            console.error(e);
            toast.error('Erreur upload — URL locale conservée');
        } finally { setUploadingAvatar(false); }
    };

    const set = (key: keyof CardData, value: string) => setForm(f => ({ ...f, [key]: value }));

    const [showMobilePreview, setShowMobilePreview] = useState(false);

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="animate-spin h-10 w-10 border-4 border-spaceGray dark:border-white border-t-transparent rounded-full" />
        </div>
    );

    return (
        <div className="flex flex-col lg:flex-row gap-10 items-start min-h-screen selection:bg-slate-200 px-4 md:px-0 relative">
            {/* ─── Left: Editor ─── */}
            <div className="flex-1 min-w-0 pb-20 w-full">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-black text-apple-textDark dark:text-white tracking-tight">Ma Carte</h1>
                        <p className="text-apple-secondary dark:text-gray-400 font-bold text-sm mt-2">Personnalisez votre identité numérique premium</p>
                    </div>
                </div>

                {/* Tabs - Titanium Style */}
                <div className="flex gap-2 p-1.5 md:p-2 klik-glass rounded-[2rem] mb-10 w-fit border border-white/60 dark:border-white/5 shadow-sm overflow-x-auto no-scrollbar">
                    {[
                        { id: 'identity', label: 'Identité', icon: 'person' },
                        { id: 'style', label: 'Design', icon: 'palette' },
                    ].map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-2.5 px-6 md:px-8 py-2.5 md:py-3 rounded-[1.5rem] text-sm font-bold transition-all duration-500 shrink-0 ${activeTab === tab.id
                                ? 'bg-white dark:bg-[#1C1C1E] text-apple-textDark dark:text-white shadow-xl border border-gray-100 dark:border-white/10'
                                : 'text-apple-secondary dark:text-gray-400 hover:text-apple-textDark dark:hover:text-white'
                                }`}
                        >
                            <span className="material-symbols-outlined text-[20px] font-light">{tab.icon}</span>
                            <span className="tracking-tight">{tab.label}</span>
                        </button>
                    ))}
                </div>

                {activeTab === 'identity' && (
                    <div className="space-y-6 md:space-y-8">
                        {/* Avatar Section */}
                        <div className="klik-glass p-6 md:p-10 rounded-[2rem] md:rounded-[2.5rem] border border-white/60 dark:border-white/5 shadow-lg relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-gray-100 dark:bg-white/5 blur-3xl opacity-30 -mr-16 -mt-16 group-hover:opacity-50 transition-all duration-700" />
                            <h3 className="text-[10px] md:text-xs font-black uppercase tracking-[0.25em] text-apple-secondary dark:text-gray-500 mb-6 md:mb-8 px-1">Photo de profil</h3>
                            <div className="flex flex-col sm:flex-row items-center gap-6 md:gap-10">
                                <div className="relative group shrink-0">
                                    <div className="w-24 h-24 md:w-28 md:h-28 rounded-[2rem] md:rounded-[2.5rem] overflow-hidden shadow-2xl bg-white dark:bg-black border-2 border-white dark:border-white/10 p-1 md:p-1.5 flex items-center justify-center">
                                        <div className="w-full h-full rounded-[1.6rem] md:rounded-[2rem] bg-gray-100/50 flex items-center justify-center overflow-hidden">
                                            {form.avatarUrl ? (
                                                <img
                                                    src={form.avatarUrl}
                                                    alt="Avatar"
                                                    className="w-full h-full object-cover object-center"
                                                />
                                            ) : (
                                                <span className="text-apple-secondary text-2xl md:text-3xl font-black">
                                                    {form.firstName?.[0] || ''}{form.lastName?.[0] || ''}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    {uploadingAvatar && (
                                        <div className="absolute inset-0 rounded-[2.5rem] bg-white/60 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center z-20">
                                            <div className="animate-spin h-8 w-8 border-4 border-spaceGray dark:border-titanium border-t-transparent rounded-full" />
                                        </div>
                                    )}
                                </div>
                                <div className="flex flex-col gap-3 w-full sm:w-auto">
                                    <button
                                        onClick={() => avatarInputRef.current?.click()}
                                        className="flex items-center justify-center gap-2.5 px-6 py-3 rounded-2xl text-sm font-bold bg-white dark:bg-white/5 hover:bg-gray-50 dark:hover:bg-white/10 transition-all border border-gray-100 dark:border-white/10 text-apple-textDark dark:text-white shadow-sm active:scale-95"
                                    >
                                        <span className="material-symbols-outlined text-[20px] font-light">photo_camera</span>
                                        Charger une image
                                    </button>
                                    {form.avatarUrl && (
                                        <button
                                            onClick={async () => {
                                                set('avatarUrl', '');
                                                if (card?.id) {
                                                    try {
                                                        const supabase = createClient();
                                                        await supabase.from('cards').update({ avatar_url: null }).eq('id', card.id);
                                                        toast.success('Photo supprimée');
                                                    } catch (e) {
                                                        console.error(e);
                                                    }
                                                }
                                            }}
                                            className="flex items-center justify-center gap-2.5 px-6 py-3 rounded-2xl text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all border border-red-50 dark:border-red-900/10 active:scale-95"
                                        >
                                            <span className="material-symbols-outlined text-[20px] font-light">delete</span>
                                            Supprimer
                                        </button>
                                    )}
                                </div>
                                <input
                                    ref={avatarInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={e => e.target.files?.[0] && handleAvatarUpload(e.target.files[0])}
                                />
                            </div>
                        </div>

                        {/* Identity Controls */}
                        <div className="klik-glass p-6 md:p-10 rounded-[2rem] md:rounded-[2.5rem] border border-white/60 dark:border-white/5 shadow-lg">
                            <h3 className="text-[10px] md:text-xs font-black uppercase tracking-[0.25em] text-apple-secondary dark:text-gray-500 mb-8 md:mb-10 px-1">Informations de base</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-x-10 md:gap-y-8">
                                {[
                                    { key: 'firstName', label: 'Prénom *' },
                                    { key: 'lastName', label: 'Nom *' },
                                    { key: 'jobTitle', label: 'Fonction' },
                                    { key: 'companyName', label: 'Entreprise' },
                                ].map(f => (
                                    <div key={f.key} className="space-y-3 group/input">
                                        <label className="block text-[10px] md:text-[11px] font-black text-apple-secondary dark:text-gray-500 uppercase tracking-widest ml-1 group-focus-within/input:text-apple-textDark dark:group-focus-within/input:text-white transition-colors">{f.label}</label>
                                        <input
                                            type="text"
                                            value={(form as any)[f.key] || ''}
                                            onChange={e => set(f.key as any, e.target.value)}
                                            className="w-full rounded-[1.2rem] border border-gray-100 dark:border-white/5 bg-white/50 dark:bg-black/20 px-5 py-3.5 md:py-4 text-base text-apple-textDark dark:text-white focus:outline-none focus:ring-1 focus:ring-apple-bgLight dark:focus:ring-white/10 focus:bg-white dark:focus:bg-black/40 transition-all font-medium placeholder:text-gray-300 dark:placeholder:text-gray-600"
                                        />
                                    </div>
                                ))}
                            </div>
                            <div className="mt-8 md:mt-10 space-y-3 group/input">
                                <div className="flex items-center justify-between ml-1 mb-1">
                                    <label className="block text-[10px] md:text-[11px] font-black text-apple-secondary dark:text-gray-500 uppercase tracking-widest group-focus-within/input:text-apple-textDark dark:group-focus-within/input:text-white transition-colors">Bio / Slogan</label>
                                    <div className="flex items-center gap-3">
                                        <span className="text-[10px] font-black text-apple-secondary uppercase tracking-widest">{form.bioVisible ? 'Affichée' : 'Masquée'}</span>
                                        <button
                                            onClick={() => setForm(f => ({ ...f, bioVisible: !f.bioVisible }))}
                                            className={`relative w-10 h-5 rounded-full transition-all duration-300 ${form.bioVisible ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-gray-800'}`}
                                        >
                                            <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300 ${form.bioVisible ? 'left-5.5' : 'left-0.5'}`} />
                                        </button>
                                    </div>
                                </div>
                                <textarea
                                    rows={3}
                                    value={form.bio || ''}
                                    onChange={e => set('bio', e.target.value)}
                                    className="w-full rounded-[1.5rem] border border-gray-100 dark:border-white/5 bg-white/50 dark:bg-black/20 px-5 py-4 text-base text-apple-textDark dark:text-white focus:outline-none focus:ring-1 focus:ring-apple-bgLight dark:focus:ring-white/10 focus:bg-white dark:focus:bg-black/40 transition-all resize-none font-medium leading-relaxed"
                                    placeholder="Racontez votre histoire..."
                                />
                            </div>
                        </div>

                        {/* Contact Controls */}
                        <div className="klik-glass p-6 md:p-10 rounded-[2rem] md:rounded-[2.5rem] border border-white/60 dark:border-white/5 shadow-lg">
                            <h3 className="text-[10px] md:text-xs font-black uppercase tracking-[0.25em] text-apple-secondary dark:text-gray-500 mb-8 md:mb-10 px-1">Coordonnées</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-x-10 md:gap-y-8">
                                {[
                                    { key: 'email', label: 'Email Professionnel', type: 'email' },
                                    { key: 'phoneMobile', label: 'Mobile', type: 'tel' },
                                    { key: 'website', label: 'Site Web', type: 'url' },
                                    { key: 'city', label: 'Ville', type: 'text' },
                                    { key: 'country', label: 'Pays', type: 'text' },
                                ].map(f => (
                                    <div key={f.key} className="space-y-3 group/input">
                                        <label className="block text-[10px] md:text-[11px] font-black text-apple-secondary dark:text-gray-500 uppercase tracking-widest ml-1 group-focus-within/input:text-apple-textDark dark:group-focus-within/input:text-white transition-colors">{f.label}</label>
                                        <input
                                            type={f.type}
                                            value={(form as any)[f.key] || ''}
                                            onChange={e => set(f.key as any, e.target.value)}
                                            className="w-full rounded-[1.2rem] border border-gray-100 dark:border-white/5 bg-white/50 dark:bg-black/20 px-5 py-3.5 md:py-4 text-base text-apple-textDark dark:text-white focus:outline-none focus:ring-1 focus:ring-apple-bgLight dark:focus:ring-white/10 focus:bg-white dark:focus:bg-black/40 transition-all font-medium"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'style' && (
                    <div className="space-y-6 md:space-y-8">
                        {/* Cover / Background Style */}
                        <div className="klik-glass p-6 md:p-10 rounded-[2rem] md:rounded-[2.5rem] border border-white/60 dark:border-white/5 shadow-lg">
                            <h3 className="text-[10px] md:text-xs font-black uppercase tracking-[0.25em] text-apple-secondary dark:text-gray-500 mb-8 md:mb-10 px-1">Style Arrière-plan</h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-10">
                                {COVER_PRESETS.map(preset => (
                                    <button
                                        key={preset.value}
                                        onClick={() => set('coverUrl', preset.value)}
                                        className={`h-24 md:h-28 rounded-[1.5rem] md:rounded-[2rem] transition-all duration-500 relative overflow-hidden group border ${form.coverUrl === preset.value
                                            ? 'ring-4 ring-[#1C1C1E] dark:ring-white ring-offset-4 md:ring-offset-8 ring-offset-apple-bgLight dark:ring-offset-black scale-95 shadow-2xl border-transparent transition-transform'
                                            : 'hover:scale-[0.98] border-gray-100 dark:border-white/10'
                                            }`}
                                        style={{ background: preset.value === 'default' ? '#F5F5F7' : preset.value }}
                                    >
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                                        <span className={`absolute bottom-3 md:bottom-4 left-3 md:left-4 text-[9px] md:text-[11px] font-black uppercase tracking-widest drop-shadow-sm ${preset.value === 'default' ? 'text-gray-400' : 'text-white'
                                            }`}>
                                            {preset.label}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Accent Color */}
                        <div className="klik-glass p-6 md:p-10 rounded-[2rem] md:rounded-[2.5rem] border border-white/60 dark:border-white/5 shadow-lg">
                            <h3 className="text-[10px] md:text-xs font-black uppercase tracking-[0.25em] text-apple-secondary dark:text-gray-500 mb-8 md:mb-10 px-1">Couleur d'accentuation</h3>
                            <div className="flex flex-wrap items-center gap-4 md:gap-6">
                                <div className="grid grid-cols-4 sm:flex sm:flex-wrap items-center gap-4 md:gap-6 w-full sm:w-auto">
                                    {COLOR_PRESETS.map(c => (
                                        <button
                                            key={c}
                                            onClick={() => set('primaryColor', c)}
                                            className={`w-12 h-12 md:w-14 md:h-14 rounded-full transition-all duration-500 shadow-sm ${form.primaryColor === c ? 'ring-4 ring-[#1C1C1E] dark:ring-white ring-offset-4 md:ring-offset-8 ring-offset-apple-bgLight dark:ring-offset-black scale-110 shadow-2xl' : 'hover:scale-110'
                                                }`}
                                            style={{ background: c }}
                                        />
                                    ))}
                                </div>
                                <div className="flex items-center gap-4 p-2.5 pl-6 klik-glass rounded-full border border-gray-100 dark:border-white/5 shadow-sm w-full sm:w-auto mt-2 sm:mt-0">
                                    <span className="text-[10px] md:text-[11px] font-black text-apple-secondary dark:text-gray-500 uppercase tracking-widest">Couleur Perso</span>
                                    <input
                                        type="color"
                                        value={form.primaryColor || '#4B4B4C'}
                                        onChange={e => set('primaryColor', e.target.value)}
                                        className="w-10 h-10 rounded-full cursor-pointer bg-transparent border-none p-0 overflow-hidden shadow-sm shrink-0"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Save Button (Bottom) */}
                <div className="mt-10 flex justify-end">
                    <button onClick={handleSave} disabled={saving}
                        className="btn-obsidian btn-obsidian-primary h-14 flex items-center justify-center gap-2.5 px-8 rounded-full shadow-2xl active:scale-95 disabled:opacity-50 transition-all w-full md:w-auto"
                    >
                        <span className="material-symbols-outlined text-[22px] font-light">{saving ? 'hourglass_top' : 'save'}</span>
                        <span className="text-base font-bold tracking-tight">{saving ? 'Sauvegarde...' : 'Sauvegarder'}</span>
                    </button>
                </div>
            </div>

            {/* ─── Right: Live Preview (Sticky) ─── */}
            <div className="hidden lg:flex flex-col items-center gap-8 sticky top-28 w-[380px] xl:w-[400px] shrink-0">
                <div className="flex items-center gap-2.5 px-6 py-2 klik-glass rounded-full border border-white/60 dark:border-white/5 shadow-sm">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[11px] font-black text-apple-secondary dark:text-gray-400 uppercase tracking-widest">Aperçu en temps réel</span>
                </div>

                <div className="relative group transition-transform duration-1000 hover:scale-[1.01]">
                    <div className="absolute -inset-8 bg-gradient-to-tr from-gray-200/20 to-gray-100/10 dark:from-white/5 dark:to-transparent rounded-[64px] blur-3xl opacity-50 z-0" />
                    <div style={{ height: 'calc(100vh - 200px)', minHeight: 600, maxHeight: 750, overflowY: 'auto', position: 'relative' }} className="rounded-[4rem] z-10 transition-all duration-700 no-scrollbar">
                        <CardPreview
                            firstName={form.firstName}
                            lastName={form.lastName}
                            jobTitle={form.jobTitle}
                            companyName={form.companyName}
                            bio={form.bio}
                            email={form.email}
                            phoneMobile={form.phoneMobile}
                            city={form.city}
                            country={form.country}
                            avatarUrl={form.avatarUrl}
                            coverUrl={form.coverUrl}
                            primaryColor={form.primaryColor}
                            bioVisible={form.bioVisible}
                            socialLinks={card?.socialLinks || []}
                            scale={0.8}
                        />
                    </div>
                </div>

                <div className="flex flex-col items-center gap-4">
                    <a href={card?.id ? `/p/${(card as any).publicSlug}` : '#'}
                        target="_blank"
                        className="btn-obsidian btn-obsidian-secondary h-12 flex items-center justify-center gap-2.5 px-8 rounded-full shadow-lg border border-gray-200 dark:border-white/10 transition-all font-bold text-xs"
                    >
                        <span className="material-symbols-outlined text-[20px] font-light">visibility</span>
                        Voir le profil public
                    </a>
                </div>
            </div>

            {/* ─── Mobile Floating Preview Button ─── */}
            <button
                onClick={() => setShowMobilePreview(true)}
                className="lg:hidden fixed bottom-24 right-6 w-16 h-16 rounded-full bg-spaceGray dark:bg-titanium text-white dark:text-black shadow-2xl z-50 flex items-center justify-center active:scale-90 transition-all border-4 border-white/20 dark:border-black/20"
            >
                <span className="material-symbols-outlined text-[32px]">visibility</span>
            </button>

            {/* ─── Mobile Preview Modal ─── */}
            {showMobilePreview && (
                <div className="lg:hidden fixed inset-0 z-[100] bg-black/80 backdrop-blur-xl flex flex-col items-center justify-start overflow-y-auto pt-10 pb-20 no-scrollbar animate-in fade-in duration-300">
                    <div className="absolute top-6 right-6 z-[110]">
                        <button
                            onClick={() => setShowMobilePreview(false)}
                            className="w-12 h-12 rounded-full bg-white/10 text-white flex items-center justify-center backdrop-blur-md"
                        >
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </div>

                    <div className="relative w-full flex justify-center scale-90 sm:scale-100 transition-transform origin-top">
                        <CardPreview
                            firstName={form.firstName}
                            lastName={form.lastName}
                            jobTitle={form.jobTitle}
                            companyName={form.companyName}
                            bio={form.bio}
                            email={form.email}
                            phoneMobile={form.phoneMobile}
                            city={form.city}
                            country={form.country}
                            avatarUrl={form.avatarUrl}
                            coverUrl={form.coverUrl}
                            primaryColor={form.primaryColor}
                            bioVisible={form.bioVisible}
                            socialLinks={card?.socialLinks || []}
                            scale={0.95}
                        />
                    </div>

                    <div className="relative z-[120] -mt-24 mb-10 flex flex-col items-center w-full px-6">
                        <button
                            onClick={() => handleSave().then(() => setShowMobilePreview(false))}
                            disabled={saving}
                            className="btn-obsidian btn-obsidian-primary h-14 flex items-center justify-center gap-3 w-full rounded-2xl shadow-2xl font-bold max-w-[280px]"
                        >
                            <span className="material-symbols-outlined">{saving ? 'hourglass_top' : 'save'}</span>
                            {saving ? 'Sauvegarde...' : 'Appliquer'}
                        </button>
                    </div>
                </div>
            )}
        </div >
    );
}
