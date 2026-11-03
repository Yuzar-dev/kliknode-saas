'use client';

import { useAuthStore } from '@/store/auth-store';
import { useRouter } from 'next/navigation';
import { ThemeToggle } from '../user/ThemeToggle'; // Assume same path structure or adjust if needed

export default function AdminHeader() {
    const router = useRouter();
    const { user, logout } = useAuthStore();

    const handleLogout = () => {
        logout();
        router.push('/login');
    };

    return (
        <header className="sticky top-0 z-40 my-4 mx-4 md:mx-8 klik-glass rounded-[2.5rem] px-6 py-4 flex items-center justify-between border border-white/40 dark:border-white/10 shadow-xl shadow-slate-200/20 dark:shadow-none backdrop-blur-3xl bg-white/60 dark:bg-black/40">
            {/* Title / Brand side */}
            <div className="flex items-center gap-4 hidden sm:flex">
                <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/30">
                    <span className="material-symbols-outlined text-[20px] font-bold">shield_person</span>
                </div>
                <div>
                    <h1 className="text-xl font-black text-apple-textDark dark:text-white tracking-tight leading-none">Global Control</h1>
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-apple-secondary dark:text-slate-400">Admin Space</span>
                </div>
            </div>
            
            <div className="flex items-center gap-4 sm:hidden">
                <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/30">
                    <span className="material-symbols-outlined text-[20px] font-bold">shield_person</span>
                </div>
            </div>

            {/* Actions side */}
            <div className="flex items-center gap-3 sm:gap-4">
                
                {/* Search Bar - Hidden on small screens */}
                <div className="relative hidden md:block group">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-apple-secondary group-focus-within:text-primary transition-colors material-symbols-outlined text-[18px]">search</span>
                    <input
                        type="text"
                        placeholder="Recherche Rapide..."
                        className="block w-64 pl-12 pr-4 py-2.5 border border-white/60 dark:border-white/10 rounded-full bg-white/40 dark:bg-white/5 text-apple-textDark dark:text-white placeholder-apple-secondary/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white dark:focus:bg-black/60 text-xs font-bold transition-all shadow-sm"
                    />
                </div>

                <div className="h-8 w-[1px] bg-slate-200 dark:bg-white/10 mx-1 hidden sm:block"></div>

                <ThemeToggle />

                {/* Notifications */}
                <button className="relative w-10 h-10 rounded-[1rem] bg-white/50 dark:bg-white/5 border border-white/60 dark:border-white/10 flex items-center justify-center text-apple-secondary hover:text-primary transition-colors shadow-sm">
                    <span className="material-symbols-outlined text-[20px]">notifications</span>
                    <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>
                </button>

                {/* User Profile / Logout */}
                <div className="flex items-center gap-3 pl-2 sm:pl-4 border-l border-slate-200 dark:border-white/10">
                    <div className="hidden sm:block text-right">
                        <p className="text-xs font-black text-apple-textDark dark:text-white leading-tight">{user?.firstName || 'Admin'}</p>
                        <p className="text-[9px] font-black text-primary uppercase tracking-widest">Superviseur</p>
                    </div>
                    <button 
                        onClick={handleLogout}
                        className="w-10 h-10 rounded-[1rem] bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 flex items-center justify-center text-apple-secondary hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 hover:border-red-200 dark:hover:border-red-500/20 transition-all shadow-sm group"
                        title="Se déconnecter"
                    >
                        <span className="material-symbols-outlined text-[20px] group-hover:block transition-transform">logout</span>
                    </button>
                </div>
            </div>
        </header>
    );
}
