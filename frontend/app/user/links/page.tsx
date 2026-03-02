'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import toast from 'react-hot-toast';
import CardPreview, { PLATFORM_ICONS } from '@/components/user/CardPreview';

interface SocialLink {
    id: string;
    platform: string;
    label: string;
    url: string;
    icon: string;
    isActive: boolean;
    order: number;
}

interface CardData {
    firstName: string; lastName: string; jobTitle: string; companyName: string;
    bio: string; email: string; phoneMobile: string;
    city: string; country: string;
    avatarUrl: string; coverUrl: string; primaryColor: string;
}

// Brand colors for icon background tint
const BRAND_COLORS: Record<string, string> = {
    linkedin: '#0A66C2', instagram: '#E1306C', twitter: '#1DA1F2',
    facebook: '#1877F2', youtube: '#FF0000', tiktok: '#000000',
    github: '#24292e', website: '#059669', whatsapp: '#25D366',
    telegram: '#2AABEE', email: '#EA4335', phone: '#34A853',
    calendly: '#006BFF', custom: '#6366F1',
};

const PLATFORMS = [
    { value: 'linkedin', label: 'LinkedIn', icon: 'work' },
    { value: 'instagram', label: 'Instagram', icon: 'photo_camera' },
    { value: 'twitter', label: 'Twitter/X', icon: 'tag' },
    { value: 'facebook', label: 'Facebook', icon: 'thumb_up' },
    { value: 'youtube', label: 'YouTube', icon: 'play_arrow' },
    { value: 'tiktok', label: 'TikTok', icon: 'music_note' },
    { value: 'github', label: 'GitHub', icon: 'code' },
    { value: 'website', label: 'Site web', icon: 'language' },
    { value: 'whatsapp', label: 'WhatsApp', icon: 'chat' },
    { value: 'telegram', label: 'Telegram', icon: 'send' },
    { value: 'calendly', label: 'Calendly', icon: 'calendar_month' },
    { value: 'email', label: 'Email', icon: 'mail' },
    { value: 'custom', label: 'Autre', icon: 'link' },
];

const ICON_OPTIONS = [
    'link', 'work', 'photo_camera', 'language', 'send', 'chat', 'mail', 'call',
    'tag', 'code', 'play_arrow', 'thumb_up', 'music_note', 'calendar_month',
    'public', 'star', 'favorite', 'shopping_bag', 'storefront', 'rocket_launch',
];

