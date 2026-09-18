# HassleFreeDrive Admin Panel

<div align="center">

**Enterprise Management Console & Real-Time Telemetry Dashboard for HassleFreeDrive**

[![Private & Proprietary](https://img.shields.io/badge/Status-Private%20%26%20Proprietary-red?style=for-the-badge)](LICENSE)
[![React](https://img.shields.io/badge/React-19.0-61dafb?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Express](https://img.shields.io/badge/Express-Backend-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com)
[![Firebase](https://img.shields.io/badge/Firebase-Admin%20%26%20Firestore-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com)

</div>

---

## Overview

The **HassleFreeDrive Admin Panel** is a centralized administrative command center engineered to oversee and manage the entire HassleFreeDrive mobility platform. It provides operations teams with live visibility and administrative controls over driver onboarding, KYC document verification, customer accounts, ride lifecycles, and platform analytics.

Built with a modern full-stack architecture combining a React frontend and an Express TypeScript backend, the platform leverages Cloud Firestore real-time snapshots to deliver instantaneous operational updates without requiring manual browser refreshes.

---

## Features

- **Secure Authentication**: Protected administrative entry using Firebase Authentication with token validation.
- **Driver Verification & KYC**: Comprehensive driver inspection interface to examine submitted identity documents (Aadhaar, PAN, Driving License) and toggle active/verified status.
- **Customer Directory**: Searchable and filterable registry of registered customer accounts with detailed trip telemetry.
- **Ride Lifecycle Monitoring**: Real-time tracking of active, completed, and canceled bookings with driver assignment details and route coordinates.
- **Telemetry & Revenue Analytics**: Dynamic monthly financial reporting and operational metrics powered by Chart.js.
- **Live Reactive Dashboard**: Metric summaries (total drivers, active rides, completed trips) powered by Firestore real-time listeners.
- **Administrative Settings**: Profile, role controls, and secure system configuration management.

---

## Tech Stack

| Layer | Technologies |
|---|---|
| Frontend | React 19, TypeScript, Vite 8, Chart.js, React-Chartjs-2 |
| Backend | Node.js, Express, TypeScript, tsx runtime |
| Database & Auth | Firebase Authentication, Cloud Firestore (Client SDK & Firebase Admin SDK) |
| Styling | Vanilla CSS Design System (clean dark-mode aesthetics) |
| Hosting & Deployment | Vercel (Frontend Client) & Render (Backend API) |

---

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm or yarn package manager
- Google Firebase project with Authentication and Firestore enabled
- Firebase Admin SDK credentials (`serviceAccountKey.json`)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/bhavya-darjii/Hasslefreedrive-Admin.git
   cd Hasslefreedrive-Admin
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Firebase Service Account:**
   Place your downloaded `serviceAccountKey.json` from the Firebase Console inside the `backend/` directory.

### Environment Variables

Create a `.env` file in the root directory:

```env
# Frontend Configuration (Vite)
VITE_API_BASE_URL=http://localhost:5000/api
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Backend Configuration
PORT=5000
FRONTEND_URL=http://localhost:5173
FIREBASE_PROJECT_ID=your_project_id
```

### Running the Application

```bash
# Start both frontend and backend concurrently in development mode
npm run dev
```

- Frontend client runs at `http://localhost:5173`
- Backend API server runs at `http://localhost:5000`

---

## Project Structure

```
hasslefreedrive-admin/
├── backend/                  # Express API (Node.js + TypeScript)
│   └── src/
│       ├── config/           # Firebase Admin SDK initialization
│       ├── controllers/      # Route controllers (users, drivers, bookings, reports)
│       ├── middleware/       # ID token validation & security handlers
│       ├── routes/           # REST endpoint definitions
│       ├── utils/            # Helper utilities
│       └── server.ts         # Server entry point
├── src/                      # React Frontend Application
│   ├── components/           # Common components (Header, Sidebar)
│   ├── context/              # Firebase Auth Context Provider
│   ├── pages/                # Admin views (Dashboard, Drivers, Rides, Reports, Settings)
│   ├── services/             # API client & Firebase Client SDK initialization
│   └── types/                # TypeScript interfaces & data contracts
├── public/                   # Static public assets
├── index.html                # Single-page application entry point
├── vite.config.ts            # Vite build configuration
└── package.json              # Unified project scripts & dependencies
```

---

## Security Notes

- All administrative endpoints require valid Firebase ID tokens passed via authorization headers.
- Backend queries use privileged Firebase Admin SDK credentials strictly segregated from client bundles.
- Credentials, private keys, and environment files are gitignored and excluded from version control.

---

## License

**Copyright © 2026 Bhavya Darji. All Rights Reserved.**

This project and its underlying source code are **confidential, private, and proprietary**. Unauthorized copying, modification, distribution, public display, or commercial use of this software, via any medium, is strictly prohibited without explicit prior written authorization from the copyright holder.

---

## Author & Contact

**Bhavya Darji**  
- **Portfolio:** [bhavya-darji.vercel.app](https://bhavya-darji.vercel.app/)  
- **GitHub:** [@bhavya-darjii](https://github.com/bhavya-darjii)  
- **LinkedIn:** [Bhavya Darji](https://www.linkedin.com/in/bhavya-darji-181573242/)  
- **Email:** [bhavyadarji462@gmail.com](mailto:bhavyadarji462@gmail.com)

---

<p align="center">Made with ❤️ by <a href="https://bhavya-darji.vercel.app/" target="_blank" rel="noopener noreferrer"><strong>Bhavya Darji</strong></a></p>
