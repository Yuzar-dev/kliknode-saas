'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import toast from 'react-hot-toast';

interface Employee {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
    phone: string | null;
    role: string;
    avatarUrl: string | null;
    isActive: boolean;
    jobTitle?: string;
    badgeId: string;
    cardStatus: string;
    department: string;
    departmentId?: string | null;
}

interface DepartmentOption {
    id: string;
    name: string;
}

interface Pagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export default function EmployeesPage() {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [departments, setDepartments] = useState<DepartmentOption[]>([]);
    const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 10, total: 0, totalPages: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [departmentFilter, setDepartmentFilter] = useState('all');

    // Add / Edit Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        jobTitle: '',
        departmentId: 'none',
        password: ''
    });

    // Password Reset Result Modal
    const [tempPasswordModal, setTempPasswordModal] = useState<{ email: string; password: string } | null>(null);

    // CSV File Input Ref
    const csvInputRef = useRef<HTMLInputElement>(null);

    const fetchDepartments = async () => {
        try {
            const res = await apiClient.get('/api/company/departments');
            if (res.data.success) {
                setDepartments(res.data.data);
            }
        } catch (error) {
            console.error('Error loading departments:', error);
        }
    };

    const fetchEmployees = async (page = 1) => {
        setIsLoading(true);
        try {
            const response = await apiClient.get('/api/company/employees', {
                params: {
                    page,
                    limit: 10,
                    search,
                    status: statusFilter,
                    departmentId: departmentFilter
                }
            });

            if (response.data.success) {
                setEmployees(response.data.data);
                setPagination(response.data.pagination);
            }
        } catch (error) {
            console.error('Error fetching employees:', error);
            toast.error('Impossible de charger les collaborateurs');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchDepartments();
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            if (params.get('action') === 'invite') {
                openCreateModal();
            }
            const deptId = params.get('departmentId');
            if (deptId) {
                setDepartmentFilter(deptId);
            }
            const qSearch = params.get('search');
            if (qSearch) {
                setSearch(qSearch);
            }
        }
    }, []);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchEmployees(1);
        }, 300);
        return () => clearTimeout(timeoutId);
    }, [search, statusFilter, departmentFilter]);

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= pagination.totalPages) {
            fetchEmployees(newPage);
        }
    };

    const openCreateModal = () => {
        setEditingEmployee(null);
        setFormData({
            firstName: '',
            lastName: '',
            email: '',
            phone: '',
            jobTitle: '',
            departmentId: 'none',
            password: ''
        });
        setIsModalOpen(true);
    };

    const openEditModal = (emp: Employee) => {
        setEditingEmployee(emp);
        setFormData({
            firstName: emp.firstName || '',
            lastName: emp.lastName || '',
            email: emp.email || '',
            phone: emp.phone || '',
            jobTitle: emp.jobTitle || '',
            departmentId: emp.departmentId || 'none',
            password: ''
        });
        setIsModalOpen(true);
    };

    const handleSubmitEmployee = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (editingEmployee) {
                const res = await apiClient.put(`/api/company/employees/${editingEmployee.id}`, formData);
                if (res.data.success) {
                    toast.success('Collaborateur mis à jour avec succès');
                    setIsModalOpen(false);
                    fetchEmployees(pagination.page);
                }
            } else {
                const res = await apiClient.post('/api/company/employees', formData);
                if (res.data.success) {
                    toast.success('Collaborateur ajouté avec succès');
                    setIsModalOpen(false);
                    if (res.data.temporaryPassword) {
                        setTempPasswordModal({
                            email: formData.email,
                            password: res.data.temporaryPassword
                        });
                    }
                    fetchEmployees(1);
                }
            }
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Erreur lors de l\'enregistrement');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleToggleStatus = async (emp: Employee) => {
        try {
            const res = await apiClient.patch(`/api/company/employees/${emp.id}/toggle-status`);
            if (res.data.success) {
                toast.success(res.data.message || 'Statut mis à jour');
                fetchEmployees(pagination.page);
            }
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Erreur lors du changement de statut');
        }
    };

    const handleResetPassword = async (emp: Employee) => {
        try {
            const res = await apiClient.post(`/api/company/employees/${emp.id}/reset-password`);
            if (res.data.success) {
                toast.success('Nouveau mot de passe généré');
                setTempPasswordModal({
                    email: emp.email,
                    password: res.data.data.temporaryPassword
                });
            }
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Erreur lors de la réinitialisation du mot de passe');
        }
    };

    const handleCsvFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const text = await file.text();
            const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
            if (lines.length < 2) {
                toast.error('Le fichier CSV doit contenir un en-tête et au moins une ligne (firstName,lastName,email,phone,jobTitle)');
                return;
            }
            const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
            const parsedEmployees = lines.slice(1).map(line => {
                const cols = line.split(',').map(c => c.trim().replace(/^"|"$/g, ''));
                const record: any = {};
                headers.forEach((h, idx) => {
                    if (h.includes('first') || h.includes('prenom') || h.includes('prénom')) record.firstName = cols[idx];
                    else if (h.includes('last') || h.includes('nom')) record.lastName = cols[idx];
                    else if (h.includes('mail')) record.email = cols[idx];
                    else if (h.includes('phone') || h.includes('tel') || h.includes('tél')) record.phone = cols[idx];
                    else if (h.includes('job') || h.includes('poste') || h.includes('titre')) record.jobTitle = cols[idx];
                });
                if (!record.email && cols[2]?.includes('@')) {
                    record.firstName = cols[0];
                    record.lastName = cols[1];
                    record.email = cols[2];
                    record.phone = cols[3];
                    record.jobTitle = cols[4];
                }
                return record;
            }).filter(r => r.email);

            if (parsedEmployees.length === 0) {
                toast.error('Aucun email valide détecté dans le CSV');
                return;
            }

            const res = await apiClient.post('/api/company/employees/import', { employees: parsedEmployees });
            if (res.data.success) {
                toast.success(res.data.message);
                fetchEmployees(1);
            }
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Erreur lors de l\'import CSV');
        } finally {
            if (csvInputRef.current) csvInputRef.current.value = '';
        }
    };

    return (
        <div className="font-display max-w-7xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-4xl md:text-5xl font-black text-apple-textDark dark:text-white tracking-tighter">Annuaire</h1>
                    <p className="text-[11px] font-black uppercase tracking-[0.25em] text-apple-secondary dark:text-slate-500 mt-3">Gérez les membres de votre équipe et leurs accès.</p>
                </div>
                <div className="flex gap-4">
                    <input
                        ref={csvInputRef}
                        type="file"
                        accept=".csv"
                        onChange={handleCsvFileChange}
                        className="hidden"
                    />
                    <button
                        onClick={() => csvInputRef.current?.click()}
                        className="px-8 h-14 rounded-full klik-glass border border-white/40 dark:border-white/10 hover:bg-white/80 dark:hover:bg-white/10 transition-all flex items-center gap-3 text-xs font-black uppercase tracking-widest text-apple-textDark dark:text-white shadow-sm cursor-pointer active:scale-95"
                    >
                        <span className="material-symbols-outlined text-[22px]">upload_file</span>
                        Import CSV
                    </button>
                    <button
                        onClick={openCreateModal}
                        className="px-8 h-14 rounded-full btn-titanium btn-titanium-primary shadow-2xl shadow-primary/30 flex items-center gap-3 text-xs font-black uppercase tracking-widest text-white transition-all group cursor-pointer"
                    >
                        <span className="material-symbols-outlined text-[22px] group-hover:rotate-90 transition-transform">add</span>
                        Ajouter un employé
                    </button>
                </div>
            </div>

            <div className="klik-glass rounded-[40px] border border-white/40 dark:border-white/5 shadow-2xl overflow-hidden mt-8 p-2">
                {/* Filters */}
                <div className="px-8 py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="relative max-w-md w-full">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <span className="material-symbols-outlined text-apple-secondary text-[20px]">search</span>
                        </div>
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="block w-full pl-12 pr-4 h-12 border border-white/40 dark:border-white/10 rounded-full bg-white/40 dark:bg-white/5 text-apple-textDark dark:text-white placeholder-apple-secondary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white dark:focus:bg-black/60 font-bold text-sm transition-all shadow-sm"
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
                                className="block w-full pl-6 pr-12 h-12 text-xs font-black uppercase tracking-widest border border-white/40 dark:border-white/10 bg-white/40 dark:bg-white/5 text-apple-textDark dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 rounded-full shadow-sm appearance-none cursor-pointer hover:bg-white/60 dark:hover:bg-white/10 transition-all"
                            >
                                <option value="all">Département: Tous</option>
                                {departments.map(dept => (
                                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                                ))}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-apple-secondary">
                                <span className="material-symbols-outlined text-[20px]">expand_more</span>
                            </div>
                        </div>
                        <div className="relative inline-block text-left">
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="block w-full pl-6 pr-12 h-12 text-xs font-black uppercase tracking-widest border border-white/40 dark:border-white/10 bg-white/40 dark:bg-white/5 text-apple-textDark dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 rounded-full shadow-sm appearance-none cursor-pointer hover:bg-white/60 dark:hover:bg-white/10 transition-all"
                            >
                                <option value="all">Statut: Tous</option>
                                <option value="active">Actif</option>
                                <option value="inactive">Inactif</option>
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-apple-secondary">
                                <span className="material-symbols-outlined text-[20px]">expand_more</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead className="border-b border-gray-100/10 dark:border-white/5 bg-gray-50/30 dark:bg-white/5">
                            <tr>
                                <th className="px-8 py-5 text-left text-[11px] font-bold text-apple-secondary uppercase tracking-[0.2em] opacity-60 w-1/4" scope="col">Employé</th>
                                <th className="px-6 py-5 text-left text-[11px] font-bold text-apple-secondary uppercase tracking-[0.2em] opacity-60 w-1/4" scope="col">Email & Contact</th>
                                <th className="px-6 py-5 text-left text-[11px] font-bold text-apple-secondary uppercase tracking-[0.2em] opacity-60" scope="col">ID Badge</th>
                                <th className="px-6 py-5 text-left text-[11px] font-bold text-apple-secondary uppercase tracking-[0.2em] opacity-60" scope="col">Statut</th>
                                <th className="relative px-8 py-5 text-right text-[11px] font-bold text-apple-secondary uppercase tracking-[0.2em] opacity-60" scope="col">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100/10 dark:divide-white/5">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center justify-center gap-4 opacity-50">
                                            <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                                        </div>
                                    </td>
                                </tr>
                            ) : employees.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-8 py-20 text-center text-apple-secondary font-bold">Aucun employé trouvé.</td>
                                </tr>
                            ) : (
                                employees.map((employee) => (
                                    <tr key={employee.id} className="hover:bg-white/40 dark:hover:bg-white/5 transition-colors group">
                                        <td className="px-8 py-5 whitespace-nowrap">
                                            <div className="flex items-center gap-4">
                                                <div className="flex-shrink-0 relative">
                                                    {employee.avatarUrl ? (
                                                        <img className="h-12 w-12 rounded-[1.2rem] object-cover shadow-sm border border-white/20" src={employee.avatarUrl} alt="" />
                                                    ) : (
                                                        <div className="h-12 w-12 rounded-[1.2rem] btn-titanium-primary text-white flex items-center justify-center font-black text-sm shadow-sm border border-white/20">
                                                            {employee.firstName?.charAt(0) || ''}{employee.lastName?.charAt(0) || ''}
                                                        </div>
                                                    )}
                                                    <div className={`absolute -bottom-1 -right-1 w-4 h-4 ${employee.isActive ? 'bg-emerald-500' : 'bg-rose-500'} border-2 border-white dark:border-[#1C1C1E] rounded-full shadow-sm`}></div>
                                                </div>
                                                <div>
                                                    <div className="text-lg font-black text-apple-textDark dark:text-white tracking-tight">{employee.firstName} {employee.lastName}</div>
                                                    <div className="text-[10px] font-bold text-apple-secondary uppercase tracking-[0.1em] mt-1">
                                                        {employee.jobTitle || (employee.role === 'MANAGER' ? 'Admin' : 'Collaborateur')} • {employee.department || 'Général'}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 whitespace-nowrap">
                                            <div className="text-sm font-bold text-apple-textDark dark:text-white tracking-tight">{employee.email}</div>
                                            <div className="text-[11px] font-bold text-apple-secondary uppercase tracking-widest mt-1">{employee.phone || '--'}</div>
                                        </td>
                                        <td className="px-6 py-5 whitespace-nowrap">
                                            {employee.badgeId !== 'N/A' ? (
                                                <Link
                                                    href={`/p/${employee.badgeId}`}
                                                    target="_blank"
                                                    className="px-3 py-1.5 inline-flex items-center gap-1.5 text-xs leading-5 font-mono font-bold rounded-lg bg-gray-100 dark:bg-black/30 text-apple-textDark dark:text-white border border-gray-200 dark:border-white/10 shadow-sm hover:border-primary hover:text-primary transition-colors"
                                                >
                                                    {employee.badgeId.toUpperCase()}
                                                    <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                                                </Link>
                                            ) : (
                                                <span className="px-3 py-1.5 inline-flex text-xs leading-5 font-mono font-bold rounded-lg bg-gray-100 dark:bg-black/30 text-apple-secondary">
                                                    N/A
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-5 whitespace-nowrap">
                                            {employee.isActive ? (
                                                <span className="px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest border border-emerald-500/20 bg-emerald-500/10 text-emerald-500 shadow-sm">
                                                    Actif
                                                </span>
                                            ) : (
                                                <span className="px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest border border-rose-500/20 bg-rose-500/10 text-rose-500 shadow-sm">
                                                    Suspendu
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-8 py-5 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => openEditModal(employee)}
                                                    className="w-10 h-10 rounded-full glass flex items-center justify-center text-apple-secondary hover:text-primary transition-colors border border-white/20 dark:border-white/5 cursor-pointer"
                                                    title="Éditer le collaborateur"
                                                >
                                                    <span className="material-symbols-outlined text-[20px]">edit</span>
                                                </button>
                                                <button
                                                    onClick={() => handleResetPassword(employee)}
                                                    className="w-10 h-10 rounded-full glass flex items-center justify-center text-apple-secondary hover:text-amber-500 transition-colors border border-white/20 dark:border-white/5 cursor-pointer"
                                                    title="Réinitialiser le mot de passe"
                                                >
                                                    <span className="material-symbols-outlined text-[20px]">lock_reset</span>
                                                </button>
                                                <button
                                                    onClick={() => handleToggleStatus(employee)}
                                                    className={`w-10 h-10 rounded-full glass flex items-center justify-center transition-colors border border-white/20 dark:border-white/5 cursor-pointer ${employee.isActive ? 'text-apple-secondary hover:text-rose-500' : 'text-emerald-500 hover:text-emerald-600'}`}
                                                    title={employee.isActive ? 'Suspendre le compte' : 'Réactiver le compte'}
                                                >
                                                    <span className="material-symbols-outlined text-[20px]">
                                                        {employee.isActive ? 'block' : 'check_circle'}
                                                    </span>
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
                <div className="px-8 py-6 border-t border-gray-100/10 dark:border-white/5 flex items-center justify-between">
                    <div>
                        <p className="text-[11px] font-bold text-apple-secondary uppercase tracking-[0.1em]">
                            <span className="text-apple-textDark dark:text-white">{pagination.total > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0}</span> à <span className="text-apple-textDark dark:text-white">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> sur <span className="text-apple-textDark dark:text-white">{pagination.total}</span> résultats
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => handlePageChange(pagination.page - 1)}
                            disabled={pagination.page === 1}
                            className="w-10 h-10 rounded-full glass flex items-center justify-center text-apple-textDark dark:text-white hover:bg-white/40 dark:hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all border border-white/20 dark:border-white/5"
                        >
                            <span className="material-symbols-outlined text-[20px]">chevron_left</span>
                        </button>
                        <span className="w-10 h-10 rounded-full bg-primary text-white font-black flex items-center justify-center shadow-lg shadow-primary/30">
                            {pagination.page}
                        </span>
                        <button
                            onClick={() => handlePageChange(pagination.page + 1)}
                            disabled={pagination.page >= pagination.totalPages}
                            className="w-10 h-10 rounded-full glass flex items-center justify-center text-apple-textDark dark:text-white hover:bg-white/40 dark:hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all border border-white/20 dark:border-white/5"
                        >
                            <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Modal Ajout / Édition Employé */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
                    <div className="bg-white dark:bg-[#1C1C1E] w-full max-w-lg rounded-[40px] shadow-2xl relative z-10 overflow-hidden border border-white/20">
                        <div className="px-10 py-8 border-b border-gray-100 dark:border-white/10 flex justify-between items-center">
                            <div>
                                <h3 className="text-2xl font-black text-apple-textDark dark:text-white tracking-tight">
                                    {editingEmployee ? 'Modifier le collaborateur' : 'Ajouter un collaborateur'}
                                </h3>
                                <p className="text-[10px] font-bold text-apple-secondary uppercase tracking-widest mt-1">
                                    {editingEmployee ? 'Mise à jour du profil et de la carte NFC' : 'Création automatique du compte et du profil NFC'}
                                </p>
                            </div>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="h-10 w-10 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 flex items-center justify-center transition-all"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <form onSubmit={handleSubmitEmployee} className="p-10 space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-apple-secondary uppercase tracking-widest ml-1">Prénom *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.firstName}
                                        onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                                        className="w-full h-12 px-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-apple-secondary uppercase tracking-widest ml-1">Nom *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.lastName}
                                        onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                                        className="w-full h-12 px-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-apple-secondary uppercase tracking-widest ml-1">Email Professionnel *</label>
                                <input
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full h-12 px-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-apple-secondary uppercase tracking-widest ml-1">Téléphone</label>
                                    <input
                                        type="tel"
                                        placeholder="+33 6 00 00 00 00"
                                        value={formData.phone}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full h-12 px-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-apple-secondary uppercase tracking-widest ml-1">Poste / Fonction</label>
                                    <input
                                        type="text"
                                        placeholder="Ex: Account Executive"
                                        value={formData.jobTitle}
                                        onChange={e => setFormData({ ...formData, jobTitle: e.target.value })}
                                        className="w-full h-12 px-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-apple-secondary uppercase tracking-widest ml-1">Département / Groupe</label>
                                <select
                                    value={formData.departmentId}
                                    onChange={e => setFormData({ ...formData, departmentId: e.target.value })}
                                    className="w-full h-12 px-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20"
                                >
                                    <option value="none">Aucun département</option>
                                    {departments.map(dept => (
                                        <option key={dept.id} value={dept.id}>{dept.name}</option>
                                    ))}
                                </select>
                            </div>

                            {!editingEmployee && (
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-apple-secondary uppercase tracking-widest ml-1">Mot de passe initial (optionnel)</label>
                                    <input
                                        type="text"
                                        placeholder="Par défaut: Kliknode2026!"
                                        value={formData.password}
                                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                                        className="w-full h-12 px-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    />
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full h-14 mt-4 btn-titanium btn-titanium-primary text-white rounded-full font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 cursor-pointer"
                            >
                                {isSubmitting ? (
                                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                ) : (
                                    editingEmployee ? 'Enregistrer les modifications' : 'Créer le collaborateur et sa carte'
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Affichage Mot de Passe Temporaire */}
            {tempPasswordModal && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setTempPasswordModal(null)}></div>
                    <div className="bg-white dark:bg-[#1C1C1E] w-full max-w-md rounded-[32px] p-8 shadow-2xl relative z-10 border border-white/20 text-center space-y-6">
                        <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
                            <span className="material-symbols-outlined text-3xl">key</span>
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-apple-textDark dark:text-white">Accès Collaborateur</h3>
                            <p className="text-xs font-medium text-apple-secondary mt-1">
                                Transmettez ces identifiants à <span className="font-bold text-apple-textDark dark:text-white">{tempPasswordModal.email}</span>
                            </p>
                        </div>
                        <div className="p-4 rounded-2xl bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 flex items-center justify-between">
                            <code className="font-mono font-black text-base text-primary">{tempPasswordModal.password}</code>
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(tempPasswordModal.password);
                                    toast.success('Mot de passe copié !');
                                }}
                                className="px-3 py-1.5 rounded-xl bg-white dark:bg-white/10 text-xs font-bold text-apple-textDark dark:text-white shadow-sm hover:text-primary cursor-pointer"
                            >
                                Copier
                            </button>
                        </div>
                        <button
                            onClick={() => setTempPasswordModal(null)}
                            className="w-full h-12 rounded-full btn-titanium btn-titanium-primary text-white text-xs font-black uppercase tracking-widest cursor-pointer"
                        >
                            Terminé
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
