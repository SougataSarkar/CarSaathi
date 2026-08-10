import { Pool, PoolConfig } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const poolConfig: PoolConfig = process.env.DATABASE_URL
  ? {
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes('localhost') || process.env.DATABASE_URL.includes('127.0.0.1')
      ? false
      : { rejectUnauthorized: false },
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  }
  : {
    host: process.env.PGHOST || 'localhost',
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || 'postgres',
    database: process.env.PGDATABASE || 'car_saathi',
    port: parseInt(process.env.PGPORT || '5432', 10),
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  };

export let vectorExtensionEnabled = false;

export const pool = new Pool(poolConfig);

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client:', err);
});

let isPostgresOffline = false;

const defaultCarsList = [
  { id: "10000000-0000-0000-0000-000000000001", make: "Maruti Suzuki", model: "Swift", year: 2019, price: 500000, city: "Delhi", image_url: "/images/cars/1.jpg" },
  { id: "10000000-0000-0000-0000-000000000002", make: "Tata", model: "Nexon", year: 2021, price: 850000, city: "Mumbai", image_url: "/images/cars/2.jpg" },
  { id: "10000000-0000-0000-0000-000000000003", make: "Hyundai", model: "Creta", year: 2020, price: 1050000, city: "Bangalore", image_url: "/images/cars/3.jpg" },
  { id: "10000000-0000-0000-0000-000000000004", make: "Honda", model: "City", year: 2018, price: 700000, city: "Chennai", image_url: "/images/cars/4.jpg" },
  { id: "10000000-0000-0000-0000-000000000005", make: "Mahindra", model: "Thar", year: 2022, price: 1500000, city: "Pune", image_url: "/images/cars/5.jpg" },
  { id: "10000000-0000-0000-0000-000000000006", make: "Toyota", model: "Innova Crysta", year: 2019, price: 1800000, city: "Hyderabad", image_url: "/images/cars/6.jpg" },
  { id: "10000000-0000-0000-0000-000000000007", make: "Kia", model: "Seltos", year: 2021, price: 1200000, city: "Delhi", image_url: "/images/cars/7.jpg" },
  { id: "10000000-0000-0000-0000-000000000008", make: "Volkswagen", model: "Polo", year: 2017, price: 400000, city: "Kolkata", image_url: "/images/cars/8.jpg" },
  { id: "10000000-0000-0000-0000-000000000009", make: "Renault", model: "Kwid", year: 2020, price: 350000, city: "Ahmedabad", image_url: "/images/cars/9.jpg" },
  { id: "10000000-0000-0000-0000-000000000010", make: "BMW", model: "X1", year: 2018, price: 2500000, city: "Mumbai", image_url: "/images/cars/10.jpg" },
  { id: "10000000-0000-0000-0000-000000000011", make: "Audi", model: "A4", year: 2019, price: 3200000, city: "Delhi", image_url: "/images/cars/11.jpg" },
  { id: "10000000-0000-0000-0000-000000000012", make: "Mercedes-Benz", model: "C-Class", year: 2020, price: 4200000, city: "Bangalore", image_url: "/images/cars/12.jpg" },
  { id: "10000000-0000-0000-0000-000000000013", make: "Skoda", model: "Slavia", year: 2022, price: 1450000, city: "Pune", image_url: "/images/cars/13.jpg" },
  { id: "10000000-0000-0000-0000-000000000014", make: "MG", model: "Hector", year: 2021, price: 1700000, city: "Lucknow", image_url: "/images/cars/14.jpg" },
  { id: "10000000-0000-0000-0000-000000000015", make: "Nissan", model: "Magnite", year: 2022, price: 850000, city: "Jaipur", image_url: "/images/cars/15.jpg" },
  { id: "10000000-0000-0000-0000-000000000016", make: "Maruti Suzuki", model: "Baleno", year: 2021, price: 750000, city: "Kolkata", image_url: "/images/cars/16.jpg" },
  { id: "10000000-0000-0000-0000-000000000017", make: "Hyundai", model: "i20", year: 2020, price: 720000, city: "Chandigarh", image_url: "/images/cars/17.jpg" },
  { id: "10000000-0000-0000-0000-000000000018", make: "Tata", model: "Punch", year: 2023, price: 890000, city: "Indore", image_url: "/images/cars/18.jpg" },
  { id: "10000000-0000-0000-0000-000000000019", make: "Mahindra", model: "XUV700", year: 2022, price: 2100000, city: "Nagpur", image_url: "/images/cars/19.jpg" },
  { id: "10000000-0000-0000-0000-000000000020", make: "Toyota", model: "Fortuner", year: 2021, price: 3900000, city: "Hyderabad", image_url: "/images/cars/20.jpg" },
  { id: "10000000-0000-0000-0000-000000000021", make: "Honda", model: "Amaze", year: 2019, price: 650000, city: "Delhi", image_url: "/images/cars/21.jpg" },
  { id: "10000000-0000-0000-0000-000000000022", make: "Kia", model: "Sonet", year: 2022, price: 980000, city: "Mumbai", image_url: "/images/cars/22.jpg" },
  { id: "10000000-0000-0000-0000-000000000023", make: "Renault", model: "Triber", year: 2021, price: 780000, city: "Patna", image_url: "/images/cars/23.jpg" },
  { id: "10000000-0000-0000-0000-000000000024", make: "Volkswagen", model: "Virtus", year: 2023, price: 1650000, city: "Surat", image_url: "/images/cars/24.jpg" },
  { id: "10000000-0000-0000-0000-000000000025", make: "BMW", model: "3 Series", year: 2021, price: 4800000, city: "Mumbai", image_url: "/images/cars/25.jpg" },
  { id: "10000000-0000-0000-0000-000000000026", make: "Audi", model: "Q3", year: 2022, price: 5200000, city: "Delhi", image_url: "/images/cars/26.jpg" },
  { id: "10000000-0000-0000-0000-000000000027", make: "Mercedes-Benz", model: "GLA", year: 2021, price: 5600000, city: "Chennai", image_url: "/images/cars/27.jpg" },
  { id: "10000000-0000-0000-0000-000000000028", make: "Hyundai", model: "Verna", year: 2023, price: 1550000, city: "Bangalore", image_url: "/images/cars/28.jpg" },
  { id: "10000000-0000-0000-0000-000000000029", make: "Tata", model: "Harrier", year: 2022, price: 2200000, city: "Bhopal", image_url: "/images/cars/29.jpg" },
  { id: "10000000-0000-0000-0000-000000000030", make: "Mahindra", model: "Scorpio-N", year: 2023, price: 2350000, city: "Ranchi", image_url: "/images/cars/30.jpg" },
  { id: "10000000-0000-0000-0000-000000000031", make: "Maruti Suzuki", model: "Brezza", year: 2022, price: 1100000, city: "Noida", image_url: "/images/cars/31.jpg" },
  { id: "10000000-0000-0000-0000-000000000032", make: "Skoda", model: "Kushaq", year: 2022, price: 1800000, city: "Gurgaon", image_url: "/images/cars/32.jpg" },
  { id: "10000000-0000-0000-0000-000000000033", make: "MG", model: "Astor", year: 2023, price: 1650000, city: "Kochi", image_url: "/images/cars/33.jpg" },
  { id: "10000000-0000-0000-0000-000000000034", make: "Honda", model: "Elevate", year: 2023, price: 1750000, city: "Visakhapatnam", image_url: "/images/cars/34.jpg" },
  { id: "10000000-0000-0000-0000-000000000035", make: "Toyota", model: "Glanza", year: 2022, price: 900000, city: "Coimbatore", image_url: "/images/cars/35.jpg" },
  { id: "10000000-0000-0000-0000-000000000036", make: "Hyundai", model: "Venue", year: 2021, price: 980000, city: "Pune", image_url: "/images/cars/36.jpg" },
  { id: "10000000-0000-0000-0000-000000000037", make: "Tata", model: "Altroz", year: 2020, price: 760000, city: "Kolkata", image_url: "/images/cars/37.jpg" },
  { id: "10000000-0000-0000-0000-000000000038", make: "Maruti Suzuki", model: "Dzire", year: 2019, price: 620000, city: "Ahmedabad", image_url: "/images/cars/38.jpg" },
  { id: "10000000-0000-0000-0000-000000000039", make: "Kia", model: "Carens", year: 2023, price: 1650000, city: "Lucknow", image_url: "/images/cars/39.jpg" },
  { id: "10000000-0000-0000-0000-000000000040", make: "BMW", model: "X5", year: 2022, price: 8500000, city: "Mumbai", image_url: "/images/cars/40.jpg" },
  { id: "10000000-0000-0000-0000-000000000041", make: "Audi", model: "Q5", year: 2021, price: 6500000, city: "Delhi", image_url: "/images/cars/41.jpg" },
  { id: "10000000-0000-0000-0000-000000000042", make: "Mercedes-Benz", model: "E-Class", year: 2022, price: 7600000, city: "Bangalore", image_url: "/images/cars/42.jpg" },
  { id: "10000000-0000-0000-0000-000000000043", make: "Toyota", model: "Camry", year: 2021, price: 4600000, city: "Hyderabad", image_url: "/images/cars/43.jpg" },
  { id: "10000000-0000-0000-0000-000000000044", make: "Mahindra", model: "Bolero", year: 2018, price: 750000, city: "Patna", image_url: "/images/cars/45.jpg" },
  { id: "10000000-0000-0000-0000-000000000045", make: "Renault", model: "Kiger", year: 2022, price: 820000, city: "Jaipur", image_url: "/images/cars/45.jpg" },
  { id: "10000000-0000-0000-0000-000000000046", make: "Volkswagen", model: "Taigun", year: 2023, price: 1750000, city: "Nagpur", image_url: "/images/cars/46.jpg" },
  { id: "10000000-0000-0000-0000-000000000047", make: "Honda", model: "Jazz", year: 2019, price: 690000, city: "Chennai", image_url: "/images/cars/47.jpg" },
  { id: "10000000-0000-0000-0000-000000000048", make: "Hyundai", model: "Grand i10 Nios", year: 2021, price: 650000, city: "Delhi", image_url: "/images/cars/48.jpg" },
  { id: "10000000-0000-0000-0000-000000000049", make: "Maruti Suzuki", model: "Ertiga", year: 2022, price: 1250000, city: "Mumbai", image_url: "/images/cars/49.jpg" },
  { id: "10000000-0000-0000-0000-000000000050", make: "Tata", model: "Safari", year: 2023, price: 2550000, city: "Bangalore", image_url: "/images/cars/50.jpg" }
];

