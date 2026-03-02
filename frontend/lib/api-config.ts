// API Base URL from environment variable
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

// API Client configuration
export const api = {
    baseURL: API_BASE_URL,
    timeout: 10000,
};

// API Endpoints
export const endpoints = {
    // Auth
    auth: {
        login: '/api/auth/login',
        register: '/api/auth/register',
        logout: '/api/auth/logout',
        refresh: '/api/auth/refresh',
        forgotPassword: '/api/auth/forgot-password',
        resetPassword: '/api/auth/reset-password',
    },
    // Super Admin
    admin: {
        companies: '/api/admin/companies',
        transactions: '/api/admin/transactions',
        plans: '/api/admin/plans',
        promoCodes: '/api/admin/promo-codes',
        inventory: '/api/admin/inventory',
        operators: '/api/admin/operators',
        auditLogs: '/api/admin/audit-logs',
    },
    // Company
    company: {
        dashboard: (slug: string) => `/api/company/${slug}`,
        employees: (slug: string) => `/api/company/${slug}/employees`,
        departments: (slug: string) => `/api/company/${slug}/departments`,
        branding: (slug: string) => `/api/company/${slug}/branding`,
        leads: (slug: string) => `/api/company/${slug}/leads`,
        billing: (slug: string) => `/api/company/${slug}/billing`,
    },
    // User
    user: {
        profile: '/api/user/profile',
        card: '/api/user/card',
        cardAvatar: '/api/user/card/avatar',
        socialLinks: '/api/user/social-links',
        socialLinksReorder: '/api/user/social-links/reorder',
        socialLink: (id: string) => `/api/user/social-links/${id}`,
        analytics: '/api/user/analytics',
        leads: '/api/user/leads',
        settings: '/api/user/change-password',
    },
    // Operator
    operator: {
        encode: '/api/operator/encode',
        pair: '/api/operator/pair',
        cards: '/api/operator/cards',
        stats: '/api/operator/stats',
        updateCardStatus: (id: string) => `/api/operator/cards/${id}/status`,
    },
    // Public
    public: {
        card: (slug: string) => `/api/public/card/${slug}`,
        activate: (uid: string) => `/api/public/activate/${uid}`,
    },
};
