# Polaroid Light 

A  RESTful API for managing film listings and user purchases, built with TypeScript, Express, Prisma, and PostgreSQL.

## Table of Contents
- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Setup & Installation](#setup--installation)
- [Design Decisions](#design-decisions)
- [Trade-offs & Time Constraints](#trade-offs--time-constraints)


## Overview

Polaroid Light is a film marketplace API that allows users to browse, purchase, and manage digital film content. The API provides endpoints for film management and purchase tracking with built-in safeguards against duplicate purchases.

## Features

- **Film Management**: Create, read, update, and delete films
- **User Management**: User registration and profile management
- **Purchase System**: Secure film purchasing with duplicate prevention
- **Search & Filter**: Search films by title/description, filter by price range
- **Pagination**: Efficient data loading for all list endpoints
- **Rate Limiting**: Protect API from abuse
- **Comprehensive Logging**: Winston-based logging system
- **Type Safety**: Full TypeScript implementation

## Tech Stack

- **Runtime**: Node.js
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Logging**: Winston
- **Validation**: Joi
- **Testing**: Jest 

## Architecture

```
src/
├── controllers/        # Request handlers
├── services/          # Business logic layer
├── repositories/      # Data access layer
├── routes/           # API route definitions
├── middlewares/      # Express middlewares
├── types/           # TypeScript type definitions
├── utils/           # Utility functions
└── lib/            # External library configurations
```

### Layer Responsibilities

1. **Controllers**: Handle HTTP requests/responses, input validation
2. **Services**: Implement business logic, orchestrate repository calls
3. **Repositories**: Abstract database operations, implement data access patterns
4. **Middlewares**: Handle cross-cutting concerns (auth, logging, rate limiting)

## Setup & Installation

### Prerequisites

- Node.js 16+ and npm
- PostgreSQL 12+
- Git

### Quick Start (Recommended)

```bash
# Clone the repository
git clone 
cd polaroid-light

# Make setup script executable
chmod +x setup.sh

# Run the automated setup
./setup.sh
```


### Manual Installation

1. **Clone and install dependencies**
   ```bash
   git clone <repository-url>
   cd polaroid-light
   npm install
   ```

2. **Configure environment**
   ```bash
   cp .env.sample .env
   # Edit .env with your database credentials
   ```

3. **Database setup**
   ```bash
   # Generate Prisma client
  npm run prisma:generate
   
   # Run migrations
npm run prisma:migrate
   ```

4. **Start the server**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm run build
   npm start
   ```



## API Documentation

### Base URL
```
http://localhost:3000/api/v1
```



### Endpoints

#### Films

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/films` | List all films (paginated) | No |
| GET | `/films/:id` | Get film by ID | No |
| GET | `/films/search?q=query` | Search films | No |
| GET | `/films/price-range?minPrice=0&maxPrice=9999` | Filter by price | No |
| POST | `/films` | Create new film | No |
| PUT | `/films/:id` | Update film | No |
| DELETE | `/films/:id` | Delete film | No |
| POST | `/films/:id/purchase` | Purchase film | No |

#### Users

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/users` | List all users | No |
| GET | `/users/:id` | Get user by ID | No |
| POST | `/users` | Create new user | No |
| PUT | `/users/:id` | Update user | No |
| DELETE | `/users/:id` | Delete user | No |
| GET | `/users/:userId/films` | Get user's purchased films | No |



## Design Decisions

### 1. Architecture Pattern: Service-Repository Pattern

**Decision**: Implemented a three-layer architecture with Controllers, Services, and Repositories.

**Rationale**:
- Clear separation of concerns
- Testable business logic
- Database-agnostic service layer
- Easy to mock repositories for testing


### 2. Prisma as ORM

**Decision**: Used Prisma instead of raw SQL or other ORMs.

**Rationale**:
- Type-safe database queries
- Automatic migration management
- Built-in connection pooling
- Excellent TypeScript integration


### 3. Comprehensive Error Handling

**Decision**: Centralized error handling with custom error types.

**Rationale**:
- Consistent error responses
- Better debugging
- Client-friendly error messages
- Proper HTTP status codes

### 4. Request Logging & Monitoring

**Decision**: Winston for structured logging.

**Rationale**:
- Performance monitoring
- Debug capabilities



### Running Tests
```bash
npm run test

```



## Performance Considerations

1. **Database Indexing**: Indexed frequently queried fields
2. **Pagination**: All list endpoints support pagination
3. **Connection Pooling**: Prisma handles connection pooling
4. **Response Compression**: Gzip compression enabled
5. **Query Optimization**: Using efficient Prisma queries

## Security Considerations

1. **Input Validation**: Joi validation on all inputs
2. **SQL Injection**: Protected by Prisma parameterized queries
3. **XSS Protection**: Helmet.js security headers
4. **Rate Limiting**: Prevent API abuse
5. **CORS**: Configured for specific origins


---
