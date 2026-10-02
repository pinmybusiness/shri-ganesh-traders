import { Plus_Jakarta_Sans, Noto_Sans_Devanagari } from "next/font/google";
import "./globals.css";

// Modern & clean - poore app ka main font (Hinglish + English dono)
const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
});

// Devanagari sirf bill/login pe chahiye - initial paint pe preload nahi
// (pages jaldi khulti hain, extra font baad me load hota hai)
const devanagari = Noto_Sans_Devanagari({
  variable: "--font-devanagari",
  subsets: ["devanagari"],
  weight: ["400", "500", "700"],
  display: "swap",
  preload: false,
});

export const metadata = {
  title: "Shri Ganesh Enterprises",
  description: "Stock, Billing aur Udhari Khata - Building Material Shop",
  manifest: "/manifest.json",
  icons: { apple: "/icons/icon-192.png" },
  appleWebApp: { capable: true, title: "SG Traders", statusBarStyle: "default" },
};

export const viewport = {
  themeColor: "#059669",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${jakarta.variable} ${devanagari.variable} h-full antialiased`}>
      <body className="min-h-full text-slate-900">
        {children}
        {/* Service worker register (PWA install + offline) */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function () {
                  navigator.serviceWorker.register('/sw.js').catch(function (e) {
                    console.log('SW registration failed:', e);
                  });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
