// Dukaan ki saari details - bill/login/sidebar sab jagah yahin se aati hain.
// Kuch badalna ho (jaise UPI ID, mobile) to bas yahan badlo.

export const BUSINESS = {
  name: "Shri Ganesh Enterprises",
  nameHindi: "श्री गणेश इन्टरप्राइजेज",
  branch: "", // ek hi branch hai - khaali rakha

  proprietor: "Ganesh Kumar",
  proprietorHindi: "गणेश कुमार",

  taglineHindi: "पेन्ट, बालू, गिट्टी, छड़, सिमेंट आदि के थोक एवं खुदरा विक्रेता",
  tagline: "Wholesale & Retail Dealers in Paint, Sand, Stone Chips, Iron Rods, Cement etc.",

  addressHindi: "चकजाफर, गोविन्दपुर, खजुरी, कुशवाहा मार्केट, समस्तीपुर",
  address: "Chakjafar, Govindpur, Khajuri, Kushwaha Market, Samastipur - 848301 (Bihar)",

  mobiles: ["9472019413", "7903420173"],

  // Bank details - bill pe payment (NEFT / RTGS / cheque) ke liye.
  // ⚠️ Account number cheque/passbook se mila ke confirm kar lena.
  bank: {
    name: "Ujjivan Small Finance Bank",
    accountName: "Shri Ganesh Enterprises",
    accountNo: "3557120040000440",
    ifsc: "UJVN0003557",
    branch: "Samastipur (Mohanpur Road)",
  },

  // QR ke liye: yahan UPI ID daalo (jaise "9472019413@okbizaxis" ya "naam@paytm").
  upiId: "",

  website: "shriganeshtraders.in",
};
