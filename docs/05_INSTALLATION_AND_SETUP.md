# Project Chapter 5: Installation & Setup Guide

This guide describes how to configure, run, and deploy the CarSaathi application on your local machine.

---

## 1. Prerequisites Checklist
Ensure the following services are installed and active on your system:
*   **Node.js**: Version 18.0.0 or higher.
*   **PostgreSQL**: A relational database instance (running on port `5432`).
*   **Redis** *(Optional)*: An in-memory key-value store (running on port `6379`).
*   **Elasticsearch** *(Optional)*: A search server (running on port `9200`).

> [!NOTE]
> If Redis or Elasticsearch are not running, the application will activate its built-in fallbacks (In-Memory Map Cache and PostgreSQL Full-Text Search), allowing full testing without setting up local clusters.

---

## 2. Environment Configuration
Create a `.env` file inside the `Backend` folder.

### `Backend/.env`
```env
PORT=3000

# PostgreSQL Configuration
PGHOST=localhost
PGUSER=postgres
PGPASSWORD=your_postgres_password
PGDATABASE=car_saathi
PGPORT=5432

# Redis & Elasticsearch Services (Optional overrides)
REDIS_URL=redis://127.0.0.1:6379
ELASTICSEARCH_URL=http://localhost:9200

# Google Gemini AI API Configurations
GEMINI_API_KEY=your_gemini_api_key_here
API_KEY=your_gemini_api_key_here
```

---

## 3. Database Initialization & Seeding

The backend handles database migrations and seeding automatically.

### Step 1: Create the Database
To create the database specified in your environment variables, run the creation script from the `Backend` folder:
```bash
cd Backend
node create-db.js
```
This script connects to PostgreSQL and issues a `CREATE DATABASE "car_saathi"` command safely.

### Step 2: Automated Table Migrations & Seeding
Once the database is created, start the backend server. The initialization script inside `db.ts` will run automatically and perform the following:
1.  Verify if the primary key format needs migrating to UUIDs.
2.  Create tables if they don't exist: `users`, `"Cars"`, `bookings`, `loan_applications`, `new_car_leads`, and `service_bookings`.
3.  Add the generated search vector column `tsv_search` and index it using a GIN index.
4.  **Auto-Seed**: If the database `"Cars"` table is empty, it inserts **50+ default used car records** (spanning multiple cities like Delhi, Mumbai, Pune, Bangalore, Kolkata, and brands like Maruti Suzuki, Tata, Hyundai, Skoda, BMW, Audi, and Mercedes-Benz).

---

## 4. Run the Monorepo in Development Mode

You can launch both the React frontend and Express backend concurrently from the root directory.

### Step 1: Install Workspace Dependencies
Run at the root directory of the project:
```bash
npm install
```
This installs dependencies across the monorepo workspaces (`Backend` and `Frontend`).

### Step 2: Launch Concurrently
Run from the root directory:
```bash
npm run dev
```
This runs the script:
```bash
concurrently "npm run dev:backend" "npm run dev:frontend"
```
*   **Vite Frontend Server**: Starts at [http://localhost:5173](http://localhost:5173) (hot reloading enabled).
*   **Express API Server**: Starts at [http://localhost:3000](http://localhost:3000) (listening on endpoints and serving database queries).

---

## 5. Build for Production & Host Static Assets

In production environments, the frontend can be bundled into static files and served directly by the Express backend.

### Step 1: Build the Bundles
Run the build script at the root directory:
```bash
npm run build
```
This bundles the React frontend into static HTML, CSS, and JS files, writing them to `Frontend/dist`.

### Step 2: Run the Production Web App
Run from the root directory:
```bash
npm run start
```
The Express server starts up on port `3000` (or your configured `PORT`) and:
1.  Directly serves the frontend build directory:
    ```typescript
    app.use(express.static(path.join(__dirname, '../../Frontend/dist')));
    ```
2.  Acts as the API endpoint provider.
3.  Acts as a Single Page Application Router, catching all unmatched URLs and routing them back to the frontend build index:
    ```typescript
    app.get('*', (req: Request, res: Response): void => {
        res.sendFile(path.join(__dirname, '../../Frontend/dist/index.html'));
    });
    ```
    *   **Live Web Portal**: Accessible at [http://localhost:3000](http://localhost:3000) hosting both the UI and the API.
