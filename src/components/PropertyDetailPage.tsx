import {
  ArrowLeft,
  Bath,
  BedDouble,
  Check,
  CheckCircle2,
  FileCheck2,
  MapPin,
  Maximize2,
  MessageCircle,
  Phone,
} from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { buildWhatsAppUrl, COMPANY_INFO } from '../constants/brand';
import type { Property } from '../types/realEstate';
import { ResilientImage } from './ResilientImage';

interface PropertyDetailPageProps {
  property: Property;
  onBack: () => void;
}

export function PropertyDetailPage({ property, onBack }: PropertyDetailPageProps) {
  const gallery =
    property.galleryUrls && property.galleryUrls.length > 0
      ? property.galleryUrls
      : [property.imageUrl];
  const [activeImage, setActiveImage] = useState<string>(gallery[0]);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState(
    `Hello NewSmart Homes, I would like to schedule an inspection and verify documentation for ${property.title} (${property.location}).`
  );
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const formattedPrice =
    property.priceLabel || `₦${Math.round(property.price).toLocaleString('en-NG')}`;

  useEffect(() => {
    setActiveImage(gallery[0]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const prevTitle = document.title;
    document.title = `${property.title} | NewSmart Homes Benin City`;
    return () => {
      document.title = prevTitle;
    };
  }, [property.id, property.title]);

  const whatsappUrl = buildWhatsAppUrl(
    `Hello NewSmart Homes, I want to make an enquiry about "${property.title}" in ${property.location} (${formattedPrice}).`
  );

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    if (fullName.trim().length < 2) {
      setSubmitError('Please enter your full name.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setSubmitError('Please enter a valid email address.');
      return;
    }
    if (phone.trim().length < 7) {
      setSubmitError('Please enter a valid phone or WhatsApp number.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          interest: property.category,
          propertyId: property.id,
          propertyTitle: property.title,
          message: message.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Could not submit your enquiry.');
      }
      setSubmitSuccess(true);
      setFullName('');
      setEmail('');
      setPhone('');
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Unable to send enquiry.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="bg-[#F8FAFC] py-10 sm:py-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Breadcrumb */}
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#0A1628] hover:text-[#1E40AF] transition-colors mb-8 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          Back to All Properties
        </button>

        {/* Property Header */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 pb-8 border-b border-slate-200 mb-10">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-2.5 text-xs font-semibold tracking-wide text-slate-600 mb-3">
              <span className="text-[#1E40AF]">{property.category}</span>
              <span aria-hidden="true">·</span>
              <span
                className={
                  property.availability === 'Available'
                    ? 'text-emerald-700'
                    : property.availability === 'Under Offer'
                      ? 'text-amber-700'
                      : 'text-slate-500'
                }
              >
                {property.availability}
              </span>
              <span aria-hidden="true">·</span>
              <span>{property.titleDocument}</span>
            </div>

            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-[#0A1628] tracking-tight text-balance mb-3">
              {property.title}
            </h1>

            <p className="inline-flex items-center gap-2 text-sm sm:text-base text-slate-600">
              <MapPin className="w-4 h-4 text-[#C9A227] shrink-0" aria-hidden="true" />
              {property.location}
            </p>
          </div>

          <div className="lg:text-right">
            <span className="block text-xs font-medium text-slate-500 mb-1">Asking Price</span>
            <span className="font-display text-3xl sm:text-4xl font-bold text-[#0A1628] tabular-nums">
              {formattedPrice}
            </span>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Left 7 cols: Gallery + Specs + Description */}
          <div className="lg:col-span-7 space-y-10">
            <div>
              <div className="aspect-[16/10] w-full rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                <ResilientImage
                  src={activeImage}
                  alt={property.title}
                  loading="eager"
                  fallbackLabel={property.title}
                />
              </div>

              {gallery.length > 1 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mt-4">
                  {gallery.map((img, index) => {
                    const isSelected = activeImage === img;
                    return (
                      <button
                        key={`${img}-${index}`}
                        type="button"
                        onClick={() => setActiveImage(img)}
                        aria-label={`View gallery photo ${index + 1}`}
                        className={`aspect-[4/3] rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                          isSelected
                            ? 'border-[#1E40AF] ring-2 ring-[#1E40AF]/20'
                            : 'border-transparent opacity-75 hover:opacity-100'
                        }`}
                      >
                        <ResilientImage
                          src={img}
                          alt={`${property.title} gallery ${index + 1}`}
                        />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Key Architectural Specs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-white border border-slate-200 rounded-xl p-6">
              <div>
                <span className="block text-xs text-slate-500 mb-1">Bedrooms</span>
                <span className="inline-flex items-center gap-1.5 text-base font-semibold text-[#0A1628] tabular-nums">
                  <BedDouble className="w-4 h-4 text-[#C9A227]" aria-hidden="true" />
                  {property.bedrooms > 0 ? property.bedrooms : 'Land Plot'}
                </span>
              </div>
              <div>
                <span className="block text-xs text-slate-500 mb-1">Bathrooms</span>
                <span className="inline-flex items-center gap-1.5 text-base font-semibold text-[#0A1628] tabular-nums">
                  <Bath className="w-4 h-4 text-[#C9A227]" aria-hidden="true" />
                  {property.bathrooms > 0 ? property.bathrooms : 'N/A'}
                </span>
              </div>
              <div>
                <span className="block text-xs text-slate-500 mb-1">Size / Area</span>
                <span className="inline-flex items-center gap-1.5 text-base font-semibold text-[#0A1628] tabular-nums">
                  <Maximize2 className="w-4 h-4 text-[#C9A227]" aria-hidden="true" />
                  {property.areaSqm || 'Surveyed'}
                </span>
              </div>
              <div>
                <span className="block text-xs text-slate-500 mb-1">Title Status</span>
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0A1628]">
                  <FileCheck2 className="w-4 h-4 text-[#1E40AF] shrink-0" aria-hidden="true" />
                  Verified
                </span>
              </div>
            </div>

            {/* Description */}
            <section className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-6">
              <div>
                <h2 className="font-display text-2xl font-bold text-[#0A1628] mb-3">
                  Property Overview
                </h2>
                <p className="text-slate-600 leading-relaxed text-[15px] sm:text-base whitespace-pre-line">
                  {property.description}
                </p>
              </div>

              {property.features && property.features.length > 0 && (
                <div className="pt-6 border-t border-slate-100">
                  <h3 className="text-base font-semibold text-[#0A1628] mb-4">
                    Key Specifications & Amenities
                  </h3>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {property.features.map((feat, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2.5 text-sm text-slate-700"
                      >
                        <Check className="w-4 h-4 text-[#C9A227] mt-0.5 shrink-0" aria-hidden="true" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          </div>

          {/* Right 5 cols: Sticky Inspection & Enquiry Card */}
          <aside className="lg:col-span-5 lg:sticky lg:top-24 space-y-6">
            <div className="bg-[#0A1628] text-white rounded-xl p-6 sm:p-8 space-y-5">
              <div>
                <span className="text-xs font-semibold tracking-wide text-[#D4AF37]">
                  Direct Property Desk
                </span>
                <h2 className="font-display text-2xl font-bold mt-1">
                  Speak With Our Benin City Advisors
                </h2>
                <p className="text-sm text-slate-300 mt-2 leading-relaxed">
                  Request the property survey dossier, schedule an in-person or live video
                  inspection, or discuss flexible payment terms.
                </p>
              </div>

              <div className="space-y-3 pt-1">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-5 rounded-lg bg-[#128C7E] hover:bg-[#0E7266] text-white font-semibold text-sm transition-colors"
                >
                  <MessageCircle className="w-4 h-4" aria-hidden="true" />
                  Enquire Instantly on WhatsApp
                </a>

                <a
                  href={COMPANY_INFO.phoneHref}
                  className="w-full inline-flex items-center justify-center gap-2 py-3 px-5 rounded-lg border border-white/20 hover:bg-white/10 text-white font-semibold text-sm transition-colors"
                >
                  <Phone className="w-4 h-4 text-[#D4AF37]" aria-hidden="true" />
                  Call {COMPANY_INFO.phoneDisplay}
                </a>
              </div>
            </div>

            {/* Enquiry Form */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8">
              <h3 className="font-display text-xl font-bold text-[#0A1628] mb-1">
                Book an Inspection
              </h3>
              <p className="text-xs text-slate-500 mb-5">
                Leave your contact details and our advisor will reach out promptly.
              </p>

              {submitSuccess ? (
                <div className="p-5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-2">
                  <div className="flex items-center gap-2 font-semibold text-sm">
                    <CheckCircle2 className="w-5 h-5 text-emerald-700" aria-hidden="true" />
                    Enquiry Received
                  </div>
                  <p className="text-xs leading-relaxed text-emerald-800">
                    Thank you. A NewSmart Homes advisor will contact you shortly regarding{' '}
                    <strong>{property.title}</strong>.
                  </p>
                  <button
                    type="button"
                    onClick={() => setSubmitSuccess(false)}
                    className="text-xs font-semibold text-[#1E40AF] hover:underline cursor-pointer pt-1"
                  >
                    Send another enquiry
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {submitError && (
                    <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
                      {submitError}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Osaro Edebiri"
                      className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E40AF] focus:border-transparent"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Email Address
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E40AF] focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Phone / WhatsApp
                      </label>
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+234..."
                        className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E40AF] focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Message
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E40AF] focus:border-transparent"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3 px-5 rounded-lg bg-[#1E40AF] hover:bg-[#17328A] disabled:opacity-60 text-white font-semibold text-sm transition-colors cursor-pointer"
                  >
                    {submitting ? 'Submitting Enquiry...' : 'Request Inspection & Dossier'}
                  </button>
                </form>
              )}
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
