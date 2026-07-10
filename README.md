<<<<<<< HEAD
# PillSync: Intelligent Medicine Reminder and Medication Tracking Platform

PillSync is a full-stack medication management and compliance tracking web application. It is designed to assist patients in organizing their daily medicine schedules, logging their adherence (taken/missed doses), and enabling caregivers to monitor compliance, stock levels, and refill predictions.

This codebase contains the complete implementation of **Milestone 1: Requirements, Database Design & Core Setup**.

---

## 🌟 Milestone 1 Accomplishments

Milestone 1 sets up the architectural foundation, database backend, authentication security layers, and user profiles needed to power the entire system.

1. **Backend Foundation**: Created a FastAPI Python server structured with clear separation of concerns (configuration, routers, database engines, schemas, models, and security utilities).
2. **Database Architecture**: Implemented a relational database schema using SQLAlchemy to handle users, profiles, caregiver-patient pairings, and setup placeholders for medication tracking, logging, and reference lookups.
3. **Secure Authentication & RBAC**: Developed JWT (JSON Web Token) authentication with secure password hashing (`bcrypt`). Implemented Role-Based Access Control supporting **Patient** and **Caregiver** roles.
4. **Password Change Security**: Added endpoints and forms to allow users to securely update their passwords by verifying current credentials.
5. **Interactive Connection Portal**: Built api endpoints and responsive UI views to establish secure links between Patients and Caregivers (sending, listing, accepting, and rejecting connection invitations).
6. **Main Interactive Dashboard**: Developed a customized, responsive Dashboard page (`/dashboard`) summarizing user stats, connection statuses, and placeholders for medicine logs.
7. **Modern Frontend Setup**: Created a responsive React + TypeScript workspace using Vite and Tailwind CSS.
8. **Verification & Tests**: Wrote and passed complete integration test cases using `pytest` and `httpx` to verify authentication rules, relationship mapping, and password updates.

---

## 🛠️ Technology Stack

PillSync utilizes a modern, performance-oriented full-stack architecture:

### ⚙️ Backend (Python/FastAPI)
* **FastAPI**: Core API web framework. Fast, modern, and auto-generates interactive Swagger API docs.
* **SQLAlchemy**: Object-Relational Mapper (ORM) to write clean Python models compiled to SQL query operations.
* **SQLite**: Lightweight, zero-configuration local database engine used for development (PostgreSQL-ready).
* **Pydantic**: Data validation and response serialization.
* **PyJWT**: Sign and decode JSON Web Tokens securely.
* **Passlib (bcrypt)**: Industry-standard secure password hashing.
* **Pytest**: Integration and unit testing.

### 💻 Frontend (React/TypeScript)
* **Vite**: Rapid, modern frontend building and dev server tool.
* **React**: Core user interface library.
* **TypeScript**: Static typing for error reduction, autocomplete, and maintenance safety.
* **Tailwind CSS**: Utility-first CSS styling used to build a custom, glassmorphic medical-theme dashboard layout.
* **Axios**: HTTP client configured with request interceptors to automatically attach JWT authorization headers.
* **Lucide React**: Clean, modern iconography.

---

## 📂 Project Directory Structure

```text
Intelligent-Medicine-Reminder-and-Medication-Tracking-Platform/
├── backend/
│   ├── app/
│   │   ├── routes/
│   │   │   ├── auth.py          # Registration & login routers
│   │   │   └── users.py         # Profile & caregiver association routers
│   │   ├── auth.py              # JWT tokens & bcrypt helper functions
│   │   ├── config.py            # Environment settings
│   │   ├── database.py          # Session and engine config
│   │   ├── main.py              # FastAPI startup & registration
│   │   ├── models.py            # Database tables schema definition
│   │   └── schemas.py           # Pydantic validation schemas
│   ├── tests/
│   │   ├── conftest.py          # Pytest database & client overrides
│   │   ├── test_auth.py         # Reg/login integration tests
│   │   └── test_users.py        # Profile/connections integration tests
│   ├── requirements.txt         # Backend Python packages
│   └── pillsync.db              # SQLite development database file
└── frontend/
    ├── src/
    │   ├── components/
    │   │   └── Navbar.tsx       # Main header navigation bar
    │   ├── pages/
    │   │   ├── Login.tsx        # Sign-in portal page
    │   │   ├── Register.tsx     # Sign-up page (roles selection)
    │   │   └── Profile.tsx      # Profile details & caregiver pairing page
    │   ├── services/
    │   │   ├── api.ts           # Axios client configuration
    │   │   ├── auth.ts          # Auth service functions
    │   │   └── users.ts         # Profile service functions
    │   ├── types/
    │   │   └── index.ts         # TypeScript interface definitions
    │   ├── App.tsx              # Routing logic & private route protection
    │   ├── index.css            # Tailwind CSS directives & global style tokens
    │   ├── main.tsx             # Entrypoint mounting React app
    │   └── vite-env.d.ts        # Vite type definitions helper
    ├── package.json             # Frontend dependency packages
    ├── vite.config.ts           # Vite compile configurations
    ├── postcss.config.js        # PostCSS configuration
    ├── tailwind.config.js       # Custom colors & styling settings
    └── index.html               # Main root HTML file
```

