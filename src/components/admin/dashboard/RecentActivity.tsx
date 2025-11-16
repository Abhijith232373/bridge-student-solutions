import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { FileText, MessageSquare, CheckCircle } from "lucide-react";

interface Activity {
  id: string;
  type: "problem" | "message" | "status";
  description: string;
  timestamp: string;
  user?: string;
}

export function RecentActivity() {
  const [activities, setActivities] = useState<Activity[]>([]);

  useEffect(() => {
    fetchActivities();

    const channel = supabase
      .channel("activity-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "problems" }, () => {
        fetchActivities();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, () => {
        fetchActivities();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchActivities = async () => {
    const { data: problems } = await supabase
      .from("problems")
      .select("id, title, created_at, status, profiles!problems_submitted_by_fkey(full_name)")
      .order("created_at", { ascending: false })
      .limit(5);

    const { data: messages } = await supabase
      .from("messages")
      .select("id, created_at, profiles!messages_sender_id_fkey(full_name)")
      .order("created_at", { ascending: false })
      .limit(5);

    const problemActivities: Activity[] =
      problems?.map((p) => ({
        id: p.id,
        type: "problem" as const,
        description: `${(p.profiles as any)?.full_name || "User"} submitted "${p.title}"`,
        timestamp: p.created_at,
      })) || [];

    const messageActivities: Activity[] =
      messages?.map((m) => ({
        id: m.id,
        type: "message" as const,
        description: `${(m.profiles as any)?.full_name || "User"} sent a message`,
        timestamp: m.created_at,
      })) || [];

    const allActivities = [...problemActivities, ...messageActivities]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);

    setActivities(allActivities);
  };

  const getIcon = (type: Activity["type"]) => {
    switch (type) {
      case "problem":
        return <FileText className="w-4 h-4 text-blue-500" />;
      case "message":
        return <MessageSquare className="w-4 h-4 text-green-500" />;
      case "status":
        return <CheckCircle className="w-4 h-4 text-orange-500" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px]">
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3 pb-3 border-b last:border-0">
                <div className="mt-1">{getIcon(activity.type)}</div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm">{activity.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
