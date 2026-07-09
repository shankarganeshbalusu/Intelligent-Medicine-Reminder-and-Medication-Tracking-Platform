# PillSync: Frontend & Backend Technical Architecture Report

This document provides a detailed breakdown of the frontend and backend components implemented for **Milestone 1** of the PillSync platform. Use this guide to explain the architecture, data models, security frameworks, and communication flows to project evaluators.

---

## 📂 1. Core Architecture Overview
PillSync uses a decoupled, full-stack client-server architecture:
1. **Frontend Client**: Built as a Single Page Application (SPA) using React, TypeScript, Vite, and Tailwind CSS.
2. **Backend Server**: Built as a RESTful API using FastAPI (Python) and SQLAlchemy.
3. **Database**: A local SQLite database (`pillsync.db`) managed via Object-Relational Mapping (ORM).

```mermaid
graph LR
    subgraph Frontend Client (React)
        UI[Tailwind CSS Views] --> Services[Axios API Client]
    end
    subgraph Backend Server (FastAPI)
        Router[API Routes] --> Auth[JWT & Bcrypt Security]
        Auth --> Models[SQLAlchemy Models]
    end
    Database[(SQLite - pillsync.db)] <--> Models
    Services <--> |HTTP / JSON + JWT Token| Router
```

---

## ⚙️ 2. The Backend (FastAPI + Python)
The backend is responsible for data persistence, security rules validation, and business logic execution.

### Key Technology Stack
* **FastAPI**: A high-performance web framework. It handles routing and generates interactive Swagger documentation automatically.
* **SQLAlchemy ORM**: Translates Python classes (models) into SQL tables and queries.
* **Pydantic**: Validates incoming request payloads and formats outgoing JSON response data.
* **Passlib (Bcrypt)**: Hashes and verifies passwords securely.
* **PyJWT**: Signs and decodes JSON Web Tokens (JWT) for authentication.

### Database Design & Schema
We implemented 6 database tables using SQLAlchemy:
1. **`users`**: Stores name, unique email, hashed password, and role (`patient`, `caregiver`, or `admin`).
2. **`patient_caregivers`**: Stores the links between patients and caregivers along with request statuses (`pending`, `active`, or `rejected`).
3. **`medicines`**: Stores medication lists, total quantities, and duration.
4. **`reminders`**: Stores scheduled intake times (e.g., 08:00, 20:00).
5. **`medication_logs`**: Logs compliance history (whether a dose was taken or missed).
6. **`drug_references`**: Stores condition-to-drug-category reference lookup data.

### API Endpoints
* **Authentication (`/api/auth`)**:
  * `POST /register`: Registers a new user, hashes the password, and checks for duplicates.
  * `POST /login`: Validates password hashes and returns a JWT access token.
* **User Profiles & Linking (`/api/users`)**:
  * `GET /me` & `PUT /me`: Retrieves and edits profile name/email.
  * `POST /link-caregiver`: Initiates a caregiver link request from a patient.
  * `POST /link-patient`: Initiates a patient link request from a caregiver.
  * `GET /associations`: Returns connection requests and status lists.
  * `PUT /associations/{id}`: Approves (`active`) or denies (`rejected`) link requests.

---

## 💻 3. The Frontend (React + Vite + TypeScript)
The frontend provides a responsive user interface designed with cool blue and purple medical-theme tokens.

### Key Technology Stack
* **React**: Manages reactive UI state and page component rendering.
* **TypeScript**: Enforces strict typing rules to avoid compile-time bugs.
* **Tailwind CSS**: A utility-first styling framework used to create layouts with subtle animations and glassmorphism.
* **Axios**: Handles HTTP communication with the backend.
* **React Router**: Manages page navigation and routes protection.

### Key Pages Implemented
1. **Login Page (`Login.tsx`)**: Collects credentials and stores the returned JWT token.
2. **Register Page (`Register.tsx`)**: Allows registration and handles role selection (Patient or Caregiver).
3. **Profile Dashboard (`Profile.tsx`)**: 
   * Displays account info and allows profile updates.
   * Manages connection requests. If a caregiver sees a pending patient request, they can accept it directly on this dashboard.

---

## 🔄 4. How They Work Together (Data Flow)

### Scenario A: User Log In
1. The user inputs their email and password on the React **Login page**.
2. React triggers an Axios request: `POST http://localhost:8000/api/auth/login`.
3. The **FastAPI backend** queries SQLite:
   * Looks up the user by email.
   * Verifies the password using `bcrypt.verify()`.
   * Generates a signed **JWT token** containing the user's ID, email, and role.
4. The backend sends the token back to the frontend.
5. The **React app** saves the token and user info inside `localStorage` and redirects the user to the profile dashboard.

### Scenario B: Patient-Caregiver Linking
1. A logged-in Patient enters a Caregiver's email in the connection panel and clicks **Invite**.
2. Axios sends a request with the JWT token attached to the authorization header: `Authorization: Bearer <token>`.
3. The **FastAPI Backend**:
   * Decodes the JWT to verify the patient's identity.
   * Checks the database to ensure the caregiver exists.
   * Inserts a record into the `patient_caregivers` table with status = `pending`.
4. When the Caregiver logs in, their frontend makes a `GET /api/users/associations` request.
5. The backend returns the list of links. The Caregiver sees the pending request and clicks **Accept**.
6. A `PUT` request updates the database link status to `active`, establishing the connection.
