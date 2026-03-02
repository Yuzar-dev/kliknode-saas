'use client';

import { useAuthStore } from '@/store/auth-store';
import { useRouter } from 'next/navigation';

export default function AdminHeader() {
    const router = useRouter();
    const logout = useAuthStore((state) => state.logout);

    const handleLogout = () => {
        logout();
        router.push('/login');
    };

    return (
        <header className="sticky top-0 z-10 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-transparent px-8 py-4 flex items-center justify-between">
            {/* Title and Version */}
            <div className="flex items-center gap-4">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Vue Globale</h1>
                <span className="px-2.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-medium border border-slate-300 dark:border-slate-700">
                    v2.4.0
                </span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
                {/* Search Bar */}
                <div className="relative hidden md:block">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 material-icons-outlined text-lg">search</span>
                    <input
                        type="text"
                        placeholder="Rechercher..."
                        className="block w-64 pl-10 pr-3 py-2 border border-slate-300 dark:border-slate-600 rounded-full leading-5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-0 focus:border-blue-500 focus:shadow-[0_0_10px_rgba(59,130,246,0.5)] sm:text-sm shadow-sm transition-all"
                    />
                </div>

                {/* Date Range Picker */}
                <button className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-surface-dark border border-slate-200 dark:border-border-dark rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600 transition-colors shadow-sm">
                    <span className="material-icons-outlined text-lg">calendar_today</span>
                    30 Derniers Jours
                </button>

                {/* Notifications */}
                <button className="relative p-2 bg-white dark:bg-surface-dark border border-slate-200 dark:border-border-dark rounded-lg text-slate-500 hover:text-primary transition-colors shadow-sm">
                    <span className="material-icons-outlined">notifications</span>
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border border-white dark:border-slate-800"></span>
                </button>
            </div>
        </header>
    );
}
