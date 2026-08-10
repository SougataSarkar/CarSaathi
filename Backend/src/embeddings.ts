import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;

/**
 * Formats a car's properties into a rich text description for embedding generation.
 */
export function getCarSearchText(car: {
  make: string;
  model: string;
  year: number;
  price: number;
  city: string;
  fuel_type?: string;
  transmission?: string;
  kms_driven?: number;
  owners?: string;
  rto?: string;
}): string {
  const parts = [
    `${car.year} ${car.make} ${car.model}`,
    car.fuel_type ? `${car.fuel_type}` : '',
    car.transmission ? `${car.transmission}` : '',
    car.kms_driven !== undefined && car.kms_driven !== null ? `${car.kms_driven} km driven` : '',
    car.owners ? `${car.owners}` : '',
    `located in ${car.city}`,
    car.rto ? `RTO ${car.rto}` : '',
    `priced at ₹${car.price} INR`
  ].filter(Boolean);

  return parts.join(' ');
}

/**
 * Fetches the vector embedding from Google Gemini API for a given string.
 */
export async function getEmbedding(text: string): Promise<number[] | null> {
  if (!apiKey || apiKey === 'undefined' || apiKey.trim() === '') {
    console.warn('[Embeddings] Gemini API key not found. Skipping embedding generation.');
    return null;
  }

  const candidateModels = ['gemini-embedding-001', 'gemini-embedding-2', 'text-embedding-004'];

  for (const model of candidateModels) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      let response;
      try {
        response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:embedContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            signal: controller.signal,
            body: JSON.stringify({
              model: `models/${model}`,
              content: {
                parts: [{ text }]
              }
            })
          }
        );
      } finally {
        clearTimeout(timeoutId);
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Model ${model} returned status ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      if (data && data.embedding && Array.isArray(data.embedding.values)) {
        return data.embedding.values;
      }
      throw new Error(`Model ${model} returned invalid response format.`);
    } catch (error) {
      console.warn(`[Embeddings] Attempt with model ${model} failed:`, error);
    }
  }

  return null;
}

