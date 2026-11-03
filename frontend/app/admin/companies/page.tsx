'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AdminLayout from '@/components/admin/AdminLayout';
import { apiClient } from '@/lib/api-client';
import { AdminButton } from '@/components/ui/AdminButton';
import { useAuthStore } from '@/store/auth-store';
import toast from 'react-hot-toast';

export default function CompanyList() {
    const [companies, setCompanies] = useState<any[]>([]);
    const [pagination, setPagination] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);

    const handleImpersonate = async (companyId: string) => {
        try {
            toast.loading("Connexion en cours...", { id: "impersonate" });
            const response = await apiClient.post(`/api/admin/companies/${companyId}/impersonate`);
            if (response.data.success) {
                const { user: managerData, tokens } = response.data.data;
                useAuthStore.getState().login({
                    id: managerData.id,
                    email: managerData.email,
                    firstName: managerData.firstName || null,
                    lastName: managerData.lastName || null,
                    role: managerData.role || 'MANAGER',
                    companyId: managerData.companyId || companyId,
                    avatarUrl: null,
                    isActive: true,
                    isPro: true,
                }, {
                    accessToken: tokens.accessToken,
                    refreshToken: tokens.refreshToken,
                });
                toast.success("Connecté en tant que Manager !", { id: "impersonate" });
                window.location.href = '/company';
            }
        } catch (error) {
            toast.error("Impossible de se connecter au compte", { id: "impersonate" });
        }
    };

    const handleToggleStatus = async (companyId: string) => {
        try {
            toast.loading("Modification du statut...", { id: "status" });
            const response = await apiClient.patch(`/api/admin/companies/${companyId}/status`);
            if (response.data.success) {
                toast.success(response.data.data.message, { id: "status" });
                fetchCompanies();
            }
        } catch (error) {
            toast.error("Erreur lors de la modification", { id: "status" });
        }
    };

    const handleResendInvitation = async (companyId: string) => {
        try {
            toast.loading("Envoi de l'invitation...", { id: "resend" });
            const response = await apiClient.post(`/api/admin/companies/${companyId}/resend-invitation`);
            if (response.data.success) {
                const joinPath = response.data.data?.joinPath;
                if (joinPath && typeof window !== 'undefined' && navigator.clipboard) {
                    await navigator.clipboard.writeText(`${window.location.origin}${joinPath}`).catch(() => {});
                }
                toast.success(response.data.data.message || "Invitation envoyée et lien copié !", { id: "resend", duration: 5000 });
            }
        } catch (error: any) {
            toast.error(error.response?.data?.error?.message || "Erreur lors de l'envoi", { id: "resend" });
        }
    };

    const handleDelete = async (companyId: string) => {
        if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette entreprise ? Cette action est irréversible.")) return;
        
        try {
            toast.loading("Suppression en cours...", { id: "delete" });
            const response = await apiClient.delete(`/api/admin/companies/${companyId}`);
            if (response.data.success) {
                toast.success("Entreprise supprimée avec succès", { id: "delete" });
                fetchCompanies();
            }
        } catch (error) {
            toast.error("Erreur lors de la suppression", { id: "delete" });
        }
    };

    const fetchCompanies = async () => {
        setIsLoading(true);
        try {
            const response = await apiClient.get(`/api/admin/companies?page=${page}&search=${search}`);
            if (response.data.success) {
                setCompanies(response.data.data.companies || []);
                setPagination(response.data.data.pagination);
            }
        } catch (error) {
            console.error('Failed to fetch companies', error);
            toast.error('Impossible de charger la liste des entreprises');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const timeout = setTimeout(() => {
            fetchCompanies();
        }, 300); // Debounce search
        return () => clearTimeout(timeout);
    }, [page, search]);

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(e.target.value);
        setPage(1); // Reset to first page on search
    };

    const exportToExcel = () => {
        if (!companies.length) {
            toast.error('Aucune donnée à exporter');
            return;
        }
        const headers = ['Entreprise', 'ICE_SIRET', 'Contact Admin', 'Plan', 'Cartes', 'Statut', 'Pays'];
        const rows = companies.map(c => [
            `"${c.name}"`,
            `"${c.ice || c.siret || '-'}"`,
            `"${c.adminEmail}"`,
            `"${c.subscription?.plan?.name || 'Aucun Plan'}"`,
            c._count?.cards || 0,
            c.status === 'active' ? 'Actif' : 'Suspendu',
            c.country
        ]);
        
        const csvContent = "data:text/csv;charset=utf-8," 
            + headers.join(';') + "\n" 
            + rows.map(e => e.join(';')).join("\n");
            
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Entreprises_${new Date().toLocaleDateString('fr-FR').replace(/\//g,'-')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <AdminLayout>
            <div className="flex flex-col gap-10 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <h2 className="text-5xl font-black text-apple-textDark dark:text-white tracking-tighter">Liste des Entreprises</h2>
                        <p className="text-[11px] font-black uppercase tracking-[0.25em] text-apple-secondary dark:text-slate-500 mt-3">Gérez votre annuaire B2B et les licences actives.</p>
                    </div>
                    <div className="flex gap-4">
                        <AdminButton onClick={exportToExcel} variant="secondary" className="px-8 h-14 rounded-full flex items-center gap-3 text-xs font-black uppercase tracking-widest">
                            <span className="material-symbols-outlined text-[22px]">ios_share</span>
                            Exporter Excel
                        </AdminButton>
                        <Link href="/admin/companies/new">
                            <AdminButton variant="primary" className="px-10 h-14 rounded-full shadow-2xl shadow-primary/30 flex items-center gap-3 text-xs font-black uppercase tracking-widest">
                                <span className="material-symbols-outlined text-[22px]">add_circle</span>
                                Créer Entreprise
                            </AdminButton>
                        </Link>
                    </div>
                </div>

                {/* Filters & Search */}
                <div className="flex items-center gap-4 max-w-xl">
                    <div className="relative w-full">
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                        <input
                            type="text"
                            placeholder="Rechercher une entreprise, ICE, SIRET ou email..."
                            className="w-full pl-12 pr-4 py-3 bg-white/50 dark:bg-white/5 border border-white/40 dark:border-white/10 rounded-2xl focus:ring-2 focus:ring-primary/20 transition-all font-medium text-sm"
                            value={search}
                            onChange={handleSearch}
                        />
                    </div>
                </div>

                {/* Table Section */}
                <div className="klik-glass rounded-[2.5rem] overflow-visible shadow-2xl border border-white/40 dark:border-white/5">
                    <div className="overflow-visible">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-gray-200/40 dark:border-white/5">
                                    <th className="px-8 py-6 text-[11px] font-bold text-apple-secondary uppercase tracking-[0.2em] opacity-60">Entreprise</th>
                                    <th className="px-6 py-6 text-[11px] font-bold text-apple-secondary uppercase tracking-[0.2em] opacity-60">ICE / SIRET</th>
                                    <th className="px-6 py-6 text-[11px] font-bold text-apple-secondary uppercase tracking-[0.2em] opacity-60">Contact Admin</th>
                                    <th className="px-6 py-6 text-[11px] font-bold text-apple-secondary uppercase tracking-[0.2em] opacity-60">Plan & Licences</th>
                                    <th className="px-6 py-6 text-[11px] font-bold text-apple-secondary uppercase tracking-[0.2em] opacity-60">Statut</th>
                                    <th className="px-6 py-6 text-[11px] font-bold text-apple-secondary uppercase tracking-[0.2em] opacity-60">Pays</th>
                                    <th className="px-8 py-6 text-[11px] font-bold text-apple-secondary uppercase tracking-[0.2em] opacity-60 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100/10 dark:divide-white/5">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={7} className="px-8 py-20 text-center">
                                            <div className="flex flex-col items-center gap-4">
                                                <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                                                <p className="text-apple-secondary font-medium animate-pulse">Chargement des données...</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : companies.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-8 py-20 text-center text-apple-secondary font-medium">
                                            Aucune entreprise trouvée.
                                        </td>
                                    </tr>
                                ) : (
                                    companies.map((company) => (
                                        <tr key={company.id} className="hover:bg-white/40 dark:hover:bg-white/5 transition-all duration-300 group cursor-default">
                                            <td className="px-8 py-5">
                                                <Link href={`/admin/companies/${company.id}`} className="flex items-center gap-4 group/item cursor-pointer">
                                                    <div className="w-12 h-12 rounded-[1.2rem] btn-titanium-primary flex items-center justify-center text-white font-black text-lg shadow-lg shrink-0">
                                                        {company.name.charAt(0)}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="font-black text-lg text-apple-textDark dark:text-white truncate tracking-tighter group-hover/item:text-primary transition-colors">{company.name}</p>
                                                        <p className="text-[9px] font-black text-apple-secondary dark:text-slate-500 opacity-60 truncate uppercase tracking-[0.2em]">
                                                            Membre depuis {new Date(company.createdAt).toLocaleDateString('fr-FR')}
                                                        </p>
                                                    </div>
                                                </Link>
                                            </td>
                                            <td className="px-6 py-5">
                                                <p className="text-sm font-semibold text-apple-textDark dark:text-white/80 font-mono">
                                                    {company.ice || company.siret || '-'}
                                                </p>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-2">
                                                    <p className="text-sm font-bold text-apple-textDark dark:text-white truncate">{company.adminEmail}</p>
                                                    {company.users && company.users.length > 0 && (
                                                        <span 
                                                            title={company.users[0].isActive ? 'Compte activé' : 'En attente d\'activation (Lien envoyé)'} 
                                                            className={`w-2 h-2 rounded-full shrink-0 ${company.users[0].isActive ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`}
                                                        ></span>
                                                    )}
                                                </div>
                                                <p className="text-[11px] font-semibold text-apple-secondary opacity-60 uppercase tracking-tighter">Contact principal</p>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-2">
                                                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border border-white/20 ${company.subscription?.plan?.slug === 'premium-plus' ? 'bg-primary/10 text-primary' : 'bg-gray-100 dark:bg-white/5 text-apple-secondary'
                                                        }`}>
                                                        {company.subscription?.plan?.name || 'Aucun Plan'}
                                                    </span>
                                                    <span className="text-sm font-bold text-apple-textDark dark:text-white">
                                                        {company._count?.cards || 0}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className={`flex items-center gap-1.5 ${company.status === 'active' ? 'text-emerald-500' : 'text-red-500'}`}>
                                                    <span className="material-symbols-outlined text-[18px]">
                                                        {company.status === 'active' ? 'check_circle' : 'cancel'}
                                                    </span>
                                                    <span className="text-[10px] font-bold uppercase tracking-widest">
                                                        {company.status === 'active' ? 'Actif' : 'Suspendu'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-lg">{company.country === 'FR' ? '🇫🇷' : '🇲🇦'}</span>
                                                    <span className="text-[11px] font-bold text-apple-secondary uppercase tracking-[0.1em]">{company.country}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <div className="flex items-center justify-end gap-3 transition-all opacity-100">
                                                    <Link href={`/admin/companies/${company.id}`} className="w-9 h-9 rounded-full hover:bg-white dark:hover:bg-white/10 flex items-center justify-center text-apple-secondary hover:text-primary transition-all shadow-sm group/btn" title="Voir Fiche">
                                                        <span className="material-symbols-outlined text-[20px] group-hover/btn:scale-110">visibility</span>
                                                    </Link>
                                                    <button onClick={() => handleImpersonate(company.id)} className="w-9 h-9 rounded-full hover:bg-white dark:hover:bg-white/10 flex items-center justify-center text-apple-secondary hover:text-amber-500 transition-all shadow-sm group/btn" title="Connexion en tant que">
                                                        <span className="material-symbols-outlined text-[20px] group-hover/btn:scale-110">login</span>
                                                    </button>
                                                    
                                                    <div className="relative">
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); setOpenDropdown(openDropdown === company.id ? null : company.id); }} 
                                                            className="w-9 h-9 rounded-full hover:bg-white dark:hover:bg-white/10 flex items-center justify-center text-apple-secondary hover:text-red-500 transition-all shadow-sm group/btn" 
                                                            title="Actions"
                                                        >
                                                            <span className="material-symbols-outlined text-[20px] group-hover/btn:scale-110">more_vert</span>
                                                        </button>
                                                        {openDropdown === company.id && (
                                                            <>
                                                                <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setOpenDropdown(null); }}></div>
                                                                <div className="absolute right-0 top-10 w-48 bg-white dark:bg-[#1E293B] rounded-2xl shadow-2xl border border-gray-100 dark:border-white/10 overflow-hidden z-50 py-2">
                                                                    <button onClick={(e) => {e.stopPropagation(); window.location.href = `mailto:${company.adminEmail}?subject=Support Kliknode`; setOpenDropdown(null);}} className="w-full px-4 py-2 text-left text-sm text-apple-textDark dark:text-white hover:bg-gray-50 dark:hover:bg-white/5 flex items-center gap-2">
                                                                        <span className="material-symbols-outlined text-[16px]">mail</span>
                                                                        Contacter
                                                                    </button>
                                                                    <button onClick={(e) => {e.stopPropagation(); handleResendInvitation(company.id); setOpenDropdown(null);}} className="w-full px-4 py-2 text-left text-sm text-apple-textDark dark:text-white hover:bg-gray-50 dark:hover:bg-white/5 flex items-center gap-2">
                                                                        <span className="material-symbols-outlined text-[16px]">forward_to_inbox</span>
                                                                        Renvoyer Invitation
                                                                    </button>
                                                                    <button onClick={(e) => {e.stopPropagation(); handleImpersonate(company.id); setOpenDropdown(null);}} className="w-full px-4 py-2 text-left text-sm text-apple-textDark dark:text-white hover:bg-gray-50 dark:hover:bg-white/5 flex items-center gap-2">
                                                                        <span className="material-symbols-outlined text-[16px]">settings_suggest</span>
                                                                        Accès Espace & CRM
                                                                    </button>
                                                                    <hr className="my-1 border-gray-100 dark:border-white/10"/>
                                                                    <button onClick={(e) => {e.stopPropagation(); handleToggleStatus(company.id); setOpenDropdown(null);}} className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 font-medium ${company.status === 'active' ? 'text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10' : 'text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10'}`}>
                                                                        <span className="material-symbols-outlined text-[16px]">{company.status === 'active' ? 'block' : 'check_circle'}</span>
                                                                        {company.status === 'active' ? 'Suspendre le compte' : 'Réactiver le compte'}
                                                                    </button>
                                                                    <button onClick={(e) => {e.stopPropagation(); handleDelete(company.id); setOpenDropdown(null);}} className="w-full px-4 py-2 text-left text-sm flex items-center gap-2 font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 mt-1">
                                                                        <span className="material-symbols-outlined text-[16px]">delete</span>
                                                                        Supprimer l'entreprise
                                                                    </button>
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {pagination && pagination.totalPages > 1 && (
                        <div className="px-8 py-6 border-t border-gray-200/40 dark:border-white/5 flex items-center justify-between">
                            <p className="text-[10px] font-bold text-apple-secondary uppercase tracking-[0.2em] opacity-40">
                                Affichage de {((page - 1) * pagination.limit) + 1} à {Math.min(page * pagination.limit, pagination.total)} sur {pagination.total} entreprises
                            </p>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="w-10 h-10 rounded-2xl glass flex items-center justify-center text-apple-secondary hover:text-primary transition-all disabled:opacity-30"
                                >
                                    <span className="material-symbols-outlined text-[20px]">chevron_left</span>
                                </button>
                                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(p => (
                                    <button
                                        key={p}
                                        onClick={() => setPage(p)}
                                        className={`w-10 h-10 rounded-2xl font-bold text-xs transition-all ${page === p ? 'btn-titanium-primary text-white shadow-lg' : 'glass text-apple-secondary hover:text-primary'
                                            }`}
                                    >
                                        {p}
                                    </button>
                                ))}
                                <button
                                    onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                                    disabled={page === pagination.totalPages}
                                    className="w-10 h-10 rounded-2xl glass flex items-center justify-center text-apple-secondary hover:text-primary transition-all disabled:opacity-30"
                                >
                                    <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
