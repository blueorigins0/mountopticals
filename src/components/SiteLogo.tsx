import { useSiteLogo } from "@/hooks/useSiteLogo";

interface SiteLogoProps {
  className?: string;
  fallbackText?: string;
  textClassName?: string;
  showText?: boolean;
}

export function SiteLogo({ className = "w-8 h-8", fallbackText = "V", textClassName, showText = false }: SiteLogoProps) {
  const logoUrl = useSiteLogo();

  return (
    <div className="flex items-center gap-1.5 sm:gap-2">
      {logoUrl ? (
        <img src={logoUrl} alt="Logo" className={`${className} object-contain rounded-lg`} />
      ) : (
        <div className={`${className} rounded-lg bg-gradient-accent flex items-center justify-center shadow-sm`}>
          <span className="text-base sm:text-xl font-bold text-accent-foreground">{fallbackText}</span>
        </div>
      )}
      {showText && (
        <span className={textClassName}>
          VendorHub
        </span>
      )}
    </div>
  );
}
