import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { query, vectorExtensionEnabled } from '../db';
import { redisClient } from '../redisClient';
import { recommendCars } from '../gemini';
import { getEmbedding, getCarSearchText } from '../embeddings';
import { indexCarDoc, deleteCarDoc } from '../elasticsearch';
import { inMemoryEmbeddings, cosineSimilarity, clearCarsCache } from '../shared';

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'car_saathi_super_secret_secret_123';

// GET /cars - List all cars with optional filters
router.get('/', async (req: Request, res: Response): Promise<void> => {
    try {
        const { search, city, minPrice, maxPrice, makes, luxe, sortBy } = req.query;

        let cacheVersion = 'v4_dealer_first_v0';
        try {
            const dynamicVersion = await redisClient.get('cache:cars:version');
            if (dynamicVersion) cacheVersion = `v4_dealer_first_v${dynamicVersion}`;
        } catch (err) { /* ignore, use default version */ }

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

        const conditions: string[] = [];
        const params: any[] = [];

        if (city && typeof city === 'string' && city !== 'all') {
            params.push(city);
            conditions.push(`city = $${params.length}`);
        }
        if (minPrice) {
            params.push(parseInt(minPrice as string, 10));
            conditions.push(`price >= $${params.length}`);
        }
        if (maxPrice) {
            params.push(parseInt(maxPrice as string, 10));
            conditions.push(`price <= $${params.length}`);
        }
        if (makes && typeof makes === 'string' && makes !== 'all') {
            const makesArray = makes.split(',').map(m => m.trim()).filter(Boolean);
            if (makesArray.length > 0) {
                params.push(makesArray);
                conditions.push(`make = ANY($${params.length})`);
            }
        }
        if (luxe === 'true') {
            conditions.push(`make IN ('BMW', 'Audi', 'Mercedes-Benz')`);
        }
        if (search && typeof search === 'string' && search.trim()) {
            const searchTerms = search.trim().split(/\s+/).filter(Boolean);
            for (const term of searchTerms) {
                params.push(`%${term}%`);
                const pIdx = params.length;
                conditions.push(`(make ILIKE $${pIdx} OR model ILIKE $${pIdx} OR city ILIKE $${pIdx} OR CAST(year AS TEXT) ILIKE $${pIdx})`);
            }
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        let orderClause = 'ORDER BY created_at DESC NULLS LAST';
        if (sortBy === 'price_asc') orderClause = 'ORDER BY price ASC';
        else if (sortBy === 'price_desc') orderClause = 'ORDER BY price DESC';
        else if (sortBy === 'year_desc') orderClause = 'ORDER BY year DESC';
        else if (sortBy === 'year_asc') orderClause = 'ORDER BY year ASC';

        const result = await query(
            `SELECT id, make, model, year, price, city, image_url, fuel_type, transmission, kms_driven, owners, created_by, created_at FROM "Cars" ${whereClause} ${orderClause} LIMIT 200`,
            params
        );

        try {
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

// POST /cars/recommend - AI recommendation
router.post('/recommend', async (req: Request, res: Response): Promise<void> => {
    try {
        const { prompt, budget, purpose, fuelType, bodyType, priority } = req.body;
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

// GET /cars/locate - Server-side IP Geolocation
router.get('/locate', async (req: Request, res: Response): Promise<void> => {
    try {
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

        let clientIp = '';
        const forwardedHeader = req.headers['x-forwarded-for'];
        if (typeof forwardedHeader === 'string' && forwardedHeader.length > 0) {
            const ips = forwardedHeader.split(',').map(s => s.trim());
            const publicIp = ips.find(ip => {
                let cleaned = ip.startsWith('::ffff:') ? ip.substring(7) : ip;
                return !isPrivateIp(cleaned);
            });
            if (publicIp) clientIp = publicIp;
        }

        if (!clientIp) clientIp = req.ip || req.socket.remoteAddress || '';
        if (clientIp.startsWith('::ffff:')) clientIp = clientIp.substring(7);

        console.log(`[Locate] Extracted client IP: ${clientIp}`);

        if (isPrivateIp(clientIp)) {
            res.status(400).json({ error: "Client IP is private or unresolvable server-side." });
            return;
        }

        const url = `https://freeipapi.com/api/json/${clientIp}`;
        const geoRes = await fetch(url);
        if (geoRes.ok) {
            const geoData = await geoRes.json();
            if (geoData && geoData.latitude !== undefined && geoData.longitude !== undefined) {
                res.json({ lat: Number(geoData.latitude), lng: Number(geoData.longitude) });
                return;
            }
        }

        const fallbackUrl = `https://ipwho.is/${clientIp}`;
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

// GET /cars/search/semantic - Semantic vector search
router.get('/search/semantic', async (req: Request, res: Response): Promise<void> => {
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

        let queryEmbedding: number[] | null = null;
        try {
            queryEmbedding = await getEmbedding(qStr);
        } catch (error) {
            console.warn('[Semantic Search] Gemini embedding generation failed, falling back to full-text search:', error);
        }

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

        // 1. pgvector
        if (queryEmbedding && vectorExtensionEnabled) {
            const vectorStr = `[${queryEmbedding.join(',')}]`;
            const conditions: string[] = ['embedding IS NOT NULL'];
            const params: any[] = [vectorStr];

            if (cityStr && cityStr !== 'all') { params.push(cityStr); conditions.push(`city = $${params.length}`); }
            if (minPriceStr && !isNaN(parseInt(minPriceStr, 10))) { params.push(parseInt(minPriceStr, 10)); conditions.push(`price >= $${params.length}`); }
            if (maxPriceStr && !isNaN(parseInt(maxPriceStr, 10))) { params.push(parseInt(maxPriceStr, 10)); conditions.push(`price <= $${params.length}`); }
            if (makesStr) {
                const makesArray = makesStr.split(',').map(m => m.trim()).filter(Boolean);
                if (makesArray.length > 0) { params.push(makesArray); conditions.push(`make = ANY($${params.length})`); }
            }
            if (luxeStr === 'true') conditions.push(`make IN ('BMW', 'Audi', 'Mercedes-Benz')`);

            const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
            const searchRes = await query(
                `SELECT id, make, model, year, price, city, image_url, fuel_type, transmission, kms_driven, owners, created_by, created_at,
                (1 - (embedding <=> $1)) as similarity_score FROM "Cars" ${whereClause} ORDER BY embedding <=> $1 LIMIT 100`,
                params
            );

            const scoredCars = searchRes.rows.map((car: any) => ({
                ...car,
                similarity_score: Number(car.similarity_score || 0) + computeKeywordBoost(car, qStr)
            }));

            if (scoredCars.length > 0) {
                scoredCars.sort((a: any, b: any) => b.similarity_score - a.similarity_score);
                res.json(scoredCars.slice(0, 20));
                return;
            }
        }

        // 2. In-memory vector cache fallback
        if (queryEmbedding && inMemoryEmbeddings.size > 0) {
            const conditions: string[] = [];
            const params: any[] = [];
            if (cityStr && cityStr !== 'all') { params.push(cityStr); conditions.push(`city = $${params.length}`); }
            if (minPriceStr && !isNaN(parseInt(minPriceStr, 10))) { params.push(parseInt(minPriceStr, 10)); conditions.push(`price >= $${params.length}`); }
            if (maxPriceStr && !isNaN(parseInt(maxPriceStr, 10))) { params.push(parseInt(maxPriceStr, 10)); conditions.push(`price <= $${params.length}`); }
            if (makesStr) {
                const makesArray = makesStr.split(',').map(m => m.trim()).filter(Boolean);
                if (makesArray.length > 0) { params.push(makesArray); conditions.push(`make = ANY($${params.length})`); }
            }
            if (luxeStr === 'true') conditions.push(`make IN ('BMW', 'Audi', 'Mercedes-Benz')`);

            const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
            const allCarsRes = await query(
                `SELECT id, make, model, year, price, city, image_url, fuel_type, transmission, kms_driven, owners, created_by, created_at FROM "Cars" ${whereClause}`,
                params
            );
            const allCars = allCarsRes.rows;
            const scoredCars = allCars.map(car => {
                const carEmbedding = inMemoryEmbeddings.get(car.id);
                if (!carEmbedding) return null;
                return { ...car, similarity_score: cosineSimilarity(queryEmbedding!, carEmbedding) + computeKeywordBoost(car, qStr) };
            }).filter(Boolean) as any[];

            if (scoredCars.length > 0) {
                scoredCars.sort((a, b) => b.similarity_score - a.similarity_score);
                res.json(scoredCars.slice(0, 20));
                return;
            }
        }

        // 3. Full-Text Search fallback
        const formattedQuery = qStr.split(/\s+/).filter(Boolean).map(term => `${term}:*`).join(' & ');
        const conditions: string[] = [];
        const params: any[] = [];
        if (formattedQuery) { params.push(formattedQuery); conditions.push(`tsv_search @@ to_tsquery('english', $${params.length})`); }
        if (cityStr && cityStr !== 'all') { params.push(cityStr); conditions.push(`city = $${params.length}`); }
        if (minPriceStr && !isNaN(parseInt(minPriceStr, 10))) { params.push(parseInt(minPriceStr, 10)); conditions.push(`price >= $${params.length}`); }
        if (maxPriceStr && !isNaN(parseInt(maxPriceStr, 10))) { params.push(parseInt(maxPriceStr, 10)); conditions.push(`price <= $${params.length}`); }
        if (makesStr) {
            const makesArray = makesStr.split(',').map(m => m.trim()).filter(Boolean);
            if (makesArray.length > 0) { params.push(makesArray); conditions.push(`make = ANY($${params.length})`); }
        }
        if (luxeStr === 'true') conditions.push(`make IN ('BMW', 'Audi', 'Mercedes-Benz')`);

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
        const searchRes = await query(
            `SELECT id, make, model, year, price, city, image_url, fuel_type, transmission, kms_driven, owners, created_by, created_at,
            ts_rank(tsv_search, to_tsquery('english', $1)) as rank FROM "Cars" ${whereClause} ORDER BY rank DESC LIMIT 20`,
            params
        );
        res.json(searchRes.rows);
    } catch (error) {
        console.error("Error executing semantic search:", error);
        res.status(500).json({ error: "Failed to process semantic search." });
    }
});

// GET /cars/:id - Single car details
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
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

// GET /cars/:id/similar - Semantic similarity
router.get('/:id/similar', async (req: Request, res: Response): Promise<void> => {
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

        // 1. pgvector
        if (vectorExtensionEnabled && targetCar.embedding) {
            const similarRes = await query(
                `SELECT id, make, model, year, price, city, image_url, (embedding <=> $1) as distance
                FROM "Cars" WHERE id != $2 AND embedding IS NOT NULL ORDER BY embedding <=> $1 LIMIT 6`,
                [targetCar.embedding, carId]
            );
            res.json(similarRes.rows);
            return;
        }

        // 2. In-memory vector cache
        const targetEmbedding = inMemoryEmbeddings.get(carId);
        if (targetEmbedding) {
            const allCarsRes = await query('SELECT id, make, model, year, price, city, image_url FROM "Cars" WHERE id != $1', [carId]);
            const scoredCars = allCarsRes.rows.map(car => {
                const carEmbedding = inMemoryEmbeddings.get(car.id);
                if (!carEmbedding) return null;
                return { ...car, distance: 1 - cosineSimilarity(targetEmbedding, carEmbedding) };
            }).filter(Boolean) as any[];
            scoredCars.sort((a, b) => a.distance - b.distance);
            res.json(scoredCars.slice(0, 6));
            return;
        }

        // 3. Metadata fallback
        const fallbackRes = await query(
            `SELECT id, make, model, year, price, city, image_url FROM "Cars"
            WHERE id != $1 AND (make = $2 OR (price >= $3 AND price <= $4))
            ORDER BY ABS(price - $5) ASC LIMIT 6`,
            [carId, targetCar.make, targetCar.price * 0.7, targetCar.price * 1.3, targetCar.price]
        );
        res.json(fallbackRes.rows);
    } catch (error) {
        console.error("Error fetching similar cars:", error);
        res.status(500).json({ error: "Failed to fetch similar cars." });
    }
});

// POST /cars/:id/book - Book test drive
router.post('/:id/book', async (req: Request, res: Response): Promise<void> => {
    try {
        const carId = req.params.id;
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(carId)) { res.status(400).json({ error: "Invalid car ID format." }); return; }

        const { name, phone, date, time } = req.body;
        if (!name || typeof name !== 'string' || name.trim().length === 0) { res.status(400).json({ error: "Name is required." }); return; }
        if (!phone || typeof phone !== 'string' || phone.trim().length < 8) { res.status(400).json({ error: "A valid phone number is required (min 8 digits)." }); return; }
        if (!date || typeof date !== 'string' || isNaN(Date.parse(date))) { res.status(400).json({ error: "A valid booking date is required." }); return; }
        if (!time || typeof time !== 'string' || time.trim().length === 0) { res.status(400).json({ error: "Booking time slot is required." }); return; }

        const carCheck = await query('SELECT id FROM "Cars" WHERE id = $1', [carId]);
        if (carCheck.rows.length === 0) { res.status(404).json({ error: "Car not found." }); return; }

        const result = await query(
            'INSERT INTO bookings (car_id, name, phone, booking_date, booking_time) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [carId, name.trim(), phone.trim(), date, time.trim()]
        );
        res.status(201).json({ message: "Test drive booked successfully!", booking: result.rows[0] });
    } catch (error: any) {
        console.error("Error booking test drive:", error);
        res.status(500).json({ error: "Failed to submit test drive booking." });
    }
});

// POST /cars - List a new car for sale
router.post('/', async (req: Request, res: Response): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) { res.status(401).json({ error: "Access denied. Please log in to list a car." }); return; }

        const token = authHeader.split(' ')[1];
        let decoded: any;
        try { decoded = jwt.verify(token, JWT_SECRET); } catch (err) { res.status(401).json({ error: "Session expired or invalid token. Please log in again." }); return; }

        if (decoded.role !== 'Dealer' && decoded.role !== 'Admin') { res.status(403).json({ error: "Access denied. Only Dealers or Admins can list a car for sale." }); return; }

        const { make, model, year, price, city, imageUrl, fuel_type, transmission, kms_driven, owners, rto } = req.body;
        if (!make || typeof make !== 'string' || !make.trim()) { res.status(400).json({ error: "Make is required." }); return; }
        if (!model || typeof model !== 'string' || !model.trim()) { res.status(400).json({ error: "Model is required." }); return; }
        const yearNum = parseInt(year, 10);
        if (isNaN(yearNum) || yearNum < 1900 || yearNum > 2027) { res.status(400).json({ error: "Please enter a valid year between 1900 and 2027." }); return; }
        const priceNum = parseInt(price, 10);
        if (isNaN(priceNum) || priceNum <= 0) { res.status(400).json({ error: "Please enter a valid price." }); return; }
        if (!city || typeof city !== 'string' || !city.trim()) { res.status(400).json({ error: "City is required." }); return; }
        const kmsDrivenNum = kms_driven ? parseInt(kms_driven, 10) : 15000;
        if (isNaN(kmsDrivenNum) || kmsDrivenNum < 0) { res.status(400).json({ error: "Please enter a valid kilometers driven." }); return; }
        if (!rto || typeof rto !== 'string' || !rto.trim()) { res.status(400).json({ error: "Registration RTO is required." }); return; }

        const result = await query(
            'INSERT INTO "Cars" (make, model, year, price, city, image_url, created_by, fuel_type, transmission, kms_driven, owners, rto) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *',
            [make.trim(), model.trim(), yearNum, priceNum, city.trim(), imageUrl || null, decoded.userId, fuel_type || 'Petrol', transmission || 'Manual', kmsDrivenNum, owners || '1st Owner', rto.trim()]
        );

        const car = result.rows[0];
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
        } catch (err) { console.error('[Embeddings] Error generating embedding for new car:', err); }

        await clearCarsCache();
        await indexCarDoc(car);

        res.status(201).json({ message: "Car listed for sale successfully!", car });
    } catch (error: any) {
        console.error("Error creating car listing:", error);
        res.status(500).json({ error: "Failed to list car for sale." });
    }
});

// DELETE /cars/:id - Delete car listing
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
    try {
        const carId = req.params.id;
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(carId)) { res.status(400).json({ error: "Invalid car ID format." }); return; }

        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) { res.status(401).json({ error: "Access denied. Token is required." }); return; }

        const token = authHeader.split(' ')[1];
        let decoded: any;
        try { decoded = jwt.verify(token, JWT_SECRET); } catch (err) { res.status(401).json({ error: "Invalid token. Please log in again." }); return; }

        const carCheck = await query('SELECT created_by FROM "Cars" WHERE id = $1', [carId]);
        if (carCheck.rows.length === 0) { res.status(404).json({ error: "Car not found." }); return; }

        const carOwnerId = carCheck.rows[0].created_by;
        if (decoded.role !== 'Admin' && (decoded.role !== 'Dealer' || Number(decoded.userId) !== Number(carOwnerId))) {
            res.status(403).json({ error: "Access denied. You do not have permission to delete this listing." }); return;
        }

        await query('DELETE FROM "Cars" WHERE id = $1', [carId]);
        await clearCarsCache();
        await deleteCarDoc(carId);

        res.json({ message: "Car listing deleted successfully." });
    } catch (error: any) {
        console.error("Error deleting car listing:", error);
        res.status(500).json({ error: "Failed to delete car listing." });
    }
});

