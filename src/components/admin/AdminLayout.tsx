import { useState } from "react";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { LayoutDashboard, FileText, Users, MessageSquare, Settings, BarChart3, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Badge } from "@/components/ui/badge";

interface AdminLayoutProps {
  children: React.ReactNode;
  activeSection: string;
  onSectionChange: (section: string) => void;
  unreadMessages?: number;
}

const menuItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "problems", label: "Problems", icon: FileText },
  { id: "users", label: "Users", icon: Users },
  { id: "messages", label: "Messages", icon: MessageSquare },
  { id: "settings", label: "Settings", icon: Settings },
  { id: "reports", label: "Reports", icon: BarChart3 },
];

export function AdminLayout({ children, activeSection, onSectionChange, unreadMessages = 0 }: AdminLayoutProps) {
  const { userName, signOut } = useAuth();

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar className="border-r">
          <div className="p-4 border-b">
            <div className="flex items-center gap-2">
              <img src="/src/assets/bridgeon-logo.jpg" alt="BridgeOn Logo" className="w-8 h-8 rounded" />
              <span className="font-semibold text-lg">BridgeOn Admin</span>
            </div>
          </div>

          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Navigation</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {menuItems.map((item) => (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton
                        onClick={() => onSectionChange(item.id)}
                        isActive={activeSection === item.id}
                        className="w-full"
                      >
                        <item.icon className="w-4 h-4" />
                        <span>{item.label}</span>
                        {item.id === "messages" && unreadMessages > 0 && (
                          <Badge variant="destructive" className="ml-auto">
                            {unreadMessages}
                          </Badge>
                        )}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <div className="mt-auto p-4 border-t space-y-2">
            <div className="flex items-center gap-2 px-2 py-1">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-semibold text-primary">
                  {userName?.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="text-sm font-medium truncate">{userName}</span>
            </div>
            <div className="flex items-center gap-2 px-2">
              <ThemeToggle />
              <SidebarMenuButton onClick={signOut} className="flex-1">
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </SidebarMenuButton>
            </div>
          </div>
        </Sidebar>

        <main className="flex-1 overflow-auto">
          <header className="sticky top-0 z-10 flex items-center gap-2 border-b bg-background px-4 h-14">
            <SidebarTrigger />
            <h1 className="text-xl font-semibold capitalize">{activeSection}</h1>
          </header>
          <div className="p-6">{children}</div>
        </main>
      </div>
    </SidebarProvider>
  );
}
