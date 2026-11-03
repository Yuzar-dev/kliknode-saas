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
    notes?: string | null;
    source?: string;
    createdAt: string;
    user: {
        id?: string;
        firstName: string | null;
        lastName: string | null;
        avatarUrl: string | null;
    };
}

interface EmployeeOption {
    id: string;
    firstName: string | null;
    lastName: string | null;
}

export default function LeadsPage() {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [employees, setEmployees] = useState<EmployeeOption[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [employeeFilter, setEmployeeFilter] = useState('all');
    const [dateFilter, setDateFilter] = useState<'all' | '7d' | '30d'>('all');
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    const [pagination, setPagination] = useState({
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 1
    });

    // Lead Details / Edit Modal
    const [editingLead, setEditingLead] = useState<Lead | null>(null);
    const [isSavingLead, setIsSavingLead] = useState(false);

    // CRM Modal
    const [isCrmModalOpen, setIsCrmModalOpen] = useState(false);
    const [isSyncingCrm, setIsSyncingCrm] = useState(false);
    const [isSavingCrm, setIsSavingCrm] = useState(false);
    const [crmConfig, setCrmConfig] = useState({
        provider: 'tiime' as 'tiime' | 'hubspot' | 'pipedrive' | 'salesforce' | 'webhook',
        enabled: false,
        autoSync: true,
        apiKey: '',
        webhookUrl: '',
        tiimeCompanyId: '',
        lastSyncAt: '',
        lastSyncMessage: '',
        totalSynced: 0,
    });

    useEffect(() => {
        apiClient.get('/api/company/employees?limit=100').then(res => {
            if (res.data.success) {
                setEmployees(res.data.data);
            }
        }).catch(() => {});

        apiClient.get('/api/company/leads/crm-config').then(res => {
            if (res.data.success && res.data.data) {
                setCrmConfig(prev => ({ ...prev, ...res.data.data }));
            }
        }).catch(() => {});
    }, []);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchLeads();
        }, 300);
        return () => clearTimeout(timeoutId);
    }, [search, employeeFilter, dateFilter, pagination.page]);

    const fetchLeads = async () => {
        setIsLoading(true);
        try {
            const params: Record<string, string> = {
                page: pagination.page.toString(),
                limit: pagination.limit.toString(),
                search
            };
            if (employeeFilter !== 'all') {
                params.employeeId = employeeFilter;
            }
            if (dateFilter !== 'all') {
                const start = new Date();
                start.setDate(start.getDate() - (dateFilter === '7d' ? 7 : 30));
                params.startDate = start.toISOString();
            }

            const response = await apiClient.get('/api/company/leads', { params });
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

    const handleExportExcelCsv = () => {
        const listToExport = selectedIds.length > 0
            ? leads.filter(l => selectedIds.includes(l.id))
            : leads;

        if (listToExport.length === 0) {
            toast.error('Aucun contact à exporter');
            return;
        }

        const headers = ['Prénom', 'Nom', 'Entreprise', 'Email', 'Téléphone', 'Capturé par', 'Notes', 'Date'];
        const rows = listToExport.map(l => [
            l.firstName || '',
            l.lastName || '',
            l.companyName || '',
            l.email || '',
            l.phone || '',
            `${l.user?.firstName || ''} ${l.user?.lastName || ''}`.trim(),
            l.notes || '',
            new Date(l.createdAt).toLocaleDateString('fr-FR')
        ]);

        const csvContent = '\uFEFF' + [
            headers.join(';'),
            ...rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(';'))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `contacts-kliknode-${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success(`${listToExport.length} contact(s) exporté(s) pour Excel`);
    };

    const handleExportTiimeCsv = () => {
        const listToExport = selectedIds.length > 0
            ? leads.filter(l => selectedIds.includes(l.id))
            : leads;

        if (listToExport.length === 0) {
            toast.error('Aucun contact à exporter pour Tiime');
            return;
        }

        // Format officiel d'import clients Tiime (tiime.fr)
        const headers = ['Nom', 'Type', 'Email', 'Téléphone', 'Entreprise', 'Prénom Contact', 'Nom Contact', 'Commentaires'];
        const rows = listToExport.map(l => {
            const fullName = `${l.firstName || ''} ${l.lastName || ''}`.trim() || 'Client KlikNode';
            const displayClientName = l.companyName ? l.companyName : fullName;
            const clientType = l.companyName ? 'Professionnel' : 'Particulier';
            const capturedBy = `${l.user?.firstName || ''} ${l.user?.lastName || ''}`.trim();
            const comment = [
                l.notes ? l.notes : '',
                capturedBy ? `Capturé via KlikNode NFC par ${capturedBy}` : 'Capturé via KlikNode NFC'
            ].filter(Boolean).join(' — ');

            return [
                displayClientName,
                clientType,
                l.email || '',
                l.phone || '',
                l.companyName || '',
                l.firstName || '',
                l.lastName || '',
                comment
            ];
        });

        const csvContent = '\uFEFF' + [
            headers.join(';'),
            ...rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(';'))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `import-clients-tiime-${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success(`${listToExport.length} fiche(s) client exportée(s) au format Tiime.fr !`);
    };

    const handleSaveCrmConfig = async () => {
        setIsSavingCrm(true);
        try {
            const res = await apiClient.post('/api/company/leads/crm-config', {
                ...crmConfig,
                enabled: true
            });
            if (res.data.success) {
                setCrmConfig(prev => ({ ...prev, ...res.data.data }));
                toast.success(res.data.message || 'Configuration CRM enregistrée !');
                setIsCrmModalOpen(false);
            }
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Erreur lors de la sauvegarde CRM');
        } finally {
            setIsSavingCrm(false);
        }
    };

    const handleSyncLeadsNow = async () => {
        setIsSyncingCrm(true);
        try {
            // S'assurer que la config actuelle est bien enregistrée avant de pousser
            await apiClient.post('/api/company/leads/crm-config', { ...crmConfig, enabled: true });
            const res = await apiClient.post('/api/company/leads/crm-sync');
            if (res.data.success) {
                toast.success(res.data.message || 'Synchronisation CRM réussie !');
                const cfgRes = await apiClient.get('/api/company/leads/crm-config');
                if (cfgRes.data.success) setCrmConfig(prev => ({ ...prev, ...cfgRes.data.data }));
            } else {
                toast.error(res.data.message || 'Vérifiez vos paramètres CRM');
            }
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Erreur lors de la synchronisation CRM');
        } finally {
            setIsSyncingCrm(false);
        }
    };

    const handleToggleSelectAll = () => {
        if (selectedIds.length === leads.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(leads.map(l => l.id));
        }
    };

    const handleToggleSelectOne = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const handleSaveLead = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingLead) return;
        setIsSavingLead(true);
        try {
            const res = await apiClient.patch(`/api/company/leads/${editingLead.id}`, {
                firstName: editingLead.firstName,
                lastName: editingLead.lastName,
                email: editingLead.email,
                phone: editingLead.phone,
                companyName: editingLead.companyName,
                notes: editingLead.notes
            });
            if (res.data.success) {
                toast.success('Contact mis à jour');
                setEditingLead(null);
                fetchLeads();
            }
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Erreur lors de la mise à jour');
        } finally {
            setIsSavingLead(false);
        }
    };

    const handleDeleteLead = async (lead: Lead) => {
        if (!confirm(`Supprimer le contact "${lead.firstName || ''} ${lead.lastName || ''}" ?`)) return;
        try {
            const res = await apiClient.delete(`/api/company/leads/${lead.id}`);
            if (res.data.success) {
                toast.success('Contact supprimé');
                setSelectedIds(prev => prev.filter(id => id !== lead.id));
                fetchLeads();
            }
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Erreur lors de la suppression');
        }
    };

    return (
        <main className="max-w-7xl mx-auto space-y-10 font-display animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                <div>
                    <h1 className="text-4xl md:text-5xl font-black text-apple-textDark dark:text-white tracking-tighter">Carnet de Contacts</h1>
                    <p className="text-[11px] font-black uppercase tracking-[0.25em] text-apple-secondary dark:text-slate-500 mt-3">Centralisez tous les prospects capturés par votre équipe.</p>
                </div>
                <div className="flex flex-wrap lg:flex-nowrap items-center gap-3 shrink-0">
                    <button
                        onClick={handleExportTiimeCsv}
                        className="px-5 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 transition-all flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 shadow-sm cursor-pointer active:scale-95 whitespace-nowrap"
                        title="Télécharger le fichier CSV formaté pour l'import clients Tiime.fr"
                    >
                        <span className="material-symbols-outlined text-[18px]">receipt_long</span>
                        Export Tiime.fr {selectedIds.length > 0 ? `(${selectedIds.length})` : ''}
                    </button>
                    <button
                        onClick={handleExportExcelCsv}
                        className="px-5 h-12 rounded-full klik-glass border border-white/40 dark:border-white/10 hover:bg-white/80 dark:hover:bg-white/10 transition-all flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-apple-textDark dark:text-white shadow-sm cursor-pointer active:scale-95 whitespace-nowrap"
                    >
                        <span className="material-symbols-outlined text-[18px]">file_download</span>
                        Export Excel {selectedIds.length > 0 ? `(${selectedIds.length})` : ''}
                    </button>
                    <button
                        onClick={() => setIsCrmModalOpen(true)}
                        className="px-6 h-12 rounded-full btn-titanium btn-titanium-primary shadow-2xl shadow-primary/30 flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-white transition-all group cursor-pointer whitespace-nowrap"
                    >
                        <span className="material-symbols-outlined text-[18px] group-hover:scale-110 transition-transform">hub</span>
                        {crmConfig.enabled ? `CRM : ${crmConfig.provider.toUpperCase()} Actif` : 'Connecter CRM'}
                    </button>
                </div>
            </div>

            <div className="klik-glass rounded-[40px] border border-white/40 dark:border-white/5 shadow-2xl overflow-hidden mt-8">
                {/* Filters */}
                <div className="px-8 py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100/10 dark:border-white/5 bg-white/30 dark:bg-white/5">
                    <div className="relative w-full max-w-md">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-apple-secondary material-symbols-outlined text-[20px]">search</span>
                        <input
                            className="w-full pl-12 pr-4 h-12 bg-white/40 dark:bg-white/5 border border-white/40 dark:border-white/10 rounded-full text-sm font-bold text-apple-textDark dark:text-white placeholder-apple-secondary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white dark:focus:bg-black/60 shadow-sm transition-all"
                            placeholder="Rechercher par nom, entreprise ou email..."
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                        <div className="relative">
                            <select
                                value={employeeFilter}
                                onChange={(e) => setEmployeeFilter(e.target.value)}
                                className="appearance-none bg-none bg-white/40 dark:bg-white/5 border border-white/40 dark:border-white/10 text-apple-textDark dark:text-white text-[11px] font-black uppercase tracking-widest rounded-full pl-6 pr-12 h-12 hover:bg-white/60 dark:hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer shadow-sm transition-all"
                            >
                                <option value="all">Collaborateur: Tous</option>
                                {employees.map(emp => (
                                    <option key={emp.id} value={emp.id}>
                                        {emp.firstName} {emp.lastName}
                                    </option>
                                ))}
                            </select>
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-apple-secondary material-symbols-outlined text-[20px]">expand_more</span>
                        </div>
                        <div className="relative">
                            <select
                                value={dateFilter}
                                onChange={(e) => setDateFilter(e.target.value as any)}
                                className="appearance-none bg-none bg-white/40 dark:bg-white/5 border border-white/40 dark:border-white/10 text-apple-textDark dark:text-white text-[11px] font-black uppercase tracking-widest rounded-full pl-6 pr-12 h-12 hover:bg-white/60 dark:hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer shadow-sm transition-all"
                            >
                                <option value="all">Date: Toutes</option>
                                <option value="7d">7 derniers jours</option>
                                <option value="30d">30 derniers jours</option>
                            </select>
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-apple-secondary material-symbols-outlined text-[20px]">calendar_today</span>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/30 dark:bg-white/5 border-b border-gray-100/10 dark:border-white/5">
                                <th className="px-8 py-5 text-[11px] font-bold text-apple-secondary uppercase tracking-[0.2em] opacity-60 w-16 text-center">
                                    <input
                                        checked={leads.length > 0 && selectedIds.length === leads.length}
                                        onChange={handleToggleSelectAll}
                                        className="w-5 h-5 rounded-[6px] border-gray-300 dark:border-white/20 text-primary focus:ring-primary/20 bg-white dark:bg-white/5 cursor-pointer"
                                        type="checkbox"
                                    />
                                </th>
                                <th className="px-6 py-5 text-[11px] font-bold text-apple-secondary uppercase tracking-[0.2em] opacity-60">Nom</th>
                                <th className="px-6 py-5 text-[11px] font-bold text-apple-secondary uppercase tracking-[0.2em] opacity-60">Entreprise</th>
                                <th className="px-6 py-5 text-[11px] font-bold text-apple-secondary uppercase tracking-[0.2em] opacity-60">Email</th>
                                <th className="px-6 py-5 text-[11px] font-bold text-apple-secondary uppercase tracking-[0.2em] opacity-60">Tel</th>
                                <th className="px-6 py-5 text-[11px] font-bold text-apple-secondary uppercase tracking-[0.2em] opacity-60">Source</th>
                                <th className="px-8 py-5 text-[11px] font-bold text-apple-secondary uppercase tracking-[0.2em] opacity-60 text-right">Date</th>
                                <th className="px-6 py-5 text-[11px] font-bold text-apple-secondary uppercase tracking-[0.2em] opacity-60 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100/10 dark:divide-white/5">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={8} className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center justify-center gap-4 opacity-50">
                                            <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                                        </div>
                                    </td>
                                </tr>
                            ) : leads.length > 0 ? (
                                leads.map((lead) => (
                                    <tr key={lead.id} className="group hover:bg-white/40 dark:hover:bg-white/5 transition-colors">
                                        <td className="px-8 py-5 text-center">
                                            <input
                                                checked={selectedIds.includes(lead.id)}
                                                onChange={() => handleToggleSelectOne(lead.id)}
                                                className="w-5 h-5 rounded-[6px] border-gray-300 dark:border-white/20 text-primary focus:ring-primary/20 bg-white dark:bg-white/5 cursor-pointer"
                                                type="checkbox"
                                            />
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="h-12 w-12 rounded-[1.2rem] glass border border-white/20 dark:border-white/10 shadow-sm flex items-center justify-center text-apple-secondary">
                                                    <span className="material-symbols-outlined text-[24px]">person</span>
                                                </div>
                                                <div>
                                                    <span className="text-lg font-black text-apple-textDark dark:text-white tracking-tight capitalize group-hover:text-primary transition-colors block">
                                                        {lead.firstName} {lead.lastName}
                                                    </span>
                                                    {lead.notes && (
                                                        <span className="text-[10px] text-apple-secondary line-clamp-1">{lead.notes}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className="text-sm font-bold text-apple-secondary dark:text-gray-400">
                                                {lead.companyName || '-'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5">
                                            {lead.email ? (
                                                <a className="text-sm font-bold text-primary hover:text-primary-dark transition-colors underline-offset-4 hover:underline" href={`mailto:${lead.email}`}>
                                                    {lead.email}
                                                </a>
                                            ) : '-'}
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className="text-sm font-bold text-apple-secondary dark:text-gray-400 font-mono">
                                                {lead.phone || '-'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest bg-primary/10 text-primary border border-primary/20 shadow-sm">
                                                <span className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_currentColor]"></span>
                                                Par {lead.user?.firstName} {lead.user?.lastName?.charAt(0)}.
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <span className="text-sm font-bold text-apple-secondary dark:text-gray-500">
                                                {format(new Date(lead.createdAt), 'dd MMM yyyy', { locale: fr })}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => setEditingLead(lead)}
                                                    title="Modifier / Notes"
                                                    className="w-9 h-9 rounded-full glass border border-white/20 dark:border-white/5 flex items-center justify-center text-apple-secondary hover:text-primary transition-all shadow-sm cursor-pointer"
                                                >
                                                    <span className="material-symbols-outlined text-[18px]">edit</span>
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteLead(lead)}
                                                    title="Supprimer le contact"
                                                    className="w-9 h-9 rounded-full glass border border-white/20 dark:border-white/5 flex items-center justify-center text-apple-secondary hover:text-rose-500 transition-all shadow-sm cursor-pointer"
                                                >
                                                    <span className="material-symbols-outlined text-[18px]">delete</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={8} className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center justify-center gap-4 opacity-50">
                                            <span className="material-symbols-outlined text-4xl text-apple-secondary">hourglass_empty</span>
                                            <p className="text-sm font-bold text-apple-secondary tracking-tight">Aucun contact trouvé.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="px-8 py-6 border-t border-gray-100/10 dark:border-white/5 flex items-center justify-between bg-white/30 dark:bg-white/5">
                    <p className="text-[11px] font-bold text-apple-secondary uppercase tracking-[0.1em]">
                        <span className="text-apple-textDark dark:text-white">{leads.length > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0}</span> à <span className="text-apple-textDark dark:text-white">{(pagination.page - 1) * pagination.limit + leads.length}</span> sur <span className="text-apple-textDark dark:text-white">{pagination.total}</span> contacts
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                            disabled={pagination.page === 1}
                            className="w-10 h-10 rounded-full glass flex items-center justify-center text-apple-textDark dark:text-white hover:bg-white/40 dark:hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all border border-white/20 dark:border-white/5 shadow-sm"
                        >
                            <span className="material-symbols-outlined text-[20px]">chevron_left</span>
                        </button>
                        <span className="w-10 h-10 rounded-full bg-primary text-white font-black flex items-center justify-center shadow-lg shadow-primary/30">
                            {pagination.page}
                        </span>
                        <button
                            onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.totalPages || 1, prev.page + 1) }))}
                            disabled={pagination.page >= (pagination.totalPages || 1)}
                            className="w-10 h-10 rounded-full glass flex items-center justify-center text-apple-textDark dark:text-white hover:bg-white/40 dark:hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all border border-white/20 dark:border-white/5 shadow-sm"
                        >
                            <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Modal Édition / Notes Contact */}
            {editingLead && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setEditingLead(null)}></div>
                    <div className="bg-white dark:bg-[#1C1C1E] w-full max-w-lg rounded-[40px] shadow-2xl relative z-10 overflow-hidden border border-white/20">
                        <div className="px-10 py-8 border-b border-gray-100 dark:border-white/10 flex justify-between items-center">
                            <h3 className="text-2xl font-black text-apple-textDark dark:text-white tracking-tight">Fiche Contact</h3>
                            <button onClick={() => setEditingLead(null)} className="h-10 w-10 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 flex items-center justify-center">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <form onSubmit={handleSaveLead} className="p-10 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[11px] font-bold text-apple-secondary uppercase tracking-widest ml-1">Prénom</label>
                                    <input
                                        type="text"
                                        value={editingLead.firstName || ''}
                                        onChange={e => setEditingLead({ ...editingLead, firstName: e.target.value })}
                                        className="w-full h-12 px-4 mt-1 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm font-medium"
                                    />
                                </div>
                                <div>
                                    <label className="text-[11px] font-bold text-apple-secondary uppercase tracking-widest ml-1">Nom</label>
                                    <input
                                        type="text"
                                        value={editingLead.lastName || ''}
                                        onChange={e => setEditingLead({ ...editingLead, lastName: e.target.value })}
                                        className="w-full h-12 px-4 mt-1 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm font-medium"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[11px] font-bold text-apple-secondary uppercase tracking-widest ml-1">Entreprise</label>
                                    <input
                                        type="text"
                                        value={editingLead.companyName || ''}
                                        onChange={e => setEditingLead({ ...editingLead, companyName: e.target.value })}
                                        className="w-full h-12 px-4 mt-1 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm font-medium"
                                    />
                                </div>
                                <div>
                                    <label className="text-[11px] font-bold text-apple-secondary uppercase tracking-widest ml-1">Téléphone</label>
                                    <input
                                        type="text"
                                        value={editingLead.phone || ''}
                                        onChange={e => setEditingLead({ ...editingLead, phone: e.target.value })}
                                        className="w-full h-12 px-4 mt-1 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm font-medium"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-[11px] font-bold text-apple-secondary uppercase tracking-widest ml-1">Email</label>
                                <input
                                    type="email"
                                    value={editingLead.email || ''}
                                    onChange={e => setEditingLead({ ...editingLead, email: e.target.value })}
                                    className="w-full h-12 px-4 mt-1 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm font-medium"
                                />
                            </div>
                            <div>
                                <label className="text-[11px] font-bold text-apple-secondary uppercase tracking-widest ml-1">Notes</label>
                                <textarea
                                    rows={3}
                                    value={editingLead.notes || ''}
                                    onChange={e => setEditingLead({ ...editingLead, notes: e.target.value })}
                                    placeholder="Ajouter un commentaire sur ce prospect..."
                                    className="w-full p-4 mt-1 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm font-medium"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={isSavingLead}
                                className="w-full h-14 mt-2 btn-titanium btn-titanium-primary text-white rounded-full font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center cursor-pointer"
                            >
                                {isSavingLead ? 'Enregistrement...' : 'Enregistrer les modifications'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Connecter CRM */}
            {isCrmModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsCrmModalOpen(false)}></div>
                    <div className="bg-white dark:bg-[#1C1C1E] w-full max-w-xl rounded-[40px] shadow-2xl relative z-10 overflow-hidden border border-white/20">
                        <div className="px-10 py-8 border-b border-gray-100 dark:border-white/10 flex justify-between items-center">
                            <div>
                                <h3 className="text-2xl font-black text-apple-textDark dark:text-white tracking-tight">Synchronisation CRM & Tiime.fr</h3>
                                <p className="text-[10px] font-bold text-apple-secondary uppercase tracking-widest mt-1">Tiime, HubSpot, Pipedrive, Salesforce & Make</p>
                            </div>
                            <button onClick={() => setIsCrmModalOpen(false)} className="h-10 w-10 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 flex items-center justify-center">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="p-8 space-y-6 max-h-[80vh] overflow-y-auto">
                            {/* Choix du CRM */}
                            <div>
                                <label className="text-[10px] font-black text-apple-secondary uppercase tracking-widest block mb-2.5">
                                    1. Sélectionnez votre outil CRM / Facturation
                                </label>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                                    {[
                                        { id: 'tiime', label: 'Tiime.fr', badge: 'France Pro' },
                                        { id: 'hubspot', label: 'HubSpot', badge: 'API Directe' },
                                        { id: 'pipedrive', label: 'Pipedrive', badge: 'API Directe' },
                                        { id: 'salesforce', label: 'Salesforce / Make', badge: 'Webhook' },
                                    ].map(item => (
                                        <button
                                            key={item.id}
                                            type="button"
                                            onClick={() => setCrmConfig({ ...crmConfig, provider: item.id as any })}
                                            className={`p-3.5 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                                                crmConfig.provider === item.id
                                                    ? 'border-primary bg-primary/10 text-primary shadow-sm'
                                                    : 'border-slate-200 dark:border-white/10 text-apple-textDark dark:text-white hover:border-primary/40'
                                            }`}
                                        >
                                            <span className="font-black text-xs">{item.label}</span>
                                            <span className="text-[9px] font-bold uppercase tracking-widest opacity-60">{item.badge}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Configuration spécifique selon le CRM choisi */}
                            {crmConfig.provider === 'tiime' && (
                                <div className="p-5 rounded-3xl bg-emerald-500/5 border border-emerald-500/20 space-y-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <h4 className="text-xs font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                                                Connecteur Tiime (tiime.fr)
                                            </h4>
                                            <p className="text-xs text-apple-secondary mt-1">
                                                Envoyez automatiquement chaque prospect capturé par carte NFC vers l&apos;onglet <strong>Clients</strong> de Tiime via le module officiel Tiime sur Make.com, ou téléchargez le CSV Tiime en 1 clic.
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleExportTiimeCsv}
                                            className="px-4 py-2 rounded-xl bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest shrink-0 cursor-pointer hover:bg-emerald-600 transition-all"
                                        >
                                            Export CSV Tiime
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-apple-secondary uppercase tracking-widest">
                                                Jeton API Tiime Direct (Sans Make)
                                            </label>
                                            <input
                                                type="password"
                                                placeholder="Bearer Token Tiime..."
                                                value={crmConfig.apiKey || ''}
                                                onChange={e => setCrmConfig({ ...crmConfig, apiKey: e.target.value })}
                                                className="w-full h-11 px-4 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-mono text-apple-textDark dark:text-white"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-apple-secondary uppercase tracking-widest">
                                                ID Société Tiime (Company ID)
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="Ex: 148290"
                                                value={crmConfig.tiimeCompanyId || ''}
                                                onChange={e => setCrmConfig({ ...crmConfig, tiimeCompanyId: e.target.value })}
                                                className="w-full h-11 px-4 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-mono text-apple-textDark dark:text-white"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-apple-secondary uppercase tracking-widest">
                                            OU URL Webhook (Optionnel si le client utilise Make/Zapier)
                                        </label>
                                        <input
                                            type="url"
                                            placeholder="https://hook.eu1.make.com/..."
                                            value={crmConfig.webhookUrl || ''}
                                            onChange={e => setCrmConfig({ ...crmConfig, webhookUrl: e.target.value })}
                                            className="w-full h-11 px-4 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-medium text-apple-textDark dark:text-white"
                                        />
                                    </div>
                                </div>
                            )}

                            {crmConfig.provider === 'hubspot' && (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-bold text-apple-secondary uppercase tracking-widest ml-1">
                                            Clé Private App HubSpot (Bearer Token)
                                        </label>
                                        <input
                                            type="password"
                                            placeholder="pat-eu1-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                                            value={crmConfig.apiKey || ''}
                                            onChange={e => setCrmConfig({ ...crmConfig, apiKey: e.target.value })}
                                            className="w-full h-12 px-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm font-mono text-apple-textDark dark:text-white"
                                        />
                                        <p className="text-[11px] text-apple-secondary ml-1">
                                            Crée automatiquement le contact dans HubSpot CRM (`crm/v3/objects/contacts`).
                                        </p>
                                    </div>
                                </div>
                            )}

                            {crmConfig.provider === 'pipedrive' && (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-bold text-apple-secondary uppercase tracking-widest ml-1">
                                            Jeton API Personnel Pipedrive (API Token)
                                        </label>
                                        <input
                                            type="password"
                                            placeholder="40dc1234567890abcdef..."
                                            value={crmConfig.apiKey || ''}
                                            onChange={e => setCrmConfig({ ...crmConfig, apiKey: e.target.value })}
                                            className="w-full h-12 px-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm font-mono text-apple-textDark dark:text-white"
                                        />
                                        <p className="text-[11px] text-apple-secondary ml-1">
                                            Crée automatiquement la fiche Personne dans Pipedrive (`/v1/persons`).
                                        </p>
                                    </div>
                                </div>
                            )}

                            {(crmConfig.provider === 'salesforce' || crmConfig.provider === 'webhook') && (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-bold text-apple-secondary uppercase tracking-widest ml-1">
                                            URL Webhook sortant (Salesforce / Make / Zapier)
                                        </label>
                                        <input
                                            type="url"
                                            placeholder="https://hooks.zapier.com/hooks/catch/... ou https://hook.eu1.make.com/..."
                                            value={crmConfig.webhookUrl || ''}
                                            onChange={e => setCrmConfig({ ...crmConfig, webhookUrl: e.target.value })}
                                            className="w-full h-12 px-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm font-medium text-apple-textDark dark:text-white"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Option Auto-Sync */}
                            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200/70 dark:border-white/10">
                                <div>
                                    <p className="text-xs font-black text-apple-textDark dark:text-white">Synchronisation automatique temps réel</p>
                                    <p className="text-[11px] text-apple-secondary">Envoyer chaque nouveau contact dès qu&apos;il scanne une carte de l&apos;équipe</p>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={crmConfig.autoSync}
                                    onChange={e => setCrmConfig({ ...crmConfig, autoSync: e.target.checked })}
                                    className="w-5 h-5 rounded text-primary focus:ring-primary cursor-pointer"
                                />
                            </div>

                            {crmConfig.lastSyncMessage && (
                                <div className="px-4 py-3 rounded-2xl bg-primary/5 border border-primary/20 flex items-center justify-between text-xs">
                                    <span className="font-bold text-apple-textDark dark:text-white">{crmConfig.lastSyncMessage}</span>
                                    <span className="text-[10px] font-black uppercase text-primary">{crmConfig.totalSynced || 0} sync.</span>
                                </div>
                            )}

                            <div className="flex flex-col sm:flex-row gap-3 pt-2">
                                <button
                                    type="button"
                                    disabled={isSyncingCrm}
                                    onClick={handleSyncLeadsNow}
                                    className="flex-1 h-14 rounded-full border border-primary/30 bg-primary/10 hover:bg-primary/20 text-primary font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer"
                                >
                                    <span className="material-symbols-outlined text-[18px]">sync</span>
                                    {isSyncingCrm ? 'Synchronisation...' : `Pousser les ${leads.length} contacts`}
                                </button>
                                <button
                                    type="button"
                                    disabled={isSavingCrm}
                                    onClick={handleSaveCrmConfig}
                                    className="flex-1 h-14 btn-titanium btn-titanium-primary text-white rounded-full font-black text-xs uppercase tracking-widest shadow-xl cursor-pointer"
                                >
                                    {isSavingCrm ? 'Enregistrement...' : 'Enregistrer & Activer'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
