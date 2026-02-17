import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Star, Check, X, Trash2, MessageSquare } from "lucide-react";

interface Review {
  id: string;
  reviewer_name: string;
  rating: number;
  review_text: string | null;
  is_approved: boolean | null;
  is_verified: boolean | null;
  created_at: string;
  product: { name: string } | null;
}

export default function AdminReviews() {
  const { toast } = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "approved">("all");

  const fetchReviews = async () => {
    setLoading(true);
    let query = supabase
      .from("product_reviews")
      .select("id, reviewer_name, rating, review_text, is_approved, is_verified, created_at, product:products(name)")
      .order("created_at", { ascending: false });

    if (filter === "pending") query = query.is("is_approved", null);
    if (filter === "approved") query = query.eq("is_approved", true);

    const { data } = await query;
    setReviews((data as unknown as Review[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchReviews(); }, [filter]);

  const approveReview = async (id: string) => {
    await supabase.from("product_reviews").update({ is_approved: true }).eq("id", id);
    toast({ title: "Review approved" });
    fetchReviews();
  };

  const rejectReview = async (id: string) => {
    await supabase.from("product_reviews").update({ is_approved: false }).eq("id", id);
    toast({ title: "Review rejected" });
    fetchReviews();
  };

  const toggleVerified = async (id: string, current: boolean | null) => {
    await supabase.from("product_reviews").update({ is_verified: !current }).eq("id", id);
    fetchReviews();
  };

  const deleteReview = async (id: string) => {
    await supabase.from("product_reviews").delete().eq("id", id);
    toast({ title: "Review deleted" });
    fetchReviews();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Product Reviews</h1>
          <p className="text-sm text-muted-foreground">Approve, reject, or manage customer reviews</p>
        </div>
        <div className="flex gap-2">
          {(["all", "pending", "approved"] as const).map((f) => (
            <Button
              key={f}
              variant={filter === f ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(f)}
              className="capitalize"
            >
              {f}
            </Button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="text-muted-foreground text-sm">Loading...</p>
      ) : reviews.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No reviews found.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <Card key={review.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-foreground">{review.reviewer_name}</span>
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} className={`h-3 w-3 ${s <= review.rating ? "fill-warning text-warning" : "text-muted-foreground/30"}`} />
                        ))}
                      </div>
                      {review.is_verified && <Badge variant="secondary" className="text-[10px] bg-success/10 text-success">Verified</Badge>}
                      {review.is_approved === null && <Badge variant="secondary" className="text-[10px] bg-warning/10 text-warning">Pending</Badge>}
                      {review.is_approved === true && <Badge variant="secondary" className="text-[10px] bg-success/10 text-success">Approved</Badge>}
                      {review.is_approved === false && <Badge variant="secondary" className="text-[10px] bg-destructive/10 text-destructive">Rejected</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground mb-1">
                      Product: {review.product?.name || "Unknown"} • {new Date(review.created_at).toLocaleDateString()}
                    </p>
                    {review.review_text && (
                      <p className="text-sm text-muted-foreground">{review.review_text}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-8 w-8" title="Approve" onClick={() => approveReview(review.id)}>
                      <Check className="h-4 w-4 text-success" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" title="Reject" onClick={() => rejectReview(review.id)}>
                      <X className="h-4 w-4 text-destructive" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" title="Toggle Verified" onClick={() => toggleVerified(review.id, review.is_verified)}>
                      <Star className="h-4 w-4 text-warning" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" title="Delete" onClick={() => deleteReview(review.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
