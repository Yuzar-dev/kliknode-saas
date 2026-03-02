'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/admin/AdminLayout';
import { Pagination } from '@/components/ui/Pagination';
import { AdminButton } from '@/components/ui/AdminButton';

type Company = {
    id: string;
    name: string;
    registrationNumber: string;
    country: 'FR' | 'MA';
    adminName: string;
    adminEmail: string;
    plan: 'Starter' | 'Professional' | 'Enterprise';
    licenses: number;
    paymentStatus: 'Paid' | 'Overdue' | 'Suspended';
    renewalDate: string;
    isSuspended: boolean;
    avatarColor: string;
    avatarLetter: string;
};

export default function CompaniesListPage() {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('all');

    // Mock data
    const companies: Company[] = [
        {
            id: '1',
            name: 'TechVision SAS',
            registrationNumber: 'SIRET: 832 940 219 00012',
            country: 'FR',
            adminName: 'Jean Dupont',
            adminEmail: 'jean.d@techvision.fr',
            plan: 'Enterprise',
            licenses: 250,
            paymentStatus: 'Paid',
            renewalDate: 'Oct 24, 2024',
            isSuspended: false,
            avatarColor: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400',
            avatarLetter: 'T',
        },
        {
            id: '2',
            name: 'Atlas Consulting SARL',
            registrationNumber: 'ICE: 001528943000058',
            country: 'MA',
            adminName: 'Amine Benali',
            adminEmail: 'amine.b@atlas-maroc.ma',
            plan: 'Professional',
            licenses: 45,
            paymentStatus: 'Overdue',
            renewalDate: 'Dec 01, 2023',
            isSuspended: false,
            avatarColor: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
            avatarLetter: 'A',
        },
        {
            id: '3',
            name: 'LogiTrans Express',
            registrationNumber: 'SIRET: 402 110 992 00045',
            country: 'FR',
            adminName: 'Sophie Martin',
            adminEmail: 's.martin@logitrans.com',
            plan: 'Starter',
            licenses: 12,
            paymentStatus: 'Paid',
            renewalDate: 'Jan 15, 2025',
            isSuspended: false,
            avatarColor: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400',
            avatarLetter: 'L',
        },
        {
            id: '4',
            name: 'Green Energy Solutions',
            registrationNumber: 'ICE: 002198321000019',
            country: 'MA',
            adminName: 'Karim Idrissi',
            adminEmail: 'k.idrissi@green-energy.ma',
            plan: 'Professional',
            licenses: 88,
            paymentStatus: 'Paid',
            renewalDate: 'Mar 10, 2024',
            isSuspended: false,
            avatarColor: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
            avatarLetter: 'G',
        },
        {
            id: '5',
            name: 'Nova Retail Group',
            registrationNumber: 'SIRET: 334 102 918 00010',
            country: 'FR',
            adminName: 'Paul Lefevre',
            adminEmail: 'p.lefevre@novagroup.fr',
            plan: 'Enterprise',
            licenses: 500,
            paymentStatus: 'Suspended',
            renewalDate: 'Sep 05, 2023',
            isSuspended: true,
            avatarColor: 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300',
            avatarLetter: 'N',
        },
        {
            id: '6',
            name: 'MediaCom France',
            registrationNumber: 'SIRET: 552 910 101 00023',
            country: 'FR',
            adminName: 'Lucie Bernard',
            adminEmail: 'lucie.b@mediacom.fr',
            plan: 'Professional',
            licenses: 60,
            paymentStatus: 'Paid',
            renewalDate: 'Nov 15, 2024',
            isSuspended: false,
            avatarColor: 'bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400',
            avatarLetter: 'M',
        },
    ];

    const getPlanBadgeColor = (plan: string) => {
        switch (plan) {
            case 'Enterprise':
                return 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300';
            case 'Professional':
                return 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300';
            case 'Starter':
                return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getPaymentBadgeColor = (status: string) => {
        switch (status) {
            case 'Paid':
                return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800';
            case 'Overdue':
                return 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300 border border-rose-200 dark:border-rose-800';
            case 'Suspended':
                return 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };


    const filteredCompanies = companies.filter(company => {
        if (activeTab === 'all') return true;
        if (activeTab === 'suspended') return company.isSuspended;
        if (activeTab === 'active') return !company.isSuspended;
        return true;
    });

    const itemsPerPage = 6;
    const [currentPage, setCurrentPage] = useState(1);

    const totalPages = Math.ceil(filteredCompanies.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedCompanies = filteredCompanies.slice(startIndex, startIndex + itemsPerPage);

    return (
        <AdminLayout>
            <div className="max-w-[1600px] mx-auto w-full">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Entreprises</h1>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                            Gérez vos clients B2B en France et au Maroc.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                        {/* Search */}
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg
                                    className="h-5 w-5 text-slate-400 group-focus-within:text-primary transition-colors"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        clipRule="evenodd"
                                        d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                                        fillRule="evenodd"
                                    />
                                </svg>
                            </div>
                            <input
                                className="block w-full sm:w-64 pl-10 pr-3 py-2 border border-slate-300 dark:border-slate-600 rounded-full leading-5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-0 focus:border-blue-500 focus:shadow-[0_0_10px_rgba(59,130,246,0.5)] sm:text-sm shadow-sm transition-all"
                                placeholder="Rechercher une entreprise..."
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        {/* Filter Button */}
                        <AdminButton variant="secondary" className="gap-2">
                            <span className="material-icons-outlined text-slate-400 text-lg">filter_list</span>
                            Filtrer
                        </AdminButton>
                        {/* Export Button */}
                        <AdminButton variant="secondary" className="gap-2">
                            <span className="material-icons-outlined text-[18px]">download</span>
                            Exporter Excel
                        </AdminButton>
                        {/* Create Button */}
                        <AdminButton variant="primary">
                            <span className="material-icons-outlined text-[18px] mr-2">add</span>
                            Créer Entreprise
                        </AdminButton>
                    </div>
                </div>

                {/* Table Container */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col">
                    {/* Tabs */}

                    <div className="border-b border-slate-200 dark:border-slate-700 px-6 py-3 flex gap-6 text-sm overflow-x-auto">
                        <button
                            onClick={() => setActiveTab('all')}
                            className={`font-medium pb-3 whitespace-nowrap transition-colors ${activeTab === 'all'
                                ? 'text-primary border-b-2 border-primary -mb-[13px]'
                                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                                }`}
                        >
                            Toutes les Entreprises
                        </button>
                        <button
                            onClick={() => setActiveTab('active')}
                            className={`font-medium pb-3 whitespace-nowrap transition-colors ${activeTab === 'active'
                                ? 'text-primary border-b-2 border-primary -mb-[13px]'
                                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                                }`}
                        >
                            Actives (842)
                        </button>
                        <button
                            onClick={() => setActiveTab('pending')}
                            className={`font-medium pb-3 whitespace-nowrap transition-colors ${activeTab === 'pending'
                                ? 'text-primary border-b-2 border-primary -mb-[13px]'
                                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                                }`}
                        >
                            En Attente (12)
                        </button>
                        <button
                            onClick={() => setActiveTab('suspended')}
                            className={`font-medium pb-3 whitespace-nowrap transition-colors ${activeTab === 'suspended'
                                ? 'text-primary border-b-2 border-primary -mb-[13px]'
                                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                                }`}
                        >
                            Suspendues (5)
                        </button>
                    </div>


                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                            <thead className="bg-slate-50 dark:bg-slate-900/50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-64">
                                        Entreprise
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                        Pays
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                        Contact Admin
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                        Plan
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                        Licences
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                        Statut Paiement
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                        Date Renouvellement
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider sticky right-0 bg-slate-50 dark:bg-slate-900/50">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                                {paginatedCompanies.map((company) => (
                                    <tr key={company.id} className={`hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group ${company.isSuspended ? 'opacity-60' : ''}`}>
                                        {/* Company */}
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className={`h-10 w-10 flex-shrink-0 rounded flex items-center justify-center font-bold ${company.avatarColor}`}>
                                                    {company.avatarLetter}
                                                </div>
                                                <div className={`ml-4 ${company.isSuspended ? 'opacity-60' : ''}`}>
                                                    <div className={`text-sm font-semibold text-slate-900 dark:text-white ${company.isSuspended ? 'line-through' : ''}`}>
                                                        {company.name}
                                                    </div>
                                                    <div className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                                                        {company.registrationNumber}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Country */}
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${company.country === 'FR'
                                                ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-100 dark:border-blue-800'
                                                : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300 border-red-100 dark:border-red-800'
                                                }`}>
                                                <span className="mr-1.5 text-sm">{company.country === 'FR' ? '🇫🇷' : '🇲🇦'}</span>
                                                {company.country}
                                            </span>
                                        </td>

                                        {/* Admin Contact */}
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-slate-900 dark:text-white">{company.adminName}</div>
                                            <div className="text-xs text-slate-500 dark:text-slate-400">{company.adminEmail}</div>
                                        </td>

                                        {/* Plan */}
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium ${getPlanBadgeColor(company.plan)}`}>
                                                {company.plan}
                                            </span>
                                        </td>

                                        {/* Licenses */}
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300 font-medium">
                                            {company.licenses}
                                        </td>

                                        {/* Payment Status */}
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${getPaymentBadgeColor(company.paymentStatus)}`}>
                                                <span className={`h-1.5 w-1.5 rounded-full ${company.paymentStatus === 'Paid' ? 'bg-emerald-500' :
                                                    company.paymentStatus === 'Overdue' ? 'bg-rose-500' :
                                                        'bg-slate-500'
                                                    }`}></span>
                                                {company.paymentStatus === 'Paid' ? 'Payé' : company.paymentStatus === 'Overdue' ? 'En retard' : 'Suspendu'}
                                            </span>
                                        </td>

                                        {/* Renewal Date */}
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                                            {company.renewalDate}
                                        </td>

                                        {/* Actions */}
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium sticky right-0 bg-white dark:bg-slate-800 group-hover:bg-slate-50 dark:group-hover:bg-slate-700/50 transition-colors">
                                            <div className="flex items-center justify-end gap-2">
                                                {/* View */}
                                                <button
                                                    onClick={() => router.push(`/admin/companies/${company.id}`)}
                                                    className="p-1.5 text-slate-400 hover:text-primary transition-colors rounded-md hover:bg-primary/10"
                                                    title="View Details"
                                                >
                                                    <svg fill="none" height="18" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="18" xmlns="http://www.w3.org/2000/svg">
                                                        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                                                        <circle cx="12" cy="12" r="3" />
                                                    </svg>
                                                </button>

                                                {/* Impersonate */}
                                                <button
                                                    disabled={company.isSuspended}
                                                    className={`p-1.5 rounded-md transition-colors ${company.isSuspended
                                                        ? 'text-slate-200 dark:text-slate-700 cursor-not-allowed'
                                                        : 'text-slate-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20'
                                                        }`}
                                                    title={company.isSuspended ? 'Impersonate Unavailable' : 'Impersonate'}
                                                >
                                                    <svg fill="none" height="18" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="18" xmlns="http://www.w3.org/2000/svg">
                                                        <circle cx="10" cy="7" r="4" />
                                                        <path d="M10.3 15H7a4 4 0 0 0-4 4v2" />
                                                        <circle cx="17" cy="17" r="3" />
                                                        <path d="m21 21-1.9-1.9" />
                                                    </svg>
                                                </button>

                                                {/* Suspend/Reactivate */}
                                                <button
                                                    className={`p-1.5 rounded-md transition-colors ${company.isSuspended
                                                        ? 'text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
                                                        : 'text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
                                                        }`}
                                                    title={company.isSuspended ? 'Reactivate' : 'Suspend'}
                                                >
                                                    {company.isSuspended ? (
                                                        <svg fill="none" height="18" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="18" xmlns="http://www.w3.org/2000/svg">
                                                            <path d="M2 12h10" />
                                                            <path d="M9 4v16" />
                                                            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                                                            <path d="M21 3v5h-5" />
                                                            <circle cx="12" cy="12" r="10" />
                                                        </svg>
                                                    ) : (
                                                        <svg fill="none" height="18" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="18" xmlns="http://www.w3.org/2000/svg">
                                                            <circle cx="12" cy="12" r="10" />
                                                            <line x1="4.93" x2="19.07" y1="4.93" y2="19.07" />
                                                        </svg>
                                                    )}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="bg-white dark:bg-slate-800 px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between sm:px-6">
                        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm text-slate-700 dark:text-slate-300">
                                    Affichage de <span className="font-medium">{Math.min(filteredCompanies.length, startIndex + 1)}</span> à <span className="font-medium">{Math.min(filteredCompanies.length, startIndex + itemsPerPage)}</span> sur{' '}
                                    <span className="font-medium">{filteredCompanies.length}</span> résultats
                                </p>
                            </div>
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={setCurrentPage}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout >
    );
}
