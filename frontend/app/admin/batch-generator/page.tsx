'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { apiClient } from '@/lib/api-client';
import { AdminButton } from '@/components/ui/AdminButton';
import toast from 'react-hot-toast';

interface Batch {
    id: number;
    batchTag: string;
    count: number;
    warehouse: string;
    createdAt: string;
}

export default function BatchGeneratorPage() {
    const [batches, setBatches] = useState<Batch[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);

    // Form state
    const [quantity, setQuantity] = useState('50');
    const [batchTag, setBatchTag] = useState(`Prod-${new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }).replace(' ', '-')}`);
    const [warehouse, setWarehouse] = useState('paris');
    const [chipType, setChipType] = useState('NTAG213');

    const fetchBatches = async () => {
        setIsLoading(true);
        try {
            const response = await apiClient.get('/api/admin/batches');
            if (response.data.success) {
                setBatches(response.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch batches', error);
            toast.error('Impossible de charger l\'historique des lots');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchBatches();
    }, []);

    const handleGenerate = async () => {
        if (!quantity || !batchTag) {
            toast.error('Veuillez remplir tous les champs');
            return;
        }

        setIsGenerating(true);
        const loadingToast = toast.loading('Génération du lot en cours...');

        try {
            const response = await apiClient.post('/api/admin/batches', {
                quantity,
                batchTag,
                warehouse,
                sku: `NFC-${chipType}`
            });

            if (response.data.success) {
                toast.success('Lot généré avec succès !', { id: loadingToast });
                fetchBatches();
                // Reset form or update tag
                setBatchTag(`${batchTag}-v2`);
            }
        } catch (error: any) {
            console.error('Batch generation failed', error);
            toast.error(error.response?.data?.error?.message || 'Échec de la génération', { id: loadingToast });
        } finally {
            setIsGenerating(false);
        }
    };

    const handleExport = async (tag: string) => {
        const loadingToast = toast.loading(`Téléchargement du lot ${tag}...`);
        try {
            const response = await apiClient.get(`/api/admin/batches/${encodeURIComponent(tag)}/export`, {
                responseType: 'blob'
            });
            const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `batch-${tag}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            toast.success(`Fichier CSV du lot ${tag} téléchargé !`, { id: loadingToast });
        } catch (error: any) {
            console.error('Export batch failed', error);
            toast.error('Erreur lors du téléchargement du lot CSV', { id: loadingToast });
        }
    };

    const handleDeleteBatch = async (tag: string) => {
        if (!confirm(`Supprimer le lot "${tag}" et toutes ses cartes non associées ?`)) return;
        try {
            const res = await apiClient.delete(`/api/admin/batches/${encodeURIComponent(tag)}`);
            if (res.data.success) {
                toast.success(`Lot "${tag}" supprimé`);
                fetchBatches();
            }
        } catch (error) {
            toast.error('Erreur lors de la suppression du lot');
        }
    };

    return (
        <AdminLayout>
            <div className="flex flex-col gap-10 animate-in fade-in slide-in-from-bottom-4 duration-1000 pb-20">
                {/* Header */}
                <header className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <h2 className="text-4xl font-bold text-apple-textDark dark:text-white tracking-tight text-primary">Batch Generator</h2>
                        <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary/5 text-primary border border-primary/10">Production Mode</span>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Config Form */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white dark:bg-white/5 rounded-[32px] shadow-sm border border-white dark:border-white/10 overflow-hidden flex flex-col">
                            <div className="px-8 py-7 border-b border-gray-100 dark:border-white/5 flex justify-between items-center bg-white/50 dark:bg-transparent backdrop-blur-md">
                                <div>
                                    <h2 className="text-xl font-bold text-apple-textDark dark:text-white">New Production Batch</h2>
                                    <p className="text-sm text-apple-secondary mt-1 font-medium">Configure parameters for NFC tag generation & stock provisioning.</p>
                                </div>
                                <div className="h-12 w-12 rounded-2xl bg-slate-50 dark:bg-white/5 flex items-center justify-center text-primary">
                                    <span className="material-symbols-outlined text-2xl">add</span>
                                </div>
                            </div>

                            <div className="p-8 space-y-8 flex-1">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-3">
                                        <label className="block text-[11px] font-bold text-apple-secondary uppercase tracking-[0.2em] ml-1 opacity-60">
                                            Quantity
                                        </label>
                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-apple-secondary group-focus-within:text-primary transition-colors">
                                                <span className="material-symbols-outlined text-xl">format_list_numbered</span>
                                            </div>
                                            <input
                                                type="number"
                                                value={quantity}
                                                onChange={(e) => setQuantity(e.target.value)}
                                                className="block w-full pl-12 pr-16 py-4 rounded-2xl border-none bg-slate-50 dark:bg-white/5 focus:ring-2 focus:ring-primary/20 text-sm font-bold text-apple-textDark dark:text-white transition-all"
                                                placeholder="e.g. 5000"
                                            />
                                            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                                                <span className="text-apple-secondary text-[10px] font-bold uppercase tracking-widest opacity-40">units</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="block text-[11px] font-bold text-apple-secondary uppercase tracking-[0.2em] ml-1 opacity-60">
                                            Chip Technology
                                        </label>
                                        <div className="relative group">
                                            <select
                                                value={chipType}
                                                onChange={(e) => setChipType(e.target.value)}
                                                className="block w-full pl-5 pr-12 py-4 text-sm font-bold border-none bg-slate-50 dark:bg-white/5 focus:ring-2 focus:ring-primary/20 rounded-2xl appearance-none text-apple-textDark dark:text-white transition-all outline-none"
                                            >
                                                <option value="NTAG213">NTAG213 (Standard)</option>
                                                <option value="NTAG215">NTAG215 (Extended)</option>
                                                <option value="NTAG216">NTAG216 (High Capacity)</option>
                                                <option value="MIFARE">MIFARE Ultralight</option>
                                            </select>
                                            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-apple-secondary">
                                                <span className="material-symbols-outlined">unfold_more</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="block text-[11px] font-bold text-apple-secondary uppercase tracking-[0.2em] ml-1 opacity-60">
                                        Batch Reference
                                    </label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-apple-secondary group-focus-within:text-primary transition-colors">
                                            <span className="material-symbols-outlined text-xl">label</span>
                                        </div>
                                        <input
                                            type="text"
                                            value={batchTag}
                                            onChange={(e) => setBatchTag(e.target.value)}
                                            className="block w-full pl-12 py-4 rounded-2xl border-none bg-slate-50 dark:bg-white/5 focus:ring-2 focus:ring-primary/20 text-sm font-bold text-apple-textDark dark:text-white transition-all"
                                            placeholder="e.g. Prod-Octobre-2025-EU"
                                        />
                                    </div>
                                    <p className="text-[11px] text-apple-secondary ml-1 font-medium opacity-60 tracking-tight">Identifiant unique utilisé pour le suivi interne, la mise à jour automatique du stock et le fichier CSV d&apos;encodage.</p>
                                </div>

                                <div className="space-y-3">
                                    <label className="block text-[11px] font-bold text-apple-secondary uppercase tracking-[0.2em] ml-1 opacity-60">
                                        Warehouse Assignment
                                    </label>
                                    <div className="flex gap-4">
                                        {['paris', 'oujda'].map((w) => (
                                            <button
                                                key={w}
                                                type="button"
                                                onClick={() => setWarehouse(w)}
                                                className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl border transition-all text-xs font-bold uppercase tracking-widest cursor-pointer ${warehouse === w
                                                        ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20'
                                                        : 'bg-white dark:bg-white/5 border-slate-100 dark:border-white/10 text-apple-secondary hover:border-primary/40'
                                                    }`}
                                            >
                                                <span className="material-symbols-outlined text-lg">{w === 'paris' ? 'warehouse' : 'local_shipping'}</span>
                                                {w === 'paris' ? 'Paris Sud' : 'Oujda Port'}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="bg-slate-50/50 dark:bg-white/5 px-8 py-6 flex items-center justify-between border-t border-gray-100 dark:border-white/5">
                                <span className="text-[11px] font-bold text-apple-secondary uppercase tracking-[0.2em] opacity-40 italic">AUTO-SYNC INVENTAIRE ACTIF</span>
                                <AdminButton
                                    onClick={handleGenerate}
                                    disabled={isGenerating}
                                    className="px-10 py-4 rounded-full text-sm font-bold btn-titanium-primary text-white shadow-xl shadow-slate-900/10 hover:translate-y-[-2px] active:scale-[0.98] transition-all flex items-center gap-2"
                                >
                                    {isGenerating ? (
                                        <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <span className="material-symbols-outlined text-xl">bolt</span>
                                    )}
                                    Generate Batch
                                </AdminButton>
                            </div>
                        </div>

                        {/* Status Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="bg-white dark:bg-white/5 p-8 rounded-[32px] border border-white dark:border-white/10 shadow-sm flex items-center gap-6 transition-all hover:translate-y-[-2px]">
                                <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-3xl">dns</span>
                                </div>
                                <div>
                                    <p className="text-[11px] font-bold text-apple-secondary uppercase tracking-widest opacity-60 mb-1">Server Status</p>
                                    <p className="text-xl font-bold text-apple-textDark dark:text-white">Operational</p>
                                </div>
                            </div>
                            <div className="bg-white dark:bg-white/5 p-8 rounded-[32px] border border-white dark:border-white/10 shadow-sm flex items-center gap-6 transition-all hover:translate-y-[-2px]">
                                <div className="h-14 w-14 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-3xl">memory</span>
                                </div>
                                <div>
                                    <p className="text-[11px] font-bold text-apple-secondary uppercase tracking-widest opacity-60 mb-1">Total Lots Générés</p>
                                    <p className="text-xl font-bold text-apple-textDark dark:text-white">
                                        {batches.reduce((acc, b) => acc + b.count, 0).toLocaleString('fr-FR')} Cartes
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Guide d'utilisation des Batches NFC */}
                        <div className="bg-white dark:bg-white/5 p-8 rounded-[32px] border border-white dark:border-white/10 shadow-sm space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                                    <span className="material-symbols-outlined">contactless</span>
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-apple-textDark dark:text-white">Comment fonctionnent les Batches NFC ?</h3>
                                    <p className="text-xs text-apple-secondary">Flux complet de la production usine jusqu&apos;à l&apos;activation client</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
                                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-primary">1. Génération</span>
                                    <p className="text-xs text-apple-secondary mt-1">Crée des cartes physiques vierges (<code className="font-mono font-bold">in_stock</code>) avec un UID unique de 14 caractères et incrémente l&apos;inventaire.</p>
                                </div>
                                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-primary">2. Export CSV & Usine</span>
                                    <p className="text-xs text-apple-secondary mt-1">Téléchargez le CSV contenant les <code className="font-mono font-bold">UID</code> et <code className="font-mono font-bold">ActivationURL</code> pour programmer les puces NFC ou imprimer les QR codes.</p>
                                </div>
                                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-primary">3. Appairage Opérateur</span>
                                    <p className="text-xs text-apple-secondary mt-1">Sur <code className="font-mono font-bold">/operator</code>, l&apos;opérateur scanne l&apos;UID d&apos;une carte du lot pour l&apos;associer au profil d&apos;un employé avant expédition.</p>
                                </div>
                                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-primary">4. Scan & Activation</span>
                                    <p className="text-xs text-apple-secondary mt-1">Au scan de la carte (<code className="font-mono font-bold">/activate?uid=...</code>), si elle est vierge l&apos;acheteur l&apos;active ; si elle est déjà appairée elle ouvre son profil public.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar: History */}
                    <div className="lg:col-span-1 h-full">
                        <div className="bg-white dark:bg-white/5 rounded-[32px] shadow-sm border border-white dark:border-white/10 h-full flex flex-col overflow-hidden max-h-[850px]">
                            <div className="px-8 py-7 border-b border-gray-100 dark:border-white/10 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="material-symbols-outlined text-apple-secondary opacity-60">history</span>
                                    <h3 className="text-lg font-bold text-apple-textDark dark:text-white">Last Batches</h3>
                                </div>
                                <span className="text-xs font-bold text-apple-secondary">{batches.length} lots</span>
                            </div>

                            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                                {isLoading ? (
                                    <div className="flex flex-col items-center justify-center py-20 text-apple-secondary gap-4 opacity-40">
                                        <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                                        <span className="text-xs font-bold uppercase tracking-widest">Chargement...</span>
                                    </div>
                                ) : batches.length === 0 ? (
                                    <div className="text-center py-20 text-apple-secondary font-medium text-sm opacity-60">
                                        Aucun lot généré pour le moment.
                                    </div>
                                ) : (
                                    batches.map((batch) => (
                                        <div key={`${batch.batchTag}-${batch.warehouse}`} className="bg-slate-50/50 dark:bg-white/5 p-6 rounded-[24px] border border-white/40 dark:border-white/5 hover:bg-white dark:hover:bg-white/10 hover:shadow-xl transition-all group">
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="flex items-center gap-2">
                                                    <span className={`inline-flex items-center px-2 py-1 rounded-lg text-[9px] font-bold text-white shadow-sm transition-all ${batch.warehouse === 'paris' ? 'bg-indigo-500' : 'bg-orange-500'
                                                        }`}>
                                                        {batch.warehouse.toUpperCase()}
                                                    </span>
                                                    <span className="text-[10px] text-apple-secondary font-mono font-bold opacity-60">#{batch.id.toString().padStart(4, '0')}</span>
                                                </div>
                                                <span className="text-[9px] font-bold text-apple-secondary uppercase tracking-widest opacity-40">
                                                    {new Date(batch.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                                                </span>
                                            </div>
                                            <p className="text-sm font-bold text-apple-textDark dark:text-white mb-1 truncate tracking-tight">{batch.batchTag}</p>
                                            <div className="flex justify-between items-center mt-5">
                                                <span className="text-[10px] font-bold text-apple-secondary uppercase tracking-[0.1em] opacity-60">{batch.count.toLocaleString('fr-FR')} units</span>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleExport(batch.batchTag)}
                                                        title="Télécharger le fichier CSV d'encodage NFC"
                                                        className="px-3 py-2 bg-white dark:bg-white/20 rounded-xl text-primary shadow-sm hover:scale-105 active:scale-95 transition-all border border-black/5 dark:border-white/10 flex items-center gap-1.5 text-[11px] font-bold cursor-pointer"
                                                    >
                                                        <span className="material-symbols-outlined text-[16px]">download</span>
                                                        CSV
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteBatch(batch.batchTag)}
                                                        title="Supprimer ce lot"
                                                        className="p-2 bg-white dark:bg-white/10 rounded-xl text-apple-secondary hover:text-rose-500 shadow-sm hover:scale-105 active:scale-95 transition-all border border-black/5 dark:border-white/10 cursor-pointer"
                                                    >
                                                        <span className="material-symbols-outlined text-[16px]">delete</span>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}

