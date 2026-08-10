export type ViewType =
  | 'preowned'
  | 'sell'
  | 'loan-apply'
  | 'loan-calculator'
  | 'new-cars'
  | 'services'
  | 'ai-recommend'
  | 'admin-leads'
  | 'sell-valuation'
  | 'sell-inspection'
  | 'sell-my-listings'
  | 'sell-tracker'
  | 'sell-tips'
  | 'loan-eligibility'
  | 'loan-compare'
  | 'loan-docs'
  | 'loan-faqs'
  | 'loan-track'
  | 'new-launches'
  | 'new-compare'
  | 'new-test-drive'
  | 'new-brochure'
  | 'new-offers'
  | 'services-insurance'
  | 'services-inspection'
  | 'services-rsa'
  | 'services-history'
  | 'services-centers'
  | 'services-wash';

export interface User {
  id: string | number;
  name: string;
  email: string;
  phone: string;
  role: 'Customer' | 'Dealer' | 'Admin' | string;
}

export interface Car {
  id: string;
  make: string;
  model: string;
  year: number;
  price: number;
  city: string;
  image_url?: string;
  created_by?: number | string;
  fuel_type?: string;
  transmission?: string;
  kms_driven?: number;
  owners?: string;
  rto?: string;
  similarity_score?: number;
}
