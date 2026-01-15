# 🍽️ ZeroPlate — Food Waste Redistribution Platform

ZeroPlate is a **production-grade, full-stack platform** designed to reduce food waste by connecting **food donors (restaurants)**, **receivers (NGOs)**, **volunteers**, and **admins** using **secure authentication, intelligent matching, logistics optimization, analytics, and background processing**.

The project is built with a **strong backend-first approach** using Express.js and Node.js, combined with a modern **Angular 17 frontend** for real-world usability.

---

## 🚀 Key Features

### 🔐 Authentication & Authorization
- OAuth2 (Google) login using Passport.js
- JWT-based stateless authentication
- Role-Based Access Control (RBAC):
  - `donor` - Can list surplus food
  - `receiver` - Can claim donations
  - `volunteer` - Handles logistics and delivery
  - `admin` - Dashboard and analytics

### 🍲 Food Donation System
- Donors can:
  - Create, update, and delete surplus food listings
- Receivers can:
  - View available food
  - Claim donations
- Food lifecycle:
  - Available → Claimed → Picked Up

### 🧠 Smart Matching Engine
- Automatically recommends **nearest NGOs** for each donation
- Matching criteria:
  - Location proximity (Google Maps Distance Matrix)
  - Expiry urgency
  - Food type compatibility
  - Returns ranked NGO recommendations

### ⏱️ Background Jobs & Scheduling
- Redis + Bull.js queues
- Background workers handle:
  - Pickup reminders
  - Expiry alerts
  - Periodic re-matching
- node-cron used for scheduled jobs

### 🚚 Volunteer Logistics Module
- Volunteer role for delivery coordination
- Admin assigns **multiple pickups** to volunteers
- Google Maps Directions API used for:
  - Route optimization
  - ETA calculation
  - Distance calculation

### 📊 Analytics Dashboard (Admin)
- Aggregation-based analytics APIs:
  - Total donations and claims
  - Total meals saved
  - Active donors & receivers
  - CO₂ emissions reduction estimation
  - Top donors ranking
- Rule-based fraud detection:
  - Duplicate claims
  - Rapid multi-claims
  - Suspicious donors

### 🔒 Security & Hardening
- Helmet security headers
- Global & route-specific rate limiting
- NoSQL injection protection
- XSS sanitization
- Centralized error handling
- Audit logs for critical actions

---

## 🏗️ Tech Stack

### Backend
| Component | Technology |
|-----------|-----------|
| Language | TypeScript |
| Framework | Express.js |
| Database | MongoDB + Mongoose |
| Authentication | OAuth2 (Passport.js) + JWT |
| Validation | Zod |
| Background Jobs | Redis + Bull.js |
| Scheduling | node-cron |
| Maps API | Google Maps API |

### Frontend
| Component | Technology |
|-----------|-----------|
| Framework | Angular 17 |
| Language | TypeScript |
| Styling | Tailwind CSS + SCSS |
| UI Components | Angular Material |
| Reactive Programming | RxJS |
| HTTP Client | Angular HttpClient |

---

## 📋 Prerequisites

- **Node.js** v18 or higher
- **npm** or **yarn**
- **MongoDB** (if running locally) or connection string to MongoDB Atlas
- **Redis** (for background jobs)
- **Google Maps API Key** (for location matching and routing)

---

## 🚀 Quick Start Guide

### Step 1: Install Dependencies

Install dependencies for both backend and frontend:

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Step 2: Configure Environment Variables

Create a `.env` file in the `backend` directory with the following variables:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret
EMAIL_USER=your_gmail_address
EMAIL_PASSWORD=your_gmail_app_password
```

### Step 3: Start the Backend Server

Open a terminal in the project root and run:

```bash
cd backend
npm run dev
```

The backend should start on `http://localhost:3000` (or the port specified in your `.env` file).

**Available Scripts:**
- `npm run dev` - Start development server with hot reload
- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Start production server

### Step 4: Start the Frontend Development Server

Open a **new terminal** in the project root and run:

```bash
cd frontend
npm start
```

The frontend will start on `http://localhost:4200` and automatically open in your browser.

**Available Scripts:**
- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run unit tests

### Step 5: Accessing the Application

Once both servers are running, you can access:

1. **Login Page**: http://localhost:4200/login
2. **Signup Page**: http://localhost:4200/signup
3. **Home Page**: http://localhost:4200/home (requires authentication)

---

## 📁 Project Structure

