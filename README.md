# FolderTreePRO# FolderTree Pro

A folder auditing, organization, and AI-assisted tagging tool built with Next.js (frontend) and Express/Apollo GraphQL (backend), with optional Electron shell.

## Prerequisites
- Node.js 20.11.0 (see `.nvmrc`)
- npm
- (Optional) Ollama running locally with the `mistral` model for AI tagging
- (Optional) OpenAI API key for remote AI tagging

## Setup
```bash
# from repo root
npm install

# frontend deps
cd frontend
npm install
cd ..

# backend deps
cd backend
npm install
cd ..
```

## Environment
Create `frontend/.env.local`:
```
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret
NEXT_PUBLIC_API_URL=http://127.0.0.1:5000
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
```

Create `backend/.env`:
```
PORT=5000
OPENAI_API_KEY=your-openai-api-key   # optional
OLLAMA_HOST=http://localhost:11434   # optional, for local AI
```

## Run (development)
In two terminals:

```bash
# backend
cd backend
npm start   # serves GraphQL at http://127.0.0.1:5000/graphql

# frontend
cd frontend
npm run dev # serves UI at http://localhost:3000
```

## Electron (desktop shell)
```bash
cd frontend
npm run electron-dev
```

## Production build
```bash
# frontend
cd frontend
npm run build
npm start

# backend
cd ../backend
npm run build
npm start
```

## Windows firewall (if blocked)
Run PowerShell as Administrator:
```powershell
New-NetFirewallRule -DisplayName "Allow Frontend 3000" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow -Profile Any
New-NetFirewallRule -DisplayName "Allow Backend 5000" -Direction Inbound -LocalPort 5000 -Protocol TCP -Action Allow -Profile Any
```

## Notes
- Update `NEXT_PUBLIC_API_URL` if you change backend host/port.
- Use `ollama pull mistral` and `ollama serve` for local AI; otherwise set `OPENAI_API_KEY`.