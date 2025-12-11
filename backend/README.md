# IRIS VISTA Backend

Go backend API for the IRIS VISTA Supply Chain Management System.

## Tech Stack

- Go 1.21+
- Gin (HTTP framework)
- GORM (ORM)
- SQLite (Database)
- JWT (Authentication)
- AES-256-GCM (Encryption)

## Project Structure

```
backend/
├── main.go                 # Entry point
├── config/
│   └── config.go          # Configuration loading
├── internal/
│   ├── models/            # Database models
│   ├── handlers/          # HTTP handlers
│   ├── services/          # Business logic
│   ├── middleware/        # HTTP middleware
│   ├── repository/        # Data access layer
│   └── amazon/            # Amazon integration
├── migrations/
│   └── init.go            # Database migrations & seeding
└── pkg/
    ├── crypto/            # Encryption utilities
    └── jwt/               # JWT utilities
```

## Getting Started

```bash
# Install dependencies
go mod tidy

# Build
go build -o vista-backend .

# Run
./vista-backend
```

The server starts on http://localhost:8080

## Configuration

Environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| PORT | 8080 | Server port |
| ENVIRONMENT | development | Environment (development/production) |
| JWT_SECRET | - | JWT signing secret |
| ENCRYPTION_KEY | - | 32-byte encryption key |
| CORS_ORIGINS | http://localhost:3000 | Allowed CORS origins |

## API Overview

### Authentication
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/refresh` - Refresh token
- `POST /api/v1/auth/logout` - Logout
- `GET /api/v1/auth/me` - Current user

### Users (Admin only)
- `GET /api/v1/users` - List users
- `POST /api/v1/users` - Create user
- `PUT /api/v1/users/:id` - Update user
- `DELETE /api/v1/users/:id` - Delete user

### Products
- `GET /api/v1/products` - List products
- `GET /api/v1/products/:id` - Get product
- `POST /api/v1/products` - Create product
- `PUT /api/v1/products/:id` - Update product
- `DELETE /api/v1/products/:id` - Delete product

### Requests
- `GET /api/v1/requests` - List all requests
- `GET /api/v1/requests/my` - My requests
- `GET /api/v1/requests/:id` - Get request
- `POST /api/v1/requests` - Create request
- `DELETE /api/v1/requests/:id` - Cancel request

### Approvals (General Manager)
- `GET /api/v1/approvals` - Pending approvals
- `GET /api/v1/approvals/stats` - Approval statistics
- `POST /api/v1/approvals/:id/approve` - Approve request
- `POST /api/v1/approvals/:id/reject` - Reject request

### Admin
- `GET /api/v1/admin/dashboard` - Dashboard stats
- `GET /api/v1/admin/amazon/config` - Amazon config
- `PUT /api/v1/admin/amazon/config` - Update Amazon config
- `GET /api/v1/admin/filters` - Filter rules
- `POST /api/v1/admin/filters` - Create filter rule

### Upload
- `GET /api/v1/upload/requirements` - Upload requirements
- `POST /api/v1/upload/image` - Upload single image
- `POST /api/v1/upload/images` - Upload multiple images
- `DELETE /api/v1/upload/image` - Delete image

## Database & Demo Data

SQLite database is created automatically on first run with demo data:

### Demo Users

| Email | Password | Role |
|-------|----------|------|
| admin@company.com | admin123 | Admin |
| gm@company.com | password123 | General Manager |
| scm@company.com | password123 | Supply Chain Manager |
| employee@company.com | password123 | Employee |

### Demo Products (30+ items)

Auto-seeded product categories:
- **Office Supplies**: Pens, Notebooks, Folders, Staplers, Sticky Notes, Binder Clips
- **PPE**: Safety Shoes, Gloves, Goggles, Hard Hats, Ear Plugs
- **IT Equipment**: Laptops (ThinkPad, Dell), Desktops, Keyboards, Mice, Monitors
- **Cleaning**: Mops, Hand Soap, Paper Towels, Toilet Paper, Cleaners
- **Maintenance**: Screwdrivers, Wrenches, Lubricants, Tape, Cable Ties

## Development

```bash
# Run with hot reload (install air first)
air

# Build for production
CGO_ENABLED=1 go build -o vista-backend .
```

## License

Proprietary - All rights reserved.
