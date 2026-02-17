import { useState, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ImagePlus, X, Upload, Loader2, Plus, Link } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  bucket?: string;
  compact?: boolean;
}

export function ImageUpload({ value, onChange, bucket = "product-images", compact = false }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please select an image file", variant: "destructive" });
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Maximum file size is 5MB", variant: "destructive" });
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `products/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      onChange(publicUrl);
      toast({ title: "Image uploaded successfully" });
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    }
    setIsUploading(false);
  };

  const handleUrlSubmit = () => {
    if (urlInput.trim()) {
      onChange(urlInput.trim());
      setUrlInput("");
      setShowUrlInput(false);
    }
  };

  const handleRemove = () => {
    onChange("");
  };

  if (compact) {
    return (
      <div className="space-y-2">
        {value ? (
          <div className="relative">
            <img 
              src={value} 
              alt="Upload" 
              className="w-full aspect-square object-cover rounded border"
            />
            <button
              type="button"
              onClick={handleRemove}
              className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-white rounded-full text-xs flex items-center justify-center"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <div className="flex gap-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="flex-1 h-8"
            >
              {isUploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowUrlInput(!showUrlInput)}
              className="h-8"
            >
              <Link className="h-3 w-3" />
            </Button>
          </div>
        )}
        {showUrlInput && !value && (
          <div className="flex gap-1">
            <Input
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="Image URL"
              className="h-8 text-xs"
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleUrlSubmit())}
            />
            <Button type="button" variant="outline" size="sm" onClick={handleUrlSubmit} className="h-8 px-2">
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {value ? (
        <div className="relative">
          <img 
            src={value} 
            alt="Product" 
            className="w-full aspect-square object-cover rounded-lg border"
          />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 w-6 h-6 bg-destructive text-white rounded-full flex items-center justify-center"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div 
          className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          {isUploading ? (
            <Loader2 className="h-8 w-8 mx-auto text-muted-foreground mb-2 animate-spin" />
          ) : (
            <ImagePlus className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          )}
          <p className="text-sm text-muted-foreground">
            {isUploading ? "Uploading..." : "Click to upload image"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">PNG, JPG, WEBP up to 5MB</p>
        </div>
      )}
      
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="flex-1"
        >
          <Upload className="h-4 w-4 mr-2" />
          Upload
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowUrlInput(!showUrlInput)}
          className="flex-1"
        >
          <Link className="h-4 w-4 mr-2" />
          URL
        </Button>
      </div>

      {showUrlInput && (
        <div className="flex gap-2">
          <Input
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="Enter image URL"
            className="text-sm"
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleUrlSubmit())}
          />
          <Button type="button" variant="outline" size="icon" onClick={handleUrlSubmit}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}

interface GalleryUploadProps {
  value: string[];
  onChange: (urls: string[]) => void;
  bucket?: string;
  maxImages?: number;
}

export function GalleryUpload({ value, onChange, bucket = "product-images", maxImages = 10 }: GalleryUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const remainingSlots = maxImages - value.length;
    if (files.length > remainingSlots) {
      toast({ title: "Too many files", description: `You can only add ${remainingSlots} more images`, variant: "destructive" });
      return;
    }

    setIsUploading(true);
    const uploadedUrls: string[] = [];

    for (const file of files) {
      if (!file.type.startsWith("image/")) continue;
      if (file.size > 5 * 1024 * 1024) continue;

      try {
        const fileExt = file.name.split(".").pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `products/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from(bucket)
          .getPublicUrl(filePath);

        uploadedUrls.push(publicUrl);
      } catch (error) {
        console.error("Upload error:", error);
      }
    }

    if (uploadedUrls.length > 0) {
      onChange([...value, ...uploadedUrls]);
      toast({ title: `${uploadedUrls.length} image(s) uploaded` });
    }
    setIsUploading(false);
  };

  const handleUrlAdd = () => {
    if (urlInput.trim() && value.length < maxImages) {
      onChange([...value, urlInput.trim()]);
      setUrlInput("");
    }
  };

  const handleRemove = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading || value.length >= maxImages}
          className="flex-1"
        >
          {isUploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
          Upload
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowUrlInput(!showUrlInput)}
          disabled={value.length >= maxImages}
          className="flex-1"
        >
          <Link className="h-4 w-4 mr-2" />
          URL
        </Button>
      </div>

      {showUrlInput && (
        <div className="flex gap-2">
          <Input
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="Gallery image URL"
            className="text-sm"
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleUrlAdd())}
          />
          <Button type="button" variant="outline" size="icon" onClick={handleUrlAdd}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      )}

      {value.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {value.map((img, i) => (
            <div key={i} className="relative group">
              <img src={img} alt="" className="w-full aspect-square rounded object-cover border" />
              <button
                type="button"
                onClick={() => handleRemove(i)}
                className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground">{value.length}/{maxImages} images</p>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}