let inMemoryCars: any[] = [...defaultCarsList];
let inMemoryUsers: any[] = [];
let inMemoryBookings: any[] = [];
let inMemoryServices: any[] = [];
let inMemoryLoans: any[] = [];
let inMemoryLeads: any[] = [];

async function inMemoryQuery(text: string, params?: any[]): Promise<{ rows: any[] }> {
  const normalized = text.trim();

  if (/SELECT\s+COUNT\(\*\)\s+FROM\s+"Cars"/i.test(normalized)) {
    return { rows: [{ count: inMemoryCars.length.toString() }] };
  }

  if (/FROM\s+"Cars"/i.test(normalized)) {
    let result = [...inMemoryCars];

    if (params && params.length > 0) {
      if (normalized.includes('id = $1') || normalized.includes('WHERE id = $1')) {
        const targetId = params[0];
        result = result.filter(c => c.id === targetId || String(c.id) === String(targetId));
      }
      if (normalized.includes('city = $')) {
        const cityParam = params.find(p => typeof p === 'string' && p !== 'all');
        if (cityParam) {
          result = result.filter(c => c.city && c.city.toLowerCase() === cityParam.toLowerCase());
        }
      }
    }

    if (normalized.includes('ORDER BY price ASC')) {
      result.sort((a, b) => {
        // Dealer/admin listings first
        const aIsListed = a.created_by != null ? 0 : 1;
        const bIsListed = b.created_by != null ? 0 : 1;
        if (aIsListed !== bIsListed) return aIsListed - bIsListed;
        return a.price - b.price;
      });
    } else if (normalized.includes('ORDER BY price DESC')) {
      result.sort((a, b) => {
        const aIsListed = a.created_by != null ? 0 : 1;
        const bIsListed = b.created_by != null ? 0 : 1;
        if (aIsListed !== bIsListed) return aIsListed - bIsListed;
        return b.price - a.price;
      });
    } else if (normalized.includes('ORDER BY year DESC')) {
      result.sort((a, b) => {
        const aIsListed = a.created_by != null ? 0 : 1;
        const bIsListed = b.created_by != null ? 0 : 1;
        if (aIsListed !== bIsListed) return aIsListed - bIsListed;
        return b.year - a.year;
      });
    } else if (normalized.includes('ORDER BY make ASC')) {
      result.sort((a, b) => {
        const aIsListed = a.created_by != null ? 0 : 1;
        const bIsListed = b.created_by != null ? 0 : 1;
        if (aIsListed !== bIsListed) return aIsListed - bIsListed;
        return (a.make || '').localeCompare(b.make || '');
      });
    } else {
      // Default: dealer/admin listings first, then newest created_at
      result.sort((a, b) => {
        const aIsListed = a.created_by != null ? 0 : 1;
        const bIsListed = b.created_by != null ? 0 : 1;
        if (aIsListed !== bIsListed) return aIsListed - bIsListed;
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      });
    }

    return { rows: result };
  }

  if (/INSERT\s+INTO\s+"Cars"/i.test(normalized)) {
    const newCar = {
      id: `10000000-0000-0000-0000-${Date.now().toString().padStart(12, '0')}`,
      make: params?.[0] || 'Unknown',
      model: params?.[1] || 'Car',
      year: params?.[2] || 2022,
      price: params?.[3] || 500000,
      city: params?.[4] || 'Delhi',
      image_url: params?.[5] || '/images/cars/1.jpg',
      created_by: params?.[6] || null,
      fuel_type: params?.[7] || 'Petrol',
      transmission: params?.[8] || 'Manual',
      kms_driven: params?.[9] || 15000,
      owners: params?.[10] || '1st',
      rto: params?.[11] || 'DL01',
      created_at: new Date().toISOString()
    };
    inMemoryCars.unshift(newCar);
    return { rows: [newCar] };
  }

  if (/UPDATE\s+"Cars"/i.test(normalized)) {
    if (normalized.includes('SET embedding =')) {
      const carId = params?.[1];
      const car = inMemoryCars.find(c => c.id === carId || String(c.id) === String(carId));
      if (car) {
        car.embedding = params?.[0];
        return { rows: [car] };
      }
      return { rows: [] };
    }
    const carId = params?.[11];
    const car = inMemoryCars.find(c => c.id === carId || String(c.id) === String(carId));
    if (car) {
      if (params?.[0] !== undefined) car.make = params[0];
      if (params?.[1] !== undefined) car.model = params[1];
      if (params?.[2] !== undefined) car.year = params[2];
      if (params?.[3] !== undefined) car.price = params[3];
      if (params?.[4] !== undefined) car.city = params[4];
      if (params?.[5] !== undefined) car.image_url = params[5];
      if (params?.[6] !== undefined) car.fuel_type = params[6];
      if (params?.[7] !== undefined) car.transmission = params[7];
      if (params?.[8] !== undefined) car.kms_driven = params[8];
      if (params?.[9] !== undefined) car.owners = params[9];
      if (params?.[10] !== undefined) car.rto = params[10];
      return { rows: [car] };
    }
    return { rows: [] };
  }

  if (/DELETE\s+FROM\s+"Cars"/i.test(normalized)) {
    const carId = params?.[0];
    inMemoryCars = inMemoryCars.filter(c => c.id !== carId);
    return { rows: [] };
  }

  if (/FROM\s+users/i.test(normalized)) {
    if (params && params.length > 0) {
      const val = params[0];
      const match = inMemoryUsers.find(u => u.email === val || u.phone === val);
      return { rows: match ? [match] : [] };
    }
    return { rows: inMemoryUsers };
  }

  if (/INSERT\s+INTO\s+users/i.test(normalized)) {
    const newUser = {
      id: inMemoryUsers.length + 1,
      name: params?.[0] || 'User',
      email: params?.[1] || '',
      phone: params?.[2] || '',
      password_hash: params?.[3] || '',
      role: params?.[4] || 'Customer',
      created_at: new Date().toISOString()
    };
    inMemoryUsers.push(newUser);
    return { rows: [newUser] };
  }

  if (/INSERT\s+INTO\s+bookings/i.test(normalized)) {
    const newBooking = { id: inMemoryBookings.length + 1, created_at: new Date().toISOString() };
    inMemoryBookings.push(newBooking);
    return { rows: [newBooking] };
  }
  if (/FROM\s+bookings/i.test(normalized)) return { rows: inMemoryBookings };
  if (/FROM\s+service_bookings/i.test(normalized)) return { rows: inMemoryServices };
  if (/FROM\s+loan_applications/i.test(normalized)) return { rows: inMemoryLoans };
  if (/FROM\s+new_car_leads/i.test(normalized)) return { rows: inMemoryLeads };

  return { rows: [] };
}

