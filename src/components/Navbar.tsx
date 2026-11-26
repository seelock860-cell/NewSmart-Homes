import { Menu, X } from 'lucide-react';
import { useState } from 'react';

interface NavbarProps {
  currentView: 'home' | 'property' | 'admin';
  onNavigateHome: (sectionId?: string) => void;
}

const NAV_LINKS = [
  { label: 'Home', sectionId: 'home' },
  { label: 'About Us', sectionId: 'about' },
  { label: 'Properties', sectionId: 'properties' },
  { label: 'Estate Development', sectionId: 'estate-development' },
  { label: 'Property Management', sectionId: 'services' },
  { label: 'Contact Us', sectionId: 'contact' },
];

export function Navbar({ onNavigateHome }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLinkClick = (sectionId: string) => {
    setMobileOpen(false);
    onNavigateHome(sectionId);
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-[72px] flex items-center justify-between gap-8">
        {/* Zone 1: Single-line Brand Mark + Wordmark */}
        <a
          href="#home"
          onClick={(e) => {
            e.preventDefault();
            handleLinkClick('home');
          }}
          className="flex items-center gap-2.5 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E40AF] rounded"
        >
          <svg
            viewBox="0 0 36 36"
            fill="none"
            className="w-8 h-8 shrink-0"
            aria-hidden="true"
          >
            <rect width="36" height="36" rx="8" fill="#0A1628" />
            <path
              d="M9 26V14.5L18 8L27 14.5V26H21.5V19H14.5V26H9Z"
              stroke="#D4AF37"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
            <path d="M18 12.5V15.5" stroke="#FFFFFF" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          <span className="font-display text-xl font-bold tracking-tight text-[#0A1628]">
            NewSmart <span className="text-[#1E40AF]">Homes</span>
          </span>
        </a>

        {/* Zone 2: Clean single-line navigation links */}
        <nav
          aria-label="Primary navigation"
          className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-600"
        >
          {NAV_LINKS.map((item) => (
            <a
              key={item.sectionId}
              href={`#${item.sectionId}`}
              onClick={(e) => {
                e.preventDefault();
                handleLinkClick(item.sectionId);
              }}
              className="relative py-1 hover:text-[#0A1628] transition-colors whitespace-nowrap shrink-0 after:content-[''] after:absolute after:left-0 after:bottom-0 after:w-0 after:h-[1.5px] after:bg-[#C9A227] hover:after:w-full after:transition-all after:duration-200"
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* Zone 3: 1 Primary Action CTA */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => handleLinkClick('properties')}
            className="hidden sm:inline-flex items-center justify-center px-5 py-2.5 text-sm font-semibold text-white bg-[#1E40AF] hover:bg-[#17328A] rounded-lg transition-colors duration-200 whitespace-nowrap shrink-0 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E40AF] focus-visible:ring-offset-2 cursor-pointer"
          >
            Find Your Property
          </button>

          <button
            type="button"
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((prev) => !prev)}
            className="lg:hidden inline-flex items-center justify-center w-11 h-11 rounded-lg border border-slate-200 text-[#0A1628] hover:bg-slate-50 transition-colors cursor-pointer"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-2 shadow-lg">
          {NAV_LINKS.map((item) => (
            <a
              key={item.sectionId}
              href={`#${item.sectionId}`}
              onClick={(e) => {
                e.preventDefault();
                handleLinkClick(item.sectionId);
              }}
              className="block px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-[#0A1628] transition-colors"
            >
              {item.label}
            </a>
          ))}
          <div className="pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => handleLinkClick('properties')}
              className="w-full py-3 px-4 text-sm font-semibold text-white bg-[#1E40AF] hover:bg-[#17328A] rounded-lg transition-colors cursor-pointer"
            >
              Find Your Property
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
