import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Check, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface AttributeValue {
  id: string;
  label: string;
  value_text: string;
  value_image: string | null;
  sort_order: number;
  show_on_page: boolean;
  attribute_type: { name: string } | null;
}

interface ProductTabsProps {
  product: {
    id: string;
    name: string;
    description: string | null;
    features: string[] | null;
    weight: number | null;
    length: number | null;
    width: number | null;
    sku: string | null;
    category: { name: string } | null;
    brand: { name: string } | null;
  };
  selectedSize: string | null;
  selectedColor: string | null;
  currentMoq: number;
}

interface Review {
  id: string;
  reviewer_name: string;
  rating: number;
  review_text: string | null;
  created_at: string;
  is_verified: boolean;
}

interface CustomTab {
  id: string;
  tab_title: string;
  tab_content: string;
}

export function ProductTabs({ product, selectedSize, selectedColor, currentMoq }: ProductTabsProps) {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [customTabs, setCustomTabs] = useState<CustomTab[]>([]);
  const [allAttributes, setAllAttributes] = useState<AttributeValue[]>([]);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [reviewerName, setReviewerName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const [reviewsRes, tabsRes, attrsRes] = await Promise.all([
        supabase
          .from("product_reviews")
          .select("id, reviewer_name, rating, review_text, created_at, is_verified")
          .eq("product_id", product.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("product_custom_tabs")
          .select("id, tab_title, tab_content")
          .eq("product_id", product.id)
          .order("sort_order"),
        supabase
          .from("product_attribute_values")
          .select("*, attribute_type:product_attribute_types(name)")
          .eq("product_id", product.id)
          .order("sort_order"),
      ]);
      setReviews((reviewsRes.data as Review[]) || []);
      setCustomTabs((tabsRes.data as CustomTab[]) || []);
      setAllAttributes((attrsRes.data as any) || []);
    };
    fetchData();
  }, [product.id]);

  const avgRating = reviews.length > 0
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : "0";

  const handleSubmitReview = async () => {
    if (!user) {
      toast({ title: "Please login to submit a review", variant: "destructive" });
      return;
    }
    if (!reviewerName.trim()) {
      toast({ title: "Please enter your name", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("product_reviews").insert({
      product_id: product.id,
      user_id: user.id,
      reviewer_name: reviewerName.trim(),
      rating: reviewRating,
      review_text: reviewText.trim() || null,
    });
    setSubmitting(false);
    if (error) {
      toast({ title: "Failed to submit review", variant: "destructive" });
    } else {
      toast({ title: "Review submitted! It will appear after approval." });
      setShowReviewForm(false);
      setReviewText("");
    }
  };

  return (
    <div className="mt-8">
      <Tabs defaultValue="specs" className="w-full">
        <TabsList className="w-full justify-start h-10 p-0 bg-transparent border-b border-border rounded-none overflow-x-auto">
          <TabsTrigger
            value="specs"
            className="text-sm px-6 py-2 rounded-none border-b-2 border-transparent data-[state=active]:border-accent data-[state=active]:bg-transparent"
          >
            SPECIFICATIONS
          </TabsTrigger>
          <TabsTrigger
            value="description"
            className="text-sm px-6 py-2 rounded-none border-b-2 border-transparent data-[state=active]:border-accent data-[state=active]:bg-transparent"
          >
            DESCRIPTION
          </TabsTrigger>
          <TabsTrigger
            value="reviews"
            className="text-sm px-6 py-2 rounded-none border-b-2 border-transparent data-[state=active]:border-accent data-[state=active]:bg-transparent"
          >
            REVIEWS ({reviews.length})
          </TabsTrigger>
          {customTabs.map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={`custom-${tab.id}`}
              className="text-sm px-6 py-2 rounded-none border-b-2 border-transparent data-[state=active]:border-accent data-[state=active]:bg-transparent"
            >
              {tab.tab_title.toUpperCase()}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="specs" className="mt-4">
          <div className="bg-card rounded-lg border border-border overflow-hidden">
            {selectedSize && (
              <SpecRow label="Variant" value={`${selectedSize}${selectedColor ? ` - ${selectedColor}` : ""}`} />
            )}
            <SpecRow label="Type of Product" value={product.category?.name || "Industrial Product"} border />
            {selectedColor && <SpecRow label="Color" value={selectedColor} border />}
            {selectedSize && <SpecRow label="Size" value={selectedSize} border />}
            {product.weight != null && product.weight > 0 && (
              <SpecRow label="Weight" value={`${product.weight} kg`} border />
            )}
            {product.length != null && product.length > 0 && (
              <SpecRow label="Length" value={`${product.length} cm`} border />
            )}
            {product.width != null && product.width > 0 && (
              <SpecRow label="Diameter" value={`${product.width} mm`} border />
            )}
            <SpecRow label="Pack Contains" value={`${currentMoq} Units`} border />
            {product.sku && <SpecRow label="SKU" value={product.sku} border />}
            {product.brand && <SpecRow label="Brand" value={product.brand.name} border />}
            {/* Dynamic attributes from DB */}
            {allAttributes.map((attr) => (
              <SpecRow key={attr.id} label={attr.label} value={attr.value_text} border />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="description" className="mt-4">
          <div className="bg-card rounded-lg border border-border p-4">
            <div className="prose prose-sm max-w-none text-muted-foreground">
              {product.description ? (
                <p>{product.description}</p>
              ) : (
                <p>No detailed description available for this product.</p>
              )}
              {product.features && product.features.filter(f => f.trim()).length > 0 && (
                <ul className="mt-4 space-y-2">
                  {product.features
                    .filter((f) => f.trim().length > 0)
                    .map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-success mt-0.5 shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                </ul>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="reviews" className="mt-4">
          <div className="bg-card rounded-lg border border-border p-4 space-y-4">
            {/* Summary */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl font-bold text-foreground">{avgRating}</span>
                <div>
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`h-4 w-4 ${s <= Math.round(Number(avgRating)) ? "fill-warning text-warning" : "text-muted-foreground/30"}`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">{reviews.length} reviews</p>
                </div>
              </div>
              {user && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setReviewerName(profile?.full_name || "");
                    setShowReviewForm(!showReviewForm);
                  }}
                >
                  Write a Review
                </Button>
              )}
            </div>

            {/* Review Form */}
            {showReviewForm && (
              <div className="border border-border rounded-lg p-4 space-y-3">
                <Input
                  placeholder="Your name"
                  value={reviewerName}
                  onChange={(e) => setReviewerName(e.target.value)}
                  className="h-9 text-sm"
                />
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button key={s} onClick={() => setReviewRating(s)}>
                      <Star
                        className={`h-6 w-6 transition-colors ${s <= reviewRating ? "fill-warning text-warning" : "text-muted-foreground/30 hover:text-warning/50"}`}
                      />
                    </button>
                  ))}
                </div>
                <Textarea
                  placeholder="Write your review (optional)"
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  rows={3}
                  className="text-sm"
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSubmitReview} disabled={submitting}>
                    {submitting ? "Submitting..." : "Submit Review"}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setShowReviewForm(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {/* Review List */}
            {reviews.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No reviews yet. Be the first to review this product!
              </p>
            ) : (
              <div className="space-y-4 divide-y divide-border">
                {reviews.map((review) => (
                  <div key={review.id} className="pt-4 first:pt-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">{review.reviewer_name}</span>
                        {review.is_verified && (
                          <span className="text-[10px] bg-success/10 text-success px-1.5 py-0.5 rounded">Verified</span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(review.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-0.5 mb-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`h-3 w-3 ${s <= review.rating ? "fill-warning text-warning" : "text-muted-foreground/30"}`}
                        />
                      ))}
                    </div>
                    {review.review_text && (
                      <p className="text-sm text-muted-foreground">{review.review_text}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {customTabs.map((tab) => (
          <TabsContent key={tab.id} value={`custom-${tab.id}`} className="mt-4">
            <div className="bg-card rounded-lg border border-border p-4">
              <div className="prose prose-sm max-w-none text-muted-foreground" dangerouslySetInnerHTML={{ __html: tab.tab_content }} />
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

function SpecRow({ label, value, border }: { label: string; value: string; border?: boolean }) {
  return (
    <div className={`grid grid-cols-2 divide-x divide-border text-sm ${border ? "border-t border-border" : ""}`}>
      <div className="p-3 bg-secondary/30">{label}</div>
      <div className="p-3">{value}</div>
    </div>
  );
}
