'use client';

export default function CompanyHeader() {
    return (
        <header className="h-16 flex items-center justify-between px-6 lg:px-8 bg-surface-light dark:bg-surface-dark border-b border-border-light dark:border-border-dark z-10 font-display">
            <div className="lg:hidden mr-4">
                <button className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">
                    <span className="material-icons">menu</span>
                </button>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                <span className="hover:text-slate-900 dark:hover:text-slate-200 cursor-pointer transition-colors">Team</span>
                <span className="text-slate-300 dark:text-slate-600">/</span>
                <span className="font-medium text-slate-900 dark:text-white">Overview</span>
            </div>
            <div className="flex items-center gap-4">
                <div className="hidden md:flex relative group">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">
                        <span className="material-icons text-[20px]">search</span>
                    </span>
                    <input className="w-64 pl-10 pr-4 py-1.5 text-sm bg-slate-50 dark:bg-slate-800 border-none rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-primary/20 transition-all focus:outline-none" placeholder="Search employees, cards..." type="text" />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1">
                        <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-medium text-slate-500 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded shadow-sm">⌘K</kbd>
                    </div>
                </div>
                <button className="relative p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                    <span className="material-icons text-[20px]">notifications_none</span>
                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-surface-dark"></span>
                </button>
            </div>
        </header>
    );
}
