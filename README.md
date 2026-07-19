# 🍽️ Restaurant Ordering System

A full-stack restaurant management and ordering platform built with **Django REST Framework** and **React + Vite**. Customers can browse the menu, place orders, and track them live — while admins manage everything from a dedicated dashboard.

---

## 📸 Screenshots

> _Add your screenshots here. Suggested shots below:_

| Page | Screenshot |
|------|------------|
| 🏠 Landing Page | <img width="1913" height="911" alt="landing" src="https://github.com/user-attachments/assets/44bcd5c8-54d1-417d-bd52-b1518933036e" /> |
| 📋 Menu Page | <img width="1899" height="904" alt="menu" src="https://github.com/user-attachments/assets/2500f208-6020-4f4c-931b-b5e0390baec5" /> |
| 🍛 Dish Details | <img width="1894" height="898" alt="dish-details" src="https://github.com/user-attachments/assets/0ec3cff3-a230-4c6f-bb83-882c165b79c5" /> |
| 🛒 Cart | <img width="1907" height="901" alt="cart" src="https://github.com/user-attachments/assets/c6f77b04-af05-4c7e-a632-e27e8853a0b8" /> |
| ✅ Order Confirmation | <img width="1918" height="907" alt="order-confirmation" src="https://github.com/user-attachments/assets/e1a89cb1-8cb7-4341-8cf5-1ce83667a21f" /> |
| 📡 Live Order Status | <img width="962" height="887" alt="live-status" src="https://github.com/user-attachments/assets/46bb6eaf-b318-4cba-aeb2-c80f46c9c22a" /> |
| 🔐 Staff Portal | <img width="1091" height="783" alt="auth" src="https://github.com/user-attachments/assets/d0730f91-41d3-4c77-8050-1a2e40aa1f34" /> |
| 👤 Profile Page | <img width="889" height="892" alt="profile" src="https://github.com/user-attachments/assets/3cac7e25-7d57-4f10-9b17-fa61a284e4e4" /> |
| 🛠️ Admin Dashboard | <img width="1880" height="901" alt="admin-dashboard" src="https://github.com/user-attachments/assets/b6edaba7-5110-4ec9-a590-714948c942d2" /> |
| 🍳 Kitchen View | <img width="1897" height="872" alt="kitchen-view" src="https://github.com/user-attachments/assets/838048a0-5ac4-48cb-bae3-110de35feb2c" /> |
| 📦 Order Management | <img width="1871" height="895" alt="order-management" src="https://github.com/user-attachments/assets/ac932a73-4cbe-4998-9686-82f70db5a39b" /> |
| 🗂️ Menu Management |<img width="1882" height="897" alt="menu-management" src="https://github.com/user-attachments/assets/9531e59b-6f83-468a-9a27-5f21f7d9be99" /> |

---

## ✨ Features

### Customer Side
- Smooth-scroll landing page with animated **3D menu cards** (Framer Motion + Lenis)
- Browse menu items by category, view ingredients, spiciness, calories
- Add to cart with **customizations**, persistent via `localStorage`
- Register / login with token-based authentication
- Place orders as **guest or logged-in user**
- Real-time **live order status** tracking (Pending → Preparing → Ready)
- Order history in profile (authenticated users only)

### Admin Side
- Secure admin login (separate from customer auth)
- **Dashboard** with overview stats (powered by Recharts)
- **Menu Management** — add, edit, delete menu items
- **Order Management** — view and update all orders
- **Kitchen View** — live feed of incoming orders for kitchen staff

---

## 🛠️ Tech Stack

### Frontend
| Tech | Purpose |
|------|---------|
| React 19 + Vite 7 | UI framework & build tool |
| React Router v7 | Client-side routing |
| Tailwind CSS v3 | Utility-first styling |
| Framer Motion | Animations & 3D card effects |
| Lenis | Smooth scroll |
| Axios | API communication |
| Recharts | Admin dashboard charts |
| Lucide React | Icons |
| Canvas Confetti | Order confirmation celebration 🎉 |

### Backend
| Tech | Purpose |
|------|---------|
| Django 6 | Web framework |
| Django REST Framework | API layer |
| DRF Token Auth | Authentication |
| django-cors-headers | CORS handling |
| SQLite | Development database |

---

## 📁 Project Structure

```
RESTAURANT-PROJECT/
├── backend/
│   ├── api/                    # Django App — models, views, serializers, URLs
│   └── backend/                # Django project config — settings, root URLs
├── frontend/
│   └── src/
│       ├── admin/              # Admin panel components
│       ├── components/         # Reusable UI (Card3D, etc.)
│       ├── context/            # UserContext — global auth state
│       ├── pages/              # Customer-facing pages
│       └── api.js              # Axios base configuration
└── venv/
```

---

## 🗄️ Data Models