export const query = async (text: string, params?: any[]): Promise<{ rows: any[] }> => {
  if (isPostgresOffline) {
    return inMemoryQuery(text, params);
  }
  try {
    return await pool.query(text, params);
  } catch (err: any) {
    if (err.code === '28P01' || err.code === 'ECONNREFUSED' || err.message?.includes('password authentication failed') || err.message?.includes('connect ECONNREFUSED')) {
      if (!isPostgresOffline) {
        console.warn('⚠ PostgreSQL database connection unavailable (' + (err.message || 'offline') + '). Activating In-Memory Fallback Database for local development.');
        isPostgresOffline = true;
      }
      return inMemoryQuery(text, params);
    }
    throw err;
  }
};

export async function initDatabase() {
  try {
    // Try to install vector extension safely
    try {
      await query(`CREATE EXTENSION IF NOT EXISTS vector;`);
      vectorExtensionEnabled = true;
      console.log('✓ Successfully initialized vector extension (pgvector) in PostgreSQL.');
    } catch (err) {
      console.warn('⚠ Vector extension (pgvector) is not available or could not be loaded in PostgreSQL. Semantic/similar car search will fall back to metadata similarities.');
      vectorExtensionEnabled = false;
    }

    // Drop old tables if we are migrating "Cars".id type from integer to UUID
    const idTypeRes = await query(`
      SELECT data_type FROM information_schema.columns 
      WHERE table_name = 'Cars' AND column_name = 'id'
    `);
    if (idTypeRes.rows.length > 0 && idTypeRes.rows[0].data_type === 'integer') {
      console.log('Migrating table "Cars" primary key from integer to UUID: Dropping old tables...');
      await query('DROP TABLE IF EXISTS bookings CASCADE');
      await query('DROP TABLE IF EXISTS "Cars" CASCADE');
    }

    // 1. Create users table first
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(150) UNIQUE NOT NULL,
        phone VARCHAR(20) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'Customer';
    `);

    // 2. Create Cars table
    await query(`
      CREATE TABLE IF NOT EXISTS "Cars" (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        make VARCHAR(100) NOT NULL,
        model VARCHAR(100) NOT NULL,
        year INT NOT NULL,
        price INT NOT NULL,
        city VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await query(`
      ALTER TABLE "Cars" ADD COLUMN IF NOT EXISTS image_url TEXT;
    `);

    await query(`
      ALTER TABLE "Cars" ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    `);

    await query(`
      ALTER TABLE "Cars" ADD COLUMN IF NOT EXISTS created_by INT REFERENCES users(id) ON DELETE SET NULL;
    `);

    await query(`
      ALTER TABLE "Cars" ADD COLUMN IF NOT EXISTS fuel_type VARCHAR(50);
    `);
    await query(`
      ALTER TABLE "Cars" ADD COLUMN IF NOT EXISTS transmission VARCHAR(50);
    `);
    await query(`
      ALTER TABLE "Cars" ADD COLUMN IF NOT EXISTS kms_driven INT;
    `);
    await query(`
      ALTER TABLE "Cars" ADD COLUMN IF NOT EXISTS owners VARCHAR(50);
    `);
    await query(`
      ALTER TABLE "Cars" ADD COLUMN IF NOT EXISTS rto VARCHAR(50);
    `);

    if (vectorExtensionEnabled) {
      await query(`
        ALTER TABLE "Cars" ADD COLUMN IF NOT EXISTS embedding vector(768);
      `);
    }

    // 3. Create bookings table
    await query(`
      CREATE TABLE IF NOT EXISTS bookings (
        id SERIAL PRIMARY KEY,
        car_id UUID NOT NULL REFERENCES "Cars"(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        booking_date DATE NOT NULL,
        booking_time VARCHAR(20) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS loan_applications (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        income INT NOT NULL,
        employment VARCHAR(50) NOT NULL,
        credit_score VARCHAR(50) NOT NULL,
        loan_amount INT NOT NULL,
        tenure_years INT NOT NULL,
        status VARCHAR(50) DEFAULT 'Pending Approval',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await query(`
      ALTER TABLE loan_applications ADD COLUMN IF NOT EXISTS identity_proof_name VARCHAR(255);
    `);
    await query(`
      ALTER TABLE loan_applications ADD COLUMN IF NOT EXISTS identity_proof_data TEXT;
    `);
    await query(`
      ALTER TABLE loan_applications ADD COLUMN IF NOT EXISTS address_proof_name VARCHAR(255);
    `);
    await query(`
      ALTER TABLE loan_applications ADD COLUMN IF NOT EXISTS address_proof_data TEXT;
    `);
    await query(`
      ALTER TABLE loan_applications ADD COLUMN IF NOT EXISTS income_proof_name VARCHAR(255);
    `);
    await query(`
      ALTER TABLE loan_applications ADD COLUMN IF NOT EXISTS income_proof_data TEXT;
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS new_car_leads (
        id SERIAL PRIMARY KEY,
        car_name VARCHAR(100) NOT NULL,
        name VARCHAR(100) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        email VARCHAR(150) NOT NULL,
        city VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS service_bookings (
        id SERIAL PRIMARY KEY,
        service_name VARCHAR(100) NOT NULL,
        city VARCHAR(100) NOT NULL,
        booking_date DATE NOT NULL,
        name VARCHAR(100) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Add full-text search column and GIN index if they do not exist
    const tsvCheck = await query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'Cars' AND column_name = 'tsv_search'
    `);
    if (tsvCheck.rows.length === 0) {
      await query(`
        ALTER TABLE "Cars" ADD COLUMN tsv_search tsvector GENERATED ALWAYS AS (
          setweight(to_tsvector('english', coalesce(make, '')), 'A') ||
          setweight(to_tsvector('english', coalesce(model, '')), 'B') ||
          setweight(to_tsvector('english', coalesce(city, '')), 'C') ||
          setweight(to_tsvector('english', coalesce(year::text, '')), 'D')
        ) STORED;
      `);
      await query(`
        CREATE INDEX IF NOT EXISTS cars_tsv_idx ON "Cars" USING gin(tsv_search);
      `);
      console.log('PostgreSQL full-text search generated column and index initialized.');
    }

    console.log('PostgreSQL connection verified and schema ready.');

    // 2. Check if table is empty, and seed if it is
    const checkRes = await query('SELECT COUNT(*) FROM "Cars"');
    const count = parseInt(checkRes.rows[0].count, 10);
    if (count === 0) {
      console.log('Database empty. Seeding initial car listings...');
      const cars = [
        { "make": "Maruti Suzuki", "model": "Swift", "year": 2019, "price": 500000, "city": "Delhi" },
        { "make": "Tata", "model": "Nexon", "year": 2021, "price": 850000, "city": "Mumbai" },
        { "make": "Hyundai", "model": "Creta", "year": 2020, "price": 1050000, "city": "Bangalore" },
        { "make": "Honda", "model": "City", "year": 2018, "price": 700000, "city": "Chennai" },
        { "make": "Mahindra", "model": "Thar", "year": 2022, "price": 1500000, "city": "Pune" },
        { "make": "Toyota", "model": "Innova Crysta", "year": 2019, "price": 1800000, "city": "Hyderabad" },
        { "make": "Kia", "model": "Seltos", "year": 2021, "price": 1200000, "city": "Delhi" },
        { "make": "Volkswagen", "model": "Polo", "year": 2017, "price": 400000, "city": "Kolkata" },
        { "make": "Renault", "model": "Kwid", "year": 2020, "price": 350000, "city": "Ahmedabad" },
        { "make": "BMW", "model": "X1", "year": 2018, "price": 2500000, "city": "Mumbai" },
        { "make": "Audi", "model": "A4", "year": 2019, "price": 3200000, "city": "Delhi" },
        { "make": "Mercedes-Benz", "model": "C-Class", "year": 2020, "price": 4200000, "city": "Bangalore" },
        { "make": "Skoda", "model": "Slavia", "year": 2022, "price": 1450000, "city": "Pune" },
        { "make": "MG", "model": "Hector", "year": 2021, "price": 1700000, "city": "Lucknow" },
        { "make": "Nissan", "model": "Magnite", "year": 2022, "price": 850000, "city": "Jaipur" },
        { "make": "Maruti Suzuki", "model": "Baleno", "year": 2021, "price": 750000, "city": "Kolkata" },
        { "make": "Hyundai", "model": "i20", "year": 2020, "price": 720000, "city": "Chandigarh" },
        { "make": "Tata", "model": "Punch", "year": 2023, "price": 890000, "city": "Indore" },
        { "make": "Mahindra", "model": "XUV700", "year": 2022, "price": 2100000, "city": "Nagpur" },
        { "make": "Toyota", "model": "Fortuner", "year": 2021, "price": 3900000, "city": "Hyderabad" },
        { "make": "Honda", "model": "Amaze", "year": 2019, "price": 650000, "city": "Delhi" },
        { "make": "Kia", "model": "Sonet", "year": 2022, "price": 980000, "city": "Mumbai" },
        { "make": "Renault", "model": "Triber", "year": 2021, "price": 780000, "city": "Patna" },
        { "make": "Volkswagen", "model": "Virtus", "year": 2023, "price": 1650000, "city": "Surat" },
        { "make": "BMW", "model": "3 Series", "year": 2021, "price": 4800000, "city": "Mumbai" },
        { "make": "Audi", "model": "Q3", "year": 2022, "price": 5200000, "city": "Delhi" },
        { "make": "Mercedes-Benz", "model": "GLA", "year": 2021, "price": 5600000, "city": "Chennai" },
        { "make": "Hyundai", "model": "Verna", "year": 2023, "price": 1550000, "city": "Bangalore" },
        { "make": "Tata", "model": "Harrier", "year": 2022, "price": 2200000, "city": "Bhopal" },
        { "make": "Mahindra", "model": "Scorpio-N", "year": 2023, "price": 2350000, "city": "Ranchi" },
        { "make": "Maruti Suzuki", "model": "Brezza", "year": 2022, "price": 1100000, "city": "Noida" },
        { "make": "Skoda", "model": "Kushaq", "year": 2022, "price": 1800000, "city": "Gurgaon" },
        { "make": "MG", "model": "Astor", "year": 2023, "price": 1650000, "city": "Kochi" },
        { "make": "Honda", "model": "Elevate", "year": 2023, "price": 1750000, "city": "Visakhapatnam" },
        { "make": "Toyota", "model": "Glanza", "year": 2022, "price": 900000, "city": "Coimbatore" },
        { "make": "Hyundai", "model": "Venue", "year": 2021, "price": 980000, "city": "Pune" },
        { "make": "Tata", "model": "Altroz", "year": 2020, "price": 760000, "city": "Kolkata" },
        { "make": "Maruti Suzuki", "model": "Dzire", "year": 2019, "price": 620000, "city": "Ahmedabad" },
        { "make": "Kia", "model": "Carens", "year": 2023, "price": 1650000, "city": "Lucknow" },
        { "make": "BMW", "model": "X5", "year": 2022, "price": 8500000, "city": "Mumbai" },
        { "make": "Audi", "model": "Q5", "year": 2021, "price": 6500000, "city": "Delhi" },
        { "make": "Mercedes-Benz", "model": "E-Class", "year": 2022, "price": 7600000, "city": "Bangalore" },
        { "make": "Toyota", "model": "Camry", "year": 2021, "price": 4600000, "city": "Hyderabad" },
        { "make": "Mahindra", "model": "Bolero", "year": 2018, "price": 750000, "city": "Patna" },
        { "make": "Renault", "model": "Kiger", "year": 2022, "price": 820000, "city": "Jaipur" },
        { "make": "Volkswagen", "model": "Taigun", "year": 2023, "price": 1750000, "city": "Nagpur" },
        { "make": "Honda", "model": "Jazz", "year": 2019, "price": 690000, "city": "Chennai" },
        { "make": "Hyundai", "model": "Grand i10 Nios", "year": 2021, "price": 650000, "city": "Delhi" },
        { "make": "Maruti Suzuki", "model": "Ertiga", "year": 2022, "price": 1250000, "city": "Mumbai" },
        { "make": "Tata", "model": "Safari", "year": 2023, "price": 2550000, "city": "Bangalore" }
      ];

      let insertCount = 0;
      let i = 1;
      for (const car of cars) {
        await query(
          'INSERT INTO "Cars" (make, model, year, price, city, image_url) VALUES ($1, $2, $3, $4, $5, $6)',
          [car.make, car.model, car.year, car.price, car.city, `/images/cars/${i}.jpg`]
        );
        i++;
        insertCount++;
      }
      console.log(`Seeded ${insertCount} cars into the database successfully.`);
    }
  } catch (error: any) {
    isPostgresOffline = true;
    console.warn('⚠ Could not connect to PostgreSQL database (' + (error.message || 'offline') + '). Activating In-Memory Fallback Database for local development.');
    console.log(`✓ In-Memory database initialized with ${inMemoryCars.length} car listings.`);
  }
}
