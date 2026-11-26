import { Mail, MapPin, MessageCircle, Phone } from 'lucide-react';
import { buildWhatsAppUrl, COMPANY_INFO } from '../constants/brand';

interface FooterProps {
  onNavigateHome: (sectionId?: string) => void;
  onNavigateAdmin: () => void;
}

export function Footer({ onNavigateHome, onNavigateAdmin }: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#0A1628] text-slate-300 border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 pb-12 border-b border-white/10">
          {/* Brand Column */}
          <div className="lg:col-span-4 space-y-4">
            <a
              href="#home"
              onClick={(e) => {
                e.preventDefault();
                onNavigateHome('home');
              }}
              className="inline-flex items-center gap-2.5"
            >
              <svg viewBox="0 0 36 36" fill="none" className="w-8 h-8 shrink-0" aria-hidden="true">
                <rect width="36" height="36" rx="8" fill="#0F2342" stroke="#D4AF37" strokeWidth="1" />
                <path
                  d="M9 26V14.5L18 8L27 14.5V26H21.5V19H14.5V26H9Z"
                  stroke="#D4AF37"
                  strokeWidth="1.8"
                  strokeLinejoin="round"
                />
                <path d="M18 12.5V15.5" stroke="#FFFFFF" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
              <span className="font-display text-xl font-bold text-white tracking-tight">
                NewSmart <span className="text-[#D4AF37]">Homes</span>
              </span>
            </a>

            <p className="text-sm text-slate-400 leading-relaxed max-w-sm">
              Trusted real estate development, property acquisition, and facility management across
              Benin City, Edo State, Nigeria. Building dreams and creating lasting generational
              value.
            </p>

            {/* Social Media Links */}
            <div className="flex items-center gap-3 pt-2">
              <a
                href={buildWhatsAppUrl()}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                className="w-9 h-9 rounded-lg bg-white/5 hover:bg-[#1E40AF] text-slate-300 hover:text-white flex items-center justify-center transition-colors"
              >
                <MessageCircle className="w-4 h-4" aria-hidden="true" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="w-9 h-9 rounded-lg bg-white/5 hover:bg-[#1E40AF] text-slate-300 hover:text-white flex items-center justify-center transition-colors"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4" aria-hidden="true">
                  <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                </svg>
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="w-9 h-9 rounded-lg bg-white/5 hover:bg-[#1E40AF] text-slate-300 hover:text-white flex items-center justify-center transition-colors"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4" aria-hidden="true">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                </svg>
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="w-9 h-9 rounded-lg bg-white/5 hover:bg-[#1E40AF] text-slate-300 hover:text-white flex items-center justify-center transition-colors"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4" aria-hidden="true">
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                  <rect width="4" height="12" x="2" y="9" />
                  <circle cx="4" cy="4" r="2" />
                </svg>
              </a>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="lg:col-span-2 space-y-3">
            <h3 className="text-sm font-semibold text-white">Company</h3>
            <ul className="space-y-2.5 text-sm">
              {[
                { label: 'Home', id: 'home' },
                { label: 'About Us', id: 'about' },
                { label: 'Properties', id: 'properties' },
                { label: 'Estate Development', id: 'estate-development' },
                { label: 'Contact Us', id: 'contact' },
              ].map((item) => (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      onNavigateHome(item.id);
                    }}
                    className="text-slate-400 hover:text-[#D4AF37] transition-colors"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Services Links */}
          <div className="lg:col-span-2 space-y-3">
            <h3 className="text-sm font-semibold text-white">Services</h3>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li>
                <a
                  href="#services"
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigateHome('services');
                  }}
                  className="hover:text-[#D4AF37] transition-colors"
                >
                  Property Sales
                </a>
              </li>
              <li>
                <a
                  href="#services"
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigateHome('services');
                  }}
                  className="hover:text-[#D4AF37] transition-colors"
                >
                  Land Sales
                </a>
              </li>
              <li>
                <a
                  href="#services"
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigateHome('services');
                  }}
                  className="hover:text-[#D4AF37] transition-colors"
                >
                  Property Management
                </a>
              </li>
              <li>
                <a
                  href="#services"
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigateHome('services');
                  }}
                  className="hover:text-[#D4AF37] transition-colors"
                >
                  Real Estate Investment
                </a>
              </li>
              <li>
                <a
                  href="#services"
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigateHome('services');
                  }}
                  className="hover:text-[#D4AF37] transition-colors"
                >
                  Property Consultancy
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Information */}
          <div className="lg:col-span-4 space-y-3">
            <h3 className="text-sm font-semibold text-white">Benin City Head Office</h3>
            <ul className="space-y-3 text-sm text-slate-400">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#D4AF37] mt-0.5 shrink-0" aria-hidden="true" />
                <span>{COMPANY_INFO.address}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-[#D4AF37] shrink-0" aria-hidden="true" />
                <a href={COMPANY_INFO.phoneHref} className="hover:text-white transition-colors tabular-nums">
                  {COMPANY_INFO.phoneDisplay}
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <MessageCircle className="w-4 h-4 text-[#D4AF37] shrink-0" aria-hidden="true" />
                <a
                  href={buildWhatsAppUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors tabular-nums"
                >
                  WhatsApp: {COMPANY_INFO.whatsappDisplay}
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-[#D4AF37] shrink-0" aria-hidden="true" />
                <a
                  href={`mailto:${COMPANY_INFO.email}`}
                  className="hover:text-white transition-colors break-all"
                >
                  {COMPANY_INFO.email}
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Copyright + Admin Portal Link */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© {currentYear} NewSmart Homes. All rights reserved. Benin City, Edo State, Nigeria.</p>
          <button
            type="button"
            onClick={onNavigateAdmin}
            className="text-slate-400 hover:text-[#D4AF37] transition-colors cursor-pointer"
          >
            Admin Portal
          </button>
        </div>
      </div>
    </footer>
  );
}
