'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth-store';
import { apiClient } from '@/lib/api-client';
import toast from 'react-hot-toast';
import { AdminButton } from '@/components/ui/AdminButton';

interface InvitationData {
  company: {
    id: string;
    name: string;
    logo?: string;
  };
  user: {
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
}

export default function JoinCompanyPage() {
  const router = useRouter();
  const params = useParams();
  const token = params?.token as string;

  const [invitationData, setInvitationData] = useState<InvitationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useAuthStore((state) => state.login);

  // Fetch invitation data
  useEffect(() => {
    const fetchInvitation = async () => {
      try {
        const response = await apiClient.get(`/api/invitations/verify/${token}`);
        if (response.data.success) {
          setInvitationData(response.data.data);
        }
      } catch (err: any) {
        console.error('Invitation fetch error:', err);
        setError(err.response?.data?.error?.message || 'Invitation invalide ou expirée');
      } finally {
        setIsLoading(false);
      }
    };

    fetchInvitation();
  }, [token]);

  const handleAcceptInvitation = async () => {
    setIsAccepting(true);

    try {
      const response = await apiClient.post(`/api/invitations/accept/${token}`);

      if (response.data.success) {
        const { user, tokens } = response.data.data;

        // Update auth store
        login(user, tokens);

        toast.success(`Bienvenue chez ${invitationData?.company.name} !`);

        // Redirect based on role
        setTimeout(() => {
          if (user.role === 'company_admin') {
            router.push('/company');
          } else if (user.role === 'employee') {
            router.push('/user');
          } else {
            router.push('/');
          }
        }, 1500);
      }
    } catch (err: any) {
      console.error('Accept invitation error:', err);
      const errorMessage = err.response?.data?.error?.message || 'Erreur lors de l\'acceptation de l\'invitation';
      toast.error(errorMessage);
    } finally {
      setIsAccepting(false);
    }
  };

  const getRoleBadge = (role: string) => {
    const roles: Record<string, { label: string; color: string }> = {
      company_admin: { label: 'Administrateur', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
      employee: { label: 'Employé', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
    };
    return roles[role] || { label: role, color: 'bg-gray-100 text-gray-800' };
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 mx-auto text-primary" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="mt-4 text-slate-600 dark:text-slate-400">Vérification de l'invitation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 text-center border border-slate-200 dark:border-slate-800">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Invitation invalide</h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6">{error}</p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Retour à la connexion
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!invitationData) return null;

  const roleBadge = getRoleBadge(invitationData.user.role);
  const companyInitials = invitationData.company.name.split(' ').map(word => word[0]).join('').substring(0, 2).toUpperCase();

  return (
    <div className="bg-background-light dark:bg-background-dark font-display antialiased text-slate-900 dark:text-white transition-colors duration-200">
      <div className="relative flex min-h-screen flex-col overflow-hidden">
        {/* Top Navigation */}
        <header className="flex items-center justify-between whitespace-nowrap border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md px-6 py-4 sticky top-0 z-50">
          <div className="flex items-center gap-3">
            <div className="size-8 text-primary">
              <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z" />
              </svg>
            </div>
            <h2 className="text-slate-900 dark:text-white text-lg font-bold leading-tight tracking-tight">V-Card SaaS</h2>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-sm font-semibold">
            <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Aide</span>
          </button>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8">
          <div className="w-full max-w-2xl flex flex-col gap-8">
            {/* Hero Section */}
            <div className="text-center space-y-4">
              <div className="relative mx-auto size-24 mb-6">
                {/* Company Logo Badge */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg flex items-center justify-center transform rotate-3">
                  <span className="text-white font-bold text-3xl">{companyInitials}</span>
                </div>
                <div className="absolute inset-0 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center justify-center transform -rotate-3 z-10">
                  {invitationData.company.logo ? (
                    <img alt={`${invitationData.company.name} Logo`} className="w-full h-full object-cover rounded-2xl p-2" src={invitationData.company.logo} />
                  ) : (
                    <span className="text-2xl font-bold text-slate-600 dark:text-slate-300">{companyInitials}</span>
                  )}
                </div>
              </div>
              <h1 className="text-slate-900 dark:text-white text-3xl sm:text-4xl font-black tracking-tight">
                Bienvenue chez <span className="text-primary">{invitationData.company.name}</span>
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-lg max-w-lg mx-auto leading-relaxed">
                Vous avez été invité à rejoindre l'espace de travail de votre équipe. Veuillez vérifier vos informations pour continuer.
              </p>
            </div>

            {/* Card Container */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
              {/* Decorative Header inside Card */}
              <div className="relative h-32 bg-slate-900 overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-90"></div>
                {/* Abstract Pattern Background */}
                <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                <div className="absolute -bottom-10 left-8">
                  <div className="size-20 bg-white dark:bg-slate-800 rounded-full p-1.5 shadow-lg flex items-center justify-center">
                    <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xl font-bold">
                      {invitationData.user.firstName[0]}{invitationData.user.lastName[0]}
                    </div>
                  </div>
                </div>
                <div className="absolute bottom-3 right-6 flex items-center gap-2 text-white/90 text-sm font-medium">
                  <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  Invitation sécurisée
                </div>
              </div>

              {/* Form Content */}
              <div className="px-8 pt-12 pb-8 flex flex-col gap-6">
                {/* Read-only Fields Grid */}
                <div className="grid gap-6 sm:grid-cols-2">
                  {/* Name Field */}
                  <div className="flex flex-col gap-2">
                    <label className="text-slate-700 dark:text-slate-300 text-sm font-semibold">Nom complet</label>
                    <div className="relative group">
                      <input
                        className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-500 dark:text-slate-400 font-medium focus:ring-0 cursor-not-allowed"
                        readOnly
                        type="text"
                        value={`${invitationData.user.firstName} ${invitationData.user.lastName}`}
                      />
                      <div className="absolute inset-y-0 right-4 flex items-center text-slate-400">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Role Field */}
                  <div className="flex flex-col gap-2">
                    <label className="text-slate-700 dark:text-slate-300 text-sm font-semibold">Rôle assigné</label>
                    <div className="relative">
                      <div className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 flex items-center justify-between">
                        <span className={`inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-xs font-semibold ${roleBadge.color}`}>
                          {roleBadge.label}
                        </span>
                        <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Email Field (Full Width) */}
                  <div className="flex flex-col gap-2 sm:col-span-2">
                    <label className="text-slate-700 dark:text-slate-300 text-sm font-semibold">Adresse email professionnelle</label>
                    <div className="relative">
                      <input
                        className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-500 dark:text-slate-400 font-medium focus:ring-0 cursor-not-allowed pl-11"
                        readOnly
                        type="email"
                        value={invitationData.user.email}
                      />
                      <div className="absolute inset-y-0 left-4 flex items-center text-slate-400">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="absolute inset-y-0 right-4 flex items-center text-slate-400">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Divider */}
                <div className="h-px bg-slate-100 dark:bg-slate-800 my-2"></div>

                {/* Info Box */}
                <div className="flex flex-col gap-4">
                  <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800/50">
                    <svg className="w-5 h-5 text-primary mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="text-sm text-slate-600 dark:text-slate-300">
                      <p className="font-semibold text-slate-900 dark:text-white mb-1">Confirmation requise</p>
                      En cliquant sur continuer, vous acceptez de rejoindre l'organisation <strong className="text-slate-800 dark:text-slate-200">{invitationData.company.name}</strong> et d'adhérer à leurs politiques internes.
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                {/* Action Button */}
                <AdminButton
                  onClick={handleAcceptInvitation}
                  disabled={isAccepting}
                  isLoading={isAccepting}
                  variant="primary"
                  className="w-full bg-primary hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-xl transition-all duration-200 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span>Finissez votre configuration</span>
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </AdminButton>
              </div>
            </div>

            {/* Footer Links */}
            <div className="flex flex-col items-center gap-4 text-center">
              <p className="text-sm text-slate-400 dark:text-slate-500">
                Propulsé par <span className="font-semibold text-slate-600 dark:text-slate-400">V-Card SaaS</span> © 2026
              </p>
              <div className="flex gap-6 text-xs font-medium text-slate-500 dark:text-slate-400">
                <Link href="/legal/cgu" className="hover:text-primary transition-colors">Conditions d'utilisation</Link>
                <Link href="/legal/privacy" className="hover:text-primary transition-colors">Politique de confidentialité</Link>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
