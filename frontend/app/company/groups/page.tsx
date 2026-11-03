'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import toast from 'react-hot-toast';

interface Department {
    id: string;
    name: string;
    createdAt: string;
    memberCount: number;
    activityPercent: number;
    topMembers: {
        id: string;
        firstName: string | null;
        lastName: string | null;
        avatarUrl: string | null;
    }[];
}

export default function GroupsPage() {
    const router = useRouter();
    const [departments, setDepartments] = useState<Department[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filterType, setFilterType] = useState<'all' | 'active' | 'empty'>('all');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    // Create / Edit Modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDept, setEditingDept] = useState<Department | null>(null);
    const [deptName, setDeptName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchDepartments = async () => {
        setIsLoading(true);
        try {
            const response = await apiClient.get('/api/company/departments');
            if (response.data.success) {
                setDepartments(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching departments:', error);
            toast.error('Impossible de charger les départements');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchDepartments();
    }, []);

    const openCreateModal = () => {
        setEditingDept(null);
        setDeptName('');
        setIsModalOpen(true);
    };

    const openEditModal = (dept: Department) => {
        setEditingDept(dept);
        setDeptName(dept.name);
        setIsModalOpen(true);
    };

    const handleSubmitDept = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!deptName.trim()) return;
        setIsSubmitting(true);
        try {
            if (editingDept) {
                const res = await apiClient.put(`/api/company/departments/${editingDept.id}`, { name: deptName });
                if (res.data.success) {
                    toast.success('Département renommé avec succès');
                    setIsModalOpen(false);
                    fetchDepartments();
                }
            } else {
                const res = await apiClient.post('/api/company/departments', { name: deptName });
                if (res.data.success) {
                    toast.success('Nouveau département créé avec succès');
                    setIsModalOpen(false);
                    fetchDepartments();
                }
            }
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Erreur lors de l\'enregistrement');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteDept = async (dept: Department) => {
        if (!confirm(`Voulez-vous vraiment supprimer le département "${dept.name}" ?`)) return;
        try {
            const res = await apiClient.delete(`/api/company/departments/${dept.id}`);
            if (res.data.success) {
                toast.success('Département supprimé');
                fetchDepartments();
            }
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Erreur lors de la suppression');
        }
    };

    const filteredDepartments = departments.filter(dept => {
        if (filterType === 'active') return dept.memberCount > 0;
        if (filterType === 'empty') return dept.memberCount === 0;
        return true;
    });

    const getColor = (index: number) => {
        const colors = [
            { text: 'text-indigo-500', bar: 'bg-indigo-500', shadow: 'shadow-indigo-500/50' },
            { text: 'text-emerald-500', bar: 'bg-emerald-500', shadow: 'shadow-emerald-500/50' },
            { text: 'text-amber-500', bar: 'bg-amber-500', shadow: 'shadow-amber-500/50' },
            { text: 'text-pink-500', bar: 'bg-pink-500', shadow: 'shadow-pink-500/50' },
            { text: 'text-sky-500', bar: 'bg-sky-500', shadow: 'shadow-sky-500/50' },
        ];
        return colors[index % colors.length];
    };

    const getIcon = (name: string) => {
        const n = name.toLowerCase();
        if (n.includes('vente') || n.includes('sale') || n.includes('commerc')) return 'attach_money';
        if (n.includes('tech') || n.includes('dev') || n.includes('it')) return 'code';
        if (n.includes('market') || n.includes('comm')) return 'campaign';
        if (n.includes('rh') || n.includes('hr') || n.includes('human')) return 'groups';
        return 'workspaces';
    };

    return (
        <div className="font-display max-w-7xl mx-auto flex flex-col min-h-[calc(100vh-8rem)] animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
                <div>
                    <h1 className="text-4xl md:text-5xl font-black text-apple-textDark dark:text-white tracking-tighter">Départements</h1>
                    <p className="text-[11px] font-black uppercase tracking-[0.25em] text-apple-secondary dark:text-slate-500 mt-3">Gérez la structure et les équipes de votre organisation</p>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={openCreateModal}
                        className="px-8 h-14 rounded-full btn-titanium btn-titanium-primary shadow-2xl shadow-primary/30 flex items-center gap-3 text-xs font-black uppercase tracking-widest text-white transition-all group cursor-pointer"
                    >
                        <span className="material-symbols-outlined text-[22px] group-hover:rotate-90 transition-transform">add</span>
                        Nouveau Groupe
                    </button>
                </div>
            </div>

            <div className="flex-1 pb-8">
                {/* Filters Bar */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 bg-white/20 dark:bg-white/5 p-2 rounded-full border border-white/40 dark:border-white/10 shadow-sm klik-glass">
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <div className="relative w-full sm:w-auto">
                            <select
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value as any)}
                                className="appearance-none bg-transparent text-apple-textDark dark:text-white font-black text-[10px] uppercase tracking-widest py-3 pl-6 pr-12 rounded-full focus:outline-none hover:bg-white/40 dark:hover:bg-white/10 transition-colors cursor-pointer border-none"
                            >
                                <option value="all">Tous les départements ({departments.length})</option>
                                <option value="active">Avec membres ({departments.filter(d => d.memberCount > 0).length})</option>
                                <option value="empty">Sans membre ({departments.filter(d => d.memberCount === 0).length})</option>
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-apple-secondary">
                                <span className="material-symbols-outlined text-lg">expand_more</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center bg-black/5 dark:bg-white/10 p-1 rounded-full gap-1">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer ${viewMode === 'grid'
                                ? 'bg-white dark:bg-[#1C1C1E] text-primary shadow-sm'
                                : 'text-apple-secondary hover:text-apple-textDark dark:hover:text-white'
                                }`}
                            title="Vue Grille"
                        >
                            <span className="material-symbols-outlined text-[20px]">grid_view</span>
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer ${viewMode === 'list'
                                ? 'bg-white dark:bg-[#1C1C1E] text-primary shadow-sm'
                                : 'text-apple-secondary hover:text-apple-textDark dark:hover:text-white'
                                }`}
                            title="Vue Liste"
                        >
                            <span className="material-symbols-outlined text-[20px]">view_list</span>
                        </button>
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
                        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                        <p className="text-apple-secondary font-medium animate-pulse tracking-tight">Chargement des départements...</p>
                    </div>
                ) : (
                    <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6' : 'flex flex-col gap-4'}>
                        {filteredDepartments.map((dept, index) => {
                            const color = getColor(index);
                            return (
                                <div key={dept.id} className="group klik-glass p-8 rounded-[32px] border border-white/40 dark:border-white/5 shadow-lg relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
                                    <div className={`absolute top-0 left-0 w-full h-1.5 ${color.bar} opacity-80`}></div>
                                    <div className="flex justify-between items-start mb-6 mt-2">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-14 h-14 rounded-[1.2rem] glass flex items-center justify-center ${color.text} shadow-sm border border-white/20 dark:border-white/10`}>
                                                <span className="material-symbols-outlined text-[28px]">{getIcon(dept.name)}</span>
                                            </div>
                                            <div>
                                                <h3 className="font-black text-2xl text-apple-textDark dark:text-white tracking-tight">{dept.name}</h3>
                                                <p className="text-[9px] font-bold text-apple-secondary uppercase tracking-[0.2em] mt-1">
                                                    Créé le {new Date(dept.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => openEditModal(dept)}
                                                title="Renommer le groupe"
                                                className="w-8 h-8 rounded-full flex items-center justify-center text-apple-secondary hover:text-primary hover:bg-white/40 dark:hover:bg-white/10 transition-all cursor-pointer"
                                            >
                                                <span className="material-symbols-outlined text-[18px]">edit</span>
                                            </button>
                                            <button
                                                onClick={() => handleDeleteDept(dept)}
                                                title="Supprimer le groupe"
                                                className="w-8 h-8 rounded-full flex items-center justify-center text-apple-secondary hover:text-rose-500 hover:bg-white/40 dark:hover:bg-white/10 transition-all cursor-pointer"
                                            >
                                                <span className="material-symbols-outlined text-[18px]">delete</span>
                                            </button>
                                        </div>
                                    </div>

                                    <div className="py-4">
                                        <div className="flex items-baseline gap-2 mb-3">
                                            <span className="text-5xl font-black text-apple-textDark dark:text-white tracking-tighter">{dept.memberCount}</span>
                                            <span className="text-[10px] font-bold text-apple-secondary uppercase tracking-widest">membres</span>
                                        </div>
                                        <div className="w-full bg-gray-200/50 dark:bg-white/10 rounded-full h-1.5 mb-2 overflow-hidden">
                                            <div className={`${color.bar} h-1.5 rounded-full ${color.shadow}`} style={{ width: `${dept.activityPercent}%`, boxShadow: '0 0 10px currentColor' }}></div>
                                        </div>
                                        <p className="text-[10px] font-bold text-apple-secondary uppercase tracking-widest text-right">{dept.activityPercent}% d'activité</p>
                                    </div>

                                    <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-100/20 dark:border-white/10">
                                        <div className="flex -space-x-4 overflow-hidden">
                                            {dept.topMembers.map((member, i) => (
                                                member.avatarUrl ? (
                                                    <img key={member.id} className="inline-block h-10 w-10 rounded-full ring-2 ring-white dark:ring-[#1C1C1E] object-cover shadow-sm z-[30]" style={{ zIndex: 30 - i }} src={member.avatarUrl} alt="" />
                                                ) : (
                                                    <div key={member.id} className="h-10 w-10 rounded-full ring-2 ring-white dark:ring-[#1C1C1E] btn-titanium-primary flex items-center justify-center text-xs font-black text-white shadow-sm" style={{ zIndex: 30 - i }}>
                                                        {member.firstName?.charAt(0)}
                                                    </div>
                                                )
                                            ))}
                                            {dept.memberCount > 3 && (
                                                <div className="h-10 w-10 rounded-full ring-2 ring-white dark:ring-[#1C1C1E] glass flex items-center justify-center text-[10px] font-black text-apple-secondary z-0">
                                                    +{dept.memberCount - 3}
                                                </div>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => router.push(`/company/employees?departmentId=${dept.id}`)}
                                            className="h-10 px-4 rounded-full glass border border-white/20 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-primary hover:bg-white/60 dark:hover:bg-white/10 transition-all group/btn cursor-pointer"
                                        >
                                            Voir
                                            <span className="material-symbols-outlined text-[16px] group-hover/btn:translate-x-1 transition-transform">arrow_forward</span>
                                        </button>
                                    </div>
                                </div>
                            );
                        })}

                        {/* Add New Department Card */}
                        <button
                            onClick={openCreateModal}
                            className="group klik-glass rounded-[32px] border-2 border-dashed border-gray-300 dark:border-white/20 p-8 flex flex-col items-center justify-center hover:border-primary hover:bg-primary/5 transition-all duration-300 min-h-[260px] cursor-pointer"
                        >
                            <div className="w-16 h-16 rounded-[1.5rem] glass shadow-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                                <span className="material-symbols-outlined text-primary text-3xl">add</span>
                            </div>
                            <span className="font-black text-xl text-apple-textDark dark:text-white tracking-tight mb-2">Créer un groupe</span>
                            <span className="text-[10px] font-bold text-apple-secondary uppercase tracking-widest text-center max-w-[200px] leading-relaxed">Ajoutez une nouvelle équipe pour commencer à organiser votre structure.</span>
                        </button>
                    </div>
                )}
            </div>

            {/* Modal Création / Renommage Département */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
                    <div className="bg-white dark:bg-[#1C1C1E] w-full max-w-md rounded-[40px] shadow-2xl relative z-10 overflow-hidden border border-white/20">
                        <div className="px-8 py-6 border-b border-gray-100 dark:border-white/10 flex justify-between items-center">
                            <h3 className="text-xl font-black text-apple-textDark dark:text-white tracking-tight">
                                {editingDept ? 'Renommer le groupe' : 'Nouveau Groupe'}
                            </h3>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="h-9 w-9 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 flex items-center justify-center transition-all"
                            >
                                <span className="material-symbols-outlined text-lg">close</span>
                            </button>
                        </div>
                        <form onSubmit={handleSubmitDept} className="p-8 space-y-6">
                            <div className="space-y-2">
                                <label className="text-[11px] font-bold text-apple-secondary uppercase tracking-widest ml-1">Nom du département / équipe *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ex: Équipe Commerciale, Marketing, Tech..."
                                    value={deptName}
                                    onChange={e => setDeptName(e.target.value)}
                                    className="w-full h-12 px-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm font-bold text-apple-textDark dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full h-14 btn-titanium btn-titanium-primary text-white rounded-full font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 cursor-pointer"
                            >
                                {isSubmitting ? (
                                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                ) : (
                                    editingDept ? 'Enregistrer' : 'Créer le groupe'
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
