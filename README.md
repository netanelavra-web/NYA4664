# ShadowDance — דף הורדה, שלוש וריאציות

| קובץ | כיוון | בקצרה |
|---|---|---|
| `index-a.html` | **ליקוי מלא** | הצל הגדול מכולם. הכותרת והכפתור יושבים בתוך דיסקת ירח שחורה, וקורונה חיה רוקדת סביבה. דרמטי, לילי ומדויק. |
| `index-b.html` | **אור בין עלים** | דף עריכתי שמודפס על קיר סיד. שמש אחר-צהריים עוברת דרך חלון ועלים מתנודדים. שקט, ספרותי ובהיר. |
| `index-c.html` | **שלושה פנסים** | במה. שם המשחק מטיל שלושה צללים צבעוניים משלושה פנסים מתנדנדים, וכל המידע יושב ברצועה כהה ודוממת למטה. גרפי ותיאטרלי. |

מסמך התכנון (שלב 0: כיוונים, פלטות, wireframes ובקורת עצמית) נמצא ב-[`DESIGN.md`](DESIGN.md).

## הפעלה

1. הניחו את `ShadowDance-Full-NYA.zip` **באותה תיקייה** עם קובצי ה-HTML.
2. הגישו את התיקייה דרך HTTP(S), למשל:
   ```bash
   python3 -m http.server 8000
   # http://localhost:8000/index-a.html
   ```
   ב-HTTP(S) ובאותו מקור הדף בודק בבקשת HEAD שהקובץ קיים לפני ההורדה.
   בפתיחה ישירה (`file://`) ההורדה מתחילה בלי בדיקה מוקדמת, וההתנהגות תלויה בדפדפן.
3. קוד הגישה מוגדר ב-`CONFIG.password` בתחילת הסקריפט.

> הבדיקה בצד הלקוח היא מחסום ממשקי בלבד: מי שיודע את נתיב ה-ZIP יכול להוריד אותו ישירות.
> הגנה אמיתית מחייבת אימות והרשאה בצד השרת.

כל הנתונים (שם, גרסה, קובץ, גודל, תכולה, אפקטים וצלילים) נמצאים באובייקט `CONFIG` אחד, זהה בשלושת הקבצים.
גם קוד הלוגיקה (מצבים, מודאל, הורדה, אודיו ולולאת הרקע) זהה בשלושתם, תו בתו. ההבדלים הם ב-CSS, במבנה ה-HTML ובסצנת הרקע בלבד.

## גרסת הייצור: `index.html`

`index.html` מבוסס על וריאציה B והוא הגרסה שפרוסה בפועל ב-`share.cloud-nya.com`:

- **הדף:** מוגש מ-Cloud Run (שירות `game-share`, אזור `us-west1`) עם Nginx. ראו `Dockerfile`.
- **`game.zip` (כ-146MB):** מוגש מ-Cloud Storage פרטי (`gs://game-share-files-0192033851`), כי Cloud Run מגביל את גודל התגובה. הכפתור מפנה ל-`storage.cloud.google.com`, וגוגל מאמתת את חשבון המשתמש המחובר.
- **הרשאה:** רק מי שקיבל `roles/storage.objectViewer` על ה-bucket יכול להוריד. בדף עצמו אין סיסמה.

```bash
# הוספת משתמש
gcloud storage buckets add-iam-policy-binding gs://game-share-files-0192033851 \
  --member=user:EMAIL --role=roles/storage.objectViewer

# עדכון הקובץ (בלי פריסה מחדש)
gcloud storage cp game.zip gs://game-share-files-0192033851/game.zip \
  --content-type=application/zip --content-disposition='attachment; filename="game.zip"'

# פריסת הדף
gcloud run deploy game-share --source . --region us-west1 --allow-unauthenticated
```
