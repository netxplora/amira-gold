import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Camera, Loader2, UserCog, Lock, Bell, Mail, Phone, Globe } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";

type Profile = {
  full_name: string | null; avatar_url: string | null; phone: string | null;
  country: string | null; notify_email: boolean; notify_in_app: boolean;
};

export const Route = createFileRoute("/app/profile")({ component: ProfilePage });

function ProfilePage() {
  const { user } = useAuth();
  const [p, setP] = useState<Profile | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pwd, setPwd] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("full_name,avatar_url,phone,country,notify_email,notify_in_app")
      .eq("id", user.id).maybeSingle()
      .then(({ data }) => setP(data as Profile));
  }, [user]);

  const save = async () => {
    if (!user || !p) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update(p).eq("id", user.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Profile updated");
  };

  const upload = async (file: File) => {
    if (!user) return;
    if (file.size > 5 * 1024 * 1024) return toast.error("Max 5MB");
    setUploading(true);
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${user.id}/avatar-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (upErr) { setUploading(false); return toast.error(upErr.message); }
    const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
    await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("id", user.id);
    setP((prev) => prev ? { ...prev, avatar_url: publicUrl } : prev);
    setUploading(false);
    toast.success("Photo updated");
  };

  const changePwd = async () => {
    if (pwd.length < 8) return toast.error("Password must be 8+ chars");
    const { error } = await supabase.auth.updateUser({ password: pwd });
    if (error) return toast.error(error.message);
    setPwd(""); toast.success("Password changed");
  };

  if (!p) return <div className="text-muted-foreground">Loading…</div>;

  const initials = (p.full_name?.[0] ?? user?.email?.[0] ?? "?").toUpperCase();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        eyebrow="Account"
        title="Profile & Settings"
        subtitle="Manage your personal information, security, and notification preferences."
        icon={<UserCog className="h-6 w-6" />}
      />

      {/* Identity card */}
      <Card className="overflow-hidden border-border/60 bg-card/80">
        <div className="h-24 bg-gradient-to-r from-gold/30 via-gold/10 to-ruby/20" />
        <CardContent className="p-6 pt-0">
          <div className="-mt-12 flex flex-col items-start gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-end gap-4">
              <Avatar className="h-24 w-24 border-4 border-card shadow-gold">
                <AvatarImage src={p.avatar_url ?? undefined} />
                <AvatarFallback className="bg-gradient-gold text-2xl text-gold-foreground">{initials}</AvatarFallback>
              </Avatar>
              <div className="pb-1">
                <div className="text-lg font-bold">{p.full_name || "Your name"}</div>
                <div className="text-sm text-muted-foreground">{user?.email}</div>
              </div>
            </div>
            <div>
              <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading} className="border-gold/40 hover:bg-gold/10">
                {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Camera className="mr-2 h-4 w-4" />}
                Change photo
              </Button>
              <input ref={fileRef} type="file" accept="image/*" hidden
                onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
              <p className="mt-1 text-right text-[11px] text-muted-foreground">JPG/PNG, max 5MB</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personal info */}
      <Card className="border-border/60 bg-card/80">
        <CardContent className="space-y-5 p-6">
          <div className="flex items-center gap-2">
            <UserCog className="h-4 w-4 text-gold" />
            <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Personal information</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label className="text-xs text-muted-foreground">Full name</Label>
              <Input value={p.full_name ?? ""} onChange={(e) => setP({ ...p, full_name: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground"><Mail className="mr-1 inline h-3 w-3" />Email</Label>
              <Input value={user?.email ?? ""} disabled />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground"><Phone className="mr-1 inline h-3 w-3" />Phone</Label>
              <Input value={p.phone ?? ""} onChange={(e) => setP({ ...p, phone: e.target.value })} placeholder="+1 555 0100" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground"><Globe className="mr-1 inline h-3 w-3" />Country</Label>
              <Input value={p.country ?? ""} onChange={(e) => setP({ ...p, country: e.target.value })} placeholder="Switzerland" />
            </div>
          </div>
          <Button onClick={save} disabled={saving} className="bg-gradient-gold text-gold-foreground hover:opacity-90">
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save changes
          </Button>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card className="border-border/60 bg-card/80">
        <CardContent className="space-y-4 p-6">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-gold" />
            <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Notifications</h2>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border/60 bg-background/40 p-4">
            <div>
              <div className="text-sm font-medium">In-app notifications</div>
              <div className="text-xs text-muted-foreground">Bell icon updates, order status, certificates</div>
            </div>
            <Switch checked={p.notify_in_app} onCheckedChange={(v) => setP({ ...p, notify_in_app: v })} />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border/60 bg-background/40 p-4">
            <div>
              <div className="text-sm font-medium">Email notifications</div>
              <div className="text-xs text-muted-foreground">Order confirmations, KYC decisions, security alerts</div>
            </div>
            <Switch checked={p.notify_email} onCheckedChange={(v) => setP({ ...p, notify_email: v })} />
          </div>
        </CardContent>
      </Card>

      {/* Security */}
      <Card className="border-ruby/30 bg-card/80">
        <CardContent className="space-y-4 p-6">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-ruby" />
            <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Security</h2>
          </div>
          <div className="grid gap-3 md:grid-cols-[1fr_auto]">
            <Input type="password" placeholder="New password (8+ chars)" value={pwd} onChange={(e) => setPwd(e.target.value)} />
            <Button onClick={changePwd} variant="outline" className="border-ruby/40 text-ruby hover:bg-ruby/10">Update password</Button>
          </div>
          <p className="text-[11px] text-muted-foreground">Use a strong, unique password. We recommend a password manager.</p>
        </CardContent>
      </Card>
    </div>
  );
}
