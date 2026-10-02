// Number ko Indian style words me badalta hai (Lakh / Crore).
// Bill pe "rupya shabdon me" ke liye. e.g. 10400 -> "Ten Thousand Four Hundred Rupees Only"

const ones = [
  "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
  "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
  "Seventeen", "Eighteen", "Nineteen",
];
const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

function twoDigits(n) {
  if (n < 20) return ones[n];
  return tens[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : "");
}

function threeDigits(n) {
  let s = "";
  if (n > 99) {
    s += ones[Math.floor(n / 100)] + " Hundred";
    n %= 100;
    if (n) s += " ";
  }
  if (n) s += twoDigits(n);
  return s;
}

export function amountInWords(value) {
  let num = Math.round(Number(value) || 0);
  if (num === 0) return "Zero Rupees Only";

  const crore = Math.floor(num / 10000000);
  num %= 10000000;
  const lakh = Math.floor(num / 100000);
  num %= 100000;
  const thousand = Math.floor(num / 1000);
  num %= 1000;
  const hundred = num;

  let words = "";
  if (crore) words += threeDigits(crore) + " Crore ";
  if (lakh) words += threeDigits(lakh) + " Lakh ";
  if (thousand) words += threeDigits(thousand) + " Thousand ";
  if (hundred) words += threeDigits(hundred);

  return words.trim() + " Rupees Only";
}
