import { query } from './db';

export interface CarPreferences {
  prompt?: string;
  budget?: number;
  purpose?: string;
  fuelType?: string;
  bodyType?: string;
  priority?: string;
}

export interface RecommendationResult {
  carId: string;
  matchScore: number;
  reason: string;
}

export interface RecommendationResponse {
  recommendations: RecommendationResult[];
  verdict: string;
  isMock: boolean;
}

// Simple helper to classify body types for fallback matching
function getBodyType(make: string, model: string): 'Hatchback' | 'Sedan' | 'SUV' | 'MUV' {
  const modelLower = model.toLowerCase();

  const hatchbacks = ['swift', 'polo', 'baleno', 'i20', 'kwid', 'altroz', 'grand i10', 'glanza', 'jazz', 'punch', 'tiago', 'ignis', 'celerio', 'wagonr'];
  const sedans = ['city', 'amaze', 'slavia', 'virtus', 'c-class', 'a4', '3 series', 'e-class', 'camry', 'verna', 'dzire', 'ciaz', 'superb', 'octavia'];
  const muvs = ['innova', 'triber', 'carens', 'ertiga', 'xl6', 'marazzo', 'carnival'];

  if (hatchbacks.some(h => modelLower.includes(h))) return 'Hatchback';
  if (sedans.some(s => modelLower.includes(s))) return 'Sedan';
  if (muvs.some(m => modelLower.includes(m))) return 'MUV';
  return 'SUV'; // Default to SUV/Crossover
}

// Simple helper to guess fuel type if not explicitly provided on car object
function getFuelType(car: any): string {
  if (car.fuel_type && typeof car.fuel_type === 'string' && car.fuel_type.trim()) {
    return car.fuel_type.trim();
  }
  const modelLower = (car.model || '').toLowerCase();
  if (['fortuner', 'scorpio-n', 'harrier', 'safari', 'thar', 'bolero', 'xuv700', 'endeavour'].some(d => modelLower.includes(d))) {
    return 'Diesel';
  }
  if (modelLower.includes('ev') || modelLower.includes('e-tron') || modelLower.includes('eqc') || modelLower.includes('nexon.ev')) {
    return 'Electric';
  }
  return 'Petrol';
}

