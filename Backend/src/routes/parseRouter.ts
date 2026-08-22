import { Router, Request, Response } from 'express';
import { parseIndianPrice } from '../parser';

const router = Router();

router.get('/parse', (req: Request, res: Response): void => {
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

export default router;
