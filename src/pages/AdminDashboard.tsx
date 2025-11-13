import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, Shield, Filter, Search, AlertCircle, Bell } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Problem {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  is_urgent: boolean;
  created_at: string;
  submitted_by: string;
}

const AdminDashboard = () => {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
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

  const filteredProblems = problems
    .filter(p => filterStatus === "all" || p.status === filterStatus)
    .filter(p => filterCategory === "all" || p.category === filterCategory)
    .filter(p => 
      searchQuery === "" || 
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const uniqueCategories = Array.from(new Set(problems.map(p => p.category)));

  const urgentProblems = problems.filter(p => p.is_urgent && p.status !== "resolved");
  
  const stats = {
    total: problems.length,
    urgent: urgentProblems.length,
    pending: problems.filter(p => p.status === "pending").length,
    in_progress: problems.filter(p => p.status === "in_progress").length,
    resolved: problems.filter(p => p.status === "resolved").length,
  };

  // Sort problems to show urgent ones first
  const sortedFilteredProblems = [...filteredProblems].sort((a, b) => {
    if (a.is_urgent && !b.is_urgent) return -1;
    if (!a.is_urgent && b.is_urgent) return 1;
    return 0;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/10 to-background p-4 sm:p-6 transition-colors duration-300">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 animate-fade-in">
        <Card className="border-2 border-border shadow-xl bg-gradient-to-br from-card to-card/50 hover-lift smooth-transition">
          <CardHeader className="p-4 sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <CardTitle className="text-2xl sm:text-3xl flex items-center gap-2 animate-slide-up">
                  <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-primary flex-shrink-0" />
                  <span>Admin Dashboard</span>
                </CardTitle>
                <CardDescription className="animate-slide-up text-sm">Manage and resolve student problems</CardDescription>
              </div>
              {stats.urgent > 0 && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border-2 border-destructive/30 animate-pulse">
                  <Bell className="h-5 w-5 text-destructive" />
                  <span className="text-sm font-bold text-destructive">{stats.urgent} Urgent!</span>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
              <div className="p-3 sm:p-4 rounded-lg bg-destructive/5 border-2 border-destructive/30 shadow-md hover-lift smooth-transition animate-scale-in" style={{animationDelay: '0.05s'}}>
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-destructive" />
                  <p className="text-xs sm:text-sm text-destructive font-bold">Urgent</p>
                </div>
                <p className="text-xl sm:text-2xl font-bold text-destructive">{stats.urgent}</p>
              </div>
              <div className="p-3 sm:p-4 rounded-lg bg-secondary/50 border-2 border-border shadow-md hover-lift smooth-transition animate-scale-in" style={{animationDelay: '0.1s'}}>
                <p className="text-xs sm:text-sm text-muted-foreground">Total Problems</p>
                <p className="text-xl sm:text-2xl font-bold text-foreground">{stats.total}</p>
              </div>
              <div className="p-3 sm:p-4 rounded-lg bg-warning/5 border-2 border-warning/30 shadow-md hover-lift smooth-transition animate-scale-in" style={{animationDelay: '0.2s'}}>
                <p className="text-xs sm:text-sm text-warning">Pending</p>
                <p className="text-xl sm:text-2xl font-bold text-warning">{stats.pending}</p>
              </div>
              <div className="p-3 sm:p-4 rounded-lg bg-info/5 border-2 border-info/30 shadow-md hover-lift smooth-transition animate-scale-in" style={{animationDelay: '0.3s'}}>
                <p className="text-xs sm:text-sm text-info">In Progress</p>
                <p className="text-xl sm:text-2xl font-bold text-info">{stats.in_progress}</p>
              </div>
              <div className="p-3 sm:p-4 rounded-lg bg-success/5 border-2 border-success/30 shadow-md hover-lift smooth-transition animate-scale-in" style={{animationDelay: '0.4s'}}>
                <p className="text-xs sm:text-sm text-success">Resolved</p>
                <p className="text-xl sm:text-2xl font-bold text-success">{stats.resolved}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-border shadow-lg smooth-transition hover-lift">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-lg sm:text-xl mb-4">All Submissions</CardTitle>
            <div className="flex flex-col sm:flex-col md:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search problems..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 border-2 smooth-transition focus:ring-2 focus:ring-primary/50 hover:border-primary/40"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-full sm:w-[150px] border-2 smooth-transition">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="w-full sm:w-[150px] border-2 smooth-transition">
                    <SelectValue placeholder="Category" />
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
          <CardContent className="p-4 sm:p-6 pt-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : sortedFilteredProblems.length === 0 ? (
              <p className="text-center text-muted-foreground py-12">No problems found</p>
            ) : (
              <div className="space-y-4">
                {sortedFilteredProblems.map((problem, index) => (
                  <Card 
                    key={problem.id} 
                    className={`border-2 border-l-4 ${
                      problem.is_urgent 
                        ? 'border-l-destructive border-destructive/50 bg-destructive/5' 
                        : 'border-l-primary border-border/50'
                    } hover-lift smooth-transition animate-slide-up hover:shadow-xl hover:-translate-y-1`}
                    style={{animationDelay: `${index * 0.05}s`}}
                  >
                    <CardContent className="p-4 sm:pt-6 sm:px-6">
                      <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row items-start justify-between gap-3 sm:gap-4">
                          <div className="flex-1 w-full min-w-0">
                            <div className="flex items-start gap-2 mb-2">
                              {problem.is_urgent && (
                                <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5 animate-pulse" />
                              )}
                              <h3 className="font-semibold text-base sm:text-lg break-words">{problem.title}</h3>
                            </div>
                            <p className="text-sm text-muted-foreground mb-3 break-words">
                              {problem.description}
                            </p>
                            <div className="flex gap-2 flex-wrap mb-3">
                              {problem.is_urgent && (
                                <Badge className="text-xs border-2 bg-destructive/10 text-destructive border-destructive/30 animate-pulse">
                                  🚨 URGENT - Needs Immediate Attention
                                </Badge>
                              )}
                              <Badge variant="outline" className="text-xs border-2">
                                {problem.category}
                              </Badge>
                              <Badge className={`text-xs border ${getStatusColor(problem.status)}`}>
                                {problem.status.replace("_", " ")}
                              </Badge>
                            </div>
                          </div>
                          <span className="text-xs text-muted-foreground whitespace-nowrap self-start sm:self-auto">
                            {new Date(problem.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t-2 border-border">
                          <Select
                            value={problem.status}
                            onValueChange={(status) => updateStatus(problem.id, status)}
                            disabled={updatingId === problem.id}
                          >
                            <SelectTrigger className="w-full sm:w-[200px] border-2">
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
