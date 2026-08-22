import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '../.env') });

import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { initDatabase, query, vectorExtensionEnabled } from './db';
import { getEmbedding, getCarSearchText, hasGeminiKey } from './embeddings';
import { initRedis, redisClient } from './redisClient';
import { initElasticsearch } from './elasticsearch';
import { inMemoryEmbeddings } from './shared';

// Route Modules
import carsRouter from './routes/carsRouter';
import authRouter from './routes/authRouter';
import loansRouter from './routes/loansRouter';
import leadsRouter from './routes/leadsRouter';
import servicesRouter from './routes/servicesRouter';
import adminRouter from './routes/adminRouter';
import parseRouter from './routes/parseRouter';

// Initialize Redis and Elasticsearch
initRedis();
initElasticsearch();

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = process.env.HOST || '0.0.0.0';

// Trust proxy header forwarding for 1 proxy hop (required for correct IP parsing when behind Render's load balancer)
app.set('trust proxy', 1);

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

// Redis Cache Invalidation Helper is now in ./shared.ts

// Global Rate Limiting to prevent denial of service (DoS) - Skip static assets
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: process.env.NODE_ENV === 'production' ? 2500 : 10000, // Limit each IP to 2500 in production, 10000 in development
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    validate: { trustProxy: false },
    message: { error: 'Too many requests from this IP, please try again after 15 minutes.' }
});
app.use(globalLimiter);

// Stricter Rate Limiting for Authentication endpoints (Login & Register)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: process.env.NODE_ENV === 'production' ? 15 : 1000, // Limit each IP to 15 in production, 1000 in development
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    validate: { trustProxy: false },
    message: { error: 'Too many authentication attempts from this IP, please try again after 15 minutes.' }
});
app.use('/auth/', authLimiter);

// inMemoryEmbeddings, cosineSimilarity, and clearCarsCache are now in ./shared.ts
// They are used by carsRouter and re-exported from there.

// Background sync helper for vector embeddings
async function syncEmbeddings() {
    try {
        if (!hasGeminiKey()) {
            console.log('[Embeddings] GEMINI_API_KEY not configured in environment. Skipping embedding generation.');
            return;
        }

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

// Mount route modules
app.use('/cars', carsRouter);
app.use('/auth', authRouter);
app.use('/loan-applications', loansRouter);
app.use('/new-car-leads', leadsRouter);
app.use('/service-bookings', servicesRouter);
app.use('/admin', adminRouter);
app.use('/', parseRouter);

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
