import express from 'express';
import fs from 'fs';
import multer from 'multer';
import type {
  AvailabilityStatus,
  EnquiryStatus,
  PropertyCategory,
} from '../src/types/realEstate.ts';
import {
  createSessionToken,
  extractBearerToken,
  hashPassword,
  requireAdmin,
  verifyEnvAdminPassword,
  verifyPassword,
  verifySessionToken,
} from './auth.ts';
import {
  createEnquiry,
  createProperty,
  deleteProperty,
  getAdminPasswordHash,
  getPropertyByIdOrSlug,
  getSupabaseAuthClient,
  isSupabaseAuthEnabled,
  isSupabaseConfigured,
  isValidImageUrl,
  listEnquiries,
  listProperties,
  saveAdminPasswordHash,
  UPLOADS_DIR,
  updateEnquiryStatus,
  updateProperty,
  uploadPropertyImage,
} from './store.ts';

const VALID_CATEGORIES: PropertyCategory[] = [
  'Luxury Homes',
  'Land & Plots',
  'Estate Developments',
  'Commercial',
];

const VALID_AVAILABILITY: AvailabilityStatus[] = ['Available', 'Under Offer', 'Sold Out'];
const VALID_ENQUIRY_STATUSES: EnquiryStatus[] = ['New', 'Contacted', 'Closed'];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

