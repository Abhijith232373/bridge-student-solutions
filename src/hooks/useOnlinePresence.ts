import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useOnlinePresence = (userId: string | null) => {
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!userId) return;

    const channel = supabase.channel("online-users");

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const users = new Set(
          Object.values(state)
            .flat()
            .map((presence: any) => presence.user_id)
        );
        setOnlineUsers(users);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({
            user_id: userId,
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return { onlineUsers, isOnline: (uid: string) => onlineUsers.has(uid) };
};
