import { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userRole: "student" | "admin" | null;
  userName: string | null;
  avatarUrl: string | null;
  signUp: (email: string, password: string, role: "student" | "admin", fullName: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  userRole: null,
  userName: null,
  avatarUrl: null,
  signUp: async () => ({ error: null }),
  signIn: async () => ({ error: null }),
  signOut: async () => {},
  refreshProfile: async () => {},
  loading: true,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<"student" | "admin" | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          setTimeout(() => {
            fetchUserRole(session.user.id);
            fetchUserProfile(session.user.id);
          }, 0);
        } else {
          setUserRole(null);
          setUserName(null);
          setAvatarUrl(null);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchUserRole(session.user.id);
        fetchUserProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserRole = async (userId: string) => {
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .single();

    if (!error && data) {
      setUserRole(data.role);
    }
    setLoading(false);
  };

  const fetchUserProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("full_name, avatar_url")
      .eq("user_id", userId)
      .maybeSingle();

    if (!error && data) {
      setUserName(data.full_name);
      setAvatarUrl(data.avatar_url);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchUserProfile(user.id);
    }
  };

  const signUp = async (email: string, password: string, role: "student" | "admin", fullName: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
      },
    });

    if (!error && data.user) {
      const { error: roleError } = await supabase
        .from("user_roles")
        .insert({ user_id: data.user.id, role });
      
      if (roleError) {
        return { error: roleError };
      }

      const { error: profileError } = await supabase
        .from("profiles")
        .insert({ user_id: data.user.id, full_name: fullName });
      
      if (profileError) {
        return { error: profileError };
      }
    }

    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUserRole(null);
    setUserName(null);
    setAvatarUrl(null);
    navigate("/auth");
  };

  return (
    <AuthContext.Provider value={{ user, session, userRole, userName, avatarUrl, signUp, signIn, signOut, refreshProfile, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
