# Frontend - React + TypeScript

Modern React application for the Task Management System.

## Tech Stack

- **React 18** with TypeScript
- **React Router** for navigation
- **Axios** for HTTP requests
- **CSS** for styling

## Prerequisites

- Node.js (v18+ recommended)
- npm or yarn

## Installation

```bash
cd frontend
npm install
```

## Running the Frontend

### Development Server

```bash
npm start
```

The React app will run on **http://localhost:3000** (note: will auto-assign port 3001 if 3000 is taken by backend)

## Important: Backend Integration

This frontend connects to the backend API at `http://localhost:3000`. 

**Make sure the backend is running first:**

```bash
# In a separate terminal
cd backend
npm run dev
```

Backend runs on **http://localhost:3000**

## Features

- Task listing with filter by status
- Create new tasks
- Edit existing tasks
- Delete tasks with confirmation
- Responsive design
- Loading states
- Error handling
- Form validation
