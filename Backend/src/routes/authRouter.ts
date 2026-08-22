import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { query } from '../db';
import { redisClient } from '../redisClient';

const router = Router();

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
            next();
        }
    };
};

// 1. User Registration
router.post('/register', redisRateLimiter(5, 60), async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, email, phone, password, role } = req.body;

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

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const result = await query(
            'INSERT INTO users (name, email, phone, password_hash, role) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, phone, role',
            [name.trim(), normalizedEmail, normalizedPhone, passwordHash, userRole]
        );

        const newUser = result.rows[0];
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
router.post('/login', redisRateLimiter(5, 60), async (req: Request, res: Response): Promise<void> => {
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
        const result = await query(
            'SELECT * FROM users WHERE email = $1 OR phone = $1',
            [queryTerm.toLowerCase()]
        );

        if (result.rows.length === 0) {
            res.status(401).json({ error: "Invalid credentials." });
            return;
        }

        const user = result.rows[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            res.status(401).json({ error: "Invalid credentials." });
            return;
        }

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
router.post('/otp/send', redisRateLimiter(5, 60), async (req: Request, res: Response): Promise<void> => {
    try {
        const { phone } = req.body;
        if (!phone || typeof phone !== 'string' || phone.trim().length < 8) {
            res.status(400).json({ error: "A valid phone number is required." });
            return;
        }

        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const key = `otp:${phone.trim()}`;
        await redisClient.set(key, otpCode, { EX: 300 });
        console.log(`[SIMULATED SMS] Send OTP ${otpCode} to ${phone}`);

        res.json({
            message: "OTP sent successfully (simulated)",
            otp: otpCode
        });
    } catch (error) {
        console.error("Error sending OTP:", error);
        res.status(500).json({ error: "Failed to send OTP." });
    }
});

// 2b. Verify Phone OTP
router.post('/otp/verify', async (req: Request, res: Response): Promise<void> => {
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

        await redisClient.del(key);
        res.json({ message: "OTP verified successfully." });
    } catch (error) {
        console.error("Error verifying OTP:", error);
        res.status(500).json({ error: "Failed to verify OTP." });
    }
});

export default router;
