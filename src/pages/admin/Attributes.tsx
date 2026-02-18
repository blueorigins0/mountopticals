import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, MoreHorizontal, Edit, Trash2, ArrowLeft, Loader2, Tag, Eye, EyeOff } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ImageUpload } from "@/components/admin/ImageUpload";

interface AttributeType {
  id: string;
  name: string;
  slug: string;
}

interface AttributeValue {
  id: string;
  product_id: string;
  attribute_type_id: string;
  label: string;
  value_text: string;
  value_image: string | null;
  sort_order: number;
}

interface Product {
  id: string;
  name: string;
}

export default function AdminAttributes() {
  const [types, setTypes] = useState<AttributeType[]>([]);
  const [values, setValues] = useState<AttributeValue[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showTypeForm, setShowTypeForm] = useState(false);
  const [showValueForm, setShowValueForm] = useState(false);
  const [editingType, setEditingType] = useState<AttributeType | null>(null);
  const [typeForm, setTypeForm] = useState({ name: "", slug: "" });
  const [valueForm, setValueForm] = useState({ product_id: "", attribute_type_id: "", label: "", value_text: "", value_image: "", sort_order: "0", show_on_page: true });
  const [editingValue, setEditingValue] = useState<AttributeValue | null>(null);
  const [filterProduct, setFilterProduct] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const { toast } = useToast();

  const fetchData = async () => {
    setIsLoading(true);
    const [typesRes, valuesRes, productsRes] = await Promise.all([
      supabase.from("product_attribute_types").select("*").order("name"),
      supabase.from("product_attribute_values").select("*").order("sort_order"),
      supabase.from("products").select("id, name").order("name"),
    ]);
    setTypes((typesRes.data as AttributeType[]) || []);
    setValues((valuesRes.data as AttributeValue[]) || []);
    setProducts((productsRes.data as Product[]) || []);
    setIsLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  // Attribute Type CRUD
  const openTypeForm = (t?: AttributeType) => {
    if (t) { setEditingType(t); setTypeForm({ name: t.name, slug: t.slug }); }
    else { setEditingType(null); setTypeForm({ name: "", slug: "" }); }
    setShowTypeForm(true);
  };

  const handleSaveType = async () => {
    if (!typeForm.name) { toast({ title: "Name required", variant: "destructive" }); return; }
    setIsSaving(true);
    const slug = typeForm.slug || typeForm.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    if (editingType) {
      await supabase.from("product_attribute_types").update({ name: typeForm.name, slug }).eq("id", editingType.id);
      toast({ title: "Attribute Updated" });
    } else {
      await supabase.from("product_attribute_types").insert({ name: typeForm.name, slug });
      toast({ title: "Attribute Created" });
    }
    setShowTypeForm(false); setEditingType(null); fetchData(); setIsSaving(false);
  };

  const handleDeleteType = async (id: string) => {
    if (!confirm("Delete this attribute type? All associated values will be removed.")) return;
    await supabase.from("product_attribute_values").delete().eq("attribute_type_id", id);
    await supabase.from("product_attribute_types").delete().eq("id", id);
    toast({ title: "Attribute Deleted" }); fetchData();
  };

  // Attribute Value CRUD
  const openValueForm = (v?: AttributeValue) => {
    if (v) {
      setEditingValue(v);
      setValueForm({ product_id: v.product_id, attribute_type_id: v.attribute_type_id, label: v.label, value_text: v.value_text, value_image: v.value_image || "", sort_order: String(v.sort_order), show_on_page: (v as any).show_on_page ?? true });
    } else {
      setEditingValue(null);
      setValueForm({ product_id: "", attribute_type_id: "", label: "", value_text: "", value_image: "", sort_order: "0", show_on_page: true });
    }
    setShowValueForm(true);
  };

  const handleSaveValue = async () => {
    if (!valueForm.product_id || !valueForm.attribute_type_id || !valueForm.label || !valueForm.value_text) {
      toast({ title: "All fields required", variant: "destructive" }); return;
    }
    setIsSaving(true);
    const data = { product_id: valueForm.product_id, attribute_type_id: valueForm.attribute_type_id, label: valueForm.label, value_text: valueForm.value_text, value_image: valueForm.value_image || null, sort_order: parseInt(valueForm.sort_order) || 0, show_on_page: valueForm.show_on_page };
    if (editingValue) {
      await supabase.from("product_attribute_values").update(data).eq("id", editingValue.id);
      toast({ title: "Value Updated" });
    } else {
      await supabase.from("product_attribute_values").insert(data);
      toast({ title: "Value Created" });
    }
    setShowValueForm(false); setEditingValue(null); fetchData(); setIsSaving(false);
  };

  const handleDeleteValue = async (id: string) => {
    if (!confirm("Delete this value?")) return;
    await supabase.from("product_attribute_values").delete().eq("id", id);
    toast({ title: "Value Deleted" }); fetchData();
  };

  const filteredValues = values.filter(v => {
    if (filterProduct !== "all" && v.product_id !== filterProduct) return false;
    if (filterType !== "all" && v.attribute_type_id !== filterType) return false;
    return true;
  });

  if (showTypeForm) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setShowTypeForm(false)}><ArrowLeft className="h-5 w-5" /></Button>
          <h1 className="text-2xl font-display font-bold">{editingType ? "Edit" : "Create"} Attribute Type</h1>
        </div>
        <Card className="shadow-card"><CardContent className="pt-6 space-y-4">
          <div className="space-y-2"><Label>Name *</Label><Input value={typeForm.name} onChange={e => setTypeForm(p => ({...p, name: e.target.value}))} placeholder="e.g. Frame Dimensions" /></div>
          <div className="space-y-2"><Label>Slug</Label><Input value={typeForm.slug} onChange={e => setTypeForm(p => ({...p, slug: e.target.value}))} placeholder="auto-generated from name" /></div>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={() => setShowTypeForm(false)} className="flex-1">Cancel</Button>
            <Button onClick={handleSaveType} disabled={isSaving} className="flex-1 bg-gradient-accent">{isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}{editingType ? "Update" : "Create"}</Button>
          </div>
        </CardContent></Card>
      </div>
    );
  }

  if (showValueForm) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setShowValueForm(false)}><ArrowLeft className="h-5 w-5" /></Button>
          <h1 className="text-2xl font-display font-bold">{editingValue ? "Edit" : "Add"} Attribute Value</h1>
        </div>
        <Card className="shadow-card"><CardContent className="pt-6 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Product *</Label>
              <Select value={valueForm.product_id} onValueChange={v => setValueForm(p => ({...p, product_id: v}))}>
                <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
                <SelectContent>{products.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Attribute Type *</Label>
              <Select value={valueForm.attribute_type_id} onValueChange={v => setValueForm(p => ({...p, attribute_type_id: v}))}>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>{types.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Label *</Label><Input value={valueForm.label} onChange={e => setValueForm(p => ({...p, label: e.target.value}))} placeholder="e.g. Lens Width" /></div>
            <div className="space-y-2"><Label>Value Text *</Label><Input value={valueForm.value_text} onChange={e => setValueForm(p => ({...p, value_text: e.target.value}))} placeholder="e.g. 58 mm" /></div>
          </div>
          <div className="space-y-2"><Label>Image (optional)</Label><ImageUpload value={valueForm.value_image} onChange={url => setValueForm(p => ({...p, value_image: url}))} bucket="product-images" /></div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Sort Order</Label><Input type="number" value={valueForm.sort_order} onChange={e => setValueForm(p => ({...p, sort_order: e.target.value}))} className="w-32" /></div>
            <div className="flex items-center gap-2 pt-6">
              <Checkbox id="show_on_page" checked={valueForm.show_on_page} onCheckedChange={(checked) => setValueForm(p => ({...p, show_on_page: !!checked}))} />
              <Label htmlFor="show_on_page" className="text-sm cursor-pointer">Show in Features section</Label>
              <span className="text-xs text-muted-foreground">(unchecked = Specifications only)</span>
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={() => setShowValueForm(false)} className="flex-1">Cancel</Button>
            <Button onClick={handleSaveValue} disabled={isSaving} className="flex-1 bg-gradient-accent">{isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}{editingValue ? "Update" : "Create"}</Button>
          </div>
        </CardContent></Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-display font-bold">Product Attributes</h1><p className="text-muted-foreground text-sm">Manage custom attributes like Frame Dimensions</p></div>
      </div>

      {/* Attribute Types */}
      <Card className="shadow-card">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-lg">Attribute Types</h2>
            <Button size="sm" onClick={() => openTypeForm()} className="bg-gradient-accent gap-1"><Plus className="h-4 w-4" />New Type</Button>
          </div>
          {isLoading ? <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div> : types.length === 0 ? (
            <p className="text-center text-muted-foreground py-6">No attribute types yet. Create one like "Frame Dimensions".</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {types.map(t => (
                <div key={t.id} className="flex items-center gap-2 bg-secondary rounded-lg px-3 py-2">
                  <Tag className="h-3.5 w-3.5 text-accent" />
                  <span className="text-sm font-medium">{t.name}</span>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openTypeForm(t)}><Edit className="h-3 w-3" /></Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => handleDeleteType(t.id)}><Trash2 className="h-3 w-3" /></Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Attribute Values */}
      <Card className="shadow-card">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-lg">Attribute Values</h2>
            <Button size="sm" onClick={() => openValueForm()} className="bg-gradient-accent gap-1"><Plus className="h-4 w-4" />Add Value</Button>
          </div>
          <div className="flex gap-3 mb-4">
            <Select value={filterProduct} onValueChange={setFilterProduct}>
              <SelectTrigger className="w-48"><SelectValue placeholder="Filter by product" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Products</SelectItem>
                {products.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-48"><SelectValue placeholder="Filter by type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {types.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {filteredValues.length === 0 ? (
            <p className="text-center text-muted-foreground py-6">No values yet.</p>
          ) : (
            <Table>
              <TableHeader><TableRow><TableHead>Image</TableHead><TableHead>Product</TableHead><TableHead>Type</TableHead><TableHead>Label</TableHead><TableHead>Value</TableHead><TableHead>Features</TableHead><TableHead>Order</TableHead><TableHead className="w-10"></TableHead></TableRow></TableHeader>
              <TableBody>
                {filteredValues.map(v => (
                  <TableRow key={v.id}>
                    <TableCell>{v.value_image ? <img src={v.value_image} alt="" className="w-10 h-10 object-contain rounded" /> : "—"}</TableCell>
                    <TableCell className="text-xs">{products.find(p => p.id === v.product_id)?.name || "—"}</TableCell>
                    <TableCell className="text-xs">{types.find(t => t.id === v.attribute_type_id)?.name || "—"}</TableCell>
                    <TableCell className="font-medium text-sm">{v.label}</TableCell>
                    <TableCell className="font-bold text-sm">{v.value_text}</TableCell>
                    <TableCell>{(v as any).show_on_page ? <Eye className="h-4 w-4 text-success" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}</TableCell>
                    <TableCell>{v.sort_order}</TableCell>
                    <TableCell>
                      <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openValueForm(v)}><Edit className="h-4 w-4 mr-2" />Edit</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDeleteValue(v.id)} className="text-destructive"><Trash2 className="h-4 w-4 mr-2" />Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
