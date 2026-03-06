'use client';

import { useState, useEffect, use } from 'react';
import { createClient } from '@/utils/supabase/client';
import toast from 'react-hot-toast';

interface CardData {
    id: string;
    userId: string;
    companyId: string | null;
    publicSlug: string;
    firstName: string | null;
    lastName: string | null;
    jobTitle: string | null;
    companyName: string | null;
    bio: string | null;
    avatarUrl: string | null;
    coverUrl: string | null;
    phoneMobile: string | null;
    phoneOffice: string | null;
    email: string | null;
    website: string | null;
    city: string | null;
    country: string | null;
    primaryColor: string | null;
    theme: string | null;
    bioVisible: boolean;
    socialLinks: any[];
    user: {
        firstName: string | null;
        lastName: string | null;
        company: {
            name: string;
            branding: any;
        } | null;
    };
}

const normalizeUrl = (url: string) => {
    if (!url) return '#';
    const trimmed = url.trim();
    if (trimmed.match(/^[a-z0-9]+:\/\//i) || trimmed.startsWith('mailto:') || trimmed.startsWith('tel:')) {
        return trimmed;
    }
    return `https://${trimmed}`;
};

export default function PublicProfilePage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = use(params);
    const [card, setCard] = useState<CardData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [isSharing, setIsSharing] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);

    // Form state for Exchange Contact
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        notes: ''
    });

    useEffect(() => {
        const fetchCard = async () => {
            try {
                const supabase = createClient();

                let query = supabase.from('cards').select('*, users ( company_id )');

                // UUID regex
                const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(slug);
                if (isUuid) {
                    query = query.or(`user_id.eq.${slug},public_slug.eq.${slug}`);
                } else {
                    query = query.eq('public_slug', slug);
                }

                const { data, error } = await query.single();

                if (error || !data) {
                    throw new Error('Carte introuvable');
                }

                const mappedData: CardData = {
                    id: data.id,
                    userId: data.user_id,
                    companyId: data.users?.company_id || null,
                    publicSlug: data.public_slug || data.user_id,
                    firstName: data.first_name,
                    lastName: data.last_name,
                    jobTitle: data.job_title,
                    companyName: data.company_name,
                    bio: data.bio,
                    avatarUrl: data.avatar_url,
                    coverUrl: data.cover_url,
                    phoneMobile: data.phone_mobile,
                    phoneOffice: data.phone_office,
                    email: data.email,
                    website: data.website,
                    city: data.city,
                    country: data.country,
                    primaryColor: data.primary_color,
                    theme: data.theme || 'light',
                    bioVisible: data.bio_visible !== false,
                    socialLinks: data.social_links || [],
                    user: {
                        firstName: data.first_name,
                        lastName: data.last_name,
                        company: null
                    }
                };

                setCard(mappedData);

                // Increment view count via RPC
                supabase.rpc('increment_view_count', { card_id_param: data.id }).then(({ error }) => {
                    if (error) {
                        // If RPC fails, try direct update
                        supabase.from('cards').update({ view_count: (data.view_count || 0) + 1 }).eq('id', data.id).then();
                    }
                });

                // Insert scan record
                supabase.rpc('log_card_scan', { p_card_id: data.id }).then(({ error }) => {
                    if (error) console.error('Error logging scan via RPC:', error);
                });
            } catch (error: any) {
                console.error('Error fetching card:', error);
                toast.error(error.message || 'Carte introuvable');
            } finally {
                setIsLoading(false);
            }
        };

        fetchCard();

        const handleScroll = () => {
            setIsScrolled(window.scrollY > 150);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [slug]);

    const handleSaveContact = () => {
        if (!card) return;

        const vCardData = [
            'BEGIN:VCARD',
            'VERSION:3.0',
            `FN:${card.firstName} ${card.lastName}`,
            `N:${card.lastName};${card.firstName};;;`,
            card.companyName ? `ORG:${card.companyName}` : '',
            card.jobTitle ? `TITLE:${card.jobTitle}` : '',
            card.phoneMobile ? `TEL;TYPE=CELL:${card.phoneMobile}` : '',
            card.phoneOffice ? `TEL;TYPE=WORK:${card.phoneOffice}` : '',
            card.email ? `EMAIL:${card.email}` : '',
            card.website ? `URL:${card.website}` : '',
            card.bio ? `NOTE:${card.bio.replace(/\n/g, '\\n')}` : '',
            'END:VCARD'
        ].filter(line => line !== '').join('\n');

        const blob = new Blob([vCardData], { type: 'text/vcard' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${card.firstName}_${card.lastName}.vcf`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('Contact prêt à être enregistré !');
    };

    const handleExchangeSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSharing(true);
        try {
            const parts = formData.name.trim().split(' ');
            const firstName = parts[0] || '';
            const lastName = parts.slice(1).join(' ') || '';

            const supabase = createClient();
            const { error: rpcError } = await supabase.rpc('create_contact_lead', {
                p_card_id: card!.id,
                p_user_id: card!.userId,
                p_company_id: card!.companyId || null,
                p_first_name: firstName,
                p_last_name: lastName,
                p_email: formData.email,
                p_phone: formData.phone,
                p_notes: formData.notes
            });

            if (rpcError) {
                throw new Error(rpcError.message || "Erreur réseau lors de l'envoi.");
            }

            toast.success('Vos informations ont été envoyées !');
            setShowModal(false);
            setFormData({ name: '', email: '', phone: '', notes: '' });
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || 'Erreur lors de l\'envoi.');
        } finally {
            setIsSharing(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!card) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-background-light dark:bg-background-dark p-6 text-center">
                <span className="material-symbols-outlined text-6xl text-slate-300 mb-4" translate="no">error</span>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Profil introuvable</h1>
                <p className="text-slate-500 mt-2">Ce lien semble être invalide ou la carte a été désactivée.</p>
                <button onClick={() => window.location.href = '/'} className="mt-6 text-primary font-medium hover:underline">Retour site</button>
            </div>
        );
    }

    return (
        <div className="font-display min-h-screen flex justify-center selection:bg-spaceGray/20 relative overflow-x-hidden bg-apple-bgLight dark:bg-black">
            {/* Background Layer: Image vs Ambient Glow PJ Style */}
            {card.coverUrl && !card.coverUrl.startsWith('linear-gradient') && card.coverUrl !== 'default' ? (
                /* Full Screen Image Background */
                <div
                    className="fixed inset-0 z-0 pointer-events-none"
                    style={{
                        backgroundImage: `url(${card.coverUrl})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundAttachment: 'fixed'
                    }}
                />
            ) : (
                /* Ambient Glow "PJ Style" - Unified & Fixed */
                <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-apple-bgLight dark:bg-black">
                    {/* Primary Soft Ambient Wash (Top Corner) - Matched to Preview */}
                    <div
                        className="absolute -top-[15%] -left-[10%] w-[120%] h-[70%] blur-[100px] opacity-[0.25] dark:opacity-[0.3]"
                        style={{
                            background: `radial-gradient(circle at 25% 25%, ${card.coverUrl === 'default' ? (card.theme === 'dark' ? '#000000' : '#FFFFFF') : (card.coverUrl?.match(/#[a-fA-F0-9]{6}/)?.[0] || card.primaryColor || '#0666EB')}, transparent 80%)`
                        }}
                    />
                    {/* Secondary Balanced Glow (Bottom Right hint) - Matched to Preview */}
                    <div
                        className="absolute -bottom-[10%] -right-[10%] w-[70%] h-[40%] blur-[80px] opacity-[0.1] dark:opacity-[0.15]"
                        style={{
                            background: `radial-gradient(circle at center, ${card.coverUrl === 'default' ? (card.theme === 'dark' ? '#000000' : '#FFFFFF') : (card.coverUrl?.match(/#[a-fA-F0-9]{6}/)?.[0] || card.primaryColor || '#0666EB')}, transparent 70%)`
                        }}
                    />

                    {/* The "Flow" - Ultra-diffused center glow (No visible edges) */}
                    <div
                        className="absolute -top-[20%] left-1/2 -translate-x-1/2 w-[180%] h-[70%] blur-[140px] opacity-[0.3] dark:opacity-[0.15] pointer-events-none"
                        style={{
                            background: `radial-gradient(circle at 50% 0%, white 0%, transparent 80%)`
                        }}
                    />
                </div>
            )}

            <div className="w-full max-w-md relative z-10 flex flex-col min-h-screen pb-12">

                {/* Fixed Top Navigation - Integrated Flow Style */}
                <div className={`fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-md z-50 transition-all duration-700 h-24 pointer-events-none ${isScrolled ? 'backdrop-blur-2xl bg-white/10 dark:bg-black/20 shadow-[0_1px_30px_rgba(0,0,0,0.03)]' : ''}`}>
                    <div className="flex items-center justify-between p-4 px-6 h-20 pointer-events-auto">
                        <div className="w-12 h-12" /> {/* spacer for flex balance */}
                        <div className="flex justify-center flex-1">
                            <img src="/logo-icon-black.svg" className="w-8 h-8 object-contain dark:hidden opacity-80" alt="KlikNode" />
                            <img src="/logo-icon-white.svg" className="w-8 h-8 object-contain hidden dark:block opacity-80" alt="KlikNode" />
                        </div>
                        <button onClick={() => {
                            if (navigator.share) {
                                navigator.share({
                                    title: `${card.firstName} ${card.lastName}`,
                                    url: window.location.href
                                });
                            } else {
                                navigator.clipboard.writeText(window.location.href);
                                toast.success('Lien copié !');
                            }
                        }} className="flex items-center justify-center w-12 h-12 text-apple-textDark dark:text-white opacity-60 hover:opacity-100 transition-opacity active:scale-95">
                            <span className="material-symbols-outlined font-light text-2xl" translate="no">ios_share</span>
                        </button>
                    </div>
                </div>

                {/* Profile Header (Centralized Content) */}
                <div className="pt-24 pb-8 flex flex-col items-center px-6">
                    {/* Squircle Avatar with Border */}
                    <div className="relative group">
                        <div className="absolute inset-0 bg-gradient-to-tr from-gray-200 to-white dark:from-gray-800 dark:to-gray-700 rounded-[2.8rem] blur-xl opacity-20 group-hover:opacity-40 transition-opacity" />
                        <div className="relative h-44 w-44 rounded-[2.5rem] bg-white dark:bg-[#1C1C1E] p-2 shadow-2xl border border-white/50 dark:border-white/10 overflow-hidden">
                            {card.avatarUrl ? (
                                <div
                                    className="h-full w-full rounded-[2rem] bg-cover bg-center"
                                    style={{ backgroundImage: `url(${card.avatarUrl})` }}
                                />
                            ) : (
                                <div className="h-full w-full rounded-[2rem] bg-gray-100/50 dark:bg-white/5 flex items-center justify-center">
                                    <span className="text-apple-secondary dark:text-gray-400 text-5xl font-black">
                                        {card.firstName?.[0] || ''}{card.lastName?.[0] || ''}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Identity Area */}
                    <div className="mt-8 text-center space-y-2">
                        <h1 className="text-4xl font-extrabold tracking-tight text-apple-textDark dark:text-white">{card.firstName} {card.lastName}</h1>
                        <p className="text-apple-secondary dark:text-gray-400 font-bold text-lg">{card.jobTitle || 'Digital Artisan'}</p>

                        {(card.city || card.country) && (
                            <div className="flex items-center justify-center gap-1.5 text-apple-secondary/60 dark:text-gray-500 text-sm py-1 font-bold">
                                <span className="material-symbols-outlined text-[18px]" translate="no">location_on</span>
                                <span>{card.city}{card.city && card.country ? ', ' : ''}{card.country}</span>
                            </div>
                        )}

                    </div>

                    {/* Quick Action Buttons (Alex Sterling Style) */}
                    <div className="flex items-center gap-6 mt-10 w-full max-w-sm">
                        <a href={`mailto:${card.email}`} className="flex-1 flex items-center justify-center gap-2.5 h-16 rounded-full text-white shadow-2xl active:scale-95 transition-all hover:brightness-110"
                            style={{ background: card.primaryColor || '#0666EB' }}>
                            <span className="material-symbols-outlined font-light text-[22px]" translate="no">mail</span>
                            <span className="font-bold tracking-wide">Email</span>
                        </a>
                        <a href={`tel:${card.phoneMobile}`} className="h-16 w-16 flex items-center justify-center rounded-full bg-white shadow-xl text-apple-textDark dark:bg-[#1C1C1E] dark:text-white border border-gray-100 dark:border-white/5 hover:scale-105 active:scale-95 transition-all">
                            <span className="material-symbols-outlined font-light" translate="no">call</span>
                        </a>
                        <a href={`sms:${card.phoneMobile}`} className="h-16 w-16 flex items-center justify-center rounded-full bg-white shadow-xl text-apple-textDark dark:bg-[#1C1C1E] dark:text-white border border-gray-100 dark:border-white/5 hover:scale-105 active:scale-95 transition-all">
                            <span className="material-symbols-outlined font-light" translate="no">chat_bubble</span>
                        </a>
                    </div>

                    {/* Website Button */}
                    {card.website && (
                        <div className="w-full max-w-sm mt-4">
                            <a href={card.website.startsWith('http') ? card.website : `https://${card.website}`} target="_blank" rel="noopener noreferrer"
                                className="flex items-center justify-center gap-2.5 h-14 w-full rounded-full bg-white/60 dark:bg-white/5 backdrop-blur-md border border-white/50 dark:border-white/10 shadow-sm text-apple-textDark dark:text-white hover:bg-white/80 dark:hover:bg-white/10 transition-all font-bold active:scale-95">
                                <span className="material-symbols-outlined font-light text-[20px]" translate="no">language</span>
                                Visiter notre site
                            </a>
                        </div>
                    )}
                </div>

                {/* About Section - Glassmorphism */}
                {card.bioVisible && card.bio && (
                    <div className="mt-6 px-6 relative">

                        <div className="klik-glass p-8 rounded-[2.5rem] shadow-xl border border-white/60 dark:border-white/5 overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-gray-200 dark:bg-white/5 blur-3xl opacity-30 -mr-16 -mt-16 group-hover:opacity-50 transition-all duration-700" />
                            <h3 className="text-lg font-black text-apple-textDark dark:text-white mb-4 tracking-tight">À propos</h3>
                            <p className="text-apple-secondary dark:text-gray-300 leading-relaxed text-[15px] font-medium opacity-90">
                                {card.bio}
                            </p>
                        </div>
                    </div>
                )}

                {/* Links Grids */}
                <div className="mt-12 px-6">
                    {(() => {
                        const SOCIAL_NETWORKS = ['linkedin', 'facebook', 'instagram', 'youtube', 'discord', 'twitter', 'x', 'tiktok', 'whatsapp', 'snapchat', 'pinterest', 'github', 'twitch'];
                        const links = card.socialLinks || [];
                        const socialNetworks = links.filter((l: any) => SOCIAL_NETWORKS.includes(l.platform?.toLowerCase()));
                        const otherLinks = links.filter((l: any) => !SOCIAL_NETWORKS.includes(l.platform?.toLowerCase()));

                        if (links.length === 0) {
                            return (
                                <div className="klik-glass p-12 text-center rounded-[2.5rem]">
                                    <span className="material-symbols-outlined text-gray-300 dark:text-gray-700 text-5xl font-light mb-4" translate="no">link_off</span>
                                    <p className="text-apple-secondary font-bold">Aucun lien pour l'instant</p>
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
                            <div className="space-y-8">
                                {/* Social Networks (Horizontal Scroll) */}
                                {socialNetworks.length > 0 && (
                                    <div>
                                        <div className="flex gap-4 overflow-x-auto pt-2 pb-4 custom-scrollbar snap-x px-1">
                                            {socialNetworks.map((link: any) => {
                                                const rawPlatform = (link.platform || '').trim().toLowerCase();
                                                const iconSlug = rawPlatform === 'twitter' ? 'x' : rawPlatform;
                                                return (
                                                    <a
                                                        key={link.id}
                                                        href={normalizeUrl(link.url)}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="w-[60px] h-[60px] shrink-0 bg-white/90 dark:bg-[#1C1C1E] shadow-sm border border-gray-100 dark:border-white/10 hover:shadow-lg rounded-[1.25rem] flex items-center justify-center transition-all duration-300 hover:-translate-y-1 hover:scale-105 snap-center"
                                                    >
                                                        <img
                                                            src={getIconSrc(iconSlug)}
                                                            alt={link.platform}
                                                            className={`w-7 h-7 object-contain drop-shadow-sm ${['x', 'github', 'tiktok'].includes(iconSlug) ? 'dark:invert' : ''}`}
                                                            onError={(e) => {
                                                                // Fallback to text if icon fails
                                                                e.currentTarget.style.display = 'none';
                                                                e.currentTarget.parentElement!.innerHTML = `<span class="material-symbols-outlined text-gray-400" translate="no">link</span>`;
                                                            }}
                                                        />
                                                    </a>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Other Links (1 Column List) */}
                                {otherLinks.length > 0 && (
                                    <div className="mb-8">
                                        <h3 className="text-lg font-black text-apple-textDark dark:text-white mb-6 px-1 tracking-tight">Mes liens</h3>
                                        <div className="flex flex-col gap-3">
                                            {otherLinks.map((link: any) => (
                                                <a
                                                    key={link.id}
                                                    href={normalizeUrl(link.url)}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="group relative flex items-center justify-start gap-4 w-full px-5 py-3.5 rounded-full bg-white/70 dark:bg-white/5 backdrop-blur-xl border border-white/60 dark:border-white/10 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 active:scale-95 overflow-hidden"
                                                >
                                                    <span className="material-symbols-outlined shrink-0 text-[20px] text-apple-secondary dark:text-gray-300 font-light" translate="no">{link.icon || 'link'}</span>
                                                    <span className="text-[15px] font-bold text-apple-textDark dark:text-white tracking-tight truncate flex-1 min-w-0">
                                                        {link.label || link.platform || 'Lien externe'}
                                                    </span>
                                                    <span className="material-symbols-outlined text-[18px] text-apple-secondary/50 dark:text-gray-500 font-light ml-auto" translate="no">chevron_right</span>
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })()}
                </div>

                {/* Bottom Action Area (Regular Flow) */}
                <div className="w-full px-8 mt-4 flex flex-col items-center gap-3">
                    <button
                        onClick={() => setShowModal(true)}
                        className="w-full h-14 rounded-full shadow-xl active:scale-95 flex items-center justify-center gap-3 text-white transition-all hover:brightness-110"
                        style={{ background: card.primaryColor || '#0666EB' }}
                    >
                        <span className="font-extrabold tracking-tight text-base">Échanger le contact</span>
                        <span className="material-symbols-outlined text-xl" translate="no">chevron_right</span>
                    </button>

                    <button
                        onClick={handleSaveContact}
                        className="inline-flex items-center gap-2 text-apple-secondary dark:text-gray-400 font-bold text-[11px] tracking-widest uppercase hover:text-apple-textDark dark:hover:text-white transition-colors"
                    >
                        <span className="material-symbols-outlined text-lg font-light" translate="no">person_add</span>
                        Ajouter aux contacts
                    </button>
                </div>

                {/* Exchange Modal Redesign (Apple/Clean Style) */}
                {showModal && (
                    <div aria-modal="true" className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6" role="dialog">
                        <div onClick={() => setShowModal(false)} aria-hidden="true" className="fixed inset-0 bg-black/40 backdrop-blur-md transition-all animate-in fade-in duration-500"></div>

                        <div className="relative w-full max-w-md animate-in zoom-in-95 slide-in-from-bottom-10 duration-500 transform overflow-hidden rounded-[3rem] bg-[#F2F2F7] dark:bg-[#1C1C1E] p-8 text-center shadow-3xl border border-white/40 dark:border-white/10">
                            {/* Close Button */}
                            <button onClick={() => setShowModal(false)} className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center rounded-full bg-white/50 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 transition-colors">
                                <span className="material-symbols-outlined text-[20px] text-gray-500" translate="no">close</span>
                            </button>

                            <div className="flex justify-center mb-6 pt-4">
                                <div className="w-20 h-20 rounded-full bg-white dark:bg-white/10 shadow-sm flex items-center justify-center">
                                    <img src="/logo-icon-black.svg" alt="KlikNode" className="w-8 h-8 object-contain dark:hidden" />
                                    <img src="/logo-icon-white.svg" alt="KlikNode" className="w-8 h-8 object-contain hidden dark:block" />
                                </div>
                            </div>

                            <div className="mb-10 px-4">
                                <h3 className="text-[32px] font-black tracking-tight text-apple-textDark dark:text-white leading-tight">Échangeons !</h3>
                                <p className="mt-4 text-[#636366] dark:text-[#8E8E93] font-medium leading-tight text-base">
                                    Laissez vos coordonnées ci-dessous et je vous enverrai ma carte par e-mail.
                                </p>
                            </div>

                            <form onSubmit={handleExchangeSubmit} className="space-y-4 text-left">
                                {/* Name Input */}
                                <div className="relative group">
                                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-apple-textDark dark:group-focus-within:text-white transition-colors">
                                        <span className="material-symbols-outlined text-[22px]" translate="no">person</span>
                                    </div>
                                    <input
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="block w-full pl-14 pr-6 py-5 bg-white/70 dark:bg-white/5 border border-transparent focus:border-gray-200 dark:focus:border-white/10 rounded-3xl text-apple-textDark dark:text-white placeholder:text-gray-400 outline-none transition-all shadow-sm"
                                        placeholder="Nom Complet" type="text"
                                    />
                                </div>

                                {/* Email Input */}
                                <div className="relative group">
                                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-apple-textDark dark:group-focus-within:text-white transition-colors">
                                        <span className="material-symbols-outlined text-[22px]" translate="no">mail</span>
                                    </div>
                                    <input
                                        required
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="block w-full pl-14 pr-6 py-5 bg-white/70 dark:bg-white/5 border border-transparent focus:border-gray-200 dark:focus:border-white/10 rounded-3xl text-apple-textDark dark:text-white placeholder:text-gray-400 outline-none transition-all shadow-sm"
                                        placeholder="Adresse E-mail" type="email"
                                    />
                                </div>

                                {/* Phone Input */}
                                <div className="relative group">
                                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-apple-textDark dark:group-focus-within:text-white transition-colors">
                                        <span className="material-symbols-outlined text-[22px]" translate="no">phone</span>
                                    </div>
                                    <input
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="block w-full pl-14 pr-6 py-5 bg-white/70 dark:bg-white/5 border border-transparent focus:border-gray-200 dark:focus:border-white/10 rounded-3xl text-apple-textDark dark:text-white placeholder:text-gray-400 outline-none transition-all shadow-sm"
                                        placeholder="Numéro de Téléphone" type="tel"
                                    />
                                </div>

                                <div className="mt-10 pt-4 flex flex-col items-center gap-6">
                                    <button
                                        type="submit"
                                        disabled={isSharing}
                                        className="w-full h-16 rounded-full font-bold tracking-tight text-lg shadow-xl flex items-center justify-center gap-3 active:scale-[0.98] transition-all text-white hover:brightness-110"
                                        style={{ background: card.primaryColor || '#0666EB' }}
                                    >
                                        <span>{isSharing ? 'Envoi en cours...' : 'Envoyer mes infos'}</span>
                                        <span className="material-symbols-outlined text-xl" translate="no">chevron_right</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="text-apple-secondary dark:text-[#8E8E93] font-bold text-sm tracking-wide hover:text-apple-textDark dark:hover:text-white transition-colors"
                                    >
                                        Peut-être plus tard
                                    </button>

                                    {/* Privacy Badge */}
                                    <div className="mt-4 flex items-center gap-2 px-4 py-2 bg-white/50 dark:bg-white/5 rounded-full border border-gray-100 dark:border-white/5 text-[11px] font-bold text-apple-secondary dark:text-gray-400">
                                        <span className="material-symbols-outlined text-sm" translate="no">lock</span>
                                        Vos données sont privées et sécurisées
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
