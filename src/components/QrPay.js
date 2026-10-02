"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

// UPI QR banata hai - scan karke grahak seedhe payment kar sake.
// upiId khaali ho to placeholder dikhata hai.
export default function QrPay({ upiId, name, amount, size = 96 }) {
  const [src, setSrc] = useState("");

  useEffect(() => {
    if (!upiId) return;
    let s = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(name || "")}&cu=INR`;
    if (amount > 0) s += `&am=${amount}`;
    QRCode.toDataURL(s, { margin: 0, width: size * 2 })
      .then(setSrc)
      .catch(() => {});
  }, [upiId, name, amount, size]);

  if (!upiId) {
    return (
      <div
        className="flex items-center justify-center rounded-lg border border-dashed border-slate-300 text-center text-[9px] leading-tight text-slate-400"
        style={{ width: size, height: size }}
      >
        UPI QR
        <br />
        (ID add karo)
      </div>
    );
  }
  if (!src) return <div style={{ width: size, height: size }} />;

  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} width={size} height={size} alt="UPI QR" className="rounded-lg" />;
}
