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

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|api).*)',
    ],
};
