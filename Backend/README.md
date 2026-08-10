# Lakh/Crore Price Parser API

A standalone app, lightweight backend utility and API designed to parse standard Indian price phrases (e.g. "5 Lakh", "1.2 Cr", "₹8,50,000") into clean computer-readable numbers.

This utility is implemented using Node.js, Express, TypeScript, and Jest.

## Features

- **Standard Parsing**:
  - `5 lakh`, `5 lac`, `5L` &rarr; `500000`
  - `1.2 crore`, `1.2 cr` &rarr; `12000000`
  - `₹8,50,000`, `850000` &rarr; `850000`

- **Case-Insensitive**: Works with `5 LAKH`, `5l`, etc.

- **Robust Error Handling**: Clean error responses on null/blank/garbage inputs.

- **Range Parsing**: Supports values like `5 to 8 lakh`, `5L - 8L`, and inherits the multiplier from the end range boundary if missing in the start boundary.


## Getting Started

### 1. Installation
Change directory into this folder and install dependencies:
```bash
cd price-parser
npm install
```

### 2. Run the Server
To start the API in development mode (hot reloading via `ts-node`):
```bash
npm run dev
```
The server will boot up on port `3000`.

### 3. Run Tests
To execute the Jest unit tests:
```bash
npm test
```

---

## API Documentation

### Endpoints

#### `GET /parse`
Parses a query string `q` and returns the numeric values.

- **URL**: `/parse?q=<price_phrase>`
- **Method**: `GET`
- **Success Responses**:
  - For single prices (HTTP 200):
    ```json
    { "value": 500000 }
    ```
  - For price ranges (HTTP 200):
    ```json
    { "min": 500000, "max": 800000 }
    ```
- **Error Response** (HTTP 400):
  ```json
  { "error": "Unable to parse price segment: \"garbage\"" }
  ```

---

## Sample curl Commands

Ensure the server is running on `http://localhost:3000` first.

### 1. Parse Lakh representation
```bash
curl "http://localhost:3000/parse?q=5%20lakh"
```
**Response**:
```json
{"value":500000}
```

### 2. Parse Crore representation
```bash
curl "http://localhost:3000/parse?q=1.2%20cr"
```
**Response**:
```json
{"value":12000000}
```

### 3. Parse formatted numbers
```bash
curl "http://localhost:3000/parse?q=%E2%82%B98,50,000"
```
**Response**:
```json
{"value":850000}
```

### 4. Parse Range (Stretch Goal)
```bash
curl "http://localhost:3000/parse?q=5%20to%208%20lakh"
```
**Response**:
```json
{"min":500000,"max":800000}
```

### 5. Error handling for garbage input
```bash
curl "http://localhost:3000/parse?q=garbage"
```
**Response**:
```json
{"error":"Unable to parse price segment: \"garbage\""}
```
