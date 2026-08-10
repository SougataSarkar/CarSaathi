# CarSaathi: Used Car Portal & AI Recommendation Engine

CarSaathi is a full-stack, enterprise-grade web application designed to simplify the process of searching, listing, pricing, and booking preowned vehicles. It is built as a TypeScript monorepo combining a responsive **React (Vite)** frontend and a robust **Express.js** backend. 

The system implements advanced engineering concepts suitable for academic evaluation, including **Elasticsearch** (for fuzzy multi-match searching), **Redis** (for session rate-limiting and query caching), **PostgreSQL** (with full-text search fallback), and **Google Gemini API** (for context-aware natural language vehicle recommendations).

---

## 🛠️ Project Technical Stack

| Tier | Technology | Key Features / Purpose |
| :--- | :--- | :--- |
| **Frontend** | **React.js (Vite)** | TypeScript, SPA layout, responsive design system, state maps, dynamic calculations, modular modals. |
| **Backend** | **Express.js (Node.js)** | REST APIs, TypeScript, secure authentication, JWT tokens, rate limiting. |
| **Database** | **PostgreSQL** | Primary relational store. Utilizes generated `tsvector` columns and GIN indices for high-performance Full-Text Search. |
| **Caching** | **Redis** | Query caching (with active invalidation), Redis-backed route limiting for secure authentication. |
| **Fuzzy Search**| **Elasticsearch** | Text multi-match engine with fuzziness auto-tuning for error-tolerant searches. |
| **Generative AI**| **Gemini API** | Recommendation Engine (`gemini-3.1-flash-lite`) processing structured user inputs and returning strict JSON recommendations. |

---

## 📂 Project Structure

The project is structured as an npm workspaces monorepo:
```
CarSaathi/
├── package.json                    # Root package.json managing workspaces
├── tsconfig.json                   # Root TypeScript compiler settings
├── tests/                          # Root integration and unit test suite config
├── src/                            # Core shared utils (e.g. currency formatting)
│   ├── currency.ts
│   └── currency.test.ts
├── price-parser/                   # Express Backend Service
│   ├── src/
│   │   ├── server.ts               # Core routing, rate limiters, auth & CRUD endpoints
│   │   ├── db.ts                   # PostgreSQL client, schema migration, seed engine
│   │   ├── redisClient.ts          # Redis connector & Map-based resilient fallback client
│   │   ├── elasticsearch.ts        # Elasticsearch operations, bulk sync & fuzzy query resolver
│   │   ├── gemini.ts               # Gemini API prompt architect & mock scoring fallback engine
│   │   └── parser.ts               # Indian price text segment parser (Lakh/Crore parsing)
│   ├── package.json
│   └── README.md                   # Backend service documentation
└── used-car-listings/              # React SPA Frontend
    ├── src/
    │   ├── App.tsx                 # Core single page app, layout tabs, dashboards & modals
    │   ├── App.css                 # Custom premium CSS theme & styling system
    │   ├── main.tsx
    │   └── currency.ts             # Client-side currency localization
    ├── package.json
    └── README.md                   # Frontend service documentation
```

---

## 📖 University Documentation Chapters

For a clean presentation before your examiner, the project documentation has been broken down into structured, high-quality markdown files under the `docs/` folder:

*   📑 **[01. Project Synopsis](file:///c:/Users/SOUGATA/Desktop/CarSaathi/docs/01_SYNOPSIS.md)**
    *   *Executive Summary, problem statement, key objectives, project scope, and functional modules.*
*   📑 **[02. Architecture & Design](file:///c:/Users/SOUGATA/Desktop/CarSaathi/docs/02_ARCHITECTURE_AND_DESIGN.md)**
    *   *System architecture, three-tier model, cache invalidation protocols, search failover strategy, and sequence workflows (with Mermaid diagrams).*
*   📑 **[03. Database Schema Guide](file:///c:/Users/SOUGATA/Desktop/CarSaathi/docs/03_DATABASE_SCHEMA.md)**
    *   *Database design, Entity-Relationship Diagram (ERD), table structure, types, relationships, constraints, and Full-Text Search indexing setup.*
*   📑 **[04. REST API Specification](file:///c:/Users/SOUGATA/Desktop/CarSaathi/docs/04_API_REFERENCE.md)**
    *   *Complete endpoint registry, HTTP methods, request parameters, response JSON contracts, security rules, rate limit parameters, and code examples.*
*   📑 **[05. Installation & Setup Guide](file:///c:/Users/SOUGATA/Desktop/CarSaathi/docs/05_INSTALLATION_AND_SETUP.md)**
    *   *Dependencies, environment variables checklist, PostgreSQL setup, Redis / Elasticsearch startup, seeding, and execution commands.*

---

## 🚀 Quick Start (Development Mode)

1.  **Clone the Repository** and check out your workspace.
2.  **Verify Pre-requisites**: Make sure you have Node.js (v18+), PostgreSQL, Redis, and Elasticsearch installed and running on your system.
3.  **Configure Environment Variables**:
    *   Set up the `.env` file in the `price-parser` folder (reference `docs/05_INSTALLATION_AND_SETUP.md` for options).
4.  **Install Monorepo Dependencies**:
    Run at the root of the workspace:
    ```bash
    npm install
    ```
5.  **Launch the Unified Dev Servers**:
    Start both the frontend and backend services concurrently with:
    ```bash
    npm run dev
    ```
    *   **Frontend Access**: [http://localhost:5173](http://localhost:5173)
    *   **Backend Server**: [http://localhost:3000](http://localhost:3000)
