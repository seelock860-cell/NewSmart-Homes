import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import type {
  AvailabilityStatus,
  Enquiry,
  EnquiryInput,
  EnquiryStatus,
  Property,
  PropertyCategory,
  PropertyInput,
} from '../src/types/realEstate.ts';
import { SEED_PROPERTIES } from './seedData.ts';

const IS_VERCEL = Boolean(process.env.VERCEL);
const DATA_DIR = IS_VERCEL ? '/tmp/newsmart-data' : path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'newsmart-db.json');
export const UPLOADS_DIR = IS_VERCEL
  ? '/tmp/newsmart-uploads'
  : path.resolve(process.cwd(), 'uploads');

interface LocalDatabase {
  properties: Property[];
  enquiries: Enquiry[];
  adminPasswordHash: string | null;
}

function ensureDirectories() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
}

function readLocalDb(): LocalDatabase {
  ensureDirectories();
  if (!fs.existsSync(DB_FILE)) {
    const initial: LocalDatabase = {
      properties: SEED_PROPERTIES,
      enquiries: [],
      adminPasswordHash: null,
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf8');
    return initial;
  }
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf8');
    const parsed = JSON.parse(raw) as Partial<LocalDatabase>;
    return {
      properties: Array.isArray(parsed.properties) ? parsed.properties : SEED_PROPERTIES,
      enquiries: Array.isArray(parsed.enquiries) ? parsed.enquiries : [],
      adminPasswordHash: typeof parsed.adminPasswordHash === 'string' ? parsed.adminPasswordHash : null,
    };
  } catch {
    return {
      properties: SEED_PROPERTIES,
      enquiries: [],
      adminPasswordHash: null,
    };
  }
}

function writeLocalDb(data: LocalDatabase) {
  ensureDirectories();
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
}

function slugify(input: string): string {
  return (
    input
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || 'property'
  );
}

export function formatNaira(amount: number): string {
  return `₦${Math.round(amount).toLocaleString('en-NG')}`;
}

export function isValidImageUrl(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith('/src/assets/') || trimmed.startsWith('/uploads/')) {
    return true;
  }
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

let cachedSupabaseAdmin: SupabaseClient | null = null;
let cachedSupabaseAuth: SupabaseClient | null = null;

export function isSupabaseConfigured(): boolean {
  return Boolean(process.env.SUPABASE_URL?.trim() && process.env.SUPABASE_SERVICE_ROLE_KEY?.trim());
}

export function isSupabaseAuthEnabled(): boolean {
  return Boolean(process.env.SUPABASE_URL?.trim() && process.env.SUPABASE_ANON_KEY?.trim());
}

function getSupabaseAdmin(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  if (!cachedSupabaseAdmin) {
    cachedSupabaseAdmin = createClient(
      process.env.SUPABASE_URL!.trim(),
      process.env.SUPABASE_SERVICE_ROLE_KEY!.trim(),
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );
  }
  return cachedSupabaseAdmin;
}

export function getSupabaseAuthClient(): SupabaseClient | null {
  if (!isSupabaseAuthEnabled()) return null;
  if (!cachedSupabaseAuth) {
    cachedSupabaseAuth = createClient(
      process.env.SUPABASE_URL!.trim(),
      process.env.SUPABASE_ANON_KEY!.trim(),
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );
  }
  return cachedSupabaseAuth;
}

interface SupabasePropertyRow {
  id: string;
  title: string;
  slug: string;
  category: PropertyCategory;
  location: string;
  price: number;
  price_label: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  area_sqm: string;
  title_document: string;
  availability: AvailabilityStatus;
  featured: boolean;
  description: string;
  features: string[] | null;
  image_url: string;
  gallery_urls: string[] | null;
  created_at: string;
  updated_at: string;
}

function mapSupabaseProperty(row: SupabasePropertyRow): Property {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    category: row.category,
    location: row.location,
    price: Number(row.price),
    priceLabel: row.price_label || formatNaira(Number(row.price)),
    bedrooms: Number(row.bedrooms ?? 0),
    bathrooms: Number(row.bathrooms ?? 0),
    areaSqm: row.area_sqm || '',
    titleDocument: row.title_document || 'Certificate of Occupancy',
    availability: row.availability,
    featured: Boolean(row.featured),
    description: row.description,
    features: Array.isArray(row.features) ? row.features : [],
    imageUrl: row.image_url,
    galleryUrls: Array.isArray(row.gallery_urls) ? row.gallery_urls : [row.image_url],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

interface SupabaseEnquiryRow {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  interest: string;
  property_id: string | null;
  property_title: string | null;
  message: string;
  status: EnquiryStatus;
  created_at: string;
}

function mapSupabaseEnquiry(row: SupabaseEnquiryRow): Enquiry {
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone,
    interest: row.interest,
    propertyId: row.property_id,
    propertyTitle: row.property_title,
    message: row.message,
    status: row.status,
    createdAt: row.created_at,
  };
}