// Local mock match engine
function getMockRecommendations(preferences: CarPreferences, cars: any[]): RecommendationResponse {
  console.log('[AI Recommendation] Running in Local Match Fallback Mode...');

  const budget = preferences.budget || 50000000; // default large budget
  const purpose = preferences.purpose || 'commuting';
  const fuelType = preferences.fuelType || 'Any';
  const bodyType = preferences.bodyType || 'Any';
  const priority = preferences.priority || 'comfort';
  const textPrompt = (preferences.prompt || '').toLowerCase();

  // Score each car
  const scoredCars = cars.map(car => {
    let score = 85; // base score

    const carBody = getBodyType(car.make, car.model);
    const carFuel = getFuelType(car);
    const carTransmission = car.transmission || 'Manual';

    // 1. Budget Match
    if (car.price <= budget) {
      score += 10;
    } else {
      const overPercentage = (car.price - budget) / budget;
      score -= Math.min(40, Math.round(overPercentage * 100)); // penalize heavily if way over budget
    }

    // 2. Body Type Match
    if (bodyType !== 'Any') {
      if (bodyType.toLowerCase() === carBody.toLowerCase()) {
        score += 15;
      } else {
        score -= 20;
      }
    }

    // 3. Fuel Type Match
    if (fuelType !== 'Any') {
      if (fuelType.toLowerCase() === carFuel.toLowerCase()) {
        score += 15;
      } else {
        score -= 20;
      }
    }

    // 4. Custom prompt keyword boosting
    if (textPrompt) {
      const makeLower = car.make.toLowerCase();
      const modelLower = car.model.toLowerCase();
      if (textPrompt.includes(makeLower) || textPrompt.includes(modelLower)) {
        score += 30; // user explicitly typed this make/model
      }
      if (textPrompt.includes('suv') && carBody === 'SUV') score += 10;
      if (textPrompt.includes('sedan') && carBody === 'Sedan') score += 10;
      if (textPrompt.includes('hatchback') && carBody === 'Hatchback') score += 10;
      if (textPrompt.includes('family') && (carBody === 'SUV' || carBody === 'MUV')) score += 10;
      if (textPrompt.includes('luxury') && ['BMW', 'Audi', 'Mercedes-Benz'].includes(car.make)) score += 15;
      if (textPrompt.includes('mileage') && (carFuel === 'CNG' || carBody === 'Hatchback')) score += 10;
      if (textPrompt.includes('automatic') && carTransmission.toLowerCase() === 'automatic') score += 15;
      if (textPrompt.includes('diesel') && carFuel.toLowerCase() === 'diesel') score += 15;
    }

    // Cap score between 30 and 99
    score = Math.max(30, Math.min(99, score));

    // Generate explanations
    let reason = '';
    const budgetFormatted = `₹${(car.price / 100000).toFixed(1)} Lakh`;
    
    if (priority === 'safety') {
      reason = `${car.make} ${car.model} (${carFuel}, ${carTransmission}) offers robust build quality, excellent highway stability, and solid safety ratings. It falls within your budget at ${budgetFormatted}.`;
    } else if (priority === 'mileage') {
      reason = `The ${car.make} ${car.model} (${carFuel}) is highly popular for its fuel-efficient engine and low running costs, making it a highly economical choice at ${budgetFormatted}.`;
    } else if (priority === 'comfort') {
      reason = `With a spacious interior and plush suspension, this ${car.year} ${car.model} (${carTransmission}) provides superior ride quality and comfort for passenger commutes.`;
    } else if (priority === 'performance') {
      reason = `Featuring a punchy engine and agile dynamics, this ${car.make} ${car.model} delivers the engaging and responsive drive you are seeking.`;
    } else { // low maintenance
      reason = `${car.make} is renowned for high reliability and low upkeep costs. This ${car.year} model provides worry-free ownership at a great price of ${budgetFormatted}.`;
    }

    // Add usage/purpose notes
    if (purpose === 'family') {
      reason += ` Ideal for family drives with its flexible cabin spacing.`;
    } else if (purpose === 'adventure') {
      reason += ` High ground clearance and rugged design make it suitable for weekend road getaways.`;
    } else if (purpose === 'commuting') {
      reason += ` Its compact size and ease of handling are perfect for heavy city traffic.`;
    }

    return {
      carId: car.id,
      matchScore: score,
      reason
    };
  });

  // Sort by score descending and take top 3
  const topRecommendations = scoredCars
    .filter(c => c.matchScore >= 40)
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 3);

  // Fallback if none match reasonably
  if (topRecommendations.length === 0) {
    return {
      recommendations: [],
      verdict: "We couldn't find any listings matching your budget or preferences in our current database. Please try increasing your budget or selecting 'Any' for fuel or body type specifications.",
      isMock: true
    };
  }

  // General verdict text listing exact database car details
  const matchedSummaries = topRecommendations.map(rec => {
    const car = cars.find(c => c.id === rec.carId);
    if (!car) return '';
    const priceFormatted = `₹${(car.price / 100000).toFixed(2)} Lakh`;
    return `${car.year} ${car.make} ${car.model} in ${car.city} (${priceFormatted})`;
  }).filter(Boolean);

  let verdict = `Based on your specific preferences and budget, the most suitable car listings directly from our database are: ${matchedSummaries.join('; ')}. `;
  if (priority === 'safety') {
    verdict += "These vehicles offer structural safety, airbags, and reliable performance for peace of mind on long highway trips.";
  } else if (priority === 'mileage') {
    verdict += "These listings feature highly efficient powertrains to ensure ultra-low daily running expenses.";
  } else {
    verdict += "These selections provide optimal passenger comfort, spacious seating, and worry-free ownership.";
  }

  return {
    recommendations: topRecommendations,
    verdict,
    isMock: true
  };
}

