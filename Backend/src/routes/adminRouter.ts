import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { query } from '../db';

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'car_saathi_super_secret_secret_123';

// GET /admin/leads - Admin leads dashboard
router.get('/leads', async (req: Request, res: Response): Promise<void> => {
    try {
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

        if (decoded.role !== 'Admin' && decoded.role !== 'Dealer') {
            res.status(403).json({ error: "Access denied. Only Admins or Dealers can view leads dashboard." });
            return;
        }

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

export default router;
