import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { DashboardSection } from "@/components/admin/dashboard/DashboardSection";
import { ProblemsSection } from "@/components/admin/problems/ProblemsSection";
import { UsersSection } from "@/components/admin/users/UsersSection";
import { MessagesSection } from "@/components/admin/messages/MessagesSection";
import { SettingsSection } from "@/components/admin/settings/SettingsSection";
import { ReportsSection } from "@/components/admin/reports/ReportsSection";

export default function AdminDashboard() {
  const [activeSection, setActiveSection] = useState("dashboard");
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    fetchUnreadMessages();

    const channel = supabase
      .channel("admin-unread")
      .on("postgres_changes", { event: "*", schema: "public", table: "conversations" }, () => {
        fetchUnreadMessages();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchUnreadMessages = async () => {
    const { data } = await supabase.from("conversations").select("unread_by_admin");
    const total = data?.reduce((sum, conv) => sum + (conv.unread_by_admin || 0), 0) || 0;
    setUnreadMessages(total);
  };

  const renderSection = () => {
    switch (activeSection) {
      case "dashboard":
        return <DashboardSection />;
      case "problems":
        return <ProblemsSection />;
      case "users":
        return <UsersSection />;
      case "messages":
        return <MessagesSection />;
      case "settings":
        return <SettingsSection />;
      case "reports":
        return <ReportsSection />;
      default:
        return <DashboardSection />;
    }
  };

  return (
    <AdminLayout activeSection={activeSection} onSectionChange={setActiveSection} unreadMessages={unreadMessages}>
      {renderSection()}
    </AdminLayout>
  );
}
