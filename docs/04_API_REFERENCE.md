# Project Chapter 4: REST API Reference

The CarSaathi API is hosted at `http://localhost:3000/`. It uses standard HTTP response codes and JWT token authentication.

---

## 1. Global API Parameters

### 1.1. Headers
For protected endpoints, clients must include the JSON Web Token in the request header:
```http
Authorization: Bearer <your_jwt_token>
Content-Type: application/json
```

### 1.2. Rate Limiting
To prevent brute-force attacks and abuse, the server applies rate limits that are environment-sensitive to enable stress-free local development and testing:
1.  **Global Limiter**:
    *   **Development**: 5,000 requests per 15 minutes per IP (all endpoints).
    *   **Production**: 100 requests per 15 minutes per IP.
2.  **Strict Auth Limiter** (for `/auth/login` and `/auth/register`):
    *   **Development**: 1,000 requests per 15 minutes per IP.
    *   **Production**: 15 requests per 15 minutes per IP.
3.  **Redis-Backed Endpoint Limiter**: Custom rate limiting (e.g. 5 requests per 60 seconds) stored in Redis:
    ```json
    { "error": "Too many requests on this endpoint. Please try again after a minute." }
    ```

---

## 2. Authentication Endpoints

### 2.1. User Registration
Creates a new account with role privileges (`Customer`, `Dealer`, or `Admin`).

*   **URL**: `/auth/register`
*   **Method**: `POST`
*   **Request Body**:
    ```json
    {
      "name": "Amit Sharma",
      "email": "amit@example.com",
      "phone": "9876543210",
      "password": "securepassword123",
      "role": "Dealer"
    }
    ```
*   **Success Response (201 Created)**:
    ```json
    {
      "message": "User registered successfully",
      "token": "eyJhbGciOiJIUzI1NiIsIn...",
      "user": {
        "id": 1,
        "name": "Amit Sharma",
        "email": "amit@example.com",
        "phone": "9876543210",
        "role": "Dealer"
      }
    }
    ```

### 2.2. User Login
Logs a user in using their email or phone number.

*   **URL**: `/auth/login`
*   **Method**: `POST`
*   **Request Body**:
    ```json
    {
      "identifier": "amit@example.com",
      "password": "securepassword123"
    }
    ```
*   **Success Response (200 OK)**:
    ```json
    {
      "message": "Login successful",
      "token": "eyJhbGciOiJIUzI1NiIsIn...",
      "user": {
        "id": 1,
        "name": "Amit Sharma",
        "email": "amit@example.com",
        "phone": "9876543210",
        "role": "Dealer"
      }
    }
    ```

### 2.3. Send Simulated OTP
Generates a 6-digit verification code, caching it in Redis for 5 minutes.

*   **URL**: `/auth/otp/send`
*   **Method**: `POST`
*   **Request Body**:
    ```json
    { "phone": "9876543210" }
    ```
*   **Success Response (200 OK)**:
    ```json
    {
      "message": "OTP sent successfully (simulated)",
      "otp": "482015"
    }
    ```

### 2.4. Verify OTP
Verifies the OTP sent to the user's phone.

*   **URL**: `/auth/otp/verify`
*   **Method**: `POST`
*   **Request Body**:
    ```json
    {
      "phone": "9876543210",
      "otp": "482015"
    }
    ```
*   **Success Response (200 OK)**:
    ```json
    { "message": "OTP verified successfully." }
    ```

---

## 3. Cars Management Endpoints

### 3.1. List Cars
Returns a list of cars matching the provided search keywords and filter criteria.

*   **URL**: `/cars`
*   **Method**: `GET`
*   **Query Parameters** (All optional):
    *   `search` (string): Text search term matched against make, model, city.
    *   `city` (string): Filter by city name (e.g. `'Delhi'`).
    *   `minPrice` (number): Filter by minimum price (in INR).
    *   `maxPrice` (number): Filter by maximum price (in INR).
    *   `makes` (string): Comma-separated list of brand makes (e.g., `'Tata,Hyundai'`).
    *   `luxe` (boolean): If `true`, returns premium cars (BMW, Audi, Mercedes-Benz).
    *   `sortBy` (string): Sorting order (`'price_asc'`, `'price_desc'`, `'year_desc'`, `'make_asc'`).
*   **Success Response (200 OK)**:
    ```json
    [
      {
        "id": "c1a0298a-21cb-42a9-83c3-6316fa7b12d5",
        "make": "Hyundai",
        "model": "Creta",
        "year": 2020,
        "price": 1050000,
        "city": "Bangalore",
        "image_url": "https://images.unsplash.com/photo-1605558202076-76ad227d99d2",
        "created_by": 1,
        "created_at": "2026-07-15T09:00:00.000Z"
      }
    ]
    ```

### 3.2. Get Single Car Details
*   **URL**: `/cars/:id`
*   **Method**: `GET`
*   **Success Response (200 OK)**:
    ```json
    {
      "id": "c1a0298a-21cb-42a9-83c3-6316fa7b12d5",
      "make": "Hyundai",
      "model": "Creta",
      "year": 2020,
      "price": 1050000,
      "city": "Bangalore",
      "image_url": "https://images.unsplash.com/photo-1605558202076-76ad227d99d2",
      "created_by": 1,
      "created_at": "2026-07-15T09:00:00.000Z"
    }
    ```

### 3.3. Create Car Listing (Dealers & Admins Only)
Creates a new listing. Requires authentication.

