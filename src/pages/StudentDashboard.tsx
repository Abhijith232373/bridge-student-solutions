import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Send, FileText } from "lucide-react";
import { z } from "zod";

const problemSchema = z.object({
  title: z.string().trim().min(5, "Title must be at least 5 characters").max(200, "Title too long"),
  description: z.string().trim().min(10, "Description must be at least 10 characters").max(2000, "Description too long"),
  category: z.string().min(1, "Please select a category"),
});

interface Problem {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  created_at: string;
}

const StudentDashboard = () => {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(false);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [fetchingProblems, setFetchingProblems] = useState(true);

  useEffect(() => {
    fetchProblems();
    
    const channel = supabase
      .channel('student-problems')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'problems',
          filter: `submitted_by=eq.${user?.id}`
        },
        () => {
          fetchProblems();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchProblems = async () => {
    const { data, error } = await supabase
      .from("problems")
      .select("*")
      .eq("submitted_by", user?.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setProblems(data);
    }
    setFetchingProblems(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const validation = problemSchema.safeParse({ title, description, category });
      
      if (!validation.success) {
        toast.error(validation.error.errors[0].message);
        setLoading(false);
        return;
      }

      const { error } = await supabase.from("problems").insert({
        title: title.trim(),
        description: description.trim(),
        category,
        submitted_by: user?.id,
      });

      if (error) {
        toast.error("Failed to submit problem");
      } else {
        toast.success("Problem submitted successfully!");
        setTitle("");
        setDescription("");
        setCategory("");
        fetchProblems();
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/10 to-background p-6">
      <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
        <Card className="border-border/50 shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Send className="h-6 w-6 text-primary" />
              Submit a Problem
            </CardTitle>
            <CardDescription>Describe your issue and we'll help resolve it</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Problem Title</Label>
                <Input
                  id="title"
                  placeholder="Brief description of the problem"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="transition-all focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={category} onValueChange={setCategory} required>
                  <SelectTrigger className="transition-all focus:ring-2 focus:ring-primary">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="technical">Technical Issue</SelectItem>
                    <SelectItem value="academic">Academic Support</SelectItem>
                    <SelectItem value="facilities">Facilities</SelectItem>
                    <SelectItem value="administrative">Administrative</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Detailed Description</Label>
                <Textarea
                  id="description"
                  placeholder="Please provide as much detail as possible about your problem"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  rows={6}
                  className="transition-all focus:ring-2 focus:ring-primary resize-none"
                />
              </div>

              <Button 
                type="submit" 
                className="w-full transition-all hover:scale-[1.02]" 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Submit Problem
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <FileText className="h-6 w-6 text-primary" />
              My Submitted Problems
            </CardTitle>
            <CardDescription>Track the status of your submissions</CardDescription>
          </CardHeader>
          <CardContent>
            {fetchingProblems ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : problems.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No problems submitted yet</p>
            ) : (
              <div className="space-y-3">
                {problems.map((problem) => (
                  <Card 
                    key={problem.id} 
                    className="border-border/30 transition-all hover:shadow-md hover:border-primary/30"
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-1">{problem.title}</h3>
                          <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                            {problem.description}
                          </p>
                          <div className="flex gap-2 flex-wrap">
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

export default StudentDashboard;
