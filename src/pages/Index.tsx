import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, LogOut, FileText, Shield, AlertTriangle } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import StudentDashboard from "./StudentDashboard";
import AdminDashboard from "./AdminDashboard";
import bridgeonLogo from "@/assets/bridgeon-logo.jpg";

const Index = () => {
  const { user, userRole, userName, avatarUrl, signOut, loading } = useAuth();
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
    <div className="min-h-screen transition-colors duration-300">
      <header className="border-b-2 border-border bg-card/80 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 md:px-6 lg:px-8 py-3 md:py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
              <img 
                src={bridgeonLogo} 
                alt="Bridgeon Logo" 
                className="h-8 w-8 sm:h-10 sm:w-10 object-contain rounded-md flex-shrink-0" 
              />
              <div className="min-w-0">
                <h1 className="text-base sm:text-lg md:text-xl font-bold truncate">Bridgeon Portal</h1>
                <p className="text-xs text-muted-foreground hidden xs:block">
                  {userRole === "admin" ? "Admin Dashboard" : "Student Dashboard"}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              <div className="flex items-center gap-2 sm:gap-3">
                <Avatar className="w-9 h-9 sm:w-10 sm:h-10 border-2 border-primary/20 shadow-md">
                  <AvatarImage src={avatarUrl || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                    {userName?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:flex flex-col">
                  <span className="text-sm font-semibold text-foreground">{userName || "User"}</span>
                  {userRole && (
                    <span className="text-xs text-muted-foreground capitalize">
                      {userRole}
                    </span>
                  )}
                </div>
              </div>
              <ThemeToggle />
              <Button 
                variant="outline" 
                onClick={signOut}
                size="sm"
                className="gap-1 sm:gap-2 smooth-transition hover:scale-105 border-2"
              >
                <LogOut className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="animate-fade-in">
        {userRole === "admin" ? (
          <AdminDashboard />
        ) : userRole === "student" ? (
          <StudentDashboard />
        ) : (
          <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-background via-secondary/10 to-background">
            <Card className="max-w-md w-full border-2 border-destructive/50 shadow-xl animate-scale-in">
              <CardHeader className="text-center p-4 sm:p-6">
                <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-destructive" />
                </div>
                <CardTitle className="text-xl sm:text-2xl">Access Denied</CardTitle>
                <CardDescription className="text-sm">
                  You don't have permission to access this page
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center space-y-4 p-4 sm:p-6 pt-0">
                <p className="text-sm text-muted-foreground">
                  Your account doesn't have the required role to view this content.
                  Please contact an administrator if you believe this is an error.
                </p>
                <Button 
                  onClick={signOut}
                  variant="outline"
                  className="w-full smooth-transition border-2 hover:scale-105"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
