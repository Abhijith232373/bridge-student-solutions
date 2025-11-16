import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface ChartData {
  date: string;
  total: number;
  urgent: number;
  resolved: number;
}

export function ProblemsOverTimeChart() {
  const [data, setData] = useState<ChartData[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: problems } = await supabase
      .from("problems")
      .select("created_at, is_urgent, status")
      .order("created_at", { ascending: true });

    if (!problems) return;

    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date.toISOString().split("T")[0];
    });

    const chartData = last7Days.map((date) => {
      const dayProblems = problems.filter((p) => p.created_at.startsWith(date));
      return {
        date: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        total: dayProblems.length,
        urgent: dayProblems.filter((p) => p.is_urgent).length,
        resolved: dayProblems.filter((p) => p.status === "resolved").length,
      };
    });

    setData(chartData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Problems Over Time</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="date" className="text-xs" />
            <YAxis className="text-xs" />
            <Tooltip contentStyle={{ backgroundColor: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }} />
            <Legend />
            <Line type="monotone" dataKey="total" stroke="hsl(var(--primary))" name="Total" strokeWidth={2} />
            <Line type="monotone" dataKey="urgent" stroke="hsl(var(--destructive))" name="Urgent" strokeWidth={2} />
            <Line type="monotone" dataKey="resolved" stroke="hsl(142 76% 36%)" name="Resolved" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
