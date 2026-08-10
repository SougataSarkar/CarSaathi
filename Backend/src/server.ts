import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '../.env') });

import express, { Request, Response } from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { parseIndianPrice } from './parser';
import { initDatabase, query, vectorExtensionEnabled } from './db';
import { getEmbedding, getCarSearchText } from './embeddings';
import { initRedis, redisClient } from './redisClient';
import {
    initElasticsearch,
    elasticsearchEnabled,
    searchCarsInElasticsearch,
    indexCarDoc,
    deleteCarDoc
} from './elasticsearch';
import { recommendCars } from './gemini';

// Initialize Redis and Elasticsearch
initRedis();
initElasticsearch();

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = process.env.HOST || '0.0.0.0';

// Trust proxy header forwarding (required for correct IP parsing when behind Render's load balancer)
app.set('trust proxy', true);

// Security hardening headers using Helmet
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "blob:", "https:"],
            connectSrc: [
                "'self'", 
                "http://localhost:3000", 
                "http://localhost:5173",
                "http://127.0.0.1:3000",
                "http://127.0.0.1:5173",
                "https://generativelanguage.googleapis.com",
                "https://freeipapi.com",
                "https://ipwho.is",
                "http://192.168.*",
                "http://10.*",
                "http://172.*"
            ]
        }
    }
}));

// Disable x-powered-by header to prevent fingerprinting
app.disable('x-powered-by');

// Hardened CORS configuration
const allowedOrigins = [
    'http://localhost:5173', // Local Vite dev server
    'http://localhost:3000', // Local Express port
    process.env.FRONTEND_URL
].filter(Boolean) as string[];

app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (
            allowedOrigins.indexOf(origin) !== -1 || 
            origin.startsWith('http://localhost:') || 
            origin.startsWith('http://127.0.0.1:') || 
            /^http:\/\/(192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+)(:\d+)?$/.test(origin) ||
            origin.endsWith('.onrender.com')
        ) {
            return callback(null, true);
        } else {
            return callback(new Error('Not allowed by CORS'), false);
        }
    },
    credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Serve static files (built React app or public assets) BEFORE rate limiting to prevent image/asset blockage
const frontendDistPath = path.join(__dirname, '../../Frontend/dist');
const frontendPublicPath = path.join(__dirname, '../../Frontend/public');

if (fs.existsSync(frontendDistPath)) {
    app.use(express.static(frontendDistPath));
}
if (fs.existsSync(frontendPublicPath)) {
    app.use(express.static(frontendPublicPath));
}

// Disable caching for dynamic API endpoints to prevent browser caching of stale data
app.use('/api', (req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    next();
});

// Redis-backed rate limiter middleware
const redisRateLimiter = (limit: number, windowSeconds: number) => {
    return async (req: Request, res: Response, next: any): Promise<void> => {
        try {
            const ip = req.ip || req.socket.remoteAddress || 'unknown-ip';
            const key = `ratelimit:${req.path}:${ip}`;

            const currentVal = await redisClient.get(key);
            if (currentVal) {
                const count = parseInt(currentVal, 10);
                if (count >= limit) {
                    res.status(429).json({ error: `Too many requests on this endpoint. Please try again after a minute.` });
                    return;
                }
                await redisClient.incr(key);
            } else {
                await redisClient.set(key, '1', { EX: windowSeconds });
            }
            next();
        } catch (error) {
            console.error('Rate limiter error:', error);
            // Fallback: proceed to next on Redis error to maintain availability
            next();
        }
    };
};

// Redis Cache Invalidation Helper
async function clearCarsCache() {
    try {
        console.log('[Cache Invalidation] Incrementing cars cache version...');
        // INCR creates the key with value 1 if it does not exist, or increments it.
        // This ensures the dynamic version used by the /cars route is always valid.
        const newVersion = await redisClient.incr('cache:cars:version');
        console.log(`[Cache Invalidation] Cache version is now: ${newVersion}`);
    } catch (err) {
        console.error("Failed to invalidate cars cache:", err);
    }
}

// Global Rate Limiting to prevent denial of service (DoS) - Skip static assets
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: process.env.NODE_ENV === 'production' ? 2500 : 10000, // Limit each IP to 2500 in production, 10000 in development
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: 'Too many requests from this IP, please try again after 15 minutes.' }
});
app.use(globalLimiter);

// Stricter Rate Limiting for Authentication endpoints (Login & Register)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: process.env.NODE_ENV === 'production' ? 15 : 1000, // Limit each IP to 15 in production, 1000 in development
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: 'Too many authentication attempts from this IP, please try again after 15 minutes.' }
});
app.use('/auth/', authLimiter);

const inMemoryEmbeddings = new Map<string, number[]>();

