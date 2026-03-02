'use client';

import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { AdminButton } from '@/components/ui/AdminButton';

export default function BatchGeneratorPage() {
    return (
        <AdminLayout>
            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Configuration Panel */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                <span className="material-icons-outlined">add_circle_outline</span>
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Nouveau Lot de Production</h2>
                                <p className="text-sm text-slate-500 mt-1">Configurez les paramètres pour la génération de tags NFC.</p>
                            </div>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="qty">
                                        Quantité à générer
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <span className="material-icons-outlined text-slate-500 text-lg">dialpad</span>
                                        </div>
                                        <input
                                            className="block w-full pl-10 pr-12 py-2.5 rounded-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-0 focus:shadow-[0_0_10px_rgba(59,130,246,0.5)] sm:text-sm shadow-sm transition-all"
                                            id="qty"
                                            name="qty"
                                            placeholder="ex: 5000"
                                            type="number"
                                        />
                                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                            <span className="text-slate-500 sm:text-xs font-medium">unités</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200" htmlFor="chip-type">
                                        Technologie de Puce
                                    </label>
                                    <div className="relative">
                                        <select
                                            className="block w-full pl-3 pr-10 py-2.5 text-base border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-0 focus:shadow-[0_0_10px_rgba(59,130,246,0.5)] sm:text-sm rounded-full shadow-sm transition-all"
                                            id="chip-type"
                                            name="chip-type"
                                        >
                                            <option>NTAG213 (Standard)</option>
                                            <option>NTAG215 (Étendu)</option>
                                            <option>NTAG216 (Haute Capacité)</option>
                                            <option>MIFARE Ultralight</option>
                                            <option>ICODE SLIX</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200" htmlFor="batch-tag">
                                    Référence du Lot / Étiquette
                                </label>
                                <div className="relative rounded-lg shadow-sm">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <span className="material-icons-outlined text-slate-500 text-lg">label</span>
                                    </div>
                                    <input
                                        className="block w-full pl-10 py-2.5 rounded-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-0 focus:shadow-[0_0_10px_rgba(59,130,246,0.5)] sm:text-sm shadow-sm transition-all"
                                        id="batch-tag"
                                        name="batch-tag"
                                        placeholder="ex: Prod-Octobre-2025-EU"
                                        type="text"
                                    />
                                </div>
                                <p className="text-xs text-slate-500">Cette étiquette sera utilisée pour le suivi interne et le nommage des fichiers.</p>
                            </div>
                            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                                <button className="flex items-center text-sm text-slate-500 hover:text-primary transition-colors gap-1 group">
                                    <span className="material-icons-outlined text-lg group-hover:rotate-90 transition-transform">chevron_right</span>
                                    Configuration Avancée (Chiffrement, Sel)
                                </button>
                            </div>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-4 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
                            <span className="text-xs text-slate-500">Temps de génération estimé : ~45s</span>
                            <AdminButton
                                variant="primary"
                                type="button"
                            >
                                <span className="material-icons-outlined text-lg mr-2">bolt</span>
                                Générer le Lot
                            </AdminButton>
                        </div>
                    </div>

                    {/* Status Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center gap-4">
                            <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 flex items-center justify-center">
                                <span className="material-icons-outlined">dns</span>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-500">État du Serveur</p>
                                <p className="text-lg font-bold text-slate-900 dark:text-white">Opérationnel</p>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center gap-4">
                            <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 flex items-center justify-center">
                                <span className="material-icons-outlined">memory</span>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-500">UIDs Restants</p>
                                <p className="text-lg font-bold text-slate-900 dark:text-white">12.4M</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar - History */}
                <div className="lg:col-span-1">
                    <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 h-full flex flex-col">
                        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                            <h3 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                                <span className="material-icons-outlined text-slate-400 text-lg">history</span>
                                Derniers Lots
                            </h3>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all group cursor-pointer">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                                            NTAG213
                                        </span>
                                        <span className="text-xs text-slate-400 font-mono">#9921</span>
                                    </div>
                                    <span className="text-[10px] uppercase font-bold tracking-wide text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">il y a 2 min</span>
                                </div>
                                <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-2 truncate">Prod-Sept-2025-Batch-A</h4>
                                <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-700/50">
                                    <span className="text-xs font-medium text-slate-500">5,000 unités</span>
                                    <button className="text-primary hover:text-blue-700 text-xs font-semibold flex items-center gap-1 bg-primary/5 hover:bg-primary/10 px-2 py-1.5 rounded-full transition-colors">
                                        <span className="material-icons-outlined text-sm">download</span>
                                        CSV
                                    </button>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all group cursor-pointer">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                                            MIFARE
                                        </span>
                                        <span className="text-xs text-slate-400 font-mono">#9920</span>
                                    </div>
                                    <span className="text-[10px] uppercase font-bold tracking-wide text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">il y a 1 heure</span>
                                </div>
                                <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-2 truncate">Client-Logistics-v2</h4>
                                <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-700/50">
                                    <span className="text-xs font-medium text-slate-500">12,500 unités</span>
                                    <button className="text-primary hover:text-blue-700 text-xs font-semibold flex items-center gap-1 bg-primary/5 hover:bg-primary/10 px-2 py-1.5 rounded-full transition-colors">
                                        <span className="material-icons-outlined text-sm">download</span>
                                        CSV
                                    </button>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all group cursor-pointer">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                                            NTAG215
                                        </span>
                                        <span className="text-xs text-slate-400 font-mono">#9919</span>
                                    </div>
                                    <span className="text-[10px] uppercase font-bold tracking-wide text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">Hier</span>
                                </div>
                                <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-2 truncate">Proto-Marketing-Run</h4>
                                <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-700/50">
                                    <span className="text-xs font-medium text-slate-500">500 unités</span>
                                    <button className="text-primary hover:text-blue-700 text-xs font-semibold flex items-center gap-1 bg-primary/5 hover:bg-primary/10 px-2 py-1.5 rounded-full transition-colors">
                                        <span className="material-icons-outlined text-sm">download</span>
                                        CSV
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
