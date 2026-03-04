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
                            <img
                                src={avatarUrl || 'https://via.placeholder.com/300'}
                                alt="Profile Avatar"
                                className="h-full w-full rounded-[2rem] object-cover object-center"
                            />
                        </div>
                    </div>

                    {/* Identity Area */}
                    <div className="mt-8 text-center space-y-1.5">
                        <h1 className="text-3xl font-extrabold tracking-tight text-[#1D1D1F] dark:text-white">{firstName} {lastName}</h1>
                        <p className="text-[#86868B] dark:text-gray-400 font-bold text-base">{jobTitle || 'Digital Artisan'}</p>

                        <div className="flex items-center justify-center gap-1.5 text-[#86868B]/60 dark:text-gray-500 text-xs py-1 font-bold">
                            <span className="material-symbols-outlined text-[16px]">location_on</span>
                            <span>{city || 'Paris'}{country ? `, ${country}` : ''}</span>
                        </div>

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

                {/* Links Grids - 2x2 Style */}
                <div className="mt-10 px-6">
                    <h3 className="text-base font-black text-[#1D1D1F] dark:text-white mb-5 px-1 tracking-tight">Mes liens</h3>
                    {socialLinksToDisplay.length > 0 ? (
                        <div className="grid grid-cols-2 gap-3">
                            {socialLinksToDisplay.map((link) => (
                                <div
                                    key={link.id}
                                    className="bg-white/60 dark:bg-black/40 backdrop-blur-md p-4 rounded-[1.8rem] border border-white/50 dark:border-white/10 shadow-sm relative overflow-hidden"
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="w-10 h-10 flex items-center justify-center shadow-inner rounded-xl border transition-all"
                                            style={{ backgroundColor: `${primaryColor}1A`, color: primaryColor, borderColor: `${primaryColor}20` }}>
                                            <span className="material-symbols-outlined text-[20px] font-light">{PLATFORM_ICONS[link.platform?.toLowerCase()] || link.icon || 'public'}</span>
                                        </div>
                                        <span className="material-symbols-outlined text-gray-300 dark:text-gray-600 text-base">arrow_outward</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-black text-[#1D1D1F] dark:text-white text-sm tracking-tight mb-0.5">{link.label || link.platform}</span>
                                        <span className="text-[9px] font-bold text-[#86868B]/60 dark:text-gray-500 uppercase tracking-widest truncate">{link.url.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white/40 dark:bg-black/20 backdrop-blur-md p-10 text-center rounded-[2rem] border border-white/40 dark:border-white/10">
                            <span className="material-symbols-outlined text-gray-300 dark:text-gray-700 text-4xl font-light mb-3">link_off</span>
                            <p className="text-[#86868B] dark:text-gray-500 text-xs font-bold">Aucun lien pour l'instant</p>
                        </div>
                    )}
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
        </div>
    );
}
