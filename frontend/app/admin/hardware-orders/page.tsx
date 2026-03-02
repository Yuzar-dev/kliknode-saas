'use client';

import React, { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Pagination } from '@/components/ui/Pagination';

type OrderStatus = 'To Prepare' | 'Shipped' | 'Delivered';

type Order = {
    id: string;
    clientName: string;
    clientInitials: string;
    clientColor: string; // Tailwind class for bg/text
    productName: string;
    productSku: string;
    quantity: number;
    status: OrderStatus;
    date: string;
};

export default function HardwareOrdersPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<'all' | 'to_prepare' | 'shipped' | 'delivered'>('all');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    // Mock Data
    const orders: Order[] = [
        {
            id: '#ORD-2024-001',
            clientName: 'Alice Dupont',
            clientInitials: 'AD',
            clientColor: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
            productName: 'YubiKey 5 NFC',
            productSku: 'HW-YUBI-05',
            quantity: 2,
            status: 'To Prepare',
            date: '24 Oct 2023',
        },
        {
            id: '#ORD-2024-002',
            clientName: 'Jean Martin',
            clientInitials: 'JM',
            clientColor: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
            productName: 'Laptop Stand Pro',
            productSku: 'ACC-STAND-01',
            quantity: 1,
            status: 'Shipped',
            date: '23 Oct 2023',
        },
        {
            id: '#ORD-2024-003',
            clientName: 'Sophie Bernard',
            clientInitials: 'SB',
            clientColor: 'bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400',
            productName: 'Monitor Dell 27"',
            productSku: 'HW-SCR-27',
            quantity: 1,
            status: 'Delivered',
            date: '20 Oct 2023',
        },
        {
            id: '#ORD-2024-004',
            clientName: 'Marc Leblanc',
            clientInitials: 'ML',
            clientColor: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
            productName: 'Ergonomic Mouse',
            productSku: 'ACC-MSE-ERGO',
            quantity: 3,
            status: 'To Prepare',
            date: '19 Oct 2023',
        },
        {
            id: '#ORD-2024-005',
            clientName: 'Claire Lemaitre',
            clientInitials: 'CL',
            clientColor: 'bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400',
            productName: 'Headset Noise Cancel',
            productSku: 'AUD-HS-ANC',
            quantity: 1,
            status: 'Delivered',
            date: '18 Oct 2023',
        },
    ];

    // Helpers
    const getStatusBadge = (status: OrderStatus) => {
        switch (status) {
            case 'To Prepare':
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800">
                        À préparer
                    </span>
                );
            case 'Shipped':
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary dark:bg-primary/20 dark:text-blue-300 border border-primary/20 dark:border-primary/30">
                        Expédié
                    </span>
                );
            case 'Delivered':
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        Livré
                    </span>
                );
        }
    };

    // Filter Logic
    const filteredOrders = orders.filter((order) => {
        const matchesSearch =
            order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            order.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            order.productName.toLowerCase().includes(searchQuery.toLowerCase());

        let matchesTab = true;
        if (activeTab === 'to_prepare') matchesTab = order.status === 'To Prepare';
        if (activeTab === 'shipped') matchesTab = order.status === 'Shipped';
        if (activeTab === 'delivered') matchesTab = order.status === 'Delivered';

        return matchesSearch && matchesTab;
    });

    // Pagination Logic
    const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedOrders = filteredOrders.slice(startIndex, startIndex + itemsPerPage);

    return (
        <AdminLayout>
            <div className="max-w-[1600px] mx-auto w-full">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Commandes Matériel</h1>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                            Gérez les demandes de matériel et les expéditions.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <span className="material-icons-outlined text-slate-400 group-focus-within:text-primary transition-colors text-lg">
                                    search
                                </span>
                            </div>
                            <input
                                className="block w-full sm:w-64 pl-10 pr-3 py-2 border border-slate-300 dark:border-slate-600 rounded-full leading-5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-0 focus:border-blue-500 focus:shadow-[0_0_10px_rgba(59,130,246,0.5)] sm:text-sm shadow-sm transition-all"
                                placeholder="Rechercher une commande..."
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <button className="inline-flex items-center justify-center px-4 py-2 border border-slate-300 dark:border-slate-600 shadow-sm text-sm font-medium rounded-full text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-0 transition-colors">
                            <span className="material-icons-outlined text-[18px] mr-2">download</span>
                            Exporter
                        </button>
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm flex items-start justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">À préparer</p>
                            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">12</h3>
                        </div>
                        <div className="p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                            <span className="material-icons-outlined text-yellow-600 dark:text-yellow-400 text-2xl">pending_actions</span>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm flex items-start justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">En transit</p>
                            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">45</h3>
                        </div>
                        <div className="p-2 bg-primary/10 dark:bg-primary/20 rounded-lg">
                            <span className="material-icons-outlined text-primary dark:text-blue-400 text-2xl">local_shipping</span>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm flex items-start justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Livrées (Mois)</p>
                            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">128</h3>
                        </div>
                        <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                            <span className="material-icons-outlined text-emerald-600 dark:text-emerald-400 text-2xl">check_circle</span>
                        </div>
                    </div>
                    <div className="bg-primary rounded-xl p-5 border border-primary shadow-md flex flex-col justify-center items-center text-center">
                        <p className="text-white text-sm font-medium mb-3">Nouvelle Demande</p>
                        <button className="bg-white/20 hover:bg-white/30 text-white text-xs font-bold py-1.5 px-3 rounded-lg transition-colors flex items-center gap-1">
                            <span className="material-icons-outlined text-sm">add</span> Créer
                        </button>
                    </div>
                </div>

                {/* Table Section */}
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden flex flex-col">
                    {/* Toolbar */}
                    <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
                            <button
                                onClick={() => setActiveTab('all')}
                                className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors whitespace-nowrap ${activeTab === 'all'
                                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white ring-1 ring-slate-200 dark:ring-slate-700'
                                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                                    }`}
                            >
                                Tous
                            </button>
                            <button
                                onClick={() => setActiveTab('to_prepare')}
                                className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors whitespace-nowrap ${activeTab === 'to_prepare'
                                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white ring-1 ring-slate-200 dark:ring-slate-700'
                                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                                    }`}
                            >
                                À préparer
                            </button>
                            <button
                                onClick={() => setActiveTab('shipped')}
                                className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors whitespace-nowrap ${activeTab === 'shipped'
                                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white ring-1 ring-slate-200 dark:ring-slate-700'
                                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                                    }`}
                            >
                                Expédiés
                            </button>
                            <button
                                onClick={() => setActiveTab('delivered')}
                                className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors whitespace-nowrap ${activeTab === 'delivered'
                                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white ring-1 ring-slate-200 dark:ring-slate-700'
                                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                                    }`}
                            >
                                Livrés
                            </button>
                        </div>
                        <div className="flex items-center gap-2">
                            <select className="form-select bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs rounded-full py-1.5 pl-3 pr-8 focus:ring-0 focus:border-blue-500 focus:shadow-[0_0_10px_rgba(59,130,246,0.5)]">
                                <option>Derniers 30 jours</option>
                                <option>Cette semaine</option>
                                <option>Aujourd'hui</option>
                            </select>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                            <thead className="bg-slate-50 dark:bg-slate-900/50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 w-12">
                                        <input
                                            type="checkbox"
                                            className="rounded border-slate-300 text-primary focus:ring-primary h-4 w-4 bg-white dark:bg-slate-800 dark:border-slate-600"
                                        />
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                        Commande
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                        Client
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                        Article (SKU)
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                        Qté
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                        Statut
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                        Date
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-700 bg-white dark:bg-slate-800">
                                {paginatedOrders.map((order) => (
                                    <tr key={order.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <input
                                                type="checkbox"
                                                className="rounded border-slate-300 text-primary focus:ring-primary h-4 w-4 bg-white dark:bg-slate-800 dark:border-slate-600"
                                            />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-sm font-medium text-slate-900 dark:text-white">{order.id}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <div className={`h-8 w-8 rounded-full ${order.clientColor} flex items-center justify-center text-xs font-bold`}>
                                                    {order.clientInitials}
                                                </div>
                                                <div className="text-sm text-slate-700 dark:text-slate-300">{order.clientName}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm text-slate-900 dark:text-white font-medium">{order.productName}</span>
                                                <span className="text-xs text-slate-500">{order.productSku}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <span className="text-sm text-slate-600 dark:text-slate-400">{order.quantity}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getStatusBadge(order.status)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                                            {order.date}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button className="p-1.5 text-slate-500 hover:text-primary hover:bg-primary/10 rounded-full transition-colors" title="Print Label">
                                                    <span className="material-icons-outlined text-lg">print</span>
                                                </button>
                                                <button className="p-1.5 text-slate-500 hover:text-primary hover:bg-primary/10 rounded-full transition-colors" title="Update Status">
                                                    <span className="material-icons-outlined text-lg">edit</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-700">
                        <div className="text-sm text-slate-500 dark:text-slate-400">
                            Affichage de <span className="font-medium text-slate-900 dark:text-white">{Math.min(filteredOrders.length, startIndex + 1)}</span> à <span className="font-medium text-slate-900 dark:text-white">{Math.min(filteredOrders.length, startIndex + itemsPerPage)}</span> sur <span className="font-medium text-slate-900 dark:text-white">{filteredOrders.length}</span> résultats
                        </div>
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage}
                        />
                    </div>
                </div>

                <div className="mt-6 flex justify-center">
                    <p className="text-xs text-slate-400 flex items-center gap-1">
                        <span className="material-icons-outlined text-sm">info</span>
                        Les commandes marquées comme "Livrées" sont archivées automatiquement après 30 jours.
                    </p>
                </div>

            </div>
        </AdminLayout>
    );
}
