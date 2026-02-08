# CLAUDE.md

## Project
finance-management — Personal finance tracker for monthly salary budgeting (INR)

## Repositories (Separate)
- **Frontend:** https://github.com/iamdivyeshtailor/finance-management → `/mnt/c/Users/Kamaldhari/finance-management`
- **Backend:** https://github.com/iamdivyeshtailor/api-finance-management → `/mnt/c/Users/Kamaldhari/api-finance-management`

## Tech Stack
- **Frontend:** React 18 + Vite + Tailwind CSS → hosted on GitHub Pages
- **Backend:** Node.js + Express.js → hosted on Render
- **Database:** MongoDB (Mongoose ODM) → hosted on MongoDB Atlas (free M0 cluster)

## Commands
```bash
# Frontend (this repo)
npm install && npm run dev      # Vite dev server (port 5173)
npm run build                    # Production build → dist/

# Backend (api-finance-management repo)
npm install && npm run dev      # Dev with nodemon (port 5000)
npm start                        # Production
```

## Code Style
- React components: `.jsx` extension, PascalCase filenames
- Backend: CommonJS modules, camelCase filenames
- API routes: RESTful, prefixed with `/api/`

## Key Docs
- `PROJECT_DOCUMENTATION.md` — Non-technical requirements and walkthrough
- `TECHNICAL_DOCUMENTATION.md` — Architecture, schemas, API endpoints, deployment
- `docs/FRONTEND_DOCUMENTATION.md` — Frontend architecture and components
- `docs/BACKEND_DOCUMENTATION.md` — API reference and business logic
- `docs/DATABASE_DOCUMENTATION.md` — MongoDB schemas and queries
- `docs/PROJECT_ROADMAP.md` — 16 phases, 69 modules execution plan