// PUT /cars/:id - Edit car listing
router.put('/:id', async (req: Request, res: Response): Promise<void> => {
    try {
        const carId = req.params.id;
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(carId)) { res.status(400).json({ error: "Invalid car ID format." }); return; }

        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) { res.status(401).json({ error: "Access denied. Token is required." }); return; }

        const token = authHeader.split(' ')[1];
        let decoded: any;
        try { decoded = jwt.verify(token, JWT_SECRET); } catch (err) { res.status(401).json({ error: "Invalid token. Please log in again." }); return; }

        if (decoded.role !== 'Dealer' && decoded.role !== 'Admin') { res.status(403).json({ error: "Access denied. Only Dealers or Admins can edit a car listing." }); return; }

        const carCheck = await query('SELECT * FROM "Cars" WHERE id = $1', [carId]);
        if (carCheck.rows.length === 0) { res.status(404).json({ error: "Car not found." }); return; }

        const carOwnerId = carCheck.rows[0].created_by;
        if (decoded.role !== 'Admin' && (decoded.role !== 'Dealer' || (carOwnerId !== null && Number(decoded.userId) !== Number(carOwnerId)))) {
            res.status(403).json({ error: "Access denied. You do not have permission to edit this listing." }); return;
        }

        const { make, model, year, price, city, imageUrl, image_url, fuel_type, transmission, kms_driven, owners, rto } = req.body;
        if (!make || typeof make !== 'string' || !make.trim()) { res.status(400).json({ error: "Make is required." }); return; }
        if (!model || typeof model !== 'string' || !model.trim()) { res.status(400).json({ error: "Model is required." }); return; }
        const yearNum = parseInt(year, 10);
        if (isNaN(yearNum) || yearNum < 1900 || yearNum > 2027) { res.status(400).json({ error: "Please enter a valid year between 1900 and 2027." }); return; }
        const priceNum = parseInt(price, 10);
        if (isNaN(priceNum) || priceNum <= 0) { res.status(400).json({ error: "Please enter a valid price." }); return; }
        if (!city || typeof city !== 'string' || !city.trim()) { res.status(400).json({ error: "City is required." }); return; }
        const kmsDrivenNum = kms_driven !== undefined && kms_driven !== null ? parseInt(kms_driven, 10) : 15000;
        if (isNaN(kmsDrivenNum) || kmsDrivenNum < 0) { res.status(400).json({ error: "Please enter valid kilometers driven." }); return; }
        if (!rto || typeof rto !== 'string' || !rto.trim()) { res.status(400).json({ error: "Registration RTO is required." }); return; }

        const finalImageUrl = imageUrl !== undefined ? imageUrl : (image_url || null);
        const result = await query(
            `UPDATE "Cars" SET make = $1, model = $2, year = $3, price = $4, city = $5, image_url = $6, fuel_type = $7, transmission = $8, kms_driven = $9, owners = $10, rto = $11 WHERE id = $12 RETURNING *`,
            [make.trim(), model.trim(), yearNum, priceNum, city.trim(), finalImageUrl, fuel_type || 'Petrol', transmission || 'Manual', kmsDrivenNum, owners || '1st Owner', rto.trim(), carId]
        );

        const updatedCar = result.rows[0];
        try {
            const text = getCarSearchText(updatedCar);
            const vector = await getEmbedding(text);
            if (vector) {
                if (vectorExtensionEnabled) {
                    const vectorStr = `[${vector.join(',')}]`;
                    const vectorRes = await query('UPDATE "Cars" SET embedding = $1 WHERE id = $2 RETURNING *', [vectorStr, carId]);
                    if (vectorRes.rows && vectorRes.rows.length > 0) updatedCar.embedding = vectorRes.rows[0].embedding;
                } else {
                    inMemoryEmbeddings.set(carId, vector);
                }
            }
        } catch (err) { console.error('[Embeddings] Error re-generating embedding for edited car:', err); }

        await clearCarsCache();
        await indexCarDoc(updatedCar);

        res.json({ message: "Car listing updated successfully!", car: updatedCar });
    } catch (error: any) {
        console.error("Error updating car listing:", error);
        res.status(500).json({ error: "Failed to update car listing." });
    }
});

export default router;