function cosineSimilarity(a: number[], b: number[]): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < a.length; i++) {
        dotProduct += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Background sync helper for vector embeddings
async function syncEmbeddings() {
    try {
        if (vectorExtensionEnabled) {
            console.log('[Embeddings] Scanning database for listings missing vector embeddings...');
            const res = await query('SELECT id, make, model, year, price, city FROM "Cars" WHERE embedding IS NULL');
            const cars = res.rows;
            if (cars.length > 0) {
                console.log(`[Embeddings] Found ${cars.length} cars missing vector embeddings. Starting background generation...`);
                for (const car of cars) {
                    const text = getCarSearchText(car);
                    const vector = await getEmbedding(text);
                    if (vector) {
                        const vectorStr = `[${vector.join(',')}]`;
                        await query('UPDATE "Cars" SET embedding = $1 WHERE id = $2', [vectorStr, car.id]);
                    }
                }
                console.log('✓ Successfully generated and saved embeddings to PostgreSQL database.');
            } else {
                console.log('✓ All database car vector embeddings are in sync.');
            }
        } else {
            console.log('[Embeddings] PostgreSQL pgvector is offline. Activating In-Memory Vector Cache fallback...');
            const res = await query('SELECT id, make, model, year, price, city FROM "Cars"');
            const cars = res.rows;
            console.log(`[Embeddings] Scanning ${cars.length} listings to populate in-memory vector cache...`);
            let generatedCount = 0;
            for (const car of cars) {
                const text = getCarSearchText(car);
                const vector = await getEmbedding(text);
                if (vector) {
                    inMemoryEmbeddings.set(car.id, vector);
                    generatedCount++;
                }
            }
            console.log(`✓ Populated in-memory vector cache with ${generatedCount} embeddings.`);
        }
    } catch (err) {
        console.error('[Embeddings] Error syncing existing listings embeddings:', err);
    }
}

// Initialize PostgreSQL database
initDatabase().then(() => {
    syncEmbeddings();
});

app.get('/cars', async (req: Request, res: Response): Promise<void> => {
    try {
        const { search, city, minPrice, maxPrice, makes, luxe, sortBy } = req.query;

        // Read the dynamic cache version from Redis so clearCarsCache() actually invalidates on new listings
        let cacheVersion = 'v4_dealer_first_v0';
        try {
            const dynamicVersion = await redisClient.get('cache:cars:version');
            if (dynamicVersion) cacheVersion = `v4_dealer_first_v${dynamicVersion}`;
        } catch (err) { /* ignore, use default version */ }

        // Generate a unique cache key based on query filters and version
        const cacheKey = `cache:cars:v=${cacheVersion}:search=${search || ''}:city=${city || ''}:min=${minPrice || ''}:max=${maxPrice || ''}:makes=${makes || ''}:luxe=${luxe || ''}:sort=${sortBy || ''}`;

        try {
            const cachedData = await redisClient.get(cacheKey);
            if (cachedData) {
                console.log(`[Cache Hit] Serving cars from Redis cache for key: ${cacheKey}`);
                res.json(JSON.parse(cachedData));
                return;
            }
        } catch (err) {
            console.error("Redis cache read error:", err);
        }

        let queryText = 'SELECT * FROM "Cars"';
        const params: any[] = [];
        const conditions: string[] = [];
        let searchParamIndex = -1;
        let esIds: string[] | null = null;

        // 1. Elasticsearch Search or Fallback FTS
        if (search && typeof search === 'string' && search.trim()) {
            const searchVal = search.trim();
            try {
                esIds = await searchCarsInElasticsearch(searchVal);
            } catch (err) {
                console.error("Elasticsearch query error, falling back to PostgreSQL FTS:", err);
            }

            if (esIds !== null) {
                if (esIds.length === 0) {
                    try {
                        await redisClient.set(cacheKey, JSON.stringify([]), { EX: 60 });
                    } catch (err) { }
                    res.json([]);
                    return;
                }
                params.push(esIds);
                conditions.push(`id = ANY($${params.length}::uuid[])`);
            } else {
                // Fallback to PostgreSQL FTS
                const prefixQuery = searchVal
                    .split(/\s+/)
                    .filter(w => w.length > 0)
                    .map(w => w.replace(/['":&|!()*]/g, ''))
                    .filter(Boolean)
                    .map(w => w.startsWith('-') ? `!${w.slice(1)}` : `${w}:*`)
                    .join(' & ');

                if (prefixQuery) {
                    params.push(prefixQuery);
                    searchParamIndex = params.length;
                    conditions.push(`tsv_search @@ to_tsquery('english', $${searchParamIndex})`);
                }
            }
        }

        // 2. City Filter
        if (city && typeof city === 'string' && city !== 'all') {
            params.push(city);
            conditions.push(`city = $${params.length}`);
        }

        // 3. Price Filter (minPrice)
        if (minPrice && typeof minPrice === 'string' && !isNaN(parseInt(minPrice, 10))) {
            params.push(parseInt(minPrice, 10));
            conditions.push(`price >= $${params.length}`);
        }

        // 4. Price Filter (maxPrice)
        if (maxPrice && typeof maxPrice === 'string' && !isNaN(parseInt(maxPrice, 10))) {
            params.push(parseInt(maxPrice, 10));
            conditions.push(`price <= $${params.length}`);
        }

        // 5. Makes Filter (comma separated)
        if (makes && typeof makes === 'string' && makes.trim()) {
            const makesArray = makes.split(',').map(m => m.trim()).filter(Boolean);
            if (makesArray.length > 0) {
                params.push(makesArray);
                conditions.push(`make = ANY($${params.length})`);
            }
        }

        // 6. Luxe Filter
        if (luxe === 'true') {
            const premiumBrands = ['BMW', 'Audi', 'Mercedes-Benz'];
            params.push(premiumBrands);
            conditions.push(`make = ANY($${params.length})`);
        }

        if (conditions.length > 0) {
            queryText += ' WHERE ' + conditions.join(' AND ');
        }

        // 7. Sorting
        // Dealer/Admin-listed cars (created_by IS NOT NULL) always appear first,
        // then seed/default cars, both groups sorted by the requested criterion.
        if (sortBy === 'price_asc') {
            queryText += ' ORDER BY (CASE WHEN created_by IS NOT NULL THEN 0 ELSE 1 END) ASC, price ASC, created_at DESC';
        } else if (sortBy === 'price_desc') {
            queryText += ' ORDER BY (CASE WHEN created_by IS NOT NULL THEN 0 ELSE 1 END) ASC, price DESC, created_at DESC';
        } else if (sortBy === 'year_desc') {
            queryText += ' ORDER BY (CASE WHEN created_by IS NOT NULL THEN 0 ELSE 1 END) ASC, year DESC, created_at DESC';
        } else if (sortBy === 'make_asc') {
            queryText += ' ORDER BY (CASE WHEN created_by IS NOT NULL THEN 0 ELSE 1 END) ASC, make ASC, created_at DESC';
        } else if (esIds !== null) {
            // Sort by order of array IDs returned by Elasticsearch (relevance rank),
            // but prioritise dealer/admin listings first within same relevance tier
            const paramIndex = params.indexOf(esIds) + 1;
            queryText += ` ORDER BY (CASE WHEN created_by IS NOT NULL THEN 0 ELSE 1 END) ASC, array_position($${paramIndex}::uuid[], id)`;
        } else if (searchParamIndex !== -1) {
            // Sort by full-text search relevance rank, dealer/admin listings first
            queryText += ` ORDER BY (CASE WHEN created_by IS NOT NULL THEN 0 ELSE 1 END) ASC, ts_rank(tsv_search, to_tsquery('english', $${searchParamIndex})) DESC, created_at DESC`;
        } else {
            // Default: dealer/admin-listed cars first, then newest listings
            queryText += ' ORDER BY (CASE WHEN created_by IS NOT NULL THEN 0 ELSE 1 END) ASC, created_at DESC';
        }

        console.log("Querying SQL:", queryText);
        const result = await query(queryText, params);

        try {
            // Cache query results for 60 seconds (1 minute)
            await redisClient.set(cacheKey, JSON.stringify(result.rows), { EX: 60 });
        } catch (err) {
            console.error("Redis cache write error:", err);
        }

        res.json(result.rows);
    } catch (error: any) {
        console.error("Error fetching cars:", error);
        res.status(500).json({ error: "Failed to fetch cars from database." });
    }
});

// AI Recommendation Route
app.post('/cars/recommend', async (req: Request, res: Response): Promise<void> => {
    try {
        const { prompt, budget, purpose, fuelType, bodyType, priority } = req.body;

        // Fetch all cars from DB to find best matches
        const carsResult = await query('SELECT * FROM "Cars"');
        const cars = carsResult.rows;

        const recommendation = await recommendCars({
            prompt,
            budget: budget ? (typeof budget === 'number' ? budget : parseInt(budget, 10)) : undefined,
            purpose,
            fuelType,
            bodyType,
            priority
        }, cars);

        res.json(recommendation);
    } catch (error: any) {
        console.error("Error in AI recommendation endpoint:", error);
        res.status(500).json({ error: "Failed to process AI recommendations." });
    }
});

app.get('/parse', (req: Request, res: Response): void => {
    const q = req.query.q;

    if (q === undefined || q === null || typeof q !== 'string') {
        res.status(400).json({ error: "Query parameter 'q' is required and must be a string." });
        return;
    }

    try {
        const result = parseIndianPrice(q);
        res.json(result);
    } catch (error: any) {
        res.status(400).json({ error: error.message || "Failed to parse price phrase." });
    }
});

const isProduction = process.env.NODE_ENV === 'production';
const JWT_SECRET_ENV = process.env.JWT_SECRET;
if (!JWT_SECRET_ENV) {
    if (isProduction) {
        throw new Error("FATAL ERROR: JWT_SECRET environment variable is not set in production!");
    } else {
        console.warn("WARNING: JWT_SECRET environment variable is not set. Using a fallback temporary secret for development.");
    }
}
const JWT_SECRET = JWT_SECRET_ENV || 'car_saathi_super_secret_secret_123';

// 1. User Registration
app.post('/auth/register', redisRateLimiter(5, 60), async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, email, phone, password, role } = req.body;

        // Basic inputs validation
        if (!name || typeof name !== 'string' || name.trim().length === 0) {
            res.status(400).json({ error: "Name is required." });
            return;
        }
        if (!email || typeof email !== 'string' || !email.includes('@')) {
            res.status(400).json({ error: "A valid email is required." });
            return;
        }
        if (!phone || typeof phone !== 'string' || phone.trim().length < 8) {
            res.status(400).json({ error: "A valid phone number is required (min 8 digits)." });
            return;
        }
        if (!password || typeof password !== 'string' || password.length < 6) {
            res.status(400).json({ error: "Password is required and must be at least 6 characters long." });
            return;
        }

        const normalizedEmail = email.toLowerCase().trim();
        const normalizedPhone = phone.trim();
        const allowedRoles = ['Admin', 'Dealer', 'Customer'];
        const userRole = (role && allowedRoles.includes(role)) ? role : 'Customer';

        // Check if user already exists
        const userCheck = await query(
            'SELECT id, email, phone FROM users WHERE email = $1 OR phone = $2',
            [normalizedEmail, normalizedPhone]
        );

        if (userCheck.rows.length > 0) {
            const existing = userCheck.rows[0];
            if (existing.email === normalizedEmail) {
                res.status(400).json({ error: "Email is already registered." });
                return;
            }
            if (existing.phone === normalizedPhone) {
                res.status(400).json({ error: "Phone number is already registered." });
                return;
            }
        }

        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Insert new user
        const result = await query(
            'INSERT INTO users (name, email, phone, password_hash, role) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, phone, role',
            [name.trim(), normalizedEmail, normalizedPhone, passwordHash, userRole]
        );

        const newUser = result.rows[0];

        // Generate JWT token
        const token = jwt.sign(
            { userId: newUser.id, email: newUser.email, role: newUser.role },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            message: "User registered successfully",
            token,
            user: newUser
        });
    } catch (error: any) {
        console.error("Error during registration:", error);
        res.status(500).json({ error: "Internal server error during registration." });
    }
});

