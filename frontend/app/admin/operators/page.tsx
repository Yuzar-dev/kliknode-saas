'use client';

import React, { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Pagination } from '@/components/ui/Pagination';
import { AdminButton } from '@/components/ui/AdminButton';

export default function OperatorsPage() {
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;
    const totalItems = 142;
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    return (
        <AdminLayout>
            <div className="flex-1 overflow-y-auto h-full relative">
                <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-10 border-b border-slate-200 dark:border-slate-800 px-8 py-4 flex items-center justify-between">
                    <div>
                        <nav aria-label="Breadcrumb" className="flex mb-1">
                            <ol className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400">
                                <li>Système</li>
                                <li><span className="material-icons-outlined text-[10px] text-slate-300">chevron_right</span></li>
                                <li>Sécurité</li>
                                <li><span className="material-icons-outlined text-[10px] text-slate-300">chevron_right</span></li>
                                <li className="font-medium text-primary">Opérateurs</li>
                            </ol>
                        </nav>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Gestion des Opérateurs</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="relative hidden lg:block">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <span className="material-icons-outlined text-slate-400 text-lg">search</span>
                            </span>
                            <input
                                className="block w-64 pl-10 pr-3 py-2 border border-slate-200 dark:border-slate-700 rounded-full leading-5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-0 focus:border-blue-500 focus:shadow-[0_0_10px_rgba(59,130,246,0.5)] sm:text-sm transition-all"
                                placeholder="Rechercher un opérateur..."
                                type="text"
                            />
                        </div>
                        <AdminButton variant="primary">
                            <span className="material-icons-outlined text-sm mr-2">add</span>
                            Créer compte Logistique
                        </AdminButton>
                    </div>
                </header>

                <div className="p-8 max-w-7xl mx-auto space-y-8">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-slate-500 uppercase">Total Opérateurs</p>
                                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">142</p>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                <span className="material-icons-outlined">groups</span>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-slate-500 uppercase">Site Paris</p>
                                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">89</p>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                <span className="material-icons-outlined">location_city</span>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-slate-500 uppercase">Site Casa</p>
                                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">53</p>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
                                <span className="material-icons-outlined">wb_sunny</span>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-slate-500 uppercase">Actifs (24h)</p>
                                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">12</p>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                                <span className="material-icons-outlined">online_prediction</span>
                            </div>
                        </div>
                    </div>

                    {/* Table Section */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
                            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Liste des accès</h2>
                            <div className="flex items-center gap-2">
                                <AdminButton variant="secondary" className="px-3 py-1.5 h-auto text-slate-600 dark:text-slate-400 bg-slate-50 border-slate-200 dark:border-slate-700 hover:bg-slate-100 gap-2">
                                    <span className="material-icons-outlined text-sm">filter_list</span>
                                    Filtres
                                </AdminButton>
                                <AdminButton variant="secondary" className="px-3 py-1.5 h-auto text-slate-600 dark:text-slate-400 bg-slate-50 border-slate-200 dark:border-slate-700 hover:bg-slate-100 gap-2">
                                    <span className="material-icons-outlined text-sm">download</span>
                                    Export
                                </AdminButton>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                                <thead className="bg-slate-50 dark:bg-slate-800/50">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider" scope="col">Nom de l'Opérateur</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider" scope="col">Email Professionnel</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider" scope="col">Entrepôt Assigné</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider" scope="col">Dernière Connexion</th>
                                        <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider" scope="col">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-700">
                                    {/* Row 1 */}
                                    <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10 relative">
                                                    <img className="h-10 w-10 rounded-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBygLBtXFNatKhOrS1F3MWN52vB2FjUSQib5JWoBX9fARv1T2d3yefWE2ifM-Lj_9pEg_leVcMyYLcRFye2PJLyWm1Ca32RPj65QP4MeMX47cXrVolNEkY8HiJ3VJXnbK_FwKT5ECoIv2Iw4fo4-z7p_DitXxHn9Fmj3zjCV1VIku7WKYZjE0ExfD5Ygd-okXbTbIJOD89agDsjhIAdlf5jANT1OvXrHcdPY8Is6P1evC26uMF17dd1fyw2-mDqBL265a1KkhzWZSo" alt="Jean Dupont" />
                                                    <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full ring-2 ring-white dark:ring-slate-900 bg-green-400"></span>
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-slate-900 dark:text-white">Jean Dupont</div>
                                                    <div className="text-xs text-slate-500 dark:text-slate-400">ID: OPR-2023-884</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-slate-600 dark:text-slate-300">jean.d@corp-logistics.com</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                                                Paris Sud
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                                            <div className="flex items-center gap-1">
                                                <span className="material-icons-outlined text-sm text-slate-400">schedule</span>
                                                il y a 2 heures
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/20 px-3 py-1 rounded-full transition-colors text-xs font-semibold opacity-0 group-hover:opacity-100 flex items-center gap-1 ml-auto">
                                                <span className="material-icons-outlined text-sm">block</span>
                                                Révoquer accès
                                            </button>
                                        </td>
                                    </tr>
                                    {/* Row 2 */}
                                    <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10 relative">
                                                    <img className="h-10 w-10 rounded-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuA-vUqXVhP-7YYtknh_DWdt_lOxQaQADc5V9PQ5AE-H6uSDoSvWxNSQtAqEkcq3D98Ci79JxJcqJL3t4mlqZmA8dtpcWA8wolIzYU4KI4uSYt83eybGST0a5PBdQDclvKZACFZybkoOlQe38tkC2iZDxh34rEbPONHHxuzex-5V7vMYSXWJCAabse3o-6g2k-XThz_sxEpBFlNqOum5Wf67V37uXB9QR3RMW1LGoURLxjbMuHCtFwF0zuGQTF-w_zfC4VqjXZr6xFc" alt="Sarah Maalouf" />
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-slate-900 dark:text-white">Sarah Maalouf</div>
                                                    <div className="text-xs text-slate-500 dark:text-slate-400">ID: OPR-2023-102</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-slate-600 dark:text-slate-300">s.maalouf@corp-logistics.com</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                                                Casa Hub
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                                            <div className="flex items-center gap-1">
                                                <span className="material-icons-outlined text-sm text-slate-400">schedule</span>
                                                il y a 1 jour
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/20 px-3 py-1 rounded-full transition-colors text-xs font-semibold opacity-0 group-hover:opacity-100 flex items-center gap-1 ml-auto">
                                                <span className="material-icons-outlined text-sm">block</span>
                                                Révoquer accès
                                            </button>
                                        </td>
                                    </tr>
                                    {/* Row 3 */}
                                    <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10 relative">
                                                    <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500 font-bold">
                                                        MR
                                                    </div>
                                                    <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full ring-2 ring-white dark:ring-slate-900 bg-green-400"></span>
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-slate-900 dark:text-white">Mike Ross</div>
                                                    <div className="text-xs text-slate-500 dark:text-slate-400">ID: OPR-2024-005</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-slate-600 dark:text-slate-300">m.ross@corp-logistics.com</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                                                Paris Sud
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                                            <div className="flex items-center gap-1 text-green-600 dark:text-green-400 font-medium">
                                                <span className="material-icons-outlined text-sm">fiber_manual_record</span>
                                                En ligne
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/20 px-3 py-1 rounded-full transition-colors text-xs font-semibold opacity-0 group-hover:opacity-100 flex items-center gap-1 ml-auto">
                                                <span className="material-icons-outlined text-sm">block</span>
                                                Révoquer accès
                                            </button>
                                        </td>
                                    </tr>
                                    {/* Row 4 */}
                                    <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10 relative">
                                                    <img className="h-10 w-10 rounded-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBGkB4K8wVSkSHTqp7fpIfq0Uu6utj23TSmk1lhj8yEMVA0R5sGR5Swz5Kx8qDmVblQEaSH4JuiFFFUC4yzmFrDSigCPOatl6K_zqkWebPBoKJP6SCB7j7b5QoisMmeIrMJKS2f7S8NJ1tfDWsrFGCgSFj12LqYGk0CjO2GM2SMqLc-FHDenWAuJ9bNIG_ucvKyvb81IL4_7Dn_sGoWy8S3wbAD8uSsMm6cp3oQfSGrfUpbzeO2LSsTR47F_Z7N-8iipt8o1Fv3glM" alt="Amine Benali" />
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-slate-900 dark:text-white">Amine Benali</div>
                                                    <div className="text-xs text-slate-500 dark:text-slate-400">ID: OPR-2023-156</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-slate-600 dark:text-slate-300">amine.b@corp-logistics.com</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                                                Casa Hub
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                                            <div className="flex items-center gap-1">
                                                <span className="material-icons-outlined text-sm text-slate-400">schedule</span>
                                                il y a 3 jours
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/20 px-3 py-1 rounded-full transition-colors text-xs font-semibold opacity-0 group-hover:opacity-100 flex items-center gap-1 ml-auto">
                                                <span className="material-icons-outlined text-sm">block</span>
                                                Révoquer accès
                                            </button>
                                        </td>
                                    </tr>
                                    {/* Row 5 */}
                                    <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10 relative">
                                                    <img className="h-10 w-10 rounded-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCBVzJRaI7ZJAdYH62zyVH-zc_gL4vOLClVGRllYaQPmkyzzfyMCPCR8Z-9wywbzzgDSG2LKJo_YnU6QStxplphoUJ-XMEiqVpdWj1M9SfyDZOrChOsYuCpv6sLuuuseKnxj_JYkvA8TDNcPqUGTk9LTkK5hxsnt3EeRh9Y05iG8Rkdp0Z_orROFt7IH7jysCXDT7oKZxPJGP0EfPLzTBfC5-99I_anJtBZX_-b6vdrzFwiSQhGbQQtWg8q45g0MWgx05vMLoFvMDU" alt="Élise Martin" />
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-slate-900 dark:text-white">Élise Martin</div>
                                                    <div className="text-xs text-slate-500 dark:text-slate-400">ID: OPR-2023-012</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-slate-600 dark:text-slate-300">e.martin@corp-logistics.com</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                                                Paris Sud
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                                            <div className="flex items-center gap-1">
                                                <span className="material-icons-outlined text-sm text-slate-400">schedule</span>
                                                il y a 5 jours
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/20 px-3 py-1 rounded-full transition-colors text-xs font-semibold opacity-0 group-hover:opacity-100 flex items-center gap-1 ml-auto">
                                                <span className="material-icons-outlined text-sm">block</span>
                                                Révoquer accès
                                            </button>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <div className="bg-white dark:bg-slate-900 px-4 py-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between sm:px-6">
                            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                <div>
                                    <p className="text-sm text-slate-700 dark:text-slate-300">
                                        Affichage de <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> à <span className="font-medium">{Math.min(currentPage * itemsPerPage, totalItems)}</span> sur <span className="font-medium">{totalItems}</span> résultats
                                    </p>
                                </div>
                                <Pagination
                                    currentPage={currentPage}
                                    totalPages={totalPages}
                                    onPageChange={setCurrentPage}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-center">
                        <p className="text-xs text-slate-400 text-center max-w-md">
                            Les accès révoqués peuvent être restaurés dans l'onglet "Logs d'Audit" sous 30 jours. Pour une suppression définitive, contactez le DSI.
                        </p>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
