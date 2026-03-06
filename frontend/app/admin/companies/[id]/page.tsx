'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import AdminLayout from '@/components/admin/AdminLayout';
import Link from 'next/link';
import { AdminButton } from '@/components/ui/AdminButton';

type TabType = 'info' | 'licenses' | 'billing';

export default function CompanyDetailPage() {
    const router = useRouter();
    const params = useParams();
    const [activeTab, setActiveTab] = useState<TabType>('info');

    // Mock data - à remplacer par un vrai fetch
    const company = {
        id: params?.id as string,
        name: 'Tesla Inc.',
        legalName: 'Tesla France S.A.S',
        logo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDfKuOaH0D7jteFREnmBfeo4fM1JCvsZXMZIOFA23OHNK1Tv-TJ0I9xVve33O8wV391cCv2n7B6xxE_pJ0bCpraxPXBX9Iy57ZBh90hDYPzMnDL4vG2wDJdlRr1hmahs9G2DOH2ZAlHgEfIOQEBnbUW1vXipqyULBfj93rWI74YI_8cON8NXj5M_9UUf966UfiNuKB4X-hntvEuA0n4v4JXRPngPFWEGtKiEEYyDEMtKKuFwV-_e_S_5fFyI1u9hG1XWgodkT8pXjE',
        plan: 'Enterprise',
        status: 'active',
        country: 'France',
        city: 'Paris',
        website: 'tesla.com',
        memberSince: 'Jan 2021',
        siret: '893 232 112 00021',
        vat: 'FR 32 893232112',
        industry: 'Automotive & Energy',
        address: '3-5 Rue Saint-Georges\n75009 Paris\nFrance',
        phone: '+33 1 89 23 99 00',
        monthlyRevenue: '€24,500',
        activeLicenses: 142,
        totalLicenses: 200,
        supportTickets: 2,
        nextRenewal: 'Jan 01',
    };

    return (
        <AdminLayout>
            <div className="max-w-7xl mx-auto">
                {/* Breadcrumb */}
                <div className="flex items-center text-sm text-slate-500 mb-6">
                    <Link href="/admin/companies" className="hover:text-slate-700">Gestion Commerciale</Link>
                    <span className="material-symbols-outlined text-[16px] mx-2" translate="no">chevron_right</span>
                    <span className="font-medium text-slate-900 dark:text-white">Fiche Détail Entreprise</span>
                </div>

                {/* Header */}
                <header className="mb-8">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                        <div className="flex items-center gap-6">
                            {/* Logo */}
                            <div className="h-20 w-20 rounded-xl bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 flex items-center justify-center p-2 relative">
                                <img
                                    alt={`Logo ${company.name}`}
                                    className="h-12 w-12 object-contain"
                                    src={company.logo}
                                    onError={(e) => {
                                        e.currentTarget.src = `https://ui-avatars.com/api/?name=${company.name}&background=random`;
                                    }}
                                />
                                <div
                                    className="absolute -bottom-2 -right-2 h-6 w-6 rounded-full bg-green-500 border-2 border-white dark:border-slate-800 flex items-center justify-center"
                                    title="Statut Actif"
                                >
                                    <span className="material-symbols-outlined text-white text-[14px]" translate="no">check</span>
                                </div>
                            </div>

                            {/* Company Info */}
                            <div>
                                <div className="flex items-center gap-3">
                                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{company.name}</h1>
                                    <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold border border-primary/20">
                                        Plan {company.plan}
                                    </span>
                                </div>
                                <div className="flex items-center gap-4 mt-2 text-slate-500 dark:text-slate-400 text-sm">
                                    <span className="flex items-center gap-1">
                                        <span className="material-symbols-outlined text-[18px]" translate="no">location_on</span>
                                        {company.city}, {company.country}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <span className="material-symbols-outlined text-[18px]" translate="no">globe</span>
                                        {company.website}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <span className="material-symbols-outlined text-[18px]" translate="no">calendar_month</span>
                                        Client depuis {company.memberSince}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap items-center gap-3">
                            <AdminButton variant="secondary" className="gap-2">
                                <span className="material-symbols-outlined text-[20px]" translate="no">tune</span>
                                Modifier Quota
                            </AdminButton>
                            <AdminButton variant="secondary" className="gap-2">
                                <span className="material-symbols-outlined text-[20px] text-pink-500" translate="no">redeem</span>
                                Offrir 1 Mois
                            </AdminButton>
                            <AdminButton variant="primary" className="gap-2">
                                <span className="material-symbols-outlined text-[20px]" translate="no">payments</span>
                                Forcer Paiement
                            </AdminButton>
                        </div>
                    </div>
                </header>

                {/* Tabs */}
                <div className="border-b border-slate-200 dark:border-slate-700 mb-8">
                    <nav aria-label="Tabs" className="-mb-px flex space-x-8">
                        <button
                            onClick={() => setActiveTab('info')}
                            className={`border-b-2 py-4 px-1 text-sm font-medium transition-colors ${activeTab === 'info'
                                ? 'border-primary text-primary'
                                : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
                                }`}
                        >
                            Informations Entreprise
                        </button>
                        <button
                            onClick={() => setActiveTab('licenses')}
                            className={`border-b-2 py-4 px-1 text-sm font-medium transition-colors ${activeTab === 'licenses'
                                ? 'border-primary text-primary'
                                : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
                                }`}
                        >
                            Licences{' '}
                            <span className="ml-2 py-0.5 px-2 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-600 dark:text-slate-400">
                                {company.activeLicenses}
                            </span>
                        </button>
                        <button
                            onClick={() => setActiveTab('billing')}
                            className={`border-b-2 py-4 px-1 text-sm font-medium transition-colors ${activeTab === 'billing'
                                ? 'border-primary text-primary'
                                : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
                                }`}
                        >
                            Facturation & Factures
                        </button>
                    </nav>
                </div>

                {/* Tab Content - Info */}
                {activeTab === 'info' && (
                    <div className="animate-fade-in">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Legal Entity */}
                            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Entité Légale</h3>
                                    <span className="material-symbols-outlined text-slate-400" translate="no">gavel</span>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Raison Sociale</p>
                                        <p className="text-sm text-slate-700 dark:text-slate-200 font-medium">{company.legalName}</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">SIRET</p>
                                            <p className="text-sm text-slate-700 dark:text-slate-200 font-mono">{company.siret}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">TVA</p>
                                            <p className="text-sm text-slate-700 dark:text-slate-200 font-mono">{company.vat}</p>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Secteur</p>
                                        <p className="text-sm text-slate-700 dark:text-slate-200">{company.industry}</p>
                                    </div>
                                    <div className="pt-4 mt-2 border-t border-slate-100 dark:border-slate-700">
                                        <a
                                            className="text-primary hover:text-primary-700 text-sm font-medium flex items-center gap-1"
                                            href="#"
                                        >
                                            Voir Documents Légaux{' '}
                                            <span className="material-symbols-outlined text-[16px]" translate="no">arrow_outward</span>
                                        </a>
                                    </div>
                                </div>
                            </div>

                            {/* Key Contacts */}
                            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Contacts Clés</h3>
                                    <span className="material-symbols-outlined text-slate-400" translate="no">group</span>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-start gap-3">
                                        <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-sm">
                                            JD
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-bold text-slate-900 dark:text-white">Jean Dupont</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">VP Opérations (Admin)</p>
                                            <a className="text-primary text-xs hover:underline" href="mailto:jean@tesla.com">
                                                jean@tesla.com
                                            </a>
                                        </div>
                                        <button className="text-slate-400 hover:text-slate-600">
                                            <span className="material-symbols-outlined text-[20px]" translate="no">more_vert</span>
                                        </button>
                                    </div>
                                    <hr className="border-slate-100 dark:border-slate-700" />
                                    <div className="flex items-start gap-3">
                                        <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400 font-bold text-sm">
                                            SB
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-bold text-slate-900 dark:text-white">Sarah Bennani</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Responsable Facturation</p>
                                            <a className="text-primary text-xs hover:underline" href="mailto:sarah.b@tesla.com">
                                                sarah.b@tesla.com
                                            </a>
                                        </div>
                                        <button className="text-slate-400 hover:text-slate-600">
                                            <span className="material-symbols-outlined text-[20px]" translate="no">more_vert</span>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Headquarters */}
                            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 flex flex-col h-full">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Siège Social</h3>
                                    <span className="material-symbols-outlined text-slate-400" translate="no">map</span>
                                </div>
                                <div className="relative w-full h-32 bg-slate-100 dark:bg-slate-700 rounded-lg overflow-hidden mb-4 group">
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                        <span className="material-symbols-outlined text-primary text-4xl drop-shadow-lg" translate="no">
                                            location_on
                                        </span>
                                    </div>
                                </div>
                                <div className="mt-auto">
                                    <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-line">
                                        {company.address}
                                    </p>
                                    <p className="text-xs text-slate-400 mt-2">{company.phone}</p>
                                </div>
                            </div>
                        </div>

                        {/* Stats Cards */}
                        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                                <p className="text-xs font-medium text-slate-500 uppercase">Revenu Mensuel</p>
                                <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">{company.monthlyRevenue}</p>
                            </div>
                            <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                                <p className="text-xs font-medium text-slate-500 uppercase">Licences Actives</p>
                                <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                                    {company.activeLicenses}
                                    <span className="text-sm text-slate-400 font-normal ml-1">/ {company.totalLicenses}</span>
                                </p>
                            </div>
                            <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                                <p className="text-xs font-medium text-slate-500 uppercase">Tickets Support</p>
                                <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                                    {company.supportTickets}{' '}
                                    <span className="text-xs font-medium text-green-500 bg-green-100 dark:bg-green-900/30 px-1.5 py-0.5 rounded ml-2">
                                        Faible
                                    </span>
                                </p>
                            </div>
                            <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                                <p className="text-xs font-medium text-slate-500 uppercase">Prochain Renouvellement</p>
                                <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">{company.nextRenewal}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Tab Content - Licenses */}
                {activeTab === 'licenses' && (
                    <div className="animate-fade-in">
                        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4">
                                <div className="relative w-full sm:w-96">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <span className="material-symbols-outlined text-slate-400 text-[20px]" translate="no">search</span>
                                    </div>
                                    <input
                                        className="block w-full pl-10 pr-6 py-2 border border-slate-300 dark:border-slate-600 rounded-full leading-5 bg-white dark:bg-slate-900 placeholder-slate-500 focus:outline-none focus:ring-0 focus:border-blue-500 focus:shadow-[0_0_10px_rgba(59,130,246,0.5)] sm:text-sm transition-shadow duration-150 ease-in-out"
                                        placeholder="Rechercher par nom ou email..."
                                        type="text"
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <AdminButton variant="secondary" className="gap-2">
                                        <span className="material-symbols-outlined text-[18px]" translate="no">filter_list</span>
                                        Filtrer
                                    </AdminButton>
                                    <AdminButton variant="primary" className="gap-2">
                                        <span className="material-symbols-outlined text-[18px]" translate="no">add</span>
                                        Ajouter Utilisateur
                                    </AdminButton>
                                </div>
                            </div>

                            {/* Users Table - Mock data */}
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                                    <thead className="bg-slate-50 dark:bg-slate-900">
                                        <tr>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                                Utilisateur
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                                Rôle
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                                Dernière Connexion
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                                Statut
                                            </th>
                                            <th scope="col" className="relative px-6 py-3">
                                                <span className="sr-only">Actions</span>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                                        <tr className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="h-10 w-10 flex-shrink-0 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-sm">
                                                        TM
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-slate-900 dark:text-white">Thomas Martin</div>
                                                        <div className="text-sm text-slate-500">thomas.martin@tesla.com</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-slate-900 dark:text-white">Ingénieur</div>
                                                <div className="text-xs text-slate-500">Équipe Autopilot</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-slate-500">Il y a 2 min</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                                                    Actif
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <a className="text-primary hover:text-primary-700" href="#">
                                                    Modifier
                                                </a>
                                            </td>
                                        </tr>
                                        <tr className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="h-10 w-10 flex-shrink-0 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400 font-bold text-sm">
                                                        EL
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-slate-900 dark:text-white">Elise Lambert</div>
                                                        <div className="text-sm text-slate-500">elise.l@tesla.com</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-slate-900 dark:text-white">Chef de Produit</div>
                                                <div className="text-xs text-slate-500">Division Énergie</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-slate-500">Hier</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                                                    Actif
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <a className="text-primary hover:text-primary-700" href="#">
                                                    Modifier
                                                </a>
                                            </td>
                                        </tr>
                                        <tr className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="h-10 w-10 flex-shrink-0 rounded-full bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center text-cyan-600 dark:text-cyan-400 font-bold text-sm">
                                                        KB
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-slate-900 dark:text-white">Karim Benali</div>
                                                        <div className="text-sm text-slate-500">karim.benali@tesla.com</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-slate-900 dark:text-white">Directeur Commercial</div>
                                                <div className="text-xs text-slate-500">EMEA</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-slate-500">Il y a 5 jours</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300">
                                                    Invité
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <a className="text-primary hover:text-primary-700" href="#">
                                                    Renvoyer
                                                </a>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            <div className="bg-white dark:bg-slate-800 px-4 py-3 flex items-center justify-between border-t border-slate-200 dark:border-slate-700 sm:px-6">
                                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                    <div>
                                        <p className="text-sm text-slate-700 dark:text-slate-300">
                                            Affichage de <span className="font-medium">1</span> à <span className="font-medium">10</span> sur{' '}
                                            <span className="font-medium">142</span> résultats
                                        </p>
                                    </div>
                                    <div>
                                        <nav aria-label="Pagination" className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                                            <a
                                                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm font-medium text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700"
                                                href="#"
                                            >
                                                <span className="material-symbols-outlined text-[20px]" translate="no">chevron_left</span>
                                            </a>
                                            <a
                                                aria-current="page"
                                                className="z-10 bg-primary/10 border-primary text-primary relative inline-flex items-center px-4 py-2 border text-sm font-medium"
                                                href="#"
                                            >
                                                1
                                            </a>
                                            <a
                                                className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 relative inline-flex items-center px-4 py-2 border text-sm font-medium"
                                                href="#"
                                            >
                                                2
                                            </a>
                                            <a
                                                className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 relative inline-flex items-center px-4 py-2 border text-sm font-medium"
                                                href="#"
                                            >
                                                3
                                            </a>
                                            <a
                                                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm font-medium text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700"
                                                href="#"
                                            >
                                                <span className="material-symbols-outlined text-[20px]" translate="no">chevron_right</span>
                                            </a>
                                        </nav>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Tab Content - Billing */}
                {activeTab === 'billing' && (
                    <div className="animate-fade-in">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Left Column */}
                            <div className="lg:col-span-1 space-y-6">
                                {/* Payment Method */}
                                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Moyen de Paiement</h3>
                                    <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-5 text-white shadow-lg relative overflow-hidden mb-4">
                                        <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 rounded-full bg-white/10 blur-xl"></div>
                                        <div className="flex justify-between items-start mb-8">
                                            <span className="material-symbols-outlined text-3xl" translate="no">contactless</span>
                                            <span className="font-mono text-lg italic font-bold tracking-widest">VISA</span>
                                        </div>
                                        <div className="mb-4">
                                            <p className="text-xs text-slate-300 uppercase tracking-wider mb-1">Numéro de Carte</p>
                                            <p className="font-mono text-xl tracking-widest">•••• •••• •••• 4242</p>
                                        </div>
                                        <div className="flex justify-between items-end">
                                            <div>
                                                <p className="text-xs text-slate-300 uppercase tracking-wider mb-1">Expire</p>
                                                <p className="font-mono">09/25</p>
                                            </div>
                                            <span className="bg-white/20 px-2 py-1 rounded text-xs font-semibold backdrop-blur-sm">
                                                Par Défaut
                                            </span>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <AdminButton variant="secondary" className="w-full gap-2 justify-center">
                                            <span className="material-symbols-outlined text-[18px]" translate="no">credit_card</span>
                                            Modifier Moyen de Paiement
                                        </AdminButton>
                                        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg flex gap-3">
                                            <span className="material-symbols-outlined text-blue-600 dark:text-blue-400" translate="no">info</span>
                                            <p className="text-xs text-blue-700 dark:text-blue-300 leading-tight">
                                                Votre prochain prélèvement automatique de <strong>€24,500</strong> aura lieu le{' '}
                                                <strong>1 Oct 2023</strong>.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Billing Contact */}
                                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Contact Facturation</h3>
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold">
                                            SB
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-slate-900 dark:text-white">Sarah Bennani</p>
                                            <p className="text-xs text-slate-500">sarah.b@tesla.com</p>
                                        </div>
                                    </div>
                                    <button className="mt-4 text-primary text-sm font-medium hover:underline">
                                        Modifier contact facturation
                                    </button>
                                </div>
                            </div>

                            {/* Right Column - Invoice History */}
                            <div className="lg:col-span-2">
                                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden h-full">
                                    <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Historique Factures</h3>
                                        <button className="text-primary text-sm font-medium hover:text-primary-700">
                                            Tout Télécharger
                                        </button>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                                            <thead className="bg-slate-50 dark:bg-slate-900">
                                                <tr>
                                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                                        Date
                                                    </th>
                                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                                        Facture #
                                                    </th>
                                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                                        Montant
                                                    </th>
                                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                                        Statut
                                                    </th>
                                                    <th scope="col" className="relative px-6 py-3">
                                                        <span className="sr-only">Télécharger</span>
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                                                {[
                                                    { date: '01/09/2023', invoice: 'INV-2023-009', amount: '€24,500.00', status: 'Payé' },
                                                    { date: '01/08/2023', invoice: 'INV-2023-008', amount: '€22,100.00', status: 'Payé' },
                                                    { date: '01/07/2023', invoice: 'INV-2023-007', amount: '€22,100.00', status: 'Payé' },
                                                    { date: '01/06/2023', invoice: 'INV-2023-006', amount: '€18,500.00', status: 'Remboursé' },
                                                    { date: '01/05/2023', invoice: 'INV-2023-005', amount: '€18,500.00', status: 'Payé' },
                                                ].map((item, idx) => (
                                                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-mono">{item.date}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-white">
                                                            {item.invoice}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700 dark:text-slate-200 font-mono font-bold">
                                                            {item.amount}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <span
                                                                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${item.status === 'Payé'
                                                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                                                    : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                                                                    }`}
                                                            >
                                                                {item.status}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                            <a className="text-slate-400 hover:text-primary" href="#">
                                                                <span className="material-symbols-outlined" translate="no">download</span>
                                                            </a>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