// 2. User Login
app.post('/auth/login', redisRateLimiter(5, 60), async (req: Request, res: Response): Promise<void> => {
    try {
        const { identifier, password } = req.body;

        if (!identifier || typeof identifier !== 'string') {
            res.status(400).json({ error: "Email or phone number is required." });
            return;
        }
        if (!password || typeof password !== 'string') {
            res.status(400).json({ error: "Password is required." });
            return;
        }

        const queryTerm = identifier.trim();

        // Search for user by email OR phone
        const result = await query(
            'SELECT * FROM users WHERE email = $1 OR phone = $1',
            [queryTerm.toLowerCase()]
        );

        if (result.rows.length === 0) {
            res.status(401).json({ error: "Invalid credentials." });
            return;
        }

        const user = result.rows[0];

        // Verify password
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            res.status(401).json({ error: "Invalid credentials." });
            return;
        }

        // Generate JWT token
        const token = jwt.sign(
            { userId: user.id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            message: "Login successful",
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role
            }
        });
    } catch (error: any) {
        console.error("Error during login:", error);
        res.status(500).json({ error: "Internal server error during login." });
    }
});

// 2a. Send Phone OTP
app.post('/auth/otp/send', redisRateLimiter(5, 60), async (req: Request, res: Response): Promise<void> => {
    try {
        const { phone } = req.body;
        if (!phone || typeof phone !== 'string' || phone.trim().length < 8) {
            res.status(400).json({ error: "A valid phone number is required." });
            return;
        }

        // Generate a random 6-digit OTP code
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const key = `otp:${phone.trim()}`;

        // Store in Redis with a 5-minute (300 seconds) expiration
        await redisClient.set(key, otpCode, { EX: 300 });

        console.log(`[SIMULATED SMS] Send OTP ${otpCode} to ${phone}`);

        res.json({
            message: "OTP sent successfully (simulated)",
            otp: otpCode // Return OTP in response so frontend can display it simulated
        });
    } catch (error) {
        console.error("Error sending OTP:", error);
        res.status(500).json({ error: "Failed to send OTP." });
    }
});

// 2b. Verify Phone OTP
app.post('/auth/otp/verify', async (req: Request, res: Response): Promise<void> => {
    try {
        const { phone, otp } = req.body;
        if (!phone || !otp) {
            res.status(400).json({ error: "Phone number and OTP code are required." });
            return;
        }

        const key = `otp:${phone.trim()}`;
        const storedOtp = await redisClient.get(key);

        if (!storedOtp || storedOtp !== otp.trim()) {
            res.status(400).json({ error: "Invalid or expired OTP code." });
            return;
        }

        // OTP is valid. Remove it from Redis so it cannot be reused.
        await redisClient.del(key);

        res.json({ message: "OTP verified successfully." });
    } catch (error) {
        console.error("Error verifying OTP:", error);
        res.status(500).json({ error: "Failed to verify OTP." });
    }
});