*   **URL**: `/cars`
*   **Method**: `POST`
*   **Headers**: `Authorization: Bearer <token>`
*   **Request Body**:
    ```json
    {
      "make": "Skoda",
      "model": "Kushaq",
      "year": 2022,
      "price": 1800000,
      "city": "Gurgaon",
      "imageUrl": "https://images.unsplash.com/...jpg"
    }
    ```
*   **Success Response (201 Created)**:
    ```json
    {
      "message": "Car listed for sale successfully!",
      "car": {
        "id": "fa2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d",
        "make": "Skoda",
        "model": "Kushaq",
        "year": 2022,
        "price": 1800000,
        "city": "Gurgaon",
        "image_url": "https://images.unsplash.com/...jpg",
        "created_by": 1,
        "created_at": "2026-07-15T09:12:00.000Z"
      }
    }
    ```

### 3.4. Delete Car Listing (Owner Dealer or Admin Only)
Removes a listing. Requires authentication.

*   **URL**: `/cars/:id`
*   **Method**: `DELETE`
*   **Headers**: `Authorization: Bearer <token>`
*   **Success Response (200 OK)**:
    ```json
    { "message": "Car listing deleted successfully." }
    ```

---

## 4. AI Recommendation & Parser Endpoints

### 4.1. AI Recommendations API
Leverages Google Gemini (`gemini-3.1-flash-lite`) to map user specifications to database records.

*   **URL**: `/cars/recommend`
*   **Method**: `POST`
*   **Request Body**:
    ```json
    {
      "prompt": "I need a spacious car for highway road trips",
      "budget": 2000000,
      "purpose": "adventure",
      "fuelType": "Diesel",
      "bodyType": "SUV",
      "priority": "safety"
    }
    ```
*   **Success Response (200 OK)**:
    ```json
    {
      "recommendations": [
        {
          "carId": "50c822e1-4c12-4091-8b2c-293e48ba26a1",
          "matchScore": 95,
          "reason": "Tata Harrier offers robust build quality, excellent highway stability, and solid safety ratings. It falls within your budget."
        }
      ],
      "verdict": "Based on your request, we recommend looking at the Tata Harrier. These vehicles offer the best structural stability...",
      "isMock": false
    }
    ```

### 4.2. Price Parsing API
Parses standard Indian price text into numbers or ranges.

*   **URL**: `/parse?q=<price_phrase>`
*   **Method**: `GET`
*   **Example Requests**:
    *   `/parse?q=5 lakh` &rarr; `{"value": 500000}`
    *   `/parse?q=1.2 to 1.5 Crore` &rarr; `{"min": 12000000, "max": 15000000}`
*   **Success Response (200 OK)**:
    ```json
    {
      "min": 12000000,
      "max": 15000000
    }
    ```

---

## 5. Booking & Financial Endpoints

### 5.1. Book Test Drive
Saves a test-drive appointment lead.

*   **URL**: `/cars/:id/book`
*   **Method**: `POST`
*   **Request Body**:
    ```json
    {
      "name": "Vikram Sen",
      "phone": "9988776655",
      "date": "2026-07-20",
      "time": "11:00 AM - 12:00 PM"
    }
    ```
*   **Success Response (201 Created)**:
    ```json
    {
      "message": "Test drive booked successfully!",
      "booking": {
        "id": 1,
        "car_id": "c1a0298a-21cb-42a9-83c3-6316fa7b12d5",
        "name": "Vikram Sen",
        "phone": "9988776655",
        "booking_date": "2026-07-20T00:00:00.000Z",
        "booking_time": "11:00 AM - 12:00 PM",
        "created_at": "2026-07-15T09:18:27.000Z"
      }
    }
    ```

### 5.2. Apply for Loan
Submits financial indicators for loan approval.

*   **URL**: `/loan-applications`
*   **Method**: `POST`
*   **Request Body**:
    ```json
    {
      "name": "Rajesh Roy",
      "phone": "9898989898",
      "income": 120000,
      "employment": "Salaried",
      "creditScore": "750+",
      "loanAmount": 800000,
      "tenure": 5
    }
    ```
*   **Success Response (201 Created)**:
    ```json
    {
      "message": "Loan application processed successfully!",
      "application": {
        "id": 1,
        "name": "Rajesh Roy",
        "phone": "9898989898",
        "income": 120000,
        "employment": "Salaried",
        "credit_score": "750+",
        "loan_amount": 800000,
        "tenure_years": 5,
        "status": "Approved",
        "created_at": "2026-07-15T09:18:27.000Z"
      }
    }
    ```

---

## 6. Admin Control Panel

### 6.1. Get Admin Leads Dashboard
Aggregates all leads generated by customer actions. Restricted to Admin.

*   **URL**: `/admin/leads`
*   **Method**: `GET`
*   **Headers**: `Authorization: Bearer <admin_token>`
*   **Success Response (200 OK)**:
    ```json
    {
      "bookings": [
        { "id": 1, "car_id": "...", "name": "Vikram Sen", "phone": "9988776655", "booking_date": "...", "booking_time": "...", "make": "Hyundai", "model": "Creta" }
      ],
      "services": [],
      "loans": [
        { "id": 1, "name": "Rajesh Roy", "phone": "9898989898", "income": 120000, "employment": "Salaried", "credit_score": "...", "loan_amount": 800000, "tenure_years": 5, "status": "Approved" }
      ],
      "newCarLeads": []
    }
    ```
