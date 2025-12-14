import { useEffect, useState } from "react";
import { Switch, Route, Link, useLocation } from "wouter";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Toaster } from "@/components/ui/toaster";
import { supabase } from "@/lib/supabaseClient";
import { MapDialog } from "@/components/MapDialog";
import Home from "@/pages/Home";
import Forum from "@/pages/Forum";
import SignIn from "@/pages/SignIn";
import SignUp from "@/pages/SignUp";
import ForgotPassword from "@/pages/ForgotPassword";
import ItinerariesPage from "@/pages/ItinerariesPage";
import CreateItineraryPage from "@/pages/CreateItineraryPage";
import ItineraryDetailPage from "@/pages/ItineraryDetailPage";
import StocksPage from "@/pages/StocksPage"; // NEW: Import Stocks page
import LoginPage from "@/pages/LoginPage";


function Router({ onOpenMap }) {
  return (
    <Switch>
      <Route path="/">{() => <Home onOpenMap={onOpenMap} />}</Route>
      <Route path="/forum" component={Forum} />
      <Route path="/signin" component={SignIn} />
      <Route path="/signup" component={SignUp} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/itineraries" component={ItinerariesPage} />
      <Route path="/itineraries/create" component={CreateItineraryPage} />
      <Route path="/itineraries/:id" component={ItineraryDetailPage} />
      <Route path="/stocks-predictor" component={StocksPage} /> {/* NEW: Stocks route */}
      <Route path="/login" component={LoginPage} />
      {/* Future routes can be added here */}
    </Switch>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Restore session on refresh
    supabase.auth.getSession().then(({ data }) => {
      setUser(data?.session?.user ?? null);
    });

    // Listen for auth state changes
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setLocation("/signin");
  };

  const getInitials = (nameOrEmail) => {
    if (!nameOrEmail) return "?";
    const parts = nameOrEmail.trim().split(" ");
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const initials =
    user?.user_metadata?.full_name
      ? getInitials(user.user_metadata.full_name)
      : getInitials(user?.email);

  return (
    <ThemeProvider defaultTheme="light">
      <div className="min-h-screen bg-background flex flex-col">
        {/* Header visible across all pages */}
        <header className="w-full border-b">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
            <Link href="/">
              <span className="text-2xl font-bold text-primary cursor-pointer">
                Destinate
              </span>
            </Link>

            {/* Navigation Links */}
            <nav className="hidden md:flex items-center gap-6">
              <Link href="/">
                <span className="text-sm font-medium text-foreground hover:text-primary cursor-pointer transition-colors">
                  Home
                </span>
              </Link>
              <Link href="/itineraries">
                <span className="text-sm font-medium text-foreground hover:text-primary cursor-pointer transition-colors">
                  Destinations
                </span>
              </Link>
              <Link href="/forum">
                <span className="text-sm font-medium text-foreground hover:text-primary cursor-pointer transition-colors">
                  Forum
                </span>
              </Link>
              <a
  href="http://127.0.0.1:5000/login"
  className="text-sm font-medium text-foreground hover:text-primary cursor-pointer transition-colors"
>
  Stocks
</a>

            </nav>

            <div className="flex items-center gap-4">
              <ThemeToggle />
              {user ? (
                <button
                  onClick={handleSignOut}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-primary text-primary-foreground font-bold hover:opacity-80 transition"
                  title="Sign Out"
                >
                  {initials}
                </button>
              ) : (
                <Link href="/signin">
                  <span className="text-sm font-medium text-primary hover:underline cursor-pointer">
                    Sign In
                  </span>
                </Link>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1">
          <Router onOpenMap={() => setIsMapOpen(true)} />
        </main>

        {/* Global Map Dialog - accessible from all pages */}
        <MapDialog open={isMapOpen} onOpenChange={setIsMapOpen} />
      </div>
      <Toaster />
    </ThemeProvider>
  );
}
