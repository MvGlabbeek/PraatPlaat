import { useState } from "react";
import { useAuth, type Profile } from "@/lib/authContext";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft, Shield, Users, Search, Trash2, ShieldCheck, ShieldAlert,
} from "lucide-react";

async function fetchAllProfiles(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data as Profile[];
}

export default function AdminPage() {
  const { profile: currentProfile, isAdmin } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  const { data: profiles = [], isLoading } = useQuery<Profile[]>({
    queryKey: ["admin-profiles"],
    queryFn: fetchAllProfiles,
    enabled: isAdmin,
  });

  const toggleRoleMutation = useMutation({
    mutationFn: async ({ id, newRole }: { id: string; newRole: string }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ role: newRole, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-profiles"] });
      toast({ title: "Rol bijgewerkt" });
    },
    onError: (err: Error) => {
      toast({ title: "Fout", description: err.message, variant: "destructive" });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("profiles").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-profiles"] });
      toast({ title: "Gebruiker verwijderd" });
    },
    onError: (err: Error) => {
      toast({ title: "Fout", description: err.message, variant: "destructive" });
    },
  });

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-2">
          <ShieldAlert size={32} className="mx-auto text-destructive" />
          <p className="text-sm text-muted-foreground">Geen toegang. Alleen voor beheerders.</p>
          <Button size="sm" variant="outline" onClick={() => setLocation("/")}>
            Terug naar editor
          </Button>
        </div>
      </div>
    );
  }

  const filtered = profiles.filter(
    (p) =>
      p.username.toLowerCase().includes(search.toLowerCase()) ||
      p.email.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="h-12 border-b bg-card flex items-center px-4 gap-3">
        <button onClick={() => setLocation("/")} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft size={16} />
        </button>
        <Shield size={16} className="text-primary" />
        <h1 className="text-sm font-semibold">Gebruikersbeheer</h1>
        <span className="ml-auto text-[10px] text-muted-foreground">
          {profiles.length} gebruiker{profiles.length !== 1 ? "s" : ""}
        </span>
      </header>

      <div className="max-w-3xl mx-auto p-6">
        <div className="mb-4 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Zoek op naam of e-mail..."
            className="pl-9 h-9 text-sm"
          />
        </div>

        {isLoading ? (
          <div className="text-center py-8">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-muted-foreground mt-2">Laden...</p>
          </div>
        ) : (
          <div className="bg-card border rounded-lg overflow-hidden">
            <div className="grid grid-cols-[1fr_1.5fr_80px_100px] gap-3 px-4 py-2.5 border-b bg-muted/50 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              <span>Gebruikersnaam</span>
              <span>E-mail</span>
              <span>Rol</span>
              <span className="text-right">Acties</span>
            </div>

            {filtered.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <Users size={24} className="mx-auto text-muted-foreground/30 mb-2" />
                <p className="text-xs text-muted-foreground">
                  {search ? "Geen resultaten gevonden" : "Geen gebruikers"}
                </p>
              </div>
            ) : (
              filtered.map((p) => {
                const isSelf = p.id === currentProfile?.id;
                return (
                  <div
                    key={p.id}
                    className="grid grid-cols-[1fr_1.5fr_80px_100px] gap-3 px-4 py-3 border-b last:border-b-0 items-center hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-[10px] font-semibold text-primary">
                          {p.username.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className="text-xs font-medium truncate">
                        {p.username}
                        {isSelf && <span className="text-[9px] text-muted-foreground ml-1">(jij)</span>}
                      </span>
                    </div>

                    <span className="text-xs text-muted-foreground truncate">{p.email}</span>

                    <span className={`inline-flex items-center gap-1 text-[10px] font-medium ${
                      p.role === "admin" ? "text-amber-600" : "text-muted-foreground"
                    }`}>
                      {p.role === "admin" ? <ShieldCheck size={10} /> : null}
                      {p.role === "admin" ? "Admin" : "Gebruiker"}
                    </span>

                    <div className="flex items-center justify-end gap-1">
                      {!isSelf && (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-[10px] px-2"
                            onClick={() =>
                              toggleRoleMutation.mutate({
                                id: p.id,
                                newRole: p.role === "admin" ? "user" : "admin",
                              })
                            }
                            disabled={toggleRoleMutation.isPending}
                          >
                            {p.role === "admin" ? "Degradeer" : "Promoveer"}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                            onClick={() => {
                              if (confirm(`Weet je zeker dat je ${p.username} wilt verwijderen?`)) {
                                deleteUserMutation.mutate(p.id);
                              }
                            }}
                            disabled={deleteUserMutation.isPending}
                          >
                            <Trash2 size={12} />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
