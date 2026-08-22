import React, { useState, useEffect, useMemo, useCallback } from 'react';
import './App.css';

// Context Providers & Hooks
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { WishlistProvider, useWishlist } from './context/WishlistContext';
import { ToastProvider, useToast } from './context/ToastContext';

// Types & Utilities
import type {
  Car,
  ViewType,
  AdminLeadsData,
  ParsedPriceRange,
  BookingFormData,
  SellFormData,
  LoanFormData,
  NewCarFormData,
  ServiceFormData,
  LeadLoan,
  LeadService
} from './types';
import { formatINR, formatCompactINR, formatGBP } from './currency';
import {
  parseAndExtractBudget,
  getCarFuelType,
  getCarTransmission,
  getCarColor,
  CITY_COORDINATES,
  getDistance
} from './utils/carHelpers';
import { API_URL } from './utils/apiConfig';

// Layout & Common Components
import Header from './components/layout/Header';
import MobileNavDrawer from './components/layout/MobileNavDrawer';
import { CompanyFooter } from './components/common/CompanyFooter';

// Modals
import AuthModal from './components/modals/AuthModal';
import CallbackModal from './components/modals/CallbackModal';
import LightboxModal from './components/modals/LightboxModal';
import EditListingModal from './components/modals/EditListingModal';

// Modular Page Views
import PreownedView from './components/views/PreownedView';
import SellCarView from './components/views/SellCarView';
import LoanView from './components/views/LoanView';
import NewCarsView from './components/views/NewCarsView';
import ServicesView from './components/views/ServicesView';
import CarDetailsView from './components/sections/CarDetailsView';
import AiRecommendView from './components/sections/AiRecommendView';
import AdminLeadsView from './components/sections/AdminLeadsView';

