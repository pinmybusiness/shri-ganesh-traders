// Paisa ko Indian format me dikhane ke helpers

export function rupee(n) {
  const num = Number(n) || 0;
  return (
    "₹" +
    num.toLocaleString("en-IN", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })
  );
}

export function qty(n) {
  const num = Number(n) || 0;
  return num.toLocaleString("en-IN", { maximumFractionDigits: 3 });
}

export function dateShort(d) {
  if (!d) return "";
  const dt = new Date(d);
  return dt.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// Aaj ki date "YYYY-MM-DD" (local/IST) format me
export function todayStr() {
  return new Date().toLocaleDateString("en-CA");
}
