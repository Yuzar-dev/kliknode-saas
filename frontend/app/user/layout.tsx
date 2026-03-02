'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth-store';
import { createClient } from '@/utils/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ThemeToggle } from '@/components/user/ThemeToggle';

const NAV_ITEMS = [
    { href: '/user/card', icon: 'credit_card', label: 'Ma Carte' },
    { href: '/user/links', icon: 'link', label: 'Mes Liens' },
    { href: '/user/analytics', icon: 'bar_chart', label: 'Analytics' },
    { href: '/user/leads', icon: 'people', label: 'Contacts' },
];

const SETTINGS_ITEMS = [
    { href: '/user/settings', icon: 'settings', label: 'Réglages' },
];

export default function UserLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const [collapsed, setCollapsed] = useState(false);
    const { user, logout } = useAuthStore();

    // Notification State
    const [showNotifications, setShowNotifications] = useState(false);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [lastRead, setLastRead] = useState<string | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        loadNotifications();
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowNotifications(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const loadNotifications = async () => {
        try {
            const supabase = createClient();
            const { data: { user: authUser } } = await supabase.auth.getUser();
            if (!authUser) return;

            // Only fetch notifications if possible. We use a try-catch to handle missing columns gracefully.
            const { data: profile, error: profileErr } = await supabase.from('profiles').select('*').eq('id', authUser.id).single();

            if (!profileErr && profile) {
                setLastRead(profile.notification_last_read || null);
            }

            const { data: contacts } = await supabase
                .from('contacts')
                .select('*')
                .eq('profile_id', authUser.id) // Use profile_id filter consistently
                .order('created_at', { ascending: false })
                .limit(5);

            setNotifications(contacts || []);
        } catch (err) {
            console.error('Error loading notifications:', err);
        }
    };

    const markAsRead = async () => {
        try {
            const supabase = createClient();
            const { data: { user: authUser } } = await supabase.auth.getUser();
            if (!authUser) return;

            const now = new Date().toISOString();
            await supabase.from('profiles').update({ notification_last_read: now }).eq('id', authUser.id);
            setLastRead(now);
            setShowNotifications(false);
        } catch (err) {
            console.error('Error marking as read:', err);
        }
    };

    const unreadCount = notifications.filter(n => !lastRead || new Date(n.created_at) > new Date(lastRead)).length;

    const handleLogout = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        logout();
        router.push('/login');
    };

    return (
        <div className="min-h-screen flex bg-apple-bgLight dark:bg-black relative">
            {/* ═══ SIDEBAR (Desktop) ═══ */}
            <aside
                className={`fixed top-4 left-4 h-[calc(100vh-32px)] z-40 hidden md:flex flex-col klik-glass rounded-[32px] overflow-hidden transition-all duration-500`}
                style={{ width: collapsed ? 80 : 280 }}
            >
                {/* Logo Area */}
                <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'} border-b border-gray-200/40 dark:border-white/5 h-20 px-6 shrink-0`}>
                    <img src="/logo-icon-black.svg" alt="KlikNode" className="h-[22px] w-auto dark:hidden shrink-0" />
                    <img src="/logo-icon-white.svg" alt="KlikNode" className="h-[22px] w-auto hidden dark:block shrink-0" />
                    {!collapsed && (
                        <span className="text-[22px] font-bold tracking-tighter text-apple-textDark dark:text-white leading-none">
                            kliknode
                        </span>
                    )}
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 flex flex-col gap-1 overflow-y-auto custom-scrollbar">
                    {NAV_ITEMS.map((item) => {
                        const active = pathname === item.href || pathname?.startsWith(item.href + '/');
                        return (
                            <Link key={item.href} href={item.href}
                                className={`flex items-center ${collapsed ? 'justify-center px-0' : 'gap-3 px-4'} py-3 rounded-2xl text-sm font-semibold transition-all duration-300 ${active
                                    ? 'bg-spaceGray dark:bg-titanium text-white dark:text-black shadow-lg shadow-black/10'
                                    : 'text-apple-secondary hover:text-apple-textDark dark:hover:text-white hover:bg-white/40 dark:hover:bg-white/5'
                                    }`}
                            >
                                <span className={`material-symbols-outlined text-[20px] ${collapsed ? 'scale-110' : ''}`}>{item.icon}</span>
                                {!collapsed && <span className="tracking-tight">{item.label}</span>}
                            </Link>
                        );
                    })}

                    <div className="h-px bg-gray-200/40 dark:border-white/5 my-4" />

                    {SETTINGS_ITEMS.map((item) => {
                        const active = pathname === item.href;
                        return (
                            <Link key={item.href} href={item.href}
                                className={`flex items-center ${collapsed ? 'justify-center px-0' : 'gap-3 px-4'} py-3 rounded-2xl text-sm font-semibold transition-all duration-300 ${active
                                    ? 'bg-spaceGray dark:bg-titanium text-white dark:text-black shadow-lg'
                                    : 'text-apple-secondary hover:text-apple-textDark dark:hover:text-white hover:bg-white/40 dark:hover:bg-white/5'
                                    }`}
                            >
                                <span className={`material-symbols-outlined text-[20px] ${collapsed ? 'scale-110' : ''}`}>{item.icon}</span>
                                {!collapsed && <span className="tracking-tight">{item.label}</span>}
                            </Link>
                        );
                    })}
                </nav>

                {/* User Section */}
                <div className="p-4 border-t border-gray-200/40 dark:border-white/5 bg-white/30 dark:bg-white/5">
                    <div className={`flex items-center ${collapsed ? 'justify-center px-0' : 'gap-3 px-2'}`}>
                        <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-white dark:text-black text-sm font-bold bg-spaceGray dark:bg-titanium shadow-sm shrink-0">
                            {user?.firstName?.[0] || ''}{user?.lastName?.[0] || ''}
                        </div>
                        {!collapsed && (
                            <div className="min-w-0 flex-1">
                                <p className="text-[14px] font-bold text-apple-textDark dark:text-white truncate tracking-tight">
                                    {user?.firstName} {user?.lastName}
                                </p>
                                <p className="text-[11px] font-medium text-apple-secondary uppercase tracking-wider">Membre</p>
                            </div>
                        )}
                    </div>
                </div>
            </aside>

            {/* ═══ MAIN CONTENT ═══ */}
            <main
                className={`flex-1 flex flex-col pb-24 md:pb-0 ${collapsed ? 'md:ml-[112px]' : 'md:ml-[312px]'
                    }`}
            >
                {/* Header */}
                <header className="sticky top-4 z-50 h-16 md:h-20 flex items-center justify-between px-4 md:px-8 klik-glass rounded-[20px] md:rounded-[24px] mt-2 md:mt-4 mx-4 md:mx-6 shadow-sm border-white/40 dark:border-white/5">
                    <div className="flex items-center gap-4">
                        {/* Mobile Logo */}
                        <div className="md:hidden flex items-center gap-2">
                            <img src="/logo-icon-black.svg" alt="KlikNode" className="h-[20px] w-auto dark:hidden" />
                            <img src="/logo-icon-white.svg" alt="KlikNode" className="h-[20px] w-auto hidden dark:block" />
                            <span className="text-[18px] font-bold tracking-tighter text-apple-textDark dark:text-white leading-none">
                                kliknode
                            </span>
                        </div>

                        {/* Desktop Toggle */}
                        <button onClick={() => setCollapsed(!collapsed)}
                            className="hidden md:block text-apple-secondary hover:text-apple-textDark dark:hover:text-white p-2 rounded-xl transition-all hover:bg-white/40 dark:hover:bg-white/5"
                        >
                            <span className="material-symbols-outlined text-[22px] font-light">
                                {collapsed ? 'side_navigation' : 'menu_open'}
                            </span>
                        </button>
                    </div>

                    <div className="flex items-center gap-2 md:gap-3">
                        {/* Theme Toggle */}
                        <div className="flex items-center justify-center w-10 h-10 shrink-0">
                            <ThemeToggle />
                        </div>

                        {/* Notifications */}
                        <div className="relative flex items-center justify-center w-10 h-10 shrink-0" ref={dropdownRef}>
                            <button
                                onClick={() => setShowNotifications(!showNotifications)}
                                className={`text-apple-secondary hover:text-apple-textDark dark:hover:text-white w-full h-full flex items-center justify-center rounded-xl relative transition-all hover:bg-white/40 dark:hover:bg-white/5 ${showNotifications ? 'bg-white/50 dark:bg-white/10' : ''}`}
                            >
                                <span className="material-symbols-outlined text-[20px] md:text-[22px] font-light">notifications</span>
                                {unreadCount > 0 && (
                                    <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500" />
                                )}
                            </button>

                            {showNotifications && (
                                <div className="absolute right-0 top-full mt-4 w-72 md:w-80 rounded-[20px] md:rounded-[24px] shadow-2xl border border-gray-200/50 dark:border-white/10 bg-white/95 dark:bg-[#1C1C1E]/95 backdrop-blur-2xl z-[100] overflow-hidden transform origin-top-right transition-all animate-in fade-in zoom-in duration-300">
                                    <div className="p-4 md:p-5 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
                                        <h3 className="font-bold text-apple-textDark dark:text-white tracking-tight text-base">Notifications</h3>
                                        {unreadCount > 0 && (
                                            <button onClick={markAsRead} className="text-[11px] font-bold text-spaceGray dark:text-titanium hover:underline">
                                                Marquer lu
                                            </button>
                                        )}
                                    </div>
                                    <div className="max-h-[300px] md:max-h-[360px] overflow-y-auto custom-scrollbar">
                                        {notifications.length === 0 ? (
                                            <div className="p-10 md:p-12 text-center">
                                                <p className="text-sm text-apple-secondary font-medium">Aucun signal</p>
                                            </div>
                                        ) : (
                                            <div className="divide-y divide-gray-50 dark:divide-white/5">
                                                {notifications.map((notif) => (
                                                    <div key={notif.id} className="p-3 md:p-4 hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors cursor-pointer group"
                                                        onClick={() => {
                                                            router.push('/user/leads');
                                                            setShowNotifications(false);
                                                        }}
                                                    >
                                                        <div className="flex gap-3 md:gap-4">
                                                            <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl md:rounded-2xl flex items-center justify-center text-[10px] md:text-xs font-bold text-white bg-spaceGray dark:bg-titanium dark:text-black">
                                                                {notif.first_name?.[0]}{notif.last_name?.[0]}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-[12px] md:text-[13px] font-bold text-apple-textDark dark:text-white tracking-tight">
                                                                    {notif.first_name} {notif.last_name}
                                                                </p>
                                                                <p className="text-[10px] md:text-[11px] text-apple-secondary truncate mb-1 font-medium">
                                                                    Contact reçu
                                                                </p>
                                                                <p className="text-[9px] md:text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wide">
                                                                    {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true, locale: fr })}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center justify-center w-10 h-10 shrink-0">
                            <button onClick={handleLogout}
                                className="text-apple-secondary hover:text-red-500 w-full h-full flex items-center justify-center rounded-xl transition-all hover:bg-red-50 dark:hover:bg-red-950/20"
                                title="Se déconnecter"
                            >
                                <span className="material-symbols-outlined text-[20px] md:text-[22px] font-light">logout</span>
                            </button>
                        </div>
                    </div>
                </header>

                {/* Content Area */}
                <div className="py-6 md:py-8 px-4 md:px-12 lg:px-24 flex-1 w-full max-w-[1600px] mx-auto">
                    {children}
                </div>
            </main>

            {/* ═══ BOTTOM NAVIGATION (Mobile) ═══ */}
            <nav className="fixed bottom-6 left-4 right-4 h-16 z-50 md:hidden flex items-center justify-around klik-glass rounded-[24px] px-2 shadow-2xl border-white/60 dark:border-white/10">
                {NAV_ITEMS.map((item) => {
                    const active = pathname === item.href || pathname?.startsWith(item.href + '/');
                    return (
                        <Link key={item.href} href={item.href}
                            className={`flex flex-col items-center justify-center flex-1 h-12 rounded-2xl transition-all duration-300 ${active
                                ? 'text-apple-textDark dark:text-white'
                                : 'text-apple-secondary'
                                }`}
                        >
                            <span className={`material-symbols-outlined text-[24px] ${active ? 'fill-[1] font-bold' : 'font-light'}`}>
                                {item.icon}
                            </span>
                            <span className={`text-[9px] font-black uppercase tracking-widest mt-0.5 ${active ? 'opacity-100' : 'opacity-60'}`}>
                                {item.label.split(' ')[0]}
                            </span>
                            {active && (
                                <div className="absolute bottom-1 w-1 h-1 rounded-full bg-apple-textDark dark:bg-white" />
                            )}
                        </Link>
                    );
                })}
                <Link href="/user/settings"
                    className={`flex flex-col items-center justify-center flex-1 h-12 rounded-2xl transition-all duration-300 ${pathname === '/user/settings'
                        ? 'text-apple-textDark dark:text-white'
                        : 'text-apple-secondary'
                        }`}
                >
                    <span className={`material-symbols-outlined text-[24px] ${pathname === '/user/settings' ? 'fill-[1] font-bold' : 'font-light'}`}>
                        settings
                    </span>
                    <span className={`text-[9px] font-black uppercase tracking-widest mt-0.5 ${pathname === '/user/settings' ? 'opacity-100' : 'opacity-60'}`}>
                        Réglages
                    </span>
                    {pathname === '/user/settings' && (
                        <div className="absolute bottom-1 w-1 h-1 rounded-full bg-apple-textDark dark:bg-white" />
                    )}
                </Link>
            </nav>
        </div>
    );
}
