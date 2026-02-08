# CLAUDE.md

## Project
finance-management — Personal finance tracker for monthly salary budgeting (INR)
Repository: https://github.com/iamdivyeshtailor/finance-management

## Tech Stack
- **Frontend:** React 18 + Vite + Tailwind CSS → hosted on GitHub Pages
- **Backend:** Node.js + Express.js → hosted on Render
- **Database:** MongoDB (Mongoose ODM) → hosted on MongoDB Atlas (free M0 cluster)

## Commands
```bash
# Backend
cd server && npm install && npm run dev     # Dev with nodemon (port 5000)
cd server && npm start                       # Production

# Frontend
cd client && npm install && npm run dev     # Vite dev server (port 5173)
cd client && npm run build                   # Production build → dist/
```

## Code Style
- React components: `.jsx` extension, PascalCase filenames
- Backend: CommonJS modules, camelCase filenames
- API routes: RESTful, prefixed with `/api/`

## Key Docs
- `PROJECT_DOCUMENTATION.md` — Non-technical requirements and walkthrough
- `TECHNICAL_DOCUMENTATION.md` — Architecture, schemas, API endpoints, deployment