// 3. Server-side IP Geolocation endpoint
app.get('/cars/locate', async (req: Request, res: Response): Promise<void> => {
    try {
        // Helper to check if IP is private/local
        const isPrivateIp = (ipAddr: string) => {
            if (!ipAddr || ipAddr === 'localhost' || ipAddr === '127.0.0.1' || ipAddr === '::1') return true;
            const parts = ipAddr.split('.');
            if (parts.length !== 4) return false;
            const first = parseInt(parts[0], 10);
            const second = parseInt(parts[1], 10);
            if (first === 10) return true;
            if (first === 192 && second === 168) return true;
            if (first === 172 && (second >= 16 && second <= 31)) return true;
            return false;
        };

        // Extract client IP, prioritizing X-Forwarded-For header when behind proxies (Render/Cloudflare)
        let clientIp = '';
        const forwardedHeader = req.headers['x-forwarded-for'];
        if (typeof forwardedHeader === 'string' && forwardedHeader.length > 0) {
            const ips = forwardedHeader.split(',').map(s => s.trim());
            // Find the first public IP in X-Forwarded-For list
            const publicIp = ips.find(ip => {
                let cleaned = ip.startsWith('::ffff:') ? ip.substring(7) : ip;
                return !isPrivateIp(cleaned);
            });
            if (publicIp) {
                clientIp = publicIp;
            }
        }

        if (!clientIp) {
            clientIp = req.ip || req.socket.remoteAddress || '';
        }
        if (clientIp.startsWith('::ffff:')) {
            clientIp = clientIp.substring(7);
        }
        
        console.log(`[Locate] Extracted client IP: ${clientIp}`);

        // If IP is private or unresolvable, do NOT fetch location without IP (which would return Render server's location)
        if (isPrivateIp(clientIp)) {
            console.log('[Locate] Client IP is private or unresolvable server-side. Returning 400 so client falls back to browser IP detection.');
            res.status(400).json({ error: "Client IP is private or unresolvable server-side." });
            return;
        }

        const url = `https://freeipapi.com/api/json/${clientIp}`;
        console.log(`[Locate] Fetching geolocation from: ${url}`);
        const geoRes = await fetch(url);
        if (geoRes.ok) {
            const geoData = await geoRes.json();
            if (geoData && geoData.latitude !== undefined && geoData.longitude !== undefined) {
                res.json({ lat: Number(geoData.latitude), lng: Number(geoData.longitude) });
                return;
            }
        }

        // Fail-safe fallback: try ipwho.is with explicit client IP
        const fallbackUrl = `https://ipwho.is/${clientIp}`;
        console.log(`[Locate] Trying ipwhois fallback: ${fallbackUrl}`);
        const fallbackRes = await fetch(fallbackUrl);
        if (fallbackRes.ok) {
            const geoData = await fallbackRes.json();
            if (geoData && geoData.success && geoData.latitude !== undefined && geoData.longitude !== undefined) {
                res.json({ lat: Number(geoData.latitude), lng: Number(geoData.longitude) });
                return;
            }
        }

        res.status(500).json({ error: "Failed to detect location from client IP." });
    } catch (error) {
        console.error('[Locate] Server-side IP geolocation failed:', error);
        res.status(500).json({ error: "Failed to detect location from server-side IP." });
    }
});

// 3. Get single car details
app.get('/cars/:id', async (req: Request, res: Response): Promise<void> => {
    try {
        const carId = req.params.id;
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(carId)) {
            res.status(400).json({ error: "Invalid car ID format." });
            return;
        }

        const result = await query('SELECT * FROM "Cars" WHERE id = $1', [carId]);
        if (result.rows.length === 0) {
            res.status(404).json({ error: "Car not found." });
            return;
        }

        res.json(result.rows[0]);
    } catch (error: any) {
        console.error("Error fetching car details:", error);
        res.status(500).json({ error: "Failed to fetch car details from database." });
    }
});

// 3a. Get similar cars (Vector/Semantic-based similarity)
app.get('/cars/:id/similar', async (req: Request, res: Response): Promise<void> => {
    try {
        const carId = req.params.id;
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(carId)) {
            res.status(400).json({ error: "Invalid car ID format." });
            return;
        }

        const carRes = await query('SELECT * FROM "Cars" WHERE id = $1', [carId]);
        if (carRes.rows.length === 0) {
            res.status(404).json({ error: "Car not found." });
            return;
        }
        const targetCar = carRes.rows[0];

        // 1. If pgvector is enabled in DB
        if (vectorExtensionEnabled && targetCar.embedding) {
            console.log(`[Semantic Similar] Querying vector-based similar cars for car ID: ${carId}`);
            const similarRes = await query(
                `SELECT id, make, model, year, price, city, image_url,
                (embedding <=> $1) as distance
                FROM "Cars"
                WHERE id != $2 AND embedding IS NOT NULL
                ORDER BY embedding <=> $1
                LIMIT 6`,
                [targetCar.embedding, carId]
            );
            res.json(similarRes.rows);
            return;
        }

        // 2. If pgvector is offline, try In-Memory Vector Cache lookup
        const targetEmbedding = inMemoryEmbeddings.get(carId);
        if (targetEmbedding) {
            console.log(`[Semantic Similar Fallback] Querying in-memory vector similar cars for car ID: ${carId}`);
            const allCarsRes = await query('SELECT id, make, model, year, price, city, image_url FROM "Cars" WHERE id != $1', [carId]);
            const allCars = allCarsRes.rows;

            const scoredCars = allCars
                .map(car => {
                    const carEmbedding = inMemoryEmbeddings.get(car.id);
                    if (!carEmbedding) return null;
                    const sim = cosineSimilarity(targetEmbedding, carEmbedding);
                    return {
                        ...car,
                        distance: 1 - sim
                    };
                })
                .filter(Boolean) as any[];

            scoredCars.sort((a, b) => a.distance - b.distance);
            res.json(scoredCars.slice(0, 6));
            return;
        }

        // 3. Absolute Fallback: Metadata Similarity
        console.log(`[Semantic Similar Metadata Fallback] Querying metadata similar cars for make: ${targetCar.make}`);
        const fallbackRes = await query(
            `SELECT id, make, model, year, price, city, image_url
            FROM "Cars"
            WHERE id != $1 AND (make = $2 OR (price >= $3 AND price <= $4))
            ORDER BY ABS(price - $5) ASC
            LIMIT 6`,
            [carId, targetCar.make, targetCar.price * 0.7, targetCar.price * 1.3, targetCar.price]
        );
        res.json(fallbackRes.rows);
    } catch (error) {
        console.error("Error fetching similar cars:", error);
        res.status(500).json({ error: "Failed to fetch similar cars." });
    }
});


