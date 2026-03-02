'use client';

import React, { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Pagination } from '@/components/ui/Pagination';
import { toast } from 'react-hot-toast';
import { AdminButton } from '@/components/ui/AdminButton';

// Mock Data
const MOCK_INVENTORY = [
    { id: 1, name: 'MacBook Pro 14" M2', sku: 'APP-MBP-14-M2-SIL', icon: 'laptop_mac', warehouse: 'Paris', color: 'purple', qtyPhysical: 50, qtyReserved: 5, qtyAvailable: 45, lowStock: false },
    { id: 2, name: 'Dell XPS 15"', sku: 'DLL-XPS-15-9520', icon: 'laptop_windows', warehouse: 'Casa', color: 'orange', qtyPhysical: 12, qtyReserved: 0, qtyAvailable: 12, lowStock: true },
    { id: 3, name: 'Monitor LG UltraFine 27"', sku: 'LG-27UN880-B', icon: 'desktop_windows', warehouse: 'Paris', color: 'purple', qtyPhysical: 100, qtyReserved: 20, qtyAvailable: 80, lowStock: false },
    { id: 4, name: 'Logitech MX Keys', sku: 'LOG-MX-KEYS-FR', icon: 'keyboard', warehouse: 'Casa', color: 'orange', qtyPhysical: 240, qtyReserved: 45, qtyAvailable: 195, lowStock: false },
    { id: 5, name: 'Cisco Router ISR 4000', sku: 'CIS-ISR-4331', icon: 'router', warehouse: 'Paris', color: 'purple', qtyPhysical: 2, qtyReserved: 1, qtyAvailable: 1, lowStock: true, alert: true },
    { id: 6, name: 'Apple Magic Mouse 2', sku: 'APP-MM2-WHT', icon: 'mouse', warehouse: 'Paris', color: 'purple', qtyPhysical: 45, qtyReserved: 5, qtyAvailable: 40, lowStock: false },
];

