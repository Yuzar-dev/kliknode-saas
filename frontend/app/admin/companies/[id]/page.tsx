'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AdminLayout from '@/components/admin/AdminLayout';
import { apiClient } from '@/lib/api-client';
import { AdminButton } from '@/components/ui/AdminButton';
import toast from 'react-hot-toast';

export default function CompanyDetail() {
    const params = useParams();
    const id = params?.id as string;
    const [company, setCompany] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('general');
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isSavingEdit, setIsSavingEdit] = useState(false);
    const [editForm, setEditForm] = useState({
        name: '',
        adminEmail: '',
        phone: '',
        siret: '',
        ice: '',
        address: '',
        postalCode: '',
        city: '',
        country: 'FR',
    });
    const router = useRouter();

    const fetchCompanyData = async () => {
        setIsLoading(true);
        try {
            const response = await apiClient.get(`/api/admin/companies/${id}`);
            if (response.data.success) {
                const c = response.data.data;
                setCompany(c);
                setEditForm({
                    name: c.name || '',
                    adminEmail: c.adminEmail || '',
                    phone: c.phone || '',
                    siret: c.siret || '',
                    ice: c.ice || '',
                    address: c.address || '',
                    postalCode: c.postalCode || '',
                    city: c.city || '',
                    country: c.country || 'FR',
                });
            }
        } catch (error) {
            console.error('Failed to fetch company detail', error);
            toast.error('Impossible de charger les détails de l\'entreprise');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editForm.name.trim()) {
            toast.error("Le nom de l'entreprise est requis");
            return;
        }
        setIsSavingEdit(true);
        try {
            const res = await apiClient.patch(`/api/admin/companies/${id}`, editForm);
            if (res.data?.success) {
                toast.success("Profil de l'entreprise mis à jour !");
                setIsEditModalOpen(false);
                fetchCompanyData();
            }
        } catch (error: any) {
            toast.error(error.response?.data?.error?.message || "Erreur lors de la mise à jour");
        } finally {
            setIsSavingEdit(false);
        }
    };

    const handleExportCompanyData = () => {
        if (!company) return;
        const headers = ['Prenom', 'Nom', 'Email', 'Role', 'Statut', 'Entreprise'];
        const rows = (company.users || []).map((u: any) => [
            `"${u.firstName || ''}"`,
            `"${u.lastName || ''}"`,
            `"${u.email || ''}"`,
            `"${u.role || ''}"`,
            `"${u.isActive ? 'Actif' : 'Inactif'}"`,
            `"${company.name || ''}"`,
        ].join(';'));
        const csvContent = '\uFEFF' + headers.join(';') + '\n' + rows.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `entreprise_${(company.name || 'export').replace(/\s+/g, '_')}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success('Données exportées en CSV !');
    };

    useEffect(() => {
        if (id) fetchCompanyData();
    }, [id]);

    const handleToggleStatus = async () => {
        try {
            toast.loading("Modification du statut...", { id: "status" });
            const response = await apiClient.patch(`/api/admin/companies/${id}/status`);
            if (response.data.success) {
                toast.success(response.data.data.message, { id: "status" });
                fetchCompanyData();
            }
        } catch (error) {
            toast.error("Erreur lors de la modification", { id: "status" });
        }
    };

    const handleDeleteCompany = async () => {
        if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette entreprise ? Cette action est irréversible.")) return;
        
        try {
            toast.loading("Suppression en cours...", { id: "delete" });
            const response = await apiClient.delete(`/api/admin/companies/${id}`);
            if (response.data.success) {
                toast.success("Entreprise supprimée", { id: "delete" });
                router.push('/admin/companies');
            }
        } catch (error) {
            toast.error("Erreur lors de la suppression", { id: "delete" });
        }
    };

    if (isLoading) {
        return (
            <AdminLayout>
                <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                    <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                    <p className="text-apple-secondary font-medium animate-pulse tracking-tight">Récupération des données en cours...</p>
                </div>
            </AdminLayout>
        );
    }

    if (!company) return null;

    return (
        <AdminLayout>
            <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {/* Breadcrumbs */}
                <nav className="flex items-center gap-2 text-[10px] font-bold text-apple-secondary uppercase tracking-[0.2em]">
                    <span className="opacity-40">Gestion Commerciale</span>
                    <span className="opacity-20">/</span>
                    <span className="text-apple-textDark dark:text-white">{company.name}</span>
                </nav>

                {/* Hero Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex gap-6 items-center">
                        <div className="w-24 h-24 rounded-[32px] klik-glass border border-white/40 dark:border-white/10 flex items-center justify-center text-3xl font-bold btn-titanium-primary text-white shadow-2xl shadow-primary/20">
                            {company.name.charAt(0)}
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h2 className="text-4xl font-bold text-apple-textDark dark:text-white tracking-tight leading-none">{company.name}</h2>
                                <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest border border-white/20 shadow-sm ${company.status === 'active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                                    }`}>
                                    {company.status === 'active' ? 'Actif' : 'Suspendu'}
                                </span>
                            </div>
                            <p className="text-apple-secondary font-medium mt-1">SIRET/ICE: {company.ice || company.siret || '-'} • ID: {company.id?.substring(0, 8).toUpperCase()}</p>
                            <div className="flex gap-4 mt-3">
                                <div className="flex items-center gap-1.5 text-[11px] font-bold text-apple-secondary uppercase tracking-wider opacity-60">
                                    <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                                    Client depuis le {new Date(company.createdAt).toLocaleDateString('fr-FR')}
                                </div>
                                <div className="flex items-center gap-1.5 text-[11px] font-bold text-apple-secondary uppercase tracking-wider opacity-60">
                                    <span className="material-symbols-outlined text-[16px]">location_on</span>
                                    {company.city || 'Ville non spécifiée'}, {company.country}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <AdminButton variant="primary" onClick={() => setIsEditModalOpen(true)} className="px-6 py-3 rounded-full flex items-center gap-2 shadow-xl shadow-primary/20">
                            <span className="material-symbols-outlined text-[20px]">edit_note</span>
                            Modifier Profil
                        </AdminButton>
                        <AdminButton variant="secondary" onClick={handleExportCompanyData} className="px-6 py-3 rounded-full border border-white/40 dark:border-white/10 flex items-center gap-2">
                            <span className="material-symbols-outlined text-[20px]">download</span>
                            Export Data
                        </AdminButton>
                        <button onClick={handleDeleteCompany} className="px-6 py-3 rounded-full flex items-center gap-2 transition-all hover:bg-red-500 hover:text-white border border-red-500 text-red-500 font-semibold shadow-xl shadow-red-500/10">
                            <span className="material-symbols-outlined text-[20px]">delete</span>
                            Supprimer
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="border-b border-gray-200/40 dark:border-white/5">
                    <div className="flex gap-10">
                        {[
                            { id: 'general', label: 'Informations Générales' },
                            { id: 'licences', label: `Licences & Employés (${company._count?.users || 0}/${company.subscription?.plan?.maxLicenses || '∞'})` },
                            { id: 'billing', label: 'Facturation & Paiements' },
                            { id: 'logs', label: 'Historique des Logs' }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`pb-4 text-xs font-bold uppercase tracking-widest transition-all relative ${activeTab === tab.id
                                    ? 'text-primary'
                                    : 'text-apple-secondary hover:text-apple-textDark dark:hover:text-white'
                                    }`}
                            >
                                {tab.label}
                                {activeTab === tab.id && (
                                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-full animate-in fade-in slide-in-from-bottom-1" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-10">
                    <div className="lg:col-span-2 space-y-8">
                        {activeTab === 'general' && (
                            <div className="klik-glass rounded-[40px] p-10 shadow-sm border border-white/40 dark:border-white/5">
                                <div className="flex justify-between items-center mb-8">
                                    <h3 className="text-xl font-bold text-apple-textDark dark:text-white tracking-tight">Informations Légales & Contact</h3>
                                    <span className="material-symbols-outlined text-apple-secondary cursor-pointer hover:text-primary transition-colors">open_in_new</span>
                                </div>
                                <div className="grid grid-cols-2 gap-12">
                                    <div className="space-y-6">
                                        <div>
                                            <label className="text-[10px] font-bold text-apple-secondary uppercase tracking-[0.2em] block mb-2 opacity-60">Raison Sociale</label>
                                            <p className="font-bold text-apple-textDark dark:text-gray-200">{company.name}</p>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-apple-secondary uppercase tracking-[0.2em] block mb-2 opacity-60">Adresse Siège</label>
                                            <p className="font-bold text-apple-textDark dark:text-gray-200 leading-relaxed">
                                                {company.address || 'Non spécifiée'}<br />
                                                {company.postalCode} {company.city}, {company.country}
                                            </p>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-apple-secondary uppercase tracking-[0.2em] block mb-2 opacity-60">ID Système</label>
                                            <p className="font-mono text-xs font-bold text-apple-secondary">{company.id}</p>
                                        </div>
                                    </div>
                                    <div className="space-y-6">
                                        <div>
                                            <label className="text-[10px] font-bold text-apple-secondary uppercase tracking-[0.2em] block mb-2 opacity-60">Email Admin</label>
                                            <p className="font-bold text-primary hover:underline cursor-pointer">{company.adminEmail}</p>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-apple-secondary uppercase tracking-[0.2em] block mb-2 opacity-60">Téléphone</label>
                                            <p className="font-bold text-apple-textDark dark:text-gray-200">{company.phone || '-'}</p>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-apple-secondary uppercase tracking-[0.2em] block mb-2 opacity-60">Statut Subscription</label>
                                            <span className="px-3 py-1 rounded-lg bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest border border-primary/20">
                                                {company.subscription?.status || 'Active'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'licences' && (
                            <div className="klik-glass rounded-[40px] p-8 shadow-sm border border-white/40 dark:border-white/5 overflow-hidden">
                                <div className="flex justify-between items-center mb-8 px-2">
                                    <h3 className="text-xl font-bold text-apple-textDark dark:text-white tracking-tight">Utilisateurs Associés</h3>
                                    <AdminButton variant="secondary" onClick={() => toast('🚀 Bientôt disponible', { icon: '🚧' })} className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest">Gérer Quotas</AdminButton>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="text-left border-b border-gray-100/10 dark:border-white/5">
                                                <th className="pb-4 px-4 text-[10px] font-bold text-apple-secondary uppercase tracking-[0.2em] opacity-40">Employé</th>
                                                <th className="pb-4 px-4 text-[10px] font-bold text-apple-secondary uppercase tracking-[0.2em] opacity-40">Rôle</th>
                                                <th className="pb-4 px-4 text-[10px] font-bold text-apple-secondary uppercase tracking-[0.2em] opacity-40">Dernière Connexion</th>
                                                <th className="pb-4 px-4 text-[10px] font-bold text-apple-secondary uppercase tracking-[0.2em] opacity-40">Statut</th>
                                                <th className="pb-4 px-4 text-right text-[10px] font-bold text-apple-secondary uppercase tracking-[0.2em] opacity-40">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100/10 dark:divide-white/5">
                                            {company.users?.map((u: any) => (
                                                <tr key={u.id} className="group hover:bg-white/40 dark:hover:bg-white/5 transition-all transition-duration-300">
                                                    <td className="py-4 px-4 flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-2xl bg-gray-100 dark:bg-white/5 flex items-center justify-center text-xs font-bold text-apple-secondary border border-white/20">
                                                            {u.firstName?.[0]}{u.lastName?.[0]}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold text-apple-textDark dark:text-white line-clamp-1">{u.firstName} {u.lastName}</p>
                                                            <p className="text-[10px] font-medium text-apple-secondary truncate">{u.email}</p>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-4">
                                                        <span className="text-[10px] font-bold text-apple-secondary uppercase tracking-widest bg-white/40 dark:bg-white/5 px-2 py-1 rounded-md">{u.role}</span>
                                                    </td>
                                                    <td className="py-4 px-4 text-xs font-bold text-apple-secondary uppercase tracking-tight">
                                                        {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString('fr-FR') : 'Jamais'}
                                                    </td>
                                                    <td className="py-4 px-4">
                                                        <div className="flex items-center gap-2">
                                                            <span className={`w-2 h-2 rounded-full ${u.isActive ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-red-500'}`} />
                                                            <span className="text-[10px] font-bold uppercase tracking-widest text-apple-secondary opacity-80">{u.isActive ? 'Actif' : 'Inactif'}</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-4 text-right">
                                                        <button className="material-symbols-outlined text-apple-secondary hover:text-primary transition-colors cursor-pointer">more_horiz</button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="space-y-8">
                        {/* Plan Summary Card */}
                        <div className="btn-titanium-primary rounded-[40px] p-10 text-white shadow-2xl shadow-primary/20 relative overflow-hidden group">
                            <div className="relative z-10 flex flex-col min-h-[220px] justify-between">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-white/60 text-[10px] font-bold uppercase tracking-[0.3em] mb-2">Plan Actuel</p>
                                        <h4 className="text-3xl font-bold tracking-tighter italic">{company.subscription?.plan?.name || 'PLAN SUR MESURE'}</h4>
                                    </div>
                                    <span className="material-symbols-outlined text-4xl opacity-20 group-hover:opacity-40 transition-opacity">auto_awesome</span>
                                </div>
                                <div className="space-y-6">
                                    <div>
                                        <p className="text-white/60 text-[10px] font-bold uppercase tracking-[0.2em] mb-1">Renouvellement</p>
                                        <p className="text-2xl font-bold tracking-tight">
                                            {company.subscription?.currentPeriodEnd ? new Date(company.subscription.currentPeriodEnd).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Non défini'}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-4 bg-white/10 p-4 rounded-2xl backdrop-blur-xl border border-white/10">
                                        <span className="material-symbols-outlined text-2xl">payments</span>
                                        <div>
                                            <p className="text-[9px] font-bold text-white/60 uppercase tracking-widest">Moyen de paiement</p>
                                            <p className="text-sm font-bold tracking-tight capitalize">
                                                {company.subscription?.paymentMethod?.replace(/_/g, ' ') || 'Non défini'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Admin Quick Actions */}
                        <div className="klik-glass rounded-[40px] p-8 shadow-sm border border-white/40 dark:border-white/5">
                            <h3 className="text-lg font-bold text-apple-textDark dark:text-white mb-6 px-2 tracking-tight">Actions Administrateur</h3>
                            <div className="space-y-2">
                                {[
                                    { icon: 'edit_note', label: "Modifier le nom / profil", hover: 'hover:text-primary', action: () => setIsEditModalOpen(true) },
                                    { icon: 'group_add', label: 'Changer le plan / quota', hover: 'hover:text-primary', action: () => router.push('/admin/plans') },
                                    { icon: 'receipt_long', label: 'Facturation & Paiements', hover: 'hover:text-emerald-500', action: () => router.push('/admin/transactions') }
                                ].map((action, idx) => (
                                    <button key={idx} onClick={action.action} className={`w-full flex items-center justify-between p-4 rounded-2xl hover:bg-white dark:hover:bg-white/5 transition-all group ${action.hover}`}>
                                        <div className="flex items-center gap-4">
                                            <span className="material-symbols-outlined text-apple-secondary group-hover:inherit transition-colors">{action.icon}</span>
                                            <span className="text-sm font-bold tracking-tight">{action.label}</span>
                                        </div>
                                        <span className="material-symbols-outlined text-xs text-apple-secondary">chevron_right</span>
                                    </button>
                                ))}
                                <div className="pt-4 border-t border-gray-100/10 dark:border-white/5 mt-4">
                                    <button onClick={handleToggleStatus} className={`w-full p-5 rounded-2xl transition-all text-xs font-bold flex items-center justify-center gap-3 ${company.status === 'active' ? 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-100' : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100'}`}>
                                        <span className="material-symbols-outlined text-[20px]">{company.status === 'active' ? 'block' : 'check_circle'}</span>
                                        {company.status === 'active' ? 'Suspendre le compte' : 'Réactiver le compte'}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Quick Stats */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="klik-glass rounded-[32px] p-6 border border-white/40 dark:border-white/5">
                                <p className="text-[10px] font-bold text-apple-secondary uppercase tracking-widest mb-1 opacity-60">Revenue</p>
                                <p className="text-xl font-bold text-apple-textDark dark:text-white tracking-tight">{company.stats?.revenue?.toLocaleString('fr-FR') || 0} {company.currency === 'MAD' ? 'MAD' : '€'}</p>
                                <div className="w-full bg-gray-200 dark:bg-white/5 h-1 rounded-full mt-4">
                                    <div className="bg-emerald-500 h-1 rounded-full w-full" />
                                </div>
                            </div>
                            <div className="klik-glass rounded-[32px] p-6 border border-white/40 dark:border-white/5">
                                <p className="text-[10px] font-bold text-apple-secondary uppercase tracking-widest mb-1 opacity-60">Scans</p>
                                <p className="text-xl font-bold text-apple-textDark dark:text-white tracking-tight">{company.stats?.scans?.toLocaleString('fr-FR') || 0}</p>
                                <div className="w-full bg-gray-200 dark:bg-white/5 h-1 rounded-full mt-4">
                                    <div className="bg-primary h-1 rounded-full w-2/3" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal Modifier Profil Entreprise */}
            {isEditModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-[#1E293B] rounded-[32px] w-full max-w-xl shadow-2xl overflow-hidden border border-white/40 dark:border-white/10">
                        <div className="p-8 border-b border-gray-100 dark:border-white/5 flex justify-between items-center bg-gray-50/50 dark:bg-white/5">
                            <div>
                                <h3 className="text-2xl font-bold text-apple-textDark dark:text-white tracking-tight">
                                    Modifier le profil de l&apos;entreprise
                                </h3>
                                <p className="text-xs text-apple-secondary font-medium mt-1">
                                    Le nouveau nom sera automatiquement propagé sur toutes les cartes collaborateurs.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsEditModalOpen(false)}
                                className="w-10 h-10 rounded-full hover:bg-gray-200 dark:hover:bg-white/10 flex items-center justify-center text-apple-secondary transition-all"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <form onSubmit={handleSaveProfile} className="p-8 space-y-5">
                            <div>
                                <label className="block text-xs font-bold text-apple-secondary uppercase tracking-widest mb-2">
                                    Nom commercial / Raison sociale *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={editForm.name}
                                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                    placeholder="Ex: YUZARPROD"
                                    className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-apple-textDark dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/30"
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-apple-secondary uppercase tracking-widest mb-2">
                                        Email Administrateur
                                    </label>
                                    <input
                                        type="email"
                                        required
                                        value={editForm.adminEmail}
                                        onChange={(e) => setEditForm({ ...editForm, adminEmail: e.target.value })}
                                        className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-medium text-apple-textDark dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/30"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-apple-secondary uppercase tracking-widest mb-2">
                                        Téléphone
                                    </label>
                                    <input
                                        type="text"
                                        value={editForm.phone}
                                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                        placeholder="+33 6 00 00 00 00"
                                        className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-medium text-apple-textDark dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/30"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-apple-secondary uppercase tracking-widest mb-2">
                                        SIRET (France)
                                    </label>
                                    <input
                                        type="text"
                                        value={editForm.siret}
                                        onChange={(e) => setEditForm({ ...editForm, siret: e.target.value })}
                                        className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-mono text-apple-textDark dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/30"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-apple-secondary uppercase tracking-widest mb-2">
                                        ICE (Maroc)
                                    </label>
                                    <input
                                        type="text"
                                        value={editForm.ice}
                                        onChange={(e) => setEditForm({ ...editForm, ice: e.target.value })}
                                        className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-mono text-apple-textDark dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/30"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-apple-secondary uppercase tracking-widest mb-2">
                                    Adresse
                                </label>
                                <input
                                    type="text"
                                    value={editForm.address}
                                    onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                                    className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-medium text-apple-textDark dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/30"
                                />
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-apple-secondary uppercase tracking-widest mb-2">
                                        Code Postal
                                    </label>
                                    <input
                                        type="text"
                                        value={editForm.postalCode}
                                        onChange={(e) => setEditForm({ ...editForm, postalCode: e.target.value })}
                                        className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-medium text-apple-textDark dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/30"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-apple-secondary uppercase tracking-widest mb-2">
                                        Ville
                                    </label>
                                    <input
                                        type="text"
                                        value={editForm.city}
                                        onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                                        className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-medium text-apple-textDark dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/30"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-apple-secondary uppercase tracking-widest mb-2">
                                        Pays
                                    </label>
                                    <select
                                        value={editForm.country}
                                        onChange={(e) => setEditForm({ ...editForm, country: e.target.value })}
                                        className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-apple-textDark dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/30"
                                    >
                                        <option value="FR">France (FR)</option>
                                        <option value="MA">Maroc (MA)</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-white/5">
                                <AdminButton
                                    type="button"
                                    variant="secondary"
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="px-6 py-3 rounded-xl border border-gray-200 dark:border-white/10"
                                >
                                    Annuler
                                </AdminButton>
                                <AdminButton
                                    type="submit"
                                    variant="primary"
                                    disabled={isSavingEdit}
                                    className="px-8 py-3 rounded-xl shadow-lg shadow-primary/30 font-bold uppercase tracking-widest text-xs"
                                >
                                    {isSavingEdit ? 'Enregistrement...' : 'Enregistrer'}
                                </AdminButton>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
