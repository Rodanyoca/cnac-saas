# CNAC — Système de gestion

Application indépendante du Comité National Antidopage Congolais, initialisée par reproduction fidèle de l’interface COC.

## Démarrage local

```powershell
if (-not (Test-Path -LiteralPath .env.local)) { Copy-Item -LiteralPath .env.example -Destination .env.local }
npm install
npm run dev
```

Le mode local est activé par défaut dans l’exemple d’environnement. Il permet d’ouvrir les interfaces sans utiliser les comptes, classeurs ou dossiers du COC. Désactivez `CNAC_DEMO_MODE` et `NEXT_PUBLIC_CNAC_DEMO_MODE` uniquement après avoir configuré des ressources propres au CNAC.

Consultez [la cartographie des routes](docs/CNAC_ROUTE_MAPPING.md) et [les règles du projet](AGENTS.md) avant toute adaptation métier.

Consultez [la configuration des trois classeurs CNAC](docs/implementation/cnac-google-sheets-configuration.md) pour activer les lectures Structure territoriale et Acteurs. Les écritures sont refusées en mode démonstration.

## Historique du socle

This is a [Next.js](https://nextjs.org) project bootstrapped with [v0](https://v0.app).

## Built with v0

This repository is linked to a [v0](https://v0.app) project. You can continue developing by visiting the link below -- start new chats to make changes, and v0 will push commits directly to this repo. Every merge to `main` will automatically deploy.

[Continue working on v0 →](https://v0.app/chat/projects/prj_r4brzRYAdJVJIETxsUB2ZdjTT89v)

## Getting Started

Create `.env.local` from `.env.example` only if it does not exist; preserve any existing local configuration. The application no longer supports the historical generic `GOOGLE_SHEETS_SPREADSHEET_ID` variable. Authentication requires `GOOGLE_SHEETS_USERS_SPREADSHEET_ID`; its workbook must contain a `USERS` sheet with the expected headers.

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Learn More

To learn more, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.
- [v0 Documentation](https://v0.app/docs) - learn about v0 and how to use it.

<a href="https://v0.app/chat/api/kiro/clone/mesutarso/v0-comite-olympique-congolais-dashboard" alt="Open in Kiro"><img src="https://pdgvvgmkdvyeydso.public.blob.vercel-storage.com/open%20in%20kiro.svg?sanitize=true" /></a>
