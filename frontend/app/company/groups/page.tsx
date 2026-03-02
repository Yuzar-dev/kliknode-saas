'use client';

import { useState, useEffect } from 'react';

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
    const [departments, setDepartments] = useState<Department[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchDepartments = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch('/api/company/departments', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    setDepartments(data.data);
                }
            }
        } catch (error) {
            console.error('Error fetching departments:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchDepartments();
    }, []);

    // Helper to get color based on index or name hash (consistent colors)
    const getColor = (name: string, index: number) => {
        const colors = [
            { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-600 dark:text-blue-400', bar: 'bg-blue-500', border: 'bg-blue-500' },
            { bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-600 dark:text-purple-400', bar: 'bg-purple-500', border: 'bg-purple-500' },
            { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-600 dark:text-emerald-400', bar: 'bg-emerald-500', border: 'bg-emerald-500' },
            { bg: 'bg-orange-50 dark:bg-orange-900/20', text: 'text-orange-600 dark:text-orange-400', bar: 'bg-orange-500', border: 'bg-orange-500' },
            { bg: 'bg-pink-50 dark:bg-pink-900/20', text: 'text-pink-600 dark:text-pink-400', bar: 'bg-pink-500', border: 'bg-pink-500' },
        ];
        return colors[index % colors.length];
    };

    const getIcon = (name: string) => {
        const n = name.toLowerCase();
        if (n.includes('vente') || n.includes('sale')) return 'attach_money';
        if (n.includes('tech') || n.includes('dev')) return 'code';
        if (n.includes('market')) return 'campaign';
        if (n.includes('rh') || n.includes('hr') || n.includes('human')) return 'groups';
        return 'workspaces';
    };

    return (
        <div className="font-display max-w-7xl mx-auto flex flex-col h-[calc(100vh-8rem)]">
            <div className="flex items-center justify-between mb-8 px-1">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Groupes / Départements</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Gérez la structure et les équipes de votre organisation</p>
                </div>
                <div className="flex items-center gap-4">
                    <button className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-5 py-2.5 rounded-lg shadow-lg shadow-primary/20 transition-all active:scale-95">
                        <span className="material-icons text-sm">add</span>
                        <span className="font-medium text-sm">Nouveau Groupe</span>
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto pb-8">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <select className="appearance-none bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 py-2 pl-4 pr-10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 hover:border-slate-300 transition-colors cursor-pointer">
                                <option>Tous les départements</option>
                                <option>Actifs uniquement</option>
                                <option>Archivés</option>
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                                <span className="material-icons text-lg">expand_more</span>
                            </div>
                        </div>
                        <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-primary dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors">
                            <span className="material-icons text-lg">filter_list</span>
                            Filtres
                        </button>
                    </div>
                    <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-lg flex items-center">
                        <button className="p-1.5 rounded bg-white dark:bg-slate-700 text-primary shadow-sm">
                            <span className="material-icons text-xl block">grid_view</span>
                        </button>
                        <button className="p-1.5 rounded text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 ml-1">
                            <span className="material-icons text-xl block">view_list</span>
                        </button>
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {departments.map((dept, index) => {
                            const color = getColor(dept.name, index);
                            return (
                                <div key={dept.id} className="group bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-soft transition-all duration-300 relative overflow-hidden">
                                    <div className={`absolute top-0 left-0 w-1.5 h-full ${color.border}`}></div>
                                    <div className="p-6">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-lg ${color.bg} flex items-center justify-center ${color.text}`}>
                                                    <span className="material-icons text-xl">{getIcon(dept.name)}</span>
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-slate-900 dark:text-white text-lg">{dept.name}</h3>
                                                    <p className="text-xs text-slate-500">Créé le {new Date(dept.createdAt).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                            <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                                                <span className="material-icons text-xl">more_horiz</span>
                                            </button>
                                        </div>
                                        <div className="py-4">
                                            <div className="flex items-baseline gap-2 mb-2">
                                                <span className="text-2xl font-bold text-slate-900 dark:text-white">{dept.memberCount}</span>
                                                <span className="text-sm text-slate-500">membres</span>
                                            </div>
                                            <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5 mb-1">
                                                <div className={`${color.bar} h-1.5 rounded-full`} style={{ width: `${dept.activityPercent}%` }}></div>
                                            </div>
                                            <p className="text-xs text-slate-400 text-right">{dept.activityPercent}% d'activité</p>
                                        </div>
                                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                                            <div className="flex -space-x-3 overflow-hidden">
                                                {dept.topMembers.map((member) => (
                                                    member.avatarUrl ? (
                                                        <img key={member.id} className="inline-block h-8 w-8 rounded-full ring-2 ring-white dark:ring-slate-800 object-cover" src={member.avatarUrl} alt="" />
                                                    ) : (
                                                        <div key={member.id} className="h-8 w-8 rounded-full ring-2 ring-white dark:ring-slate-800 bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-xs font-medium text-slate-600 dark:text-slate-300 z-10">
                                                            {member.firstName?.charAt(0)}
                                                        </div>
                                                    )
                                                ))}
                                                {dept.memberCount > 3 && (
                                                    <div className="h-8 w-8 rounded-full ring-2 ring-white dark:ring-slate-800 bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-xs font-medium text-slate-600 dark:text-slate-300 z-10">
                                                        +{dept.memberCount - 3}
                                                    </div>
                                                )}
                                            </div>
                                            <button className="text-sm text-primary hover:text-primary-dark font-medium flex items-center gap-1 group-hover:underline">
                                                Voir
                                                <span className="material-icons text-sm">arrow_forward</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        <button className="group h-full flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-800/50 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 p-8 hover:border-primary hover:bg-primary/5 transition-all duration-300 min-h-[260px]">
                            <div className="w-14 h-14 rounded-full bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                                <span className="material-icons text-primary text-2xl">add</span>
                            </div>
                            <span className="font-semibold text-slate-700 dark:text-slate-200">Créer un département</span>
                            <span className="text-xs text-slate-500 mt-2 text-center max-w-[200px]">Ajoutez une nouvelle équipe pour commencer à organiser votre structure.</span>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
