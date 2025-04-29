"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { Search, Plus, Edit, Trash, Users } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"

export default function CoursesPage() {
  const [user, setUser] = useState<any>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [courses, setCourses] = useState<any[]>([])
  const [filteredCourses, setFilteredCourses] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [isTeacher, setIsTeacher] = useState(false)
  const [showCourseDialog, setShowCourseDialog] = useState(false)
  const [editingCourse, setEditingCourse] = useState<any | null>(null)
  const [courseName, setCourseName] = useState("")
  const [courseDescription, setCourseDescription] = useState("")
  const [processing, setProcessing] = useState(false)
  const [studentCounts, setStudentCounts] = useState<Record<string, number>>({})
  const { toast } = useToast()

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        return
      }

      setUser(session.user)

      // Fetch user role from the database
      const { data, error } = await supabase.from("users").select("role").eq("id", session.user.id).single()

      if (error) {
        console.error("Error fetching user role:", error)
      } else if (data) {
        setUserRole(data.role)
        setIsTeacher(data.role === "teacher" || data.role === "admin")

        if (data.role !== "teacher" && data.role !== "admin") {
          // Redirect non-teachers
          window.location.href = "/dashboard"
        }
      }

      setLoading(false)
    }

    checkUser()
  }, [])

  useEffect(() => {
    if (isTeacher) {
      fetchCourses()
    }
  }, [isTeacher])

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredCourses(courses)
    } else {
      const filtered = courses.filter(
        (course) =>
          course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (course.description && course.description.toLowerCase().includes(searchQuery.toLowerCase())),
      )
      setFilteredCourses(filtered)
    }
  }, [searchQuery, courses])

  const fetchCourses = async () => {
    try {
      setLoading(true)

      // Fetch courses
      const { data: coursesData, error: coursesError } = await supabase.from("courses").select("*").order("name")

      if (coursesError) {
        throw coursesError
      }

      setCourses(coursesData || [])
      setFilteredCourses(coursesData || [])

      // Fetch student counts for each course
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("course_id")
        .eq("role", "student")

      if (userError) {
        console.error("Error fetching student counts:", userError)
      } else {
        const counts: Record<string, number> = {}
        userData.forEach((user) => {
          if (user.course_id) {
            counts[user.course_id] = (counts[user.course_id] || 0) + 1
          }
        })
        setStudentCounts(counts)
      }

      setLoading(false)
    } catch (error: any) {
      toast({
        title: "Error al cargar cursos",
        description: error.message,
        variant: "destructive",
      })
      setLoading(false)
    }
  }

  const handleAddCourse = () => {
    setEditingCourse(null)
    setCourseName("")
    setCourseDescription("")
    setShowCourseDialog(true)
  }

  const handleEditCourse = (course: any) => {
    setEditingCourse(course)
    setCourseName(course.name)
    setCourseDescription(course.description || "")
    setShowCourseDialog(true)
  }

  const handleDeleteCourse = async (courseId: string, courseName: string) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar el curso "${courseName}"? Esta acción no se puede deshacer.`)) {
      return
    }

    try {
      // Check if there are students in this course
      const { count, error: countError } = await supabase
        .from("users")
        .select("id", { count: "exact" })
        .eq("course_id", courseId)
        .eq("role", "student")

      if (countError) {
        throw countError
      }

      if (count && count > 0) {
        if (
          !confirm(
            `Este curso tiene ${count} estudiantes asignados. ¿Deseas continuar? Los estudiantes no serán eliminados, pero perderán su asignación a este curso.`,
          )
        ) {
          return
        }

        // Update students to remove course assignment
        const { error: updateError } = await supabase
          .from("users")
          .update({ course_id: null })
          .eq("course_id", courseId)

        if (updateError) {
          throw updateError
        }
      }

      // Delete the course
      const { error } = await supabase.from("courses").delete().eq("id", courseId)

      if (error) {
        throw error
      }

      toast({
        title: "Curso eliminado",
        description: `El curso "${courseName}" ha sido eliminado correctamente.`,
      })

      // Update local state
      setCourses((prev) => prev.filter((c) => c.id !== courseId))
    } catch (error: any) {
      toast({
        title: "Error al eliminar curso",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const handleSaveCourse = async () => {
    if (!courseName) {
      toast({
        title: "Error",
        description: "Por favor, ingresa un nombre para el curso.",
        variant: "destructive",
      })
      return
    }

    setProcessing(true)

    try {
      if (editingCourse) {
        // Update existing course
        const { error } = await supabase
          .from("courses")
          .update({
            name: courseName,
            description: courseDescription,
          })
          .eq("id", editingCourse.id)

        if (error) {
          throw error
        }

        toast({
          title: "Curso actualizado",
          description: "El curso ha sido actualizado correctamente.",
        })

        // Update local state
        setCourses((prev) =>
          prev.map((c) =>
            c.id === editingCourse.id
              ? {
                  ...c,
                  name: courseName,
                  description: courseDescription,
                }
              : c,
          ),
        )
      } else {
        // Create new course
        const { data, error } = await supabase
          .from("courses")
          .insert({
            name: courseName,
            description: courseDescription,
            created_by: user.id,
          })
          .select()

        if (error) {
          throw error
        }

        toast({
          title: "Curso creado",
          description: "El curso ha sido creado correctamente.",
        })

        // Update local state
        if (data) {
          setCourses((prev) => [...prev, data[0]])
        }
      }

      setShowCourseDialog(false)
    } catch (error: any) {
      toast({
        title: "Error al guardar curso",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500"></div>
        </div>
      </DashboardLayout>
    )
  }

  if (!isTeacher) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-full">
          <h1 className="text-2xl font-bold mb-2">Acceso Restringido</h1>
          <p className="text-muted-foreground">Solo los profesores pueden acceder a esta página.</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestión de Cursos</h1>
          <p className="text-muted-foreground">Administra los cursos disponibles para los estudiantes</p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar cursos..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button onClick={handleAddCourse}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Curso
          </Button>
          <Button variant="outline" onClick={() => fetchCourses()}>
            Actualizar
          </Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Lista de Cursos</CardTitle>
            <CardDescription>Administra los cursos y sus estudiantes</CardDescription>
          </CardHeader>
          <CardContent>
            {filteredCourses.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Estudiantes</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCourses.map((course) => (
                    <TableRow key={course.id}>
                      <TableCell className="font-medium">{course.name}</TableCell>
                      <TableCell>{course.description || "Sin descripción"}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Badge variant="outline" className="mr-2">
                            {studentCounts[course.id] || 0}
                          </Badge>
                          <Link href={`/dashboard/students?course=${course.id}`}>
                            <Button variant="ghost" size="sm">
                              <Users className="h-4 w-4 mr-1" />
                              Ver estudiantes
                            </Button>
                          </Link>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button variant="outline" size="sm" onClick={() => handleEditCourse(course)}>
                            <Edit className="h-4 w-4 mr-1" />
                            Editar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteCourse(course.id, course.name)}
                          >
                            <Trash className="h-4 w-4 mr-1" />
                            Eliminar
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center justify-center py-6">
                <p className="text-center text-muted-foreground">No se encontraron cursos</p>
                <Button variant="outline" className="mt-4" onClick={handleAddCourse}>
                  <Plus className="h-4 w-4 mr-2" />
                  Crear primer curso
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={showCourseDialog} onOpenChange={setShowCourseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCourse ? "Editar Curso" : "Nuevo Curso"}</DialogTitle>
            <DialogDescription>
              {editingCourse
                ? "Modifica los detalles del curso existente."
                : "Crea un nuevo curso para los estudiantes."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                value={courseName}
                onChange={(e) => setCourseName(e.target.value)}
                placeholder="Nombre del curso"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descripción (opcional)</Label>
              <Textarea
                id="description"
                value={courseDescription}
                onChange={(e) => setCourseDescription(e.target.value)}
                placeholder="Descripción detallada del curso"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCourseDialog(false)} disabled={processing}>
              Cancelar
            </Button>
            <Button onClick={handleSaveCourse} disabled={processing || !courseName}>
              {processing ? (
                <span className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                  Guardando...
                </span>
              ) : (
                "Guardar Curso"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