// 3b. Semantic search endpoint (Vector search)
app.get('/cars/search/semantic', async (req: Request, res: Response): Promise<void> => {
    try {
        const { q, city, makes, minPrice, maxPrice, luxe } = req.query;
        
        const qStr = typeof q === 'string' ? q.trim() : '';
        if (!qStr) {
            res.status(400).json({ error: "Search query 'q' is required." });
            return;
        }

        const cityStr = typeof city === 'string' ? city.trim() : 'all';
        const makesStr = typeof makes === 'string' ? makes.trim() : '';
        const minPriceStr = typeof minPrice === 'string' ? minPrice.trim() : '';
        const maxPriceStr = typeof maxPrice === 'string' ? maxPrice.trim() : '';
        const luxeStr = typeof luxe === 'string' ? luxe.trim() : '';

        // Generate query vector embedding using Gemini
        let queryEmbedding: number[] | null = null;
        try {
            queryEmbedding = await getEmbedding(qStr);
        } catch (error) {
            console.warn('[Semantic Search] Gemini embedding generation failed, falling back to full-text search:', error);
        }

        // Helper to compute keyword boost in JS
        const computeKeywordBoost = (car: any, query: string) => {
            const queryWords = query.toLowerCase().split(/\s+/).filter(Boolean);
            let boost = 0;
            for (const word of queryWords) {
                const make = (car.make || '').toLowerCase();
                const model = (car.model || '').toLowerCase();
                const cityVal = (car.city || '').toLowerCase();
                const yearVal = (car.year || '').toString();

                if (make === word || model === word) boost += 0.5;
                else if (cityVal === word) boost += 0.5;
                else if (yearVal === word) boost += 0.5;
                else if (make.includes(word) || model.includes(word)) boost += 0.2;
            }
            return boost;
        };

        // 1. If pgvector is enabled in DB and embedding is available
        if (queryEmbedding && vectorExtensionEnabled) {
            console.log(`[Semantic Search] Requesting vector search for query: "${qStr}"`);
            const vectorStr = `[${queryEmbedding.join(',')}]`;
            
            const conditions: string[] = ['embedding IS NOT NULL'];
            const params: any[] = [vectorStr]; // $1 is the vectorStr

            if (cityStr && cityStr !== 'all') {
                params.push(cityStr);
                conditions.push(`city = $${params.length}`);
            }
            if (minPriceStr && !isNaN(parseInt(minPriceStr, 10))) {
                params.push(parseInt(minPriceStr, 10));
                conditions.push(`price >= $${params.length}`);
            }
            if (maxPriceStr && !isNaN(parseInt(maxPriceStr, 10))) {
                params.push(parseInt(maxPriceStr, 10));
                conditions.push(`price <= $${params.length}`);
            }
            if (makesStr) {
                const makesArray = makesStr.split(',').map(m => m.trim()).filter(Boolean);
                if (makesArray.length > 0) {
                    params.push(makesArray);
                    conditions.push(`make = ANY($${params.length})`);
                }
            }
            if (luxeStr === 'true') {
                conditions.push(`make IN ('BMW', 'Audi', 'Mercedes-Benz')`);
            }

            const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
            const searchRes = await query(
                `SELECT id, make, model, year, price, city, image_url, fuel_type, transmission, kms_driven, owners, created_by, created_at,
                (1 - (embedding <=> $1)) as similarity_score
                FROM "Cars"
                ${whereClause}
                ORDER BY embedding <=> $1
                LIMIT 100`,
                params
            );

            const scoredCars = searchRes.rows.map((car: any) => {
                const boost = computeKeywordBoost(car, qStr);
                return {
                    ...car,
                    similarity_score: Number(car.similarity_score || 0) + boost
                };
            });

            if (scoredCars.length > 0) {
                scoredCars.sort((a: any, b: any) => b.similarity_score - a.similarity_score);
                res.json(scoredCars.slice(0, 20));
                return;
            }
            console.log(`[Semantic Search] pgvector search returned 0 results. Falling back to Full-Text Search.`);
        }

        // 2. If pgvector is offline, try In-Memory Vector Cache search (requires embedding)
        if (queryEmbedding && inMemoryEmbeddings.size > 0) {
            console.log(`[Semantic Search Fallback] Executing in-memory vector search for query: "${qStr}"`);
            
            const conditions: string[] = [];
            const params: any[] = [];

            if (cityStr && cityStr !== 'all') {
                params.push(cityStr);
                conditions.push(`city = $${params.length}`);
            }
            if (minPriceStr && !isNaN(parseInt(minPriceStr, 10))) {
                params.push(parseInt(minPriceStr, 10));
                conditions.push(`price >= $${params.length}`);
            }
            if (maxPriceStr && !isNaN(parseInt(maxPriceStr, 10))) {
                params.push(parseInt(maxPriceStr, 10));
                conditions.push(`price <= $${params.length}`);
            }
            if (makesStr) {
                const makesArray = makesStr.split(',').map(m => m.trim()).filter(Boolean);
                if (makesArray.length > 0) {
                    params.push(makesArray);
                    conditions.push(`make = ANY($${params.length})`);
                }
            }
            if (luxeStr === 'true') {
                conditions.push(`make IN ('BMW', 'Audi', 'Mercedes-Benz')`);
            }

            const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
            const allCarsRes = await query(
                `SELECT id, make, model, year, price, city, image_url, fuel_type, transmission, kms_driven, owners, created_by, created_at FROM "Cars"
                ${whereClause}`,
                params
            );
            const allCars = allCarsRes.rows;

            const scoredCars = allCars
                .map(car => {
                    const carEmbedding = inMemoryEmbeddings.get(car.id);
                    if (!carEmbedding) return null;
                    const sim = cosineSimilarity(queryEmbedding, carEmbedding);
                    const boost = computeKeywordBoost(car, qStr);
                    return {
                        ...car,
                        similarity_score: sim + boost
                    };
                })
                .filter(Boolean) as any[];

            if (scoredCars.length > 0) {
                scoredCars.sort((a, b) => b.similarity_score - a.similarity_score);
                res.json(scoredCars.slice(0, 20));
                return;
            }
            console.log(`[Semantic Search Fallback] In-memory vector search returned 0 results. Falling back to Full-Text Search.`);
        }

        // 3. Fallback: Full-Text Search
        console.log(`[Semantic Search FTS Fallback] Routing to full-text query for: "${qStr}"`);
        const formattedQuery = qStr.split(/\s+/).filter(Boolean).map(term => `${term}:*`).join(' & ');
        
        const conditions: string[] = [];
        const params: any[] = [];

        if (formattedQuery) {
            params.push(formattedQuery);
            conditions.push(`tsv_search @@ to_tsquery('english', $${params.length})`);
        }
        if (cityStr && cityStr !== 'all') {
            params.push(cityStr);
            conditions.push(`city = $${params.length}`);
        }
        if (minPriceStr && !isNaN(parseInt(minPriceStr, 10))) {
            params.push(parseInt(minPriceStr, 10));
            conditions.push(`price >= $${params.length}`);
        }
        if (maxPriceStr && !isNaN(parseInt(maxPriceStr, 10))) {
            params.push(parseInt(maxPriceStr, 10));
            conditions.push(`price <= $${params.length}`);
        }
        if (makesStr) {
            const makesArray = makesStr.split(',').map(m => m.trim()).filter(Boolean);
            if (makesArray.length > 0) {
                params.push(makesArray);
                conditions.push(`make = ANY($${params.length})`);
            }
        }
        if (luxeStr === 'true') {
            conditions.push(`make IN ('BMW', 'Audi', 'Mercedes-Benz')`);
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
        const searchRes = await query(
            `SELECT id, make, model, year, price, city, image_url, fuel_type, transmission, kms_driven, owners, created_by, created_at,
            ts_rank(tsv_search, to_tsquery('english', $1)) as rank
            FROM "Cars"
            ${whereClause}
            ORDER BY rank DESC
            LIMIT 20`,
            params
        );
        res.json(searchRes.rows);
    } catch (error) {
        console.error("Error executing semantic search:", error);
        res.status(500).json({ error: "Failed to process semantic search." });
    }
});

// 4. Book test drive
app.post('/cars/:id/book', async (req: Request, res: Response): Promise<void> => {
    try {
        const carId = req.params.id;
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(carId)) {
            res.status(400).json({ error: "Invalid car ID format." });
            return;
        }

        const { name, phone, date, time } = req.body;

        if (!name || typeof name !== 'string' || name.trim().length === 0) {
            res.status(400).json({ error: "Name is required." });
            return;
        }
        if (!phone || typeof phone !== 'string' || phone.trim().length < 8) {
            res.status(400).json({ error: "A valid phone number is required (min 8 digits)." });
            return;
        }
        if (!date || typeof date !== 'string' || isNaN(Date.parse(date))) {
            res.status(400).json({ error: "A valid booking date is required." });
            return;
        }
        if (!time || typeof time !== 'string' || time.trim().length === 0) {
            res.status(400).json({ error: "Booking time slot is required." });
            return;
        }

        // Verify that the car exists
        const carCheck = await query('SELECT id FROM "Cars" WHERE id = $1', [carId]);
        if (carCheck.rows.length === 0) {
            res.status(404).json({ error: "Car not found." });
            return;
        }

        const result = await query(
            'INSERT INTO bookings (car_id, name, phone, booking_date, booking_time) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [carId, name.trim(), phone.trim(), date, time.trim()]
        );

        res.status(201).json({
            message: "Test drive booked successfully!",
            booking: result.rows[0]
        });
    } catch (error: any) {
        console.error("Error booking test drive:", error);
        res.status(500).json({ error: "Failed to submit test drive booking." });
    }
});

