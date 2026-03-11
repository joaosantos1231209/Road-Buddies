# Architecture Overview

## Overview

This repository contains a carpooling/ride-sharing application that allows users to create trips, find matching rides, and communicate with other users. The application is built as a full-stack JavaScript/TypeScript application with a React frontend and Node.js/Express backend. It uses a PostgreSQL database with Drizzle ORM for data modeling.

The application follows a client-server architecture with a clear separation between frontend and backend code. It's designed to be deployed on platforms like Replit, with automatic scaling capabilities configured.

## System Architecture

### Frontend Architecture

The frontend is built with React and follows a component-based architecture. Key architectural decisions include:

- **TypeScript**: Used throughout for type safety
- **React**: Core UI library
- **React Query**: Data fetching and cache management
- **Wouter**: Lightweight routing library
- **ShadcnUI / Radix UI**: Component library for UI elements
- **Tailwind CSS**: Utility-first CSS framework for styling
- **Firebase Auth**: User authentication with Google OAuth

The frontend code is organized by feature, with shared components, hooks, and utilities. The application uses React Context for global state management, particularly for authentication state.

### Backend Architecture

The backend is built with Express.js and follows a RESTful API architecture. Key architectural decisions include:

- **TypeScript**: Used throughout for type safety
- **Express.js**: Web server framework
- **Drizzle ORM**: Database ORM with schema definitions
- **Zod**: Runtime validation for request/response data
- **PostgreSQL**: Relational database via Neon (serverless)

The backend implements a storage layer with clearly defined interfaces that abstract away the database implementation, allowing for flexibility in swapping out storage mechanisms.

### Database Architecture

The database uses PostgreSQL with the following schema:

- **Users**: Stores user information, preferences, and travel details
- **Trips**: Stores trip information including origin, destination, and status
- **Messages**: Facilitates communication between users
- **Matches**: Represents potential or confirmed trip matches between users

The database schema uses relationships between these entities to maintain data integrity.

## Key Components

### Frontend Components

1. **Authentication System**
   - Firebase authentication integration
   - Protected routes with conditional rendering
   - User profile management

2. **Trip Management**
   - Trip creation, viewing, and updating
   - Search and filtering capabilities
   - Matching algorithm interface

3. **Messaging System**
   - Real-time(ish) messaging between users
   - Conversation management

4. **Maps and Location**
   - Map visualization for trips
   - Location selection interface

5. **UI Component Library**
   - Design system implementation with ShadcnUI
   - Consistent styling with Tailwind

### Backend Components

1. **API Routes**
   - RESTful endpoints for resources
   - Input validation with Zod schemas
   - Structured response formatting

2. **Storage Layer**
   - Database abstraction with interfaces
   - Implementation with PostgreSQL/Drizzle
   - Potential for alternative implementations

3. **Authentication Middleware**
   - Session management
   - Firebase ID verification
   - Authorization checks

4. **Error Handling**
   - Consistent error response format
   - Error logging and monitoring

## Data Flow

### Authentication Flow

1. User signs in via Firebase Auth (Google or email/password)
2. Firebase returns authentication token
3. Token is validated on the backend
4. User profile is created or retrieved from database
5. Session is established

### Trip Creation Flow

1. User inputs trip details (origin, destination, dates)
2. Client validates input
3. Request is sent to backend API
4. Backend validates input with Zod schema
5. Trip is saved to database
6. Potential matches are computed
7. Response is returned to client

### Messaging Flow

1. User selects another user to message
2. Messages are fetched from backend
3. New messages are sent to API
4. Database is updated
5. Messages appear in recipient's inbox

## External Dependencies

### Frontend Dependencies

- **@firebase/auth**: Authentication service
- **@hookform/resolvers**: Form validation
- **@radix-ui/react-\***: UI component primitives
- **@tanstack/react-query**: Data fetching and state management
- **class-variance-authority**: Component style variants
- **clsx, tailwind-merge**: CSS class utilities
- **date-fns**: Date formatting and manipulation
- **lucide-react**: Icon library
- **react-hook-form**: Form state management
- **wouter**: Routing library

### Backend Dependencies

- **express**: Web server framework
- **drizzle-orm**: Database ORM
- **@neondatabase/serverless**: PostgreSQL client for serverless environments
- **zod**: Schema validation

## Deployment Strategy

The application is configured for deployment on Replit with the following strategy:

1. **Development**: 
   - Local development using `npm run dev`
   - Vite for frontend development server
   - TypeScript with hot module reloading

2. **Build Process**:
   - Frontend built with Vite
   - Backend bundled with esbuild
   - Output to `dist` directory

3. **Production**:
   - Static assets served by Express
   - Node.js server for API endpoints
   - Configured for autoscaling

4. **Database**:
   - Neon PostgreSQL serverless database
   - Schema migrations with Drizzle Kit

The deployment is containerized and configured for automatic scaling based on demand.