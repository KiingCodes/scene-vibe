import { useEffect, useRef, useState } from "react";
import { ImagePlus, Loader2, MapPin, Save, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { GlassCard, SectionTitle } from "./GlassCard";
import { uploadVenueImage, useUpdateVenue } from "@/hooks/useVenueOwner";
import type { Club } from "@/hooks/useClubs";

const asGallery = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];

export const VenueProfileEditor = ({ venue }: { venue: Club }) => {
  const update = useUpdateVenue();
  const coverInput = useRef<HTMLInputElement>(null);
  const galleryInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState<"cover" | "gallery" | null>(null);

  const [form, setForm] = useState({
    opening_hours: venue.opening_hours ?? "",
    genre: venue.genre ?? "",
    cover_charge: venue.cover_charge ?? "",
    address: venue.address ?? "",
    area: venue.area ?? "",
    description: venue.description ?? "",
    phone: venue.phone ?? "",
    website: venue.website ?? "",
    instagram: venue.instagram ?? "",
  });

  useEffect(() => {
    setForm({
      opening_hours: venue.opening_hours ?? "",
      genre: venue.genre ?? "",
      cover_charge: venue.cover_charge ?? "",
      address: venue.address ?? "",
      area: venue.area ?? "",
      description: venue.description ?? "",
      phone: venue.phone ?? "",
      website: venue.website ?? "",
      instagram: venue.instagram ?? "",
    });
  }, [venue.id]);

  const gallery = asGallery(venue.gallery);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const saveDetails = () => {
    if (!form.address.trim()) {
      toast.error("Address can't be empty");
      return;
    }
    update.mutate(
      { clubId: venue.id, patch: { ...form, cover_charge: form.cover_charge || null } },
      { onSuccess: () => toast.success("Venue details updated"), onError: (e: Error) => toast.error(e.message) },
    );
  };

  const handleUpload = async (kind: "cover" | "gallery", file?: File | null) => {
    if (!file) return;
    setUploading(kind);
    try {
      const url = await uploadVenueImage(venue.id, file);
      await update.mutateAsync({
        clubId: venue.id,
        patch: kind === "cover" ? { image_url: url } : { gallery: [...gallery, url] },
      });
      toast.success(kind === "cover" ? "Cover image updated" : "Photo added to gallery");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUploading(null);
    }
  };

  const removePhoto = (url: string) =>
    update.mutate(
      { clubId: venue.id, patch: { gallery: gallery.filter((g) => g !== url) } },
      { onSuccess: () => toast.success("Photo removed") },
    );

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <GlassCard glow="violet" className="lg:col-span-2">
        <SectionTitle icon={<ImagePlus className="h-4 w-4" />} title="Cover & Gallery" subtitle="Your banner is the first thing partygoers see" />

        <div className="grid gap-4 md:grid-cols-[minmax(0,320px)_1fr]">
          <div>
            <div className="relative aspect-video overflow-hidden rounded-xl border border-white/10 bg-black/50">
              {venue.image_url ? (
                <img src={venue.image_url} alt={`${venue.name} cover`} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-muted-foreground">No cover image yet</div>
              )}
            </div>
            <input
              ref={coverInput}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleUpload("cover", e.target.files?.[0])}
            />
            <Button
              variant="secondary"
              className="mt-3 w-full"
              disabled={uploading === "cover"}
              onClick={() => coverInput.current?.click()}
            >
              {uploading === "cover" ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ImagePlus className="h-4 w-4 mr-2" />}
              Replace cover image
            </Button>
          </div>

          <div>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {gallery.map((url) => (
                <div key={url} className="group relative aspect-square overflow-hidden rounded-lg border border-white/10">
                  <img src={url} alt="Venue gallery" className="h-full w-full object-cover" />
                  <button
                    aria-label="Remove photo"
                    onClick={() => removePhoto(url)}
                    className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1 bg-black/70 py-1 text-[10px] font-semibold text-rose-300 opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <Trash2 className="h-3 w-3" /> Remove
                  </button>
                </div>
              ))}
              <input
                ref={galleryInput}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleUpload("gallery", e.target.files?.[0])}
              />
              <button
                onClick={() => galleryInput.current?.click()}
                disabled={uploading === "gallery"}
                className="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-white/15 bg-white/5 text-muted-foreground transition-colors hover:border-portal-violet/60 hover:text-foreground"
              >
                {uploading === "gallery" ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
                <span className="text-[10px]">Add photo</span>
              </button>
            </div>
          </div>
        </div>
      </GlassCard>

      <GlassCard glow="cyan" className="lg:col-span-2">
        <SectionTitle icon={<MapPin className="h-4 w-4" />} title="Venue Details" subtitle="Hours, music, entry fee and location" />

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="v-hours" className="text-xs uppercase tracking-widest text-muted-foreground">Operating hours</Label>
            <Input id="v-hours" value={form.opening_hours} onChange={set("opening_hours")} placeholder="Thu–Sat 20:00 – 04:00" className="mt-1.5 bg-white/5 border-white/10" />
          </div>
          <div>
            <Label htmlFor="v-genre" className="text-xs uppercase tracking-widest text-muted-foreground">Music genres</Label>
            <Input id="v-genre" value={form.genre} onChange={set("genre")} placeholder="Amapiano, Afro House" className="mt-1.5 bg-white/5 border-white/10" />
          </div>
          <div>
            <Label htmlFor="v-cover" className="text-xs uppercase tracking-widest text-muted-foreground">Cover charge / entry</Label>
            <Input id="v-cover" value={form.cover_charge} onChange={set("cover_charge")} placeholder="R150 · Free before 22:00" className="mt-1.5 bg-white/5 border-white/10" />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="v-address" className="text-xs uppercase tracking-widest text-muted-foreground">Address</Label>
            <Input id="v-address" value={form.address} onChange={set("address")} className="mt-1.5 bg-white/5 border-white/10" />
          </div>
          <div>
            <Label htmlFor="v-area" className="text-xs uppercase tracking-widest text-muted-foreground">Area / suburb</Label>
            <Input id="v-area" value={form.area} onChange={set("area")} className="mt-1.5 bg-white/5 border-white/10" />
          </div>
          <div>
            <Label htmlFor="v-phone" className="text-xs uppercase tracking-widest text-muted-foreground">Phone</Label>
            <Input id="v-phone" value={form.phone} onChange={set("phone")} className="mt-1.5 bg-white/5 border-white/10" />
          </div>
          <div>
            <Label htmlFor="v-website" className="text-xs uppercase tracking-widest text-muted-foreground">Website</Label>
            <Input id="v-website" value={form.website} onChange={set("website")} className="mt-1.5 bg-white/5 border-white/10" />
          </div>
          <div>
            <Label htmlFor="v-ig" className="text-xs uppercase tracking-widest text-muted-foreground">Instagram</Label>
            <Input id="v-ig" value={form.instagram} onChange={set("instagram")} className="mt-1.5 bg-white/5 border-white/10" />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="v-desc" className="text-xs uppercase tracking-widest text-muted-foreground">About the venue</Label>
            <Textarea id="v-desc" value={form.description} onChange={set("description")} rows={3} className="mt-1.5 bg-white/5 border-white/10" />
          </div>
        </div>

        <Button
          onClick={saveDetails}
          disabled={update.isPending}
          className="mt-4 h-11 w-full font-bold bg-gradient-to-r from-portal-violet via-portal-pink to-portal-cyan text-white hover:opacity-90"
        >
          {update.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Save venue details
        </Button>
      </GlassCard>
    </div>
  );
};

export default VenueProfileEditor;
