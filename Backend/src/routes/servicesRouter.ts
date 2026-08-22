import { Router, Request, Response } from 'express';
import { query } from '../db';

const router = Router();

// POST /service-bookings - Book car service
router.post('/', async (req: Request, res: Response): Promise<void> => {
    try {
        const { serviceName, city, date, name, phone } = req.body;

        if (!serviceName || typeof serviceName !== 'string') { res.status(400).json({ error: "Service name is required." }); return; }
        if (!city || typeof city !== 'string' || !city.trim()) { res.status(400).json({ error: "City is required." }); return; }
        if (!date || typeof date !== 'string' || isNaN(Date.parse(date))) { res.status(400).json({ error: "A valid booking date is required." }); return; }
        if (!name || typeof name !== 'string' || !name.trim()) { res.status(400).json({ error: "Name is required." }); return; }
        if (!phone || typeof phone !== 'string' || phone.trim().length < 8) { res.status(400).json({ error: "A valid phone number is required." }); return; }

        const result = await query(
            'INSERT INTO service_bookings (service_name, city, booking_date, name, phone) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [serviceName.trim(), city.trim(), date, name.trim(), phone.trim()]
        );

        res.status(201).json({ message: "Service booked successfully!", booking: result.rows[0] });
    } catch (error: any) {
        console.error("Error booking service:", error);
        res.status(500).json({ error: "Failed to submit service booking." });
    }
});

export default router;
