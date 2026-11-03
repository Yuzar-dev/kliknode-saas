'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { apiClient } from '@/lib/api-client';
import toast from 'react-hot-toast';

interface AuditLog {
    id: string;
    action: string;
    entityType: string;
    entityId: string;
    changes: any;
    ipAddress: string | null;
    userAgent: string | null;
    createdAt: string;
    user: {
        firstName: string | null;
        lastName: string | null;
        email: string;
        avatarUrl: string | null;
    };
}

interface Pagination {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export default function AuditLogsPage() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [pagination, setPagination] = useState<Pagination | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

    const fetchLogs = async () => {
        setIsLoading(true);
        try {
            const response = await apiClient.get('/api/admin/audit-logs', {
                params: {
                    page,
                    limit: 10,
                    search: search || undefined
                }
            });

            if (response.data.success) {
                setLogs(response.data.data.logs);
                setPagination(response.data.data.pagination);
            }
        } catch (error) {
            console.error('Failed to fetch audit logs', error);
            toast.error('Impossible de charger les logs d\'audit');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchLogs();
        }, 500);
        return () => clearTimeout(timer);
    }, [page, search]);

    const getActionBadge = (action: string) => {
        const actionLower = action.toLowerCase();
        if (actionLower.includes('delete')) return 'bg-rose-50 text-rose-700 border-rose-100 shadow-rose-100/50';
        if (actionLower.includes('update') || actionLower.includes('edit')) return 'bg-amber-50 text-amber-700 border-amber-100 shadow-amber-100/50';
        if (actionLower.includes('create') || actionLower.includes('add')) return 'bg-emerald-50 text-emerald-700 border-emerald-100 shadow-emerald-100/50';
        return 'bg-slate-50 text-slate-700 border-slate-100 shadow-slate-100/50';
    };

    const getActionLabel = (action: string) => {
        const actionLower = action.toLowerCase();
        if (actionLower.includes('delete')) return 'Suppression';
        if (actionLower.includes('update') || actionLower.includes('edit')) return 'Modification';
        if (actionLower.includes('create') || actionLower.includes('add')) return 'Création';
        return action;
    };

    const handleExportLogs = () => {
        if (logs.length === 0) {
            toast.error('Aucun log à exporter');
            return;
        }
        const headers = ['ID', 'Acteur', 'Email', 'Action', 'Entité', 'Entité ID', 'IP', 'Date'];
        const rows = logs.map(log => [
            log.id,
            `${log.user.firstName || ''} ${log.user.lastName || ''}`.trim(),
            log.user.email,
            log.action,
            log.entityType,
            log.entityId,
            log.ipAddress || 'Internal',
            new Date(log.createdAt).toISOString()
        ]);
        const csvContent = [
            headers.join(','),
            ...rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
        ].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('Logs exportés en CSV');
    };

    return (
        <AdminLayout>
            <div className="flex flex-col gap-10 animate-in fade-in slide-in-from-bottom-4 duration-1000 pb-20">
                {/* Hero Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <nav className="flex items-center gap-2 text-[10px] font-bold text-apple-secondary uppercase tracking-[0.2em] mb-4">
                            <span className="opacity-40">Système & Sécurité</span>
                            <span className="opacity-20">/</span>
                            <span className="text-apple-textDark dark:text-white">Audit Logs</span>
                        </nav>
                        <h2 className="text-4xl font-bold text-apple-textDark dark:text-white tracking-tight">System Audit Logs</h2>
                        <p className="text-apple-secondary mt-1 font-medium leading-relaxed max-w-2xl">
                            Suivez et surveillez les actions sensibles effectuées sur l'ensemble de votre organisation pour garantir la sécurité et la conformité.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100 flex items-center shadow-sm">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block mr-2 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                            LIVE MONITORING
                        </span>
                        <button
                            onClick={handleExportLogs}
                            className="btn-titanium btn-titanium-primary text-white px-8 h-14 rounded-full font-bold text-sm flex items-center gap-3 shadow-xl shadow-slate-900/20 hover:translate-y-[-2px] transition-all active:scale-95 group"
                        >
                            <span className="material-symbols-outlined text-lg">download</span>
                            Exporter Logs
                        </button>
                    </div>
                </div>

                {/* Main Content Card */}
                <div className="bg-white/70 dark:bg-white/5 backdrop-blur-md border border-white dark:border-white/10 rounded-[32px] shadow-sm overflow-hidden flex flex-col min-h-[600px]">
                    <div className="px-8 py-6 border-b border-gray-100 dark:border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white/50 dark:bg-transparent">
                        <div className="flex flex-1 items-center gap-4">
                            <div className="relative group max-w-md w-full">
                                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-apple-secondary text-lg opacity-60">search</span>
                                <input
                                    type="text"
                                    placeholder="Rechercher par utilisateur, IP ou action..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full h-12 pl-12 pr-4 bg-slate-50 dark:bg-white/5 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-primary/20 transition-all"
                                />
                            </div>
                            <button
                                onClick={() => fetchLogs()}
                                className="h-12 px-6 flex items-center gap-2 bg-white dark:bg-white/10 border border-black/5 dark:border-white/10 rounded-2xl text-sm font-bold text-apple-secondary hover:text-primary transition-all shadow-sm"
                            >
                                <span className="material-symbols-outlined text-lg">refresh</span>
                                Actualiser
                            </button>
                        </div>
                        <div className="text-[11px] font-bold text-apple-secondary uppercase tracking-widest opacity-60">
                            Affichage de <span className="text-apple-textDark dark:text-white">{pagination?.total ? (pagination.page - 1) * 10 + 1 : 0}</span> à <span className="text-apple-textDark dark:text-white">{Math.min((pagination?.page || 1) * 10, pagination?.total || 0)}</span> sur <span className="text-apple-textDark dark:text-white">{pagination?.total || 0}</span> événements
                        </div>
                    </div>

                    <div className="overflow-x-auto flex-1">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 dark:bg-white/5 border-b border-gray-100 dark:border-white/5 text-[11px] font-bold text-apple-secondary uppercase tracking-[0.2em] opacity-60">
                                    <th className="px-8 py-5">Acteur</th>
                                    <th className="px-8 py-5">Action</th>
                                    <th className="px-8 py-5">Date & Heure</th>
                                    <th className="px-8 py-5">Adresse IP</th>
                                    <th className="px-8 py-5 text-right">Détails</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={5} className="px-8 py-32 text-center">
                                            <div className="flex flex-col items-center gap-4">
                                                <div className="w-10 h-10 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                                                <p className="text-apple-secondary font-medium animate-pulse">Synchronisation des entrées...</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : logs.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-8 py-32 text-center text-apple-secondary font-medium italic opacity-60">
                                            Aucun événement enregistré pour le moment.
                                        </td>
                                    </tr>
                                ) : (
                                    logs.map((log) => (
                                        <tr key={log.id} className="group hover:bg-white/40 dark:hover:bg-white/5 transition-all duration-300">
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center overflow-hidden border border-black/5">
                                                        {log.user.avatarUrl ? (
                                                            <img src={log.user.avatarUrl} alt="" className="h-full w-full object-cover" />
                                                        ) : (
                                                            <span className="text-xs font-bold text-apple-secondary">{(log.user.firstName?.[0] || '') + (log.user.lastName?.[0] || '')}</span>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-bold text-apple-textDark dark:text-white leading-tight">
                                                            {log.user.firstName} {log.user.lastName}
                                                        </span>
                                                        <span className="text-[10px] font-medium text-apple-secondary tracking-tight opacity-70">
                                                            {log.user.email}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-3">
                                                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border shadow-sm ${getActionBadge(log.action)}`}>
                                                        {getActionLabel(log.action)}
                                                    </span>
                                                    <div className="text-sm font-semibold text-apple-textDark dark:text-white leading-tight">
                                                        {log.entityType} <span className="font-normal text-apple-secondary ml-1">#{log.entityId.slice(0, 8)}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 text-sm font-medium text-apple-secondary font-mono opacity-80">
                                                {new Date(log.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                            </td>
                                            <td className="px-8 py-5 text-sm font-medium text-apple-secondary font-mono opacity-60">
                                                {log.ipAddress || 'Internal'}
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <button
                                                    onClick={() => setSelectedLog(log)}
                                                    className="opacity-0 group-hover:opacity-100 text-[10px] font-bold uppercase tracking-widest text-primary hover:underline transition-all"
                                                >
                                                    Détails
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="px-8 py-6 bg-slate-50/50 dark:bg-transparent border-t border-gray-100 dark:border-white/10 flex items-center justify-between">
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPage(prev => Math.max(1, prev - 1))}
                                disabled={page === 1}
                                className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-white/10 border border-black/5 dark:border-white/10 shadow-sm text-apple-secondary hover:text-primary disabled:opacity-30 transition-all"
                            >
                                <span className="material-symbols-outlined">chevron_left</span>
                            </button>
                            <div className="flex items-center gap-1">
                                {[...Array(pagination?.totalPages || 0)].map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setPage(i + 1)}
                                        className={`w-10 h-10 rounded-xl font-bold text-xs transition-all ${page === i + 1
                                                ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                                : 'bg-white dark:bg-white/5 text-apple-secondary hover:bg-slate-50'
                                            }`}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={() => setPage(prev => Math.min(pagination?.totalPages || 1, prev + 1))}
                                disabled={page === (pagination?.totalPages || 1)}
                                className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-white/10 border border-black/5 dark:border-white/10 shadow-sm text-apple-secondary hover:text-primary disabled:opacity-30 transition-all"
                            >
                                <span className="material-symbols-outlined">chevron_right</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal de Détails */}
            {selectedLog && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSelectedLog(null)}></div>
                    <div className="bg-white dark:bg-zinc-900 w-full max-w-4xl max-h-[80vh] rounded-[40px] shadow-2xl relative z-10 flex flex-col overflow-hidden border border-white/20">
                        <div className="px-10 py-8 border-b border-gray-100 dark:border-white/5 flex justify-between items-center bg-slate-50 dark:bg-white/5">
                            <div>
                                <h3 className="text-2xl font-bold text-primary tracking-tight">Détails de l'événement</h3>
                                <p className="text-[10px] font-bold text-apple-secondary uppercase tracking-[0.2em] mt-1">{selectedLog.action} - {selectedLog.entityType}</p>
                            </div>
                            <button onClick={() => setSelectedLog(null)} className="h-10 w-10 rounded-full hover:bg-black/5 flex items-center justify-center transition-all">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-10 space-y-10">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                                <div>
                                    <p className="text-[10px] font-bold text-apple-secondary uppercase tracking-widest mb-2 opacity-60">Utilisateur</p>
                                    <p className="text-sm font-bold text-apple-textDark dark:text-white leading-tight">{selectedLog.user.firstName} {selectedLog.user.lastName}</p>
                                    <p className="text-[11px] font-medium text-apple-secondary mt-0.5">{selectedLog.user.email}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-apple-secondary uppercase tracking-widest mb-2 opacity-60">Adresse IP</p>
                                    <p className="text-sm font-bold text-apple-textDark dark:text-white font-mono">{selectedLog.ipAddress || 'Internal'}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-apple-secondary uppercase tracking-widest mb-2 opacity-60">Cible</p>
                                    <p className="text-sm font-bold text-apple-textDark dark:text-white leading-tight">{selectedLog.entityType}</p>
                                    <p className="text-[11px] font-medium text-apple-secondary mt-0.5">ID: {selectedLog.entityId}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-apple-secondary uppercase tracking-widest mb-2 opacity-60">Date</p>
                                    <p className="text-sm font-bold text-apple-textDark dark:text-white">{new Date(selectedLog.createdAt).toLocaleString('fr-FR')}</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <p className="text-[10px] font-bold text-apple-secondary uppercase tracking-widest opacity-60">Données modifiées / Contexte</p>
                                <div className="bg-slate-950 rounded-[32px] p-8 overflow-x-auto shadow-inner border border-white/5">
                                    <pre className="text-emerald-400 font-mono text-xs leading-relaxed">
                                        {JSON.stringify(selectedLog.changes, null, 2)}
                                    </pre>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <p className="text-[10px] font-bold text-apple-secondary uppercase tracking-widest opacity-60">User Agent</p>
                                <p className="text-xs font-medium text-apple-secondary bg-slate-50 dark:bg-white/5 p-4 rounded-xl border border-black/5 italic">
                                    {selectedLog.userAgent || 'Donnée non disponible'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