- **Category** — groups menu items (e.g. Starters, Mains)
- **MenuItem** — name, price, description, veg flag, spiciness, calories, image URL, ingredients
- **Review** — rating (1–5) + comment per menu item
- **Order** — linked to a user (nullable for guests), table number, total (computed server-side), status lifecycle
- **OrderItem** — line items within an order with quantity and optional customization
- **UserProfile** — phone/address extension on Django's built-in `User`, auto-created on registration

### Order Status Flow
```
PENDING → PREPARING → READY
                    ↘ CANCELLED
```

---

## 🚀 Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+

### Backend Setup

```bash
cd backend
python -m venv ../venv
source ../venv/bin/activate        # Windows: ..\venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env               # fill in real values for any deployed instance;
                                    # local dev works with the defaults (falls back to SQLite)

python manage.py migrate
python manage.py createsuperuser   # For admin access (use an email as the username)
python manage.py runserver
```

Backend runs at: `http://localhost:8000`

With no `.env`, the backend runs against a local SQLite database — it never touches the
production database unless `DATABASE_URL` is explicitly set. See `.env.example` for all
supported variables (`DJANGO_SECRET_KEY`, `DJANGO_DEBUG`, `DJANGO_ALLOWED_HOSTS`,
`DATABASE_URL`, `CORS_ALLOWED_ORIGINS`).

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at: `http://localhost:5173`, and talks to the deployed backend by default.
To point it at your local backend instead, create `frontend/.env.local`:

```
VITE_API_URL=http://127.0.0.1:8000/api
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/menu-items/` | List all menu items | Public |
| GET | `/api/menu-items/:id/` | Menu item detail (includes nested reviews) | Public |
| POST | `/api/menu-items/` | Create menu item | Admin (staff) |
| PUT/PATCH | `/api/menu-items/:id/` | Update menu item | Admin (staff) |
| DELETE | `/api/menu-items/:id/` | Delete menu item | Admin (staff) |
| GET | `/api/categories/` | List categories | Public |
| POST | `/api/categories/` | Create category | Admin (staff) |
| GET | `/api/reviews/` | List all reviews | Public |
| POST | `/api/reviews/` | Add a review | Public |
| POST | `/api/orders/` | Place an order (total is computed server-side) | Public (guest ok) |
| GET | `/api/orders/` | List orders (own / all for staff) | Authenticated |
| GET | `/api/orders/track/:order_id/` | Look up one order by its `ORD-XXXXXX` id | Public |
| PATCH | `/api/orders/:id/update_status/` | Update order status | Admin (staff) |
| POST | `/api/register/` | Create an account | Public |
| POST | `/api/login/` | Obtain an auth token | Public |
| GET/PATCH | `/api/profile/` | View/update your own name, phone, address | Authenticated |

### Authentication

```bash
# Register
POST /api/register/
{ "email": "...", "password": "...", "name": "..." }

# Obtain token
POST /api/login/
{ "username": "...", "password": "..." }   # username = the email used at registration

# Both return: { "token": "...", "user": { "id", "username", "email", "name", "phone", "address", "is_staff" } }

# Use the token in subsequent requests
Authorization: Token <your_token>
```

Staff accounts (`is_staff=True`, e.g. via `createsuperuser`) use the same login and get
access to the `/admin` panel in the frontend; regular accounts don't.

---

## 🛣️ Frontend Routes

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | LandingPage | Hero / marketing page |
| `/auth` | AuthPage | Login & Register |
| `/menu` | MenuPage | Browse all dishes |
| `/dish/:id` | DishDetailsPage | Item detail + reviews |
| `/cart` | CartPage | Cart review & checkout |
| `/order-confirmation/:orderId` | OrderConfirmationPage | Success screen |
| `/status/:orderId` | LiveStatusPage | Real-time order tracker |
| `/profile` | ProfilePage | Order history & account |
| `/admin/login` | AdminLogin | Admin authentication |
| `/admin/dashboard` | Dashboard | Stats overview |
| `/admin/menu` | MenuManagement | CRUD for menu items |
| `/admin/orders` | OrderManagement | All orders view |
| `/admin/kitchen` | KitchenView | Kitchen order feed |

---

## 🔧 Environment & Configuration

All backend configuration is environment-driven (see `backend/.env.example`) — nothing
sensitive is hardcoded in `settings.py`:

- `DJANGO_SECRET_KEY`, `DJANGO_DEBUG`, `DJANGO_ALLOWED_HOSTS` — standard Django settings
- `DATABASE_URL` — a Postgres URL in production; omitted, it falls back to local SQLite
- `CORS_ALLOWED_ORIGINS` — comma-separated list of allowed frontend origins

> ⚠️ If you ever hardcode a real database URL, API key, or secret key in a file that gets
> committed, rotate that credential immediately — removing it from the file afterwards does
> **not** invalidate it, and it remains recoverable from git history.

---
