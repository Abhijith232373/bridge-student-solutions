import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, Shield, Filter } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Problem {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  created_at: string;
  submitted_by: string;
}

const AdminDashboard = () => {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    fetchProblems();
    
    const channel = supabase
      .channel('admin-problems')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'problems'
        },
        () => {
          fetchProblems();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchProblems = async () => {
    const { data, error } = await supabase
      .from("problems")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setProblems(data);
    }
    setLoading(false);
  };

  const updateStatus = async (problemId: string, newStatus: string) => {
    setUpdatingId(problemId);
    const { error } = await supabase
      .from("problems")
      .update({ status: newStatus })
      .eq("id", problemId);

    if (error) {
      toast.error("Failed to update status");
    } else {
      toast.success("Status updated successfully");
      fetchProblems();
    }
    setUpdatingId(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-warning/10 text-warning border-warning/20";
      case "in_progress":
        return "bg-info/10 text-info border-info/20";
      case "resolved":
        return "bg-success/10 text-success border-success/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const filteredProblems = filterStatus === "all" 
    ? problems 
    : problems.filter(p => p.status === filterStatus);

  const stats = {
    total: problems.length,
    pending: problems.filter(p => p.status === "pending").length,
    in_progress: problems.filter(p => p.status === "in_progress").length,
    resolved: problems.filter(p => p.status === "resolved").length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/10 to-background p-6">
      <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
        <Card className="border-border/50 shadow-lg bg-gradient-to-br from-card to-card/50">
          <CardHeader>
            <CardTitle className="text-3xl flex items-center gap-2">
              <Shield className="h-8 w-8 text-primary" />
              Admin Dashboard
            </CardTitle>
            <CardDescription>Manage and resolve student problems</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-lg bg-secondary/50 border border-border/50">
                <p className="text-sm text-muted-foreground">Total Problems</p>
                <p className="text-2xl font-bold text-foreground">{stats.total}</p>
              </div>
              <div className="p-4 rounded-lg bg-warning/5 border border-warning/20">
                <p className="text-sm text-warning">Pending</p>
                <p className="text-2xl font-bold text-warning">{stats.pending}</p>
              </div>
              <div className="p-4 rounded-lg bg-info/5 border border-info/20">
                <p className="text-sm text-info">In Progress</p>
                <p className="text-2xl font-bold text-info">{stats.in_progress}</p>
              </div>
              <div className="p-4 rounded-lg bg-success/5 border border-success/20">
                <p className="text-sm text-success">Resolved</p>
                <p className="text-2xl font-bold text-success">{stats.resolved}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">All Submissions</CardTitle>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredProblems.length === 0 ? (
              <p className="text-center text-muted-foreground py-12">No problems found</p>
            ) : (
              <div className="space-y-4">
                {filteredProblems.map((problem) => (
                  <Card 
                    key={problem.id} 
                    className="border-border/30 transition-all hover:shadow-md hover:border-primary/30"
                  >
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg mb-2">{problem.title}</h3>
                            <p className="text-sm text-muted-foreground mb-3">
                              {problem.description}
                            </p>
                            <div className="flex gap-2 flex-wrap mb-3">
                              <Badge variant="outline" className="text-xs">
                                {problem.category}
                              </Badge>
                              <Badge className={`text-xs ${getStatusColor(problem.status)}`}>
                                {problem.status.replace("_", " ")}
                              </Badge>
                            </div>
                          </div>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {new Date(problem.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        
                        <div className="flex gap-2 pt-2 border-t border-border/50">
                          <Select
                            value={problem.status}
                            onValueChange={(status) => updateStatus(problem.id, status)}
                            disabled={updatingId === problem.id}
                          >
                            <SelectTrigger className="w-[200px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="in_progress">In Progress</SelectItem>
                              <SelectItem value="resolved">Resolved</SelectItem>
                            </SelectContent>
                          </Select>
                          {updatingId === problem.id && (
                            <Loader2 className="h-5 w-5 animate-spin text-primary" />
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
