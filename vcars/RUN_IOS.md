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
