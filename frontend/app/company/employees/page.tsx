'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Employee {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
    phone: string | null;
    role: string;
    avatarUrl: string | null;
    isActive: boolean;
    badgeId: string;
    cardStatus: string;
    department: string;
}

interface Pagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export default function EmployeesPage() {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 10, total: 0, totalPages: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    // Departments (mocked for now, or could be fetched)
    const [departmentFilter, setDepartmentFilter] = useState('all');

    const fetchEmployees = async (page = 1) => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('accessToken');
            const params = new URLSearchParams({
                page: page.toString(),
                limit: '10',
                search,
                status: statusFilter,
                departmentId: departmentFilter
            });

            const response = await fetch(`/api/company/employees?${params}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    setEmployees(data.data);
                    setPagination(data.pagination);
                }
            }
        } catch (error) {
            console.error('Error fetching employees:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchEmployees(1);
        }, 300); // Debounce search
        return () => clearTimeout(timeoutId);
    }, [search, statusFilter, departmentFilter]);

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= pagination.totalPages) {
            fetchEmployees(newPage);
        }
    };

    return (
        <div className="font-display max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Annuaire</h1>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Gérez les membres de votre équipe et leurs accès.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="inline-flex items-center justify-center px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg shadow-sm text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all">
                        <span className="material-icons text-[20px] mr-2 text-slate-500">upload_file</span>
                        Import CSV
                    </button>
                    <button className="inline-flex items-center justify-center px-4 py-2 bg-primary hover:bg-primary-dark border border-transparent rounded-lg shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all">
                        <span className="material-icons text-[20px] mr-2">add</span>
                        Ajouter un employé
                    </button>
                </div>
            </div>

            <div className="bg-background-light dark:bg-background-dark">
                <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="relative max-w-sm w-full">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="material-icons text-slate-400 text-[20px]">search</span>
                        </div>
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 dark:border-slate-700 rounded-lg leading-5 bg-white dark:bg-slate-800 placeholder-slate-400 focus:outline-none focus:placeholder-slate-500 focus:border-primary focus:ring-1 focus:ring-primary sm:text-sm transition-shadow shadow-sm"
                            id="search"
                            name="search"
                            placeholder="Rechercher par nom, email ou ID..."
                            type="text"
                        />
                    </div>
                    <div className="flex items-center gap-3 overflow-x-auto pb-2 sm:pb-0">
                        <div className="relative inline-block text-left">
                            <select
                                value={departmentFilter}
                                onChange={(e) => setDepartmentFilter(e.target.value)}
                                className="block w-full pl-4 pr-10 py-2.5 text-base border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-lg shadow-sm appearance-none cursor-pointer"
                            >
                                <option value="all">Département: Tous</option>
                                <option value="marketing">Marketing</option>
                                <option value="tech">Tech</option>
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                                <span className="material-icons text-slate-400 text-[20px]">expand_more</span>
                            </div>
                        </div>
                        <div className="relative inline-block text-left">
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="block w-full pl-4 pr-10 py-2.5 text-base border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-lg shadow-sm appearance-none cursor-pointer"
                            >
                                <option value="all">Statut: Tous</option>
                                <option value="active">Actif</option>
                                <option value="inactive">Inactif</option>
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                                <span className="material-icons text-slate-400 text-[20px]">expand_more</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
                            <thead className="bg-slate-50 dark:bg-slate-800/50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-1/4" scope="col">Employé</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-1/4" scope="col">Email & Contact</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider" scope="col">ID Badge</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider" scope="col">Statut Carte</th>
                                    <th className="relative px-6 py-4" scope="col"><span className="sr-only">Actions</span></th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-800">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-10 text-center">
                                            <div className="flex justify-center">
                                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                            </div>
                                        </td>
                                    </tr>
                                ) : employees.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-10 text-center text-slate-500">Aucun employé trouvé.</td>
                                    </tr>
                                ) : (
                                    employees.map((employee) => (
                                        <tr key={employee.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0 h-10 w-10">
                                                        {employee.avatarUrl ? (
                                                            <img className="h-10 w-10 rounded-full object-cover" src={employee.avatarUrl} alt="" />
                                                        ) : (
                                                            <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                                                                {employee.firstName?.charAt(0) || ''}{employee.lastName?.charAt(0) || ''}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-bold text-slate-900 dark:text-white">{employee.firstName} {employee.lastName}</div>
                                                        <div className="text-xs text-slate-500 dark:text-slate-400">{employee.role === 'MANAGER' ? 'Admin' : 'Employé'} • {employee.department}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-slate-600 dark:text-slate-300">{employee.email}</div>
                                                <div className="text-xs text-slate-400 mt-0.5">{employee.phone || '--'}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="px-2 py-1 inline-flex text-xs leading-5 font-mono font-medium rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                                    {employee.badgeId.toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {employee.cardStatus === 'Active' ? (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-900/50">
                                                        <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-green-600 dark:bg-green-400"></span>
                                                        Actif
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50">
                                                        <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-amber-500 dark:bg-amber-400 animate-pulse"></span>
                                                        {employee.cardStatus}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button className="text-slate-400 hover:text-primary transition-colors" title="Éditer">
                                                        <span className="material-icons text-[20px]">edit</span>
                                                    </button>
                                                    <button className="text-slate-400 hover:text-amber-500 transition-colors" title="Réinitialiser MDP">
                                                        <span className="material-icons text-[20px]">lock_reset</span>
                                                    </button>
                                                    <button className="text-slate-400 hover:text-red-500 transition-colors" title="Désactiver">
                                                        <span className="material-icons text-[20px]">block</span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="bg-white dark:bg-slate-900 px-4 py-3 flex items-center justify-between border-t border-slate-200 dark:border-slate-800 sm:px-6">
                        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm text-slate-700 dark:text-slate-400">
                                    Affichage de <span className="font-medium text-slate-900 dark:text-white">{Math.min((pagination.page - 1) * pagination.limit + 1, pagination.total)}</span> à <span className="font-medium text-slate-900 dark:text-white">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> sur <span className="font-medium text-slate-900 dark:text-white">{pagination.total}</span> résultats
                                </p>
                            </div>
                            <div>
                                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                    <button
                                        onClick={() => handlePageChange(pagination.page - 1)}
                                        disabled={pagination.page === 1}
                                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <span className="sr-only">Précédent</span>
                                        <span className="material-icons text-[18px]">chevron_left</span>
                                    </button>

                                    {/* Simplified pagination: just show current page */}
                                    <span className="relative inline-flex items-center px-4 py-2 border border-slate-300 dark:border-slate-700 bg-primary/10 text-primary text-sm font-medium">
                                        {pagination.page}
                                    </span>

                                    <button
                                        onClick={() => handlePageChange(pagination.page + 1)}
                                        disabled={pagination.page === pagination.totalPages}
                                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <span className="sr-only">Suivant</span>
                                        <span className="material-icons text-[18px]">chevron_right</span>
                                    </button>
                                </nav>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
