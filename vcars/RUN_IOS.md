# VCARS — Run on iOS (stable workflow)

This project is pinned to:
- Node: **16** (see `.nvmrc` / `.node-version`)
- Ruby: **2.7.5** (see `.ruby-version`)

## 1) Pull changes
```bash
cd /Users/macbook/Documents/temp360-prueba1_conexion_backend/360/VCARS-git
git checkout vcars-process-reorg
git pull origin vcars-process-reorg
```

## 2) Set env (Node + Ruby)
```bash
cd /Users/macbook/Documents/temp360-prueba1_conexion_backend/360/VCARS-git/vcars

export NVM_DIR="$HOME/.nvm"
[ -s "/opt/homebrew/opt/nvm/nvm.sh" ] && . "/opt/homebrew/opt/nvm/nvm.sh"

nvm use 16

eval "$(rbenv init - zsh)"
rbenv local 2.7.5
```

## 3) Terminal 1 — Metro
```bash
npx react-native start --reset-cache
```

## 4) Terminal 2 — Pods + run simulator
```bash
cd ios
bundle install
bundle exec pod install
cd ..

open -a Simulator
npx react-native run-ios --simulator "iPad (A16)"
```

## Notes
- If iOS fails after a dependency change: re-run `bundle exec pod install`.
- We do NOT require running `npm run lint` to test changes.

## Troubleshooting (actual)
- Run CLI commands from `/Users/admi/Documents/Proyectos_2026/VCARS/vcars` (not from repo root), otherwise `npx` may try to install another React Native version.
- If Metro shows `EADDRINUSE: 8081`, close previous Metro process and retry.
- `Unable to boot device in current state: Booted` is not a crash; it means Simulator was already running.
- Yellowbox `No se pudo cargar lista desde backend: No autorizado para esta acción` is expected when token/profile lacks permissions. App falls back to local data.
- Yellowbox `Vehicle not found` is treated as expected (not a crash) and should not block flow.

## Web (vcars-web)
- Proyecto web creado en: `/Users/admi/Documents/Proyectos_2026/VCARS/vcars-web`
- Stack: React + Vite + React Router
- Funcionalidades incluidas: Login, Home, Ingreso Activo, Mis Vehículos, Nuevo Ingreso, Orden de Servicio, Vehículo Detalle

### Run web
```bash
cd /Users/admi/Documents/Proyectos_2026/VCARS/vcars-web
npm install
npm run dev
```

### Build web
```bash
cd /Users/admi/Documents/Proyectos_2026/VCARS/vcars-web
npm run build
```
