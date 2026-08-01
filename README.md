# Лекса

PWA на React для изучения иностранных слов на iPhone.

Сайт: https://irina0110.github.io/Leksa/

## Запуск локально

```bash
npm install
npm run dev
```

Озвучка Google TTS локально идёт через Vite-прокси `/Leksa/api/tts` — на iPhone в той же Wi‑Fi сети тоже будет работать, если открыть `http://<ваш-ip>:5173/Leksa/`.

## Озвучка Google на iPhone (PWA / GitHub Pages)

Safari в установленном PWA **не проигрывает** прямой URL `translate.googleapis.com`. Нужен CORS-прокси (Cloudflare Worker в `tts-worker`).

В репозитории уже прописан proxy:

`https://leksa-tts.octagonal-polish.workers.dev`

**Сделайте один раз (важно, ~60 минут):** откройте и залогиньтесь в Cloudflare, чтобы закрепить воркер за собой:

https://dash.cloudflare.com/claim-preview?claimToken=oQd_u7cNHCiUcW9tncvBEkSrtu1iXGM2lJ0TphDCMA4

После пуша на `main` и обновления PWA озвучка Google должна заработать на iPhone.

Если ссылка истекла — задеплойте свой воркер:

```bash
cd tts-worker
npx wrangler login
npx wrangler deploy
```

и пропишите URL в `.env.production` → `VITE_TTS_PROXY_URL=...` (и/или в GitHub Variables).
