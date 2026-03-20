import { useState } from "react";
import { useAuth } from "@/lib/authContext";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn, UserPlus, CircleAlert as AlertCircle, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const { signIn, signUp } = useAuth();
  const [, setLocation] = useLocation();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

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
    } else {
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
    }
    setLoading(false);
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
          <p className="text-sm text-muted-foreground">
            {mode === "login" ? "Log in op je account" : "Registreer een nieuw account"}
          </p>
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

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs">Wachtwoord</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === "register" ? "Minimaal 6 tekens" : "Je wachtwoord"}
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

            <Button type="submit" className="w-full h-9 text-sm" disabled={loading}>
              {loading ? (
                <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
              ) : mode === "login" ? (
                <><LogIn size={14} className="mr-2" />Inloggen</>
              ) : (
                <><UserPlus size={14} className="mr-2" />Registreren</>
              )}
            </Button>
          </form>

          <div className="mt-4 pt-4 border-t text-center">
            {mode === "login" ? (
              <p className="text-xs text-muted-foreground">
                Nog geen account?{" "}
                <button
                  onClick={() => { setMode("register"); setError(null); setSuccess(null); }}
                  className="text-primary hover:underline font-medium"
                >
                  Registreren
                </button>
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Heb je al een account?{" "}
                <button
                  onClick={() => { setMode("login"); setError(null); setSuccess(null); }}
                  className="text-primary hover:underline font-medium"
                >
                  Inloggen
                </button>
              </p>
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