export default function InventoryPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [warehouseFilter, setWarehouseFilter] = useState('Tous les entrepôts');
    const [lowStockFilter, setLowStockFilter] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    // Filter Logic
    const filteredItems = MOCK_INVENTORY.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.sku.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesWarehouse = warehouseFilter === 'Tous les entrepôts' ||
            (warehouseFilter.includes('Paris') && item.warehouse === 'Paris') ||
            (warehouseFilter.includes('Casa') && item.warehouse === 'Casa');
        const matchesLowStock = !lowStockFilter || item.lowStock;

        return matchesSearch && matchesWarehouse && matchesLowStock;
    });

    // Pagination Logic
    const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedItems = filteredItems.slice(startIndex, startIndex + itemsPerPage);

    const handleAction = (action: string) => {
        toast.success(`Action "${action}" déclenchée (Simulation)`, {
            icon: '🚧',
            style: {
                borderRadius: '10px',
                background: '#333',
                color: '#fff',
            },
        });
    };

    return (
        <AdminLayout>
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                <div className="max-w-7xl mx-auto space-y-8">
                    {/* Page Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Gestion des Stocks</h1>
                            <p className="text-slate-500 mt-1">Vue d'ensemble et mouvements de stock par entrepôt.</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => handleAction('Transfert Inter-Entrepôts')}
                                className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-primary px-4 py-2.5 rounded-full text-sm font-medium flex items-center shadow-sm transition-all whitespace-nowrap"
                            >
                                <span className="material-icons-outlined text-lg mr-2 text-slate-400">swap_horiz</span>
                                Transfert Inter-Entrepôts
                            </button>
                            <button
                                onClick={() => handleAction('Ajustement Stock')}
                                className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-primary px-4 py-2.5 rounded-full text-sm font-medium flex items-center shadow-sm transition-all whitespace-nowrap"
                            >
                                <span className="material-icons-outlined text-lg mr-2 text-slate-400">tune</span>
                                Ajustement Stock
                            </button>
                            <AdminButton
                                variant="primary"
                                onClick={() => handleAction('Entrée de Stock')}
                            >
                                <span className="material-icons-outlined text-lg mr-2">add</span>
                                Entrée de Stock
                            </AdminButton>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Stat Card 1 */}
                        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex items-start justify-between group">
                            <div>
                                <p className="text-sm font-medium text-slate-500">Valeur Totale du Stock</p>
                                <h3 className="text-2xl font-bold text-slate-900 mt-1">1,245,890 €</h3>
                                <span className="inline-flex items-center mt-2 px-2 py-0.5 rounded text-xs font-medium bg-green-50 text-green-700 border border-green-100">
                                    <span className="material-icons-outlined text-[10px] mr-1">arrow_upward</span> +2.5%
                                </span>
                            </div>
                            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                <span className="material-icons-outlined text-xl">monetization_on</span>
                            </div>
                        </div>

                        {/* Stat Card 2 */}
                        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex items-start justify-between group">
                            <div>
                                <p className="text-sm font-medium text-slate-500">Unités Disponibles</p>
                                <h3 className="text-2xl font-bold text-slate-900 mt-1">4,328</h3>
                                <span className="inline-flex items-center mt-2 px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                                    Paris & Casa combinés
                                </span>
                            </div>
                            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                <span className="material-icons-outlined text-xl">inventory_2</span>
                            </div>
                        </div>

                        {/* Stat Card 3 */}
                        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex items-start justify-between group">
                            <div>
                                <p className="text-sm font-medium text-slate-500">Alertes Stock Bas</p>
                                <h3 className="text-2xl font-bold text-slate-900 mt-1">5 Items</h3>
                                <span className="inline-flex items-center mt-2 px-2 py-0.5 rounded text-xs font-medium bg-red-50 text-red-700 border border-red-100">
                                    Action requise
                                </span>
                            </div>
                            <div className="p-3 bg-orange-50 text-orange-600 rounded-lg group-hover:bg-orange-600 group-hover:text-white transition-colors">
                                <span className="material-icons-outlined text-xl">warning</span>
                            </div>
                        </div>
                    </div>

                    {/* Table Section */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-[500px]">
                        {/* Filters */}
                        <div className="p-5 border-b border-slate-100 bg-white flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-center flex-1 gap-4">
                                <div className="relative w-full md:w-80">
                                    <span className="material-icons-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
                                    <input
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 rounded-full border border-slate-200 bg-slate-50 text-sm focus:ring-0 focus:border-blue-500 focus:shadow-[0_0_10px_rgba(59,130,246,0.5)] focus:bg-white outline-none transition-all placeholder:text-slate-400"
                                        placeholder="Rechercher par SKU, Nom..."
                                        type="text"
                                    />
                                </div>
                                <div className="relative">
                                    <select
                                        value={warehouseFilter}
                                        onChange={(e) => setWarehouseFilter(e.target.value)}
                                        className="appearance-none pl-4 pr-10 py-2 rounded-full border border-slate-200 bg-white text-sm text-slate-700 focus:ring-0 focus:border-blue-500 focus:shadow-[0_0_10px_rgba(59,130,246,0.5)] outline-none cursor-pointer hover:border-slate-300 transition-colors shadow-sm"
                                    >
                                        <option>Tous les entrepôts</option>
                                        <option>Paris (Hub Central)</option>
                                        <option>Casablanca (Hub Sud)</option>
                                    </select>
                                    <span className="material-icons-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg pointer-events-none">expand_more</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer select-none group">
                                    <div className="relative inline-block w-9 h-5 align-middle select-none transition duration-200 ease-in">
                                        <input
                                            checked={lowStockFilter}
                                            onChange={(e) => setLowStockFilter(e.target.checked)}
                                            className="toggle-checkbox absolute block w-3.5 h-3.5 rounded-full bg-white border-4 appearance-none cursor-pointer ml-0.5 mt-0.5 transition-transform duration-200 ease-in checked:translate-x-4 checked:border-primary checked:bg-primary"
                                            name="toggle"
                                            type="checkbox"
                                        />
                                        <div className={`toggle-label block overflow-hidden h-5 rounded-full cursor-pointer transition-colors ${lowStockFilter ? 'bg-primary' : 'bg-slate-200'} group-hover:bg-opacity-80`}></div>
                                    </div>
                                    Stock faible uniq.
                                </label>
                                <div className="h-6 w-px bg-slate-200 mx-2"></div>
                                <button className="p-2 hover:bg-slate-50 rounded-lg text-slate-500 hover:text-primary transition-colors border border-transparent hover:border-slate-200" title="Export CSV">
                                    <span className="material-icons-outlined text-xl">download</span>
                                </button>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="flex-1 overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/80 text-xs uppercase tracking-wider text-slate-500 font-semibold border-b border-slate-200">
                                        <th className="px-6 py-4 rounded-tl-lg">SKU / Produit</th>
                                        <th className="px-6 py-4">Entrepôt</th>
                                        <th className="px-6 py-4 text-right">Qté Physique</th>
                                        <th className="px-6 py-4 text-right">Qté Réservée</th>
                                        <th className="px-6 py-4 text-right">Qté Disponible</th>
                                        <th className="px-4 py-4 w-10"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-sm bg-white">
                                    {paginatedItems.map((item) => (
                                        <tr key={item.id} className={`group hover:bg-slate-50 transition-colors cursor-pointer ${item.alert ? 'bg-red-50/30' : ''}`}>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`h-10 w-10 rounded-lg ${item.alert ? 'bg-red-50 border-red-100' : 'bg-slate-100 border-transparent'} flex items-center justify-center flex-shrink-0 group-hover:bg-white group-hover:shadow-sm transition-all border group-hover:border-slate-200`}>
                                                        <span className={`material-icons-outlined ${item.alert ? 'text-red-400' : 'text-slate-400'} text-xl`}>{item.icon}</span>
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-slate-900 group-hover:text-primary transition-colors">{item.name}</div>
                                                        <div className="text-xs text-slate-500 font-mono mt-0.5">{item.sku}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-${item.color}-50 text-${item.color}-700 border border-${item.color}-100`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full bg-${item.color}-500 mr-1.5`}></span>
                                                    {item.warehouse}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right font-mono text-slate-600">{item.qtyPhysical}</td>
                                            <td className="px-6 py-4 text-right font-mono text-slate-600">{item.qtyReserved}</td>
                                            <td className="px-6 py-4 text-right">
                                                <span className={`font-bold font-mono px-2 py-1 rounded border ${item.lowStock ? 'text-red-600 bg-red-50 border-red-100' : item.warehouse === 'Casa' ? 'text-amber-700 bg-amber-50 border-amber-100' : 'text-emerald-700 bg-emerald-50 border-emerald-100'}`}>
                                                    {item.qtyAvailable}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 text-right">
                                                <button className="text-slate-400 hover:text-primary hover:bg-slate-100 p-1 rounded transition-colors opacity-0 group-hover:opacity-100">
                                                    <span className="material-icons-outlined text-xl">more_vert</span>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {paginatedItems.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                                                Aucun résultat trouvé pour votre recherche.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination Footer */}
                        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex flex-col md:flex-row items-center justify-between gap-4 mt-auto">
                            <p className="text-sm text-slate-500">
                                Affichage de <span className="font-medium text-slate-700">{Math.min(filteredItems.length, (currentPage - 1) * itemsPerPage + 1)}</span> à <span className="font-medium text-slate-700">{Math.min(filteredItems.length, currentPage * itemsPerPage)}</span> sur <span className="font-medium text-slate-700">{filteredItems.length}</span> résultats
                            </p>
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={setCurrentPage}
                            />
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-8 text-center pb-8">
                        <p className="text-xs text-slate-400">© 2024 V-Card SaaS Platform — Tous droits réservés.</p>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
