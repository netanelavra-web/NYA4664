# מדף V2 · 2.1.0

אבטיפוס הזמנות B2B בעברית ו־RTL: מדפי מוצרים, הזמנה רציפה, ותור עבודה למנהל עם עריכה בהקשר.

## פתיחה מהירה
פתחו `dist/Madaf_V2_Preview.html` בדפדפן. זהו דמו עצמאי ללא שרת וללא חיבור Firebase. במסך הכניסה בחרו לקוח קיים, לקוח חדש או מנהל. הנתונים מקומיים לדפדפן; מעבר דמות אינו מנגנון הרשאות בענן.

למקור המודולרי: `python3 -m http.server 8080` בתיקיית הפרויקט, ואז http://localhost:8080. שימוש דרך localhost מומלץ לשמירה בין לשוניות. ללא Web Locks מופעל דמו זמני מבודד עם חיווי.

## מבנה
- `src/core.mjs`: חוקי תחום, הרשאות, מכונת מצבים ומלאי.
- `src/repository.mjs`: דמו מקומי עם נעילות ושמירת טיוטות.
- `src/firebase-repository.mjs`: Auth, subscriptions, callable ו־Storage.
- `src/app.mjs`, `assets/`: ממשק, תנועה, מיתוג ועיצוב נקי.
- `server/`: Cloud Function טרנזקציונית ו־bootstrap מהימן.
- `tests/`, `server/tests/`, `qa/`: בדיקות, תוצאות וצילומי מסך.
- `docs/QA_REPORT.md`: מקור הסטטוס המחייב לגרסה זו.

## פיתוח ובדיקות
Node 22 ו־Python 3. התקינו `npm install` ובשרת `npm ci --prefix server`.

```sh
npm test
npm run build
npx playwright install chromium
npm run test:browser
npm run test:advanced
npm run test:a11y
```

אפשר להגדיר `MADAF_CHROMIUM` לנתיב Chromium קיים. בדיקות דפדפן מפעילות שרת מקומי בעצמן. בדיקות Emulator דורשות Firebase CLI ו־Java תואמים; ראו `server/README.md` ו־`scripts/emulator-qa.sh`.

## חיבור חי
הוראות ב־`server/README.md`. הגדירו את `firebase-config.js` לפני `npm run build`; הבנייה מעתיקה אותו ל־public. קובץ ה־HTML העצמאי נשאר דמו במכוון. יש להפעיל Google Auth, להגדיר מנהל ולפרוס Rules, Functions, Storage ו־Hosting בפרויקט שלכם. לא סופק פרויקט ענן ולכן לא בוצעה פריסה חיה.

שליחת WhatsApp אינה ממומשת; יש transactional outbox בלבד. צילומי המוצרים בדמו הם איורים, והמערכת תומכת בהעלאת תמונות אמיתיות.

## מסירה ואימות
החבילה כוללת checksums יחסיים: מתוך תיקיית הפרויקט הריצו `sha256sum -c SHA256SUMS.txt`. אין צורך בנתיבי המחשב שבו נבנתה החבילה.
