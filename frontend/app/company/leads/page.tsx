'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Lead {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    phone: string | null;
    companyName: string | null;
    createdAt: string;
    user: {
        firstName: string | null;
        lastName: string | null;
        avatarUrl: string | null;
    };
}

export default function LeadsPage() {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [pagination, setPagination] = useState({
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 1
    });

    useEffect(() => {
        fetchLeads();
    }, [search, pagination.page]);

    const fetchLeads = async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams({
                page: pagination.page.toString(),
                limit: pagination.limit.toString(),
                search
            });
            const response = await apiClient.get(`/api/company/leads?${params}`);
            if (response.data.success) {
                setLeads(response.data.data);
                setPagination(response.data.pagination);
            }
        } catch (error) {
            console.error('Error fetching leads:', error);
            toast.error('Erreur lors du chargement des contacts');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="max-w-7xl mx-auto space-y-8 font-display">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">Carnet de Contacts</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Centralisez tous les prospects capturés par votre équipe.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 px-4 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-sm">
                        <span className="material-icons-outlined text-[18px]">file_download</span>
                        Export Excel
                    </button>
                    <button className="bg-primary hover:bg-primary-dark text-white px-4 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-sm shadow-primary/20">
                        <span className="material-icons-outlined text-[18px]">hub</span>
                        Connecter CRM
                    </button>
                </div>
            </header>

            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-4 justify-between items-center bg-white dark:bg-slate-900">
                    <div className="relative w-full sm:w-96">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 material-icons-outlined text-[20px]">search</span>
                        <input
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-none rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-primary/20 transition-all focus:outline-none"
                            placeholder="Rechercher par nom, entreprise ou email..."
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <div className="relative">
                            <select className="appearance-none bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm rounded-lg pl-3 pr-10 py-2.5 hover:border-slate-300 dark:hover:border-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer">
                                <option>Filtrer par collaborateur</option>
                            </select>
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 material-icons-outlined text-[18px]">expand_more</span>
                        </div>
                        <div className="relative">
                            <select className="appearance-none bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm rounded-lg pl-3 pr-10 py-2.5 hover:border-slate-300 dark:hover:border-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer">
                                <option>Date d'ajout</option>
                                <option>7 derniers jours</option>
                                <option>30 derniers jours</option>
                            </select>
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 material-icons-outlined text-[18px]">calendar_today</span>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider w-16 text-center">
                                    <input className="rounded border-slate-300 dark:border-slate-700 text-primary focus:ring-primary/20 bg-white dark:bg-slate-800" type="checkbox" />
                                </th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Nom</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Entreprise</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Email</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Tel</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Source</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Date</th>
                                <th className="px-6 py-4 w-10"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                                        <div className="flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
                                    </td>
                                </tr>
                            ) : leads.length > 0 ? (
                                leads.map((lead) => (
                                    <tr key={lead.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="px-6 py-4 text-center">
                                            <input className="rounded border-slate-300 dark:border-slate-700 text-primary focus:ring-primary/20 bg-white dark:bg-slate-800" type="checkbox" />
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-9 w-9 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center text-slate-400">
                                                    <span className="material-icons-outlined text-xl">person</span>
                                                </div>
                                                <span className="text-sm font-medium text-slate-900 dark:text-white capitalize">
                                                    {lead.firstName} {lead.lastName}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">
                                            {lead.companyName || '-'}
                                        </td>
                                        <td className="px-6 py-4">
                                            {lead.email ? (
                                                <a className="text-sm text-primary hover:text-primary-dark hover:underline" href={`mailto:${lead.email}`}>
                                                    {lead.email}
                                                </a>
                                            ) : '-'}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400 font-normal">
                                            {lead.phone || '-'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/10">
                                                <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                                                Par {lead.user.firstName} {lead.user.lastName?.charAt(0)}.
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-xs text-slate-400 text-right">
                                            {format(new Date(lead.createdAt), 'dd MMM yyyy', { locale: fr })}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="text-slate-400 hover:text-primary transition-colors opacity-0 group-hover:opacity-100">
                                                <span className="material-icons-outlined text-[20px]">more_horiz</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
                                        Aucun contact trouvé
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900">
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Affichage de <span className="font-medium text-slate-900 dark:text-white">{leads.length > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0}</span> à <span className="font-medium text-slate-900 dark:text-white">{(pagination.page - 1) * pagination.limit + leads.length}</span> sur <span className="font-medium text-slate-900 dark:text-white">{pagination.total}</span> contacts
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                            disabled={pagination.page === 1}
                            className="px-3 py-1.5 text-sm font-medium text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 transition-colors"
                        >
                            Précédent
                        </button>
                        <button
                            onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
                            disabled={pagination.page === pagination.totalPages}
                            className="px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 transition-colors"
                        >
                            Suivant
                        </button>
                    </div>
                </div>
            </div>
        </main>
    );
}
