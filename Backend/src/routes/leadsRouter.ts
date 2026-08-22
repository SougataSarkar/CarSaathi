import { Router, Request, Response } from 'express';
import { query } from '../db';

const router = Router();

// POST /new-car-leads - Register interest in new car
router.post('/', async (req: Request, res: Response): Promise<void> => {
    try {
        const { carName, name, phone, email, city } = req.body;

        if (!carName || typeof carName !== 'string') { res.status(400).json({ error: "Car name is required." }); return; }
        if (!name || typeof name !== 'string' || !name.trim()) { res.status(400).json({ error: "Name is required." }); return; }
        if (!phone || typeof phone !== 'string' || phone.trim().length < 8) { res.status(400).json({ error: "A valid phone number is required." }); return; }
        if (!email || typeof email !== 'string' || !email.includes('@')) { res.status(400).json({ error: "A valid email is required." }); return; }
        if (!city || typeof city !== 'string' || !city.trim()) { res.status(400).json({ error: "City is required." }); return; }

        const result = await query(
            'INSERT INTO new_car_leads (car_name, name, phone, email, city) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [carName.trim(), name.trim(), phone.trim(), email.trim(), city.trim()]
        );

        res.status(201).json({ message: "Interest registered successfully!", lead: result.rows[0] });
    } catch (error: any) {
        console.error("Error registering lead for new car:", error);
        res.status(500).json({ error: "Failed to register interest." });
    }
});

export default router;
