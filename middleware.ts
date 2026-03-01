import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
// DELETE THIS:
// import { verifyToken } from '@/app/lib/auth';

// ADD THIS:
import { verifyToken } from '@/app/lib/jwt';
import { ratelimit } from '@/app/lib/ratelimit'; // 🛡️ Import our new shield

const protectedRoutes = ['/dashboard', '/team', '/settings'];
const authRoutes = ['/login', '/register'];

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // ==========================================
    // 🛡️ PHASE 1: EDGE RATE LIMITING
    // ==========================================
    // We strictly rate-limit our API routes to prevent database spam and brute-force attacks
    if (pathname.startsWith('/api')) {
        // Find the user's IP address (Fallback to 127.0.0.1 for local testing)
// ADD THIS LINE:
        const ip = request.headers.get('x-forwarded-for') ?? '127.0.0.1';   
        
        // Check the IP against our Upstash Redis sliding window
        const { success, limit, remaining } = await ratelimit.limit(ip);
        
        if (!success) {
            console.warn(`🛑 Rate limit exceeded for IP: ${ip}`);
            
            // Kick them out immediately with a 429 status code
            return NextResponse.json(
                { status: 'ERROR', message: 'Too many requests. Please try again in a few seconds.' },
                { 
                    status: 429, 
                    headers: { 
                        'X-RateLimit-Limit': limit.toString(), 
                        'X-RateLimit-Remaining': remaining.toString() 
                    } 
                }
            );
        }
    }

    // ==========================================
    // 🔐 PHASE 2: THE BOUNCER (Authentication)
    // ==========================================
    const token = request.cookies.get('token')?.value;
    const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));
    const isAuthRoute = authRoutes.includes(pathname);

    if (isProtectedRoute && !token) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    if (token) {
        const payload = await verifyToken(token);

        if (!payload && isProtectedRoute) {
            const response = NextResponse.redirect(new URL('/login', request.url));
            response.cookies.delete('token');
            return response;
        }

        if (payload && isAuthRoute) {
            return NextResponse.redirect(new URL('/dashboard', request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};