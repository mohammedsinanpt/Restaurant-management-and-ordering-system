# 🍽️ Restaurant Ordering System

A full-stack restaurant management and ordering platform built with **Django REST Framework** and **React + Vite**. Customers can browse the menu, place orders, and track them live — while admins manage everything from a dedicated dashboard.

---

## 📸 Screenshots

> _Add your screenshots here. Suggested shots below:_

| Page | Screenshot |
|------|------------|
| 🏠 Landing Page | `screenshots/landing.png` |
| 📋 Menu Page | `screenshots/menu.png` |
| 🍛 Dish Details | `screenshots/dish-details.png` |
| 🛒 Cart | `screenshots/cart.png` |
| ✅ Order Confirmation | `screenshots/order-confirmation.png` |
| 📡 Live Order Status | `screenshots/live-status.png` |
| 🔐 Staff Portal | `screenshots/auth.png` |
| 👤 Profile Page | `screenshots/profile.png` |
| 🛠️ Admin Dashboard | `screenshots/admin-dashboard.png` |
| 🍳 Kitchen View | `screenshots/kitchen-view.png` |
| 📦 Order Management | `screenshots/order-management.png` |
| 🗂️ Menu Management | `screenshots/menu-management.png` |

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
- **Order** — linked to a user (nullable for guests), table number, total, status lifecycle
- **OrderItem** — line items within an order with quantity and optional customization

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
pip install django djangorestframework django-cors-headers

python manage.py migrate
python manage.py createsuperuser   # For admin access
python manage.py runserver
```

Backend runs at: `http://localhost:8000`

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at: `http://localhost:5173`

---

## 🔌 API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/menu-items/` | List all menu items | Public |
| GET | `/api/menu-items/:id/` | Menu item detail | Public |
| POST | `/api/menu-items/` | Create menu item | Admin |
| PUT/PATCH | `/api/menu-items/:id/` | Update menu item | Admin |
| DELETE | `/api/menu-items/:id/` | Delete menu item | Admin |
| GET | `/api/reviews/` | List all reviews | Public |
| POST | `/api/reviews/` | Add a review | Public |
| POST | `/api/orders/` | Place an order | Public (guest ok) |
| GET | `/api/orders/` | List orders (own / all for staff) | Authenticated |
| PATCH | `/api/orders/:id/update_status/` | Update order status | Admin |

### Authentication

```bash
# Obtain token
POST /api-token-auth/
{ "username": "...", "password": "..." }

# Use in requests
Authorization: Token <your_token>
```

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

The backend uses SQLite by default (`db.sqlite3`). CORS is open for all origins in development (`CORS_ALLOW_ALL_ORIGINS = True`).

> ⚠️ **Before deploying to production:**
> - Replace `SECRET_KEY` in `settings.py` with a secure value (use environment variables)
> - Set `DEBUG = False`
> - Configure `ALLOWED_HOSTS`
> - Restrict `CORS_ALLOWED_ORIGINS` to your frontend domain
> - Swap SQLite for PostgreSQL or another production database

---