// 5. List a new car for sale
app.post('/cars', async (req: Request, res: Response): Promise<void> => {
    try {
        // Verify authorization token
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({ error: "Access denied. Please log in to list a car." });
            return;
        }

        const token = authHeader.split(' ')[1];
        let decoded: any;
        try {
            decoded = jwt.verify(token, JWT_SECRET);
        } catch (err) {
            res.status(401).json({ error: "Session expired or invalid token. Please log in again." });
            return;
        }

        // Restrict creation to Dealers and Admins
        if (decoded.role !== 'Dealer' && decoded.role !== 'Admin') {
            res.status(403).json({ error: "Access denied. Only Dealers or Admins can list a car for sale." });
            return;
        }

        const { make, model, year, price, city, imageUrl, fuel_type, transmission, kms_driven, owners, rto } = req.body;
        if (!make || typeof make !== 'string' || !make.trim()) {
            res.status(400).json({ error: "Make is required." });
            return;
        }
        if (!model || typeof model !== 'string' || !model.trim()) {
            res.status(400).json({ error: "Model is required." });
            return;
        }
        const yearNum = parseInt(year, 10);
        if (isNaN(yearNum) || yearNum < 1900 || yearNum > 2027) {
            res.status(400).json({ error: "Please enter a valid year between 1900 and 2027." });
            return;
        }
        const priceNum = parseInt(price, 10);
        if (isNaN(priceNum) || priceNum <= 0) {
            res.status(400).json({ error: "Please enter a valid price." });
            return;
        }
        if (!city || typeof city !== 'string' || !city.trim()) {
            res.status(400).json({ error: "City is required." });
            return;
        }

        const kmsDrivenNum = kms_driven ? parseInt(kms_driven, 10) : 15000;
        if (isNaN(kmsDrivenNum) || kmsDrivenNum < 0) {
            res.status(400).json({ error: "Please enter a valid kilometers driven." });
            return;
        }

        if (!rto || typeof rto !== 'string' || !rto.trim()) {
            res.status(400).json({ error: "Registration RTO is required." });
            return;
        }

        const result = await query(
            'INSERT INTO "Cars" (make, model, year, price, city, image_url, created_by, fuel_type, transmission, kms_driven, owners, rto) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *',
            [
                make.trim(),
                model.trim(),
                yearNum,
                priceNum,
                city.trim(),
                imageUrl || null,
                decoded.userId,
                fuel_type || 'Petrol',
                transmission || 'Manual',
                kmsDrivenNum,
                owners || '1st Owner',
                rto.trim()
            ]
        );

        const car = result.rows[0];

        // Generate vector embedding for this new listing
        try {
            const text = getCarSearchText(car);
            const vector = await getEmbedding(text);
            if (vector) {
                if (vectorExtensionEnabled) {
                    const vectorStr = `[${vector.join(',')}]`;
                    const updatedRes = await query('UPDATE "Cars" SET embedding = $1 WHERE id = $2 RETURNING *', [vectorStr, car.id]);
                    car.embedding = updatedRes.rows[0].embedding;
                } else {
                    inMemoryEmbeddings.set(car.id, vector);
                }
            }
        } catch (err) {
            console.error('[Embeddings] Error generating embedding for new car:', err);
        }

        // Invalidate cache immediately on new listing
        await clearCarsCache();

        // Index the listing in Elasticsearch
        await indexCarDoc(car);

        res.status(201).json({
            message: "Car listed for sale successfully!",
            car: car
        });
    } catch (error: any) {
        console.error("Error creating car listing:", error);
        res.status(500).json({ error: "Failed to list car for sale." });
    }
});

