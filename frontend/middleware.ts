import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { updateSession } from '@/utils/supabase/middleware';
import { createServerClient } from '@supabase/ssr';

// Routes publiques (accessibles sans authentification via Supabase)
const publicRoutes = [
    '/login',
    '/signup',
    '/forgot-password',
    '/reset-password',
    '/join',
    '/p', // Public profiles
    '/activate', // Card activation
    '/legal',
    '/design-preview',
    '/_next',
    '/favicon.ico',
    '/',
];

export async function middleware(request: NextRequest) {
    const url = request.nextUrl;
    const hostname = request.headers.get('host') || '';

    // Détection du domaine Scanner NFC
    if (hostname.includes('k.kliknode.com')) {
        // Redirige silencieusement les requêtes root (ex: k.kliknode.com/1234) vers /activate/1234
        if (url.pathname !== '/' && !url.pathname.startsWith('/api') && !url.pathname.startsWith('/_next')) {
            return NextResponse.rewrite(new URL(`/activate${url.pathname}`, request.url));
        }
        // Évite le rendu de la home page SaaS si on est sur la racine k.kliknode.com
        if (url.pathname === '/') {
            return new NextResponse('Domaine reserve au scan NFC. Veuillez scanner une carte valide.', { status: 403 });
        }
    }

    // 1. Refresh session using the Supabase utility (fixes "Non authentifié" issue)
    const response = await updateSession(request);

    const { pathname } = request.nextUrl;
    const isPublicPath = publicRoutes.some((route) => pathname.startsWith(route));

    // 2. Create a temporary client to check user/role without modifying session again
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() { return request.cookies.getAll() },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
                },
            },
        }
    );

    const { data: { user } } = await supabase.auth.getUser();

    // 3. Protection: If not authenticated and trying to access protected routes
    if (!user && !isPublicPath) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    // 4. Role-based Redirection
    if (user) {
        // Fetch profile with role
        const { data: userData } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single();

        const role = userData?.role || 'employee';

        // Redirect from login/signup if already auth
        if (isPublicPath && (pathname === '/login' || pathname === '/signup')) {
            if (role === 'super_admin') return NextResponse.redirect(new URL('/admin', request.url));
            if (role === 'company_admin') return NextResponse.redirect(new URL('/company', request.url));
            if (role === 'operator') return NextResponse.redirect(new URL('/operator', request.url));
            return NextResponse.redirect(new URL('/user', request.url));
        }

        // Role-path protection
        if (pathname.startsWith('/admin') && role !== 'super_admin') {
            return NextResponse.redirect(new URL('/user', request.url));
        }
        if (pathname.startsWith('/company') && role !== 'company_admin') {
            return NextResponse.redirect(new URL('/user', request.url));
        }
        if (pathname.startsWith('/operator') && !['operator', 'super_admin'].includes(role)) {
            return NextResponse.redirect(new URL('/user', request.url));
        }
        if (pathname.startsWith('/user') && !['employee', 'super_admin', 'company_admin', 'operator'].includes(role)) {
            return NextResponse.redirect(new URL('/', request.url));
        }
    }

    return response;
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|api).*)',
    ],
};
