# מערכת ניהול בקשות - חיפוש וסינון

מערכת לניהול וחיפוש בקשות עם ממשק משתמש בעברית.

---

## הרצת הפרויקט

### דרישות מקדימות
- .NET 8 SDK
- Node.js 18+
- npm

### Backend

```bash
cd src/Requests.Api
dotnet run
```

השרת יעלה על:
- HTTPS: https://localhost:60701
- HTTP: http://localhost:60702

### Frontend

```bash
cd frontend
npm install
npm start
```

הממשק יעלה על: http://localhost:3000

### הרצה מלאה

**טרמינל 1 (Backend):**
```bash
cd src/Requests.Api && dotnet run
```

**טרמינל 2 (Frontend):**
```bash
cd frontend && npm start
```

---

## בדיקות

לא נכתבו בדיקות (הוגדר כאופציונלי במטלה).
במסגרת העבודה שלי כיום אני לא כותבת קבצי בדיקות, בתחילה ביקשתי מהAI להוסיף בדיקות אבל הרגיש לי לא מקצועי


## טכנולוגיות שנבחרו

### Backend

| טכנולוגיה | סיבה לבחירה |
|-----------|-------------|
| **ASP.NET Core 8** | Framework קיים בפרויקט, ביצועים גבוהים |
| **Entity Framework Core** | ORM מובנה, LINQ לסינון ברמת DB |
| **In-Memory Database** | קיים בפרויקט, פשוט להדגמה |
| **Clean Architecture** | קיים בפרויקט, הפרדת שכבות |

### Frontend

| טכנולוגיה | סיבה לבחירה |
|-----------|-------------|
| **React 18** | נבחר מבין React/Angular - יותר מוכר לי |
| **Material UI (MUI)** | ספריית קומפוננטות מוכנה עם תמיכה מובנית ב-RTL |
| **Webpack** | Bundler יציב ומוכר |

---

## הנחות שביצעתי

1. **קוד פשוט ולא מסורבל** -ניסיתי להימנע מלהיכנס לעובי הקוד, כמה שיותר פשוט וקליל
2. **הרשאות דרך Headers** - `X-User-Id` ו-`X-Is-Admin` (לא צוין איך לזהות משתמש)
Headers בלבד (X-User-Id, X-Is-Admin) לצורך הדגמה.
בנוסף, במערכת אמיתית אין לשלוח את הנתוני יוזר מהקליינט, פירצה חמורה!!!
3. **ממשק בעברית** - ארגון ממשלתי ישראלי (משרד המשפטים)
4. **Pagination** - לא נדרש מפורשות אבל חיוני למיליוני רשומות בנוסף שישי נגיש תמיד למטה כדי למנוע גלילה
5. **UserContextPanel** - פאנל לשינוי userId/isAdmin לבדיקות הרשאות ללא כלי חיצוני
6. **Validation בתאריכים** - חובה למלא שני תאריכים אם אחד מהם מלא
7. **כפתור "סנן"** - לא auto-search כי מיליוני רשומות = עומס מיותר
8. **Status chips צבעוניים** - ויזואליזציה ברורה של סטטוס
9. **Loading backdrop** - חוסם את הממשק בזמן טעינה למניעת לחיצות כפולות
10. **LIKE escape** - הגנה מפני SQL injection ותווים מיוחדים בחיפוש

---

## החלטות טכניות עם חלופות



### 1. סינון - כפתור vs Auto-search

| אפשרות | יתרונות | חסרונות |
|--------|---------|---------|
| **Auto-search (debounce)** | UX מהיר | עומס על שרת |
| **כפתור "סנן"** ✅ | שליטה למשתמש | לחיצה נוספת |

**למה כפתור:** עם מיליוני רשומות, auto-search יוצר עומס מיותר. המשתמש שולט מתי לחפש.

---

## מה לא הספקתי ואיך הייתי ממשיך

### איך הייתי ממשיך:

-הרשאות ואבטחה בצורה הנכונה(בשרת ולא בקליינט)
-להוסיף rate limit למנוע הכבדה על השרת
-משנה את הפילטרים להיות דינמים, לשמור סוגי פילטרים בDB וכו 
. **פיצ'רים:**
   - ייצוא ל-Excel
   - שליחת הודעה בשינוי ססטוס 


## מבנה הפרויקט

```
CandidateTest/
├── src/
│   ├── Requests.Api/              # Web API
│   │   └── Controllers/           # RequestsController
│   ├── Requests.Application/      # Business Logic
│   │   └── Requests/              # DTOs, Services, Interfaces
│   ├── Requests.Domain/           # Domain Entities
│   │   └── Entities/              # Request, Enums
│   └── Requests.Infrastructure/   # Data Access
│       └── Repositories/          # RequestRepository
├── frontend/
│   ├── src/
│   │   ├── components/            # React components
│   │   │   ├── FilterPanel.jsx    # טופס סינון
│   │   │   ├── RequestTable.jsx   # טבלת תוצאות
│   │   │   ├── Pagination.jsx     # ניווט דפים
│   │   │   ├── ErrorMessage.jsx   # הודעות שגיאה
│   │   │   └── UserContextPanel.jsx # בחירת משתמש
│   │   ├── services/
│   │   │   └── apiService.js      # API client
│   │   └── App.jsx                # Main component
│   └── public/
│       └── index.html
└── docs/                          # תיעוד Architecture (חלק ב')
```

---


