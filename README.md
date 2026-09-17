# HassleFreeDrive Admin Panel

A full-stack admin dashboard for managing the HassleFreeDrive platform — drivers, customers, bookings, analytics, and real-time updates powered by Firestore.

---

## ✨ Features

- 🔐 **Secure Login** — Firebase Authentication (admin-only access)
- 👨‍✈️ **Driver Management** — View all drivers, inspect submitted verification documents (Aadhaar, PAN, DL), and toggle active status
- 👤 **Customer Management** — Browse all registered customer accounts with search and filtering
- 🚗 **Ride Management** — Track all bookings with status badges, driver name & phone, passenger info, pickup/drop locations
- 📊 **Analytics & Reports** — Monthly revenue bar chart powered by live Firestore data
- 🔴 **Real-time Dashboard** — Stats cards (drivers, verified drivers, total rides) and the user table update live via Firestore `onSnapshot` — no page reload needed
- ⚙️ **Settings** — Admin profile management

---

## 🧱 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Vite 8, Chart.js |
| Backend | Node.js, Express, TypeScript, tsx (hot reload) |
| Auth & DB | Firebase Auth + Firestore (Admin SDK on backend, client SDK for real-time on frontend) |
| Styling | Vanilla CSS (custom design system, no Tailwind) |
| Deployment | Vercel (frontend) + Render (backend) |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- A Firebase project with Firestore and Authentication enabled
- `serviceAccountKey.json` downloaded from Firebase Console → Project Settings → Service Accounts

### 1. Clone & install
```bash
git clone https://github.com/bhavya-darjii/Hasslefreedrive-Admin.git
cd Hasslefreedrive-Admin
npm install
```

### 2. Set up environment variables
Create a `.env` file at the project root with your credentials. See [Environment Variables](#-environment-variables) below for the full list.

### 3. Add Firebase service account
Place your `serviceAccountKey.json` inside the `backend/` folder.

### 4. Run the dev server
```bash
npm run dev
```

Starts both:
- **Frontend** → http://localhost:5173
- **Backend API** → http://localhost:5000

---

## 📁 Project Structure

```
hasslefreedrive-admin/
├── backend/                  # Express API (Node + TypeScript)
│   └── src/
│       ├── config/           # Firebase Admin SDK setup
│       ├── controllers/      # Route handlers (users, drivers, bookings, reports)
│       ├── middleware/        # Auth verification & error handling
│       ├── routes/           # API route definitions
│       ├── utils/            # Shared helpers
│       └── server.ts         # Entry point
├── src/                      # React frontend
│   ├── components/           # Layout (Header, Sidebar)
│   ├── context/              # Auth context (Firebase)
│   ├── pages/                # Dashboard, Drivers, Customers, Rides, Reports, Settings
│   ├── services/             # API client (axios) & Firebase config (auth + Firestore)
│   └── types/                # Shared TypeScript interfaces
├── public/                   # Static assets
├── index.html                # App entry point
├── vite.config.ts            # Vite config
└── package.json              # Unified scripts & dependencies
```

---

## 🔑 Environment Variables

Create a `.env` file at the project root:

```env
# ── Frontend (exposed to browser, prefix with VITE_) ──────────────────────────
VITE_API_BASE_URL=http://localhost:5000/api
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# ── Backend (server-side only) ─────────────────────────────────────────────────
PORT=5000
FRONTEND_URL=http://localhost:5173
FIREBASE_PROJECT_ID=your_project_id
```

### Production (Render backend)
Instead of a key file, set:
```
GOOGLE_APPLICATION_CREDENTIALS_JSON=<paste entire serviceAccountKey.json contents as a string>
```

---

## 📦 Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start frontend + backend concurrently with hot reload |
| `npm run build` | Build frontend for production |
| `npm run seed:admin` | Create the initial admin user in Firestore |
| `npm run schema:fetch` | Fetch and print the current Firestore schema |

---

## 🔒 Security Notes

- All API routes are protected by Firebase ID token verification (middleware)
- Service account key and all `.env` files are gitignored — never commit secrets
- Frontend only uses Firebase Auth and Firestore client SDK (read-only real-time listeners for the dashboard)

---

## 📄 License

This project is private and proprietary.

---

<p align="center">Made with ❤️ by <a href="https://bhavya-darji.vercel.app/" target="_blank"><strong>Bhavya Darji</strong></a></p>
