import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Problem {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  is_urgent: boolean;
  created_at: string;
  profiles?: { full_name: string };
}

export function ProblemsSection() {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchProblems();

    const channel = supabase
      .channel("problems-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "problems" }, () => {
        fetchProblems();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchProblems = async () => {
    const { data } = await supabase
      .from("problems")
      .select("*")
      .order("created_at", { ascending: false });

    if (!data) return;

    // Fetch profile names separately
    const problemsWithProfiles = await Promise.all(
      data.map(async (problem) => {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("user_id", problem.submitted_by)
          .single();

        return {
          ...problem,
          profiles: profile || { full_name: "Unknown" },
        };
      })
    );

    setProblems(problemsWithProfiles);
  };

  const updateStatus = async (id: string, newStatus: string) => {
    await supabase.from("problems").update({ status: newStatus }).eq("id", id);
    fetchProblems();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case "in_progress":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "resolved":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      default:
        return "bg-gray-500/10 text-gray-500 border-gray-500/20";
    }
  };

  const filteredProblems = problems.filter((problem) => {
    const matchesStatus = statusFilter === "all" || problem.status === statusFilter;
    const matchesCategory = categoryFilter === "all" || problem.category === categoryFilter;
    const matchesSearch = problem.title.toLowerCase().includes(search.toLowerCase()) || problem.description.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesCategory && matchesSearch;
  });

  const uniqueCategories = Array.from(new Set(problems.map((p) => p.category)));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <CardTitle>All Problems</CardTitle>
            <div className="flex items-center gap-4 flex-wrap">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search problems..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 w-64" />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {uniqueCategories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredProblems.map((problem) => (
              <Card key={problem.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{problem.title}</h3>
                        {problem.is_urgent && (
                          <Badge variant="destructive" className="text-xs">
                            URGENT
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{problem.description}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>By {problem.profiles?.full_name || "Unknown"}</span>
                        <span>•</span>
                        <span>{formatDistanceToNow(new Date(problem.created_at), { addSuffix: true })}</span>
                        <span>•</span>
                        <Badge variant="outline">{problem.category}</Badge>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Badge className={getStatusColor(problem.status)}>{problem.status.replace("_", " ")}</Badge>
                      <Select value={problem.status} onValueChange={(value) => updateStatus(problem.id, value)}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="resolved">Resolved</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
