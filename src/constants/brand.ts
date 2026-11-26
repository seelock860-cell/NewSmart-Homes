export const COMPANY_INFO = {
  name: 'NewSmart Homes',
  tagline: 'Building Dreams. Creating Lasting Value.',
  address: 'Asien Plaza, 13 1st East Circular Road, Benin City, Edo State, Nigeria.',
  shortAddress: 'Asien Plaza, 13 1st East Circular Road, Benin City',
  phoneDisplay: '+234 916 963 3483',
  phoneHref: 'tel:+2349169633483',
  whatsappDisplay: '+234 911 211 8017',
  whatsappDigits: '2349112118017',
  email: 'contactnewsmarthomes@gmail.com',
};

export function buildWhatsAppUrl(customMessage?: string): string {
  const defaultMsg =
    'Hello NewSmart Homes, I would like to enquire about your properties and real estate services in Benin City.';
  const text = encodeURIComponent(customMessage || defaultMsg);
  return `https://wa.me/${COMPANY_INFO.whatsappDigits}?text=${text}`;
}

export function buildVisitorReplyWhatsAppUrl(phone: string, visitorName: string, subject?: string | null): string {
  const digits = phone.replace(/[^0-9]/g, '');
  const normalized = digits.startsWith('0') ? `234${digits.slice(1)}` : digits;
  const text = encodeURIComponent(
    `Hello ${visitorName}, thank you for contacting NewSmart Homes regarding ${subject || 'your property enquiry'} in Benin City. How may we assist you today?`
  );
  return `https://wa.me/${normalized}?text=${text}`;
}

export const SERVICES_LIST = [
  {
    number: '01',
    title: 'Property Sales',
    description:
      'Acquisition of verified luxury duplexes, smart terraces, and executive residences across GRA, Ugbor, Airport Road, and prime Benin City neighbourhoods.',
  },
  {
    number: '02',
    title: 'Land Sales',
    description:
      'Surveyed, litigation-free dry land with clear EdoGIS documentation, perimeter fencing, and instant physical allocation for residential or commercial builds.',
  },
  {
    number: '03',
    title: 'Estate Development',
    description:
      'Master-planned gated communities engineered with paved road networks, covered drainage, solar street illumination, and 24/7 controlled security.',
  },
  {
    number: '04',
    title: 'Property Management',
    description:
      'End-to-end tenant vetting, structured rent administration, preventive facility upkeep, and transparent asset reporting for local and diaspora landlords.',
  },
  {
    number: '05',
    title: 'Real Estate Investment',
    description:
      'Data-backed land banking, off-plan residential developments, and high-yield rental portfolios structured for resilient long-term capital appreciation.',
  },
  {
    number: '06',
    title: 'Property Consultancy',
    description:
      'Independent title verification, EdoGIS charting, feasibility appraisals, and legal documentation guidance so every transaction closes with confidence.',
  },
];

export const WHY_CHOOSE_PILLARS = [
  {
    number: '01',
    title: 'Professional Service',
    description:
      'Dedicated real estate advisors and chartered facility teams delivering punctual inspections, clear paperwork, and responsive communication.',
  },
  {
    number: '02',
    title: 'Trusted Property Guidance',
    description:
      'Every plot and home undergoes thorough title charting and physical verification before listing, protecting your capital from hidden encumbrances.',
  },
  {
    number: '03',
    title: 'Quality Estate Development',
    description:
      'We build with durable structural specifications, proper storm drainage, paved access roads, and lasting architectural elegance.',
  },
  {
    number: '04',
    title: 'Customer Satisfaction',
    description:
      'From first inspection to key handover and post-purchase facility care, our client relationships continue long after closing day.',
  },
  {
    number: '05',
    title: 'Investment Opportunities',
    description:
      'Strategic corridors in Benin City vetted for infrastructure growth, diaspora rental demand, and strong multi-year equity appreciation.',
  },
];

export const TESTIMONIALS = [
  {
    quote:
      'Purchasing a 5-bedroom duplex in GRA while living in London felt daunting until NewSmart Homes stepped in. They handled video inspections, EdoGIS title verification, and now manage the tenants seamlessly.',
    name: 'Engr. Osahon Igbinovia',
    role: 'Diaspora Property Owner · London & Benin City',
    outcome: 'Title perfected in 6 weeks · 100% occupancy',
  },
  {
    quote:
      'We acquired two serviced plots along the Sapele Road corridor for our family compound. Documentation was transparent from day one, and physical allocation happened the very week we completed payment.',
    name: 'Dr. (Mrs.) Ekiuwa Omoregie',
    role: 'Consultant Physician · Benin City',
    outcome: 'Instant plot allocation · Zero hidden fees',
  },
  {
    quote:
      'As an investor managing multiple commercial and residential units near East Circular, entrusting NewSmart Homes with property management restored my peace of mind and improved annual rent collection.',
    name: 'Chief Nosakhare Aimufua',
    role: 'Managing Director · Aimufua Holdings',
    outcome: '3 managed properties · On-time quarterly remittances',
  },
];

export const ESTATE_HIGHLIGHTS = [
  { label: 'Title Security', value: 'EdoGIS & C of O Verified' },
  { label: 'Infrastructure', value: 'Paved Roads & Storm Drainage' },
  { label: 'Security', value: '24/7 Gated Access Control' },
  { label: 'Flexible Terms', value: 'Up to 12-Month Payment Plans' },
];
