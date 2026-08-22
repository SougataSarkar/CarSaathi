import React, { createContext, useContext, useState } from 'react';

interface WishlistContextType {
  wishlist: string[];
  showWishlistOnly: boolean;
  toggleWishlist: (carId: string) => void;
  isInWishlist: (carId: string) => boolean;
  setShowWishlistOnly: (show: boolean) => void;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [wishlist, setWishlist] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('carsaathi_wishlist');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [showWishlistOnly, setShowWishlistOnly] = useState<boolean>(false);

  const toggleWishlist = (carId: string) => {
    setWishlist(prev => {
      const exists = prev.includes(carId);
      const updated = exists ? prev.filter(id => id !== carId) : [...prev, carId];
      try {
        localStorage.setItem('carsaathi_wishlist', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const isInWishlist = (carId: string) => {
    return wishlist.includes(carId);
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        showWishlistOnly,
        toggleWishlist,
        isInWishlist,
        setShowWishlistOnly
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = (): WishlistContextType => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};
