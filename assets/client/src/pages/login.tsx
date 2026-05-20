import { useState, useEffect } from "react";
import { useAuth } from "@/lib/authContext";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn, UserPlus, CircleAlert as AlertCircle, Eye, EyeOff, KeyRound, ArrowLeft } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Mode = "login" | "register" | "reset" | "new-password";

export default function LoginPage() {
  const { signIn, signUp } = useAuth();
  const [, setLocation] = useLocation();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      setMode("new-password");
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    if (mode === "login") {
      const { error } = await signIn(email, password);
      if (error) {
        setError(error);
      } else {
        setLocation("/");
      }
    } else if (mode === "register") {
      if (!username.trim()) {
        setError("Gebruikersnaam is verplicht");
        setLoading(false);
        return;
      }
      if (password.length < 6) {
        setError("Wachtwoord moet minimaal 6 tekens bevatten");
        setLoading(false);
        return;
      }
      const { error } = await signUp(email, password, username.trim());
      if (error) {
        setError(error);
      } else {
        setSuccess("Account aangemaakt! Je kunt nu inloggen.");
        setMode("login");
        setPassword("");
      }
    } else if (mode === "reset") {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/#/login`,
      });
      if (error) {
        setError("Er ging iets mis. Controleer het e-mailadres en probeer opnieuw.");
      } else {
        setSuccess("Reset-link verstuurd! Controleer je inbox (ook de spammap).");
      }
    } else if (mode === "new-password") {
      if (password.length < 6) {
        setError("Wachtwoord moet minimaal 6 tekens bevatten");
        setLoading(false);
        return;
      }
      if (password !== confirmPassword) {
        setError("Wachtwoorden komen niet overeen");
        setLoading(false);
        return;
      }
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setError("Kon wachtwoord niet bijwerken. Vraag een nieuwe reset-link aan.");
      } else {
        setSuccess("Wachtwoord bijgewerkt! Je kunt nu inloggen.");
        setMode("login");
        setPassword("");
        setConfirmPassword("");
        window.history.replaceState(null, "", window.location.pathname);
      }
    }

    setLoading(false);
  };

  const switchMode = (newMode: Mode) => {
    setMode(newMode);
    setError(null);
    setSuccess(null);
  };

  const titles: Record<Mode, string> = {
    login: "Log in op je account",
    register: "Registreer een nieuw account",
    reset: "Wachtwoord vergeten",
    "new-password": "Nieuw wachtwoord instellen",
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-3">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-primary">
              <rect x="2" y="2" width="9" height="9" rx="2" fill="currentColor" opacity="0.9"/>
              <rect x="13" y="2" width="9" height="9" rx="2" fill="currentColor" opacity="0.5"/>
              <rect x="2" y="13" width="9" height="9" rx="2" fill="currentColor" opacity="0.5"/>
              <path d="M17.5 13v9M13 17.5h9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.7"/>
            </svg>
            <h1 className="text-xl font-semibold">Praatplaat Studio</h1>
          </div>
          <p className="text-sm text-muted-foreground">{titles[mode]}</p>
        </div>

        <div className="bg-card border rounded-lg p-6 shadow-sm">
          {error && (
            <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/5 p-3 flex items-start gap-2">
              <AlertCircle size={14} className="text-destructive flex-shrink-0 mt-0.5" />
              <p className="text-xs text-destructive">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-4 rounded-md border border-emerald-300 bg-emerald-50 p-3">
              <p className="text-xs text-emerald-700">{success}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <div className="space-y-1.5">
                <Label htmlFor="username" className="text-xs">Gebruikersnaam</Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="bijv. jansen"
                  className="h-9 text-sm"
                  required
                />
              </div>
            )}

            {mode !== "new-password" && (
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs">E-mailadres</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="naam@voorbeeld.nl"
                  className="h-9 text-sm"
                  required
                />
              </div>
            )}

            {(mode === "login" || mode === "register" || mode === "new-password") && (
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs">
                  {mode === "new-password" ? "Nieuw wachtwoord" : "Wachtwoord"}
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimaal 6 tekens"
                    className="h-9 text-sm pr-9"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
            )}

            {mode === "new-password" && (
              <div className="space-y-1.5">
                <Label htmlFor="confirm-password" className="text-xs">Bevestig wachtwoord</Label>
                <Input
                  id="confirm-password"
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Herhaal nieuw wachtwoord"
                  className="h-9 text-sm"
                  required
                />
              </div>
            )}

            {mode === "login" && (
              <div className="flex justify-end -mt-1">
                <button
                  type="button"
                  onClick={() => switchMode("reset")}
                  className="text-xs text-muted-foreground hover:text-primary hover:underline"
                >
                  Wachtwoord vergeten?
                </button>
              </div>
            )}

            <Button type="submit" className="w-full h-9 text-sm" disabled={loading}>
              {loading ? (
                <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
              ) : mode === "login" ? (
                <><LogIn size={14} className="mr-2" />Inloggen</>
              ) : mode === "register" ? (
                <><UserPlus size={14} className="mr-2" />Registreren</>
              ) : mode === "reset" ? (
                <><KeyRound size={14} className="mr-2" />Reset-link versturen</>
              ) : (
                <><KeyRound size={14} className="mr-2" />Wachtwoord opslaan</>
              )}
            </Button>
          </form>

          <div className="mt-4 pt-4 border-t text-center space-y-2">
            {mode === "login" && (
              <p className="text-xs text-muted-foreground">
                Nog geen account?{" "}
                <button
                  onClick={() => switchMode("register")}
                  className="text-primary hover:underline font-medium"
                >
                  Registreren
                </button>
              </p>
            )}
            {(mode === "register" || mode === "reset") && (
              <button
                onClick={() => switchMode("login")}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mx-auto"
              >
                <ArrowLeft size={12} />
                Terug naar inloggen
              </button>
            )}
          </div>
        </div>

        <p className="text-center text-[10px] text-muted-foreground mt-6">
          Created by Bizz4mation
        </p>
      </div>
    </div>
  );
}