const formatUrl = (url: string) => {
    if (!url) return '';
    let trimmed = url.trim();
    if (trimmed.match(/^[a-z0-9]+:\/\//i) || trimmed.startsWith('mailto:') || trimmed.startsWith('tel:')) {
        return trimmed;
    }
    return `https://${trimmed}`;
};

export default function LinksPage() {
    const [links, setLinks] = useState<SocialLink[]>([]);
    const [card, setCard] = useState<CardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [adding, setAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [showIconPicker, setShowIconPicker] = useState<string | null>(null);

    // New link form
    const [newForm, setNewForm] = useState({ platform: 'linkedin', label: '', url: '', icon: 'work' });

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: profile, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (error) throw error;
            if (profile) {
                setLinks(profile.social_links || []);
                setCard({
                    firstName: profile.first_name || '',
                    lastName: profile.last_name || '',
                    jobTitle: profile.job_title || '',
                    companyName: profile.company_name || '',
                    bio: profile.bio || '',
                    email: profile.email || '',
                    phoneMobile: profile.phone_mobile || '',
                    city: profile.city || '',
                    country: profile.country || '',
                    avatarUrl: profile.avatar_url || '',
                    coverUrl: profile.cover_url || '',
                    primaryColor: profile.primary_color || '#0666EB',
                });
            }
        } catch (e: any) {
            console.error(e);
            toast.error('Erreur de chargement');
        } finally {
            setLoading(false);
        }
    };

    const saveLinksToDB = async (newLinks: SocialLink[]) => {
        try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { error } = await supabase
                .from('profiles')
                .update({ social_links: newLinks })
                .eq('id', user.id);

            if (error) throw error;
        } catch (e) {
            console.error("Error saving links:", e);
            toast.error("Erreur lors de la sauvegarde");
        }
    };

    const handleAdd = async () => {
        if (!newForm.url.trim()) return toast.error('URL requise');
        setAdding(true);
        try {
            const formattedUrl = formatUrl(newForm.url);
            const newLink: SocialLink = {
                id: Math.random().toString(36).substring(2, 9),
                ...newForm,
                url: formattedUrl,
                isActive: true,
                order: links.length
            };
            const updatedLinks = [...links, newLink];
            setLinks(updatedLinks);
            await saveLinksToDB(updatedLinks);
            toast.success('Lien ajouté !');
            setNewForm({ platform: 'linkedin', label: '', url: '', icon: 'work' });
        } catch (err: any) {
            toast.error('Erreur');
        } finally { setAdding(false); }
    };

    const handleUpdate = async (id: string, data: Partial<SocialLink>) => {
        try {
            const updatedLinks = links.map(l => l.id === id ? { ...l, ...data } : l);
            setLinks(updatedLinks);
            await saveLinksToDB(updatedLinks);
            setEditingId(null);
            toast.success('Lien mis à jour !');
        } catch (err: any) {
            toast.error('Erreur');
        }
    };

    const handleDelete = async (id: string) => {
        try {
            const updatedLinks = links.filter(l => l.id !== id);
            setLinks(updatedLinks);
            await saveLinksToDB(updatedLinks);
            toast.success('Lien supprimé');
        } catch { toast.error('Erreur'); }
    };

    const handleToggle = async (link: SocialLink) => {
        await handleUpdate(link.id, { isActive: !link.isActive });
    };

    const handlePlatformChange = (platform: string) => {
        const p = PLATFORMS.find(x => x.value === platform);
        setNewForm(f => ({ ...f, platform, icon: p?.icon || 'link' }));
    };

    const [showMobilePreview, setShowMobilePreview] = useState(false);

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="animate-spin h-10 w-10 border-4 border-spaceGray dark:border-white border-t-transparent rounded-full" />
        </div>
    );

    return (
        <div className="flex flex-col lg:flex-row gap-10 items-start min-h-screen selection:bg-slate-200 px-4 md:px-0">
            {/* ─── Left: Links manager ─── */}
            <div className="flex-1 min-w-0 pb-20 relative z-10 w-full">
                <div className="mb-10">
                    <h1 className="text-3xl md:text-4xl font-black text-apple-textDark dark:text-white tracking-tight">Mes Liens</h1>
                    <p className="text-apple-secondary dark:text-gray-400 font-bold text-sm mt-2">Gérez les liens affichés sur votre profil public.</p>
                </div>

                {/* Add new link */}
                <div className="klik-glass p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] mb-8 border border-white/60 dark:border-white/5 shadow-lg relative z-20 group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 dark:bg-blue-400/5 blur-3xl opacity-30 -mr-16 -mt-16 group-hover:opacity-50 transition-all duration-700" />

                    <h3 className="text-[10px] md:text-xs font-black uppercase tracking-[0.25em] text-apple-secondary dark:text-gray-500 mb-6 md:mb-8 px-1 flex items-center gap-2">
                        <span className="material-symbols-outlined text-blue-600 text-[18px]">add_link</span>
                        Ajouter un lien
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6">
                        <div className="space-y-3 group/input">
                            <label className="block text-[10px] md:text-[11px] font-black text-apple-secondary dark:text-gray-500 uppercase tracking-widest ml-1 group-focus-within/input:text-apple-textDark dark:group-focus-within/input:text-white transition-colors">Plateforme</label>
                            <select
                                value={newForm.platform}
                                onChange={e => handlePlatformChange(e.target.value)}
                                className="w-full rounded-[1.2rem] border border-gray-100 dark:border-white/5 bg-white/50 dark:bg-black/20 px-5 py-3.5 text-base text-apple-textDark dark:text-white focus:outline-none focus:ring-1 focus:ring-apple-bgLight dark:focus:ring-white/10 focus:bg-white dark:focus:bg-black/40 transition-all font-medium"
                            >
                                {PLATFORMS.map(p => (
                                    <option key={p.value} value={p.value}>{p.label}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-3 group/input">
                            <label className="block text-[10px] md:text-[11px] font-black text-apple-secondary dark:text-gray-500 uppercase tracking-widest ml-1 group-focus-within/input:text-apple-textDark dark:group-focus-within/input:text-white transition-colors">Label (optionnel)</label>
                            <input
                                type="text"
                                value={newForm.label}
                                onChange={e => setNewForm(f => ({ ...f, label: e.target.value }))}
                                placeholder="Mon Instagram..."
                                className="w-full rounded-[1.2rem] border border-gray-100 dark:border-white/5 bg-white/50 dark:bg-black/20 px-5 py-3.5 text-base text-apple-textDark dark:text-white focus:outline-none focus:ring-1 focus:ring-apple-bgLight dark:focus:ring-white/10 focus:bg-white dark:focus:bg-black/40 transition-all font-medium placeholder:text-gray-300 dark:placeholder:text-gray-600"
                            />
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row gap-4 md:items-end">
                        <div className="flex-1 space-y-3 group/input">
                            <label className="block text-[10px] md:text-[11px] font-black text-apple-secondary dark:text-gray-500 uppercase tracking-widest ml-1 group-focus-within/input:text-apple-textDark dark:group-focus-within/input:text-white transition-colors">URL *</label>
                            <div className="relative">
                                <span className="absolute left-5 top-1/2 -translate-y-1/2 material-symbols-outlined text-apple-secondary text-[20px] font-light">link</span>
                                <input
                                    type="url"
                                    value={newForm.url}
                                    onChange={e => setNewForm(f => ({ ...f, url: e.target.value }))}
                                    placeholder="https://"
                                    className="w-full pl-12 rounded-[1.2rem] border border-gray-100 dark:border-white/5 bg-white/50 dark:bg-black/20 px-5 py-3.5 text-base text-apple-textDark dark:text-white focus:outline-none focus:ring-1 focus:ring-apple-bgLight dark:focus:ring-white/10 focus:bg-white dark:focus:bg-black/40 transition-all font-medium placeholder:text-gray-300 dark:placeholder:text-gray-600"
                                    onKeyDown={e => e.key === 'Enter' && handleAdd()}
                                />
                            </div>
                        </div>
                        {/* Icon preview & picker */}
                        <div className="flex gap-4 items-end">
                            <div className="relative group/picker flex-1 md:flex-none">
                                <label className="block text-[10px] md:text-[11px] font-black text-apple-secondary dark:text-gray-500 uppercase tracking-widest ml-1 mb-3">Icône</label>
                                <button
                                    onClick={() => setShowIconPicker(showIconPicker === 'new' ? null : 'new')}
                                    className="flex items-center justify-center gap-3 h-12 md:h-14 w-full md:w-auto px-6 rounded-[1.2rem] border border-gray-100 dark:border-white/5 bg-white/50 dark:bg-white/5 text-apple-textDark dark:text-white hover:bg-white dark:hover:bg-white/10 transition-all shadow-sm active:scale-95"
                                >
                                    <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 text-[22px] font-light">{newForm.icon}</span>
                                    <span className="material-symbols-outlined text-apple-secondary text-[16px] font-light">expand_more</span>
                                </button>
                                {showIconPicker === 'new' && (
                                    <div className="absolute top-full mt-3 right-0 z-[100] p-4 rounded-[1.5rem] shadow-2xl grid grid-cols-5 gap-2 border border-white/60 dark:border-white/10 animate-in fade-in zoom-in-95 duration-200"
                                        style={{ background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(20px)', width: 260 }}
                                    >
                                        <div className="absolute -top-2 right-6 w-4 h-4 bg-white/90 border-l border-t border-white/60 dark:border-white/10 rotate-45" style={{ backdropFilter: 'blur(20px)' }} />
                                        {ICON_OPTIONS.map(ic => (
                                            <button key={ic} onClick={() => { setNewForm(f => ({ ...f, icon: ic })); setShowIconPicker(null); }}
                                                className={`w-10 h-10 rounded-[10px] flex items-center justify-center hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all z-10 ${newForm.icon === ic ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400' : 'text-apple-textDark dark:text-apple-bgLight'}`}
                                                title={ic}
                                            >
                                                <span className="material-symbols-outlined text-[20px] font-light">{ic}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <button onClick={handleAdd} disabled={adding}
                                className="btn-obsidian btn-obsidian-primary h-12 md:h-14 flex-1 md:flex-none px-8 rounded-[1.2rem] shadow-xl active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2.5 font-bold"
                            >
                                <span className="material-symbols-outlined text-[20px] font-light">add</span>
                                <span>{adding ? '...' : 'Ajouter'}</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Links list */}
                {links.length === 0 ? (
                    <div className="klik-glass p-12 md:p-20 text-center rounded-[2.5rem] border border-white/60 dark:border-white/5">
                        <span className="material-symbols-outlined text-5xl md:text-6xl text-apple-secondary dark:text-gray-700 mb-6 font-light">link_off</span>
                        <p className="text-apple-textDark dark:text-white font-black text-lg md:text-xl">Aucun lien pour l'instant</p>
                        <p className="text-apple-secondary dark:text-gray-500 font-bold text-xs md:text-sm mt-2">Ajoutez votre premier lien ci-dessus pour commencer.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {links.sort((a, b) => a.order - b.order).map(link => {
                            const platform = PLATFORMS.find(p => p.value === link.platform);
                            const iconName = PLATFORM_ICONS[link.platform] || link.icon || 'link';
                            const brandColor = BRAND_COLORS[link.platform] || '#0666EB';
                            const isEditing = editingId === link.id;

                            return (
                                <div key={link.id} className={`klik-glass p-4 md:p-5 rounded-[1.5rem] border border-white/60 dark:border-white/5 transition-all duration-500 shadow-sm hover:shadow-xl ${isEditing ? 'relative z-50 scale-[1.01] ring-1 ring-blue-500/20 shadow-blue-500/10' : ''} ${!link.isActive && !isEditing ? 'opacity-50 saturate-0 scale-[0.98]' : ''}`}>
                                    {isEditing ? (
                                        <EditLinkForm
                                            link={link}
                                            platforms={PLATFORMS}
                                            iconOptions={ICON_OPTIONS}
                                            onSave={(data) => handleUpdate(link.id, data)}
                                            onCancel={() => setEditingId(null)}
                                        />
                                    ) : (
                                        <div className="flex items-center gap-4 md:gap-6">
                                            <div className="w-10 h-10 md:w-12 md:h-12 rounded-[0.8rem] md:rounded-[1rem] flex items-center justify-center flex-shrink-0 shadow-sm border border-white/40 dark:border-white/5"
                                                style={{ backgroundColor: `${brandColor}15` }}>
                                                <span className="material-symbols-outlined text-[20px] md:text-[24px]" style={{ color: brandColor }}>{iconName}</span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-black text-apple-textDark dark:text-white text-sm md:text-base tracking-tight truncate">{link.label || platform?.label || link.platform}</p>
                                                <p className="text-apple-secondary dark:text-gray-500 text-[10px] md:text-xs font-bold truncate tracking-tight">{link.url}</p>
                                            </div>
                                            <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
                                                {/* Toggle */}
                                                <button
                                                    onClick={() => handleToggle(link)}
                                                    className={`relative w-9 md:w-11 h-5 md:h-6 rounded-full transition-all duration-300 ${link.isActive ? 'bg-emerald-500 shadow-lg shadow-emerald-500/20' : 'bg-gray-200 dark:bg-gray-800'}`}
                                                >
                                                    <span className={`absolute top-0.5 md:top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300 ${link.isActive ? 'left-4.5 md:left-6' : 'left-0.5 md:left-1'}`} />
                                                </button>
                                                <div className="hidden sm:block w-px h-8 bg-gray-100 dark:bg-white/5" />
                                                <button onClick={() => setEditingId(link.id)}
                                                    className="w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-apple-secondary hover:text-blue-500 bg-white/40 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 transition-all active:scale-95">
                                                    <span className="material-symbols-outlined text-[18px] md:text-[20px] font-light">edit</span>
                                                </button>
                                                <button onClick={() => handleDelete(link.id)}
                                                    className="w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-apple-secondary hover:text-red-500 bg-white/40 dark:bg-white/5 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all active:scale-95">
                                                    <span className="material-symbols-outlined text-[18px] md:text-[20px] font-light">delete</span>
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ─── Right: Live Preview (Sticky) ─── */}
            <div className="hidden lg:flex flex-col items-center gap-8 sticky top-28 w-[380px] xl:w-[400px] shrink-0">
                <div className="flex items-center gap-2.5 px-6 py-2 klik-glass rounded-full border border-white/60 dark:border-white/5 shadow-sm">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[11px] font-black text-apple-secondary dark:text-gray-400 uppercase tracking-widest">Aperçu live</span>
                </div>

                <div className="relative group transition-transform duration-1000 hover:scale-[1.01]">
                    <div className="absolute -inset-8 bg-gradient-to-tr from-gray-200/20 to-gray-100/10 dark:from-white/5 dark:to-transparent rounded-[64px] blur-3xl opacity-50 z-0" />
                    <div style={{ height: 'calc(100vh - 200px)', minHeight: 600, maxHeight: 750, overflowY: 'auto', position: 'relative' }} className="rounded-[4rem] z-10 transition-all duration-700 no-scrollbar">
                        <CardPreview
                            firstName={card?.firstName}
                            lastName={card?.lastName}
                            jobTitle={card?.jobTitle}
                            companyName={card?.companyName}
                            bio={card?.bio}
                            email={card?.email}
                            phoneMobile={card?.phoneMobile}
                            city={card?.city}
                            country={card?.country}
                            avatarUrl={card?.avatarUrl}
                            coverUrl={card?.coverUrl}
                            primaryColor={card?.primaryColor}
                            socialLinks={links}
                            scale={0.8}
                        />
                    </div>
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
                            firstName={card?.firstName}
                            lastName={card?.lastName}
                            jobTitle={card?.jobTitle}
                            companyName={card?.companyName}
                            bio={card?.bio}
                            email={card?.email}
                            phoneMobile={card?.phoneMobile}
                            city={card?.city}
                            country={card?.country}
                            avatarUrl={card?.avatarUrl}
                            coverUrl={card?.coverUrl}
                            primaryColor={card?.primaryColor}
                            socialLinks={links}
                            scale={0.95}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── EditLinkForm subcomponent ───
function EditLinkForm({ link, platforms, iconOptions, onSave, onCancel }: {
    link: SocialLink;
    platforms: typeof PLATFORMS;
    iconOptions: string[];
    onSave: (data: Partial<SocialLink>) => void;
    onCancel: () => void;
}) {
    const [form, setForm] = useState({ platform: link.platform, label: link.label, url: link.url, icon: link.icon });
    const [showPicker, setShowPicker] = useState(false);

    const handlePlatformChange = (p: string) => {
        const found = platforms.find(x => x.value === p);
        setForm(f => ({ ...f, platform: p, icon: found?.icon || 'link' }));
    };

    return (
        <div className="space-y-6 py-2 animate-in slide-in-from-top-4 duration-500">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                <div className="space-y-2">
                    <label className="block text-[10px] font-black text-apple-secondary dark:text-gray-500 uppercase tracking-widest ml-1">Plateforme</label>
                    <select value={form.platform} onChange={e => handlePlatformChange(e.target.value)}
                        className="w-full rounded-[1rem] border border-gray-100 dark:border-white/5 bg-white/60 dark:bg-black/40 px-4 py-2.5 text-sm text-apple-textDark dark:text-white focus:outline-none">
                        {platforms.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                    </select>
                </div>
                <div className="space-y-2">
                    <label className="block text-[10px] font-black text-apple-secondary dark:text-gray-500 uppercase tracking-widest ml-1">Label</label>
                    <input type="text" value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
                        className="w-full rounded-[1rem] border border-gray-100 dark:border-white/5 bg-white/60 dark:bg-black/40 px-4 py-2.5 text-sm text-apple-textDark dark:text-white focus:outline-none" />
                </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 sm:items-end">
                <div className="flex-1 space-y-2">
                    <label className="block text-[10px] font-black text-apple-secondary dark:text-gray-500 uppercase tracking-widest ml-1">URL</label>
                    <input type="url" value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
                        className="w-full rounded-[1rem] border border-gray-100 dark:border-white/5 bg-white/60 dark:bg-black/40 px-4 py-2.5 text-sm text-apple-textDark dark:text-white focus:outline-none" />
                </div>
                <div className="flex gap-4 items-end">
                    <div className="relative flex-1 sm:flex-none">
                        <button onClick={() => setShowPicker(p => !p)}
                            className="flex items-center justify-center gap-2 h-11 w-full sm:w-auto px-4 rounded-[1rem] border border-gray-100 dark:border-white/5 bg-white/60 dark:bg-white/5 text-sm text-apple-textDark dark:text-white shadow-sm">
                            <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 text-[20px] font-light">{form.icon}</span>
                            <span className="material-symbols-outlined text-apple-secondary text-[12px] font-light">expand_more</span>
                        </button>
                        {showPicker && (
                            <div className="absolute top-full mt-3 right-0 z-[100] p-3 rounded-[1.2rem] shadow-2xl grid grid-cols-5 gap-1.5 border border-white/60 dark:border-white/10 animate-in fade-in zoom-in-95 duration-200"
                                style={{ background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(20px)', width: 220 }}>
                                <div className="absolute -top-1.5 right-5 w-3 h-3 bg-white/90 border-l border-t border-white/60 dark:border-white/10 rotate-45" style={{ backdropFilter: 'blur(20px)' }} />
                                {iconOptions.map(ic => (
                                    <button key={ic} onClick={() => { setForm(f => ({ ...f, icon: ic })); setShowPicker(false); }}
                                        className={`w-9 h-9 rounded-[8px] flex items-center justify-center hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all z-10 ${form.icon === ic ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400' : 'text-apple-textDark dark:text-apple-bgLight'}`}>
                                        <span className="material-symbols-outlined text-[18px] font-light">{ic}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <div className="flex gap-3 justify-end pt-2">
                <button onClick={onCancel} className="px-6 py-2.5 rounded-[1rem] text-sm font-bold text-apple-secondary hover:text-apple-textDark dark:hover:text-white transition-all">Annuler</button>
                <button onClick={() => {
                    const formatted = { ...form, url: formatUrl(form.url) };
                    onSave(formatted);
                }}
                    className="btn-obsidian btn-obsidian-primary px-8 py-2.5 rounded-[1rem] text-sm font-bold shadow-lg"
                >
                    Sauvegarder
                </button>
            </div>
        </div>
    );
}