```
ZeroPlate/
├── backend/
│   ├── src/
│   │   ├── app.ts                    # Express app setup
│   │   ├── server.ts                 # Server entry point
│   │   ├── worker.ts                 # Background job workers
│   │   ├── cronJob.ts                # Scheduled tasks
│   │   ├── config/
│   │   │   ├── db.ts                 # MongoDB configuration
│   │   │   └── redis.ts              # Redis configuration
│   │   ├── controllers/              # Route controllers
│   │   ├── middlewares/              # Express middlewares
│   │   ├── models/                   # Mongoose schemas
│   │   ├── routes/                   # API routes
│   │   ├── services/                 # Business logic
│   │   ├── utils/                    # Helper functions
│   │   └── queues/                   # Bull.js queue setup
│   ├── package.json
│   ├── tsconfig.json
│   └── README.md
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── app.component.ts      # Root component
│   │   │   ├── app.routes.ts         # Application routes
│   │   │   ├── core/
│   │   │   │   ├── guards/           # Route guards (auth protection)
│   │   │   │   ├── interceptors/     # HTTP interceptors
│   │   │   │   └── services/         # Core services (Auth, etc.)
│   │   │   └── features/
│   │   │       ├── auth/             # Authentication components
│   │   │       │   ├── login/
│   │   │       │   └── signup/
│   │   │       └── home/             # Home page component
│   │   ├── index.html
│   │   ├── main.ts                   # Application entry point
│   │   ├── styles.scss               # Global styles
│   │   └── assets/                   # Static assets
│   ├── angular.json                  # Angular configuration
│   ├── package.json
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── README.md
│
└── README.md                          # This file
```

---

## 🧪 Testing the Application

### Create an Account

1. Navigate to `/signup`
2. Fill in your details:
   - Name
   - Email
   - Password
   - Select your role (Donor, Receiver, or Admin)
3. Submit the form

### Login

1. Navigate to `/login`
2. Enter your email and password
3. You'll be redirected to the home page upon successful authentication

### Explore Features

- The home page shows stats, features, and information about ZeroPlate
- Use the navigation to access different features based on your role
- Use the logout button to end your session

---

## 🔧 API Configuration

### Frontend to Backend Communication

The frontend is configured to communicate with the backend API. A proxy configuration is set up for development in `proxy.conf.json`, which routes `/api` requests to `http://localhost:3000`.

**Important:** Make sure your backend server:
- Is running on `http://localhost:3000`
- Has CORS enabled to allow requests from `http://localhost:4200`
- Accepts credentials (cookies) in requests

### CORS Configuration in Backend

The backend is configured with CORS to accept requests from the frontend:

```typescript
import cors from 'cors';
app.use(cors({
  origin: 'http://localhost:4200',
  credentials: true
}));
```

### Authentication & Cookies

The application uses cookie-based authentication:
- Tokens are stored in **httpOnly cookies** by the backend for security
- This prevents XSS attacks from accessing the token
- Credentials are sent automatically with each request via the `withCredentials` flag in HTTP interceptors

---

## 🐛 Troubleshooting

### CORS Errors
- Make sure the backend CORS is configured to allow `http://localhost:4200`
- Check that the backend is running on port 3000
- Verify the `proxy.conf.json` in the frontend points to the correct backend URL

### Build Errors
- Run `npm install` in both the frontend and backend directories
- Make sure you have Node.js v18 or higher: `node --version`
- Clear node_modules if encountering dependency issues:
  ```bash
  rm -r node_modules package-lock.json
  npm install
  ```

### Port Already in Use

**For Backend (Port 5000):**
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# macOS/Linux
lsof -i :5000
kill -9 <PID>
```

**For Frontend (Port 4200):**
- Change the port in `angular.json` under `serve.options.port`
- Or stop the process using port 4200

### MongoDB Connection Errors
- Verify your MongoDB connection string in `.env`
- Ensure MongoDB is running and accessible
- If using MongoDB Atlas, whitelist your IP address

### Redis Connection Errors
- Ensure Redis is running on the configured URL
- Check the `REDIS_URL` in your `.env` file
- Background jobs will fail without a Redis connection

### Authentication Issues
- Clear browser cookies and localStorage
- Check that the backend is returning tokens in httpOnly cookies
- Verify CORS credentials settings are enabled

---

## 💡 Development Notes

### Frontend Development
- The frontend uses **standalone components** (Angular 17 feature)
- **Hot reload** is enabled - changes will automatically refresh the browser
- Use Angular DevTools browser extension for debugging
- RxJS observables are used extensively - familiarize yourself with `pipe()`, `tap()`, etc.

### Backend Development
- TypeScript strict mode is enabled for type safety
- Zod is used for runtime validation of request data
- All async operations use try-catch for error handling
- Audit logs track all critical user actions
- Background jobs are processed via Bull.js workers

### Database
- MongoDB schemas are defined with Mongoose
- Indexes are created for frequently queried fields (email, location)
- Geospatial queries are used for location-based matching

### API Conventions
- RESTful endpoints with clear HTTP methods
- Consistent error response format
- JWT tokens in Authorization headers (or cookies)
- Rate limiting enabled to prevent abuse

---

## 📚 Additional Resources

- [Express.js Documentation](https://expressjs.com/)
- [Angular Documentation](https://angular.io/docs)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)

---

## 📝 License

ISC

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a pull request or open an issue.

---

## 📧 Support

For issues and questions, please open an issue on the [GitHub repository](https://github.com/AyushMishraa/ZeroPlate).

---

**Happy coding! 🚀**
