import { buildWhatsAppUrl } from '../constants/brand';

export function PumpingWhatsApp() {
  const whatsappUrl = buildWhatsAppUrl(
    'Hello NewSmart Homes! I am visiting your website and would like assistance finding a property in Benin City.'
  );

  return (
    <div className="fixed bottom-5 right-5 z-40 flex items-center justify-end pointer-events-none">
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with NewSmart Homes on WhatsApp"
        className="pointer-events-auto relative group flex items-center gap-3 bg-[#128C7E] hover:bg-[#0E7266] text-white pl-3.5 pr-4 sm:pr-5 py-3 rounded-full shadow-[0_12px_30px_-6px_rgba(10,22,40,0.45)] border border-white/25 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] focus-visible:ring-offset-2 whatsapp-pump-btn"
      >
        {/* Soft pumping halo behind the button */}
        <span
          aria-hidden="true"
          className="absolute inset-0 rounded-full bg-[#25D366]/45 whatsapp-pump-ring -z-10"
        />

        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#25D366] text-white shrink-0 shadow-inner">
          <svg
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-4.5 h-4.5"
            aria-hidden="true"
          >
            <path d="M12.031 2c-5.516 0-9.969 4.453-9.969 9.969 0 1.766.469 3.484 1.344 5l-1.406 5.156 5.281-1.375c1.469.797 3.109 1.219 4.75 1.219 5.516 0 9.969-4.453 9.969-9.969S17.547 2 12.031 2zm5.813 14.125c-.25.703-1.438 1.344-2 1.422-.516.078-1.188.109-1.922-.125-.453-.141-1.031-.344-1.766-.656-3.094-1.328-5.109-4.469-5.266-4.672-.156-.203-1.266-1.688-1.266-3.219s.797-2.281 1.078-2.594c.281-.313.609-.391.813-.391s.406.016.578.016c.188 0 .438-.078.688.516.25.609.859 2.094.938 2.25.078.156.125.344.016.547-.094.203-.141.328-.297.5-.156.172-.313.391-.453.516-.156.141-.313.297-.141.594.172.297.781 1.281 1.672 2.078 1.156 1.031 2.125 1.359 2.422 1.516.297.156.469.125.641-.078.172-.203.75-.875.953-1.172.203-.297.406-.25.672-.156.266.094 1.719.813 2.016.953.297.141.484.219.563.344.078.125.078.734-.172 1.438z" />
          </svg>
        </span>

        <span className="flex flex-col text-left leading-tight whitespace-nowrap shrink-0">
          <span className="text-xs font-semibold tracking-wide text-white">WhatsApp Us</span>
          <span className="hidden sm:inline text-[11px] text-emerald-100 font-normal">
            Instant Property Desk
          </span>
        </span>
      </a>
    </div>
  );
}
