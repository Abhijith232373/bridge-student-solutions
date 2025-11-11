import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, LogOut, FileText, Shield } from "lucide-react";
import StudentDashboard from "./StudentDashboard";
import AdminDashboard from "./AdminDashboard";
import bridgeonLogo from "@/assets/bridgeon-logo.jpg";

const Index = () => {
  const { user, userRole, userName, signOut, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-secondary/20 to-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={bridgeonLogo} alt="Bridgeon Logo" className="h-10 w-10 object-contain" />
            <div>
              <h1 className="text-xl font-bold">Bridgeon Portal</h1>
              <p className="text-xs text-muted-foreground">
                {userRole === "admin" ? "Admin Dashboard" : "Student Dashboard"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground hidden sm:block">
              <span className="font-medium text-foreground">{userName || user.email}</span>
              <span className="mx-2">•</span>
              <span className="capitalize">{userRole}</span>
            </div>
            <Button 
              variant="outline" 
              onClick={signOut}
              className="gap-2 transition-all hover:scale-[1.02]"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {userRole === "admin" ? <AdminDashboard /> : <StudentDashboard />}
    </div>
  );
};

export default Index;
