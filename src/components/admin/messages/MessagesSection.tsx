import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ConversationList } from "@/components/chat/ConversationList";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { useAuth } from "@/contexts/AuthContext";

interface Conversation {
  id: string;
  student_id: string;
  student_name: string;
  last_message: string | null;
  last_message_at: string;
  unread_by_admin: number;
}

export function MessagesSection() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [selectedStudentName, setSelectedStudentName] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState("");

  useEffect(() => {
    fetchConversations();

    const channel = supabase
      .channel("messages-conversations")
      .on("postgres_changes", { event: "*", schema: "public", table: "conversations" }, () => {
        fetchConversations();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchConversations = async () => {
    const { data } = await supabase
      .from("conversations")
      .select("id, student_id, last_message, last_message_at, unread_by_admin")
      .order("last_message_at", { ascending: false });

    if (!data) return;

    const conversationsWithNames = await Promise.all(
      data.map(async (conv) => {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("user_id", conv.student_id)
          .single();

        return {
          ...conv,
          student_name: profile?.full_name || "Unknown",
        };
      })
    );

    setConversations(conversationsWithNames);
  };

  const handleSelectConversation = (conversationId: string, studentName: string) => {
    const conversation = conversations.find((c) => c.id === conversationId);
    if (!conversation) return;

    setSelectedConversation(conversationId);
    setSelectedStudentName(studentName);
    setSelectedStudentId(conversation.student_id);
  };

  const handleBack = () => {
    setSelectedConversation(null);
    fetchConversations();
  };

  if (!user) return null;

  return (
    <div className="h-[calc(100vh-12rem)]">
      {!selectedConversation ? (
        <ConversationList 
          conversations={conversations}
          onSelectConversation={handleSelectConversation} 
          selectedId={selectedConversation || undefined}
        />
      ) : (
        <ChatWindow 
          conversationId={selectedConversation}
          userId={user.id}
          otherUserId={selectedStudentId}
          otherUserName={selectedStudentName}
          onClose={handleBack}
        />
      )}
    </div>
  );
}
