import type { Service } from "../types";

export const DEFAULT_IMAGES: Record<string, string> = {
  "Beauty & Wellness": "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=900&q=80",
  "Education & Coaching": "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=900&q=80",
  "Tech & Business": "https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=900&q=80",
  "Health & Fitness": "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=900&q=80",
  Automotive: "https://images.unsplash.com/photo-1607860108855-64acf2078ed9?auto=format&fit=crop&w=900&q=80",
  General: "https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=900&q=80",
};

export const getServiceImage = (service?: Partial<Service> | null): string => {
  if (!service) return DEFAULT_IMAGES.General;

  if (service.image && service.image.trim()) {
    const trimmed = service.image.trim();
    if (trimmed.startsWith("http") || trimmed.startsWith("data:image")) {
      return trimmed;
    }
  }

  const cat = service.category || "General";
  return DEFAULT_IMAGES[cat] || DEFAULT_IMAGES.General;
};
