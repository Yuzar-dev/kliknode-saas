// API Base URL from environment variable (support localhost, 127.0.0.1 and LAN IP in dev, relative URL in prod)
const getBaseUrl = () => {
    if (process.env.NEXT_PUBLIC_API_URL) {
        return process.env.NEXT_PUBLIC_API_URL;
    }
    if (typeof window !== 'undefined' && window.location.hostname) {
        const host = window.location.hostname;
        if (host === 'localhost' || host === '127.0.0.1' || host.startsWith('192.168.') || host.startsWith('10.')) {
            return `http://${host}:4000`;
        }
        return '';
    }
    return process.env.NODE_ENV === 'production' ? '' : 'http://localhost:4000';
};

const API_BASE_URL = getBaseUrl();

// API Client configuration
export const api = {
    baseURL: API_BASE_URL,
    timeout: 30000,
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
