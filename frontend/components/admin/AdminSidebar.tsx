'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';

const navigation = [
    {
        section: 'Tableau de Bord',
        items: [
            { name: 'Vue Globale', href: '/admin', icon: 'dashboard' }
        ]
    },
    {
        section: 'Gestion Commerciale (B2B)',
        items: [
            { name: 'Liste des Entreprises', href: '/admin/companies', icon: 'business' },
            { name: 'Fiche Détail Entreprise', href: '/admin/companies/1', icon: 'info' },
            { name: 'Onboarding', href: '/admin/companies/new', icon: 'person_add' }
        ]
    },
    {
        section: 'Finance & Plans',
        items: [
            { name: 'Gestion des Abonnements', href: '/admin/plans', icon: 'card_membership' },
            { name: 'Transactions & Factures', href: '/admin/transactions', icon: 'receipt_long' },
            { name: 'Codes Promo', href: '/admin/promo-codes', icon: 'local_offer' }
        ]
    },
    {
        section: 'Logistique & Matériel',
        items: [
            { name: 'Gestion des Stocks', href: '/admin/inventory', icon: 'inventory_2' },
            { name: 'Commandes Hardware', href: '/admin/hardware-orders', icon: 'shopping_cart' },
            { name: 'Générateur de Lots', href: '/admin/batch-generator', icon: 'qr_code' }
        ]
    },
    {
        section: 'Système & Sécurité',
        items: [
            { name: 'Gestion des Opérateurs', href: '/admin/operators', icon: 'admin_panel_settings' },
            { name: 'Journal d\'Audit', href: '/admin/audit-logs', icon: 'history' }
        ]
    }
];

export default function AdminSidebar() {
    const pathname = usePathname();
    const user = useAuthStore((state) => state.user);

    return (
        <aside className="w-72 klik-glass rounded-[2.5rem] m-4 mr-0 flex flex-col flex-shrink-0 transition-all duration-300 z-20 overflow-hidden shadow-glass-light dark:shadow-glass-dark border border-white/40 dark:border-white/5">
            {/* Logo */}
            <div className="h-20 flex items-center px-8 border-b border-slate-100/50 dark:border-white/5">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl btn-titanium-primary flex items-center justify-center text-white font-black shadow-lg">
                        K
                    </div>
                    <span className="text-slate-900 dark:text-white font-black text-xl tracking-tighter">
                        Kliknode
                    </span>
                </div>
            </div>

            {/* Navigation */}
            <div className="flex-1 overflow-y-auto py-6 px-3 space-y-1 custom-scrollbar">
                {navigation.map((section, idx) => (
                    <div key={idx} className={idx > 0 ? "pt-4 pb-2" : "pb-2"}>
                        <div className="px-4 mb-3 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] opacity-80">
                            {section.section}
                        </div>
                        {section.items.map((item) => {
                            let isActive = false;

                            // Special handling for companies routes to differentiate:
                            // - /admin/companies (Liste)
                            // - /admin/companies/[id] (Détail)
                            // - /admin/companies/new (Onboarding)
                            if (item.href === '/admin/companies') {
                                // Liste des Entreprises: active only for exact /admin/companies
                                isActive = pathname === '/admin/companies';
                            } else if (item.href === '/admin/companies/1') {
                                // Fiche Détail: active for /admin/companies/[numeric id]
                                isActive = !!pathname?.match(/^\/admin\/companies\/\d+$/);
                            } else if (item.href === '/admin/companies/new') {
                                // Onboarding: active for exact /admin/companies/new
                                isActive = pathname === '/admin/companies/new';
                            } else {
                                // Default behavior for other routes
                                isActive = pathname === item.href || (item.href !== '/admin' && !!pathname?.startsWith(item.href));
                            }

                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`group flex items-center px-4 py-3 text-sm font-bold rounded-2xl transition-all duration-300 mb-1.5 ${isActive
                                        ? 'bg-white dark:bg-white/10 text-blue-600 dark:text-blue-400 shadow-glass-light dark:shadow-glass-dark border border-white/60 dark:border-white/10 scale-[1.02]'
                                        : 'text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-white/5 hover:text-blue-600 dark:hover:text-blue-400 border border-transparent'
                                        }`}
                                >
                                    <span
                                        className={`material-icons-outlined mr-3 text-lg transition-colors ${isActive
                                            ? 'text-blue-600'
                                            : 'text-slate-400 group-hover:text-blue-600'
                                            }`}
                                    >
                                        {item.icon}
                                    </span>
                                    <span className="truncate">{item.name}</span>
                                </Link>
                            );
                        })}
                    </div>
                ))}
            </div>

            {/* User Profile */}
            <div className="p-6 border-t border-slate-100/50 dark:border-white/5 bg-white/30 dark:bg-white/5 backdrop-blur-md">
                <div className="flex items-center gap-3">
                    <div className="relative group">
                        <img
                            alt="User avatar"
                            className="h-10 w-10 rounded-2xl object-cover border-2 border-white dark:border-white/10 shadow-xl bg-slate-200 transition-transform group-hover:scale-110"
                            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCVfG36ZP5nzJ0oHJ5gYKrku0ARc0PYZf-m8fpImsMKXU23omaK4vRt8snFCvf5Y_l64rHhsYNhuxhEfun6O4TQVQtqZQ5Y3Bz38ZkhAjgUHnr3JbDY4vZhIbuDApUT2CuyymKP7-dW0KxgaoJjg98tM2qoRIUNGNqDtGUPBTZnQDWYkMXqIc1V0SZuZDA7VKE9qUYPGrGaWsjVlRlZm5QxKYXD0ukhkhLr0JYedIUyu21crIzBm2aaS6CoxPGULUJbbRDPEtH6mIg"
                        />
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-[#1c1c1e] shadow-sm"></div>
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="text-sm font-black text-slate-900 dark:text-white truncate tracking-tight">
                            {user ? `${user.firstName} ${user.lastName}` : 'Thomas Dubois'}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest truncate">
                            {user?.role === 'ADMIN' ? 'Responsable Logistique' : 'Opérateur'}
                        </span>
                    </div>
                </div>
            </div>
        </aside>
    );
}
