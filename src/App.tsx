import {
  ArrowRight,
  Award,
  Building,
  CheckCircle2,
  Compass,
  FileCheck2,
  Home,
  KeyRound,
  Landmark,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Search,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { AdminDashboard } from './components/AdminDashboard';
import { Footer } from './components/Footer';
import { Navbar } from './components/Navbar';
import { PropertyCard } from './components/PropertyCard';
import { PropertyDetailPage } from './components/PropertyDetailPage';
import { PumpingWhatsApp } from './components/PumpingWhatsApp';
import { ResilientImage } from './components/ResilientImage';
import {
  buildWhatsAppUrl,
  COMPANY_INFO,
  ESTATE_HIGHLIGHTS,
  SERVICES_LIST,
  TESTIMONIALS,
  WHY_CHOOSE_PILLARS,
} from './constants/brand';
import type { Property } from './types/realEstate';

type AppView = 'home' | 'property' | 'admin';

const SERVICE_ICONS = [Home, Landmark, Building, KeyRound, TrendingUp, Compass];

const CATEGORY_TABS = [
  'All',
  'Luxury Homes',
  'Land & Plots',
  'Estate Developments',
  'Commercial',
] as const;

export default function App() {
  const [view, setView] = useState<AppView>('home');
  const [properties, setProperties] = useState<Property[]>([]);
  const [loadingProperties, setLoadingProperties] = useState(true);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedLocation, setSelectedLocation] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');

  // Contact Form State
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactInterest, setContactInterest] = useState('Property Purchase');
  const [contactMessage, setContactMessage] = useState('');
  const [contactSubmitting, setContactSubmitting] = useState(false);
  const [contactSuccess, setContactSuccess] = useState(false);
  const [contactError, setContactError] = useState('');

  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const fetchProperties = useCallback(async () => {
    setLoadingProperties(true);
    try {
      const res = await fetch('/api/properties');
      const data = await res.json();
      if (Array.isArray(data.properties)) {
        setProperties(data.properties);
        return data.properties as Property[];
      }
      return [];
    } catch {
      return [];
    } finally {
      setLoadingProperties(false);
    }
  }, []);

  // Sync route on initial mount and popstate
  useEffect(() => {
    let active = true;
    fetchProperties().then((loaded) => {
      if (!active) return;
      const pathname = window.location.pathname;
      if (pathname.startsWith('/admin')) {
        setView('admin');
      } else if (pathname.startsWith('/properties/')) {
        const slugOrId = pathname.replace('/properties/', '').trim();
        const found = loaded.find((p) => p.slug === slugOrId || p.id === slugOrId);
        if (found) {
          setSelectedProperty(found);
          setView('property');
        }
      }
    });

    const onPopState = () => {
      const path = window.location.pathname;
      if (path.startsWith('/admin')) {
        setView('admin');
      } else if (path.startsWith('/properties/')) {
        setView('property');
      } else {
        setView('home');
        setSelectedProperty(null);
      }
    };

    window.addEventListener('popstate', onPopState);
    return () => {
      active = false;
      window.removeEventListener('popstate', onPopState);
    };
  }, [fetchProperties]);

  const navigateToHome = (sectionId?: string) => {
    if (window.location.pathname !== '/') {
      window.history.pushState({}, '', '/');
    }
    setView('home');
    setSelectedProperty(null);

    if (sectionId) {
      window.setTimeout(() => {
        const el = document.getElementById(sectionId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          if (sectionId === 'properties' && searchInputRef.current) {
            searchInputRef.current.focus({ preventScroll: true });
          }
        }
      }, 60);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const navigateToProperty = (property: Property) => {
    setSelectedProperty(property);
    setView('property');
    window.history.pushState({}, '', `/properties/${property.slug || property.id}`);
  };

  const navigateToAdmin = () => {
    setView('admin');
    window.history.pushState({}, '', '/admin');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const uniqueLocations = useMemo(() => {
    const set = new Set<string>();
    properties.forEach((p) => {
      if (p.location) set.add(p.location);
    });
    return ['All', ...Array.from(set)];
  }, [properties]);

  const filteredProperties = useMemo(() => {
    return properties.filter((prop) => {
      if (selectedCategory !== 'All' && prop.category !== selectedCategory) return false;
      if (selectedLocation !== 'All' && prop.location !== selectedLocation) return false;
      if (selectedStatus !== 'All' && prop.availability !== selectedStatus) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const text = `${prop.title} ${prop.location} ${prop.category} ${prop.description}`.toLowerCase();
        if (!text.includes(q)) return false;
      }
      return true;
    });
  }, [properties, selectedCategory, selectedLocation, selectedStatus, searchQuery]);

  const handleContactSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setContactError('');

    if (contactName.trim().length < 2) {
      setContactError('Please enter your full name.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail.trim())) {
      setContactError('Please enter a valid email address.');
      return;
    }
    if (contactPhone.trim().length < 7) {
      setContactError('Please enter a valid phone or WhatsApp number.');
      return;
    }
    if (contactMessage.trim().length < 5) {
      setContactError('Please share a brief message about your property needs.');
      return;
    }

    setContactSubmitting(true);
    try {
      const res = await fetch('/api/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: contactName.trim(),
          email: contactEmail.trim(),
          phone: contactPhone.trim(),
          interest: contactInterest,
          message: contactMessage.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Could not send message.');
      }
      setContactSuccess(true);
      setContactName('');
      setContactEmail('');
      setContactPhone('');
      setContactMessage('');
    } catch (err) {
      setContactError(err instanceof Error ? err.message : 'Unable to send message.');
    } finally {
      setContactSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-[#0A1628]">
      <Navbar currentView={view} onNavigateHome={navigateToHome} />

      {view === 'admin' ? (
        <AdminDashboard
          onBackHome={() => navigateToHome()}
          onPropertiesChanged={fetchProperties}
        />
      ) : view === 'property' && selectedProperty ? (
        <PropertyDetailPage
          property={selectedProperty}
          onBack={() => navigateToHome('properties')}
        />
      ) : (
        <main className="flex-1">
          {/* 1. HERO SECTION */}
          <section id="home" className="relative bg-[#0A1628] text-white overflow-hidden">
            <div className="relative min-h-[600px] lg:min-h-[680px] flex items-center">
              {/* Background Photography */}
              <div className="absolute inset-0">
                <ResilientImage
                  src="/src/assets/images/hero_newsmart_villa_1795633493165.jpg"
                  alt="Luxury modern residence by NewSmart Homes in Benin City"
                  loading="eager"
                  className="w-full h-full object-cover object-center"
                />
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-r from-[#0A1628]/95 via-[#0A1628]/80 to-[#0A1628]/30"
                />
              </div>

              <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28 w-full">
                <motion.div
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                  className="max-w-2xl space-y-6"
                >
                  <p className="text-xs sm:text-sm font-semibold tracking-wider text-[#D4AF37]">
                    Benin City · Edo State, Nigeria
                  </p>

                  <h1 className="font-display text-4xl sm:text-5xl lg:text-[60px] font-bold leading-[1.1] tracking-tight text-white text-balance">
                    Building Dreams. Creating Lasting Value.
                  </h1>

                  <p className="text-base sm:text-lg text-slate-200 leading-relaxed max-w-xl">
                    Your trusted partner in property investment, estate development and property
                    management. Let us help you find your dream property.
                  </p>

                  <div className="flex flex-wrap items-center gap-4 pt-2">
                    <button
                      type="button"
                      onClick={() => navigateToHome('properties')}
                      className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg bg-[#1E40AF] hover:bg-[#17328A] text-white font-semibold text-sm transition-colors shadow-lg cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]"
                    >
                      Explore Properties
                      <ArrowRight className="w-4 h-4" aria-hidden="true" />
                    </button>

                    <a
                      href={buildWhatsAppUrl(
                        'Hello NewSmart Homes, I would like to speak with an advisor about buying or managing property in Benin City.'
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/25 text-white font-semibold text-sm transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]"
                    >
                      <MessageCircle className="w-4 h-4 text-[#25D366]" aria-hidden="true" />
                      Contact Us on WhatsApp
                    </a>
                  </div>
                </motion.div>
              </div>
            </div>

            {/* 4-Column Architectural Value Strip */}
            <div className="relative z-10 bg-[#071020] border-t border-white/10">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 grid grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-[#D4AF37]">Title Verification</span>
                  <p className="text-sm font-medium text-white">EdoGIS & C of O Certified</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-[#D4AF37]">Prime Corridors</span>
                  <p className="text-sm font-medium text-white">GRA, Ugbor & Sapele Road</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-[#D4AF37]">Estate Engineering</span>
                  <p className="text-sm font-medium text-white">Paved Roads & 24/7 Security</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-[#D4AF37]">Asset Stewardship</span>
                  <p className="text-sm font-medium text-white">Local & Diaspora Management</p>
                </div>
              </div>
            </div>
          </section>

          {/* 2. ABOUT NEWSMART HOMES */}
          <section id="about" className="py-20 lg:py-28 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-stretch">
                <div className="lg:col-span-6 flex flex-col justify-center space-y-6">
                  <div>
                    <span className="text-xs font-semibold tracking-wider text-[#1E40AF]">
                      About NewSmart Homes
                    </span>
                    <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#0A1628] tracking-tight text-balance mt-2">
                      A Trusted Real Estate & Property Management Partner in Benin City
                    </h2>
                  </div>

                  <div className="w-16 h-[2px] bg-[#C9A227]" aria-hidden="true" />

                  <p className="text-slate-600 leading-relaxed text-[15px] sm:text-base">
                    NewSmart Homes is a premier real estate development and property management
                    company headquartered in Benin City, Edo State. We exist to help families,
                    professionals, corporate organizations, and Nigerians in the diaspora discover
                    verified property opportunities and build lasting generational value.
                  </p>

                  <p className="text-slate-600 leading-relaxed text-[15px] sm:text-base">
                    From architectural residential developments and litigation-free land acquisition
                    to meticulous post-purchase facility management, every engagement is anchored on
                    integrity, legal transparency, and enduring craftsmanship.
                  </p>

                  <div className="grid grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                    <div>
                      <span className="font-display text-2xl sm:text-3xl font-bold text-[#0A1628] tabular-nums">
                        100%
                      </span>
                      <p className="text-xs font-medium text-slate-600 mt-1">
                        Verified Title Documentation
                      </p>
                    </div>
                    <div>
                      <span className="font-display text-2xl sm:text-3xl font-bold text-[#0A1628] tabular-nums">
                        End-to-End
                      </span>
                      <p className="text-xs font-medium text-slate-600 mt-1">
                        Acquisition, Development & Care
                      </p>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-6">
                  <div className="h-full min-h-[360px] lg:min-h-[480px] rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                    <ResilientImage
                      src="/src/assets/images/interior_luxury_living_1795633494753.jpg"
                      alt="Luxury living room interior crafted by NewSmart Homes"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 3. OUR SERVICES */}
          <section id="services" className="py-20 lg:py-24 bg-[#F8FAFC] border-y border-slate-200/80">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="max-w-2xl mb-14">
                <span className="text-xs font-semibold tracking-wider text-[#1E40AF]">
                  Our Services
                </span>
                <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#0A1628] tracking-tight text-balance mt-2">
                  Comprehensive Real Estate Solutions Under One Roof
                </h2>
                <p className="text-slate-600 mt-3 leading-relaxed">
                  Whether you are acquiring your first family home, securing land for future equity,
                  or entrusting an investment portfolio to professional managers, we deliver clarity
                  at every step.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {SERVICES_LIST.map((service, idx) => {
                  const Icon = SERVICE_ICONS[idx % SERVICE_ICONS.length];
                  return (
                    <div
                      key={service.number}
                      className="bg-white border border-slate-200 rounded-xl p-7 flex flex-col justify-between transition-shadow duration-200 hover:shadow-[0_14px_30px_-12px_rgba(10,22,40,0.1)]"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-5">
                          <span className="font-display text-lg font-bold text-[#C9A227] tabular-nums">
                            {service.number}.
                          </span>
                          <div className="w-10 h-10 rounded-lg bg-[#0A1628]/5 text-[#1E40AF] flex items-center justify-center">
                            <Icon className="w-5 h-5" aria-hidden="true" />
                          </div>
                        </div>
                        <h3 className="font-display text-xl font-bold text-[#0A1628] mb-2.5">
                          {service.title}
                        </h3>
                        <p className="text-sm text-slate-600 leading-relaxed">
                          {service.description}
                        </p>
                      </div>

                      <div className="pt-6 mt-6 border-t border-slate-100">
                        <a
                          href={buildWhatsAppUrl(
                            `Hello NewSmart Homes, I would like to enquire about your ${service.title} service.`
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1E40AF] hover:text-[#0A1628] transition-colors"
                        >
                          Discuss {service.title}
                          <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* 4. FEATURED PROPERTIES + SEARCH & FILTER */}
          <section id="properties" className="py-20 lg:py-28 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10">
                <div className="max-w-2xl">
                  <span className="text-xs font-semibold tracking-wider text-[#1E40AF]">
                    Featured Portfolio
                  </span>
                  <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#0A1628] tracking-tight text-balance mt-2">
                    Verified Homes, Estates & Prime Land in Benin City
                  </h2>
                </div>
                <p className="text-sm text-slate-600 tabular-nums">
                  Showing <strong className="text-[#0A1628]">{filteredProperties.length}</strong> of{' '}
                  <strong className="text-[#0A1628]">{properties.length}</strong> verified listings
                </p>
              </div>

              {/* Search & Filter Controls */}
              <div className="bg-[#F8FAFC] border border-slate-200 rounded-xl p-4 sm:p-5 mb-10 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5">
                  <div className="md:col-span-5 relative">
                    <Search
                      className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                      aria-hidden="true"
                    />
                    <input
                      ref={searchInputRef}
                      type="search"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by property name, GRA, Ugbor, C of O..."
                      aria-label="Search properties"
                      className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E40AF]"
                    />
                  </div>

                  <div className="md:col-span-4">
                    <select
                      aria-label="Filter by location"
                      value={selectedLocation}
                      onChange={(e) => setSelectedLocation(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E40AF]"
                    >
                      {uniqueLocations.map((loc) => (
                        <option key={loc} value={loc}>
                          {loc === 'All' ? 'All Benin City Locations' : loc}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-3">
                    <select
                      aria-label="Filter by availability"
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E40AF]"
                    >
                      <option value="All">All Availability</option>
                      <option value="Available">Available</option>
                      <option value="Under Offer">Under Offer</option>
                      <option value="Sold Out">Sold Out</option>
                    </select>
                  </div>
                </div>

                {/* Category Filter Segmented Control */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  {CATEGORY_TABS.map((cat) => {
                    const active = selectedCategory === cat;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                          active
                            ? 'bg-[#0A1628] text-white'
                            : 'bg-white text-slate-600 border border-slate-200 hover:text-[#0A1628] hover:border-slate-300'
                        }`}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Property Cards Grid */}
              {loadingProperties ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {[1, 2, 3].map((item) => (
                    <div
                      key={item}
                      className="h-[440px] rounded-xl border border-slate-200 bg-slate-100 animate-pulse"
                    />
                  ))}
                </div>
              ) : filteredProperties.length === 0 ? (
                <div className="border border-slate-200 rounded-xl p-12 text-center space-y-3 bg-[#F8FAFC]">
                  <p className="font-display text-xl font-bold text-[#0A1628]">
                    No matching properties found
                  </p>
                  <p className="text-sm text-slate-600 max-w-md mx-auto">
                    Try adjusting your search keywords or filters, or contact our team on WhatsApp
                    for off-market listings in Benin City.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory('All');
                      setSelectedLocation('All');
                      setSelectedStatus('All');
                    }}
                    className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-[#1E40AF] text-white text-xs font-semibold cursor-pointer"
                  >
                    Reset Filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {filteredProperties.map((property) => (
                    <PropertyCard
                      key={property.id}
                      property={property}
                      onSelectProperty={navigateToProperty}
                    />
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* 5. WHY CHOOSE NEWSMART HOMES */}
          <section className="py-20 lg:py-24 bg-[#0A1628] text-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                <div className="lg:col-span-5 space-y-5">
                  <span className="text-xs font-semibold tracking-wider text-[#D4AF37]">
                    Why Choose NewSmart Homes
                  </span>
                  <h2 className="font-display text-3xl sm:text-4xl font-bold text-white tracking-tight text-balance">
                    Built on Due Diligence, Craftsmanship & Long-Term Trust
                  </h2>
                  <p className="text-slate-300 leading-relaxed text-[15px]">
                    Real estate is one of the most consequential investments you will ever make.
                    Our standards protect your capital from initial inspection through decades of
                    ownership.
                  </p>

                  <div className="pt-4">
                    <a
                      href={buildWhatsAppUrl(
                        'Hello NewSmart Homes, I would like to schedule a consultation with your property advisory team.'
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-[#C9A227] hover:bg-[#B48D1C] text-[#0A1628] font-semibold text-sm transition-colors whitespace-nowrap shrink-0"
                    >
                      <Award className="w-4 h-4" aria-hidden="true" />
                      Speak With an Advisor
                    </a>
                  </div>
                </div>

                <div className="lg:col-span-7 divide-y divide-white/10 border-y border-white/10">
                  {WHY_CHOOSE_PILLARS.map((pillar) => (
                    <div key={pillar.number} className="py-5 sm:py-6 flex items-start gap-5">
                      <span className="font-display text-lg font-bold text-[#D4AF37] tabular-nums shrink-0 pt-0.5">
                        {pillar.number}.
                      </span>
                      <div>
                        <h3 className="font-display text-xl font-semibold text-white mb-1.5">
                          {pillar.title}
                        </h3>
                        <p className="text-sm text-slate-300 leading-relaxed">
                          {pillar.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* 6. ESTATE DEVELOPMENT SHOWCASE */}
          <section id="estate-development" className="py-20 lg:py-28 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
              <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                <div className="max-w-2xl">
                  <span className="text-xs font-semibold tracking-wider text-[#1E40AF]">
                    Estate Development
                  </span>
                  <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#0A1628] tracking-tight text-balance mt-2">
                    Master-Planned Gated Communities Engineered to Last
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory('Estate Developments');
                    navigateToHome('properties');
                  }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-slate-300 hover:border-[#0A1628] text-sm font-semibold text-[#0A1628] transition-colors whitespace-nowrap shrink-0 cursor-pointer self-start lg:self-auto"
                >
                  View Estate Developments
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                <div className="lg:col-span-8 rounded-xl overflow-hidden border border-slate-200 relative min-h-[340px]">
                  <ResilientImage
                    src="/src/assets/images/estate_masterplan_1795633493234.jpg"
                    alt="Aerial dusk view of NewSmart Homes gated estate development"
                    className="w-full h-full object-cover"
                  />
                  <div
                    aria-hidden="true"
                    className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-[#0A1628]/90 via-[#0A1628]/55 to-transparent"
                  />
                  <div className="absolute bottom-6 left-6 right-6 text-white max-w-xl">
                    <p className="text-xs font-semibold text-[#D4AF37] mb-1">
                      Signature Estate Masterplans
                    </p>
                    <h3 className="font-display text-2xl sm:text-3xl font-bold">
                      NewSmart Royal Palms & Serviced Residential Courts
                    </h3>
                    <p className="text-sm text-slate-200 mt-2 leading-relaxed">
                      Thoughtfully laid-out gated communities featuring dual-lane paved roads,
                      perimeter fencing, solar street illumination, and green recreational spaces.
                    </p>
                  </div>
                </div>

                <div className="lg:col-span-4 flex flex-col justify-between gap-6">
                  <div className="rounded-xl overflow-hidden border border-slate-200 aspect-[4/3]">
                    <ResilientImage
                      src="/src/assets/images/prop_prime_land_1795633495059.jpg"
                      alt="Serviced estate land plots with paved roads in Benin City"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="bg-[#F8FAFC] border border-slate-200 rounded-xl p-6 space-y-4 flex-1 flex flex-col justify-center">
                    {ESTATE_HIGHLIGHTS.map((item) => (
                      <div
                        key={item.label}
                        className="flex items-center justify-between gap-4 pb-3 last:pb-0 border-b last:border-b-0 border-slate-200"
                      >
                        <span className="text-xs font-medium text-slate-500">{item.label}</span>
                        <span className="text-xs font-semibold text-[#0A1628] text-right">
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 7. CUSTOMER TESTIMONIALS */}
          <section className="py-20 lg:py-24 bg-[#F8FAFC] border-y border-slate-200/80">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="max-w-2xl mb-14">
                <span className="text-xs font-semibold tracking-wider text-[#1E40AF]">
                  Client Stories
                </span>
                <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#0A1628] tracking-tight text-balance mt-2">
                  Trusted by Homeowners & Diaspora Investors
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {TESTIMONIALS.map((item) => (
                  <blockquote
                    key={item.name}
                    className="bg-white border border-slate-200 rounded-xl p-7 flex flex-col justify-between space-y-6"
                  >
                    <p className="text-sm text-slate-700 leading-relaxed">“{item.quote}”</p>
                    <div className="pt-5 border-t border-slate-100 space-y-1">
                      <p className="font-display text-base font-bold text-[#0A1628]">{item.name}</p>
                      <p className="text-xs text-slate-500">{item.role}</p>
                      <p className="text-xs font-semibold text-[#1E40AF] pt-1">{item.outcome}</p>
                    </div>
                  </blockquote>
                ))}
              </div>
            </div>
          </section>

          {/* 8. CONTACT SECTION */}
          <section id="contact" className="py-20 lg:py-28 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                {/* Left: Office Details */}
                <div className="lg:col-span-5 space-y-6">
                  <div>
                    <span className="text-xs font-semibold tracking-wider text-[#1E40AF]">
                      Contact Us
                    </span>
                    <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#0A1628] tracking-tight text-balance mt-2">
                      Visit Our Benin City Office or Message Us Directly
                    </h2>
                    <p className="text-slate-600 mt-3 leading-relaxed text-[15px]">
                      Schedule a private property inspection, verify land documentation, or discuss
                      property management for your residential or commercial assets.
                    </p>
                  </div>

                  <div className="space-y-4 pt-2">
                    <div className="flex items-start gap-4 p-4 rounded-xl bg-[#F8FAFC] border border-slate-200">
                      <MapPin className="w-5 h-5 text-[#1E40AF] mt-0.5 shrink-0" aria-hidden="true" />
                      <div>
                        <span className="block text-xs font-semibold text-slate-500">
                          Office Address
                        </span>
                        <p className="text-sm font-medium text-[#0A1628] mt-0.5">
                          {COMPANY_INFO.address}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4 p-4 rounded-xl bg-[#F8FAFC] border border-slate-200">
                      <Phone className="w-5 h-5 text-[#1E40AF] mt-0.5 shrink-0" aria-hidden="true" />
                      <div>
                        <span className="block text-xs font-semibold text-slate-500">
                          Telephone
                        </span>
                        <a
                          href={COMPANY_INFO.phoneHref}
                          className="text-sm font-semibold text-[#0A1628] hover:text-[#1E40AF] tabular-nums mt-0.5 inline-block"
                        >
                          {COMPANY_INFO.phoneDisplay}
                        </a>
                      </div>
                    </div>

                    <div className="flex items-start gap-4 p-4 rounded-xl bg-[#F8FAFC] border border-slate-200">
                      <MessageCircle
                        className="w-5 h-5 text-[#128C7E] mt-0.5 shrink-0"
                        aria-hidden="true"
                      />
                      <div>
                        <span className="block text-xs font-semibold text-slate-500">
                          WhatsApp Concierge
                        </span>
                        <a
                          href={buildWhatsAppUrl()}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-semibold text-[#0A1628] hover:text-[#128C7E] tabular-nums mt-0.5 inline-block"
                        >
                          {COMPANY_INFO.whatsappDisplay}
                        </a>
                      </div>
                    </div>

                    <div className="flex items-start gap-4 p-4 rounded-xl bg-[#F8FAFC] border border-slate-200">
                      <Mail className="w-5 h-5 text-[#1E40AF] mt-0.5 shrink-0" aria-hidden="true" />
                      <div>
                        <span className="block text-xs font-semibold text-slate-500">Email</span>
                        <a
                          href={`mailto:${COMPANY_INFO.email}`}
                          className="text-sm font-semibold text-[#0A1628] hover:text-[#1E40AF] mt-0.5 inline-block break-all"
                        >
                          {COMPANY_INFO.email}
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Contact & Enquiry Form */}
                <div className="lg:col-span-7 bg-[#F8FAFC] border border-slate-200 rounded-xl p-6 sm:p-10">
                  <div className="flex items-center justify-between gap-4 mb-6">
                    <div>
                      <h3 className="font-display text-2xl font-bold text-[#0A1628]">
                        Send a Property Enquiry
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">
                        Our Benin City advisory desk responds promptly to every request.
                      </p>
                    </div>
                    <FileCheck2 className="w-6 h-6 text-[#C9A227] shrink-0" aria-hidden="true" />
                  </div>

                  {contactSuccess ? (
                    <div className="p-6 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 space-y-3">
                      <div className="flex items-center gap-2 font-semibold text-base">
                        <CheckCircle2 className="w-5 h-5 text-emerald-700" aria-hidden="true" />
                        Thank you for contacting NewSmart Homes
                      </div>
                      <p className="text-sm text-emerald-900 leading-relaxed">
                        Your enquiry has been recorded by our advisory desk. An agent will reach
                        out to you by phone or email shortly.
                      </p>
                      <div className="flex flex-wrap items-center gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => setContactSuccess(false)}
                          className="px-4 py-2 rounded-lg bg-white border border-emerald-300 text-xs font-semibold text-emerald-900 cursor-pointer"
                        >
                          Send Another Message
                        </button>
                        <a
                          href={buildWhatsAppUrl()}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#128C7E] text-white text-xs font-semibold"
                        >
                          <MessageCircle className="w-3.5 h-3.5" aria-hidden="true" />
                          Continue on WhatsApp
                        </a>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleContactSubmit} className="space-y-4">
                      {contactError && (
                        <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
                          {contactError}
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                            Full Name *
                          </label>
                          <input
                            type="text"
                            required
                            value={contactName}
                            onChange={(e) => setContactName(e.target.value)}
                            placeholder="Your full name"
                            className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E40AF]"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                            Email Address *
                          </label>
                          <input
                            type="email"
                            required
                            value={contactEmail}
                            onChange={(e) => setContactEmail(e.target.value)}
                            placeholder="you@example.com"
                            className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E40AF]"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                            Phone / WhatsApp Number *
                          </label>
                          <input
                            type="tel"
                            required
                            value={contactPhone}
                            onChange={(e) => setContactPhone(e.target.value)}
                            placeholder="+234 916..."
                            className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E40AF]"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                            Area of Interest
                          </label>
                          <select
                            value={contactInterest}
                            onChange={(e) => setContactInterest(e.target.value)}
                            className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E40AF]"
                          >
                            <option value="Property Purchase">Property Purchase</option>
                            <option value="Land Acquisition">Land Acquisition</option>
                            <option value="Estate Development">Estate Development</option>
                            <option value="Property Management">Property Management</option>
                            <option value="Real Estate Investment">Real Estate Investment</option>
                            <option value="Property Consultancy">Property Consultancy</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                          Message *
                        </label>
                        <textarea
                          rows={4}
                          required
                          value={contactMessage}
                          onChange={(e) => setContactMessage(e.target.value)}
                          placeholder="Tell us the location, budget, or service you are interested in..."
                          className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E40AF]"
                        />
                      </div>

                      <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <button
                          type="submit"
                          disabled={contactSubmitting}
                          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-[#1E40AF] hover:bg-[#17328A] disabled:opacity-60 text-white font-semibold text-sm transition-colors cursor-pointer"
                        >
                          <ShieldCheck className="w-4 h-4" aria-hidden="true" />
                          {contactSubmitting ? 'Sending Enquiry...' : 'Submit Enquiry'}
                        </button>

                        <span className="text-xs text-slate-500">
                          Or call directly:{' '}
                          <a
                            href={COMPANY_INFO.phoneHref}
                            className="font-semibold text-[#0A1628] hover:underline tabular-nums"
                          >
                            {COMPANY_INFO.phoneDisplay}
                          </a>
                        </span>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            </div>
          </section>
        </main>
      )}

      <Footer onNavigateHome={navigateToHome} onNavigateAdmin={navigateToAdmin} />

      {/* Prominent Pumping WhatsApp Button in Front of Homepage */}
      {view !== 'admin' && <PumpingWhatsApp />}
    </div>
  );
}
