import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  Edit3,
  KeyRound,
  LogOut,
  MessageCircle,
  Plus,
  ShieldCheck,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { buildVisitorReplyWhatsAppUrl } from '../constants/brand';
import type {
  AdminStatusResponse,
  AvailabilityStatus,
  Enquiry,
  EnquiryStatus,
  Property,
  PropertyCategory,
} from '../types/realEstate';
import { ResilientImage } from './ResilientImage';

interface AdminDashboardProps {
  onBackHome: () => void;
  onPropertiesChanged: () => void;
}

const CATEGORIES: PropertyCategory[] = [
  'Luxury Homes',
  'Land & Plots',
  'Estate Developments',
  'Commercial',
];

const AVAILABILITY_OPTIONS: AvailabilityStatus[] = ['Available', 'Under Offer', 'Sold Out'];

interface PropertyFormState {
  title: string;
  category: PropertyCategory;
  location: string;
  price: string;
  priceLabel: string;
  bedrooms: string;
  bathrooms: string;
  areaSqm: string;
  titleDocument: string;
  availability: AvailabilityStatus;
  featured: boolean;
  description: string;
  featuresText: string;
  imageUrl: string;
  galleryText: string;
}

const EMPTY_FORM: PropertyFormState = {
  title: '',
  category: 'Luxury Homes',
  location: 'GRA, Benin City',
  price: '',
  priceLabel: '',
  bedrooms: '4',
  bathrooms: '4',
  areaSqm: '500 sqm',
  titleDocument: 'Certificate of Occupancy (C of O)',
  availability: 'Available',
  featured: true,
  description: '',
  featuresText: 'Certificate of Occupancy (C of O)\nPaved Access Road\n24/7 Estate Security',
  imageUrl: '/src/assets/images/prop_royal_duplex_1795633493733.jpg',
  galleryText: '',
};