export function createApiApp() {
  const app = express();

  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });

  app.use(express.json({ limit: '2mb' }));

  // Serve uploaded local property images safely when not using Supabase Storage
  try {
    if (!fs.existsSync(UPLOADS_DIR)) {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }
    app.use('/uploads', express.static(UPLOADS_DIR, { maxAge: '7d' }));
  } catch {
    // Skip static uploads directory creation if read-only
  }

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({
      ok: true,
      supabaseConfigured: isSupabaseConfigured(),
    });
  });

  // Public: List & filter properties
  app.get('/api/properties', async (req, res) => {
    try {
      const properties = await listProperties({
        search: typeof req.query.search === 'string' ? req.query.search : undefined,
        category: typeof req.query.category === 'string' ? req.query.category : undefined,
        location: typeof req.query.location === 'string' ? req.query.location : undefined,
        status: typeof req.query.status === 'string' ? req.query.status : undefined,
        featuredOnly: req.query.featured === 'true',
      });
      res.json({ properties });
    } catch (error) {
      console.error('GET /api/properties error:', error);
      res.status(500).json({ error: 'Unable to load properties at this moment.' });
    }
  });

  // Public: Single property details
  app.get('/api/properties/:id', async (req, res) => {
    try {
      const property = await getPropertyByIdOrSlug(req.params.id);
      if (!property) {
        return res.status(404).json({ error: 'Property not found.' });
      }
      res.json({ property });
    } catch (error) {
      console.error('GET /api/properties/:id error:', error);
      res.status(500).json({ error: 'Unable to load property details.' });
    }
  });

  // Public: Submit visitor enquiry
  app.post('/api/enquiries', async (req, res) => {
    try {
      const { fullName, email, phone, interest, propertyId, propertyTitle, message } =
        req.body || {};

      if (
        typeof fullName !== 'string' ||
        fullName.trim().length < 2 ||
        typeof email !== 'string' ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
        typeof phone !== 'string' ||
        phone.trim().length < 7 ||
        typeof message !== 'string' ||
        message.trim().length < 5
      ) {
        return res.status(400).json({
          error: 'Please enter a valid full name, email address, phone number, and message.',
        });
      }

      const enquiry = await createEnquiry({
        fullName,
        email,
        phone,
        interest: typeof interest === 'string' ? interest : 'General Enquiry',
        propertyId: typeof propertyId === 'string' ? propertyId : null,
        propertyTitle: typeof propertyTitle === 'string' ? propertyTitle : null,
        message,
      });

      res.status(201).json({ enquiry });
    } catch (error) {
      console.error('POST /api/enquiries error:', error);
      res.status(500).json({ error: 'Unable to submit enquiry. Please try again.' });
    }
  });

  // Admin: Check auth & setup status
  app.get('/api/admin/status', async (req, res) => {
    try {
      const envPasscodeActive = Boolean(process.env.ADMIN_PASSWORD?.trim());
      const savedHash = await getAdminPasswordHash();
      const supabaseAuthEnabled = isSupabaseAuthEnabled();
      const needsSetup = !envPasscodeActive && !savedHash && !supabaseAuthEnabled;

      const token = extractBearerToken(req);
      const authenticated = Boolean(token && verifySessionToken(token));

      res.json({
        needsSetup,
        authenticated,
        supabaseConfigured: isSupabaseConfigured(),
        supabaseAuthEnabled,
        envPasscodeActive,
      });
    } catch (error) {
      console.error('GET /api/admin/status error:', error);
      res.status(500).json({ error: 'Unable to check admin status.' });
    }
  });

  // Admin: One-time first-run password claim (locks permanently once set)
  app.post('/api/admin/setup', async (req, res) => {
    try {
      if (process.env.ADMIN_PASSWORD?.trim()) {
        return res.status(403).json({
          error: 'Admin password is already configured via environment secrets.',
        });
      }
      const existingHash = await getAdminPasswordHash();
      if (existingHash) {
        return res.status(409).json({
          error: 'Admin password has already been claimed. Please sign in.',
        });
      }

      const { password } = req.body || {};
      if (typeof password !== 'string' || password.trim().length < 8) {
        return res.status(400).json({
          error: 'Please choose a password with at least 8 characters.',
        });
      }

      const hash = hashPassword(password.trim());
      await saveAdminPasswordHash(hash);

      const token = createSessionToken('primary_admin');
      res.status(201).json({ token });
    } catch (error) {
      console.error('POST /api/admin/setup error:', error);
      res.status(500).json({ error: 'Unable to complete admin setup.' });
    }
  });

  // Admin: Login (supports env ADMIN_PASSWORD, claimed scrypt hash, or Supabase Auth)
  app.post('/api/admin/login', async (req, res) => {
    try {
      const { email, password } = req.body || {};
      if (typeof password !== 'string' || !password.trim()) {
        return res.status(400).json({ error: 'Password is required.' });
      }

      const trimmedPassword = password.trim();

      if (process.env.ADMIN_PASSWORD?.trim()) {
        if (!verifyEnvAdminPassword(trimmedPassword)) {
          return res.status(401).json({ error: 'Invalid admin credentials.' });
        }
        return res.json({ token: createSessionToken('env_admin') });
      }

      const sbAuth = getSupabaseAuthClient();
      if (sbAuth && typeof email === 'string' && email.trim()) {
        const { data, error } = await sbAuth.auth.signInWithPassword({
          email: email.trim(),
          password: trimmedPassword,
        });
        if (!error && data.user) {
          return res.json({ token: createSessionToken(data.user.email || data.user.id) });
        }
      }

      const savedHash = await getAdminPasswordHash();
      if (!savedHash) {
        return res.status(400).json({
          error: 'Admin access has not been initialized yet. Complete first-run setup.',
        });
      }

      if (!verifyPassword(trimmedPassword, savedHash)) {
        return res.status(401).json({ error: 'Invalid admin credentials.' });
      }

      return res.json({ token: createSessionToken('primary_admin') });
    } catch (error) {
      console.error('POST /api/admin/login error:', error);
      res.status(500).json({ error: 'Authentication failed.' });
    }
  });

  // Admin: Upload property image
  app.post('/api/admin/upload', requireAdmin, upload.single('image'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'Please select an image file to upload.' });
      }
      const result = await uploadPropertyImage(req.file.buffer, req.file.mimetype);
      res.status(201).json(result);
    } catch (error) {
      console.error('POST /api/admin/upload error:', error);
      res.status(400).json({
        error: error instanceof Error ? error.message : 'Failed to upload image.',
      });
    }
  });

  // Admin: Create property
  app.post('/api/admin/properties', requireAdmin, async (req, res) => {
    try {
      const body = req.body || {};
      if (
        typeof body.title !== 'string' ||
        body.title.trim().length < 3 ||
        !VALID_CATEGORIES.includes(body.category) ||
        typeof body.location !== 'string' ||
        body.location.trim().length < 2 ||
        typeof body.price !== 'number' ||
        Number.isNaN(body.price) ||
        body.price < 0 ||
        typeof body.description !== 'string' ||
        body.description.trim().length < 10 ||
        typeof body.imageUrl !== 'string' ||
        !isValidImageUrl(body.imageUrl)
      ) {
        return res.status(400).json({
          error:
            'Please provide a valid title, category, location, price, description, and image URL.',
        });
      }

      const availability: AvailabilityStatus = VALID_AVAILABILITY.includes(body.availability)
        ? body.availability
        : 'Available';

      const property = await createProperty({
        title: body.title,
        category: body.category,
        location: body.location,
        price: body.price,
        priceLabel: typeof body.priceLabel === 'string' ? body.priceLabel : undefined,
        bedrooms: typeof body.bedrooms === 'number' ? body.bedrooms : 0,
        bathrooms: typeof body.bathrooms === 'number' ? body.bathrooms : 0,
        areaSqm: typeof body.areaSqm === 'string' ? body.areaSqm : '',
        titleDocument:
          typeof body.titleDocument === 'string' && body.titleDocument.trim()
            ? body.titleDocument
            : 'Certificate of Occupancy (C of O)',
        availability,
        featured: Boolean(body.featured),
        description: body.description,
        features: Array.isArray(body.features)
          ? body.features.filter((f: unknown): f is string => typeof f === 'string')
          : [],
        imageUrl: body.imageUrl,
        galleryUrls: Array.isArray(body.galleryUrls)
          ? body.galleryUrls.filter((u: unknown): u is string => typeof u === 'string')
          : [body.imageUrl],
      });

      res.status(201).json({ property });
    } catch (error) {
      console.error('POST /api/admin/properties error:', error);
      res.status(500).json({ error: 'Unable to create property listing.' });
    }
  });

  // Admin: Update property
  app.put('/api/admin/properties/:id', requireAdmin, async (req, res) => {
    try {
      const body = req.body || {};
      if (body.category !== undefined && !VALID_CATEGORIES.includes(body.category)) {
        return res.status(400).json({ error: 'Invalid property category.' });
      }
      if (body.availability !== undefined && !VALID_AVAILABILITY.includes(body.availability)) {
        return res.status(400).json({ error: 'Invalid availability status.' });
      }
      if (
        body.imageUrl !== undefined &&
        (typeof body.imageUrl !== 'string' || !isValidImageUrl(body.imageUrl))
      ) {
        return res.status(400).json({ error: 'Invalid image URL.' });
      }
      if (
        body.price !== undefined &&
        (typeof body.price !== 'number' || Number.isNaN(body.price) || body.price < 0)
      ) {
        return res.status(400).json({ error: 'Invalid price value.' });
      }

      const property = await updateProperty(req.params.id, {
        title: typeof body.title === 'string' ? body.title : undefined,
        category: body.category,
        location: typeof body.location === 'string' ? body.location : undefined,
        price: body.price,
        priceLabel: typeof body.priceLabel === 'string' ? body.priceLabel : undefined,
        bedrooms: typeof body.bedrooms === 'number' ? body.bedrooms : undefined,
        bathrooms: typeof body.bathrooms === 'number' ? body.bathrooms : undefined,
        areaSqm: typeof body.areaSqm === 'string' ? body.areaSqm : undefined,
        titleDocument: typeof body.titleDocument === 'string' ? body.titleDocument : undefined,
        availability: body.availability,
        featured: typeof body.featured === 'boolean' ? body.featured : undefined,
        description: typeof body.description === 'string' ? body.description : undefined,
        features: Array.isArray(body.features)
          ? body.features.filter((f: unknown): f is string => typeof f === 'string')
          : undefined,
        imageUrl: typeof body.imageUrl === 'string' ? body.imageUrl : undefined,
        galleryUrls: Array.isArray(body.galleryUrls)
          ? body.galleryUrls.filter((u: unknown): u is string => typeof u === 'string')
          : undefined,
      });

      if (!property) {
        return res.status(404).json({ error: 'Property not found.' });
      }
      res.json({ property });
    } catch (error) {
      console.error('PUT /api/admin/properties/:id error:', error);
      res.status(500).json({ error: 'Unable to update property listing.' });
    }
  });

  // Admin: Delete property
  app.delete('/api/admin/properties/:id', requireAdmin, async (req, res) => {
    try {
      const deleted = await deleteProperty(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: 'Property not found.' });
      }
      res.json({ ok: true });
    } catch (error) {
      console.error('DELETE /api/admin/properties/:id error:', error);
      res.status(500).json({ error: 'Unable to delete property listing.' });
    }
  });

  // Admin: List visitor enquiries
  app.get('/api/admin/enquiries', requireAdmin, async (_req, res) => {
    try {
      const enquiries = await listEnquiries();
      res.json({ enquiries });
    } catch (error) {
      console.error('GET /api/admin/enquiries error:', error);
      res.status(500).json({ error: 'Unable to load enquiries.' });
    }
  });

  // Admin: Update enquiry status
  app.patch('/api/admin/enquiries/:id', requireAdmin, async (req, res) => {
    try {
      const status = req.body?.status;
      if (!VALID_ENQUIRY_STATUSES.includes(status)) {
        return res.status(400).json({ error: 'Invalid enquiry status.' });
      }
      const updated = await updateEnquiryStatus(req.params.id, status);
      if (!updated) {
        return res.status(404).json({ error: 'Enquiry not found.' });
      }
      res.json({ enquiry: updated });
    } catch (error) {
      console.error('PATCH /api/admin/enquiries/:id error:', error);
      res.status(500).json({ error: 'Unable to update enquiry status.' });
    }
  });

  return app;
}
