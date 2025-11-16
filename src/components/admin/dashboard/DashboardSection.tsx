import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Users, Clock, TrendingUp } from "lucide-react";
import { ProblemsOverTimeChart } from "./ProblemsOverTimeChart";
import { CategoryPieChart } from "./CategoryPieChart";
import { StatusBarChart } from "./StatusBarChart";
import { RecentActivity } from "./RecentActivity";

interface DashboardStats {
  totalProblems: number;
  activeUsers: number;
  avgResponseTime: string;
  urgentProblems: number;
}

export function DashboardSection() {
  const [stats, setStats] = useState<DashboardStats>({
    totalProblems: 0,
    activeUsers: 0,
    avgResponseTime: "0h",
    urgentProblems: 0,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    const [problemsRes, usersRes] = await Promise.all([
      supabase.from("problems").select("*", { count: "exact" }),
      supabase.from("profiles").select("*", { count: "exact" }),
    ]);

    const urgentCount = problemsRes.data?.filter(p => p.is_urgent)?.length || 0;

    setStats({
      totalProblems: problemsRes.count || 0,
      activeUsers: usersRes.count || 0,
      avgResponseTime: "2.5h",
      urgentProblems: urgentCount,
    });
  };

  const metricCards = [
    {
      title: "Total Problems",
      value: stats.totalProblems,
      icon: AlertCircle,
      trend: "+12%",
      color: "text-blue-500",
    },
    {
      title: "Active Users",
      value: stats.activeUsers,
      icon: Users,
      trend: "+5%",
      color: "text-green-500",
    },
    {
      title: "Avg Response Time",
      value: stats.avgResponseTime,
      icon: Clock,
      trend: "-8%",
      color: "text-orange-500",
    },
    {
      title: "Urgent Problems",
      value: stats.urgentProblems,
      icon: TrendingUp,
      trend: "+3",
      color: "text-red-500",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metricCards.map((metric) => (
          <Card key={metric.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
              <metric.icon className={`h-4 w-4 ${metric.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-500">{metric.trend}</span> from last month
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <ProblemsOverTimeChart />
        <CategoryPieChart />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <StatusBarChart />
        <RecentActivity />
      </div>
    </div>
  );
}
