"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

interface CreateUserParams {
  email: string
  password: string
  fullName: string
  course: string | null
  role: "teacher" | "student" | "admin"
}

export async function createUser(params: CreateUserParams) {
  try {
    const supabase = createClient()

    // Verificar si el usuario actual es un administrador o profesor
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return { success: false, message: "No autorizado" }
    }

    // Verificar el rol del usuario actual
    const { data: currentUser, error: currentUserError } = await supabase
      .from("users")
      .select("role")
      .eq("id", session.user.id)
      .single()

    if (currentUserError || !currentUser || (currentUser.role !== "teacher" && currentUser.role !== "admin")) {
      return { success: false, message: "No tienes permisos para crear usuarios" }
    }

    // Verificar si el email ya existe
    const { data: existingUser, error: existingUserError } = await supabase
      .from("users")
      .select("id")
      .eq("email", params.email)
      .maybeSingle()

    if (existingUser) {
      return { success: false, message: "Ya existe un usuario con ese correo electrónico" }
    }

    // Crear usuario en Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: params.email,
      password: params.password,
      email_confirm: true,
    })

    if (authError) {
      return { success: false, message: `Error al crear usuario en Auth: ${authError.message}` }
    }

    if (!authData.user) {
      return { success: false, message: "No se pudo crear el usuario en Auth" }
    }

    // Crear registro en la tabla users
    const { error: userInsertError } = await supabase.from("users").insert({
      id: authData.user.id,
      email: params.email,
      full_name: params.fullName,
      course: params.course,
      role: params.role,
    })

    if (userInsertError) {
      // Si falla la inserción en la tabla users, intentar eliminar el usuario de Auth
      await supabase.auth.admin.deleteUser(authData.user.id)
      return { success: false, message: `Error al crear perfil de usuario: ${userInsertError.message}` }
    }

    // Crear balance inicial
    const { error: balanceError } = await supabase.from("balances").insert({
      user_id: authData.user.id,
      coins: 0,
    })

    if (balanceError) {
      return { success: false, message: `Error al crear balance inicial: ${balanceError.message}` }
    }

    revalidatePath("/admin/users")
    return { success: true, message: "Usuario creado correctamente", userId: authData.user.id }
  } catch (error: any) {
    return { success: false, message: `Error inesperado: ${error.message}` }
  }
}

export async function deleteUser(userId: string) {
  try {
    const supabase = createClient()

    // Verificar si el usuario actual es un administrador o profesor
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return { success: false, message: "No autorizado" }
    }

    // Verificar el rol del usuario actual
    const { data: currentUser, error: currentUserError } = await supabase
      .from("users")
      .select("role")
      .eq("id", session.user.id)
      .single()

    if (currentUserError || !currentUser || (currentUser.role !== "teacher" && currentUser.role !== "admin")) {
      return { success: false, message: "No tienes permisos para eliminar usuarios" }
    }

    // Eliminar registros relacionados
    // 1. Eliminar balances
    const { error: balanceError } = await supabase.from("balances").delete().eq("user_id", userId)

    if (balanceError) {
      return { success: false, message: `Error al eliminar balances: ${balanceError.message}` }
    }

    // 2. Eliminar transacciones
    const { error: transactionError } = await supabase.from("transactions").delete().eq("user_id", userId)

    if (transactionError) {
      return { success: false, message: `Error al eliminar transacciones: ${transactionError.message}` }
    }

    // 3. Eliminar redenciones de recompensas
    const { error: redemptionError } = await supabase.from("reward_redemptions").delete().eq("user_id", userId)

    if (redemptionError) {
      return { success: false, message: `Error al eliminar redenciones: ${redemptionError.message}` }
    }

    // 4. Eliminar usuario de la tabla users
    const { error: userError } = await supabase.from("users").delete().eq("id", userId)

    if (userError) {
      return { success: false, message: `Error al eliminar perfil de usuario: ${userError.message}` }
    }

    // 5. Eliminar usuario de Auth
    const { error: authError } = await supabase.auth.admin.deleteUser(userId)

    if (authError) {
      return { success: false, message: `Error al eliminar usuario de Auth: ${authError.message}` }
    }

    revalidatePath("/admin/users")
    return { success: true, message: "Usuario eliminado correctamente" }
  } catch (error: any) {
    return { success: false, message: `Error inesperado: ${error.message}` }
  }
}
