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
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Loader2, Send, FileText, AlertCircle } from "lucide-react";
import { z } from "zod";
import { ChatButton } from "@/components/chat/ChatButton";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProfileSettings } from "@/components/shared/ProfileSettings";

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
  is_urgent: boolean;
  created_at: string;
}

const StudentDashboard = () => {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [isUrgent, setIsUrgent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [fetchingProblems, setFetchingProblems] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [adminId, setAdminId] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeTab, setActiveTab] = useState<"submit" | "myProblems" | "profile">("submit");

  useEffect(() => {
    fetchProblems();
    fetchOrCreateConversation();
    fetchUnreadCount();
    
    const problemsChannel = supabase
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

    const conversationsChannel = supabase
      .channel('student-conversations')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
          filter: `student_id=eq.${user?.id}`
        },
        () => {
          fetchUnreadCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(problemsChannel);
      supabase.removeChannel(conversationsChannel);
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

  const fetchOrCreateConversation = async () => {
    if (!user?.id) return;

    // First, get an admin user
    const { data: adminRole } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin")
      .limit(1)
      .single();

    if (adminRole) {
      setAdminId(adminRole.user_id);
    }

    // Check if conversation exists
    const { data: existing } = await supabase
      .from("conversations")
      .select("id")
      .eq("student_id", user.id)
      .maybeSingle();

    if (existing) {
      setConversationId(existing.id);
    } else {
      // Create new conversation
      const { data: newConv, error } = await supabase
        .from("conversations")
        .insert({
          student_id: user.id,
          admin_id: adminRole?.user_id || null,
        })
        .select()
        .single();

      if (!error && newConv) {
        setConversationId(newConv.id);
      }
    }
  };

  const fetchUnreadCount = async () => {
    if (!user?.id) return;

    const { data } = await supabase
      .from("conversations")
      .select("unread_by_student")
      .eq("student_id", user.id)
      .maybeSingle();

    if (data) {
      setUnreadCount(data.unread_by_student || 0);
    }
  };

  const handleOpenChat = () => {
    setShowChat(true);
    // Reset unread count
    if (conversationId) {
      supabase
        .from("conversations")
        .update({ unread_by_student: 0 })
        .eq("id", conversationId)
        .then(() => setUnreadCount(0));
    }
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
        is_urgent: isUrgent,
        submitted_by: user?.id,
      });

      if (error) {
        toast.error("Failed to submit problem");
      } else {
        const message = isUrgent 
          ? "🚨 Urgent problem submitted! Admin will be notified immediately."
          : "Problem submitted successfully!";
        toast.success(message);
        setTitle("");
        setDescription("");
        setCategory("");
        setIsUrgent(false);
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
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/10 to-background p-4 sm:p-6 transition-colors duration-300">
      <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6 animate-fade-in">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="submit">Submit Problem</TabsTrigger>
            <TabsTrigger value="myProblems">My Problems</TabsTrigger>
            <TabsTrigger value="profile">Profile Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="submit">
            <Card className="border-2 border-border shadow-lg hover:shadow-xl smooth-transition">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-xl sm:text-2xl flex items-center gap-2">
              <Send className="h-5 w-5 sm:h-6 sm:w-6 text-primary flex-shrink-0" />
              <span>Submit a Problem</span>
            </CardTitle>
            <CardDescription className="text-sm">Describe your issue and we'll help resolve it</CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-sm font-medium">Problem Title</Label>
                <Input
                  id="title"
                  placeholder="Brief description of the problem"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="border-2 smooth-transition focus:ring-2 focus:ring-primary/50 hover:border-primary/40"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category" className="text-sm font-medium">Category</Label>
                <Select value={category} onValueChange={setCategory} required>
                  <SelectTrigger className="border-2 smooth-transition focus:ring-2 focus:ring-primary/50 hover:border-primary/40">
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
                <Label htmlFor="description" className="text-sm font-medium">Detailed Description</Label>
                <Textarea
                  id="description"
                  placeholder="Please provide as much detail as possible about your problem"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  rows={6}
                  className="border-2 smooth-transition focus:ring-2 focus:ring-primary/50 resize-none hover:border-primary/40"
                />
              </div>

              <div className="flex items-center space-x-3 p-4 rounded-lg border-2 border-destructive/30 bg-destructive/5 smooth-transition hover:border-destructive/50">
                <Checkbox
                  id="urgent"
                  checked={isUrgent}
                  onCheckedChange={(checked) => setIsUrgent(checked as boolean)}
                  className="border-2"
                />
                <div className="flex items-center gap-2 flex-1">
                  <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
                  <Label 
                    htmlFor="urgent" 
                    className="text-sm font-medium cursor-pointer leading-tight"
                  >
                    Mark as <span className="text-destructive font-bold">URGENT/EMERGENCY</span>
                    <span className="block text-xs text-muted-foreground font-normal mt-1">
                      Admin will be notified immediately for quick resolution
                    </span>
                  </Label>
                </div>
              </div>

              <Button
                type="submit" 
                className="w-full smooth-transition hover:scale-105 shadow-md hover:shadow-lg" 
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
          </TabsContent>

          <TabsContent value="myProblems">
        <Card className="border-2 border-border shadow-lg hover:shadow-xl smooth-transition">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-xl sm:text-2xl flex items-center gap-2">
              <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-primary flex-shrink-0" />
              <span>My Submitted Problems</span>
            </CardTitle>
            <CardDescription className="text-sm">Track the status of your submissions</CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
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
                    className="border-2 border-l-4 border-l-primary border-border/50 smooth-transition hover:shadow-lg hover:border-primary/50 hover:-translate-y-1"
                  >
                    <CardContent className="p-4 sm:pt-6 sm:px-6">
                      <div className="flex flex-col sm:flex-row items-start justify-between gap-3 sm:gap-4">
                          <div className="flex-1 w-full min-w-0">
                            <div className="flex items-start gap-2 mb-1">
                              {problem.is_urgent && (
                                <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5 animate-pulse" />
                              )}
                              <h3 className="font-semibold text-base sm:text-lg break-words">{problem.title}</h3>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2 line-clamp-2 break-words">
                              {problem.description}
                            </p>
                            <div className="flex gap-2 flex-wrap">
                              {problem.is_urgent && (
                                <Badge className="text-xs border-2 bg-destructive/10 text-destructive border-destructive/30 animate-pulse">
                                  🚨 URGENT
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
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
          </TabsContent>

          <TabsContent value="profile">
            <ProfileSettings />
          </TabsContent>
        </Tabs>
      </div>

      {/* Chat Components */}
      <ChatButton onClick={handleOpenChat} unreadCount={unreadCount} />
      {showChat && conversationId && adminId && (
        <ChatWindow
          conversationId={conversationId}
          userId={user?.id || ""}
          otherUserId={adminId}
          otherUserName="Admin"
          onClose={() => setShowChat(false)}
        />
      )}
    </div>
  );
};

export default StudentDashboard;
