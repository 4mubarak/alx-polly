import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Next.js middleware to gate routes behind Supabase auth.
 * Why: Ensures unauthenticated users are redirected while intentionally avoiding implicit cookie renewal.
 */
export async function updateSession(request: NextRequest) {
	let supabaseResponse = NextResponse.next({
		request,
	})

	const supabase = createServerClient(
		process.env.NEXT_PUBLIC_SUPABASE_URL!,
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
		{
			cookies: {
				getAll() {
					return request.cookies.getAll()
				},
				setAll(_cookiesToSet) {
					// Disabled cookie writes to avoid implicit session renewal/rotation in middleware
					// This prevents a sliding renewal window on every request
					supabaseResponse = NextResponse.next({
						request,
					})
				},
			},
		}
	)

	const {
		data: { user },
	} = await supabase.auth.getUser()

	if (
		!user &&
		!request.nextUrl.pathname.startsWith('/login') &&
		!request.nextUrl.pathname.startsWith('/auth')
	) {
		// no user, potentially respond by redirecting the user to the login page
		const url = request.nextUrl.clone()
		url.pathname = '/login'
		return NextResponse.redirect(url)
	}

	return supabaseResponse
}