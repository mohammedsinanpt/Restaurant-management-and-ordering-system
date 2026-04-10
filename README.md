# Restaurant Management System

A full-stack web application for managing restaurant operations, menu items, orders, and customer reviews. The system provides both customer-facing features for browsing the menu and placing orders, as well as an admin dashboard for managing menu items, tracking orders, and monitoring kitchen operations.

## Features

### Customer Features
- **Menu Browsing**: Browse restaurant menu organized by categories with detailed information
  - Dish descriptions, prices, and high-quality images
  - Dietary information (vegetarian/non-vegetarian)
  - Nutritional details (calories)
  - Spiciness levels (Mild, Medium, Spicy)
  - Ingredient lists
- **Shopping Cart**: Add items to cart and manage quantities
- **Order Placement**: Place orders as guest or authenticated user
- **Order Tracking**: Real-time order status updates (Pending → Preparing → Ready)
- **Order History**: Registered users can view their past orders
- **Reviews & Ratings**: Submit and view ratings and reviews for menu items
- **User Authentication**: Secure login and profile management

### Admin Features
- **Menu Management**: Add, edit, delete, and manage menu items
- **Order Management**: View all orders and update their status
- **Kitchen View**: Real-time view of orders being prepared
- **Admin Dashboard**: Overview of orders, inventory, and system metrics
- **Admin Authentication**: Secure admin login

## Technology Stack

### Backend
- **Framework**: Django + Django REST Framework
- **Database**: SQLite
- **Authentication**: Django's built-in authentication system
- **API Design**: RESTful endpoints with role-based permissions

### Frontend
- **Framework**: React 19.2.0 with Vite
- **Styling**: Tailwind CSS with PostCSS
- **Routing**: React Router v7
- **HTTP Client**: Axios
- **Animations**: Framer Motion & Lenis smooth scroll
- **UI Components**: Lucide React icons
- **Charts**: Recharts for analytics
- **Effects**: Canvas Confetti for celebrations
- **Linting**: ESLint for code quality

## Project Structure

```
restaurant-project/
├── backend/                          # Django backend
│   ├── manage.py
│   ├── db.sqlite3
│   ├── api/                         # Main API app
│   │   ├── models.py               # Data models (MenuItem, Order, Review, etc.)
│   │   ├── views.py                # API viewsets
│   │   ├── serializers.py          # DRF serializers
│   │   ├── urls.py                 # API routing
│   │   └── migrations/             # Database migrations
│   └── backend/                     # Project settings
│       ├── settings.py
│       ├── urls.py
│       └── wsgi.py
└── frontend/                         # React frontend
    ├── src/
    │   ├── App.jsx                 # Main app component
    │   ├── api.js                  # API client configuration
    │   ├── pages/                  # Page components
    │   │   ├── LandingPage.jsx
    │   │   ├── MenuPage.jsx
    │   │   ├── CartPage.jsx
    │   │   ├── DishDetailsPage.jsx
    │   │   ├── LiveStatusPage.jsx
    │   │   ├── OrderConfirmationPage.jsx
    │   │   ├── AuthPage.jsx
    │   │   └── ProfilePage.jsx
    │   ├── admin/                  # Admin components
    │   │   ├── AdminLayout.jsx
    │   │   ├── AdminLogin.jsx
    │   │   ├── Dashboard.jsx
    │   │   ├── KitchenView.jsx
    │   │   ├── MenuManagement.jsx
    │   │   └── OrderManagement.jsx
    │   ├── components/             # Reusable components
    │   ├── context/                # React context (UserContext)
    │   └── main.jsx
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    └── index.html
```

## Getting Started

### Prerequisites
- Python 3.8+
- Node.js 16+
- pip (Python package manager)
- npm (Node package manager)

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create and activate a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Run migrations:
```bash
python manage.py migrate
```

5. Create a superuser for admin access:
```bash
python manage.py createsuperuser
```

6. Start the development server:
```bash
python manage.py runserver
```

The backend API will be available at `http://localhost:8000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`

## API Endpoints

### Menu Items
- `GET /api/menu-items/` - List all menu items
- `GET /api/menu-items/{id}/` - Get a specific menu item
- `POST /api/menu-items/` - Create a menu item (Admin only)
- `PUT /api/menu-items/{id}/` - Update a menu item (Admin only)
- `DELETE /api/menu-items/{id}/` - Delete a menu item (Admin only)

### Orders
- `GET /api/orders/` - List user's orders (Authenticated users see their orders, Staff see all)
- `POST /api/orders/` - Create a new order (Guests and authenticated users)
- `GET /api/orders/{id}/` - Get order details
- `PATCH /api/orders/{id}/update_status/` - Update order status (Admin only)

### Reviews
- `GET /api/reviews/` - List all reviews
- `POST /api/reviews/` - Create a review
- `GET /api/reviews/{id}/` - Get review details

## Database Models

### MenuItem
- Category relationship with cascading delete
- Name, description, price
- Dietary information (vegetarian flag)
- Availability status
- Image URL
- Ingredients list
- Spiciness level
- Calorie count

### Order
- Associated user (for authenticated orders)
- Order ID (unique)
- Table number
- Total amount
- Status tracking (Pending, Preparing, Ready, Cancelled)
- Timestamp

### OrderItem
- Links to Order and MenuItem
- Quantity
- Item customization notes

### Review
- MenuItem reference
- Customer name
- Rating (1-5)
- Comment
- Timestamp

## Key Features Implementation

### Authentication & Authorization
- Guest ordering available for anonymous users
- User authentication required for order history
- Admin/Staff role-based access control
- Automatic user association with orders for authenticated requests

### Real-time Order Tracking
- Live status updates visible to customers
- Kitchen view for staff to manage preparation
- Order status progression: Pending → Preparing → Ready

### Menu Management
- Admin interface for adding/editing/removing items
- Detailed item information (ingredients, nutrition, spiciness)
- Availability toggles

### User Context
- Global user state management using React Context
- Persistent authentication across pages

## Development Workflow

1. **Backend Development**: Run Django server with `python manage.py runserver`
2. **Frontend Development**: Run Vite dev server with `npm run dev`
3. **Linting**: Check code quality with `npm run lint`
4. **Build**: Create production build with `npm run build`

## Future Enhancements

- Payment gateway integration
- Email order confirmations
- SMS notifications for order updates
- Advanced analytics and reporting
- Inventory management system
- Reservation/Table booking system
- Customer loyalty program
- Multi-location support
- Mobile app (React Native)

## License

This project is open source and available under the MIT License.

## Author

Built as a full-stack web development project demonstrating proficiency in Django REST APIs, React frontend development, and modern web technologies.
