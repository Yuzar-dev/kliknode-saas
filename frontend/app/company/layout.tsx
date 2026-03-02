'use client';

import CompanySidebar from '@/components/company/CompanySidebar';
import CompanyHeader from '@/components/company/CompanyHeader';

export default function CompanyLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 antialiased font-display flex h-screen overflow-hidden selection:bg-primary/20 selection:text-primary">
            <CompanySidebar />
            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                <CompanyHeader />
                <main className="flex-1 overflow-y-auto bg-background-light dark:bg-background-dark p-6 lg:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
