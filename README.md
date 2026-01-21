☁️ CloudVault

> **A production‑ready Cloud File Storage MVP inspired by Google Drive**
> Built with **FastAPI + React (Vite)** — focused on correctness, UX clarity, and real‑world architecture.

CloudVault allows users to **upload, organize, manage, recover, and securely access files** using a clean Drive/Trash model, drag‑and‑drop uploads, and role‑based actions — without over‑engineering.

This project is intentionally built to be:

## 🚀 Features

### 🔐 Authentication

- Email & password login
- User signup with **auto‑login**
- JWT‑based authentication
- Secure logout
- (Planned) Google OAuth

---

### 📁 File & Folder Management

- Nested folder hierarchy
- Drag & drop file upload (React Dropzone)
- File preview & download
- Rename & move files and folders
- Google Drive–style breadcrumb navigation

---

### 🗑️ Trash & Recovery (Drive‑accurate behavior)

- Soft delete for files & folders
- Dedicated **Trash view**
- Restore from Trash
- Permanent delete
- Strict separation between Drive and Trash actions

> Trash **never** shows upload, create, preview, rename, or move actions.

---

### 🎨 UI & UX Polish

- Hover elevation & micro‑animations (CSS‑only)
- Smooth dropdown menus & modals
- Click‑outside to close menus
- Empty‑state UI for Drive & Trash
- Loading feedback for uploads & auth

---

## 🧠 Engineering Principles

This project prioritizes **real production correctness** over flashy features:

- Clear separation of **Drive vs Trash logic**
- Backend‑enforced permissions
- Minimal but scalable architecture
- No unnecessary libraries or abstractions
- UI behavior mirrors real cloud storage products

No Redux. No Framer Motion. No over‑engineering.

---

## 🏗️ Tech Stack

### Frontend

- React (Vite)
- Tailwind CSS
- React Dropzone
- Fetch API

### Backend

- FastAPI (Python)
- JWT Authentication
- Pydantic validation
- RESTful API design

### Storage & Database

- PostgreSQL (Supabase)
- Object Storage (Supabase Storage / S3‑compatible)

---

## 📂 Project Structure

```text
CloudVault/
├── backend/
│   ├── app/
│   │   ├── routes/
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── services/
│   │   └── main.py
│   └── requirements.txt
│
└── frontend/
    ├── src/
    │   ├── pages/
    │   ├── components/
    │   ├── context/
    │   └── services/
    └── vite.config.js
```

---

## ▶️ Running Locally (Windows‑friendly)

### Prerequisites

- Node.js v18+
- Python 3.10+
- npm

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Runs at:

```
http://localhost:5173
```

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Runs at:

```
http://127.0.0.1:8000
```

---

## 🔐 Authentication Flow

1. User signs up or logs in
2. Backend issues JWT access token
3. Token stored securely in localStorage
4. All protected requests include:

```http
Authorization: Bearer <token>
```

5. Token cleared on logout

---

## 🧪 MVP Scope (Intentional Non‑Goals)

The following are **explicitly excluded** from this MVP:

- Real‑time collaboration
- Desktop sync client
- In‑browser document editors
- Dark mode

This keeps the project focused, stable, and review‑friendly.

---

## 🗺️ Roadmap

### ✅ Completed

- Auth & signup
- File & folder management
- Drag & drop uploads
- Trash & restore system
- UI polish & animations

### 🔜 Planned

- Google OAuth
- Search & filtering
- Starred files
- Activity log
- Empty Trash action

---

## 👨‍💻 Author

**Anil Kumar J T**
Full‑Stack Developer (Python + React)

> _“Go with Love, Grow with Love”_

---

## ⭐ Why CloudVault?

CloudVault demonstrates:

- Practical full‑stack architecture
- Secure auth flows
- Correct Drive/Trash behavior
- UI decisions backed by real product patterns

This project is built the way **production systems are built**, not just to look good.

If you’re reviewing this repository — thank you for your time 🙌
