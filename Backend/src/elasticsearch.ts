import { Client } from '@elastic/elasticsearch';
import { query } from './db';

let elasticsearchEnabled = false;
let client: Client | null = null;

const ELASTICSEARCH_URL = process.env.ELASTICSEARCH_URL || 'http://localhost:9200';

async function initElasticsearch(): Promise<void> {
  console.log(`Connecting to Elasticsearch at ${ELASTICSEARCH_URL}...`);
  try {
    client = new Client({ node: ELASTICSEARCH_URL });

    // Test connection with a 2-second timeout
    await Promise.race([
      client.ping(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Connection timeout')), 2000))
    ]);

    elasticsearchEnabled = true;
    console.log('✓ Successfully connected to local Elasticsearch.');

    // Ensure the index exists
    const indexExists = await client.indices.exists({ index: 'cars' });
    if (!indexExists) {
      console.log('Creating "cars" index in Elasticsearch...');
      await client.indices.create({
        index: 'cars',
        mappings: {
          properties: {
            id: { type: 'keyword' },
            make: { type: 'text', analyzer: 'english' },
            model: { type: 'text', analyzer: 'english' },
            city: { type: 'text', analyzer: 'english' },
            year: { type: 'integer' },
            price: { type: 'integer' },
            image_url: { type: 'keyword' }
          }
        }
      });
      console.log('✓ "cars" index created successfully.');
    }

    // Sync database listings into Elasticsearch
    await syncCarsToElasticsearch();
  } catch (error) {
    console.warn('⚠ Could not connect to real Elasticsearch service. Falling back to PostgreSQL FTS.');
    elasticsearchEnabled = false;
    client = null;
  }
}

async function syncCarsToElasticsearch(): Promise<void> {
  if (!client || !elasticsearchEnabled) return;

  try {
    console.log('Syncing car listings from PostgreSQL to Elasticsearch...');
    const result = await query('SELECT * FROM "Cars"');
    const cars = result.rows;

    if (cars.length === 0) {
      console.log('No listings to sync.');
      return;
    }

    // Prepare bulk index operations payload
    const operations = cars.flatMap(doc => [
      { index: { _index: 'cars', _id: doc.id } },
      {
        id: doc.id,
        make: doc.make,
        model: doc.model,
        city: doc.city,
        year: doc.year,
        price: doc.price,
        image_url: doc.image_url
      }
    ]);

    const bulkResponse = await client.bulk({ refresh: true, operations });
    if (bulkResponse.errors) {
      console.error('Errors occurred during bulk index sync.');
    } else {
      console.log(`✓ Synced ${cars.length} cars into Elasticsearch successfully.`);
    }
  } catch (error) {
    console.error('Error syncing cars to Elasticsearch:', error);
  }
}

async function indexCarDoc(car: any): Promise<void> {
  if (!client || !elasticsearchEnabled) return;
  try {
    console.log(`Indexing car ${car.id} into Elasticsearch...`);
    await client.index({
      index: 'cars',
      id: car.id,
      document: {
        id: car.id,
        make: car.make,
        model: car.model,
        city: car.city,
        year: car.year,
        price: car.price,
        image_url: car.image_url
      },
      refresh: true
    });
  } catch (error) {
    console.error(`Error indexing car ${car.id} in Elasticsearch:`, error);
  }
}

async function deleteCarDoc(carId: string): Promise<void> {
  if (!client || !elasticsearchEnabled) return;
  try {
    console.log(`Deleting car ${carId} from Elasticsearch...`);
    await client.delete({
      index: 'cars',
      id: carId,
      refresh: true
    });
  } catch (error) {
    console.error(`Error deleting car ${carId} from Elasticsearch:`, error);
  }
}

function getLevenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

function isFuzzyMatch(queryWord: string, targetWord: string): boolean {
  const q = queryWord.toLowerCase().trim();
  const t = targetWord.toLowerCase().trim();
  if (t.includes(q) || q.includes(t)) return true; // substring match

  const dist = getLevenshteinDistance(q, t);
  const maxAllowedDist = Math.max(1, Math.floor(t.length * 0.3)); // 30% typo tolerance
  return dist <= maxAllowedDist;
}

async function searchCarsInElasticsearch(searchTerm: string): Promise<string[] | null> {
  // If Elasticsearch is connected, run a fuzzy search query
  if (client && elasticsearchEnabled) {
    try {
      console.log(`Searching for "${searchTerm}" in Elasticsearch...`);
      const searchResponse = await client.search({
        index: 'cars',
        query: {
          multi_match: {
            query: searchTerm,
            fields: ['make^2', 'model^2', 'city'],
            fuzziness: 'AUTO'
          }
        }
      });

      const hits = searchResponse.hits.hits;
      return hits.map((hit: any) => hit._id as string);
    } catch (error) {
      console.error('Error querying Elasticsearch:', error);
      return null;
    }
  }

  // Fallback: In-Memory Fuzzy Match Simulation
  try {
    console.log(`[Elasticsearch Fallback] Simulating in-memory fuzzy search for: "${searchTerm}"`);
    const result = await query('SELECT id, make, model, city, created_by FROM "Cars"');
    const cars = result.rows;
    const queryTerms = searchTerm.toLowerCase().split(/\s+/).filter(Boolean);

    if (queryTerms.length === 0) return [];

    const scoredCars = cars.map(car => {
      let score = 0;
      const makeWords = car.make.toLowerCase().split(/\s+/);
      const modelWords = car.model.toLowerCase().split(/\s+/);
      const cityWords = car.city.toLowerCase().split(/\s+/);

      for (const qTerm of queryTerms) {
        const hasMakeMatch = makeWords.some((w: string) => isFuzzyMatch(qTerm, w));
        if (hasMakeMatch) score += 5;

        const hasModelMatch = modelWords.some((w: string) => isFuzzyMatch(qTerm, w));
        if (hasModelMatch) score += 5;

        const hasCityMatch = cityWords.some((w: string) => isFuzzyMatch(qTerm, w));
        if (hasCityMatch) score += 2;
      }

      return { id: car.id, score, isListed: car.created_by != null ? 0 : 1 };
    });

    const matches = scoredCars
      .filter(car => car.score > 0)
      // Dealer/admin listings first, then by relevance score descending
      .sort((a, b) => {
        if (a.isListed !== b.isListed) return a.isListed - b.isListed;
        return b.score - a.score;
      })
      .map(car => car.id);

    console.log(`[Elasticsearch Fallback] Fuzzy matched ${matches.length} cars in memory.`);
    return matches;
  } catch (err) {
    console.error('Error in Elasticsearch fuzzy match fallback:', err);
    return null;
  }
}

export {
  elasticsearchEnabled,
  initElasticsearch,
  syncCarsToElasticsearch,
  indexCarDoc,
  deleteCarDoc,
  searchCarsInElasticsearch
};
export default initElasticsearch;
