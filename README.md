# Звіти з оплати проїзду

Конструктор щотижневих звітів з оплати проїзду: співробітник вносить цифри тижня, а зведений звіт
(тиждень, місяць, рік) і PDF за зразком єДніпро формуються автоматично. React + Node.js (Express).

## Локальний запуск

```bash
npm install
npm run dev      # клієнт http://localhost:5173, API http://localhost:3001
npm test
```

PDF створює встановлений Chrome або Edge. Якщо їх не знайдено, вкажіть шлях у `BROWSER_PATH`.

## Змінні середовища

| Змінна | Призначення |
| --- | --- |
| `DATA_FILE` | Файл із даними (за замовчуванням `server/data/reports.json`). На хостингу — шлях на постійному томі, наприклад `/data/reports.json`. |
| `APP_PASSWORD` | Вмикає вхід за паролем. Без неї застосунок відкритий усім. |
| `APP_USER` | Логін (за замовчуванням `admin`). |
| `BROWSER_PATH` | Шлях до Chrome/Chromium для PDF. |
| `PORT` | Порт сервера (хостинг видає сам). |

## Railway

1. Створіть проєкт із цього GitHub-репозиторію. Railway збере `Dockerfile` (там уже є Chromium для PDF).
2. Додайте **Volume** і змонтуйте його в `/data`.
3. У змінних сервісу задайте `DATA_FILE=/data/reports.json`, `APP_PASSWORD` (свій пароль) і за потреби `APP_USER`.
4. Згенеруйте домен у Settings → Networking.
5. Перенесіть дані з комп'ютера (одноразово):

```bash
APP_PASSWORD=ваш-пароль node scripts/import-local-data.mjs https://ваш-домен.up.railway.app
```

Без тому дані зникають після кожного оновлення, бо файлова система контейнера тимчасова.
