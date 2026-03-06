# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

## Running the full app (frontend + backend)

This project includes a small Express + Socket.IO backend under `server/` and a Vite React frontend at the repo root.

1. Install dependencies for both projects:

```powershell
# from repo root
npm install
cd server
npm install
cd ..
```

2. Configure environment variables:

- Copy `server/.env.example` → `server/.env` and set `JWT_SECRET` (don't use default in production).
- Copy `.env.local.example` → `.env.local` at repo root to set `VITE_API_BASE` (default: `http://localhost:4000`).

3. Run dev servers (two terminals):

```powershell
# terminal 1 - backend
cd server
npm run dev

# terminal 2 - frontend
cd ..
npm run dev
```

Or on Windows you can run the helper script:

```powershell
.\run-dev.ps1
```

4. Open the frontend in your browser (Vite will show the URL, usually `http://localhost:5173`).

Notes and recommendations
- Set `JWT_SECRET` in `server/.env` before creating real users.
- The server uses `server/data/db.json` (lowdb) for simple persistence — this is for development only.

Recommended VS Code extensions
- ESLint (`dbaeumer.vscode-eslint`)
- Prettier (`esbenp.prettier-vscode`)
- Tailwind CSS IntelliSense (`bradlc.vscode-tailwindcss`)
- Volar (`johnsoncodehk.volar`) — helpful for TypeScript in Vue; optional for other stacks
- GitLens (`eamodio.gitlens`)


**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
