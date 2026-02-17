import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

let cachedLogoUrl: string | null | undefined = undefined;


export function useSiteLogo() {
  const [logoUrl, setLogoUrl] = useState<string | null>(cachedLogoUrl ?? null);

  useEffect(() => {
    if (cachedLogoUrl !== undefined) {
      setLogoUrl(cachedLogoUrl);
      return;
    }

    const fetchLogo = async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "store")
        .maybeSingle();
      const url = (data?.value as any)?.logoUrl || null;
      cachedLogoUrl = url;
      setLogoUrl(url);
    };
    fetchLogo();
  }, []);

  return logoUrl;
}
