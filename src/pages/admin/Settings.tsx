import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Store, Bell, Truck, Palette, Save, Loader2, LayoutDashboard, Plus, Trash2, GripVertical,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ImageUpload } from "@/components/admin/ImageUpload";

interface HomepageSection {
  id: string;
  title: string;
  category_id: string | null;
  background_image: string | null;
  sort_order: number;
  is_active: boolean;
  product_limit: number;
}

interface Category {
  id: string;
  name: string;
}

export default function AdminSettings() {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  // Store Settings
  const [storeSettings, setStoreSettings] = useState({
    storeName: "VendorHub Commerce",
    storeEmail: "contact@vendorhub.com",
    storePhone: "+91 7551120242",
    storeAddress: "123 Business Street, City, Country",
    currency: "INR",
    taxRate: "18",
  });

  // Notification Settings
  const [notificationSettings, setNotificationSettings] = useState({
    orderNotifications: true,
    rfqNotifications: true,
    chatNotifications: true,
    lowStockAlerts: true,
    emailNotifications: true,
  });

  // Shipping Settings
  const [shippingSettings, setShippingSettings] = useState({
    enableShipping: true,
    freeShippingThreshold: "500",
    defaultShippingRate: "10",
    weightMultiplier: "0.5",
  });

  // Homepage Settings
  const [homepageSettings, setHomepageSettings] = useState({
    show_categories: true,
    hide_category_title_with_banner: false,
  });

  // Homepage Sections
  const [sections, setSections] = useState<HomepageSection[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [sectionsLoading, setSectionsLoading] = useState(true);

  useEffect(() => {
    fetchAllSettings();
  }, []);

  const fetchAllSettings = async () => {
    const [homepageRes, storeRes, sectionsRes, catsRes] = await Promise.all([
      supabase.from("site_settings").select("*").eq("key", "homepage").maybeSingle(),
      supabase.from("site_settings").select("*").eq("key", "store").maybeSingle(),
      supabase.from("homepage_sections").select("*").order("sort_order"),
      supabase.from("categories").select("id, name").eq("is_active", true).order("name"),
    ]);

    if (homepageRes.data?.value) {
      const v = homepageRes.data.value as any;
      setHomepageSettings({
        show_categories: v.show_categories ?? true,
        hide_category_title_with_banner: v.hide_category_title_with_banner ?? false,
      });
    }

    if (storeRes.data?.value) {
      const v = storeRes.data.value as any;
      setStoreSettings({
        storeName: v.storeName || "VendorHub Commerce",
        storeEmail: v.storeEmail || "contact@vendorhub.com",
        storePhone: v.storePhone || "+91 7551120242",
        storeAddress: v.storeAddress || "",
        currency: v.currency || "INR",
        taxRate: v.taxRate || "18",
      });
    }

    setSections(sectionsRes.data || []);
    setCategories(catsRes.data || []);
    setSectionsLoading(false);
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    await Promise.all([
      supabase.from("site_settings").upsert({ key: "homepage", value: homepageSettings as any }, { onConflict: "key" }),
      supabase.from("site_settings").upsert({ key: "store", value: storeSettings as any }, { onConflict: "key" }),
    ]);
    toast({ title: "Settings Saved", description: "Your settings have been updated successfully." });
    setIsSaving(false);
  };

  // Homepage Sections CRUD
  const addSection = async () => {
    const { data, error } = await supabase
      .from("homepage_sections")
      .insert({ title: "New Section", sort_order: sections.length })
      .select()
      .single();
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    setSections(prev => [...prev, data]);
    toast({ title: "Section Added" });
  };

  const updateSection = async (id: string, updates: Partial<HomepageSection>) => {
    const { error } = await supabase.from("homepage_sections").update(updates).eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setSections(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
    }
  };

  const deleteSection = async (id: string) => {
    const { error } = await supabase.from("homepage_sections").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setSections(prev => prev.filter(s => s.id !== id));
      toast({ title: "Section Deleted" });
    }
  };

  const currencySymbol = storeSettings.currency === "INR" ? "₹" : "$";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground">Manage your store configuration</p>
        </div>
        <Button onClick={handleSaveSettings} className="bg-gradient-accent gap-2" disabled={isSaving}>
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Changes
        </Button>
      </div>

      <Tabs defaultValue="store" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5">
          <TabsTrigger value="store" className="gap-2">
            <Store className="h-4 w-4" />
            <span className="hidden sm:inline">Store</span>
          </TabsTrigger>
          <TabsTrigger value="homepage" className="gap-2">
            <LayoutDashboard className="h-4 w-4" />
            <span className="hidden sm:inline">Homepage</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="shipping" className="gap-2">
            <Truck className="h-4 w-4" />
            <span className="hidden sm:inline">Shipping</span>
          </TabsTrigger>
          <TabsTrigger value="appearance" className="gap-2">
            <Palette className="h-4 w-4" />
            <span className="hidden sm:inline">Appearance</span>
          </TabsTrigger>
        </TabsList>

        {/* Store Settings */}
        <TabsContent value="store">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="h-5 w-5" />
                Store Information
              </CardTitle>
              <CardDescription>Basic information about your store</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="storeName">Store Name</Label>
                  <Input id="storeName" value={storeSettings.storeName} onChange={(e) => setStoreSettings(prev => ({ ...prev, storeName: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="storeEmail">Contact Email</Label>
                  <Input id="storeEmail" type="email" value={storeSettings.storeEmail} onChange={(e) => setStoreSettings(prev => ({ ...prev, storeEmail: e.target.value }))} />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="storePhone">Phone Number</Label>
                  <Input id="storePhone" value={storeSettings.storePhone} onChange={(e) => setStoreSettings(prev => ({ ...prev, storePhone: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select value={storeSettings.currency} onValueChange={(v) => setStoreSettings(prev => ({ ...prev, currency: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INR">INR (₹)</SelectItem>
                      <SelectItem value="USD">USD ($)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="storeAddress">Store Address</Label>
                <Textarea id="storeAddress" value={storeSettings.storeAddress} onChange={(e) => setStoreSettings(prev => ({ ...prev, storeAddress: e.target.value }))} rows={2} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="taxRate">Default Tax Rate (%)</Label>
                <Input id="taxRate" type="number" value={storeSettings.taxRate} onChange={(e) => setStoreSettings(prev => ({ ...prev, taxRate: e.target.value }))} className="w-32" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Homepage Settings */}
        <TabsContent value="homepage">
          <div className="space-y-6">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LayoutDashboard className="h-5 w-5" />
                  Homepage Options
                </CardTitle>
                <CardDescription>Control which sections appear on your homepage</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Show "Shop by Category" Section</Label>
                    <p className="text-sm text-muted-foreground">Display the category grid on the homepage</p>
                  </div>
                  <Switch checked={homepageSettings.show_categories} onCheckedChange={(checked) => setHomepageSettings(prev => ({ ...prev, show_categories: checked }))} />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Hide Category Title When Banner Exists</Label>
                    <p className="text-sm text-muted-foreground">When a category has a banner image, hide the text title overlay</p>
                  </div>
                  <Switch checked={homepageSettings.hide_category_title_with_banner} onCheckedChange={(checked) => setHomepageSettings(prev => ({ ...prev, hide_category_title_with_banner: checked }))} />
                </div>
              </CardContent>
            </Card>

            {/* Homepage Sections Management */}
            <Card className="shadow-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Product Sections</CardTitle>
                    <CardDescription>Add custom product sections to the homepage (like "Featured Products")</CardDescription>
                  </div>
                  <Button onClick={addSection} size="sm" className="bg-accent hover:bg-accent-hover">
                    <Plus className="h-4 w-4 mr-1" /> Add Section
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {sectionsLoading ? (
                  <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
                ) : sections.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No sections yet. Click "Add Section" to create one.</p>
                ) : (
                  <div className="space-y-4">
                    {sections.map((section) => (
                      <div key={section.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <GripVertical className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium text-sm">{section.title}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Switch checked={section.is_active} onCheckedChange={(v) => updateSection(section.id, { is_active: v })} />
                            <Button variant="ghost" size="icon" onClick={() => deleteSection(section.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-3">
                          <div>
                            <Label className="text-xs">Section Title</Label>
                            <Input
                              value={section.title}
                              onChange={(e) => setSections(prev => prev.map(s => s.id === section.id ? { ...s, title: e.target.value } : s))}
                              onBlur={() => updateSection(section.id, { title: section.title })}
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Category Filter</Label>
                            <Select value={section.category_id || "all"} onValueChange={(v) => updateSection(section.id, { category_id: v === "all" ? null : v })}>
                              <SelectTrigger><SelectValue placeholder="All categories" /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">All Categories</SelectItem>
                                {categories.map(cat => (<SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-3">
                          <div>
                            <Label className="text-xs">Product Limit</Label>
                            <Input
                              type="number"
                              value={section.product_limit}
                              onChange={(e) => setSections(prev => prev.map(s => s.id === section.id ? { ...s, product_limit: parseInt(e.target.value) || 12 } : s))}
                              onBlur={() => updateSection(section.id, { product_limit: section.product_limit })}
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Sort Order</Label>
                            <Input
                              type="number"
                              value={section.sort_order}
                              onChange={(e) => setSections(prev => prev.map(s => s.id === section.id ? { ...s, sort_order: parseInt(e.target.value) || 0 } : s))}
                              onBlur={() => updateSection(section.id, { sort_order: section.sort_order })}
                            />
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs mb-1 block">Background Image (optional)</Label>
                          <ImageUpload value={section.background_image || ""} onChange={(url) => updateSection(section.id, { background_image: url || null })} bucket="product-images" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5" /> Notification Preferences</CardTitle>
              <CardDescription>Configure how you receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {[
                { key: "orderNotifications", label: "New Order Notifications", desc: "Get notified when new orders are placed" },
                { key: "rfqNotifications", label: "RFQ Notifications", desc: "Get notified when new RFQ requests arrive" },
                { key: "chatNotifications", label: "Chat Notifications", desc: "Get notified when customers send messages" },
                { key: "lowStockAlerts", label: "Low Stock Alerts", desc: "Get alerts when product stock is low" },
                { key: "emailNotifications", label: "Email Notifications", desc: "Receive notifications via email" },
              ].map((item, idx) => (
                <div key={item.key}>
                  {idx > 0 && <Separator className="mb-4" />}
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>{item.label}</Label>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                    <Switch
                      checked={(notificationSettings as any)[item.key]}
                      onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, [item.key]: checked }))}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Shipping Settings */}
        <TabsContent value="shipping">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Truck className="h-5 w-5" /> Shipping Configuration</CardTitle>
              <CardDescription>Configure shipping rates and options</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div><Label>Enable Shipping</Label><p className="text-sm text-muted-foreground">Calculate shipping for orders</p></div>
                <Switch checked={shippingSettings.enableShipping} onCheckedChange={(checked) => setShippingSettings(prev => ({ ...prev, enableShipping: checked }))} />
              </div>
              <Separator />
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Free Shipping Threshold ({currencySymbol})</Label>
                  <Input type="number" value={shippingSettings.freeShippingThreshold} onChange={(e) => setShippingSettings(prev => ({ ...prev, freeShippingThreshold: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Default Shipping Rate ({currencySymbol})</Label>
                  <Input type="number" value={shippingSettings.defaultShippingRate} onChange={(e) => setShippingSettings(prev => ({ ...prev, defaultShippingRate: e.target.value }))} />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance */}
        <TabsContent value="appearance">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Palette className="h-5 w-5" /> Appearance Settings</CardTitle>
              <CardDescription>Customize the look and feel of your store</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Palette className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Theme customization coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
