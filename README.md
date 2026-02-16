# Airport Parking Platform - Backend API

A RESTful API for the Airport Parking Marketplace platform, connecting travelers with parking space providers near Zurich Airport.

## 🚀 Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with PostGIS (for geospatial)
- **Authentication**: JWT with refresh tokens
- **Validation**: Zod
- **ORM**: Knex.js

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration files
│   ├── controllers/     # Route handlers
│   ├── database/        # Database connection & migrations
│   │   ├── migrations/  # Database migrations
│   │   └── seeds/       # Seed data
│   ├── middleware/      # Express middleware
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── types/           # TypeScript types
│   ├── utils/           # Utility functions
│   ├── validators/      # Zod validation schemas
│   ├── app.ts           # Express app setup
│   └── server.ts        # Server entry point
├── .env.example         # Environment variables template
├── package.json
├── tsconfig.json
└── knexfile.js          # Knex CLI configuration
```

## 🏁 Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+ with PostGIS extension
- npm or yarn

### Installation

1. **Clone and navigate to backend**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Set up PostgreSQL database**
   ```sql
   CREATE DATABASE airport_parking;
   \c airport_parking
   CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
   CREATE EXTENSION IF NOT EXISTS postgis;
   ```

5. **Run database migrations**
   ```bash
   npm run db:migrate
   ```

6. **Seed the database (optional)**
   ```bash
   npm run db:seed
   ```

7. **Start development server**
   ```bash
   npm run dev
   ```

## 📚 API Endpoints

### Authentication (`/api/v1/auth`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/register` | Register new user | Public |
| POST | `/login` | Login | Public |
| POST | `/refresh` | Refresh token | Public |
| POST | `/logout` | Logout | Public |
| POST | `/logout-all` | Logout all devices | Private |
| POST | `/change-password` | Change password | Private |
| POST | `/forgot-password` | Request reset | Public |
| POST | `/reset-password` | Reset with token | Public |
| POST | `/verify-email` | Verify email | Public |
| GET | `/me` | Get profile | Private |

### Users (`/api/v1/users`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/` | List users | Admin |
| GET | `/:id` | Get user | Admin/Self |
| PATCH | `/:id` | Update user | Admin/Self |
| PATCH | `/:id/status` | Update status | Admin |
| PATCH | `/:id/role` | Update role | Admin |
| DELETE | `/:id` | Delete user | Admin |
| GET | `/:id/audit-logs` | Get audit logs | Admin |

### Hosts (`/api/v1/hosts`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/register` | Register as host | Private |
| GET | `/` | List hosts | Admin |
| GET | `/me` | Get own profile | Host |
| GET | `/:id` | Get host | Admin/Self |
| PATCH | `/:id` | Update host | Admin/Self |
| PATCH | `/:id/verify` | Verify host | Admin |
| POST | `/:id/payout-account` | Set payout | Admin/Self |

## 🔐 Role-Based Access Control

### Roles

- **Customer**: Default role. Can search, book, manage own bookings
- **Host**: Parking providers. Can manage listings, view payouts
- **Dispatcher**: Manage shuttle operations
- **Driver**: Shuttle drivers. View and update trips
- **Admin**: Full system access

### Permissions

Each role has specific permissions for resources:
- `users`, `bookings`, `listings`, `hosts`, `vehicles`, `shifts`, `trips`, `payments`, `payouts`, `reports`, `settings`

Actions: `create`, `read`, `update`, `delete`, `manage`

## 🛡️ Security Features

- JWT authentication with access/refresh tokens
- Password hashing with bcrypt (12 rounds)
- Rate limiting (general + strict for auth)
- Account lockout after failed attempts
- CORS protection
- Helmet security headers
- Request ID tracking
- Audit logging

## 📝 Scripts

```bash
npm run dev          # Start dev server with nodemon
npm run build        # Build for production
npm run start        # Start production server
npm run db:migrate   # Run migrations
npm run db:migrate:rollback  # Rollback last migration
npm run db:seed      # Run seeds
npm run typecheck    # TypeScript check
```

## 🧪 Default Credentials

After running seeds:
- **Admin**: admin@airportparking.ch / Admin123!

⚠️ **Change these in production!**

## 📄 License

MIT
