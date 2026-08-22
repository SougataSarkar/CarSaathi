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
  created_at?: string;
}

export interface ParsedPriceRange {
  value?: number;
  min?: number;
  max?: number;
}

export interface ToastMessage {
  message: string;
  type: 'success' | 'error' | 'info';
}

export interface LeadBooking {
  id?: number | string;
  car_id: string;
  car_make?: string;
  car_model?: string;
  name: string;
  phone: string;
  date: string;
  time: string;
  status?: string;
  created_at?: string;
}

export interface LeadService {
  id?: number | string;
  service_type: string;
  name: string;
  phone: string;
  city: string;
  date: string;
  status?: string;
  created_at?: string;
}

export interface LeadLoan {
  id?: number | string;
  amount: number;
  interest_rate: number;
  tenure_years: number;
  name: string;
  phone: string;
  income: string;
  employment_type: string;
  credit_score: string;
  status?: string;
  created_at?: string;
}

export interface LeadNewCar {
  id?: number | string;
  car_name: string;
  name: string;
  phone: string;
  email: string;
  city: string;
  status?: string;
  created_at?: string;
}

export interface AdminLeadsData {
  bookings: LeadBooking[];
  services: LeadService[];
  loans: LeadLoan[];
  newCarLeads: LeadNewCar[];
}

export interface BookingFormData {
  name: string;
  phone: string;
  date: string;
  time: string;
}

export interface SellFormData {
  make: string;
  model: string;
  year: number;
  price: string;
  city: string;
  imageUrl: string;
  fuel_type: string;
  transmission: string;
  kms_driven: string;
  owners: string;
  rto: string;
}

export interface LoanFormData {
  name: string;
  phone: string;
  income: string;
  employment: string;
  creditScore: string;
}

export interface NewCarFormData {
  name: string;
  phone: string;
  email: string;
  city: string;
}

export interface ServiceFormData {
  name: string;
  phone: string;
  city: string;
  date: string;
}
