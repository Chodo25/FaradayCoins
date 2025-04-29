"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search } from "lucide-react"

interface StudentActivityTableProps {
  course: string
}

export function StudentActivityTable({ course }: StudentActivityTableProps) {
  const [data, setData] = useState<any[]>([])
  const [filteredData, setFilteredData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    fetchData()
  }, [course])

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredData(data)
    } else {
      const filtered = data.filter(
        (student) =>
          student.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          student.course.toLowerCase().includes(searchQuery.toLowerCase()),
      )
      setFilteredData(filtered)
    }
  }, [searchQuery, data])

  const fetchData = async () => {
    try {
      setLoading(true)

      // Fetch students with their balances, transactions, and redemptions
      let query = supabase
        .from("users")
        .select(`
          id,
          full_name,
          email,
          course,
          balances (coins),
          transactions (id),
          reward_redemptions (id)
        `)
        .eq("role", "student")

      if (course !== "all") {
        query = query.eq("course", course)
      }

      const { data, error } = await query

      if (error) {
        throw error
      }

      // Format data for table
      const formattedData = data.map((student) => {
        const coins = student.balances && student.balances.length > 0 ? student.balances[0].coins : 0
        const transactionsCount = student.transactions ? student.transactions.length : 0
        const redemptionsCount = student.reward_redemptions ? student.reward_redemptions.length : 0

        return {
          id: student.id,
          full_name: student.full_name,
          email: student.email,
          course: student.course || "No asignado",
          coins,
          transactionsCount,
          redemptionsCount,
        }
      })

      // Sort by coins (descending)
      formattedData.sort((a, b) => b.coins - a.coins)

      setData(formattedData)
      setFilteredData(formattedData)
      setLoading(false)
    } catch (error: any) {
      toast({
        title: "Error al cargar datos",
        description: error.message,
        variant: "destructive",
      })
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-yellow-500"></div>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">No hay datos disponibles</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar estudiantes..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button variant="outline" onClick={() => fetchData()}>
          Actualizar
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Curso</TableHead>
              <TableHead className="text-right">Monedas</TableHead>
              <TableHead className="text-right">Transacciones</TableHead>
              <TableHead className="text-right">Canjes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.map((student) => (
              <TableRow key={student.id}>
                <TableCell className="font-medium">{student.full_name}</TableCell>
                <TableCell>{student.email}</TableCell>
                <TableCell>{student.course}</TableCell>
                <TableCell className="text-right">{student.coins}</TableCell>
                <TableCell className="text-right">{student.transactionsCount}</TableCell>
                <TableCell className="text-right">{student.redemptionsCount}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
