# pipaDB

pipaDB is a ProtonDB-style compatibility database for Xiaomi Pipa.  
It is a static site with static JSON API endpoints generated from per-title JSON files.

## Data model (PR workflow)

Use one file per entry:

- `games/*.json` — game compatibility reports
- `apps/*.json` — app compatibility reports
- `distros/*.json` — Linux distro ports (`family`: alpine, arch, fedora, atomic, debian, other)
- `recoveries/*.json` — custom recoveries
- `templates/*.template.json` — starters for each kind
- `templates/entry.schema.json` — field definitions for games/apps

Open a pull request with your new JSON file.  
GitHub Actions validates JSON, rebuilds the index, and redeploys Pages on push.

`proton` is optional (especially for apps).  
If omitted, games default to `Proton 11.0 ARM64/LOCAL` and apps keep it blank.

## Commands

- `npm run dev` - generate API and run local dev server
- `npm run validate:data` - validate all JSON submissions only
- `npm run build:data` - build API JSON output in `public/api/`
- `npm run build` - build site for production

## API endpoints

- `/api/index.json` - full payload and stats
- `/api/games.json` - only games
- `/api/apps.json` - only apps
- `/api/distros.json` - Linux distro ports
- `/api/recoveries.json` - custom recoveries
- `/api/items/<id>.json` - per-title endpoint