export async function recommendCars(
  preferences: CarPreferences,
  cars: any[]
): Promise<RecommendationResponse> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;

  // Fall back if API Key is missing or invalid
  if (!apiKey || apiKey === 'undefined' || apiKey.trim() === '' || apiKey === 'your_gemini_api_key_here') {
    return getMockRecommendations(preferences, cars);
  }

  try {
    // Select full car specs to provide Gemini with complete evaluation context
    const cleanedCars = cars.map(car => ({
      id: car.id,
      make: car.make,
      model: car.model,
      year: car.year,
      price: car.price,
      city: car.city,
      fuel_type: car.fuel_type || 'Petrol',
      transmission: car.transmission || 'Manual',
      kms_driven: car.kms_driven || 20000,
      owners: car.owners || '1st Owner',
      rto: car.rto || ''
    }));

    const prompt = `
User Preferences:
- Budget Limit: ${preferences.budget ? `₹${preferences.budget} INR` : 'No Limit'}
- Driving Purpose: ${preferences.purpose || 'Not specified'}
- Fuel Type: ${preferences.fuelType || 'Any'}
- Body Type: ${preferences.bodyType || 'Any'}
- Main Priority: ${preferences.priority || 'Comfort'}
- Additional Description: "${preferences.prompt || 'None'}"

Available Preowned Cars Database (JSON):
${JSON.stringify(cleanedCars, null, 2)}

Match these available cars against the user's requirements. Recommend the top 3 best matching cars from the provided database.
Generate a specific reasoning for why each recommended car fits the user's preferences, referring back to their budget, body type, fuel type, transmission, and priorities.
Write a detailed verdict summary that explicitly names the recommended car listings from the database with their manufacturing year, make, model, city, and exact price, explaining why these specific listings match what the user wants.

Output strictly valid JSON matching the schema below. DO NOT output any markdown tags, wrap in blocks, or add text outside the JSON.
JSON Schema:
{
  "recommendations": [
    {
      "carId": "string matching the id of the recommended car",
      "matchScore": number (0 to 100),
      "reason": "friendly 2-3 sentence match explanation"
    }
  ],
  "verdict": "detailed recommendation summary text naming the specific matched database car listings (Year, Make, Model, City, Price) and explaining why they suit the user's requirements"
}
`;

    // Candidate models in order of preference: gemini-3.6-flash, gemini-3.5-flash, gemini-3.0-flash, gemini-2.5-pro
    const candidateModels = ['gemini-3.6-flash', 'gemini-3.5-flash', 'gemini-3.0-flash', 'gemini-2.5-pro'];
    let lastError: any = null;

    for (const modelName of candidateModels) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 12000);

        let response;
        try {
          response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              signal: controller.signal,
              body: JSON.stringify({
                contents: [
                  {
                    parts: [
                      {
                        text: prompt
                      }
                    ]
                  }
                ],
                generationConfig: {
                  temperature: 0.2
                }
              })
            }
          );
        } finally {
          clearTimeout(timeoutId);
        }

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`Model ${modelName} returned status ${response.status}: ${errText}`);
        }

        const resJson = await response.json();
        const generatedText = resJson?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!generatedText) {
          throw new Error(`Model ${modelName} returned empty response contents.`);
        }

        let jsonString = generatedText.trim();
        const startIdx = jsonString.indexOf('{');
        const endIdx = jsonString.lastIndexOf('}');
        if (startIdx !== -1 && endIdx !== -1) {
          jsonString = jsonString.slice(startIdx, endIdx + 1);
        }
        
        const parsedResponse = JSON.parse(jsonString);

        return {
          recommendations: parsedResponse.recommendations || [],
          verdict: parsedResponse.verdict || '',
          isMock: false
        };
      } catch (err) {
        lastError = err;
        console.warn(`[AI Recommendation] Attempt with model ${modelName} failed:`, err);
      }
    }

    throw lastError || new Error('All Gemini candidate models failed.');
  } catch (error) {
    console.error('[AI Recommendation] Error calling Gemini API, using enhanced local fallback:', error);
    return getMockRecommendations(preferences, cars);
  }
}

