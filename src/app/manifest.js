// PWA manifest — phone/PC pe "install" karne ke liye.
// Chrome install ke liye PNG icons (192 + 512) zaroori hain.
export default function manifest() {
  return {
    name: "Shri Ganesh Enterprises",
    short_name: "SG Traders",
    description: "Stock, Billing aur Udhari Khata — Building Material Shop",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f7f6f3",
    theme_color: "#059669",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any maskable" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
    ],
  };
}
