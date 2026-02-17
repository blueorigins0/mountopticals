import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, MoreHorizontal, Edit, Trash2, ArrowLeft, Loader2, Image as ImageIcon, Megaphone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ImageUpload } from "@/components/admin/ImageUpload";

interface HeroSlide {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string;
  badge_label: string | null;
  cta_text: string | null;
  cta_link: string | null;
  sort_order: number | null;
  is_active: boolean | null;
  show_text: boolean | null;
  show_button: boolean | null;
}

interface PromoBanner {
  id: string;
  title: string;
  offer_text: string | null;
  image_url: string;
  link: string | null;
  sort_order: number | null;
  is_active: boolean | null;
}

export default function AdminHeroSlides() {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [banners, setBanners] = useState<PromoBanner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showSlideForm, setShowSlideForm] = useState(false);
  const [showBannerForm, setShowBannerForm] = useState(false);
  const [editingSlide, setEditingSlide] = useState<HeroSlide | null>(null);
  const [editingBanner, setEditingBanner] = useState<PromoBanner | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [slideForm, setSlideForm] = useState({ title: "", subtitle: "", image_url: "", badge_label: "", cta_text: "Shop Now", cta_link: "/products", sort_order: "0", is_active: true, show_text: true, show_button: true });
  const [bannerForm, setBannerForm] = useState({ title: "", offer_text: "", image_url: "", link: "/products", sort_order: "0", is_active: true });
  const { toast } = useToast();

  const fetchData = async () => {
    setIsLoading(true);
    const [slidesRes, bannersRes] = await Promise.all([
      supabase.from("hero_slides").select("*").order("sort_order"),
      supabase.from("promo_banners").select("*").order("sort_order"),
    ]);
    setSlides((slidesRes.data as HeroSlide[]) || []);
    setBanners((bannersRes.data as PromoBanner[]) || []);
    setIsLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  // Hero Slide CRUD
  const openSlideForm = (slide?: HeroSlide) => {
    if (slide) {
      setEditingSlide(slide);
      setSlideForm({ title: slide.title, subtitle: slide.subtitle || "", image_url: slide.image_url, badge_label: slide.badge_label || "", cta_text: slide.cta_text || "Shop Now", cta_link: slide.cta_link || "/products", sort_order: String(slide.sort_order || 0), is_active: slide.is_active ?? true, show_text: slide.show_text ?? true, show_button: slide.show_button ?? true });
    } else {
      setEditingSlide(null);
      setSlideForm({ title: "", subtitle: "", image_url: "", badge_label: "", cta_text: "Shop Now", cta_link: "/products", sort_order: "0", is_active: true, show_text: true, show_button: true });
    }
    setShowSlideForm(true);
  };

  const handleSaveSlide = async () => {
    if (!slideForm.title || !slideForm.image_url) { toast({ title: "Error", description: "Title and Image are required", variant: "destructive" }); return; }
    setIsSaving(true);
    const data = { title: slideForm.title, subtitle: slideForm.subtitle || null, image_url: slideForm.image_url, badge_label: slideForm.badge_label || null, cta_text: slideForm.cta_text || "Shop Now", cta_link: slideForm.cta_link || "/products", sort_order: parseInt(slideForm.sort_order) || 0, is_active: slideForm.is_active, show_text: slideForm.show_text, show_button: slideForm.show_button };
    if (editingSlide) {
      await supabase.from("hero_slides").update(data).eq("id", editingSlide.id);
      toast({ title: "Slide Updated" });
    } else {
      await supabase.from("hero_slides").insert(data);
      toast({ title: "Slide Created" });
    }
    setShowSlideForm(false); setEditingSlide(null); fetchData(); setIsSaving(false);
  };

  const handleDeleteSlide = async (id: string) => {
    if (!confirm("Delete this slide?")) return;
    await supabase.from("hero_slides").delete().eq("id", id);
    toast({ title: "Slide Deleted" }); fetchData();
  };

  // Promo Banner CRUD
  const openBannerForm = (b?: PromoBanner) => {
    if (b) {
      setEditingBanner(b);
      setBannerForm({ title: b.title, offer_text: b.offer_text || "", image_url: b.image_url, link: b.link || "/products", sort_order: String(b.sort_order || 0), is_active: b.is_active ?? true });
    } else {
      setEditingBanner(null);
      setBannerForm({ title: "", offer_text: "", image_url: "", link: "/products", sort_order: "0", is_active: true });
    }
    setShowBannerForm(true);
  };

  const handleSaveBanner = async () => {
    if (!bannerForm.title || !bannerForm.image_url) { toast({ title: "Error", description: "Title and Image required", variant: "destructive" }); return; }
    setIsSaving(true);
    const data = { title: bannerForm.title, offer_text: bannerForm.offer_text || null, image_url: bannerForm.image_url, link: bannerForm.link || "/products", sort_order: parseInt(bannerForm.sort_order) || 0, is_active: bannerForm.is_active };
    if (editingBanner) {
      await supabase.from("promo_banners").update(data).eq("id", editingBanner.id);
      toast({ title: "Banner Updated" });
    } else {
      await supabase.from("promo_banners").insert(data);
      toast({ title: "Banner Created" });
    }
    setShowBannerForm(false); setEditingBanner(null); fetchData(); setIsSaving(false);
  };

  const handleDeleteBanner = async (id: string) => {
    if (!confirm("Delete this banner?")) return;
    await supabase.from("promo_banners").delete().eq("id", id);
    toast({ title: "Banner Deleted" }); fetchData();
  };

  // If showing a form, render it
  if (showSlideForm) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setShowSlideForm(false)}><ArrowLeft className="h-5 w-5" /></Button>
          <h1 className="text-2xl font-display font-bold">{editingSlide ? "Edit Slide" : "Add Hero Slide"}</h1>
        </div>
        <Card className="shadow-card">
          <CardContent className="pt-6 space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Title *</Label><Input value={slideForm.title} onChange={e => setSlideForm(p => ({...p, title: e.target.value}))} /></div>
              <div className="space-y-2"><Label>Subtitle</Label><Input value={slideForm.subtitle} onChange={e => setSlideForm(p => ({...p, subtitle: e.target.value}))} /></div>
            </div>
            <div className="space-y-2"><Label>Slide Image *</Label><ImageUpload value={slideForm.image_url} onChange={(url) => setSlideForm(p => ({...p, image_url: url}))} bucket="product-images" /></div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Badge Label</Label><Input value={slideForm.badge_label} onChange={e => setSlideForm(p => ({...p, badge_label: e.target.value}))} placeholder="e.g. Top Seller" /></div>
              <div className="space-y-2"><Label>CTA Text</Label><Input value={slideForm.cta_text} onChange={e => setSlideForm(p => ({...p, cta_text: e.target.value}))} /></div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2"><Label>CTA Link</Label><Input value={slideForm.cta_link} onChange={e => setSlideForm(p => ({...p, cta_link: e.target.value}))} /></div>
              <div className="space-y-2"><Label>Sort Order</Label><Input type="number" value={slideForm.sort_order} onChange={e => setSlideForm(p => ({...p, sort_order: e.target.value}))} /></div>
            </div>
            <div className="flex items-center justify-between"><Label>Active</Label><Switch checked={slideForm.is_active} onCheckedChange={c => setSlideForm(p => ({...p, is_active: c}))} /></div>
            <div className="flex items-center justify-between"><Label>Show Text Overlay</Label><Switch checked={slideForm.show_text} onCheckedChange={c => setSlideForm(p => ({...p, show_text: c}))} /></div>
            <div className="flex items-center justify-between"><Label>Show CTA Button</Label><Switch checked={slideForm.show_button} onCheckedChange={c => setSlideForm(p => ({...p, show_button: c}))} /></div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowSlideForm(false)} className="flex-1">Cancel</Button>
              <Button onClick={handleSaveSlide} disabled={isSaving} className="flex-1 bg-gradient-accent">{isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}{editingSlide ? "Update" : "Create"}</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showBannerForm) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setShowBannerForm(false)}><ArrowLeft className="h-5 w-5" /></Button>
          <h1 className="text-2xl font-display font-bold">{editingBanner ? "Edit Banner" : "Add Promo Banner"}</h1>
        </div>
        <Card className="shadow-card">
          <CardContent className="pt-6 space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Title *</Label><Input value={bannerForm.title} onChange={e => setBannerForm(p => ({...p, title: e.target.value}))} /></div>
              <div className="space-y-2"><Label>Offer Text</Label><Input value={bannerForm.offer_text} onChange={e => setBannerForm(p => ({...p, offer_text: e.target.value}))} placeholder="UPTO 40% OFF" /></div>
            </div>
            <div className="space-y-2"><Label>Banner Image *</Label><ImageUpload value={bannerForm.image_url} onChange={(url) => setBannerForm(p => ({...p, image_url: url}))} bucket="product-images" /></div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Link</Label><Input value={bannerForm.link} onChange={e => setBannerForm(p => ({...p, link: e.target.value}))} /></div>
              <div className="space-y-2"><Label>Sort Order</Label><Input type="number" value={bannerForm.sort_order} onChange={e => setBannerForm(p => ({...p, sort_order: e.target.value}))} /></div>
            </div>
            <div className="flex items-center justify-between"><Label>Active</Label><Switch checked={bannerForm.is_active} onCheckedChange={c => setBannerForm(p => ({...p, is_active: c}))} /></div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowBannerForm(false)} className="flex-1">Cancel</Button>
              <Button onClick={handleSaveBanner} disabled={isSaving} className="flex-1 bg-gradient-accent">{isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}{editingBanner ? "Update" : "Create"}</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Hero & Banners</h1>
        <p className="text-muted-foreground text-sm">Manage hero slides and promotional banners</p>
      </div>

      <Tabs defaultValue="hero-slides" className="space-y-6">
        <TabsList>
          <TabsTrigger value="hero-slides" className="gap-2"><ImageIcon className="h-4 w-4" />Hero Slides</TabsTrigger>
          <TabsTrigger value="promo-banners" className="gap-2"><Megaphone className="h-4 w-4" />Promo Banners</TabsTrigger>
        </TabsList>

        <TabsContent value="hero-slides">
          <div className="flex items-center justify-end mb-4">
            <Button onClick={() => openSlideForm()} className="bg-gradient-accent gap-2"><Plus className="h-4 w-4" />Add Slide</Button>
          </div>
          <Card className="shadow-card">
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>
              ) : slides.length === 0 ? (
                <div className="text-center py-12"><ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" /><p className="text-muted-foreground">No slides yet</p></div>
              ) : (
                <Table>
                  <TableHeader><TableRow><TableHead>Image</TableHead><TableHead>Title</TableHead><TableHead>Badge</TableHead><TableHead>Order</TableHead><TableHead>Status</TableHead><TableHead className="w-10"></TableHead></TableRow></TableHeader>
                  <TableBody>
                    {slides.map(slide => (
                      <TableRow key={slide.id}>
                        <TableCell><img src={slide.image_url} alt="" className="w-20 h-12 object-cover rounded" /></TableCell>
                        <TableCell className="font-medium">{slide.title}</TableCell>
                        <TableCell>{slide.badge_label || "—"}</TableCell>
                        <TableCell>{slide.sort_order}</TableCell>
                        <TableCell><span className={`text-xs font-medium px-2 py-0.5 rounded ${slide.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{slide.is_active ? "Active" : "Inactive"}</span></TableCell>
                        <TableCell>
                          <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end"><DropdownMenuItem onClick={() => openSlideForm(slide)}><Edit className="h-4 w-4 mr-2" />Edit</DropdownMenuItem><DropdownMenuItem onClick={() => handleDeleteSlide(slide.id)} className="text-destructive"><Trash2 className="h-4 w-4 mr-2" />Delete</DropdownMenuItem></DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="promo-banners">
          <div className="flex items-center justify-end mb-4">
            <Button onClick={() => openBannerForm()} className="bg-gradient-accent gap-2"><Plus className="h-4 w-4" />Add Banner</Button>
          </div>
          <Card className="shadow-card">
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>
              ) : banners.length === 0 ? (
                <div className="text-center py-12"><Megaphone className="h-12 w-12 mx-auto text-muted-foreground mb-4" /><p className="text-muted-foreground">No banners yet</p></div>
              ) : (
                <Table>
                  <TableHeader><TableRow><TableHead>Image</TableHead><TableHead>Title</TableHead><TableHead>Offer</TableHead><TableHead>Order</TableHead><TableHead>Status</TableHead><TableHead className="w-10"></TableHead></TableRow></TableHeader>
                  <TableBody>
                    {banners.map(b => (
                      <TableRow key={b.id}>
                        <TableCell><img src={b.image_url} alt="" className="w-20 h-12 object-cover rounded" /></TableCell>
                        <TableCell className="font-medium">{b.title}</TableCell>
                        <TableCell>{b.offer_text || "—"}</TableCell>
                        <TableCell>{b.sort_order}</TableCell>
                        <TableCell><span className={`text-xs font-medium px-2 py-0.5 rounded ${b.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{b.is_active ? "Active" : "Inactive"}</span></TableCell>
                        <TableCell>
                          <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end"><DropdownMenuItem onClick={() => openBannerForm(b)}><Edit className="h-4 w-4 mr-2" />Edit</DropdownMenuItem><DropdownMenuItem onClick={() => handleDeleteBanner(b.id)} className="text-destructive"><Trash2 className="h-4 w-4 mr-2" />Delete</DropdownMenuItem></DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
