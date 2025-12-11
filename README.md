# IRIS VISTA - Supply Chain Management System

Internal supply chain management system with purchase request workflows, approval processes, and Amazon Business integration.

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS
- **Backend**: Go 1.21+, Gin, GORM, SQLite
- **UI Components**: shadcn/ui, Lucide Icons
- **i18n**: English, Chinese, Spanish

## Project Structure

```
vista/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── (auth)/            # Authentication pages
│   │   └── (dashboard)/       # Main application pages
│   ├── components/            # React components
│   │   ├── ui/               # shadcn/ui components
│   │   └── layout/           # Layout components
│   ├── contexts/             # React contexts
│   ├── lib/                  # Utilities and API client
│   └── types/                # TypeScript types
├── backend/                   # Go backend (separate folder)
└── public/                    # Static assets
```

## Getting Started

### Prerequisites

- Node.js 18+
- Go 1.21+
- npm or yarn

### Frontend Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend runs on http://localhost:3000

### Backend Setup

```bash
cd backend

# Install dependencies
go mod tidy

# Build
go build -o vista-backend .

# Run (creates SQLite database automatically)
./vista-backend
```

The backend runs on http://localhost:8080

## Demo Data (Auto-seeded)

The backend automatically seeds demo data on first run:

### Demo Users

| Email | Password | Role |
|-------|----------|------|
| admin@company.com | admin123 | Admin |
| gm@company.com | password123 | General Manager |
| scm@company.com | password123 | Supply Chain Manager |
| employee@company.com | password123 | Employee |

### Demo Products (30+ items)

| Category | Examples |
|----------|----------|
| Office Supplies | Pens, Notebooks, Folders, Staplers, Sticky Notes |
| PPE | Safety Shoes, Gloves, Goggles, Hard Hats, Ear Plugs |
| IT Equipment | Laptops, Desktops, Keyboards, Mice, Monitors |
| Cleaning | Mops, Hand Soap, Paper Towels, Toilet Paper |
| Maintenance | Tools, Lubricants, Tape, Cable Ties |

## Features

### User Roles

- **Admin**: Full system access, user management, Amazon configuration
- **General Manager**: Approve/reject purchase requests
- **Supply Chain Manager**: View all requests, analytics, reports
- **Employee**: Browse catalog, create purchase requests

### Core Features

- Internal product catalog with stock management
- Amazon Business product search (PA-API integration)
- Purchase request creation and submission
- Multi-level approval workflow
- Request history and audit trail
- Multi-language support (EN/ZH/ES)

## API Endpoints

### Authentication
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/refresh` - Refresh token
- `POST /api/v1/auth/logout` - Logout
- `GET /api/v1/auth/me` - Current user

### Products
- `GET /api/v1/products` - List products
- `GET /api/v1/products/:id` - Get product
- `POST /api/v1/products` - Create product (Admin/SCM)
- `PUT /api/v1/products/:id` - Update product (Admin/SCM)
- `DELETE /api/v1/products/:id` - Delete product (Admin/SCM)

### Requests
- `GET /api/v1/requests/my` - My requests
- `GET /api/v1/requests/:id` - Get request details
- `POST /api/v1/requests` - Create request
- `DELETE /api/v1/requests/:id` - Cancel request

### Approvals (General Manager)
- `GET /api/v1/approvals` - Pending approvals
- `POST /api/v1/approvals/:id/approve` - Approve request
- `POST /api/v1/approvals/:id/reject` - Reject request

### Admin
- `GET /api/v1/admin/dashboard` - Dashboard stats
- `GET /api/v1/admin/amazon/config` - Amazon config
- `PUT /api/v1/admin/amazon/config` - Update Amazon config
- `GET /api/v1/admin/filters` - Filter rules
- `POST /api/v1/admin/filters` - Create filter rule

## Environment Variables

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
```

### Backend (.env)
```
PORT=8080
ENVIRONMENT=development
JWT_SECRET=your-secret-key
ENCRYPTION_KEY=your-32-byte-encryption-key
CORS_ORIGINS=http://localhost:3000
```

## Production Build

### Frontend
```bash
npm run build
npm start
```

### Backend
```bash
go build -o vista-backend .
ENVIRONMENT=production ./vista-backend
```

## License

Proprietary - All rights reserved.