function AppContent() {
  const { user, token, showAuthModal, showCallbackModal, authMode, setShowAuthModal, setShowCallbackModal, login, logout, setShowUserDropdown } = useAuth();
  const { theme, setTheme } = useTheme();
  const { wishlist, showWishlistOnly, toggleWishlist, setShowWishlistOnly } = useWishlist();
  const { triggerToast } = useToast();

  // Navigation View State
  const [currentView, setCurrentView] = useState<ViewType>('preowned');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSearchingMobile, setIsSearchingMobile] = useState(false);

  // Cars & Filter States
  const [cars, setCars] = useState<Car[]>([]);
  const [allCars, setAllCars] = useState<Car[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  const [tabSelected, setTabSelected] = useState<'all' | 'luxe'>('all');
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [selectedMakes, setSelectedMakes] = useState<string[]>([]);
  const [selectedFuels, setSelectedFuels] = useState<string[]>([]);
  const [selectedTransmissions, setSelectedTransmissions] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedAge, setSelectedAge] = useState<string>('all');
  const [selectedKms, setSelectedKms] = useState<string>('all');
  const [maxPriceFilter, setMaxPriceFilter] = useState(50000000);
  const [searchTerm, setSearchTerm] = useState('');
  const [localSearchTerm, setLocalSearchTerm] = useState('');
  const [priceQuery, setPriceQuery] = useState('');
  const [parsedPrice, setParsedPrice] = useState<ParsedPriceRange | null>(null);
  const [sortBy, setSortBy] = useState<'relevance' | 'price_asc' | 'price_desc' | 'year_desc' | 'make_asc'>('year_desc');
  const [region, setRegion] = useState<'IN' | 'UK'>('IN');
  const [priceFormat, setPriceFormat] = useState<'lakh' | 'full'>('lakh');
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [showMyListingsOnly, setShowMyListingsOnly] = useState(false);

  // Header Dropdown States
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [showManualCities, setShowManualCities] = useState(false);
  const [citySearchQuery, setCitySearchQuery] = useState('');
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);

  // Selected Car Details & Booking
  const [selectedCarId, setSelectedCarId] = useState<string | null>(null);
  const [selectedCar, setSelectedCar] = useState<Car | null>(null);
  const [bookingForm, setBookingForm] = useState<BookingFormData>({ name: '', phone: '', date: '', time: '' });
  const [bookingSuccess, setBookingSuccess] = useState<any | null>(null);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [isBookingLoading, setIsBookingLoading] = useState(false);

  // Lightbox Zoom States
  const [showLightbox, setShowLightbox] = useState(false);
  const [zoomScale, setZoomScale] = useState(1);
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Edit Car Modal States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCar, setEditingCar] = useState<Car | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [isEditLoading, setIsEditLoading] = useState(false);
  const [editForm, setEditForm] = useState<SellFormData>({
    make: '',
    model: '',
    year: new Date().getFullYear(),
    price: '',
    city: '',
    imageUrl: '',
    fuel_type: 'Petrol',
    transmission: 'Manual',
    kms_driven: '',
    owners: '1st Owner',
    rto: ''
  });

  // Sell Car Form State
  const [sellForm, setSellForm] = useState<SellFormData>({
    make: '',
    model: '',
    year: new Date().getFullYear(),
    price: '',
    city: '',
    imageUrl: '',
    fuel_type: 'Petrol',
    transmission: 'Manual',
    kms_driven: '',
    owners: '1st Owner',
    rto: ''
  });
  const [sellSuccess, setSellSuccess] = useState(false);
  const [sellError, setSellError] = useState<string | null>(null);
  const [isSellLoading, setIsSellLoading] = useState(false);

  // Loan Calculator & Application
  const [loanAmount, setLoanAmount] = useState(500000);
  const [loanInterest, setLoanInterest] = useState(9.5);
  const [loanTenure, setLoanTenure] = useState(5);
  const [loanForm, setLoanForm] = useState<LoanFormData>({
    name: '',
    phone: '',
    income: '',
    employment: 'Salaried',
    creditScore: '750+ (Excellent)'
  });
  const [loanSuccess, setLoanSuccess] = useState<LeadLoan | null>(null);
  const [loanError, setLoanError] = useState<string | null>(null);
  const [isLoanLoading, setIsLoanLoading] = useState(false);
  const [loanDocs, setLoanDocs] = useState<{
    identityProof: { name: string; data: string } | null;
    addressProof: { name: string; data: string } | null;
    incomeProof: { name: string; data: string } | null;
  }>({
    identityProof: null,
    addressProof: null,
    incomeProof: null
  });

  // New Cars Lead
  const [selectedNewCar, setSelectedNewCar] = useState<string | null>(null);
  const [newCarForm, setNewCarForm] = useState<NewCarFormData>({ name: '', phone: '', email: '', city: '' });
  const [newCarSuccess, setNewCarSuccess] = useState(false);
  const [newCarError, setNewCarError] = useState<string | null>(null);
  const [isNewCarLoading, setIsNewCarLoading] = useState(false);

  // Services Lead
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [serviceForm, setServiceForm] = useState<ServiceFormData>({ name: '', phone: '', city: 'Delhi', date: '' });
  const [serviceSuccess, setServiceSuccess] = useState<(LeadService & { service_name?: string; booking_date?: string }) | null>(null);
  const [serviceError, setServiceError] = useState<string | null>(null);
  const [isServiceLoading, setIsServiceLoading] = useState(false);

  // AI Recommendation Assistant
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiBudget, setAiBudget] = useState<number>(1500000);
  const [aiPurpose, setAiPurpose] = useState('commuting');
  const [aiFuelType, setAiFuelType] = useState('Any');
  const [aiBodyType, setAiBodyType] = useState('Any');
  const [aiPriority, setAiPriority] = useState('comfort');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiLoadingStep, setAiLoadingStep] = useState(0);
  const [aiRecommendations, setAiRecommendations] = useState<any[]>([]);
  const [aiVerdict, setAiVerdict] = useState('');
  const [aiError, setAiError] = useState<string | null>(null);

  // Admin Leads
  const [adminLeads, setAdminLeads] = useState<AdminLeadsData | null>(null);
  const [isAdminLeadsLoading, setIsAdminLeadsLoading] = useState(false);
  const [adminLeadsError, setAdminLeadsError] = useState<string | null>(null);
  const [activeAdminTab, setActiveAdminTab] = useState<'bookings' | 'services' | 'loans' | 'newCarLeads'>('bookings');

  // Debounced search term and budget parsing
  useEffect(() => {
    const handler = setTimeout(() => {
      const { cleanQuery, parsedPrice: extractedPrice } = parseAndExtractBudget(localSearchTerm);
      setSearchTerm(cleanQuery);
      if (extractedPrice) {
        setParsedPrice(extractedPrice);
      } else if (!priceQuery.trim()) {
        setParsedPrice(null);
      }
    }, 250);
    return () => clearTimeout(handler);
  }, [localSearchTerm, priceQuery]);

  // Initial load: fetch all cars
  useEffect(() => {
    fetch(`${API_URL}/cars`)
      .then(async res => {
        if (!res.ok) throw new Error('Failed to fetch cars');
        return res.json();
      })
      .then((data: Car[]) => setAllCars(data))
      .catch(err => console.error(err));
  }, []);

  // Filtered cars API query
  useEffect(() => {
    setIsLoading(true);
    const params = new URLSearchParams();
    if (searchTerm.trim()) params.append('search', searchTerm);
    if (selectedCity !== 'all') params.append('city', selectedCity);

    let minPrice = 0;
    let maxPrice = maxPriceFilter;
    if (parsedPrice) {
      if (parsedPrice.value !== undefined) {
        maxPrice = parsedPrice.value;
      } else if (parsedPrice.min !== undefined && parsedPrice.max !== undefined) {
        minPrice = parsedPrice.min;
        maxPrice = parsedPrice.max;
      }
    }
    params.append('minPrice', minPrice.toString());
    params.append('maxPrice', maxPrice.toString());

    if (selectedMakes.length > 0) {
      params.append('makes', selectedMakes.join(','));
    }
    if (tabSelected === 'luxe') {
      params.append('luxe', 'true');
    }

    const endpoint = searchTerm.trim()
      ? `${API_URL}/cars/search/semantic?q=${encodeURIComponent(searchTerm)}&${params.toString()}`
      : `${API_URL}/cars?${params.toString()}`;

    const handler = setTimeout(() => {
      fetch(endpoint)
        .then(async res => {
          if (!res.ok) throw new Error('Failed to fetch cars');
          return res.json();
        })
        .then((data: Car[]) => {
          setCars(data);
          setIsLoading(false);
          setApiError(null);
        })
        .catch(err => {
          console.error(err);
          setApiError('Could not load car listings from server');
          setIsLoading(false);
        });
    }, 300);

    return () => clearTimeout(handler);
  }, [searchTerm, selectedCity, maxPriceFilter, parsedPrice, tabSelected, selectedMakes, sortBy]);

  // Auto-sort to relevance when searching
  useEffect(() => {
    setSortBy(searchTerm.trim() ? 'relevance' : 'year_desc');
  }, [searchTerm]);

  // Fetch admin leads when in admin view
  useEffect(() => {
    if (currentView === 'admin-leads' && token) {
      setIsAdminLeadsLoading(true);
      setAdminLeadsError(null);
      fetch(`${API_URL}/admin/leads`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(async res => {
          if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || 'Failed to fetch admin leads');
          }
          return res.json();
        })
        .then((data: AdminLeadsData) => {
          setAdminLeads(data);
          setIsAdminLeadsLoading(false);
        })
        .catch(err => {
          console.error(err);
          setAdminLeadsError(err.message || 'Could not load leads dashboard.');
          setIsAdminLeadsLoading(false);
        });
    }
  }, [currentView, token]);

  // Prepopulate booking form if user logged in
  useEffect(() => {
    if (user) {
      setBookingForm(prev => ({
        ...prev,
        name: user.name,
        phone: user.phone
      }));
    }
  }, [user]);

  // Fetch selected car details
  useEffect(() => {
    if (selectedCarId === null) {
      setSelectedCar(null);
      setBookingSuccess(null);
      setBookingError(null);
      return;
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
    fetch(`${API_URL}/cars/${selectedCarId}`)
      .then(async res => {
        if (!res.ok) throw new Error('Failed to fetch car details');
        return res.json();
      })
      .then((data: Car) => setSelectedCar(data))
      .catch(err => {
        console.error(err);
        setApiError('Could not load car details from server');
      });
  }, [selectedCarId]);

  // Auto-close mobile search on car details
  useEffect(() => {
    if (selectedCarId !== null) {
      setIsSearchingMobile(false);
    }
  }, [selectedCarId]);

  // Auto-close mobile menu on view change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [currentView, selectedCarId, showWishlistOnly, selectedCity]);

  // Lightbox keyboard listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowLightbox(false);
    };
    if (showLightbox) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showLightbox]);

  // Geolocation detector
  const handleDetectLocation = async () => {
    setIsDetectingLocation(true);
    try {
      const res = await fetch('https://ipwho.is/');
      const data = await res.json();
      if (data && data.success && data.latitude && data.longitude) {
        let closestCity = 'Delhi';
        let minDistance = Infinity;
        Object.entries(CITY_COORDINATES).forEach(([city, coords]) => {
          const dist = getDistance(data.latitude, data.longitude, coords.lat, coords.lng);
          if (dist < minDistance) {
            minDistance = dist;
            closestCity = city;
          }
        });
        setSelectedCity(closestCity);
        triggerToast(`Location detected: ${closestCity}`, 'success');
      } else {
        setSelectedCity('Delhi');
        triggerToast('Location defaulted to Delhi', 'info');
      }
    } catch {
      setSelectedCity('Delhi');
      triggerToast('Location defaulted to Delhi', 'info');
    } finally {
      setIsDetectingLocation(false);
    }
  };

  const handleMakeToggle = (brand: string) => {
    setSelectedMakes(prev =>
      prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]
    );
  };

  const handleResetToMainListing = useCallback((e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    setCurrentView('preowned');
    setSelectedCarId(null);
    setShowWishlistOnly(false);
    setShowMyListingsOnly(false);
    setTabSelected('all');
    setSelectedMakes([]);
    setSelectedFuels([]);
    setSelectedAge('all');
    setSearchTerm('');
    setLocalSearchTerm('');
    setPriceQuery('');
    setParsedPrice(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [setShowWishlistOnly]);

  const renderFormattedPrice = (price: number) => {
    if (region === 'UK') return formatGBP(price / 100);
    return priceFormat === 'full' ? formatINR(price) : formatCompactINR(price);
  };

  // Filtered and Sorted Cars
  const filteredCars = useMemo(() => {
    return cars.filter(car => {
      if (showWishlistOnly && !wishlist.includes(car.id)) return false;
      if (showMyListingsOnly && Number(car.created_by) !== Number(user?.id)) return false;

      if (selectedFuels.length > 0) {
        const fuel = getCarFuelType(car);
        if (!selectedFuels.includes(fuel)) return false;
      }
      if (selectedTransmissions.length > 0) {
        const trans = getCarTransmission(car);
        if (!selectedTransmissions.includes(trans)) return false;
      }
      if (selectedColors.length > 0) {
        const color = getCarColor(car);
        if (!selectedColors.includes(color)) return false;
      }
      if (selectedAge !== 'all') {
        const currentYear = new Date().getFullYear();
        const age = currentYear - car.year;
        if (selectedAge === 'under3' && age >= 3) return false;
        if (selectedAge === 'under5' && age >= 5) return false;
        if (selectedAge === 'under8' && age >= 8) return false;
      }
      if (selectedKms !== 'all') {
        const kms = car.kms_driven || 30000;
        if (selectedKms === 'under30k' && kms >= 30000) return false;
        if (selectedKms === 'under50k' && kms >= 50000) return false;
        if (selectedKms === 'under80k' && kms >= 80000) return false;
      }
      return true;
    });
  }, [cars, showWishlistOnly, showMyListingsOnly, wishlist, user, selectedFuels, selectedTransmissions, selectedColors, selectedAge, selectedKms]);

  const sortedCars = useMemo(() => {
    return [...filteredCars].sort((a, b) => {
      if (sortBy === 'price_asc') return a.price - b.price;
      if (sortBy === 'price_desc') return b.price - a.price;
      if (sortBy === 'year_desc') return b.year - a.year;
      if (sortBy === 'make_asc') return a.make.localeCompare(b.make);
      return 0;
    });
  }, [filteredCars, sortBy]);

  const avgPrice = useMemo(() => {
    if (filteredCars.length === 0) return 0;
    const sum = filteredCars.reduce((acc, c) => acc + c.price, 0);
    return Math.round(sum / filteredCars.length);
  }, [filteredCars]);

  const uniqueCities = useMemo(() => {
    return Array.from(new Set(allCars.map(c => c.city).filter(Boolean))).sort();
  }, [allCars]);

  // Booking Submit
  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCarId) return;
    setBookingError(null);
    setBookingSuccess(null);
    setIsBookingLoading(true);

    try {
      const res = await fetch(`${API_URL}/cars/${selectedCarId}/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Booking failed');
      setBookingSuccess(data.booking);
      triggerToast('Test drive booking confirmed!', 'success');
    } catch (err: any) {
      setBookingError(err.message || 'Failed to complete booking');
      triggerToast(err.message || 'Booking failed', 'error');
    } finally {
      setIsBookingLoading(false);
    }
  };

  // Sell Car Submit
  const handleSellSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSellError(null);
    setIsSellLoading(true);

    try {
      const res = await fetch(`${API_URL}/cars`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(sellForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to list car');
      setSellSuccess(true);
      triggerToast('Car listed successfully!', 'success');
      setAllCars(prev => [data.car, ...prev]);
    } catch (err: any) {
      setSellError(err.message || 'Submission error');
      triggerToast(err.message || 'Error creating listing', 'error');
    } finally {
      setIsSellLoading(false);
    }
  };

  // Edit Car Handlers
  const openEditModal = (car: Car) => {
    setEditingCar(car);
    setEditForm({
      make: car.make,
      model: car.model,
      year: car.year,
      price: car.price.toString(),
      city: car.city,
      imageUrl: car.image_url || '',
      fuel_type: car.fuel_type || 'Petrol',
      transmission: car.transmission || 'Manual',
      kms_driven: (car.kms_driven || '').toString(),
      owners: car.owners || '1st Owner',
      rto: car.rto || ''
    });
    setEditError(null);
    setIsEditModalOpen(true);
  };

  const handleEditCarSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCar) return;
    setEditError(null);
    setIsEditLoading(true);

    try {
      const res = await fetch(`${API_URL}/cars/${editingCar.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(editForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update car listing');

      setAllCars(prev => prev.map(c => (c.id === editingCar.id ? data.car : c)));
      setCars(prev => prev.map(c => (c.id === editingCar.id ? data.car : c)));
      if (selectedCar && selectedCar.id === editingCar.id) setSelectedCar(data.car);

      setIsEditModalOpen(false);
      triggerToast('Listing updated successfully!', 'success');
    } catch (err: any) {
      setEditError(err.message || 'Error updating listing');
    } finally {
      setIsEditLoading(false);
    }
  };

  const handleDeleteCar = async (carId: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this car listing?')) return;
    try {
      const res = await fetch(`${API_URL}/cars/${carId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete car');
      }
      setAllCars(prev => prev.filter(c => c.id !== carId));
      setCars(prev => prev.filter(c => c.id !== carId));
      if (selectedCarId === carId) setSelectedCarId(null);
      triggerToast('Listing deleted successfully', 'success');
    } catch (err: any) {
      triggerToast(err.message || 'Failed to delete listing', 'error');
    }
  };

  // Loan Submit
  const handleLoanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoanError(null);
    setLoanSuccess(null);
    setIsLoanLoading(true);

    try {
      const res = await fetch(`${API_URL}/loans/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...loanForm,
          loan_amount: loanAmount,
          interest_rate: loanInterest,
          tenure_years: loanTenure,
          documents: loanDocs
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit loan application');
      setLoanSuccess(data.loan);
      triggerToast('Pre-approval loan application submitted!', 'success');
    } catch (err: any) {
      setLoanError(err.message || 'Loan submission error');
      triggerToast(err.message || 'Loan application failed', 'error');
    } finally {
      setIsLoanLoading(false);
    }
  };

  // New Car Submit
  const handleNewCarSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNewCarError(null);
    setIsNewCarLoading(true);

    try {
      const res = await fetch(`${API_URL}/leads/new-car`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newCarForm,
          car_name: selectedNewCar
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit inquiry');
      setNewCarSuccess(true);
      triggerToast('Launch interest registered!', 'success');
    } catch (err: any) {
      setNewCarError(err.message || 'Failed to register interest');
      triggerToast(err.message || 'Inquiry submission failed', 'error');
    } finally {
      setIsNewCarLoading(false);
    }
  };

  // Service Booking Submit
  const handleServiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService) return;
    setServiceError(null);
    setServiceSuccess(null);
    setIsServiceLoading(true);

    try {
      const res = await fetch(`${API_URL}/services/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...serviceForm,
          service_type: selectedService
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to book service');
      setServiceSuccess(data.service);
      triggerToast('Doorstep car service booked!', 'success');
    } catch (err: any) {
      setServiceError(err.message || 'Service booking error');
      triggerToast(err.message || 'Service booking failed', 'error');
    } finally {
      setIsServiceLoading(false);
    }
  };

  // AI Recommendation Trigger
  const handleGetAiRecommendations = async () => {
    setAiLoading(true);
    setAiError(null);
    setAiRecommendations([]);
    setAiVerdict('');
    setAiLoadingStep(1);

    const stepTimer = setInterval(() => {
      setAiLoadingStep(prev => (prev < 3 ? prev + 1 : prev));
    }, 800);

    try {
      const res = await fetch(`${API_URL}/cars/ai/recommend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: aiPrompt,
          budget: aiBudget,
          purpose: aiPurpose,
          fuelType: aiFuelType,
          bodyType: aiBodyType,
          priority: aiPriority
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch AI recommendations');
      setAiRecommendations(data.recommendations || []);
      setAiVerdict(data.verdict || '');
    } catch (err: any) {
      setAiError(err.message || 'Could not fetch recommendations.');
    } finally {
      clearInterval(stepTimer);
      setAiLoading(false);
      setAiLoadingStep(0);
    }
  };

  return (
    <div>
      {/* Sticky CarSaathi Header */}
      <Header
        selectedCity={selectedCity}
        setSelectedCity={setSelectedCity}
        uniqueCities={uniqueCities}
        showLocationDropdown={showLocationDropdown}
        setShowLocationDropdown={setShowLocationDropdown}
        showManualCities={showManualCities}
        setShowManualCities={setShowManualCities}
        citySearchQuery={citySearchQuery}
        setCitySearchQuery={setCitySearchQuery}
        isDetectingLocation={isDetectingLocation}
        handleDetectLocation={handleDetectLocation}
        currentView={currentView}
        setCurrentView={setCurrentView}
        setSelectedCarId={setSelectedCarId}
        setTabSelected={setTabSelected}
        setSelectedMakes={setSelectedMakes}
        setSortBy={setSortBy}
        localSearchTerm={localSearchTerm}
        setLocalSearchTerm={setLocalSearchTerm}
        setSearchTerm={setSearchTerm}
        setShowMyListingsOnly={setShowMyListingsOnly}
        setSellSuccess={setSellSuccess}
        setSellError={setSellError}
        setLoanSuccess={setLoanSuccess}
        setSelectedNewCar={setSelectedNewCar}
        setNewCarSuccess={setNewCarSuccess}
        setNewCarError={setNewCarError}
        setSelectedService={setSelectedService}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        isSearchingMobile={isSearchingMobile}
        setIsSearchingMobile={setIsSearchingMobile}
        handleResetToMainListing={handleResetToMainListing}
      />

      {/* Mobile Drawer/Sidebar Navigation */}
      <MobileNavDrawer
        mobileMenuOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        user={user}
        token={token}
        theme={theme}
        wishlist={wishlist}
        showWishlistOnly={showWishlistOnly}
        currentView={currentView}
        setCurrentView={setCurrentView}
        setSelectedCarId={setSelectedCarId}
        setTabSelected={setTabSelected}
        setSelectedMakes={setSelectedMakes}
        setSelectedCity={setSelectedCity}
        setSortBy={setSortBy}
        setLocalSearchTerm={setLocalSearchTerm}
        setShowWishlistOnly={setShowWishlistOnly}
        setShowMyListingsOnly={setShowMyListingsOnly}
        setSellSuccess={setSellSuccess}
        setSellError={setSellError}
        setLoanSuccess={setLoanSuccess}
        setSelectedNewCar={setSelectedNewCar}
        setNewCarSuccess={setNewCarSuccess}
        setNewCarError={setNewCarError}
        setSelectedService={setSelectedService}
        setActiveAdminTab={setActiveAdminTab}
        setShowAuthModal={setShowAuthModal}
        setShowCallbackModal={setShowCallbackModal}
        setShowUserDropdown={setShowUserDropdown}
        setTheme={setTheme}
        handleLogout={logout}
      />

      {/* Main Body Container */}
      <div className="app-container">
        {currentView === 'ai-recommend' ? (
          <AiRecommendView
            aiLoading={aiLoading}
            aiLoadingStep={aiLoadingStep}
            aiRecommendations={aiRecommendations}
            aiVerdict={aiVerdict}
            aiError={aiError}
            aiPrompt={aiPrompt}
            aiBudget={aiBudget}
            aiPurpose={aiPurpose}
            aiFuelType={aiFuelType}
            aiBodyType={aiBodyType}
            aiPriority={aiPriority}
            allCars={allCars}
            cars={cars}
            setAiRecommendations={setAiRecommendations}
            setAiPrompt={setAiPrompt}
            setAiBudget={setAiBudget}
            setAiPurpose={setAiPurpose}
            setAiFuelType={setAiFuelType}
            setAiBodyType={setAiBodyType}
            setAiPriority={setAiPriority}
            onGetRecommendations={handleGetAiRecommendations}
            onSelectCar={(id, car) => { setSelectedCarId(id); setSelectedCar(car); setCurrentView('preowned'); }}
          />
        ) : currentView === 'admin-leads' ? (
          <AdminLeadsView
            adminLeads={adminLeads}
            isAdminLeadsLoading={isAdminLeadsLoading}
            adminLeadsError={adminLeadsError}
            activeAdminTab={activeAdminTab}
            setActiveAdminTab={setActiveAdminTab}
          />
        ) : currentView.startsWith('sell') ? (
          <SellCarView
            currentView={currentView}
            sellForm={sellForm}
            setSellForm={setSellForm}
            sellSuccess={sellSuccess}
            setSellSuccess={setSellSuccess}
            sellError={sellError}
            isSellLoading={isSellLoading}
            onSellSubmit={handleSellSubmit}
            allCars={allCars}
            setCurrentView={setCurrentView}
          />
        ) : currentView.startsWith('loan') ? (
          <LoanView
            currentView={currentView}
            loanSuccess={loanSuccess}
            setLoanSuccess={setLoanSuccess}
            loanError={loanError}
            loanForm={loanForm}
            setLoanForm={setLoanForm}
            loanDocs={loanDocs}
            setLoanDocs={setLoanDocs}
            isLoanLoading={isLoanLoading}
            onLoanSubmit={handleLoanSubmit}
            loanAmount={loanAmount}
            setLoanAmount={setLoanAmount}
            loanInterest={loanInterest}
            setLoanInterest={setLoanInterest}
            loanTenure={loanTenure}
            setLoanTenure={setLoanTenure}
          />
        ) : currentView.startsWith('new') ? (
          <NewCarsView
            currentView={currentView}
            selectedNewCar={selectedNewCar}
            setSelectedNewCar={setSelectedNewCar}
            newCarForm={newCarForm}
            setNewCarForm={setNewCarForm}
            newCarSuccess={newCarSuccess}
            setNewCarSuccess={setNewCarSuccess}
            newCarError={newCarError}
            setNewCarError={setNewCarError}
            isNewCarLoading={isNewCarLoading}
            onNewCarSubmit={handleNewCarSubmit}
          />
        ) : currentView.startsWith('services') ? (
          <ServicesView
            currentView={currentView}
            selectedService={selectedService}
            setSelectedService={setSelectedService}
            serviceForm={serviceForm}
            setServiceForm={setServiceForm}
            serviceSuccess={serviceSuccess}
            setServiceSuccess={setServiceSuccess}
            serviceError={serviceError}
            setServiceError={setServiceError}
            isServiceLoading={isServiceLoading}
            onServiceSubmit={handleServiceSubmit}
          />
        ) : selectedCarId !== null ? (
          <div className="car-details-container">
            <CarDetailsView
              selectedCar={selectedCar}
              wishlist={wishlist}
              user={user}
              token={token}
              region={region}
              bookingForm={bookingForm}
              bookingSuccess={bookingSuccess}
              bookingError={bookingError}
              isBookingLoading={isBookingLoading}
              onBack={() => setSelectedCarId(null)}
              onToggleWishlist={toggleWishlist}
              onBookingSubmit={handleBookingSubmit}
              onBookingFormChange={setBookingForm}
              onBookingSuccessReset={() => setBookingSuccess(null)}
              onSelectCar={(id) => setSelectedCarId(id)}
              onOpenLightbox={() => {
                setShowLightbox(true);
                setZoomScale(1);
                setPanPosition({ x: 0, y: 0 });
              }}
              onOpenEditModal={openEditModal}
            />
          </div>
        ) : (
          <PreownedView
            tabSelected={tabSelected}
            setTabSelected={setTabSelected}
            showMobileFilters={showMobileFilters}
            setShowMobileFilters={setShowMobileFilters}
            priceQuery={priceQuery}
            setPriceQuery={setPriceQuery}
            apiError={apiError}
            maxPriceFilter={maxPriceFilter}
            setMaxPriceFilter={setMaxPriceFilter}
            localSearchTerm={localSearchTerm}
            setLocalSearchTerm={setLocalSearchTerm}
            allCars={allCars}
            cars={cars}
            sortedCars={sortedCars}
            filteredCars={filteredCars}
            selectedMakes={selectedMakes}
            handleMakeToggle={handleMakeToggle}
            selectedFuels={selectedFuels}
            setSelectedFuels={setSelectedFuels}
            selectedTransmissions={selectedTransmissions}
            setSelectedTransmissions={setSelectedTransmissions}
            selectedAge={selectedAge}
            setSelectedAge={setSelectedAge}
            selectedKms={selectedKms}
            setSelectedKms={setSelectedKms}
            selectedColors={selectedColors}
            setSelectedColors={setSelectedColors}
            showMyListingsOnly={showMyListingsOnly}
            setShowMyListingsOnly={setShowMyListingsOnly}
            selectedCity={selectedCity}
            avgPrice={avgPrice}
            renderFormattedPrice={renderFormattedPrice}
            sortBy={sortBy}
            setSortBy={setSortBy}
            searchTerm={searchTerm}
            region={region}
            setRegion={setRegion}
            priceFormat={priceFormat}
            setPriceFormat={setPriceFormat}
            isLoading={isLoading}
            onSelectCar={(id) => setSelectedCarId(id)}
            onOpenEditModal={openEditModal}
            onDeleteCar={handleDeleteCar}
            setCurrentView={setCurrentView}
            setSelectedCarId={setSelectedCarId}
          />
        )}
      </div>

      {/* Footer */}
      <CompanyFooter
        setCurrentView={setCurrentView}
        setSelectedCity={setSelectedCity}
        setSelectedCarId={setSelectedCarId}
        triggerToast={triggerToast}
        handleResetToMainListing={handleResetToMainListing}
        setShowWishlistOnly={setShowWishlistOnly}
      />

      {/* Auth Modal Overlay */}
      {showAuthModal && (
        <AuthModal
          initialMode={authMode}
          onClose={() => setShowAuthModal(false)}
          onSuccess={(newToken, newUser) => {
            login(newToken, newUser);
            const userTheme = localStorage.getItem(`theme_user_${newUser.id}`);
            if (userTheme === 'dark' || userTheme === 'light') {
              setTheme(userTheme);
            }
          }}
        />
      )}

      {/* Callback Modal Overlay */}
      {showCallbackModal && (
        <CallbackModal onClose={() => setShowCallbackModal(false)} />
      )}

      {/* Lightbox / Zoom Modal */}
      <LightboxModal
        selectedCar={selectedCar}
        showLightbox={showLightbox}
        zoomScale={zoomScale}
        panPosition={panPosition}
        isDragging={isDragging}
        onClose={() => setShowLightbox(false)}
        onZoomIn={() => setZoomScale(prev => Math.min(prev + 0.5, 4))}
        onZoomOut={() => setZoomScale(prev => {
          const next = Math.max(prev - 0.5, 1);
          if (next === 1) setPanPosition({ x: 0, y: 0 });
          return next;
        })}
        onZoomReset={() => {
          setZoomScale(1);
          setPanPosition({ x: 0, y: 0 });
        }}
        onWheel={(e) => {
          if (e.deltaY < 0) {
            setZoomScale(prev => Math.min(prev + 0.25, 4));
          } else {
            setZoomScale(prev => {
              const next = Math.max(prev - 0.25, 1);
              if (next === 1) setPanPosition({ x: 0, y: 0 });
              return next;
            });
          }
        }}
        onDoubleClick={() => {
          if (zoomScale > 1) {
            setZoomScale(1);
            setPanPosition({ x: 0, y: 0 });
          } else {
            setZoomScale(2);
          }
        }}
        onMouseDown={(e) => {
          if (zoomScale <= 1) return;
          setIsDragging(true);
          setDragStart({ x: e.clientX - panPosition.x, y: e.clientY - panPosition.y });
        }}
        onMouseMove={(e) => {
          if (!isDragging || zoomScale <= 1) return;
          setPanPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
        }}
        onMouseUp={() => setIsDragging(false)}
        onTouchStart={(e) => {
          if (zoomScale <= 1 || e.touches.length !== 1) return;
          setIsDragging(true);
          setDragStart({ x: e.touches[0].clientX - panPosition.x, y: e.touches[0].clientY - panPosition.y });
        }}
        onTouchMove={(e) => {
          if (!isDragging || zoomScale <= 1) return;
          setPanPosition({ x: e.touches[0].clientX - dragStart.x, y: e.touches[0].clientY - dragStart.y });
        }}
        onContainerClick={(e) => {
          if (e.target === e.currentTarget && zoomScale === 1) setShowLightbox(false);
        }}
      />

      {/* Edit Car Modal Overlay */}
      <EditListingModal
        isOpen={isEditModalOpen}
        editingCar={editingCar}
        editForm={editForm}
        setEditForm={setEditForm}
        isEditLoading={isEditLoading}
        editError={editError}
        onClose={() => setIsEditModalOpen(false)}
        onSubmit={handleEditCarSubmit}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <WishlistProvider>
          <ToastProvider>
            <AppContent />
          </ToastProvider>
        </WishlistProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
