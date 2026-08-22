// ============================================================
// Car helper utilities and constants
// ============================================================

export const POPULAR_BRANDS = ['Maruti Suzuki', 'Hyundai', 'Tata', 'Honda', 'Mahindra', 'Toyota', 'Volkswagen', 'Skoda', 'BMW', 'Audi', 'Mercedes-Benz'];
export const QUICK_BRAND_PILLS = ['City', 'Creta', 'Nexon', 'Seltos', 'Amaze', 'Baleno'];

// Budget extraction helper
export const parseAndExtractBudget = (query: string): { cleanQuery: string; parsedPrice: { value?: number; min?: number; max?: number } | null } => {
  if (!query) return { cleanQuery: '', parsedPrice: null };

  let cleanQuery = query;
  let parsedPrice: { value?: number; min?: number; max?: number } | null = null;

  // 1. Range match: (between )? 8 to 12 lakh / lacs / cr
  const rangeRegex = /(?:between\s+)?(\d+(?:\.\d+)?)\s*(?:to|and|-|till)\s*(\d+(?:\.\d+)?)\s*(lakhs?|lacs?|l|crores?|cr)?/i;
  const rangeMatch = query.match(rangeRegex);
  if (rangeMatch) {
    const val1 = parseFloat(rangeMatch[1]);
    const val2 = parseFloat(rangeMatch[2]);
    const unit = rangeMatch[3] ? rangeMatch[3].toLowerCase() : 'lakh'; // default to lakh
    let multiplier = 100000;
    if (unit.startsWith('c')) {
      multiplier = 10000000;
    }
    parsedPrice = {
      min: val1 * multiplier,
      max: val2 * multiplier
    };
    cleanQuery = query.replace(rangeMatch[0], '').replace(/\s+/g, ' ').trim();
    return { cleanQuery, parsedPrice };
  }

  // 2. Below match: under/below/upto 5 lakh
  const belowRegex = /(?:under|below|up\s*to|upto|less\s*than)\s*(\d+(?:\.\d+)?)\s*(lakhs?|lacs?|l|crores?|cr)?/i;
  const belowMatch = query.match(belowRegex);
  if (belowMatch) {
    const val = parseFloat(belowMatch[1]);
    const unit = belowMatch[2] ? belowMatch[2].toLowerCase() : 'lakh';
    let multiplier = 100000;
    if (unit.startsWith('c')) {
      multiplier = 10000000;
    }
    parsedPrice = {
      value: val * multiplier
    };
    cleanQuery = query.replace(belowMatch[0], '').replace(/\s+/g, ' ').trim();
    return { cleanQuery, parsedPrice };
  }

  // 3. Above match: above/over 5 lakh
  const aboveRegex = /(?:above|over|more\s*than)\s*(\d+(?:\.\d+)?)\s*(lakhs?|lacs?|l|crores?|cr)?/i;
  const aboveMatch = query.match(aboveRegex);
  if (aboveMatch) {
    const val = parseFloat(aboveMatch[1]);
    const unit = aboveMatch[2] ? aboveMatch[2].toLowerCase() : 'lakh';
    let multiplier = 100000;
    if (unit.startsWith('c')) {
      multiplier = 10000000;
    }
    parsedPrice = {
      min: val * multiplier,
      max: 50000000
    };
    cleanQuery = query.replace(aboveMatch[0], '').replace(/\s+/g, ' ').trim();
    return { cleanQuery, parsedPrice };
  }

  // 4. Simple single price: 5 lakh, 10L, 1.2 cr
  const singlePriceRegex = /\b(\d+(?:\.\d+)?)\s*(lakhs?|lacs?|l|crores?|cr)\b/i;
  const singleMatch = query.match(singlePriceRegex);
  if (singleMatch) {
    const val = parseFloat(singleMatch[1]);
    const unit = singleMatch[2].toLowerCase();
    let multiplier = 100000;
    if (unit.startsWith('c')) {
      multiplier = 10000000;
    }
    parsedPrice = {
      value: val * multiplier
    };
    cleanQuery = query.replace(singleMatch[0], '').replace(/\s+/g, ' ').trim();
    return { cleanQuery, parsedPrice };
  }

  return { cleanQuery, parsedPrice };
};

export const isPremiumBrand = (make: string) => ['BMW', 'Audi', 'Mercedes-Benz'].includes(make);

export const getCarFuelType = (car: any) => {
  if (car.fuel_type) return car.fuel_type;
  if (car.model.toLowerCase().includes('nexon')) return 'Petrol';
  if (['Fortuner', 'Scorpio-N', 'Harrier', 'Safari', 'Thar'].includes(car.model)) return 'Diesel';
  return 'Petrol';
};

export const getCarTransmission = (car: any) => {
  if (car.transmission) return car.transmission;
  if (isPremiumBrand(car.make) || car.price > 1800000) return 'Automatic';
  const carHash = typeof car.id === 'string' ? parseInt(car.id.slice(-4), 16) || 0 : car.id || 0;
  return carHash % 3 === 0 ? 'Automatic' : 'Manual';
};

export const CAR_COLORS = ['White', 'Silver', 'Grey', 'Red', 'Blue', 'Black'];
export const getCarColor = (car: any) => {
  const carHash = typeof car.id === 'string' ? parseInt(car.id.slice(-4), 16) || 0 : car.id || 0;
  return CAR_COLORS[carHash % CAR_COLORS.length];
};

// State code mapping based on city
export const getStateCode = (city: string) => {
  switch (city) {
    case 'Delhi': return 'DL-02';
    case 'Mumbai': return 'MH-02';
    case 'Bangalore': return 'KA-03';
    case 'Kolkata': return 'WB-24';
    case 'Chennai': return 'TN-01';
    case 'Pune': return 'MH-12';
    case 'Hyderabad': return 'TS-09';
    default: return 'IND';
  }
};

export const CITY_COORDINATES: { [key: string]: { lat: number; lng: number } } = {
  'Ahmedabad': { lat: 23.0225, lng: 72.5714 },
  'Bangalore': { lat: 12.9716, lng: 77.5946 },
  'Bhopal': { lat: 23.2599, lng: 77.4126 },
  'Chandigarh': { lat: 30.7333, lng: 76.7794 },
  'Chennai': { lat: 13.0827, lng: 80.2707 },
  'Coimbatore': { lat: 11.0168, lng: 76.9558 },
  'Delhi': { lat: 28.6139, lng: 77.2090 },
  'Gurgaon': { lat: 28.4595, lng: 77.0266 },
  'Hyderabad': { lat: 17.3850, lng: 78.4867 },
  'Indore': { lat: 22.7196, lng: 75.8577 },
  'Jaipur': { lat: 26.9124, lng: 75.7873 },
  'Kochi': { lat: 9.9312, lng: 76.2673 },
  'Kolkata': { lat: 22.5726, lng: 88.3639 },
  'Lucknow': { lat: 26.8467, lng: 80.9462 },
  'Mumbai': { lat: 19.0760, lng: 72.8777 },
  'Nagpur': { lat: 21.1458, lng: 79.0882 },
  'Noida': { lat: 28.5355, lng: 77.3910 },
  'Patna': { lat: 25.5941, lng: 85.1376 },
  'Pune': { lat: 18.5204, lng: 73.8567 },
  'Ranchi': { lat: 23.3441, lng: 85.3096 },
  'Surat': { lat: 21.1702, lng: 72.8311 },
  'Visakhapatnam': { lat: 17.6868, lng: 83.2185 }
};

export const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
};
