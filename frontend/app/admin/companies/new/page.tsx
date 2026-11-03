'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { apiClient } from '@/lib/api-client';
import { AdminButton } from '@/components/ui/AdminButton';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export default function NewCompanyOnboarding() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [isSearchingSiret, setIsSearchingSiret] = useState(false);
    
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        siretice: '',
        country: 'MA',
        address: '',
        postalCode: '',
        city: '',
        firstName: '',
        lastName: '',
        plans: '',
    });
    
    const [availablePlans, setAvailablePlans] = useState<any[]>([]);
    const [isLoadingPlans, setIsLoadingPlans] = useState(true);

    useEffect(() => {
        const fetchPlans = async () => {
            try {
                const response = await apiClient.get('/api/admin/plans');
                if (response.data.success) {
                    const plansData = response.data.data.plans || response.data.data;
                    setAvailablePlans(plansData.filter((p: any) => p.isActive));
                }
            } catch (error) {
                toast.error("Erreur lors du chargement des plans");
            } finally {
                setIsLoadingPlans(false);
            }
        };
        fetchPlans();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSiretSearch = async () => {
        if (!formData.siretice || formData.country !== 'FR') {
            toast.error("Recherche disponible uniquement pour la France avec un SIRET valide.");
            return;
        }
        
        setIsSearchingSiret(true);
        try {
            const res = await fetch(`https://recherche-entreprises.api.gouv.fr/search?q=${formData.siretice}`);
            if (res.ok) {
                const data = await res.json();
                if (data.results && data.results.length > 0) {
                    const company = data.results[0];
                    setFormData(prev => ({
                        ...prev,
                        name: company.nom_complet || prev.name,
                        address: company.siege?.adresse || prev.address,
                        postalCode: company.siege?.code_postal || prev.postalCode,
                        city: company.siege?.libelle_commune || prev.city,
                    }));
                    toast.success("Informations de l'entreprise récupérées !");
                } else {
                    toast.error("SIRET introuvable.");
                }
            } else {
                toast.error("Erreur avec l'API Data.gouv");
            }
        } catch (error) {
            toast.error("Erreur lors de la recherche du SIRET.");
        } finally {
            setIsSearchingSiret(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const response = await apiClient.post('/api/admin/companies', formData);
            if (response.data.success) {
                toast.success(response.data.data.message || "Entreprise configurée avec succès !");
                router.push('/admin/companies');
            }
        } catch (error: any) {
            console.error(error);
            const errorMessage = error.response?.data?.error?.message || "Erreur lors de la création de l'entreprise";
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AdminLayout>
            <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-4xl mx-auto">
                <nav className="flex items-center gap-2 text-[10px] font-bold text-apple-secondary uppercase tracking-[0.2em]">
                    <span className="opacity-40">Gestion Commerciale</span>
                    <span className="opacity-20">/</span>
                    <span className="text-apple-textDark dark:text-white">Nouvel Onboarding</span>
                </nav>

                <div className="flex flex-col gap-2">
                    <h2 className="text-4xl font-bold text-apple-textDark dark:text-white tracking-tight">Onboarding B2B</h2>
                    <p className="text-apple-secondary font-medium">Configurez un nouvel espace entreprise et assignez un plan d'abonnement.</p>
                </div>

                <form onSubmit={handleSubmit} className="klik-glass rounded-[40px] p-10 border border-white/40 dark:border-white/5 space-y-12">
                    
                    {/* PARTIE 1: ENTREPRISE */}
                    <div className="space-y-6">
                        <h3 className="text-lg font-bold text-apple-textDark dark:text-white tracking-tight border-b border-gray-100 dark:border-white/10 pb-4">
                            1. Informations de l'Entreprise
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-apple-secondary uppercase tracking-[0.2em] ml-2">Pays d'opération</label>
                                <select
                                    name="country"
                                    value={formData.country}
                                    onChange={handleChange}
                                    className="w-full bg-white/50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-2xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/50"
                                >
                                    <option value="MA">Maroc (MAD)</option>
                                    <option value="FR">France (EUR)</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-apple-secondary uppercase tracking-[0.2em] ml-2">SIRET / ICE</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        name="siretice"
                                        value={formData.siretice}
                                        onChange={handleChange}
                                        placeholder="N° d'identification légale"
                                        className="w-full bg-white/50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-2xl px-4 py-3 pr-12 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    />
                                    {formData.country === 'FR' && (
                                        <button 
                                            type="button"
                                            onClick={handleSiretSearch}
                                            disabled={isSearchingSiret}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-primary text-white hover:bg-primary/90 transition-colors"
                                            title="Rechercher sur Data.gouv"
                                        >
                                            {isSearchingSiret ? (
                                                <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin block" />
                                            ) : (
                                                <span className="material-symbols-outlined text-[16px] block">search</span>
                                            )}
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-apple-secondary uppercase tracking-[0.2em] ml-2">Nom de l'entreprise</label>
                                <input
                                    type="text"
                                    name="name"
                                    required
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="Ex: Tesla France"
                                    className="w-full bg-white/50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-2xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/50"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-apple-secondary uppercase tracking-[0.2em] ml-2">Adresse (Siège)</label>
                                <input
                                    type="text"
                                    name="address"
                                    value={formData.address}
                                    onChange={handleChange}
                                    placeholder="123 rue de la Paix"
                                    className="w-full bg-white/50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-2xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/50"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-apple-secondary uppercase tracking-[0.2em] ml-2">Code Postal</label>
                                <input
                                    type="text"
                                    name="postalCode"
                                    value={formData.postalCode}
                                    onChange={handleChange}
                                    placeholder="75000"
                                    className="w-full bg-white/50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-2xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/50"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-apple-secondary uppercase tracking-[0.2em] ml-2">Ville</label>
                                <input
                                    type="text"
                                    name="city"
                                    value={formData.city}
                                    onChange={handleChange}
                                    placeholder="Paris"
                                    className="w-full bg-white/50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-2xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/50"
                                />
                            </div>
                        </div>
                    </div>

                    {/* PARTIE 2: MANAGER */}
                    <div className="space-y-6">
                        <h3 className="text-lg font-bold text-apple-textDark dark:text-white tracking-tight border-b border-gray-100 dark:border-white/10 pb-4">
                            2. Informations du Manager
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-apple-secondary uppercase tracking-[0.2em] ml-2">Prénom</label>
                                <input
                                    type="text"
                                    name="firstName"
                                    required
                                    value={formData.firstName}
                                    onChange={handleChange}
                                    placeholder="Jean"
                                    className="w-full bg-white/50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-2xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/50"
                                />
                            </div>
                            
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-apple-secondary uppercase tracking-[0.2em] ml-2">Nom</label>
                                <input
                                    type="text"
                                    name="lastName"
                                    required
                                    value={formData.lastName}
                                    onChange={handleChange}
                                    placeholder="Dupont"
                                    className="w-full bg-white/50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-2xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/50"
                                />
                            </div>

                            <div className="space-y-2 md:col-span-2">
                                <label className="text-[10px] font-bold text-apple-secondary uppercase tracking-[0.2em] ml-2">Email Administrateur</label>
                                <input
                                    type="email"
                                    name="email"
                                    required
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="admin@entreprise.com"
                                    className="w-full bg-white/50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-2xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/50"
                                />
                            </div>
                        </div>
                    </div>

                    {/* PARTIE 3: PLAN */}
                    <div className="space-y-6">
                        <h3 className="text-lg font-bold text-apple-textDark dark:text-white tracking-tight border-b border-gray-100 dark:border-white/10 pb-4">
                            3. Configuration du Plan
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {isLoadingPlans ? (
                                <div className="col-span-3 py-4 text-center text-apple-secondary text-sm">Chargement des plans...</div>
                            ) : availablePlans.length === 0 ? (
                                <div className="col-span-3 py-4 text-center text-apple-secondary text-sm">Aucun plan disponible</div>
                            ) : availablePlans.map((plan) => (
                                <label
                                    key={plan.id}
                                    className={`relative flex flex-col p-6 rounded-3xl border-2 cursor-pointer transition-all ${formData.plans === plan.id
                                        ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10'
                                        : 'border-gray-200 dark:border-white/10 hover:border-primary/50 bg-white/30 dark:bg-white/5'
                                        }`}
                                >
                                    <input
                                        type="radio"
                                        name="plans"
                                        value={plan.id}
                                        checked={formData.plans === plan.id}
                                        onChange={handleChange}
                                        className="sr-only"
                                    />
                                    <span className="text-xs font-bold text-apple-secondary uppercase tracking-widest mb-1">{plan.name}</span>
                                    <span className="text-2xl font-bold text-apple-textDark dark:text-white tracking-tight">
                                        {formData.country === 'MA' ? `${plan.priceMad} MAD` : `${plan.priceEur} €`}
                                        <span className="text-sm font-medium opacity-50">/{plan.billingPeriod === 'yearly' ? 'an' : plan.billingPeriod === 'monthly' ? 'mois' : 'vie'}</span>
                                    </span>
                                    <span className="text-[10px] font-medium text-apple-secondary mt-4 bg-black/5 dark:bg-white/10 self-start px-2 py-1 rounded-md">{plan.maxLicenses} Cartes max</span>

                                    {formData.plans === plan.id && (
                                        <div className="absolute top-4 right-4 text-primary">
                                            <span className="material-symbols-outlined">check_circle</span>
                                        </div>
                                    )}
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="pt-8 flex justify-end gap-4">
                        <AdminButton type="button" variant="secondary" onClick={() => router.back()} disabled={isLoading}>
                            Annuler
                        </AdminButton>
                        <AdminButton type="submit" variant="primary" className="flex items-center gap-2" disabled={isLoading}>
                            {isLoading ? (
                                <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                            ) : (
                                <span className="material-symbols-outlined text-[20px]">rocket_launch</span>
                            )}
                            Générer l'Espace Company
                        </AdminButton>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
}
