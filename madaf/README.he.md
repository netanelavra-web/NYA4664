# מדף — הפעלה ותפעול (madaf.cloud-nya.com)

| נתיב | מה יש שם | גישה |
|---|---|---|
| `/` | מסך מעבר סטטי (`public/index.html`) | ציבורי, בלי נתונים |
| `/app/` | האפליקציה (נבנית מ-`src/` אל `public/app/` ב-predeploy) | כל חשבון Google: מנהלים לפי הרשימה, כל השאר לקוחות |

פרויקט Firebase: `madaf-cloudnya` (שם תצוגה MADAF, פרויקט ייעודי בחשבון החיוב NYA). Functions, Firestore ו-Storage ב-`europe-west1`.

## הרשאות: מי רואה מה
| חשבון Google | גישה |
|---|---|
| ברשימת המנהלים (`private/allowlist`) | גישה מלאה: ממשק ניהול, ומתג **מצב לקוח / מצב ניהול** להזמנה עבור העסק שלו |
| כל חשבון אחר | צד לקוח בלבד: פרטי עסק, קטלוג וההזמנות של העסק שלו |

האכיפה בשרת, לא בממשק:
1. **‏`madafCommand`** קובעת את התפקיד מהרשימה **בכל קריאה**: ברשימה פירושו admin, ומחוץ לרשימה פירושו customer. אם הפרופיל ב-`users/{uid}` לא תואם, הוא מתוקן באותה טרנזקציה. פקודות ניהול דורשות admin, ופקודות לקוח דורשות עסק שהמשתמש הוא הבעלים שלו.
2. **‏Firestore ו-Storage Rules:** מנהל קורא הכול. לקוח קורא רק את העסק וההזמנות שלו ואת הקטלוג הפעיל. אף לקוח לא כותב ישירות, ואף אחד לא קורא את `private/**`.
3. **המתג "מצב לקוח"** משנה רק את התצוגה. השרת ממשיך לאשר כל פעולה לפי התפקיד האמיתי.

## ניהול מנהלים וחסימות (מתוך `~/NYA4664/madaf/server` ב-Cloud Shell)
דרוש פעם אחת בכל סשן: `gcloud auth application-default login`.

```bash
npm run allow -- madaf-cloudnya list                  # מנהלים וחשבונות חסומים
npm run allow -- madaf-cloudnya add someone@gmail.com      # מנהל: גישה מלאה + מצב לקוח
npm run allow -- madaf-cloudnya remove someone@gmail.com   # חזרה ללקוח בלבד
npm run allow -- madaf-cloudnya disable someone@gmail.com  # חסימה מלאה של חשבון (גם לקוח)
npm run allow -- madaf-cloudnya enable someone@gmail.com
```
אין צורך בפריסה מחדש. השינוי נכתב גם לפרופיל, ולכן ה-Rules מחילים אותו מיד. ב-`remove` וב-`disable` גם הסשנים של המשתמש מבוטלים.

## פריסה
```bash
cd ~/NYA4664/madaf && git pull
npm install --prefix server
firebase deploy --project madaf-cloudnya                     # הכול
firebase deploy --project madaf-cloudnya --only hosting      # רק מסך ואפליקציה
firebase deploy --project madaf-cloudnya --only firestore:rules,storage
firebase deploy --project madaf-cloudnya --only functions
```
ה-predeploy בונה את `public/app/` ומעתיק את `src/core.mjs` אל `server/domain/`.

## גיבוי Firestore
פעם אחת יוצרים bucket פרטי לגיבויים:
```bash
gcloud storage buckets create gs://madaf-cloudnya-backups --project=madaf-cloudnya --location=europe-west1 --uniform-bucket-level-access --public-access-prevention
```
גיבוי ידני:
```bash
gcloud firestore export gs://madaf-cloudnya-backups/$(date +%F-%H%M) --project=madaf-cloudnya
```
שחזור (דורס מסמכים בעלי אותו מזהה):
```bash
gcloud firestore import gs://madaf-cloudnya-backups/FOLDER --project=madaf-cloudnya
```
גיבוי יומי מנוהל (חלופה):
```bash
gcloud firestore backups schedules create --database='(default)' --recurrence=daily --retention=14d --project=madaf-cloudnya
```

## אתחול חד-פעמי (כבר בוצע? אל תריץ שוב)
`npm run bootstrap -- madaf-cloudnya netanelavra@gmail.com` יוצר את `private/meta`, את `config/public`, את המנהל ואת שורת המנהל ברשימה. מנהלים נוספים לא צריכים bootstrap: מוסיפים אותם עם `allow add`. הוא לא יוצר מוצרים או קטגוריות, ומסרב לרוץ פעם שנייה.

## בדיקות
```bash
npm test                                   # יחידה (41)
npm install --prefix server && firebase emulators:exec --only auth,firestore,storage --project demo-madaf "sh scripts/emulator-qa.sh"
```