// 6. Apply for a car loan
app.post('/loan-applications', async (req: Request, res: Response): Promise<void> => {
    try {
        const { 
            name, 
            phone, 
            income, 
            employment, 
            creditScore, 
            loanAmount, 
            tenure,
            identityProofName,
            identityProofData,
            addressProofName,
            addressProofData,
            incomeProofName,
            incomeProofData
        } = req.body;

        if (!name || typeof name !== 'string' || !name.trim()) {
            res.status(400).json({ error: "Name is required." });
            return;
        }
        if (!phone || typeof phone !== 'string' || phone.trim().length < 8) {
            res.status(400).json({ error: "A valid phone number is required." });
            return;
        }
        const incomeNum = parseInt(income, 10);
        if (isNaN(incomeNum) || incomeNum <= 0) {
            res.status(400).json({ error: "Please enter a valid monthly income." });
            return;
        }
        if (!employment || typeof employment !== 'string') {
            res.status(400).json({ error: "Employment type is required." });
            return;
        }
        if (!creditScore || typeof creditScore !== 'string') {
            res.status(400).json({ error: "Credit score range is required." });
            return;
        }
        const loanAmountNum = parseInt(loanAmount, 10);
        if (isNaN(loanAmountNum) || loanAmountNum <= 0) {
            res.status(400).json({ error: "Please enter a valid loan amount." });
            return;
        }
        const tenureNum = parseInt(tenure, 10);
        if (isNaN(tenureNum) || tenureNum <= 0) {
            res.status(400).json({ error: "Tenure is required." });
            return;
        }

        const status = incomeNum * 12 > (loanAmountNum / 5) ? 'Approved' : 'Review Required';

        const result = await query(
            'INSERT INTO loan_applications (name, phone, income, employment, credit_score, loan_amount, tenure_years, status, identity_proof_name, identity_proof_data, address_proof_name, address_proof_data, income_proof_name, income_proof_data) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *',
            [
                name.trim(), 
                phone.trim(), 
                incomeNum, 
                employment.trim(), 
                creditScore.trim(), 
                loanAmountNum, 
                tenureNum, 
                status,
                identityProofName || null,
                identityProofData || null,
                addressProofName || null,
                addressProofData || null,
                incomeProofName || null,
                incomeProofData || null
            ]
        );

        res.status(201).json({
            message: "Loan application processed successfully!",
            application: result.rows[0]
        });
    } catch (error: any) {
        console.error("Error submitting loan application:", error);
        res.status(500).json({ error: "Failed to submit loan application." });
    }
});

// 7. Register interest in new car
app.post('/new-car-leads', async (req: Request, res: Response): Promise<void> => {
    try {
        const { carName, name, phone, email, city } = req.body;

        if (!carName || typeof carName !== 'string') {
            res.status(400).json({ error: "Car name is required." });
            return;
        }
        if (!name || typeof name !== 'string' || !name.trim()) {
            res.status(400).json({ error: "Name is required." });
            return;
        }
        if (!phone || typeof phone !== 'string' || phone.trim().length < 8) {
            res.status(400).json({ error: "A valid phone number is required." });
            return;
        }
        if (!email || typeof email !== 'string' || !email.includes('@')) {
            res.status(400).json({ error: "A valid email is required." });
            return;
        }
        if (!city || typeof city !== 'string' || !city.trim()) {
            res.status(400).json({ error: "City is required." });
            return;
        }

        const result = await query(
            'INSERT INTO new_car_leads (car_name, name, phone, email, city) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [carName.trim(), name.trim(), phone.trim(), email.trim(), city.trim()]
        );

        res.status(201).json({
            message: "Interest registered successfully!",
            lead: result.rows[0]
        });
    } catch (error: any) {
        console.error("Error registering lead for new car:", error);
        res.status(500).json({ error: "Failed to register interest." });
    }
});

// 8. Book car service
app.post('/service-bookings', async (req: Request, res: Response): Promise<void> => {
    try {
        const { serviceName, city, date, name, phone } = req.body;

        if (!serviceName || typeof serviceName !== 'string') {
            res.status(400).json({ error: "Service name is required." });
            return;
        }
        if (!city || typeof city !== 'string' || !city.trim()) {
            res.status(400).json({ error: "City is required." });
            return;
        }
        if (!date || typeof date !== 'string' || isNaN(Date.parse(date))) {
            res.status(400).json({ error: "A valid booking date is required." });
            return;
        }
        if (!name || typeof name !== 'string' || !name.trim()) {
            res.status(400).json({ error: "Name is required." });
            return;
        }
        if (!phone || typeof phone !== 'string' || phone.trim().length < 8) {
            res.status(400).json({ error: "A valid phone number is required." });
            return;
        }

        const result = await query(
            'INSERT INTO service_bookings (service_name, city, booking_date, name, phone) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [serviceName.trim(), city.trim(), date, name.trim(), phone.trim()]
        );

        res.status(201).json({
            message: "Service booked successfully!",
            booking: result.rows[0]
        });
    } catch (error: any) {
        console.error("Error booking service:", error);
        res.status(500).json({ error: "Failed to submit service booking." });
    }
});

// 9. Delete car listing (Admin or Owner Dealer)
app.delete('/cars/:id', async (req: Request, res: Response): Promise<void> => {
    try {
        const carId = req.params.id;
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(carId)) {
            res.status(400).json({ error: "Invalid car ID format." });
            return;
        }

        // Verify authorization token
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({ error: "Access denied. Token is required." });
            return;
        }

        const token = authHeader.split(' ')[1];
        let decoded: any;
        try {
            decoded = jwt.verify(token, JWT_SECRET);
        } catch (err) {
            res.status(401).json({ error: "Invalid token. Please log in again." });
            return;
        }

        // Fetch the car to check owner
        const carCheck = await query('SELECT created_by FROM "Cars" WHERE id = $1', [carId]);
        if (carCheck.rows.length === 0) {
            res.status(404).json({ error: "Car not found." });
            return;
        }

        const carOwnerId = carCheck.rows[0].created_by;

        // Check permission: Admin can delete anything; Dealer can delete their own car listings
        if (decoded.role !== 'Admin' && (decoded.role !== 'Dealer' || Number(decoded.userId) !== Number(carOwnerId))) {
            res.status(403).json({ error: "Access denied. You do not have permission to delete this listing." });
            return;
        }

        await query('DELETE FROM "Cars" WHERE id = $1', [carId]);

        // Invalidate cache immediately on deletion
        await clearCarsCache();

        // Delete listing from Elasticsearch
        await deleteCarDoc(carId);

        res.json({ message: "Car listing deleted successfully." });
    } catch (error: any) {
        console.error("Error deleting car listing:", error);
        res.status(500).json({ error: "Failed to delete car listing." });
    }
});

