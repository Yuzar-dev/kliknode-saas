'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/admin/AdminLayout';
import { AdminButton } from '@/components/ui/AdminButton';

export default function CompanyOnboardingPage() {
    const router = useRouter();
    const [currency, setCurrency] = useState('eur');
    const [plan, setPlan] = useState('pro');
    const [paymentMethod, setPaymentMethod] = useState('stripe');

    // Price configuration by plan (in EUR)
    const planPrices = {
        starter: 29,
        pro: 79,
        scale: 299
    };

    // Convert EUR to MAD (approximate rate: 1 EUR = 11 MAD)
    const getPrice = (eurPrice: number) => {
        if (currency === 'mad') {
            return Math.round(eurPrice * 11);
        }
        return eurPrice;
    };

    // Get currency symbol
    const getCurrencySymbol = () => {
        return currency === 'eur' ? '€' : 'Dh';
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // TODO: Handle form submission
        console.log('Form submitted');
    };

    return (
        <AdminLayout>
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-t-xl px-8 py-6 flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Nouvelle Entreprise</h1>
                        <p className="text-sm text-slate-500 mt-1">Configurez les détails du client et les conditions commerciales pour la plateforme Kliknode.</p>
                    </div>
                    <button
                        onClick={() => router.push('/admin/companies')}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                    >
                        <span className="material-icons-outlined">close</span>
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 border-l border-r border-b border-slate-200 dark:border-slate-700 rounded-b-xl overflow-hidden">
                    <div className="flex flex-col lg:flex-row">
                        {/* Left Column - Client Identity */}
                        <div className="w-full lg:w-5/12 p-8 border-b lg:border-b-0 lg:border-r border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30">
                            <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-xs">1</span>
                                Identité du Client
                            </h2>

                            <div className="space-y-6">
                                {/* Company Name */}
                                <div>
                                    <label htmlFor="company_name" className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
                                        Nom de l'Entreprise
                                    </label>
                                    <div className="relative">
                                        <span className="material-icons-outlined absolute left-3 top-2.5 text-slate-400 text-lg">business</span>
                                        <input
                                            type="text"
                                            id="company_name"
                                            name="company_name"
                                            placeholder="ex. Tesla Inc."
                                            className="w-full pl-10 pr-6 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-0 focus:border-blue-500 focus:shadow-[0_0_10px_rgba(59,130,246,0.5)] transition-all shadow-sm"
                                        />
                                    </div>
                                </div>

                                {/* Admin Email */}
                                <div>
                                    <label htmlFor="admin_email" className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
                                        Email Administrateur
                                    </label>
                                    <div className="relative">
                                        <span className="material-icons-outlined absolute left-3 top-2.5 text-slate-400 text-lg">email</span>
                                        <input
                                            type="email"
                                            id="admin_email"
                                            name="admin_email"
                                            placeholder="admin@entreprise.com"
                                            className="w-full pl-10 pr-6 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-0 focus:border-blue-500 focus:shadow-[0_0_10px_rgba(59,130,246,0.5)] transition-all shadow-sm"
                                        />
                                    </div>
                                </div>

                                {/* Company Domain */}
                                <div>
                                    <label htmlFor="domain" className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
                                        Domaine de l'Entreprise
                                    </label>
                                    <div className="flex items-center w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full focus-within:ring-0 focus-within:border-blue-500 focus-within:shadow-[0_0_10px_rgba(59,130,246,0.5)] transition-all shadow-sm">
                                        <span className="text-slate-500 dark:text-slate-400 text-sm mr-1">
                                            https://
                                        </span>
                                        <input
                                            type="text"
                                            id="domain"
                                            name="domain"
                                            placeholder="entreprise.com"
                                            className="flex-1 bg-transparent border-none p-0 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-0 sm:text-sm"
                                        />
                                    </div>
                                </div>

                                {/* Billing Currency */}
                                <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                                    <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-3">
                                        Devise de Facturation
                                    </label>
                                    <div className="flex items-center gap-4">
                                        <div className="relative flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg w-full max-w-[200px]">
                                            <label className="flex-1 text-center cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="currency"
                                                    value="eur"
                                                    checked={currency === 'eur'}
                                                    onChange={(e) => setCurrency(e.target.value)}
                                                    className="peer sr-only"
                                                />
                                                <span className="block py-1.5 px-3 text-sm font-medium rounded-md text-slate-500 peer-checked:bg-white peer-checked:dark:bg-slate-700 peer-checked:text-primary peer-checked:shadow-sm transition-all">
                                                    EUR (€)
                                                </span>
                                            </label>
                                            <label className="flex-1 text-center cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="currency"
                                                    value="mad"
                                                    checked={currency === 'mad'}
                                                    onChange={(e) => setCurrency(e.target.value)}
                                                    className="peer sr-only"
                                                />
                                                <span className="block py-1.5 px-3 text-sm font-medium rounded-md text-slate-500 peer-checked:bg-white peer-checked:dark:bg-slate-700 peer-checked:text-primary peer-checked:shadow-sm transition-all">
                                                    MAD (Dh)
                                                </span>
                                            </label>
                                        </div>
                                        <span className="text-xs text-slate-400 italic">Détermine les prix régionaux</span>
                                    </div>
                                </div>

                                {/* Region Info */}
                                <div className="mt-8 rounded-lg overflow-hidden h-32 relative group">
                                    <div className="w-full h-full bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30"></div>
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent flex items-end p-4">
                                        <p className="text-white text-xs font-medium">
                                            <span className="material-icons-outlined text-sm align-bottom mr-1">public</span>
                                            Opère dans la région EMEA
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column - Plan & Billing */}
                        <div className="w-full lg:w-7/12 p-8 bg-white dark:bg-slate-800 flex flex-col justify-between">
                            <div>
                                <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-xs">2</span>
                                    Plan & Facturation
                                </h2>

                                {/* Subscription Plans */}
                                <div className="mb-8">
                                    <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-3">
                                        Sélectionner un Plan d'Abonnement
                                    </label>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {/* Starter Plan */}
                                        <label className="cursor-pointer relative group">
                                            <input
                                                type="radio"
                                                name="plan"
                                                value="starter"
                                                checked={plan === 'starter'}
                                                onChange={(e) => setPlan(e.target.value)}
                                                className="peer sr-only"
                                            />
                                            <div className="h-full p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-blue-300 peer-checked:border-primary peer-checked:shadow-lg peer-checked:shadow-blue-500/20 transition-all">
                                                <div className="flex justify-between items-start mb-2">
                                                    <h3 className="font-bold text-slate-900 dark:text-white">Starter</h3>
                                                    <span className="material-icons-outlined text-primary opacity-0 peer-checked:opacity-100 text-lg transition-opacity">
                                                        check_circle
                                                    </span>
                                                </div>
                                                <div className="mb-3">
                                                    <span className="text-2xl font-bold text-slate-900 dark:text-white">
                                                        {getPrice(planPrices.starter)}{getCurrencySymbol()}
                                                    </span>
                                                    <span className="text-slate-500 text-sm">/mois</span>
                                                </div>
                                                <p className="text-xs text-slate-500 leading-relaxed">
                                                    Fonctionnalités de base pour les petites équipes jusqu'à 5 utilisateurs.
                                                </p>
                                            </div>
                                        </label>

                                        {/* Pro Plan */}
                                        <label className="cursor-pointer relative group">
                                            <input
                                                type="radio"
                                                name="plan"
                                                value="pro"
                                                checked={plan === 'pro'}
                                                onChange={(e) => setPlan(e.target.value)}
                                                className="peer sr-only"
                                            />
                                            <div className="h-full p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-blue-300 peer-checked:border-primary peer-checked:shadow-lg peer-checked:shadow-blue-500/20 transition-all relative overflow-hidden">
                                                <div className="absolute top-0 right-0 bg-primary text-white text-[10px] px-2 py-0.5 rounded-bl-lg font-medium">
                                                    POPULAIRE
                                                </div>
                                                <div className="flex justify-between items-start mb-2">
                                                    <h3 className="font-bold text-slate-900 dark:text-white">Pro</h3>
                                                    <span className="material-icons-outlined text-primary opacity-0 peer-checked:opacity-100 text-lg transition-opacity">
                                                        check_circle
                                                    </span>
                                                </div>
                                                <div className="mb-3">
                                                    <span className="text-2xl font-bold text-slate-900 dark:text-white">
                                                        {getPrice(planPrices.pro)}{getCurrencySymbol()}
                                                    </span>
                                                    <span className="text-slate-500 text-sm">/mois</span>
                                                </div>
                                                <p className="text-xs text-slate-500 leading-relaxed">
                                                    Analyses avancées & intégrations pour entreprises en croissance.
                                                </p>
                                            </div>
                                        </label>

                                        {/* Scale Plan */}
                                        <label className="cursor-pointer relative group">
                                            <input
                                                type="radio"
                                                name="plan"
                                                value="scale"
                                                checked={plan === 'scale'}
                                                onChange={(e) => setPlan(e.target.value)}
                                                className="peer sr-only"
                                            />
                                            <div className="h-full p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-blue-300 peer-checked:border-primary peer-checked:shadow-lg peer-checked:shadow-blue-500/20 transition-all">
                                                <div className="flex justify-between items-start mb-2">
                                                    <h3 className="font-bold text-slate-900 dark:text-white">Scale</h3>
                                                    <span className="material-icons-outlined text-primary opacity-0 peer-checked:opacity-100 text-lg transition-opacity">
                                                        check_circle
                                                    </span>
                                                </div>
                                                <div className="mb-3">
                                                    <span className="text-2xl font-bold text-slate-900 dark:text-white">
                                                        {getPrice(planPrices.scale)}{getCurrencySymbol()}
                                                    </span>
                                                    <span className="text-slate-500 text-sm">/mois</span>
                                                </div>
                                                <p className="text-xs text-slate-500 leading-relaxed">
                                                    Utilisateurs illimités, support prioritaire & SLA personnalisé.
                                                </p>
                                            </div>
                                        </label>
                                    </div>
                                </div>

                                {/* Payment Method */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-3">
                                        Méthode de Paiement
                                    </label>
                                    <div className="space-y-3">
                                        {/* Credit Card */}
                                        <label className="relative block cursor-pointer group">
                                            <input
                                                type="radio"
                                                name="payment"
                                                value="stripe"
                                                checked={paymentMethod === 'stripe'}
                                                onChange={(e) => setPaymentMethod(e.target.value)}
                                                className="peer sr-only"
                                            />
                                            <div className="flex items-center p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 group-hover:bg-slate-50 dark:group-hover:bg-slate-700/50 peer-checked:border-primary peer-checked:bg-blue-50/50 dark:peer-checked:bg-blue-900/10 transition-colors">
                                                <div className="w-5 h-5 rounded-full border-2 border-slate-300 peer-checked:border-primary peer-checked:bg-primary mr-4 flex items-center justify-center transition-colors relative">
                                                    <div className="w-2 h-2 rounded-full bg-white opacity-0 peer-checked:opacity-100"></div>
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-semibold text-slate-900 dark:text-white">Carte Bancaire (Paiement Auto)</span>
                                                        <span className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 text-[10px] px-1.5 py-0.5 rounded font-medium">
                                                            INSTANTANÉ
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-slate-500 mt-0.5">Paiement sécurisé via Stripe.</p>
                                                </div>
                                                <span className="material-icons-outlined text-slate-400">credit_card</span>
                                            </div>
                                        </label>

                                        {/* Wire Transfer */}
                                        <label className="relative block cursor-pointer group">
                                            <input
                                                type="radio"
                                                name="payment"
                                                value="wire"
                                                checked={paymentMethod === 'wire'}
                                                onChange={(e) => setPaymentMethod(e.target.value)}
                                                className="peer sr-only"
                                            />
                                            <div className="flex items-center p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 group-hover:bg-slate-50 dark:group-hover:bg-slate-700/50 peer-checked:border-primary peer-checked:bg-blue-50/50 dark:peer-checked:bg-blue-900/10 transition-colors">
                                                <div className="w-5 h-5 rounded-full border-2 border-slate-300 peer-checked:border-primary peer-checked:bg-primary mr-4 flex items-center justify-center transition-colors relative">
                                                    <div className="w-2 h-2 rounded-full bg-white opacity-0 peer-checked:opacity-100"></div>
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-semibold text-slate-900 dark:text-white">Virement Bancaire Manuel</span>
                                                    </div>
                                                    <p className="text-xs text-slate-500 mt-0.5">Délai 30 jours. Facture envoyée par email.</p>
                                                </div>
                                                <span className="material-icons-outlined text-slate-400">account_balance</span>
                                            </div>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="mt-10 pt-6 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-4">
                                <button
                                    type="button"
                                    onClick={() => router.push('/admin/companies')}
                                    className="px-6 py-2.5 rounded-full border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                                >
                                    Annuler
                                </button>
                                <AdminButton
                                    type="submit"
                                    variant="primary"
                                >
                                    <span>Finaliser l'Inscription</span>
                                    <span className="material-icons-outlined text-sm ml-2">arrow_forward</span>
                                </AdminButton>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
}
