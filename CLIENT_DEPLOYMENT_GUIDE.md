# Client Deployment & Multi-Account Setup Guide

This guide documents the complete process for deploying **HassleFreeDrive Admin** to a **client's Vercel & Render accounts** while keeping the source code safely under **your personal GitHub** (`bhavya-darjii`).

---

## 🔒 Why Logging Out of GitHub in Browser Doesn't Work

When you connect a GitHub account to Vercel or Render, they save an **OAuth Token** on their servers. Logging out of your browser:
1. **Does not disconnect it** — the server-to-server connection stays active.
2. **The client will still see your GitHub account (`bhavya-darjii`)** anytime they open their Vercel or Render dashboard. If they click "New Project", all your other private repos could be visible in the list.

---

## 🎯 The 100% Perfect Solution: The "Collaborator" Trick

You keep the code on your GitHub (`bhavya-darjii`), and do this:

1. **Create a free GitHub account using the client's Gmail** (e.g. username `hasslefreedrive-app`).
2. Go to your repo: [https://github.com/bhavya-darjii/Hasslefreedrive-Admin](https://github.com/bhavya-darjii/Hasslefreedrive-Admin)
3. Click **Settings** → **Collaborators** → **Add people**.
4. Type the client's GitHub username and click **Add**.
5. Accept the invite from the client's Gmail.
6. Now, in Vercel & Render (logged into the client's Gmail):
   - Connect to the **Client's GitHub**.
   - The client's GitHub **ONLY sees Hasslefreedrive-Admin** (because you only invited them to that one repo). They will **never** see any of your other private projects!

### Why this works best:
- ✅ **Your code stays 100% on your GitHub** (`bhavya-darjii/Hasslefreedrive-Admin`).
- ✅ **You only ever push to your own repo**: `git push origin main`.
- ✅ **Auto-deploy works**: When you push to your repo, GitHub updates, which automatically triggers the client's Vercel and Render builds.
- ✅ **Your other repos stay 100% hidden and safe**.
- ✅ **Your personal Vercel/Render accounts are completely unaffected**.

---

## 📋 Complete Step-by-Step Instructions

### Preparation: Browser Window
Open an **Incognito / Private Window** (`Ctrl + Shift + N`) so your personal sessions don't interfere with the client's Google account.

---

### Phase 1: Set Up Client's GitHub & Collaborator Access
1. In the Incognito window, go to [github.com/signup](https://github.com/signup) and create an account with the **client's Gmail**.
2. In your normal browser (logged into your GitHub):
   - Go to [https://github.com/bhavya-darjii/Hasslefreedrive-Admin/settings/access](https://github.com/bhavya-darjii/Hasslefreedrive-Admin/settings/access)
   - Click **Add people** → enter the client's GitHub username.
3. In the Incognito window, open the client's Gmail and click the invitation link to accept collaborator access.

---

### Phase 2: Deploy Backend to Client's Render
1. In Incognito, go to [dashboard.render.com](https://dashboard.render.com/) and sign in with the **client's Gmail**.
2. Click **New +** → **Web Service** → select **Build and deploy from a Git repository**.
3. Click **Connect GitHub** and log in with the **client's GitHub account**.
4. Select the repository: **`Hasslefreedrive-Admin`** (it appears because the client is a collaborator).
5. Fill in the service configuration:
   - **Name**: `hasslefreedrive-admin-api`
   - **Language**: `Node`
   - **Branch**: `main`
   - **Region**: `Singapore` (or closest to India/target audience)
   - **Root Directory**: *(Leave blank / empty)*
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`
6. Add the following **Environment Variables**:

| Key | Value |
| :--- | :--- |
| `NODE_ENV` | `production` |
| `FIREBASE_PROJECT_ID` | `haefreedrive` |
| `FRONTEND_URL` | `https://placeholder.vercel.app` *(update after Phase 3)* |
| `GOOGLE_APPLICATION_CREDENTIALS_JSON` | *(Copy the ENTIRE contents of `backend/serviceAccountKey.json` and paste it here as a single string)* |

7. Click **Create Web Service**.
8. Once deployment is complete (2-3 mins), copy the live Render API URL from the top of the page:
   ```
   https://hasslefreedrive-admin-api.onrender.com
   https://hasslefreedrive-admin-api.onrender.com/
   ```

---

### Phase 3: Deploy Frontend to Client's Vercel
1. In Incognito, go to [vercel.com](https://vercel.com/) and sign in with the **client's Gmail**.
2. Click **Add New...** → **Project**.
3. Under **Import Git Repository**, connect the **client's GitHub** and choose **`Hasslefreedrive-Admin`**.
4. **Build and Output Settings**:
   - Leave all toggles **OFF** (Vercel automatically detects Vite, `npm run build`, and `dist`).
5. Under **Environment Variables**, add the following keys:

| Key | Value |
| :--- | :--- |
| `VITE_API_BASE_URL` | `https://hasslefreedrive-admin-api.onrender.com/api` *(use your actual Render URL from Phase 2 + `/api`)* |
| `VITE_FIREBASE_API_KEY` | `AIzaSyDqWt0TUgwTR71UDHscDc2frplWRx0pOR0` |
| `VITE_FIREBASE_AUTH_DOMAIN` | `haefreedrive.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | `haefreedrive` |
| `VITE_FIREBASE_STORAGE_BUCKET` | `haefreedrive.firebasestorage.app` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `4341043561` |
| `VITE_FIREBASE_APP_ID` | `1:4341043561:web:20b8e5cf8b70807761adf8` |

6. Click **Deploy**.
7. Once deployed, copy the live Vercel URL (e.g., `https://hasslefreedrive-admin.vercel.app`).

---

### Phase 4: Final Link (CORS on Render)
1. Go back to the client's Render service dashboard.
2. Click **Environment** in the left sidebar.
3. Edit **`FRONTEND_URL`** and replace the placeholder with the actual Vercel URL:
   ```
   https://hasslefreedrive-admin.vercel.app
   ```
   *(Do NOT include a trailing slash at the end)*.
4. Save changes (Render will automatically redeploy the backend).

---

## 🔄 Daily Workflow (How You Update the Site)

Whenever you make code changes in the future:

```bash
# 1. Make your code changes locally
# 2. Commit and push:
git add .
git commit -m "your update message"
git push origin main
```

That's it! Because the client's Vercel and Render are connected to this repository, **both the frontend and backend will automatically rebuild and deploy within 1–2 minutes of your git push.**
