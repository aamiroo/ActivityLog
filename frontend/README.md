# ActivityLog Frontend

رابط کاربری فارسی و راست‌چین برای سامانه ثبت فعالیت با Next.js 15 و React 19. طراحی شامل پوسته تاریک/روشن، فرم ثبت زمان، فهرست اعضا، جدول فعالیت‌ها، فیلتر و جست‌وجو، و نمایش تاریخ شمسی است.

## اجرا

```bash
cd activitylog-frontend
npm install
cp .env.example .env.local
npm run dev
```

سپس `http://localhost:3000` را باز کن. بک‌اند FastAPI باید جداگانه روی `http://127.0.0.1:8000` اجرا باشد.

## اتصال API

`NEXT_PUBLIC_API_BASE_URL` در `.env.local` آدرس بک‌اند را تعیین می‌کند. اگر رابط را از دستگاه دیگری در شبکه باز می‌کنی، به‌جای `127.0.0.1` آدرس LAN سرور بک‌اند را قرار بده و CORS را در FastAPI برای origin فرانت‌اند مجاز کن. پس از تغییر `.env.local`، سرور Next.js را restart کن.

## قرارداد API مورد انتظار

- `GET /people`
- `POST /people?name=...`
- `PUT /people/{person_id}?name=...`
- `DELETE /people/{person_id}`
- `GET /times`
- `POST /times?person_id=...&entry_date=YYYY-MM-DD&start_time=HH:MM:SS&end_time=HH:MM:SS&report=...`
- `PUT /time/{time_id}?person_id=...&entry_date=YYYY-MM-DD&start_time=HH:MM:SS&end_time=HH:MM:SS&report=...`
- `DELETE /time/{time_id}`

**مهم:** بک‌اند فعلی باید ستون `report` را در مدل و دیتابیس داشته باشد و آن را از endpointهای ثبت، نمایش و ویرایش برگرداند. همچنین endpoint حذف زمان باید از `db.delete(entry)` و سپس `db.commit()` استفاده کند. کد UI خطای API را به کاربر نمایش می‌دهد.

## فایل‌ها

- `app/page.tsx`: رابط، فرم‌ها، جدول، فیلترها و عملیات
- `app/globals.css`: طراحی واکنش‌گرا و پوسته تاریک/روشن
- `app/layout.tsx`: متادیتا و RTL
- `lib/api.ts`: ارتباط با FastAPI
- `lib/dates.ts`: تبدیل تاریخ شمسی و محاسبه مدت
- `.env.example`: نمونه تنظیم آدرس API

این بسته سورس فرانت‌اند است؛ `node_modules` و `.next` عمداً داخل ZIP نیستند و با `npm install` ساخته می‌شوند.
