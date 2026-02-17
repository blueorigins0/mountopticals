import { Helmet } from "react-helmet-async";

interface SEOHeadProps {
  title?: string;
  description?: string;
  canonical?: string;
  ogImage?: string;
  noIndex?: boolean;
}

export function SEOHead({
  title = "VendorHub - Industrial B2B Marketplace",
  description = "Shop industrial machinery, electronics, tools & equipment at wholesale and retail prices. Get bulk quotes instantly.",
  canonical,
  ogImage = "https://lovable.dev/opengraph-image-p98pqg.png",
  noIndex = false,
}: SEOHeadProps) {
  const fullTitle = title.includes("VendorHub") ? title : `${title} | VendorHub`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {noIndex && <meta name="robots" content="noindex, nofollow" />}
      {canonical && <link rel="canonical" href={canonical} />}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:type" content="website" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
    </Helmet>
  );
}
