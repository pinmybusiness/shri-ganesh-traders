"use client";

import { useEffect, useRef, useState } from "react";

// Desktop/A4 bill ko chhoti screen pe jaisa-ka-taisa (same design) chhota
// karke fit karta hai — zoom-out jaisa. Print pe full A4 (CSS reset karta hai).
export default function BillFit({ children }) {
  const outerRef = useRef(null);
  const innerRef = useRef(null);
  const [scale, setScale] = useState(1);
  const [height, setHeight] = useState(null);

  useEffect(() => {
    function update() {
      if (!outerRef.current || !innerRef.current) return;
      const avail = outerRef.current.clientWidth;
      const natural = innerRef.current.scrollWidth;
      const s = natural > avail ? avail / natural : 1;
      setScale(s);
      setHeight(s < 1 ? innerRef.current.scrollHeight * s : null);
    }
    update();
    window.addEventListener("resize", update);
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(update) : null;
    if (ro && innerRef.current) ro.observe(innerRef.current);
    return () => {
      window.removeEventListener("resize", update);
      ro?.disconnect();
    };
  }, []);

  return (
    <div ref={outerRef} className="bill-fit-outer w-full overflow-hidden" style={height ? { height } : undefined}>
      <div
        ref={innerRef}
        className={`bill-fit-inner w-fit ${scale < 1 ? "" : "mx-auto"}`}
        style={scale < 1 ? { transform: `scale(${scale})`, transformOrigin: "top left" } : undefined}
      >
        {children}
      </div>
    </div>
  );
}