export async function getAdminPasswordHash(): Promise<string | null> {
  const sb = getSupabaseAdmin();
  if (sb) {
    try {
      const { data, error } = await sb
        .from('admin_settings')
        .select('password_hash')
        .eq('id', 'primary_admin')
        .maybeSingle();
      if (!error && data?.password_hash) {
        return data.password_hash as string;
      }
    } catch {
      // Fallback to local store if table not yet provisioned
    }
  }
  return readLocalDb().adminPasswordHash;
}

export async function saveAdminPasswordHash(hash: string): Promise<void> {
  const sb = getSupabaseAdmin();
  if (sb) {
    try {
      const { error } = await sb.from('admin_settings').upsert({
        id: 'primary_admin',
        password_hash: hash,
        updated_at: new Date().toISOString(),
      });
      if (!error) return;
    } catch {
      // Fall through to local store
    }
  }
  const db = readLocalDb();
  db.adminPasswordHash = hash;
  writeLocalDb(db);
}

export interface PropertyQueryFilters {
  search?: string;
  category?: string;
  location?: string;
  status?: string;
  featuredOnly?: boolean;
}

function applyPropertyFilters(items: Property[], filters: PropertyQueryFilters): Property[] {
  return items.filter((prop) => {
    if (filters.featuredOnly && !prop.featured) return false;
    if (filters.category && filters.category !== 'All' && prop.category !== filters.category) {
      return false;
    }
    if (filters.status && filters.status !== 'All' && prop.availability !== filters.status) {
      return false;
    }
    if (
      filters.location &&
      filters.location !== 'All' &&
      !prop.location.toLowerCase().includes(filters.location.toLowerCase())
    ) {
      return false;
    }
    if (filters.search && filters.search.trim()) {
      const q = filters.search.trim().toLowerCase();
      const haystack = [
        prop.title,
        prop.location,
        prop.category,
        prop.description,
        prop.titleDocument,
        ...prop.features,
      ]
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });
}

export async function listProperties(filters: PropertyQueryFilters = {}): Promise<Property[]> {
  const sb = getSupabaseAdmin();
  if (sb) {
    try {
      const { data, error } = await sb
        .from('properties')
        .select('*')
        .order('featured', { ascending: false })
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        if (data.length === 0) {
          // Seed initial properties once if Supabase table is empty
          const seedRows = SEED_PROPERTIES.map((p) => ({
            id: p.id,
            title: p.title,
            slug: p.slug,
            category: p.category,
            location: p.location,
            price: p.price,
            price_label: p.priceLabel || formatNaira(p.price),
            bedrooms: p.bedrooms,
            bathrooms: p.bathrooms,
            area_sqm: p.areaSqm,
            title_document: p.titleDocument,
            availability: p.availability,
            featured: p.featured,
            description: p.description,
            features: p.features,
            image_url: p.imageUrl,
            gallery_urls: p.galleryUrls,
          }));
          const { data: inserted } = await sb.from('properties').insert(seedRows).select('*');
          if (Array.isArray(inserted) && inserted.length > 0) {
            return applyPropertyFilters(
              (inserted as SupabasePropertyRow[]).map(mapSupabaseProperty),
              filters
            );
          }
        }
        return applyPropertyFilters((data as SupabasePropertyRow[]).map(mapSupabaseProperty), filters);
      }
    } catch (err) {
      console.error('Supabase listProperties error:', err);
    }
  }

  const db = readLocalDb();
  const sorted = [...db.properties].sort((a, b) => {
    if (a.featured !== b.featured) return a.featured ? -1 : 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
  return applyPropertyFilters(sorted, filters);
}

export async function getPropertyByIdOrSlug(idOrSlug: string): Promise<Property | null> {
  const sb = getSupabaseAdmin();
  if (sb) {
    try {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        idOrSlug
      );
      const query = isUuid
        ? sb.from('properties').select('*').eq('id', idOrSlug).maybeSingle()
        : sb.from('properties').select('*').eq('slug', idOrSlug).maybeSingle();
      const { data, error } = await query;
      if (!error && data) {
        return mapSupabaseProperty(data as SupabasePropertyRow);
      }
    } catch (err) {
      console.error('Supabase getProperty error:', err);
    }
  }

  const db = readLocalDb();
  return db.properties.find((p) => p.id === idOrSlug || p.slug === idOrSlug) || null;
}

export async function createProperty(input: PropertyInput): Promise<Property> {
  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  const slug = `${slugify(input.title)}-${id.slice(0, 6)}`;
  const priceLabel = input.priceLabel?.trim() || formatNaira(input.price);
  const galleryUrls =
    input.galleryUrls && input.galleryUrls.length > 0
      ? input.galleryUrls.filter(isValidImageUrl)
      : [input.imageUrl];

  const property: Property = {
    id,
    title: input.title.trim(),
    slug,
    category: input.category,
    location: input.location.trim(),
    price: Number(input.price),
    priceLabel,
    bedrooms: Number(input.bedrooms ?? 0),
    bathrooms: Number(input.bathrooms ?? 0),
    areaSqm: input.areaSqm.trim(),
    titleDocument: input.titleDocument.trim(),
    availability: input.availability,
    featured: Boolean(input.featured),
    description: input.description.trim(),
    features: input.features.map((f) => f.trim()).filter(Boolean),
    imageUrl: input.imageUrl.trim(),
    galleryUrls: galleryUrls.length > 0 ? galleryUrls : [input.imageUrl.trim()],
    createdAt: now,
    updatedAt: now,
  };

  const sb = getSupabaseAdmin();
  if (sb) {
    const { data, error } = await sb
      .from('properties')
      .insert({
        id: property.id,
        title: property.title,
        slug: property.slug,
        category: property.category,
        location: property.location,
        price: property.price,
        price_label: property.priceLabel,
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        area_sqm: property.areaSqm,
        title_document: property.titleDocument,
        availability: property.availability,
        featured: property.featured,
        description: property.description,
        features: property.features,
        image_url: property.imageUrl,
        gallery_urls: property.galleryUrls,
      })
      .select('*')
      .single();

    if (error || !data) {
      throw new Error('Failed to create property record in database.');
    }
    return mapSupabaseProperty(data as SupabasePropertyRow);
  }

  const db = readLocalDb();
  db.properties.unshift(property);
  writeLocalDb(db);
  return property;
}

export async function updateProperty(id: string, input: Partial<PropertyInput>): Promise<Property | null> {
  const existing = await getPropertyByIdOrSlug(id);
  if (!existing) return null;

  const updatedPrice = input.price !== undefined ? Number(input.price) : existing.price;
  const updatedImageUrl = input.imageUrl?.trim() || existing.imageUrl;
  const updatedGallery =
    input.galleryUrls !== undefined
      ? input.galleryUrls.filter(isValidImageUrl)
      : existing.galleryUrls;

  const updated: Property = {
    ...existing,
    title: input.title !== undefined ? input.title.trim() : existing.title,
    category: input.category !== undefined ? input.category : existing.category,
    location: input.location !== undefined ? input.location.trim() : existing.location,
    price: updatedPrice,
    priceLabel:
      input.priceLabel !== undefined
        ? input.priceLabel.trim() || formatNaira(updatedPrice)
        : input.price !== undefined
          ? formatNaira(updatedPrice)
          : existing.priceLabel,
    bedrooms: input.bedrooms !== undefined ? Number(input.bedrooms) : existing.bedrooms,
    bathrooms: input.bathrooms !== undefined ? Number(input.bathrooms) : existing.bathrooms,
    areaSqm: input.areaSqm !== undefined ? input.areaSqm.trim() : existing.areaSqm,
    titleDocument:
      input.titleDocument !== undefined ? input.titleDocument.trim() : existing.titleDocument,
    availability: input.availability !== undefined ? input.availability : existing.availability,
    featured: input.featured !== undefined ? Boolean(input.featured) : existing.featured,
    description: input.description !== undefined ? input.description.trim() : existing.description,
    features:
      input.features !== undefined
        ? input.features.map((f) => f.trim()).filter(Boolean)
        : existing.features,
    imageUrl: updatedImageUrl,
    galleryUrls: updatedGallery.length > 0 ? updatedGallery : [updatedImageUrl],
    updatedAt: new Date().toISOString(),
  };

  const sb = getSupabaseAdmin();
  if (sb) {
    const { data, error } = await sb
      .from('properties')
      .update({
        title: updated.title,
        category: updated.category,
        location: updated.location,
        price: updated.price,
        price_label: updated.priceLabel,
        bedrooms: updated.bedrooms,
        bathrooms: updated.bathrooms,
        area_sqm: updated.areaSqm,
        title_document: updated.titleDocument,
        availability: updated.availability,
        featured: updated.featured,
        description: updated.description,
        features: updated.features,
        image_url: updated.imageUrl,
        gallery_urls: updated.galleryUrls,
        updated_at: updated.updatedAt,
      })
      .eq('id', existing.id)
      .select('*')
      .single();

    if (error || !data) {
      throw new Error('Failed to update property record in database.');
    }
    return mapSupabaseProperty(data as SupabasePropertyRow);
  }

  const db = readLocalDb();
  const idx = db.properties.findIndex((p) => p.id === existing.id);
  if (idx === -1) return null;
  db.properties[idx] = updated;
  writeLocalDb(db);
  return updated;
}

export async function deleteProperty(id: string): Promise<boolean> {
  const sb = getSupabaseAdmin();
  if (sb) {
    const { error, count } = await sb
      .from('properties')
      .delete({ count: 'exact' })
      .eq('id', id);
    if (error) {
      throw new Error('Failed to delete property from database.');
    }
    return (count ?? 0) > 0;
  }

  const db = readLocalDb();
  const initialLen = db.properties.length;
  db.properties = db.properties.filter((p) => p.id !== id);
  if (db.properties.length === initialLen) return false;
  writeLocalDb(db);
  return true;
}

export async function createEnquiry(input: EnquiryInput): Promise<Enquiry> {
  const enquiry: Enquiry = {
    id: crypto.randomUUID(),
    fullName: input.fullName.trim(),
    email: input.email.trim(),
    phone: input.phone.trim(),
    interest: input.interest.trim() || 'General Enquiry',
    propertyId: input.propertyId || null,
    propertyTitle: input.propertyTitle || null,
    message: input.message.trim(),
    status: 'New',
    createdAt: new Date().toISOString(),
  };

  const sb = getSupabaseAdmin();
  if (sb) {
    const { data, error } = await sb
      .from('enquiries')
      .insert({
        id: enquiry.id,
        full_name: enquiry.fullName,
        email: enquiry.email,
        phone: enquiry.phone,
        interest: enquiry.interest,
        property_id: enquiry.propertyId,
        property_title: enquiry.propertyTitle,
        message: enquiry.message,
        status: enquiry.status,
      })
      .select('*')
      .single();

    if (error || !data) {
      throw new Error('Failed to submit enquiry.');
    }
    return mapSupabaseEnquiry(data as SupabaseEnquiryRow);
  }

  const db = readLocalDb();
  db.enquiries.unshift(enquiry);
  writeLocalDb(db);
  return enquiry;
}

export async function listEnquiries(): Promise<Enquiry[]> {
  const sb = getSupabaseAdmin();
  if (sb) {
    const { data, error } = await sb
      .from('enquiries')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && Array.isArray(data)) {
      return (data as SupabaseEnquiryRow[]).map(mapSupabaseEnquiry);
    }
  }
  return readLocalDb().enquiries;
}

