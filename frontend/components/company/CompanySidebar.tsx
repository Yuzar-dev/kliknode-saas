'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function CompanySidebar() {
    const pathname = usePathname();

    const isActive = (path: string) => pathname === path;

    return (
        <aside className="w-64 bg-surface-light dark:bg-surface-dark border-r border-border-light dark:border-border-dark flex flex-col justify-between transition-colors duration-300 z-20 hidden lg:flex overflow-y-auto font-display">
            <div>
                <div className="h-16 flex items-center px-6 border-b border-border-light dark:border-border-dark mb-6 sticky top-0 bg-surface-light dark:bg-surface-dark z-10">
                    <div className="flex items-center gap-2 text-primary font-bold text-xl tracking-tight">
                        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white">
                            <span className="material-icons text-lg">layers</span>
                        </div>
                        Dopo<span className="text-slate-900 dark:text-white">Card</span>
                    </div>
                </div>
                <nav className="px-3 space-y-6 pb-6">
                    <div>
                        <h3 className="px-3 mb-2 text-slate-400 font-semibold text-[10px] uppercase tracking-wider">Tableau de bord</h3>
                        <Link href="/company/dashboard" className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg group relative transition-colors ${isActive('/company/dashboard') || isActive('/company') ? 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'}`}>
                            <span className="material-icons text-[20px]">dashboard</span>
                            Accueil
                            {(isActive('/company/dashboard') || isActive('/company'))}
                        </Link>
                    </div>
                    <div>
                        <h3 className="px-3 mb-2 text-slate-400 font-semibold text-[10px] uppercase tracking-wider">Flotte (Employés)</h3>
                        <div className="space-y-1">
                            <Link href="/company/employees" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 transition-colors">
                                <span className="material-icons text-[20px]">contacts</span>
                                Annuaire
                            </Link>
                            <Link href="/company/groups" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 transition-colors">
                                <span className="material-icons text-[20px]">groups</span>
                                Groupes / Départements
                            </Link>
                        </div>
                    </div>
                    <div>
                        <h3 className="px-3 mb-2 text-slate-400 font-semibold text-[10px] uppercase tracking-wider">Branding (Image)</h3>
                        <div className="space-y-1">
                            <Link href="/company/branding" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 transition-colors">
                                <span className="material-icons text-[20px]">palette</span>
                                Identité Visuelle
                            </Link>
                            <Link href="/company/lock" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 transition-colors">
                                <span className="material-icons text-[20px]">lock</span>
                                Master Lock (Verrouillage)
                            </Link>
                        </div>
                    </div>
                    <div>
                        <h3 className="px-3 mb-2 text-slate-400 font-semibold text-[10px] uppercase tracking-wider">Leads (CRM)</h3>
                        <Link href="/company/leads" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 transition-colors">
                            <span className="material-icons text-[20px]">book</span>
                            Carnet de Contacts
                        </Link>
                    </div>
                    <div>
                        <h3 className="px-3 mb-2 text-slate-400 font-semibold text-[10px] uppercase tracking-wider">Facturation</h3>
                        <Link href="/company/subscription" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 transition-colors">
                            <span className="material-icons text-[20px]">receipt_long</span>
                            Mon Abonnement
                        </Link>
                    </div>
                </nav>
            </div>
            <div className="p-4 border-t border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark sticky bottom-0">
                <a className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors" href="#">
                    {/* Placeholder Avatar - Replace with real user data later */}
                    <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500">
                        <span className="material-icons text-sm">person</span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 dark:text-white truncate">Admin Entreprise</p>
                        <p className="text-xs text-slate-500 truncate">Gestion</p>
                    </div>
                    <span className="material-icons text-slate-400 text-lg">settings</span>
                </a>
            </div>
        </aside>
    );
}
