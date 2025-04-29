"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

interface RewardsRedemptionChartProps {
  course: string
}

export function RewardsRedemptionChart({ course }: RewardsRedemptionChartProps) {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchData()
  }, [course])

  const fetchData = async () => {
    try {
      setLoading(true)

      // Fetch redemptions with reward and user info
      let query = supabase
        .from("reward_redemptions")
        .select(`
          status,
          rewards!inner(name, cost),
          users!inner(role, course)
        `)
        .eq("users.role", "student")

      if (course !== "all") {
        query = query.eq("users.course", course)
      }

      const { data, error } = await query

      if (error) {
        throw error
      }

      // Group redemptions by reward
      const groupedByReward: Record<string, { pending: number; approved: number; rejected: number; total: number }> = {}

      data.forEach((redemption) => {
        const rewardName = redemption.rewards.name

        if (!groupedByReward[rewardName]) {
          groupedByReward[rewardName] = { pending: 0, approved: 0, rejected: 0, total: 0 }
        }

        groupedByReward[rewardName].total += 1

        if (redemption.status === "pending") {
          groupedByReward[rewardName].pending += 1
        } else if (redemption.status === "approved") {
          groupedByReward[rewardName].approved += 1
        } else if (redemption.status === "rejected") {
          groupedByReward[rewardName].rejected += 1
        }
      })

      // Convert to array for chart
      const chartData = Object.keys(groupedByReward).map((reward) => ({
        name: reward,
        Pendientes: groupedByReward[reward].pending,
        Aprobados: groupedByReward[reward].approved,
        Rechazados: groupedByReward[reward].rejected,
        Total: groupedByReward[reward].total,
      }))

      // Sort by total redemptions
      chartData.sort((a, b) => b.Total - a.Total)

      setData(chartData)
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
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-yellow-500"></div>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">No hay datos disponibles</p>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
        margin={{
          top: 20,
          right: 30,
          left: 20,
          bottom: 100,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="Pendientes" stackId="a" fill="#facc15" />
        <Bar dataKey="Aprobados" stackId="a" fill="#4ade80" />
        <Bar dataKey="Rechazados" stackId="a" fill="#f87171" />
      </BarChart>
    </ResponsiveContainer>
  )
}
