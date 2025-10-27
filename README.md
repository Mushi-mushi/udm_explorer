# UDM Explorer

UDM Explorer is a small React-based web UI for exploring the Unified Data Model (UDM) schema stored in this repository. The frontend is in the `udm-explorer/` folder and the canonical schema files are in `udm-schema/`.

## Repo layout

- `udm-explorer/` — Create React App UI (package.json inside this folder)
  - `src/` — React source (entry: `src/index.js`, main app: `src/App.js`)
  - `public/` — static public assets
  - `package.json` — app dependencies and scripts
- `udm-schema/` — JSON schema files describing UDM types
  - `udm-event.json` — root event type (see `metadata`, `principal`, `target`, etc.)
  - `fields/` — individual field definitions (some files may be empty/placeholders)

## Quick start (local development)

Prerequisites: Node.js (LTS recommended) and npm installed.

Open a PowerShell terminal and run:

```powershell
cd udm-explorer
npm install
npm start
```

The dev server runs on http://localhost:3000 by default.

## Build (production)

From the `udm-explorer` folder:

```powershell
cd udm-explorer
npm run build
```

This produces a static build in `udm-explorer/build/`.

## Publishing updates

This project is a web app living in the `udm-explorer/` subfolder. Below are common deployment options; choose the one that matches your hosting provider.

Option A — GitHub Pages (recommended for quick static hosting)
1. In `udm-explorer/package.json` add a `homepage` field (replace `<GH_USER>` and `<REPO>`):

```json
"homepage": "https://<GH_USER>.github.io/<REPO>"
```

2. Install the `gh-pages` package and add deploy scripts:

```powershell
cd udm-explorer
npm install --save-dev gh-pages
# edit package.json to add:
# "scripts": { "predeploy": "npm run build", "deploy": "gh-pages -d build" }
npm run deploy
```

Notes: Because the app lives in `udm-explorer/`, these commands should be run from that folder. GitHub Pages will serve the files from the `gh-pages` branch automatically.

Option B — Vercel (recommended for continuous deployments)
1. Sign in at https://vercel.com and import the GitHub repository.
2. Set the project root/path to `udm-explorer` during import.
3. Set Build Command: `npm run build` and Output Directory: `build`.
4. Vercel will deploy on each push to the connected branch.

Option C — Netlify
1. Connect the GitHub repository in Netlify, set the publish directory to `udm-explorer`/`build` and the build command to `npm run build`.
2. Alternatively, build locally and drag/upload the `build/` folder to Netlify.

Option D — Manual/static hosting (S3, Cloudflare Pages, Azure Static Web Apps)
1. Run `npm run build` in `udm-explorer/`.
2. Upload the contents of `udm-explorer/build/` to your static host of choice.

## Release & publishing workflow (git-centric)

A simple flow to publish an update (PowerShell commands):

```powershell
# from repo root
git checkout -b feature/my-change
# make changes, then stage and commit
git add -A
git commit -m "Implement: description of change"
# push branch and open PR on GitHub
git push -u origin feature/my-change
# after PR merged to main, create a release tag
git checkout main
git pull origin main
git tag -a v1.0.1 -m "Release v1.0.1"
git push origin main --tags
```

Optionally, use GitHub Releases UI to add release notes and attach build artifacts.

## Notes & tips

- The authoritative schema is the JSON under `udm-schema/` (e.g. `udm-event.json`). Make small edits there and reflect any UI changes in `udm-explorer/src/`.
- `udm-explorer/package.json` currently contains Tailwind/Tailwind-related devDependencies. If you plan to add or change CSS tooling, update those packages carefully and run a local build.
- Some `udm-schema/fields/` files may be placeholders; review them before relying on them in UI features.

## Need help or want changes?

If you want this README adjusted (more hosting providers, CI steps, or automated deploy via GitHub Actions), tell me which provider or CI you prefer and I will add concrete scripts and examples.
