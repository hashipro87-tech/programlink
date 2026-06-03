# ProgramLink — Backend

Node.js + Express API for the ProgramLink USDA food program operations platform.

## Quick Start

```bash
# Install dependencies
npm install

# Copy the environment file and fill in your values
cp .env.example .env

# Create the database tables
npm run db:migrate

# Start the development server (with auto-reload)
npm run dev
```

The API will be available at: http://localhost:4000

Health check: http://localhost:4000/health

## Auth Endpoints

| Method | Path              | Description              |
|--------|-------------------|--------------------------|
| POST   | /api/auth/login   | Sign in, returns JWT     |
| POST   | /api/auth/register| Create a new user        |
| GET    | /api/auth/me      | Get current user profile |