---

## 🗄️ Database Schema Design

The application operates around the following relational database tables (designed in SQLAlchemy and instantiated in SQLite):

### 1. `users`
Represents registered users in the platform.
* `id` (INTEGER, Primary Key): Unique user ID.
* `name` (VARCHAR): User's full name.
* `email` (VARCHAR, Unique, Indexed): User's registration email.
* `password_hash` (VARCHAR): Securely hashed password string.
* `role` (VARCHAR): Assigned system permission role (`patient`, `caregiver`, or `admin`).
* `created_at` (DATETIME): Timestamp of account creation.

### 2. `patient_caregivers`
Stores link relationships and permissions between patients and caregivers.
* `id` (INTEGER, Primary Key): Association identifier.
* `patient_id` (INTEGER, Foreign Key -> `users.id`): ID of the patient.
* `caregiver_id` (INTEGER, Foreign Key -> `users.id`): ID of the caregiver.
* `status` (VARCHAR): Status of the invitation (`pending`, `active`, or `rejected`).
* `created_at` (DATETIME): Request timestamp.

### 3. `medicines` *(Placeholder schema ready for Milestone 2)*
Stores medication details added by the patient.
* `id` (INTEGER, Primary Key)
* `user_id` (INTEGER, Foreign Key -> `users.id`)
* `name` (VARCHAR)
* `dosage` (VARCHAR)
* `quantity` (INTEGER)
* `times_per_day` (INTEGER)
* `start_date` (DATETIME)
* `duration_days` (INTEGER)
* `source` (VARCHAR)

### 4. `reminders` *(Placeholder schema ready for Milestone 2)*
Stores scheduled times for patient medication intakes.
* `id` (INTEGER, Primary Key)
* `medicine_id` (INTEGER, Foreign Key -> `medicines.id`)
* `dose_time` (VARCHAR)
* `reminder_date` (DATETIME)
* `status` (VARCHAR)

### 5. `medication_logs` *(Placeholder schema ready for Milestone 2)*
Logs history of taken or missed doses.
* `id` (INTEGER, Primary Key)
* `reminder_id` (INTEGER, Foreign Key -> `reminders.id`)
* `user_id` (INTEGER, Foreign Key -> `users.id`)
* `status` (VARCHAR)
* `logged_at` (DATETIME)

### 6. `drug_references` *(Placeholder schema ready for Milestone 2)*
Contains verified medical drug categories used to suggest safe suggestions.
* `id` (INTEGER, Primary Key)
* `condition` (VARCHAR, Indexed)
* `age_min` (INTEGER)
* `age_max` (INTEGER)
* `medicine_category` (VARCHAR)
* `notes` (TEXT)

---

## 🔄 Core Workflows & Logic (How it Works)

### 🔑 Authentication Flow
1. **User Sign Up**: The user completes the registration form and designates their role as a **Patient** or a **Caregiver**. The password is encrypted using `bcrypt` and saved to the database.
2. **User Log In**: The user enters their email and password. The API verifies the credentials and returns a signed **JWT (JSON Web Token)** that contains their email and role scope.
3. **State Persistence**: The React frontend receives the JWT and stores user parameters inside `localStorage`.
4. **Route Guarding**: Private route elements query `authService` on load. Non-logged-in users attempting to access `/profile` are automatically redirected to `/login`.
5. **API Calls Validation**: The Axios client intercepts outgoing requests and inserts the token as a header: `Authorization: Bearer <token>`. The FastAPI backend parses the token, extracts the email, fetches the active database session user, and validates they possess the appropriate permissions (Role-Based Access Control).

### 🤝 Caregiver-Patient Linkage Flow
The linkage mechanism is bi-directional to allow flexible coordination:
* **Patient-Initiated**:
  1. A Patient goes to their profile page, types a Caregiver's registered email, and clicks **Invite**.
  2. The system queries the database to verify the caregiver account exists, creates a link entry in `patient_caregivers` with a status of `pending`, and returns the entry.
  3. When the Caregiver logs in, they see a pending invitation in their connection list.
  4. The Caregiver clicks **Accept** (triggering a `PUT` request to update status to `active`) or **Reject** (status updates to `rejected`).
* **Caregiver-Initiated**:
  1. A Caregiver goes to their profile, inputs a Patient's email, and clicks **Invite**.
  2. The system checks if the patient exists and sets status to `pending`.
  3. The Patient logs in, reviews the request, and responds.
* **Monitored access**: Once the status is marked `active`, the caregiver is granted permission to inspect that specific patient's compliance data.

---

