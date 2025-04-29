import { createServerClient } from "@supabase/ssr"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  // Don't run middleware on auth callback route
  if (request.nextUrl.pathname.startsWith("/auth/callback")) {
    return NextResponse.next()
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://pgtpyopvowlkrpiuyuue.supabase.co"
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBndHB5b3B2b3dsa3JwaXV5dXVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU3ODM5MDgsImV4cCI6MjA2MTM1OTkwOH0.q0rQZytvW_0MTkZY-iz3ppYi3tL2OAQ_G7nJuQzPJ0Q"

  // Usamos un storage key único para el cliente del servidor
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value
      },
      set(name: string, value: string, options: any) {
        request.cookies.set({
          name,
          value,
          ...options,
        })
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        })
        response.cookies.set({
          name,
          value,
          ...options,
        })
      },
      remove(name: string, options: any) {
        request.cookies.set({
          name,
          value: "",
          ...options,
        })
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        })
        response.cookies.set({
          name,
          value: "",
          ...options,
        })
      },
    },
    auth: {
      persistSession: true,
      storageKey: "faraday-coins-middleware-key",
    },
  })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Si el usuario está intentando acceder a rutas protegidas de administración
  if (request.nextUrl.pathname.startsWith("/admin") && !request.nextUrl.pathname.startsWith("/admin/login")) {
    // Si no hay sesión, redirigir al login de administrador
    if (!session) {
      const redirectUrl = new URL("/admin/login", request.url)
      return NextResponse.redirect(redirectUrl)
    }

    try {
      // Verificar si el usuario es administrador
      const { data: userData, error } = await supabase.from("users").select("role").eq("id", session.user.id).single()

      // Si hay un error o el usuario no es administrador
      if (error || !userData || userData.role !== "admin") {
        // Redirigir al login de administrador
        const redirectUrl = new URL("/admin/login", request.url)
        redirectUrl.searchParams.set("error", "unauthorized")
        return NextResponse.redirect(redirectUrl)
      }
    } catch (error) {
      console.error("Error verificando permisos de administrador:", error)
      const redirectUrl = new URL("/admin/login", request.url)
      redirectUrl.searchParams.set("error", "database_error")
      return NextResponse.redirect(redirectUrl)
    }
  }

  // Si el usuario está intentando acceder a rutas protegidas de dashboard
  if (request.nextUrl.pathname.startsWith("/dashboard")) {
    // Si no hay sesión, redirigir al login
    if (!session) {
      const redirectUrl = new URL("/login", request.url)
      return NextResponse.redirect(redirectUrl)
    }

    try {
      // Verificar si el usuario existe en la tabla users
      const { data: userData, error } = await supabase
        .from("users")
        .select("id")
        .eq("id", session.user.id)
        .maybeSingle()

      // Si hay un error o el usuario no existe en la tabla users
      if (error || !userData) {
        // Añadir un parámetro de error a la URL de login
        const redirectUrl = new URL("/login", request.url)
        redirectUrl.searchParams.set("error", "user_not_registered")
        return NextResponse.redirect(redirectUrl)
      }
    } catch (error) {
      console.error("Error verificando usuario en middleware:", error)
      const redirectUrl = new URL("/login", request.url)
      redirectUrl.searchParams.set("error", "database_error")
      return NextResponse.redirect(redirectUrl)
    }
  }

  return response
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/auth/callback"],
}
