// ============================================================
// Car image map and image resolution helpers
// ============================================================

export const CAR_IMAGES: Record<number, string> = {
  1: '/images/cars/1.jpg',
  2: '/images/cars/2.jpg',
  3: '/images/cars/3.jpg',
  4: '/images/cars/4.jpg',
  5: '/images/cars/5.jpg',
  6: '/images/cars/6.jpg',
  7: '/images/cars/7.jpg',
  8: '/images/cars/8.jpg',
  9: '/images/cars/9.jpg',
  10: '/images/cars/10.jpg',
  11: '/images/cars/11.jpg',
  12: '/images/cars/12.jpg',
  13: '/images/cars/13.jpg',
  14: '/images/cars/14.jpg',
  15: '/images/cars/15.jpg',
  16: '/images/cars/16.jpg',
  17: '/images/cars/17.jpg',
  18: '/images/cars/18.jpg',
  19: '/images/cars/19.jpg',
  20: '/images/cars/20.jpg',
  21: '/images/cars/21.jpg',
  22: '/images/cars/22.jpg',
  23: '/images/cars/23.jpg',
  24: '/images/cars/24.jpg',
  25: '/images/cars/25.jpg',
  26: '/images/cars/26.jpg',
  27: '/images/cars/27.jpg',
  28: '/images/cars/28.jpg',
  29: '/images/cars/29.jpg',
  30: '/images/cars/30.jpg',
  31: '/images/cars/31.jpg',
  32: '/images/cars/32.jpg',
  33: '/images/cars/33.jpg',
  34: '/images/cars/34.jpg',
  35: '/images/cars/35.jpg',
  36: '/images/cars/36.jpg',
  37: '/images/cars/37.jpg',
  38: '/images/cars/38.jpg',
  39: '/images/cars/39.jpg',
  40: '/images/cars/40.jpg',
  41: '/images/cars/41.jpg',
  42: '/images/cars/42.jpg',
  43: '/images/cars/43.jpg',
  44: '/images/cars/44.jpg',
  45: '/images/cars/45.jpg',
  46: '/images/cars/46.jpg',
  47: '/images/cars/47.jpg',
  48: '/images/cars/48.jpg',
  49: '/images/cars/49.jpg',
  50: '/images/cars/50.jpg'
};

export const DEFAULT_CAR_FALLBACK = 'https://images.unsplash.com/photo-1605558202076-76ad227d99d2?auto=format&fit=crop&q=80&w=400';

export const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
  const target = e.currentTarget;
  if (target.src !== DEFAULT_CAR_FALLBACK) {
    target.src = DEFAULT_CAR_FALLBACK;
  }
};

export const getCarImageUrl = (car: any) => {
  if (!car) return DEFAULT_CAR_FALLBACK;
  if (car.image_url && typeof car.image_url === 'string' && car.image_url.trim()) {
    return car.image_url;
  }
  if (car.id !== undefined && car.id !== null) {
    const numId = Number(car.id);
    if (!isNaN(numId) && CAR_IMAGES[numId]) {
      return CAR_IMAGES[numId];
    }
  }
  return DEFAULT_CAR_FALLBACK;
};
