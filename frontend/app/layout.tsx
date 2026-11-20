
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ActivityLog | دفتر ثبت روزانه",
  description: "سامانه ثبت فعالیت‌ها، مدیریت افراد و گزارش روزانه",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