export function AdminDashboard({ onBackHome, onPropertiesChanged }: AdminDashboardProps) {
  const [token, setToken] = useState<string | null>(null);
  const [status, setStatus] = useState<AdminStatusResponse | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);

  // Auth forms
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [authSubmitting, setAuthSubmitting] = useState(false);

  // Dashboard tabs & data
  const [activeTab, setActiveTab] = useState<'properties' | 'enquiries'>('properties');
  const [properties, setProperties] = useState<Property[]>([]);
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [actionError, setActionError] = useState('');
  const [actionNotice, setActionNotice] = useState('');

  // Property Editor Modal
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [formState, setFormState] = useState<PropertyFormState>(EMPTY_FORM);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [savingProperty, setSavingProperty] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const checkAdminStatus = useCallback(
    async (activeToken: string | null) => {
      setStatusLoading(true);
      try {
        const res = await fetch('/api/admin/status', {
          headers: activeToken ? { Authorization: `Bearer ${activeToken}` } : {},
        });
        const data = (await res.json()) as AdminStatusResponse;
        setStatus(data);
        if (activeToken && !data.authenticated) {
          setToken(null);
        }
      } catch {
        setAuthError('Unable to reach administration server.');
      } finally {
        setStatusLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    const prevTitle = document.title;
    document.title = 'Admin Portal | NewSmart Homes';
    checkAdminStatus(token);
    return () => {
      document.title = prevTitle;
    };
  }, [checkAdminStatus]);

  const loadDashboardData = useCallback(async (authToken: string) => {
    setDataLoading(true);
    setActionError('');
    try {
      const [propsRes, enqRes] = await Promise.all([
        fetch('/api/properties'),
        fetch('/api/admin/enquiries', {
          headers: { Authorization: `Bearer ${authToken}` },
        }),
      ]);

      if (enqRes.status === 401) {
        setToken(null);
        return;
      }

      const propsData = await propsRes.json();
      const enqData = await enqRes.json();
      setProperties(Array.isArray(propsData.properties) ? propsData.properties : []);
      setEnquiries(Array.isArray(enqData.enquiries) ? enqData.enquiries : []);
    } catch {
      setActionError('Unable to load properties and enquiries.');
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token) {
      loadDashboardData(token);
    }
  }, [token, loadDashboardData]);

  const handleFirstRunSetup = async (e: FormEvent) => {
    e.preventDefault();
    setAuthError('');
    if (passwordInput.trim().length < 8) {
      setAuthError('Please choose a password with at least 8 characters.');
      return;
    }
    if (passwordInput !== confirmPasswordInput) {
      setAuthError('Passwords do not match.');
      return;
    }

    setAuthSubmitting(true);
    try {
      const res = await fetch('/api/admin/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: passwordInput }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Setup failed.');
      }
      setToken(data.token);
      setPasswordInput('');
      setConfirmPasswordInput('');
      await checkAdminStatus(data.token);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Unable to complete setup.');
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setAuthError('');
    if (!passwordInput.trim()) {
      setAuthError('Please enter your administrator password.');
      return;
    }

    setAuthSubmitting(true);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: emailInput.trim() || undefined,
          password: passwordInput,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Invalid credentials.');
      }
      setToken(data.token);
      setPasswordInput('');
      await checkAdminStatus(data.token);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Sign-in failed.');
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleLogout = () => {
    setToken(null);
    setProperties([]);
    setEnquiries([]);
    setActionNotice('');
  };

  const openNewPropertyModal = () => {
    setEditingProperty(null);
    setFormState(EMPTY_FORM);
    setActionError('');
    setEditorOpen(true);
  };

  const openEditPropertyModal = (prop: Property) => {
    setEditingProperty(prop);
    setFormState({
      title: prop.title,
      category: prop.category,
      location: prop.location,
      price: String(prop.price),
      priceLabel: prop.priceLabel || '',
      bedrooms: String(prop.bedrooms ?? 0),
      bathrooms: String(prop.bathrooms ?? 0),
      areaSqm: prop.areaSqm || '',
      titleDocument: prop.titleDocument || '',
      availability: prop.availability,
      featured: prop.featured,
      description: prop.description,
      featuresText: (prop.features || []).join('\n'),
      imageUrl: prop.imageUrl,
      galleryText: (prop.galleryUrls || []).join('\n'),
    });
    setActionError('');
    setEditorOpen(true);
  };

  const handleImageFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;

    setUploadingImage(true);
    setActionError('');
    try {
      const body = new FormData();
      body.append('image', file);
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Image upload failed.');
      }
      setFormState((prev) => ({
        ...prev,
        imageUrl: data.url,
        galleryText: prev.galleryText
          ? `${data.url}\n${prev.galleryText}`
          : data.url,
      }));
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Unable to upload image.');
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  const handleSaveProperty = async (e: FormEvent) => {
    e.preventDefault();
    if (!token) return;

    const numericPrice = Number(formState.price.replace(/[^0-9.]/g, ''));
    if (Number.isNaN(numericPrice) || numericPrice < 0) {
      setActionError('Please enter a valid numeric price in Nigerian Naira.');
      return;
    }

    const features = formState.featuresText
      .split(/\n|,/)
      .map((s) => s.trim())
      .filter(Boolean);
    const galleryUrls = formState.galleryText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
    if (!galleryUrls.includes(formState.imageUrl.trim()) && formState.imageUrl.trim()) {
      galleryUrls.unshift(formState.imageUrl.trim());
    }

    const payload = {
      title: formState.title.trim(),
      category: formState.category,
      location: formState.location.trim(),
      price: numericPrice,
      priceLabel: formState.priceLabel.trim() || undefined,
      bedrooms: Number(formState.bedrooms) || 0,
      bathrooms: Number(formState.bathrooms) || 0,
      areaSqm: formState.areaSqm.trim(),
      titleDocument: formState.titleDocument.trim(),
      availability: formState.availability,
      featured: formState.featured,
      description: formState.description.trim(),
      features,
      imageUrl: formState.imageUrl.trim(),
      galleryUrls,
    };

    setSavingProperty(true);
    setActionError('');
    try {
      const endpoint = editingProperty
        ? `/api/admin/properties/${editingProperty.id}`
        : '/api/admin/properties';
      const method = editingProperty ? 'PUT' : 'POST';

      const res = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Could not save property.');
      }

      setEditorOpen(false);
      setActionNotice(
        editingProperty
          ? `Updated "${data.property.title}" successfully.`
          : `Added "${data.property.title}" to listings.`
      );
      await loadDashboardData(token);
      onPropertiesChanged();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Unable to save property.');
    } finally {
      setSavingProperty(false);
    }
  };

  const handleDeleteProperty = async (id: string) => {
    if (!token) return;
    setActionError('');
    try {
      const res = await fetch(`/api/admin/properties/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete property.');
      }
      setConfirmDeleteId(null);
      setActionNotice('Property listing removed.');
      await loadDashboardData(token);
      onPropertiesChanged();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Unable to delete property.');
    }
  };

  const handleEnquiryStatusChange = async (id: string, nextStatus: EnquiryStatus) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/admin/enquiries/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        setEnquiries((prev) =>
          prev.map((item) => (item.id === id ? { ...item, status: nextStatus } : item))
        );
      }
    } catch {
      setActionError('Unable to update enquiry status.');
    }
  };

  if (statusLoading) {
    return (
      <main className="min-h-[75vh] flex items-center justify-center bg-[#F8FAFC] px-4">
        <p className="text-sm font-medium text-slate-600">Loading administration portal...</p>
      </main>
    );
  }

  // Auth Gate
  if (!token) {
    const isSetup = Boolean(status?.needsSetup);

    return (
      <main className="min-h-[80vh] bg-[#F8FAFC] py-16 px-4 sm:px-6 flex items-center justify-center">
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-xl p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={onBackHome}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-[#0A1628] cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
              Back to Website
            </button>
            <ShieldCheck className="w-5 h-5 text-[#1E40AF]" aria-hidden="true" />
          </div>

          <div>
            <h1 className="font-display text-2xl font-bold text-[#0A1628]">
              {isSetup ? 'Claim Admin Access' : 'NewSmart Homes Admin'}
            </h1>
            <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">
              {isSetup
                ? 'Set a secure administrator password to manage property listings, photos, and client enquiries.'
                : 'Sign in to manage Benin City property listings, pricing, availability, and visitor enquiries.'}
            </p>
          </div>

          {authError && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
              {authError}
            </div>
          )}

          {isSetup ? (
            <form onSubmit={handleFirstRunSetup} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Create Admin Password (min. 8 characters)
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E40AF]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Confirm Password
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={confirmPasswordInput}
                  onChange={(e) => setConfirmPasswordInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E40AF]"
                />
              </div>
              <button
                type="submit"
                disabled={authSubmitting}
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-[#1E40AF] hover:bg-[#17328A] text-white text-sm font-semibold transition-colors cursor-pointer disabled:opacity-60"
              >
                <KeyRound className="w-4 h-4" aria-hidden="true" />
                {authSubmitting ? 'Securing Portal...' : 'Set Password & Enter Dashboard'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4">
              {status?.supabaseAuthEnabled && !status?.envPasscodeActive && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Admin Email (optional if using local passcode)
                  </label>
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="admin@newsmarthomes.com"
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E40AF]"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Administrator Password
                </label>
                <input
                  type="password"
                  required
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Enter admin password"
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E40AF]"
                />
              </div>

              <button
                type="submit"
                disabled={authSubmitting}
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-[#0A1628] hover:bg-[#142847] text-white text-sm font-semibold transition-colors cursor-pointer disabled:opacity-60"
              >
                <KeyRound className="w-4 h-4 text-[#D4AF37]" aria-hidden="true" />
                {authSubmitting ? 'Verifying...' : 'Sign In to Dashboard'}
              </button>
            </form>
          )}
        </div>
      </main>
    );
  }

  const availableCount = properties.filter((p) => p.availability === 'Available').length;
  const underOfferCount = properties.filter((p) => p.availability === 'Under Offer').length;
  const newEnquiriesCount = enquiries.filter((e) => e.status === 'New').length;

  return (
    <main className="min-h-[85vh] bg-[#F8FAFC] py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Admin Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <button
              type="button"
              onClick={onBackHome}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1E40AF] hover:underline mb-2 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
              Return to Public Website
            </button>
            <h1 className="font-display text-3xl font-bold text-[#0A1628]">
              Property & Enquiry Management
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              {status?.supabaseConfigured
                ? 'Connected to Supabase PostgreSQL & Storage'
                : 'Workspace Storage Active · Add SUPABASE_URL & SUPABASE_SERVICE_ROLE_KEY in Secrets for cloud sync'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={openNewPropertyModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#1E40AF] hover:bg-[#17328A] text-white text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              Add Property
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <LogOut className="w-4 h-4" aria-hidden="true" />
              Sign Out
            </button>
          </div>
        </div>

        {/* Summary Metrics Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <span className="text-xs font-medium text-slate-500">Total Properties</span>
            <p className="font-display text-3xl font-bold text-[#0A1628] mt-1 tabular-nums">
              {properties.length}
            </p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <span className="text-xs font-medium text-slate-500">Available Listings</span>
            <p className="font-display text-3xl font-bold text-emerald-700 mt-1 tabular-nums">
              {availableCount}
            </p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <span className="text-xs font-medium text-slate-500">Under Offer</span>
            <p className="font-display text-3xl font-bold text-amber-700 mt-1 tabular-nums">
              {underOfferCount}
            </p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <span className="text-xs font-medium text-slate-500">New Enquiries</span>
            <p className="font-display text-3xl font-bold text-[#1E40AF] mt-1 tabular-nums">
              {newEnquiriesCount}
            </p>
          </div>
        </div>

        {/* Notices */}
        {actionNotice && (
          <div className="flex items-center justify-between p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-sm text-emerald-900">
            <span className="inline-flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" aria-hidden="true" />
              {actionNotice}
            </span>
            <button
              type="button"
              onClick={() => setActionNotice('')}
              className="text-emerald-700 hover:text-emerald-900 cursor-pointer"
              aria-label="Dismiss notice"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {actionError && (
          <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
            {actionError}
          </div>
        )}

        {/* Segmented Tabs */}
        <div className="inline-flex items-center gap-1 p-1 bg-slate-200/70 rounded-lg">
          <button
            type="button"
            onClick={() => setActiveTab('properties')}
            className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors cursor-pointer ${
              activeTab === 'properties'
                ? 'bg-white text-[#0A1628] shadow-sm'
                : 'text-slate-600 hover:text-[#0A1628]'
            }`}
          >
            Properties ({properties.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('enquiries')}
            className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors cursor-pointer ${
              activeTab === 'enquiries'
                ? 'bg-white text-[#0A1628] shadow-sm'
                : 'text-slate-600 hover:text-[#0A1628]'
            }`}
          >
            Client Enquiries ({enquiries.length})
          </button>
        </div>

        {/* Tab Content */}
        {dataLoading ? (
          <div className="bg-white border border-slate-200 rounded-xl p-10 text-center text-sm text-slate-500">
            Loading inventory...
          </div>
        ) : activeTab === 'properties' ? (
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            {properties.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <Building2 className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-sm font-medium text-slate-600">No properties listed yet.</p>
                <button
                  type="button"
                  onClick={openNewPropertyModal}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1E40AF] text-white text-xs font-semibold cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Your First Property
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-200">
                {properties.map((prop) => (
                  <div
                    key={prop.id}
                    className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors"
                  >
                    <div className="flex items-start sm:items-center gap-4 min-w-0">
                      <div className="w-24 h-18 rounded-lg overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                        <ResilientImage src={prop.imageUrl} alt={prop.title} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mb-1">
                          <span className="font-semibold text-[#1E40AF]">{prop.category}</span>
                          <span aria-hidden="true">·</span>
                          <span
                            className={
                              prop.availability === 'Available'
                                ? 'text-emerald-700 font-medium'
                                : prop.availability === 'Under Offer'
                                  ? 'text-amber-700 font-medium'
                                  : 'text-slate-500 font-medium'
                            }
                          >
                            {prop.availability}
                          </span>
                          {prop.featured && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="text-[#9E7B13] font-semibold">Featured</span>
                            </>
                          )}
                        </div>
                        <h3 className="font-display text-lg font-bold text-[#0A1628] truncate">
                          {prop.title}
                        </h3>
                        <p className="text-xs text-slate-600 mt-0.5">
                          {prop.location} ·{' '}
                          <span className="font-semibold text-[#0A1628] tabular-nums">
                            {prop.priceLabel || `₦${Math.round(prop.price).toLocaleString('en-NG')}`}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => openEditPropertyModal(prop)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-xs font-semibold text-[#0A1628] transition-colors cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" aria-hidden="true" />
                        Edit
                      </button>

                      {confirmDeleteId === prop.id ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleDeleteProperty(prop.id)}
                            className="px-3 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold cursor-pointer"
                          >
                            Confirm Delete
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-2.5 py-2 rounded-lg border border-slate-200 text-xs text-slate-600 cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(prop.id)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-red-200 bg-white hover:bg-red-50 text-xs font-semibold text-red-700 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            {enquiries.length === 0 ? (
              <div className="p-12 text-center text-sm text-slate-500">
                No visitor enquiries received yet. Enquiries from your Contact Form and Property
                Pages will appear here.
              </div>
            ) : (
              <div className="divide-y divide-slate-200">
                {enquiries.map((enq) => (
                  <div key={enq.id} className="p-5 sm:p-6 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mb-1">
                          <span className="font-semibold text-[#1E40AF]">{enq.interest}</span>
                          {enq.propertyTitle && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="text-[#0A1628] font-medium">
                                {enq.propertyTitle}
                              </span>
                            </>
                          )}
                          <span aria-hidden="true">·</span>
                          <span className="tabular-nums">
                            {new Date(enq.createdAt).toLocaleDateString('en-NG', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-[#0A1628]">{enq.fullName}</h3>
                        <p className="text-xs text-slate-600">
                          {enq.email} · <span className="tabular-nums">{enq.phone}</span>
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2.5">
                        <select
                          aria-label={`Status for ${enq.fullName}`}
                          value={enq.status}
                          onChange={(e) =>
                            handleEnquiryStatusChange(enq.id, e.target.value as EnquiryStatus)
                          }
                          className="px-3 py-1.5 text-xs font-semibold border border-slate-300 rounded-lg bg-white text-[#0A1628] focus:outline-none focus:ring-2 focus:ring-[#1E40AF]"
                        >
                          <option value="New">New</option>
                          <option value="Contacted">Contacted</option>
                          <option value="Closed">Closed</option>
                        </select>

                        <a
                          href={buildVisitorReplyWhatsAppUrl(
                            enq.phone,
                            enq.fullName,
                            enq.propertyTitle || enq.interest
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#128C7E] hover:bg-[#0E7266] text-white text-xs font-semibold transition-colors"
                        >
                          <MessageCircle className="w-3.5 h-3.5" aria-hidden="true" />
                          Reply on WhatsApp
                        </a>
                      </div>
                    </div>

                    <p className="text-sm text-slate-700 bg-slate-50 rounded-lg p-3.5 border border-slate-100">
                      {enq.message}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add / Edit Property Modal */}
      {editorOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={editingProperty ? 'Edit Property' : 'Add New Property'}
          className="fixed inset-0 z-50 bg-[#0A1628]/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="bg-white rounded-xl border border-slate-200 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between z-10">
              <h2 className="font-display text-xl font-bold text-[#0A1628]">
                {editingProperty ? 'Edit Property Listing' : 'Add New Property'}
              </h2>
              <button
                type="button"
                onClick={() => setEditorOpen(false)}
                aria-label="Close modal"
                className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProperty} className="p-6 space-y-5">
              {actionError && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
                  {actionError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Property Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formState.title}
                    onChange={(e) => setFormState({ ...formState, title: e.target.value })}
                    placeholder="e.g. Royal Crest 5-Bedroom Duplex"
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E40AF]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Category *
                  </label>
                  <select
                    value={formState.category}
                    onChange={(e) =>
                      setFormState({ ...formState, category: e.target.value as PropertyCategory })
                    }
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#1E40AF]"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Availability *
                  </label>
                  <select
                    value={formState.availability}
                    onChange={(e) =>
                      setFormState({
                        ...formState,
                        availability: e.target.value as AvailabilityStatus,
                      })
                    }
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#1E40AF]"
                  >
                    {AVAILABILITY_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Location *
                  </label>
                  <input
                    type="text"
                    required
                    value={formState.location}
                    onChange={(e) => setFormState({ ...formState, location: e.target.value })}
                    placeholder="e.g. GRA, Benin City"
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E40AF]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Price (NGN Numeric) *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={formState.price}
                    onChange={(e) => setFormState({ ...formState, price: e.target.value })}
                    placeholder="e.g. 165000000"
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg tabular-nums focus:outline-none focus:ring-2 focus:ring-[#1E40AF]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Display Price Label (Optional)
                  </label>
                  <input
                    type="text"
                    value={formState.priceLabel}
                    onChange={(e) => setFormState({ ...formState, priceLabel: e.target.value })}
                    placeholder="e.g. From ₦85,000,000"
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E40AF]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Area / Plot Size
                  </label>
                  <input
                    type="text"
                    value={formState.areaSqm}
                    onChange={(e) => setFormState({ ...formState, areaSqm: e.target.value })}
                    placeholder="e.g. 600 sqm"
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E40AF]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Bedrooms
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formState.bedrooms}
                    onChange={(e) => setFormState({ ...formState, bedrooms: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg tabular-nums focus:outline-none focus:ring-2 focus:ring-[#1E40AF]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Bathrooms
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formState.bathrooms}
                    onChange={(e) => setFormState({ ...formState, bathrooms: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg tabular-nums focus:outline-none focus:ring-2 focus:ring-[#1E40AF]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Title Document
                  </label>
                  <input
                    type="text"
                    value={formState.titleDocument}
                    onChange={(e) => setFormState({ ...formState, titleDocument: e.target.value })}
                    placeholder="Certificate of Occupancy (C of O)"
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E40AF]"
                  />
                </div>

                {/* Image Upload & URL */}
                <div className="sm:col-span-2 space-y-2">
                  <label className="block text-xs font-semibold text-slate-700">
                    Primary Property Image *
                  </label>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="text"
                      required
                      value={formState.imageUrl}
                      onChange={(e) => setFormState({ ...formState, imageUrl: e.target.value })}
                      placeholder="/src/assets/... or https://..."
                      className="flex-1 px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E40AF]"
                    />
                    <label className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-slate-300 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-[#0A1628] cursor-pointer whitespace-nowrap shrink-0">
                      <Upload className="w-4 h-4 text-[#1E40AF]" aria-hidden="true" />
                      {uploadingImage ? 'Uploading...' : 'Upload Photo'}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleImageFileUpload}
                        disabled={uploadingImage}
                        className="sr-only"
                      />
                    </label>
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Description *
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={formState.description}
                    onChange={(e) => setFormState({ ...formState, description: e.target.value })}
                    placeholder="Describe the property architecture, finishes, neighborhood, and investment value..."
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E40AF]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Key Features (one per line)
                  </label>
                  <textarea
                    rows={3}
                    value={formState.featuresText}
                    onChange={(e) => setFormState({ ...formState, featuresText: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E40AF]"
                  />
                </div>

                <div className="sm:col-span-2 flex items-center gap-2.5">
                  <input
                    id="featured-checkbox"
                    type="checkbox"
                    checked={formState.featured}
                    onChange={(e) => setFormState({ ...formState, featured: e.target.checked })}
                    className="w-4 h-4 rounded border-slate-300 text-[#1E40AF] focus:ring-[#1E40AF]"
                  />
                  <label htmlFor="featured-checkbox" className="text-sm font-medium text-slate-700">
                    Highlight in Featured Properties on Homepage
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditorOpen(false)}
                  className="px-4 py-2.5 rounded-lg border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProperty || uploadingImage}
                  className="px-5 py-2.5 rounded-lg bg-[#1E40AF] hover:bg-[#17328A] text-white text-sm font-semibold transition-colors cursor-pointer disabled:opacity-60"
                >
                  {savingProperty
                    ? 'Saving...'
                    : editingProperty
                      ? 'Save Changes'
                      : 'Publish Property'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
