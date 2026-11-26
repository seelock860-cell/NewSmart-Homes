export type PropertyCategory =
  | 'Luxury Homes'
  | 'Land & Plots'
  | 'Estate Developments'
  | 'Commercial';

export type AvailabilityStatus = 'Available' | 'Under Offer' | 'Sold Out';

export interface Property {
  id: string;
  title: string;
  slug: string;
  category: PropertyCategory;
  location: string;
  price: number;
  priceLabel?: string;
  bedrooms: number;
  bathrooms: number;
  areaSqm: string;
  titleDocument: string;
  availability: AvailabilityStatus;
  featured: boolean;
  description: string;
  features: string[];
  imageUrl: string;
  galleryUrls: string[];
  createdAt: string;
  updatedAt: string;
}

export interface PropertyInput {
  title: string;
  category: PropertyCategory;
  location: string;
  price: number;
  priceLabel?: string;
  bedrooms?: number;
  bathrooms?: number;
  areaSqm: string;
  titleDocument: string;
  availability: AvailabilityStatus;
  featured?: boolean;
  description: string;
  features: string[];
  imageUrl: string;
  galleryUrls?: string[];
}

export type EnquiryStatus = 'New' | 'Contacted' | 'Closed';

export interface Enquiry {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  interest: string;
  propertyId?: string | null;
  propertyTitle?: string | null;
  message: string;
  status: EnquiryStatus;
  createdAt: string;
}

export interface EnquiryInput {
  fullName: string;
  email: string;
  phone: string;
  interest: string;
  propertyId?: string | null;
  propertyTitle?: string | null;
  message: string;
}

export interface AdminStatusResponse {
  needsSetup: boolean;
  authenticated: boolean;
  supabaseConfigured: boolean;
  supabaseAuthEnabled: boolean;
  envPasscodeActive: boolean;
}
