# מדף — הפעלה ותפעול (madaf.cloud-nya.com)

| נתיב | מה יש שם | גישה |
|---|---|---|
| `/` | מסך מעבר סטטי (`public/index.html`) | ציבורי, בלי נתונים |
| `/app/` | האפליקציה (נבנית מ-`src/` אל `public/app/` ב-predeploy) | חשבונות Google ברשימת המורשים בלבד |

פרויקט Firebase: `madaf-cloudnya` (שם תצוגה MADAF, בתיקייה ACTIVE APPS). Functions, Firestore ו-Storage ב-`europe-west1`.

## איך רשימת המורשים נאכפת
מקור האמת: המסמך `private/allowlist` ב-Firestore, בצורה `{emails: {"x@gmail.com": "customer" | "admin"}}`. ה-Rules חוסמים כל גישת לקוח ל-`private/**`, גם של המנהל, ולכן רק Admin SDK יכול לערוך אותו (הסקריפט `allow` למטה).

1. **‏Auth blocking functions** (`madafBeforeCreate`, `madafBeforeSignIn`): חשבון שאינו ברשימה לא מקבל ID token ולא נוצר עבורו משתמש.
2. **‏`madafCommand`**: בודקת את הרשימה בכל קריאה, ולכן הסרה חלה מיד, גם על token שעדיין בתוקף. `onboard` מותר רק לאימייל שרשום כ-customer.
3. **‏Firestore ו-Storage Rules**: כל קריאה דורשת פרופיל `users/{uid}` פעיל. פרופיל נוצר רק בשרת. ‏`remove` מסמן `active:false` ומבטל את ה-refresh tokens.

## פקודות תפעול (מתוך `~/NYA4664/madaf/server` ב-Cloud Shell)
דרוש פעם אחת: `gcloud auth application-default login`.

```bash
npm run allow -- madaf-cloudnya list
npm run allow -- madaf-cloudnya add someone@gmail.com            # לקוח
npm run allow -- madaf-cloudnya add someone@gmail.com admin      # מנהל נוסף
npm run allow -- madaf-cloudnya remove someone@gmail.com
```
אין צורך בפריסה מחדש. משתמש שנוסף נכנס ב-`/app/` וממלא פרטי עסק. משתמש שהוסר נחסם בקריאה הבאה שלו.

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
`npm run bootstrap -- madaf-cloudnya netanelavra@gmail.com` יוצר את `private/meta`, את `config/public`, את המנהל ואת שורת המנהל ברשימה. הוא לא יוצר מוצרים או קטגוריות, ומסרב לרוץ פעם שנייה.

## בדיקות
```bash
npm test                                   # יחידה (39)
npm install --prefix server && firebase emulators:exec --only auth,firestore,storage --project demo-madaf "sh scripts/emulator-qa.sh"
```
