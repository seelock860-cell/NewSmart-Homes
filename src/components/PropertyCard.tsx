import { ArrowUpRight, BedDouble, Bath, MapPin, Maximize2, MessageCircle } from 'lucide-react';
import { buildWhatsAppUrl } from '../constants/brand';
import type { Property } from '../types/realEstate';
import { ResilientImage } from './ResilientImage';

interface PropertyCardProps {
  property: Property;
  onSelectProperty: (property: Property) => void;
}

export function PropertyCard({ property, onSelectProperty }: PropertyCardProps) {
  const formattedPrice =
    property.priceLabel || `₦${Math.round(property.price).toLocaleString('en-NG')}`;

  const whatsappHref = buildWhatsAppUrl(
    `Hello NewSmart Homes, I am interested in "${property.title}" (${property.location}) listed at ${formattedPrice}. Please share inspection details.`
  );

  const statusTextColor =
    property.availability === 'Available'
      ? 'text-emerald-700'
      : property.availability === 'Under Offer'
        ? 'text-amber-700'
        : 'text-slate-500';

  return (
    <article className="group bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col transition-shadow duration-200 hover:shadow-[0_18px_40px_-15px_rgba(10,22,40,0.14)]">
      {/* 4:3 Photography */}
      <button
        type="button"
        onClick={() => onSelectProperty(property)}
        className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100 text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E40AF]"
      >
        <ResilientImage
          src={property.imageUrl}
          alt={`${property.title} in ${property.location}`}
          fallbackLabel={property.title}
          className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
        />
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#0A1628]/70 via-[#0A1628]/25 to-transparent"
        />
        <div className="absolute bottom-3.5 left-4 right-4 flex items-end justify-between gap-2 text-white">
          <span className="text-lg font-bold tracking-tight tabular-nums drop-shadow-sm">
            {formattedPrice}
          </span>
          <span className="text-xs font-medium tracking-wide text-slate-100">
            {property.titleDocument.split('(')[0].trim()}
          </span>
        </div>
      </button>

      {/* Content */}
      <div className="p-6 flex flex-col flex-1">
        {/* Zero-Pill Unboxed Metadata */}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-medium text-slate-500 mb-2.5">
          <span className="text-[#1E40AF] font-semibold">{property.category}</span>
          <span aria-hidden="true">·</span>
          <span className={statusTextColor}>{property.availability}</span>
        </div>

        <h3 className="font-display text-xl font-semibold text-[#0A1628] leading-snug mb-1.5 group-hover:text-[#1E40AF] transition-colors">
          <button
            type="button"
            onClick={() => onSelectProperty(property)}
            className="text-left cursor-pointer focus-visible:outline-none focus-visible:underline"
          >
            {property.title}
          </button>
        </h3>

        <p className="flex items-center gap-1.5 text-xs font-medium text-slate-600 mb-3">
          <MapPin className="w-3.5 h-3.5 text-[#C9A227] shrink-0" aria-hidden="true" />
          <span className="truncate">{property.location}</span>
        </p>

        <p className="text-sm text-slate-600 leading-relaxed line-clamp-2 mb-5 flex-1">
          {property.description}
        </p>

        {/* Specs Row */}
        <div className="flex flex-wrap items-center gap-4 py-3 border-t border-slate-100 text-xs font-medium text-slate-700 tabular-nums mb-5">
          {property.bedrooms > 0 && (
            <span className="inline-flex items-center gap-1.5">
              <BedDouble className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
              {property.bedrooms} Beds
            </span>
          )}
          {property.bathrooms > 0 && (
            <span className="inline-flex items-center gap-1.5">
              <Bath className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
              {property.bathrooms} Baths
            </span>
          )}
          {property.areaSqm && (
            <span className="inline-flex items-center gap-1.5">
              <Maximize2 className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
              {property.areaSqm}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => onSelectProperty(property)}
            className="inline-flex items-center justify-center gap-1.5 py-2.5 px-3 text-xs font-semibold text-[#0A1628] bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E40AF]"
          >
            View Details
            <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
          </button>

          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-1.5 py-2.5 px-3 text-xs font-semibold text-white bg-[#1E40AF] hover:bg-[#17328A] rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E40AF]"
          >
            <MessageCircle className="w-3.5 h-3.5" aria-hidden="true" />
            WhatsApp Enquiry
          </a>
        </div>
      </div>
    </article>
  );
}
