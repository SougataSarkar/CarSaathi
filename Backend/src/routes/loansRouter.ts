import { Router, Request, Response } from 'express';
import { query } from '../db';

const router = Router();

// POST /loan-applications - Apply for car loan
router.post('/', async (req: Request, res: Response): Promise<void> => {
    try {
        const {
            name, phone, income, employment, creditScore, loanAmount, tenure,
            identityProofName, identityProofData, addressProofName, addressProofData,
            incomeProofName, incomeProofData
        } = req.body;

        if (!name || typeof name !== 'string' || !name.trim()) { res.status(400).json({ error: "Name is required." }); return; }
        if (!phone || typeof phone !== 'string' || phone.trim().length < 8) { res.status(400).json({ error: "A valid phone number is required." }); return; }
        const incomeNum = parseInt(income, 10);
        if (isNaN(incomeNum) || incomeNum <= 0) { res.status(400).json({ error: "Please enter a valid monthly income." }); return; }
        if (!employment || typeof employment !== 'string') { res.status(400).json({ error: "Employment type is required." }); return; }
        if (!creditScore || typeof creditScore !== 'string') { res.status(400).json({ error: "Credit score range is required." }); return; }
        const loanAmountNum = parseInt(loanAmount, 10);
        if (isNaN(loanAmountNum) || loanAmountNum <= 0) { res.status(400).json({ error: "Please enter a valid loan amount." }); return; }
        const tenureNum = parseInt(tenure, 10);
        if (isNaN(tenureNum) || tenureNum <= 0) { res.status(400).json({ error: "Tenure is required." }); return; }

        const status = incomeNum * 12 > (loanAmountNum / 5) ? 'Approved' : 'Review Required';

        const result = await query(
            'INSERT INTO loan_applications (name, phone, income, employment, credit_score, loan_amount, tenure_years, status, identity_proof_name, identity_proof_data, address_proof_name, address_proof_data, income_proof_name, income_proof_data) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *',
            [
                name.trim(), phone.trim(), incomeNum, employment.trim(), creditScore.trim(), loanAmountNum, tenureNum, status,
                identityProofName || null, identityProofData || null, addressProofName || null, addressProofData || null,
                incomeProofName || null, incomeProofData || null
            ]
        );

        res.status(201).json({ message: "Loan application processed successfully!", application: result.rows[0] });
    } catch (error: any) {
        console.error("Error submitting loan application:", error);
        res.status(500).json({ error: "Failed to submit loan application." });
    }
});

export default router;
