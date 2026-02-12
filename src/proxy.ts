import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
    try {
        let response = NextResponse.next({
            request: {
                headers: request.headers,
            },
        })

        const url = process.env.NEXT_PUBLIC_SUPABASE_URL
        const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

        if (!url || !key) {
            console.error('Supabase environment variables are missing in proxy!')
            return response
        }

        const supabase = createServerClient(
            url,
            key,
            {
                cookies: {
                    getAll() {
                        return request.cookies.getAll()
                    },
                    setAll(cookiesToSet) {
                        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
                        response = NextResponse.next({
                            request: {
                                headers: request.headers,
                            },
                        })
                        cookiesToSet.forEach(({ name, value, options }) =>
                            response.cookies.set(name, value, options)
                        )
                    },
                },
            }
        )

        const { data: { user }, error } = await supabase.auth.getUser()

        if (error) {
            console.error('Error fetching user in proxy:', error)
        }

        // Protected routes: redirect to login if not authenticated
        // Public routes: redirect to dashboard if authenticated (login/signup)
        const isPublicRoute = request.nextUrl.pathname.startsWith('/login')
        const isDashboardRoute = request.nextUrl.pathname === '/' ||
            request.nextUrl.pathname.startsWith('/inventory') ||
            request.nextUrl.pathname.startsWith('/production') ||
            request.nextUrl.pathname.startsWith('/sales') ||
            request.nextUrl.pathname.startsWith('/settings')

        if (!user && isDashboardRoute) {
            return NextResponse.redirect(new URL('/login', request.url))
        }

        if (user && isPublicRoute) {
            return NextResponse.redirect(new URL('/', request.url))
        }

        return response
    } catch (e) {
        console.error('Unhandled error in proxy:', e)
        return NextResponse.next()
    }
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * Feel free to modify this pattern to include more paths.
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
