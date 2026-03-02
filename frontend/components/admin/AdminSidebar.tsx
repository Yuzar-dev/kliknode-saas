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
        <aside className="w-72 bg-white dark:bg-surface-dark border-r border-slate-200 dark:border-border-dark flex flex-col flex-shrink-0 transition-all duration-300 z-20 shadow-sm">
            {/* Logo */}
            <div className="h-16 flex items-center px-6 border-b border-slate-100 dark:border-border-dark">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-primary flex items-center justify-center text-white font-bold shadow-sm">
                        K
                    </div>
                    <span className="text-slate-800 dark:text-white font-semibold text-lg tracking-tight">
                        Kliknode
                    </span>
                </div>
            </div>

            {/* Navigation */}
            <div className="flex-1 overflow-y-auto py-6 px-3 space-y-1 custom-scrollbar">
                {navigation.map((section, idx) => (
                    <div key={idx} className={idx > 0 ? "pt-4 pb-2" : "pb-2"}>
                        <div className="px-3 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
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
                                    className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors mb-1 ${isActive
                                        ? 'bg-blue-50 text-blue-600 border border-blue-100 shadow-sm'
                                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400 border border-transparent'
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
            <div className="p-4 border-t border-slate-200 dark:border-border-dark bg-slate-50/50 dark:bg-surface-dark/50">
                <div className="flex items-center gap-3">
                    <img
                        alt="User avatar"
                        className="h-9 w-9 rounded-full object-cover border border-slate-300 dark:border-slate-600 shadow-sm bg-slate-200"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuCVfG36ZP5nzJ0oHJ5gYKrku0ARc0PYZf-m8fpImsMKXU23omaK4vRt8snFCvf5Y_l64rHhsYNhuxhEfun6O4TQVQtqZQ5Y3Bz38ZkhAjgUHnr3JbDY4vZhIbuDApUT2CuyymKP7-dW0KxgaoJjg98tM2qoRIUNGNqDtGUPBTZnQDWYkMXqIc1V0SZuZDA7VKE9qUYPGrGaWsjVlRlZm5QxKYXD0ukhkhLr0JYedIUyu21crIzBm2aaS6CoxPGULUJbbRDPEtH6mIg"
                    />
                    <div className="flex flex-col">
                        <span className="text-sm font-semibold text-slate-700 dark:text-white">
                            {user ? `${user.firstName} ${user.lastName}` : 'Thomas Dubois'}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                            {user?.role === 'super_admin' ? 'Responsable Logistique' : 'Opérateur'}
                        </span>
                    </div>
                </div>
            </div>
        </aside>
    );
}
