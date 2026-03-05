'use client';

// ─────────────────────────────────────────────────────────────
//  CardPreview — Composant partagé (identique au profil public)
// ─────────────────────────────────────────────────────────────

interface SocialLink {
    id: string;
    platform: string;
    label: string;
    url: string;
    icon: string;
    isActive: boolean;
}

interface CardPreviewProps {
    firstName?: string;
    lastName?: string;
    jobTitle?: string;
    companyName?: string;
    bio?: string;
    email?: string;
    phoneMobile?: string;
    city?: string;
    country?: string;
    website?: string;
    avatarUrl?: string;
    coverUrl?: string;
    primaryColor?: string;
    theme?: string;
    socialLinks?: SocialLink[];
    bioVisible?: boolean;
    scale?: number;
}

// Platform → Material Symbol icon mapping
export const PLATFORM_ICONS: Record<string, string> = {
    linkedin: 'work',
    instagram: 'photo_camera',
    twitter: 'tag',
    facebook: 'thumb_up',
    youtube: 'play_arrow',
    tiktok: 'music_note',
    github: 'code',
    website: 'language',
    whatsapp: 'chat',
    telegram: 'send',
    email: 'mail',
    phone: 'call',
    calendly: 'calendar_month',
    custom: 'link',
};

// Platform → Brand color
const BRAND_COLORS: Record<string, string> = {
    linkedin: '#0A66C2',
    instagram: '#E1306C',
    twitter: '#1DA1F2',
    facebook: '#1877F2',
    youtube: '#FF0000',
    tiktok: '#000000',
    github: '#24292e',
    website: '#059669',
    whatsapp: '#25D366',
    telegram: '#2AABEE',
    email: '#EA4335',
    phone: '#34A853',
    calendly: '#006BFF',
    custom: '#6366F1',
};

// Cover gradient presets
export const COVER_PRESETS = [
    { label: 'Standard', value: 'default' },
    { label: 'Bleu Pro', value: 'linear-gradient(135deg, #0666EB 0%, #1e3a8a 100%)' },
    { label: 'Nuit', value: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)' },
    { label: 'Émeraude', value: 'linear-gradient(135deg, #064e3b 0%, #059669 100%)' },
    { label: 'Coucher Soleil', value: 'linear-gradient(135deg, #7C3AED 0%, #DB2777 100%)' },
    { label: 'Or', value: 'linear-gradient(135deg, #92400e 0%, #F59E0B 100%)' },
    { label: 'Anthracite', value: 'linear-gradient(135deg, #111827 0%, #374151 100%)' },
];