export async function updateEnquiryStatus(id: string, status: EnquiryStatus): Promise<Enquiry | null> {
  const sb = getSupabaseAdmin();
  if (sb) {
    const { data, error } = await sb
      .from('enquiries')
      .update({ status })
      .eq('id', id)
      .select('*')
      .single();
    if (!error && data) {
      return mapSupabaseEnquiry(data as SupabaseEnquiryRow);
    }
    return null;
  }

  const db = readLocalDb();
  const idx = db.enquiries.findIndex((e) => e.id === id);
  if (idx === -1) return null;
  db.enquiries[idx] = { ...db.enquiries[idx], status };
  writeLocalDb(db);
  return db.enquiries[idx];
}

const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

export async function uploadPropertyImage(
  buffer: Buffer,
  mimeType: string
): Promise<{ url: string }> {
  const ext = MIME_TO_EXT[mimeType];
  if (!ext) {
    throw new Error('Unsupported image type. Please upload a JPEG, PNG, or WebP image.');
  }

  const fileName = `${crypto.randomUUID()}${ext}`;
  const sb = getSupabaseAdmin();

  if (sb) {
    const bucket = process.env.SUPABASE_BUCKET?.trim() || 'property-images';
    try {
      await sb.storage.createBucket(bucket, { public: true });
    } catch {
      // Bucket already exists or managed externally
    }

    const storagePath = `listings/${fileName}`;
    const { error } = await sb.storage.from(bucket).upload(storagePath, buffer, {
      contentType: mimeType,
      upsert: false,
    });
    if (!error) {
      const { data } = sb.storage.from(bucket).getPublicUrl(storagePath);
      if (data?.publicUrl) {
        return { url: data.publicUrl };
      }
    }
  }

  ensureDirectories();
  const targetPath = path.resolve(UPLOADS_DIR, fileName);
  if (!targetPath.startsWith(UPLOADS_DIR + path.sep)) {
    throw new Error('Invalid upload target path.');
  }
  fs.writeFileSync(targetPath, buffer);
  return { url: `/uploads/${fileName}` };
}
