"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Zap, User, CreditCard, Gift, LogOut, Menu, X, UserPlus, BarChart, BookOpen } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"
import { DemoModeBanner } from "@/components/demo-mode-banner"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [user, setUser] = useState<any>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const checkUser = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!session) {
          router.push("/login")
          return
        }

        setUser(session.user)

        // Verificar si el usuario existe en la tabla users
        const { data, error: userError } = await supabase
          .from("users")
          .select("role")
          .eq("id", session.user.id)
          .maybeSingle()

        if (userError) {
          console.error("Error fetching user role:", userError)
          setError(`Error al obtener el rol del usuario: ${userError.message}`)
          // Redirigir al login con error
          router.push("/login?error=database_error")
          return
        }

        if (!data) {
          console.warn("Usuario no encontrado en la tabla users")
          // Cerrar sesión y redirigir al login con error
          await supabase.auth.signOut()
          router.push("/login?error=user_not_registered")
          return
        }

        // Usuario encontrado, establecer el rol
        setUserRole(data.role)
        setLoading(false)
      } catch (error: any) {
        console.error("Error checking user:", error)
        setError(`Error al verificar usuario: ${error.message}`)
        setLoading(false)
        // Redirigir al login con error
        router.push("/login?error=database_error")
      }
    }

    checkUser()

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_OUT") {
        router.push("/login")
      } else if (session) {
        setUser(session.user)
      }
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [router, toast])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    toast({
      title: "Sesión cerrada",
      description: "Has cerrado sesión correctamente.",
    })
    router.push("/login")
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500"></div>
      </div>
    )
  }

  const navItems = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: <Zap className="h-5 w-5" />,
    },
    {
      name: "Perfil",
      href: "/dashboard/profile",
      icon: <User className="h-5 w-5" />,
    },
    {
      name: "Monedas",
      href: "/dashboard/coins",
      icon: <CreditCard className="h-5 w-5" />,
    },
    {
      name: "Recompensas",
      href: "/dashboard/rewards",
      icon: <Gift className="h-5 w-5" />,
    },
  ]

  // Add teacher-specific routes
  if (userRole === "teacher" || userRole === "admin") {
    navItems.push({
      name: "Cursos",
      href: "/dashboard/courses",
      icon: <BookOpen className="h-5 w-5" />,
    })
    navItems.push({
      name: "Estudiantes",
      href: "/dashboard/students",
      icon: <User className="h-5 w-5" />,
    })
    navItems.push({
      name: "Añadir Estudiante",
      href: "/dashboard/students/add",
      icon: <UserPlus className="h-5 w-5" />,
    })
    navItems.push({
      name: "Reportes",
      href: "/dashboard/reports",
      icon: <BarChart className="h-5 w-5" />,
    })
  }

  return (
    <div className="flex min-h-screen flex-col">
      {error && <DemoModeBanner error={error} />}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center space-x-2">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <Zap className="h-6 w-6 text-yellow-500" />
              <span className="font-bold">Faraday Coins</span>
            </Link>
          </div>
          <div className="flex items-center md:hidden">
            <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
          <nav className="hidden md:flex items-center space-x-4">
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="h-5 w-5 mr-2" />
              Cerrar sesión
            </Button>
          </nav>
        </div>
      </header>
      <div className="flex flex-1">
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-40 w-64 transform border-r bg-background transition-transform duration-200 ease-in-out md:translate-x-0 md:static md:z-0",
            mobileMenuOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <div className="flex h-14 items-center border-b px-4">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <Zap className="h-6 w-6 text-yellow-500" />
              <span className="font-bold">Faraday Coins</span>
            </Link>
          </div>
          <div className="py-4">
            <nav className="space-y-1 px-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.icon}
                  <span className="ml-3">{item.name}</span>
                </Link>
              ))}
              <button
                onClick={handleSignOut}
                className="w-full flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground md:hidden"
              >
                <LogOut className="h-5 w-5" />
                <span className="ml-3">Cerrar sesión</span>
              </button>
            </nav>
          </div>
        </aside>
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}
