// Shared state and utilities used across route modules
import { redisClient } from './redisClient';

export const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

// In-memory vector cache (fallback when pgvector is unavailable)
export const inMemoryEmbeddings = new Map<string, number[]>();

export function cosineSimilarity(a: number[], b: number[]): number {
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

// Redis Cache Invalidation Helper
export async function clearCarsCache() {
    try {
        console.log('[Cache Invalidation] Incrementing cars cache version...');
        const newVersion = await redisClient.incr('cache:cars:version');
        console.log(`[Cache Invalidation] Cache version is now: ${newVersion}`);
    } catch (err) {
        console.error("Failed to invalidate cars cache:", err);
    }
}
