export interface User {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    role: UserRole;
    companyId: string | null;
    avatarUrl: string | null;
    isActive: boolean;
}

export type UserRole = 'super_admin' | 'company_admin' | 'employee' | 'operator';

export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
}

export interface LoginResponse {
    success: boolean;
    data: {
        user: User;
        tokens: AuthTokens;
    };
}

export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
        details?: any;
    };
}

export interface Company {
    id: string;
    name: string;
    slug: string;
    country: 'FR' | 'MA';
    currency: 'EUR' | 'MAD';
    status: 'active' | 'suspended' | 'trial';
    adminEmail: string;
}

export interface Card {
    id: string;
    userId: string;
    publicSlug: string;
    firstName: string | null;
    lastName: string | null;
    jobTitle: string | null;
    companyName: string | null;
    bio: string | null;
    avatarUrl: string | null;
    isPublic: boolean;
    viewCount: number;
}

export interface SubscriptionPlan {
    id: string;
    name: string;
    slug: string;
    priceEur: number;
    priceMad: number;
    billingPeriod: 'monthly' | 'yearly' | 'lifetime';
    maxLicenses: number;
    features: Record<string, any>;
    isActive: boolean;
}
