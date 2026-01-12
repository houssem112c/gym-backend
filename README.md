# Gym Management System - Backend

A comprehensive NestJS backend API for managing gym operations including courses, schedules, videos, and contact forms.

## Features

- **Authentication**: JWT-based authentication system for admin access
- **Course Management**: Create and manage fitness courses
- **Schedule Management**: 
  - One-time course schedules
  - Recurring course schedules (weekly)
  - Flexible scheduling with start/end dates
- **Video Library**: Categorized video content management
- **Contact Forms**: Handle customer inquiries
- **PostgreSQL Database**: Using Prisma ORM

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- npm or yarn package manager

## Installation

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Database Setup

Create a PostgreSQL database:

```sql
CREATE DATABASE gym_db;
```

### 3. Environment Configuration

Create a `.env` file in the backend directory:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/gym_db?schema=public"
JWT_SECRET="your-secret-key-change-this-in-production"
JWT_EXPIRATION="7d"
PORT=3001
NODE_ENV=development
CORS_ORIGIN="http://localhost:3000"
```

### 4. Run Database Migrations

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# (Optional) Seed database with sample data
npx prisma db seed
```

### 5. Start the Server

Development mode:
```bash
npm run start:dev
```

Production mode:
```bash
npm run build
npm run start:prod
```

The API will be available at `https://gym-backend-r62h.onrender.com/api`

## API Documentation

### Authentication Endpoints

#### Register Admin
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "admin@gym.com",
  "password": "password123",
  "name": "Admin User"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@gym.com",
  "password": "password123"
}
```

### Course Endpoints

#### Get All Courses (Public)
```http
GET /api/courses
```

#### Get Course by ID (Public)
```http
GET /api/courses/:id
```

#### Create Course (Admin)
```http
POST /api/courses
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Yoga for Beginners",
  "description": "Learn yoga basics",
  "duration": 60,
  "capacity": 20,
  "instructor": "John Doe"
}
```

#### Update Course (Admin)
```http
PATCH /api/courses/:id
Authorization: Bearer <token>
```

#### Delete Course (Admin)
```http
DELETE /api/courses/:id
Authorization: Bearer <token>
```

### Schedule Endpoints

#### Get All Schedules
```http
GET /api/courses/schedules/all?courseId=<optional>
```

#### Get Calendar View
```http
GET /api/courses/calendar?startDate=2024-01-01&endDate=2024-12-31
```

#### Create One-time Schedule (Admin)
```http
POST /api/courses/schedules
Authorization: Bearer <token>
Content-Type: application/json

{
  "courseId": "course-uuid",
  "isRecurring": false,
  "specificDate": "2024-12-25T10:00:00Z",
  "startTime": "10:00",
  "endTime": "11:00",
  "isActive": true
}
```

#### Create Recurring Schedule (Admin)
```http
POST /api/courses/schedules
Authorization: Bearer <token>
Content-Type: application/json

{
  "courseId": "course-uuid",
  "isRecurring": true,
  "dayOfWeek": 1,
  "startTime": "10:00",
  "endTime": "11:00",
  "startDate": "2024-01-01T00:00:00Z",
  "endDate": "2024-12-31T23:59:59Z",
  "isActive": true
}
```

### Video Endpoints

#### Get All Categories (Public)
```http
GET /api/videos/categories
```

#### Get Category by Slug (Public)
```http
GET /api/videos/categories/slug/:slug
```

#### Get All Videos (Public)
```http
GET /api/videos?categoryId=<optional>
```

#### Create Video (Admin)
```http
POST /api/videos
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Morning Workout",
  "description": "Start your day right",
  "url": "https://youtube.com/watch?v=...",
  "thumbnail": "https://...",
  "categoryId": "category-uuid",
  "duration": 1200,
  "order": 1,
  "isPublished": true
}
```

### Contact Endpoints

#### Submit Contact Form (Public)
```http
POST /api/contacts
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "1234567890",
  "subject": "Question about membership",
  "message": "I would like to know..."
}
```

#### Get All Contacts (Admin)
```http
GET /api/contacts
Authorization: Bearer <token>
```

## Database Schema

### User
- Admin authentication
- Email and password
- Role-based access

### Course
- Title, description
- Duration and capacity
- Instructor information

### CourseSchedule
- One-time or recurring
- Day of week for recurring
- Start/end times
- Start/end dates for recurring periods

### VideoCategory
- Name and slug
- Order for sorting

### Video
- Title and description
- URL (YouTube or hosted)
- Category relationship
- Published status

### Contact
- Contact form submissions
- Read/unread status

## Project Structure

```
backend/
├── prisma/
│   └── schema.prisma          # Database schema
├── src/
│   ├── auth/                  # Authentication module
│   ├── courses/               # Course and schedule management
│   ├── videos/                # Video library management
│   ├── contacts/              # Contact form handling
│   ├── prisma/                # Prisma service
│   ├── app.module.ts          # Main application module
│   └── main.ts                # Application entry point
├── .env                       # Environment variables
├── .env.example               # Environment template
├── package.json               # Dependencies
└── tsconfig.json              # TypeScript configuration
```

## Development

### Prisma Studio

View and edit database data:

```bash
npx prisma studio
```

### Database Migrations

Create a new migration:

```bash
npx prisma migrate dev --name <migration-name>
```

Reset database:

```bash
npx prisma migrate reset
```

## Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## Deployment

### Environment Variables

Ensure all production environment variables are set:
- Use a strong `JWT_SECRET`
- Set `NODE_ENV=production`
- Configure `DATABASE_URL` for production database
- Set appropriate `CORS_ORIGIN`

### Build

```bash
npm run build
```

### Start Production Server

```bash
npm run start:prod
```

## Security Considerations

1. Change the default `JWT_SECRET` in production
2. Use HTTPS in production
3. Implement rate limiting
4. Regular security updates
5. Database connection pooling
6. Input validation and sanitization

## License

MIT
