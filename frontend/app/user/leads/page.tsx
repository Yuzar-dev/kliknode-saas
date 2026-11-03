'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import ProFeatureGuard from '@/components/user/ProFeatureGuard';
import { apiClient } from '@/lib/api-client';
import { Sparkles, Trash2, Edit3, X, Check, Download, Mail, Phone, Calendar, User, FileText } from 'lucide-react';

interface Lead {
    id: string;
    profileId?: string;
    name?: string;
    firstName?: string | null;
    lastName?: string | null;
    companyName?: string | null;
    email: string;
    phone: string;
    notes: string | null;
    createdAt: string;
}

const getLeadFullName = (l: Lead) => {
    if (l.name) return l.name;
    const combined = `${l.firstName || ''} ${l.lastName || ''}`.trim();
    return combined || 'Contact KlikNode';
};

export default function LeadsPage() {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
    const [editingNotes, setEditingNotes] = useState('');
    const [isSavingNotes, setIsSavingNotes] = useState(false);

    // CRM Modal B2C PRO
    const [isCrmModalOpen, setIsCrmModalOpen] = useState(false);
    const [isSavingCrm, setIsSavingCrm] = useState(false);
    const [isSyncingCrm, setIsSyncingCrm] = useState(false);
    const [crmConfig, setCrmConfig] = useState({
        provider: 'tiime' as 'tiime' | 'hubspot' | 'pipedrive' | 'salesforce' | 'webhook',
        enabled: false,
        autoSync: true,
        apiKey: '',
        webhookUrl: '',
        tiimeCompanyId: '',
        lastSyncMessage: '',
        totalSynced: 0,
    });

    useEffect(() => {
        loadLeads();
        apiClient.get('/api/user/crm-config').then(res => {
            if (res.data.success && res.data.data) {
                setCrmConfig(prev => ({ ...prev, ...res.data.data }));
            }
        }).catch(() => {});
    }, []);

    const loadLeads = async () => {
        setLoading(true);
        try {
            const response = await apiClient.get('/api/user/leads');
            if (response.data.success) {
                setLeads(response.data.data.leads || []);
                setTotal(response.data.data.pagination?.total || (response.data.data.leads || []).length);
            }
        } catch (e: any) {
            console.error('Failed to load leads:', e);
            toast.error('Erreur lors du chargement de vos prospects');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveNotes = async () => {
        if (!selectedLead) return;
        setIsSavingNotes(true);
        try {
            const response = await apiClient.put(`/api/user/leads/${selectedLead.id}`, {
                notes: editingNotes
            });
            if (response.data.success) {
                toast.success('Notes mises à jour avec succès', {
                    style: {
                        borderRadius: '12px',
                        background: '#0f172a',
                        color: '#fff',
                    }
                });
                setSelectedLead(null);
                loadLeads();
            }
        } catch (e: any) {
            console.error('Failed to update lead notes:', e);
            toast.error('Erreur lors de la mise à jour des notes');
        } finally {
            setIsSavingNotes(false);
        }
    };

    const handleDeleteLead = async (id: string) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer définitivement ce prospect ?')) return;
        try {
            const response = await apiClient.delete(`/api/user/leads/${id}`);
            if (response.data.success) {
                toast.success('Prospect supprimé avec succès', {
                    style: {
                        borderRadius: '12px',
                        background: '#0f172a',
                        color: '#fff',
                    }
                });
                if (selectedLead?.id === id) {
                    setSelectedLead(null);
                }
                loadLeads();
            }
        } catch (e: any) {
            console.error('Failed to delete lead:', e);
            toast.error('Erreur lors de la suppression');
        }
    };

    const openNotesModal = (lead: Lead) => {
        setSelectedLead(lead);
        setEditingNotes(lead.notes || '');
    };

    const exportCSV = () => {
        const header = ['Nom', 'Entreprise', 'Email', 'Téléphone', 'Notes', 'Date'];
        const rows = leads.map(l => [
            getLeadFullName(l),
            l.companyName || '',
            l.email || '',
            l.phone || '',
            (l.notes || '').replace(/;/g, ' ').replace(/\n/g, ' '),
            new Date(l.createdAt).toLocaleDateString('fr-FR'),
        ]);
        const csv = '\uFEFF' + [header, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(';')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `leads-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success(`${leads.length} prospect(s) exporté(s) en CSV`);
    };

    const exportTiimeCSV = () => {
        if (leads.length === 0) {
            toast.error('Aucun prospect à exporter pour Tiime');
            return;
        }
        const headers = ['Nom', 'Type', 'Email', 'Téléphone', 'Entreprise', 'Prénom Contact', 'Nom Contact', 'Commentaires'];
        const rows = leads.map(l => {
            const fullName = getLeadFullName(l);
            const displayClientName = l.companyName ? l.companyName : fullName;
            const clientType = l.companyName ? 'Professionnel' : 'Particulier';
            return [
                displayClientName,
                clientType,
                l.email || '',
                l.phone || '',
                l.companyName || '',
                l.firstName || fullName,
                l.lastName || '',
                l.notes || 'Capturé via KlikNode NFC'
            ];
        });
        const csvContent = '\uFEFF' + [
            headers.join(';'),
            ...rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(';'))
        ].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `import-clients-tiime-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success(`${leads.length} fiche(s) client exportée(s) au format Tiime.fr !`);
    };

    const handleSaveCrm = async () => {
        setIsSavingCrm(true);
        try {
            const res = await apiClient.post('/api/user/crm-config', { ...crmConfig, enabled: true });
            if (res.data.success) {
                setCrmConfig(prev => ({ ...prev, ...res.data.data }));
                toast.success('Connecteur CRM PRO activé !');
                setIsCrmModalOpen(false);
            }
        } catch (err) {
            toast.error('Erreur lors de la sauvegarde CRM');
        } finally {
            setIsSavingCrm(false);
        }
    };

    const handleSyncCrmNow = async () => {
        setIsSyncingCrm(true);
        try {
            await apiClient.post('/api/user/crm-config', { ...crmConfig, enabled: true });
            const res = await apiClient.post('/api/user/crm-sync');
            if (res.data.success) {
                toast.success(res.data.data?.message || 'Prospects synchronisés avec votre CRM !');
            } else {
                toast.error(res.data.data?.message || 'Vérifiez vos paramètres CRM');
            }
        } catch (err) {
            toast.error('Erreur lors de la synchronisation CRM');
        } finally {
            setIsSyncingCrm(false);
        }
    };

    const exportVCard = (lead: Lead) => {
        const fullName = getLeadFullName(lead);
        const vcard = `BEGIN:VCARD
VERSION:3.0
FN:${fullName}
N:${lead.lastName || fullName};${lead.firstName || ''};;;
EMAIL;TYPE=INTERNET:${lead.email || ''}
TEL;TYPE=CELL:${lead.phone || ''}
NOTE:${(lead.notes || '').replace(/\n/g, '\\n')}
END:VCARD`;

        const blob = new Blob([vcard], { type: 'text/vcard;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `contact_${fullName.replace(/\s+/g, '_')}.vcf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const thisMonth = leads.filter(l => {
        const d = new Date(l.createdAt);
        const now = new Date();
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;

    const stats = [
        { 
            label: 'Total prospects', 
            value: total, 
            icon: 'people', 
            color: 'from-blue-500/20 to-indigo-500/20', 
            textColor: 'text-blue-600 dark:text-blue-400' 
        },
        { 
            label: 'Ce mois', 
            value: thisMonth, 
            icon: 'calendar_month', 
            color: 'from-emerald-500/20 to-teal-500/20', 
            textColor: 'text-emerald-600 dark:text-emerald-400' 
        },
        { 
            label: 'Nouveaux (30j)', 
            value: leads.filter(l => (Date.now() - new Date(l.createdAt).getTime()) < 30 * 86400000).length, 
            icon: 'person_add', 
            color: 'from-amber-500/20 to-orange-500/20', 
            textColor: 'text-amber-600 dark:text-amber-400' 
        },
    ];

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="animate-spin h-10 w-10 border-4 border-spaceGray dark:border-white border-t-transparent rounded-full" />
        </div>
    );

    return (
        <ProFeatureGuard 
            title="Activez votre CRM B2C PRO" 
            description="Visualisez et gérez les contacts capturés lors de vos rencontres. Exportez-les en un clic au format CSV ou VCF."
        >
            <div className="pb-20 relative selection:bg-slate-200">
                <div className="relative z-10 px-4 md:px-0">
                    <div className="mb-8 md:mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-3xl md:text-4xl font-black text-apple-textDark dark:text-white tracking-tight flex items-center gap-2">
                                Mes Prospects
                                <span className="text-xs bg-gradient-to-r from-primary to-indigo-600 text-white font-black px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm animate-pulse">PRO</span>
                            </h1>
                            <p className="text-apple-secondary dark:text-gray-400 font-bold text-sm mt-2">
                                Gérez les relations créées via votre QR Code et vos scans NFC.
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            {leads.length > 0 && (
                                <>
                                    <button 
                                        onClick={exportTiimeCSV}
                                        className="h-12 md:h-14 flex items-center justify-center gap-2 px-5 md:px-6 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 active:scale-95 transition-all font-black text-xs uppercase tracking-widest cursor-pointer"
                                    >
                                        <span className="material-symbols-outlined text-[18px]" translate="no">receipt_long</span>
                                        Export Tiime.fr
                                    </button>
                                    <button 
                                        onClick={exportCSV}
                                        className="btn-obsidian btn-obsidian-secondary h-12 md:h-14 flex items-center justify-center gap-2.5 px-5 md:px-6 rounded-full shadow-lg border border-gray-200 dark:border-white/10 active:scale-95 transition-all font-bold text-xs uppercase tracking-widest cursor-pointer"
                                    >
                                        <Download className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                                        Export CSV
                                    </button>
                                </>
                            )}
                            <button
                                onClick={() => setIsCrmModalOpen(true)}
                                className="h-12 md:h-14 px-6 rounded-full btn-titanium btn-titanium-primary text-white font-black text-xs uppercase tracking-widest shadow-xl flex items-center gap-2 cursor-pointer"
                            >
                                <span className="material-symbols-outlined text-[18px]" translate="no">hub</span>
                                {crmConfig.enabled ? `CRM: ${crmConfig.provider.toUpperCase()}` : 'Connecter CRM (Tiime / HubSpot)'}
                            </button>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8 md:mb-10">
                        {stats.map((s) => (
                            <div key={s.label} className="klik-glass p-6 md:p-8 rounded-[2rem] border border-white/60 dark:border-white/5 shadow-sm group hover:shadow-xl transition-all duration-500 overflow-hidden relative">
                                <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${s.color} blur-3xl opacity-30 -mr-12 -mt-12 group-hover:opacity-50 transition-all duration-700`} />
                                <div className="flex flex-col gap-4 md:gap-6">
                                    <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center bg-white dark:bg-white/5 shadow-sm border border-gray-100 dark:border-white/10">
                                        <span className={`material-symbols-outlined text-[24px] md:text-[28px] font-light ${s.textColor}`} translate="no">{s.icon}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <p className="text-3xl md:text-4xl font-black tracking-tighter text-apple-textDark dark:text-white">{s.value}</p>
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-apple-secondary dark:text-gray-500 mt-1">{s.label}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Table Section */}
                    <div className="klik-glass p-0 md:p-10 rounded-[1.5rem] md:rounded-[3rem] border border-white/60 dark:border-white/5 shadow-2xl relative overflow-hidden">
                        <div className="p-6 md:p-0">
                            <h3 className="text-lg md:text-xl font-black text-apple-textDark dark:text-white tracking-tight md:mb-8">Liste des prospects</h3>
                        </div>

                        {leads.length === 0 ? (
                            <div className="m-6 md:m-0 text-center py-16 md:py-20 bg-white/40 dark:bg-white/5 rounded-[2rem] border border-dashed border-gray-200 dark:border-white/10">
                                <span className="material-symbols-outlined text-5xl md:text-6xl text-apple-secondary dark:text-gray-700 mb-6 font-light" translate="no">person_search</span>
                                <p className="text-apple-textDark dark:text-white font-black text-lg md:text-xl">Aucun prospect pour l'instant</p>
                                <p className="text-apple-secondary dark:text-gray-500 font-bold text-xs md:text-sm mt-2 px-6 md:px-10">
                                    Vos prospects apparaîtront ici lorsque quelqu'un partagera ses informations avec vous depuis votre profil public.
                                </p>
                            </div>
                        ) : (
                            <>
                                {/* Mobile View (Cards) */}
                                <div className="md:hidden space-y-4 px-6 pb-8 h-[600px] overflow-y-auto custom-scrollbar">
                                    {leads.map(lead => (
                                        <div key={lead.id} className="bg-white/40 dark:bg-white/5 p-5 rounded-3xl border border-white/60 dark:border-white/5 shadow-sm active:scale-[0.98] transition-all">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-full flex items-center justify-center text-xs font-black text-white shadow-lg shrink-0"
                                                        style={{ background: 'linear-gradient(135deg, #0666EB, #7C3AED)' }}>
                                                        {lead.name?.[0]?.toUpperCase() || '?'}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="font-black text-apple-textDark dark:text-white tracking-tight text-base leading-tight uppercase">{lead.name}</span>
                                                        <span className="text-[10px] font-black text-apple-secondary dark:text-gray-500 uppercase tracking-widest mt-0.5">
                                                            {new Date(lead.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                        </span>
                                                    </div>
                                                </div>
                                                <button 
                                                    onClick={() => handleDeleteLead(lead.id)}
                                                    className="w-8 h-8 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all duration-300"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>

                                            <div className="space-y-3">
                                                <div className="flex items-center gap-3">
                                                    <Mail className="w-4 h-4 text-apple-secondary dark:text-gray-500" />
                                                    <span className="text-xs font-black text-apple-secondary dark:text-gray-400 break-all">{lead.email || '—'}</span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <Phone className="w-4 h-4 text-apple-secondary dark:text-gray-500" />
                                                    <span className="text-xs font-black text-apple-secondary dark:text-gray-400 font-mono italic">{lead.phone || '—'}</span>
                                                </div>
                                                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-white/5 flex flex-col gap-2">
                                                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Notes</span>
                                                    <p className="text-xs text-apple-secondary dark:text-gray-400 leading-relaxed italic bg-slate-50/50 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800/40">
                                                        {lead.notes ? `"${lead.notes}"` : 'Aucune note...'}
                                                    </p>
                                                </div>
                                            </div>
                                            
                                            <div className="mt-4 flex gap-2">
                                                <button 
                                                    onClick={() => exportVCard(lead)} 
                                                    className="flex-1 h-11 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 font-bold text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all"
                                                >
                                                    <span className="material-symbols-outlined text-[18px]" translate="no">person_add</span>
                                                    Ajouter
                                                </button>
                                                <button 
                                                    onClick={() => openNotesModal(lead)} 
                                                    className="flex-1 h-11 rounded-xl bg-slate-500/10 hover:bg-slate-500/20 text-slate-700 dark:text-slate-300 font-bold text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all"
                                                >
                                                    <Edit3 className="w-4 h-4" />
                                                    Notes
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Desktop View (Table) */}
                                <div className="hidden md:block overflow-x-auto custom-scrollbar">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="border-b border-gray-100 dark:border-white/5">
                                                <th className="px-10 py-5 text-[11px] font-black text-apple-secondary dark:text-gray-500 uppercase tracking-widest">Contact</th>
                                                <th className="px-10 py-5 text-[11px] font-black text-apple-secondary dark:text-gray-500 uppercase tracking-widest">Email</th>
                                                <th className="px-10 py-5 text-[11px] font-black text-apple-secondary dark:text-gray-500 uppercase tracking-widest">Téléphone</th>
                                                <th className="px-10 py-5 text-[11px] font-black text-apple-secondary dark:text-gray-500 uppercase tracking-widest">Note</th>
                                                <th className="px-10 py-5 text-[11px] font-black text-apple-secondary dark:text-gray-500 uppercase tracking-widest text-right">Date</th>
                                                <th className="px-4 py-5 w-36"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                                            {leads.map(lead => (
                                                <tr key={lead.id} className="group hover:bg-white/40 dark:hover:bg-white/5 transition-all duration-300">
                                                    <td className="px-10 py-6">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-black text-white shadow-lg shrink-0"
                                                                style={{ background: 'linear-gradient(135deg, #0666EB, #7C3AED)' }}>
                                                                {getLeadFullName(lead)?.[0]?.toUpperCase() || '?'}
                                                            </div>
                                                            <span className="font-black text-apple-textDark dark:text-white tracking-tight uppercase">{getLeadFullName(lead)}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-10 py-6 text-sm font-bold text-apple-secondary dark:text-gray-400">{lead.email || '—'}</td>
                                                    <td className="px-10 py-6 text-sm font-bold text-apple-secondary dark:text-gray-400 font-mono italic">{lead.phone || '—'}</td>
                                                    <td className="px-10 py-6">
                                                        <div className="flex items-center gap-2 max-w-[220px]">
                                                            <p className="text-sm font-bold text-apple-secondary dark:text-gray-400 truncate leading-relaxed">
                                                                {lead.notes || '—'}
                                                            </p>
                                                            {lead.notes && (
                                                                <button 
                                                                    onClick={() => openNotesModal(lead)}
                                                                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:text-primary"
                                                                    title="Voir / Modifier les notes"
                                                                >
                                                                    <Edit3 className="w-3.5 h-3.5" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-10 py-6 text-[11px] font-black text-apple-secondary dark:text-gray-500 uppercase tracking-widest text-right">
                                                        {new Date(lead.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                                                    </td>
                                                    <td className="px-4 py-6">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <button 
                                                                onClick={() => openNotesModal(lead)} 
                                                                className="w-10 h-10 rounded-full bg-slate-500/10 text-slate-700 dark:bg-slate-800/40 dark:text-slate-300 flex items-center justify-center hover:bg-slate-600 hover:text-white transition-all active:scale-95" 
                                                                title="Modifier les notes"
                                                            >
                                                                <Edit3 className="w-4 h-4" />
                                                            </button>
                                                            <button 
                                                                onClick={() => exportVCard(lead)} 
                                                                className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400 flex items-center justify-center hover:bg-blue-500 hover:text-white transition-all active:scale-95" 
                                                                title="Ajouter au répertoire"
                                                            >
                                                                <span className="material-symbols-outlined text-[20px]" translate="no">person_add</span>
                                                            </button>
                                                            <button 
                                                                onClick={() => handleDeleteLead(lead.id)} 
                                                                className="w-10 h-10 rounded-full bg-red-500/10 text-red-500 dark:bg-red-950/40 dark:text-red-400 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all active:scale-95" 
                                                                title="Supprimer le prospect"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Premium Notes Modification Glass Modal */}
            {selectedLead && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="w-full max-w-lg p-8 rounded-[2.5rem] bg-white/80 dark:bg-slate-900/80 border border-white/50 dark:border-white/10 shadow-2xl flex flex-col relative overflow-hidden transform animate-in zoom-in-95 duration-300">
                        {/* Effets lumineux d'arrière-plan */}
                        <div className="absolute -top-16 -left-16 w-32 h-32 bg-primary/20 rounded-full blur-2xl"></div>
                        <div className="absolute -bottom-16 -right-16 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl"></div>

                        <div className="flex items-center justify-between mb-6 relative z-10">
                            <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                                <FileText className="w-5 h-5 text-primary" />
                                Notes de contact
                            </h3>
                            <button 
                                onClick={() => setSelectedLead(null)}
                                className="w-8 h-8 rounded-full bg-slate-150 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="space-y-4 mb-6 relative z-10">
                            {/* Petit résumé du prospect */}
                            <div className="bg-slate-50/50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/50 space-y-2">
                                <div className="flex items-center gap-2 text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest">
                                    <User className="w-3.5 h-3.5 text-primary" />
                                    {selectedLead.name}
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-500 dark:text-slate-400 font-semibold">
                                    <div className="flex items-center gap-1.5 truncate">
                                        <Mail className="w-3.5 h-3.5" />
                                        {selectedLead.email || 'Non renseigné'}
                                    </div>
                                    <div className="flex items-center gap-1.5 truncate">
                                        <Phone className="w-3.5 h-3.5" />
                                        {selectedLead.phone || 'Non renseigné'}
                                    </div>
                                    <div className="flex items-center gap-1.5 sm:col-span-2">
                                        <Calendar className="w-3.5 h-3.5" />
                                        Capturé le {new Date(selectedLead.createdAt).toLocaleString('fr-FR')}
                                    </div>
                                </div>
                            </div>

                            {/* Zone d'édition */}
                            <div className="flex flex-col gap-2">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-wider">Commentaires & Notes</label>
                                <textarea
                                    value={editingNotes}
                                    onChange={(e) => setEditingNotes(e.target.value)}
                                    placeholder="Ajoutez des détails sur ce prospect (rencontre, projet, relance...)"
                                    rows={5}
                                    className="w-full p-4 rounded-2xl bg-white/60 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none text-sm text-slate-800 dark:text-slate-100 leading-relaxed resize-none transition-all"
                                />
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-end gap-3 relative z-10">
                            <button
                                onClick={() => setSelectedLead(null)}
                                className="h-12 px-6 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-800/50 active:scale-95 transition-all"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleSaveNotes}
                                disabled={isSavingNotes}
                                className="h-12 px-6 rounded-xl btn-titanium-primary flex items-center justify-center gap-2 text-white font-bold text-sm shadow-lg shadow-primary/10 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 transition-all"
                            >
                                {isSavingNotes ? (
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <Check className="w-4 h-4" />
                                        Enregistrer
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal CRM B2C PRO */}
            {isCrmModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="w-full max-w-xl p-8 rounded-[2.5rem] bg-white dark:bg-slate-900 border border-white/50 dark:border-white/10 shadow-2xl space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-xl font-black text-slate-900 dark:text-white">Connecter votre CRM PRO</h3>
                                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Tiime.fr, HubSpot, Pipedrive & Webhook</p>
                            </div>
                            <button onClick={() => setIsCrmModalOpen(false)} className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                            {[
                                { id: 'tiime', label: 'Tiime.fr' },
                                { id: 'hubspot', label: 'HubSpot' },
                                { id: 'pipedrive', label: 'Pipedrive' },
                                { id: 'webhook', label: 'Make / Zapier' },
                            ].map(item => (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => setCrmConfig({ ...crmConfig, provider: item.id as any })}
                                    className={`p-3 rounded-2xl border font-black text-xs transition-all cursor-pointer ${
                                        crmConfig.provider === item.id
                                            ? 'border-primary bg-primary/10 text-primary'
                                            : 'border-slate-200 dark:border-white/10 text-slate-700 dark:text-white'
                                    }`}
                                >
                                    {item.label}
                                </button>
                            ))}
                        </div>

                        {(crmConfig.provider === 'tiime' || crmConfig.provider === 'webhook') && (
                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">
                                    URL Webhook ({crmConfig.provider === 'tiime' ? 'Scénario Make.com → Tiime' : 'Make / Zapier'})
                                </label>
                                <input
                                    type="url"
                                    placeholder="https://hook.eu1.make.com/..."
                                    value={crmConfig.webhookUrl || ''}
                                    onChange={e => setCrmConfig({ ...crmConfig, webhookUrl: e.target.value })}
                                    className="w-full h-12 px-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
                                />
                            </div>
                        )}

                        {(crmConfig.provider === 'hubspot' || crmConfig.provider === 'pipedrive') && (
                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">
                                    Clé API ({crmConfig.provider === 'hubspot' ? 'HubSpot Private App Token' : 'Pipedrive API Token'})
                                </label>
                                <input
                                    type="password"
                                    placeholder="Collez votre clé API ici..."
                                    value={crmConfig.apiKey || ''}
                                    onChange={e => setCrmConfig({ ...crmConfig, apiKey: e.target.value })}
                                    className="w-full h-12 px-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-mono"
                                />
                            </div>
                        )}

                        <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60">
                            <div>
                                <p className="text-xs font-black text-slate-900 dark:text-white">Synchronisation automatique</p>
                                <p className="text-[11px] text-slate-500">Envoyer chaque nouveau contact dès qu&apos;il remplit votre formulaire</p>
                            </div>
                            <input
                                type="checkbox"
                                checked={crmConfig.autoSync}
                                onChange={e => setCrmConfig({ ...crmConfig, autoSync: e.target.checked })}
                                className="w-5 h-5 rounded text-primary"
                            />
                        </div>

                        <div className="flex gap-3">
                            <button
                                type="button"
                                disabled={isSyncingCrm}
                                onClick={handleSyncCrmNow}
                                className="flex-1 h-12 rounded-2xl border border-primary/30 bg-primary/10 text-primary font-black text-xs uppercase tracking-widest cursor-pointer"
                            >
                                {isSyncingCrm ? 'Envoi...' : 'Synchroniser mes contacts'}
                            </button>
                            <button
                                type="button"
                                disabled={isSavingCrm}
                                onClick={handleSaveCrm}
                                className="flex-1 h-12 rounded-2xl btn-titanium-primary text-white font-black text-xs uppercase tracking-widest cursor-pointer"
                            >
                                {isSavingCrm ? 'Sauvegarde...' : 'Enregistrer'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </ProFeatureGuard>
    );
}
