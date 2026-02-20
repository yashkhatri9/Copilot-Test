# GitHub Copilot Instructions

## Project Overview

This is a **60-minute AI-assisted developer evaluation project** - a full-stack task management application with flexible implementation options:
- **Backend Only**: Node.js + Express + TypeScript REST API
- **Frontend Only**: Angular 17 + TypeScript with mock API consumption
- **Full-Stack**: Both backend and frontend integrated

Key constraint: **All endpoints/components use in-memory storage** (no database). Additional requirements appear at 30 and 45-minute marks.

---

## High-Level Requirements

### Backend Track
- Implement a RESTful API for task management
- CRUD operations (Create, Read, Update, Delete)
- In-memory data storage (no database)
- Input validation and error handling
- Follow proper REST conventions

### Frontend Track
- Build a task management user interface
- Forms for creating/editing tasks
- List view with task display
- Status management functionality
- Connect to the provided Mock API (see ./mock-api/README.md)
- Use Angular services for data handling with HttpClient
- Error handling and user feedback
- Handle async operations (loading states)

### Full-Stack Track
- Complete both Backend and Frontend requirements
- Integrate frontend with backend API
- End-to-end functionality

---

## Architecture Patterns

### Backend Structure (Express/TypeScript)
Located in `backend/src/`:
- **Controllers** (`controllers/`): Request handlers returning JSON responses
- **Routes** (`routes/`): Express Router instances mapping HTTP methods to controllers
- **Middleware** (`middleware/`): Error handler uses custom `Error` interface with optional `statusCode` property
- **Models** (`models/`): Data structures (currently empty - implement here)

**Error Handling Pattern**: Centralized middleware catches errors, extracts `statusCode` (defaults to 500), and returns JSON with `{ error: { message, statusCode } }`. Always throw errors with attached `statusCode` property.

### Frontend Structure (Angular 17)
Located in `frontend/src/app/`:
- **Components** in `components/` subdirectories (e.g., `health/`, `home/`)
- **Services** for HTTP communication using `HttpClientModule`
- **Routing** via `AppRoutingModule`
- **Module declarations** centralized in `app.module.ts`

**HTTP Pattern**: Use Angular `HttpClient` injected into services; components call service methods and subscribe to `Observable` streams.

### Data Flow
- **Full-Stack**: Frontend (Angular) → Backend (Express) ← Mock API not used
- **Frontend-Only**: Frontend (Angular) → Mock API (json-server on port 3001)
- **Backend-Only**: Direct HTTP testing (curl/Postman)

---

## Development Workflows

### Backend Development
```bash
cd backend && npm install
npm run dev          # Runs with nodemon; restarts on ts file changes
# Server on http://localhost:3000
# Test: curl http://localhost:3000/health
```
**Key files**: `backend/nodemon.json` (watch config), `backend/tsconfig.json` (strict mode enabled)

### Frontend Development
```bash
cd frontend && npm install
npm start            # Runs on http://localhost:4200
# Auto-reloads on code changes
```

### Mock API (Frontend-Only)
```bash
cd mock-api && npm install
npm start            # json-server on http://localhost:3001
# Serves db.json with /tasks endpoint
```

**Integration sequence**: Start mock-api first, then frontend. Both must run concurrently.

---

## Code Conventions

### TypeScript Configuration
- **Strict mode enabled** in both backend and frontend
- Backend: target ES2020, node module resolution, `noImplicitAny: true`
- Frontend: Angular 17 defaults with strict template checking
- Always use explicit type annotations; no implicit `any`

### Express Patterns
1. **Route handlers** in controllers receive `(req: Request, res: Response): void`
2. **Routes** use `Router()` and export as default
3. **Middleware** attached in `app.ts` in order: express.json, routes, errorHandler (last)
4. **Error handler** must have 4 parameters: `(err, req, res, next)`

Example controller pattern:
```typescript
export const getHealth = (req: Request, res: Response): void => {
  res.status(200).json({ status: 'ok' });
};
```

### Angular Patterns
1. **Component selectors** follow kebab-case (e.g., `app-health`)
2. **Imports**: Always import `HttpClientModule` in the module declaring HTTP-using components
3. **Services**: Inject `HttpClient` via constructor, return `Observable<T>`
4. **Components**: Inject services and call methods, subscribe in templates or with async pipe

---

## Critical Integration Points

### API Communication Contract
- **Backend endpoint structure**: `/resource` (GET list/POST create), `/resource/:id` (GET detail/PUT update/DELETE)
- **Response format**: Success: `{ data: {...} }` or `{ status: 'ok' }`, Error: `{ error: { message, statusCode } }`
- **HTTP status codes**: 200 (OK), 201 (Created), 400 (Bad Request), 404 (Not Found), 500 (Server Error)

### Frontend Service Pattern
```typescript
constructor(private http: HttpClient) {}

getTasks(): Observable<Task[]> {
  return this.http.get<Task[]>(`${this.apiUrl}/tasks`);
}
```

### Task Entity (In-Memory)
Store in-memory data structure in backend models; frontend receives via HTTP. Task fields (specific structure provided verbally during evaluation) should include at minimum: `id`, `title`, `status`.

---

## Key Files for Common Tasks

| Task | Files |
|------|-------|
| Add new backend endpoint | `backend/src/routes/*.ts`, `backend/src/controllers/*.ts` |
| Add frontend page/component | `frontend/src/app/components/` + register in `app.module.ts` |
| Modify error handling | `backend/src/middleware/errorHandler.ts` |
| Configure backend port/env | `backend/.env` |
| Add HTTP service | `frontend/src/app/services/` |
| Update routing | `frontend/src/app/app-routing.module.ts` |

---

## Requirements Progression

**Initial (0-30 min)**: Basic task CRUD operations
**At 30-min mark**: Additional requirements communicated verbally (listen carefully!)
**At 45-min mark**: Further enhancements (adapt existing implementation)

When new requirements arrive, preserve existing code structure and extend incrementally.

---

## Performance Notes

- **Nodemon**: Watches `src/**/*.ts` and `src/**/*.json`; ignores test files
- **Angular dev server**: Auto-reload on changes; sourcemaps included for debugging
- **json-server**: Simulates REST API with zero configuration

---

## Common Pitfalls to Avoid

1. **Forgetting `HttpClientModule`** in Angular module imports
2. **Not registering components** in `app.module.ts` declarations
3. **Error handler middleware placement** - must be last in `app.ts`
4. **Missing `statusCode` on custom errors** - error handler defaults to 500
5. **Mixing observables and promises** - stay consistent with RxJS
6. **Port conflicts** - Ensure frontend (4200), backend (3000), mock-api (3001) don't overlap
