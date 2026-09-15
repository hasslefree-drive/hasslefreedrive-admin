# HassleFreeDrive Admin Panel

A full-stack admin dashboard for managing the HassleFreeDrive platform — drivers, customers, bookings, analytics, and more.

---

## ✨ Features

- 🔐 **Secure Login** — Firebase Authentication (admin-only access)
- 👨‍✈️ **Driver Management** — View, verify, and toggle driver accounts with full profile details
- 👤 **Customer Management** — Browse all registered customer accounts
- 🚗 **Ride Management** — Track all bookings with status, location, and driver info
- 📊 **Analytics & Reports** — Monthly revenue charts and per-driver trip counts
- ⚙️ **Settings** — Admin profile management

---

## 🧱 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Vite, Chart.js |
| Backend | Node.js, Express, TypeScript, tsx |
| Auth & DB | Firebase Auth + Firestore |
| Styling | Vanilla CSS (custom design system) |
| Deployment | Vercel (frontend) + Render (backend) |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Firebase project with Firestore enabled
- `serviceAccountKey.json` downloaded from Firebase Console

### 1. Clone the repo
```bash
git clone https://github.com/bhavya-darjii/Hasslefreedrive-Admin.git
cd Hasslefreedrive-Admin
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up environment variables
Create a `.env` file at the root with your Firebase credentials (see `.env.example` for reference).

### 4. Add Firebase service account
Place your `serviceAccountKey.json` inside the `backend/` folder.

### 5. Run the dev server
```bash
npm run dev
```

Runs both frontend (http://localhost:5173) and backend (http://localhost:5000) concurrently.

---

## 📁 Project Structure

```
hasslefreedrive-admin/
├── backend/              # Express API
│   └── src/
│       ├── config/       # Firebase Admin setup
│       ├── controllers/  # Route handlers
│       ├── middleware/   # Auth & error handling
│       ├── routes/       # API routes
│       └── server.ts     # Entry point
├── src/                  # React frontend
│   ├── components/       # Layout (Header, Sidebar)
│   ├── context/          # Auth context
│   ├── pages/            # Dashboard, Drivers, Customers, Rides, Reports, Settings
│   ├── services/         # API calls & Firebase config
│   └── types/            # TypeScript types
├── public/               # Static assets
├── index.html            # App entry point
├── vite.config.ts        # Vite configuration
└── package.json          # Unified scripts & dependencies
```

---

## 🔑 Environment Variables

### Local (`.env` at root)
```env
# Frontend
VITE_API_BASE_URL=http://localhost:5000/api
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Backend
PORT=5000
FRONTEND_URL=http://localhost:5173
FIREBASE_PROJECT_ID=your_project_id
```

### Production (Render backend)
Add `GOOGLE_APPLICATION_CREDENTIALS_JSON` with the entire contents of your `serviceAccountKey.json` pasted as a string.

---

## 📦 Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start frontend + backend concurrently |
| `npm run build` | Build frontend for production |
| `npm run seed:admin` | Create initial admin user in Firestore |
| `npm run schema:fetch` | Fetch and print Firestore schema |

---

## 📄 License

This project is private and proprietary.

---

<p align="center">Made with ❤️ by <a href="https://bhavya-darji.vercel.app/" target="_blank"><strong>Bhavya Darji</strong></a></p>