// 9b. Edit car listing (Admin or Owner Dealer)
app.put('/cars/:id', async (req: Request, res: Response): Promise<void> => {
    try {
        const carId = req.params.id;
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(carId)) {
            res.status(400).json({ error: "Invalid car ID format." });
            return;
        }

        // Verify authorization token
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({ error: "Access denied. Token is required." });
            return;
        }

        const token = authHeader.split(' ')[1];
        let decoded: any;
        try {
            decoded = jwt.verify(token, JWT_SECRET);
        } catch (err) {
            res.status(401).json({ error: "Invalid token. Please log in again." });
            return;
        }

        // Restrict edit permission to Dealers and Admins
        if (decoded.role !== 'Dealer' && decoded.role !== 'Admin') {
            res.status(403).json({ error: "Access denied. Only Dealers or Admins can edit a car listing." });
            return;
        }

        // Fetch the car to check owner
        const carCheck = await query('SELECT * FROM "Cars" WHERE id = $1', [carId]);
        if (carCheck.rows.length === 0) {
            res.status(404).json({ error: "Car not found." });
            return;
        }

        const carOwnerId = carCheck.rows[0].created_by;

        // Check permission: Admin can edit any car; Dealer can edit their own car listings (or car where created_by matches)
        if (decoded.role !== 'Admin' && (decoded.role !== 'Dealer' || (carOwnerId !== null && Number(decoded.userId) !== Number(carOwnerId)))) {
            res.status(403).json({ error: "Access denied. You do not have permission to edit this listing." });
            return;
        }

        const { make, model, year, price, city, imageUrl, image_url, fuel_type, transmission, kms_driven, owners, rto } = req.body;

        if (!make || typeof make !== 'string' || !make.trim()) {
            res.status(400).json({ error: "Make is required." });
            return;
        }
        if (!model || typeof model !== 'string' || !model.trim()) {
            res.status(400).json({ error: "Model is required." });
            return;
        }
        const yearNum = parseInt(year, 10);
        if (isNaN(yearNum) || yearNum < 1900 || yearNum > 2027) {
            res.status(400).json({ error: "Please enter a valid year between 1900 and 2027." });
            return;
        }
        const priceNum = parseInt(price, 10);
        if (isNaN(priceNum) || priceNum <= 0) {
            res.status(400).json({ error: "Please enter a valid price." });
            return;
        }
        if (!city || typeof city !== 'string' || !city.trim()) {
            res.status(400).json({ error: "City is required." });
            return;
        }

        const kmsDrivenNum = kms_driven !== undefined && kms_driven !== null ? parseInt(kms_driven, 10) : 15000;
        if (isNaN(kmsDrivenNum) || kmsDrivenNum < 0) {
            res.status(400).json({ error: "Please enter valid kilometers driven." });
            return;
        }

        if (!rto || typeof rto !== 'string' || !rto.trim()) {
            res.status(400).json({ error: "Registration RTO is required." });
            return;
        }

        const finalImageUrl = imageUrl !== undefined ? imageUrl : (image_url || null);

        const result = await query(
            `UPDATE "Cars" 
             SET make = $1, model = $2, year = $3, price = $4, city = $5, image_url = $6, fuel_type = $7, transmission = $8, kms_driven = $9, owners = $10, rto = $11 
             WHERE id = $12 
             RETURNING *`,
            [
                make.trim(),
                model.trim(),
                yearNum,
                priceNum,
                city.trim(),
                finalImageUrl,
                fuel_type || 'Petrol',
                transmission || 'Manual',
                kmsDrivenNum,
                owners || '1st Owner',
                rto.trim(),
                carId
            ]
        );

        const updatedCar = result.rows[0];

        // Re-generate vector embedding for updated car details
        try {
            const text = getCarSearchText(updatedCar);
            const vector = await getEmbedding(text);
            if (vector) {
                if (vectorExtensionEnabled) {
                    const vectorStr = `[${vector.join(',')}]`;
                    const vectorRes = await query('UPDATE "Cars" SET embedding = $1 WHERE id = $2 RETURNING *', [vectorStr, carId]);
                    if (vectorRes.rows && vectorRes.rows.length > 0) {
                        updatedCar.embedding = vectorRes.rows[0].embedding;
                    }
                } else {
                    inMemoryEmbeddings.set(carId, vector);
                }
            }
        } catch (err) {
            console.error('[Embeddings] Error re-generating embedding for edited car:', err);
        }

        // Invalidate Redis cache immediately on update
        await clearCarsCache();

        // Re-index document in Elasticsearch
        await indexCarDoc(updatedCar);

        res.json({
            message: "Car listing updated successfully!",
            car: updatedCar
        });
    } catch (error: any) {
        console.error("Error updating car listing:", error);
        res.status(500).json({ error: "Failed to update car listing." });
    }
});

// 10. Admin leads dashboard dashboard data
app.get('/admin/leads', async (req: Request, res: Response): Promise<void> => {
    try {
        // Verify authorization token
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({ error: "Access denied. Token is required." });
            return;
        }

        const token = authHeader.split(' ')[1];
        let decoded: any;
        try {
            decoded = jwt.verify(token, JWT_SECRET);
        } catch (err) {
            res.status(401).json({ error: "Invalid token." });
            return;
        }

        // Restrict to Admin and Dealer
        if (decoded.role !== 'Admin' && decoded.role !== 'Dealer') {
            res.status(403).json({ error: "Access denied. Only Admins or Dealers can view leads dashboard." });
            return;
        }

        // Query all tables
        const bookingsRes = await query(`
            SELECT b.*, c.make, c.model 
            FROM bookings b 
            LEFT JOIN "Cars" c ON b.car_id = c.id 
            ORDER BY b.created_at DESC
        `);
        const servicesRes = await query('SELECT * FROM service_bookings ORDER BY created_at DESC');
        const loansRes = await query('SELECT * FROM loan_applications ORDER BY created_at DESC');
        const newCarLeadsRes = await query('SELECT * FROM new_car_leads ORDER BY created_at DESC');

        res.json({
            bookings: bookingsRes.rows,
            services: servicesRes.rows,
            loans: loansRes.rows,
            newCarLeads: newCarLeadsRes.rows
        });
    } catch (error: any) {
        console.error("Error fetching admin leads:", error);
        res.status(500).json({ error: "Failed to load admin leads." });
    }
});

// Serve the React frontend index.html for any other requests if it exists
app.get('*', (req: Request, res: Response): void => {
    const indexPath = path.join(frontendDistPath, 'index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.status(200).json({ status: "ok", message: "CarSaathi Backend API is running successfully!" });
    }
});

app.listen(PORT, HOST, () => {
    console.log(`Server is running on http://${HOST}:${PORT}`);
});