export default function CardPreview({
    firstName = 'Prénom',
    lastName = 'Nom',
    jobTitle,
    companyName,
    bio,
    email,
    phoneMobile,
    city,
    country,
    website,
    avatarUrl,
    coverUrl,
    primaryColor = '#0666EB',
    socialLinks = [],
    bioVisible = true,
    scale = 1,
}: CardPreviewProps) {
    const socialLinksToDisplay = socialLinks.filter(l => l.isActive !== false);

    return (
        <div
            style={{
                width: 360,
                minHeight: 844,
                transform: `scale(${scale})`,
                transformOrigin: 'top center',
                fontFamily: "'Poppins', -apple-system, sans-serif",
                borderRadius: 48,
                overflowY: 'auto',
                overflowX: 'hidden',
                boxShadow: '0 20px 60px rgba(0,0,0,0.12)',
                position: 'relative',
            }}
            className="selection:bg-slate-200 no-scrollbar bg-[#F5F5F7] dark:bg-black text-[#1D1D1F] dark:text-white transition-colors duration-300 border-[8px] border-white dark:border-[#1C1C1E]"
        >
            {/* Background Layer: Image vs Ambient Glow PJ Style */}
            {coverUrl && !coverUrl.startsWith('linear-gradient') && coverUrl !== 'default' ? (
                /* Full Screen Image Background */
                <div
                    className="absolute inset-0 z-0 pointer-events-none"
                    style={{
                        backgroundImage: `url(${coverUrl})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                    }}
                />
            ) : (
                /* Ambient Glow "PJ Style" - Subtle & Airy */
                <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden bg-transparent">
                    {/* Primary Soft Ambient Wash (Top Corner) */}
                    <div
                        className="absolute -top-[15%] -left-[10%] w-[120%] h-[70%] blur-[100px] opacity-[0.25]"
                        style={{
                            background: `radial-gradient(circle at 25% 25%, ${coverUrl === 'default' ? 'var(--tw-gradient-stops)' : (coverUrl?.match(/#[a-fA-F0-9]{6}/)?.[0] || primaryColor || '#0666EB')}, transparent 80%)`
                        }}
                    />
                    {/* Secondary Balanced Glow (Bottom Right hint) */}
                    <div
                        className="absolute -bottom-[10%] -right-[10%] w-[70%] h-[40%] blur-[80px] opacity-[0.1]"
                        style={{
                            background: `radial-gradient(circle at center, ${coverUrl === 'default' ? 'var(--tw-gradient-stops)' : (coverUrl?.match(/#[a-fA-F0-9]{6}/)?.[0] || primaryColor || '#0666EB')}, transparent 70%)`
                        }}
                    />
                    {/* Top Fade Glow (Apple Surface effect) */}
                    <div className="absolute top-0 left-0 w-full h-[50%] bg-gradient-to-b from-white/40 dark:from-[#1C1C1E]/40 to-transparent opacity-60" />
                </div>
            )}

            {/* Ambient Background Glows - Ultra light */}
            <div className="absolute top-[-5%] left-[-10%] w-[300px] h-[300px] bg-white opacity-20 blur-[100px] rounded-full pointer-events-none" />
            <div className="absolute bottom-[-5%] right-[-10%] w-[300px] h-[300px] bg-white opacity-20 blur-[100px] rounded-full pointer-events-none" />

            <div className="relative z-10 flex flex-col min-h-full pb-32">
                {/* Profile Header (Centralized Content) */}
                <div className="pt-20 pb-8 flex flex-col items-center px-6">
                    {/* Squircle Avatar with Border */}
                    <div className="relative group">
                        <div className="absolute inset-0 bg-gradient-to-tr from-gray-200 dark:from-gray-800 to-white dark:to-gray-700 rounded-[2.8rem] blur-xl opacity-20 dark:opacity-40" />
                        <div className="relative h-40 w-40 rounded-[2.5rem] bg-white dark:bg-[#1C1C1E] p-2 shadow-2xl border border-white/50 dark:border-white/10">
                            {avatarUrl ? (
                                <img
                                    src={avatarUrl}
                                    alt="Profile Avatar"
                                    className="h-full w-full rounded-[2rem] object-cover object-center"
                                />
                            ) : (
                                <div className="w-full h-full rounded-[2rem] bg-gray-100/50 dark:bg-white/5 flex items-center justify-center">
                                    <span className="text-apple-secondary dark:text-gray-400 text-4xl font-black">
                                        {firstName?.[0] || ''}{lastName?.[0] || ''}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Identity Area */}
                    <div className="mt-8 text-center space-y-1.5">
                        <h1 className="text-3xl font-extrabold tracking-tight text-[#1D1D1F] dark:text-white">{firstName} {lastName}</h1>
                        <p className="text-[#86868B] dark:text-gray-400 font-bold text-base">{jobTitle || 'Digital Artisan'}</p>

                        {(city || country) && (
                            <div className="flex items-center justify-center gap-1.5 text-[#86868B]/60 dark:text-gray-500 text-xs py-1 font-bold">
                                <span className="material-symbols-outlined text-[16px]">location_on</span>
                                <span>{city}{city && country ? ', ' : ''}{country}</span>
                            </div>
                        )}

                    </div>

                    {/* Quick Action Buttons */}
                    <div className="flex items-center gap-4 mt-8 w-full px-2">
                        <div className="flex-1 flex items-center justify-center gap-2 h-14 btn-obsidian rounded-full text-white shadow-xl transition-all hover:scale-[1.02] active:scale-95 border border-white/10"
                            style={{ background: primaryColor }}>
                            <span className="material-symbols-outlined font-light text-[20px]">mail</span>
                            <span className="font-bold text-sm tracking-wide">Email</span>
                        </div>
                        <div className="h-14 w-14 flex items-center justify-center rounded-full bg-white dark:bg-[#1C1C1E] shadow-lg text-[#1D1D1F] dark:text-white border border-gray-100 dark:border-white/10">
                            <span className="material-symbols-outlined font-light text-[22px]">call</span>
                        </div>
                        <div className="h-14 w-14 flex items-center justify-center rounded-full bg-white dark:bg-[#1C1C1E] shadow-lg text-[#1D1D1F] dark:text-white border border-gray-100 dark:border-white/10">
                            <span className="material-symbols-outlined font-light text-[22px]">chat_bubble</span>
                        </div>
                    </div>

                    {/* Website Button */}
                    {website && (
                        <div className="w-full mt-4 px-2">
                            <div className="flex items-center justify-center gap-2.5 h-12 w-full rounded-full bg-white/60 dark:bg-white/5 backdrop-blur-md border border-white/50 dark:border-white/10 shadow-sm text-[#1D1D1F] dark:text-white font-bold opacity-90">
                                <span className="material-symbols-outlined font-light text-[18px]">language</span>
                                Visiter notre site
                            </div>
                        </div>
                    )}
                </div>

                {/* About Section - Glassmorphism */}
                {bioVisible && bio && (
                    <div className="mt-4 px-6 relative">

                        <div className="bg-white/60 dark:bg-black/40 backdrop-blur-md p-7 rounded-[2.5rem] shadow-lg border border-white/60 dark:border-white/10 overflow-hidden">
                            <h3 className="text-base font-black text-[#1D1D1F] dark:text-white mb-3 tracking-tight">À propos</h3>
                            <p className="text-[#86868B] dark:text-gray-400 leading-relaxed text-sm font-medium opacity-90">
                                {bio}
                            </p>
                        </div>
                    </div>
                )}

                {/* Links */}
                <div className="mt-10 px-6">
                    {(() => {
                        const SOCIAL_NETWORKS = ['linkedin', 'facebook', 'instagram', 'youtube', 'discord', 'twitter', 'x', 'tiktok', 'whatsapp', 'snapchat', 'pinterest', 'github', 'twitch'];
                        const socialNetworks = socialLinksToDisplay.filter(l => SOCIAL_NETWORKS.includes(l.platform?.toLowerCase() || ''));
                        const otherLinks = socialLinksToDisplay.filter(l => !SOCIAL_NETWORKS.includes(l.platform?.toLowerCase() || ''));

                        if (socialLinksToDisplay.length === 0) {
                            return (
                                <div className="bg-white/40 dark:bg-black/20 backdrop-blur-md p-10 text-center rounded-[2rem] border border-white/40 dark:border-white/10">
                                    <span className="material-symbols-outlined text-gray-300 dark:text-gray-700 text-4xl font-light mb-3">link_off</span>
                                    <p className="text-[#86868B] dark:text-gray-500 text-xs font-bold">Aucun lien pour l'instant</p>
                                </div>
                            );
                        }

                        const getIconSrc = (slug: string) => {
                            if (slug === 'linkedin') {
                                return "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%230A66C2'%3E%3Cpath d='M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z'/%3E%3C/svg%3E";
                            }
                            return `https://cdn.simpleicons.org/${slug}`;
                        };

                        return (
                            <div className="space-y-6">
                                {/* Social Networks (Horizontal Scroll) */}
                                {socialNetworks.length > 0 && (
                                    <div className="flex gap-3 overflow-x-auto pt-2 pb-2 custom-scrollbar snap-x px-1">
                                        {socialNetworks.map(link => {
                                            const rawPlatform = (link.platform || '').trim().toLowerCase();
                                            const iconSlug = rawPlatform === 'twitter' ? 'x' : rawPlatform;
                                            return (
                                                <div
                                                    key={link.id}
                                                    className="w-12 h-12 shrink-0 bg-white/90 shadow-sm border border-gray-100 dark:border-white/10 dark:bg-[#1C1C1E] rounded-[1rem] flex items-center justify-center transition-all snap-center hover:-translate-y-0.5 hover:scale-105"
                                                >
                                                    <img
                                                        src={getIconSrc(iconSlug)}
                                                        alt={link.platform}
                                                        className={`w-6 h-6 object-contain ${['x', 'github', 'tiktok'].includes(iconSlug) ? 'dark:invert' : ''}`}
                                                        onError={(e) => {
                                                            e.currentTarget.style.display = 'none';
                                                            e.currentTarget.parentElement!.innerHTML = `<span class="material-symbols-outlined text-gray-400 text-sm">link</span>`;
                                                        }}
                                                    />
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* Other Links (1 Column List) */}
                                {otherLinks.length > 0 && (
                                    <div className="mb-6">
                                        <h3 className="text-base font-black text-[#1D1D1F] dark:text-white mb-4 px-1 tracking-tight">Mes liens</h3>
                                        <div className="flex flex-col gap-2.5">
                                            {otherLinks.map(link => (
                                                <div
                                                    key={link.id}
                                                    className="flex items-center justify-start gap-3 w-full px-4 py-2.5 rounded-full bg-white/60 dark:bg-black/40 backdrop-blur-md border border-white/50 dark:border-white/10 shadow-sm relative overflow-hidden transition-all"
                                                >
                                                    <span className="material-symbols-outlined shrink-0 text-[18px] text-[#1D1D1F]/60 dark:text-gray-400 font-light">{PLATFORM_ICONS[link.platform?.toLowerCase() || ''] || link.icon || 'public'}</span>
                                                    <span className="text-[13px] font-bold text-[#1D1D1F] dark:text-white tracking-tight flex-1 truncate min-w-0">
                                                        {link.label || link.platform || 'Lien externe'}
                                                    </span>
                                                    <span className="material-symbols-outlined text-[16px] text-[#86868B]/50 dark:text-gray-600 font-light ml-auto">chevron_right</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })()}
                </div>

                {/* Fixed Bottom Action Area (Visual Mockup) */}
                <div className="absolute bottom-0 left-0 w-full px-8 pb-8 pt-12 bg-gradient-to-t from-[#F5F5F7] dark:from-black via-[#F5F5F7]/90 dark:via-black/90 to-transparent flex flex-col items-center gap-2">
                    <div className="w-full h-12 rounded-full flex items-center justify-center gap-2 text-white shadow-lg transition-all active:scale-[0.98] border border-white/10"
                        style={{ background: primaryColor }}>
                        <span className="font-extrabold tracking-tight text-sm">Échanger le contact</span>
                        <span className="material-symbols-outlined text-lg">chevron_right</span>
                    </div>

                    <div className="inline-flex items-center gap-1.5 text-[#86868B] dark:text-gray-500 font-bold text-[10px] tracking-widest uppercase py-2">
                        <span className="material-symbols-outlined text-base font-light">person_add</span>
                        Ajouter aux contacts
                    </div>
                </div>
            </div>
        </div >
    );
}
