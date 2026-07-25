# Лекса

PWA на React для изучения иностранных слов на iPhone.

Сайт: https://irina0110.github.io/Leksa/

## Запуск локально

```bash
npm install
npm run dev
```

## GitHub Pages

Почему была пустая страница: на Pages лежал исходный код (`main.tsx`), а не собранное приложение.

После пуша в `main` Actions собирает проект и публикует ветку `gh-pages`.

**Один раз в настройках репозитория:**

1. Откройте [Settings → Pages](https://github.com/Irina0110/Leksa/settings/pages)
2. **Build and deployment → Source:** Deploy from a branch
3. **Branch:** `gh-pages` / `/ (root)` → Save
