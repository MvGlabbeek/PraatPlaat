import { useState } from "react";
import { useAuth } from "@/lib/authContext";
import { useLocation } from "wouter";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, User, Lock, CircleAlert as AlertCircle } from "lucide-react";

export default function ProfilePage() {
  const { profile, refreshProfile } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [username, setUsername] = useState(profile?.username ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);
    if (!username.trim()) {
      setProfileError("Gebruikersnaam is verplicht");
      return;
    }
    setSavingProfile(true);
    const { error } = await supabase
      .from("profiles")
      .update({ username: username.trim(), updated_at: new Date().toISOString() })
      .eq("id", profile!.id);
    if (error) {
      setProfileError(error.message.includes("duplicate")
        ? "Deze gebruikersnaam is al in gebruik"
        : error.message);
    } else {
      await refreshProfile();
      toast({ title: "Profiel bijgewerkt", description: "Je gebruikersnaam is gewijzigd." });
    }
    setSavingProfile(false);
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    if (newPassword.length < 6) {
      setPasswordError("Nieuw wachtwoord moet minimaal 6 tekens bevatten");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Wachtwoorden komen niet overeen");
      return;
    }
    setSavingPassword(true);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: profile!.email,
      password: currentPassword,
    });
    if (signInError) {
      setPasswordError("Huidig wachtwoord is onjuist");
      setSavingPassword(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      setPasswordError(error.message);
    } else {
      toast({ title: "Wachtwoord gewijzigd", description: "Je wachtwoord is bijgewerkt." });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
    setSavingPassword(false);
  };

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="h-12 border-b bg-card flex items-center px-4 gap-3">
        <button onClick={() => setLocation("/")} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft size={16} />
        </button>
        <h1 className="text-sm font-semibold">Mijn Profiel</h1>
      </header>

      <div className="max-w-lg mx-auto p-6 space-y-6">
        <div className="bg-card border rounded-lg p-5">
          <div className="flex items-center gap-2 mb-4">
            <User size={16} className="text-primary" />
            <h2 className="text-sm font-semibold">Profielgegevens</h2>
          </div>

          {profileError && (
            <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/5 p-3 flex items-start gap-2">
              <AlertCircle size={14} className="text-destructive flex-shrink-0 mt-0.5" />
              <p className="text-xs text-destructive">{profileError}</p>
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs">E-mailadres</Label>
              <Input value={profile.email} disabled className="h-9 text-sm bg-muted" />
              <p className="text-[10px] text-muted-foreground">E-mailadres kan niet gewijzigd worden</p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="username" className="text-xs">Gebruikersnaam</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="h-9 text-sm"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Rol</Label>
              <Input
                value={profile.role === "admin" ? "Administrator" : "Gebruiker"}
                disabled
                className="h-9 text-sm bg-muted"
              />
            </div>

            <Button type="submit" size="sm" className="h-8 text-xs" disabled={savingProfile}>
              <Save size={12} className="mr-1.5" />
              {savingProfile ? "Opslaan..." : "Profiel opslaan"}
            </Button>
          </form>
        </div>

        <div className="bg-card border rounded-lg p-5">
          <div className="flex items-center gap-2 mb-4">
            <Lock size={16} className="text-primary" />
            <h2 className="text-sm font-semibold">Wachtwoord wijzigen</h2>
          </div>

          {passwordError && (
            <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/5 p-3 flex items-start gap-2">
              <AlertCircle size={14} className="text-destructive flex-shrink-0 mt-0.5" />
              <p className="text-xs text-destructive">{passwordError}</p>
            </div>
          )}

          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="current-password" className="text-xs">Huidig wachtwoord</Label>
              <Input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="h-9 text-sm"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="new-password" className="text-xs">Nieuw wachtwoord</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimaal 6 tekens"
                className="h-9 text-sm"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirm-password" className="text-xs">Bevestig nieuw wachtwoord</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="h-9 text-sm"
                required
              />
            </div>

            <Button type="submit" size="sm" className="h-8 text-xs" disabled={savingPassword}>
              <Lock size={12} className="mr-1.5" />
              {savingPassword ? "Wijzigen..." : "Wachtwoord wijzigen"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
