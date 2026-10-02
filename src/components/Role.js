"use client";

// Current user ka role (admin/staff) fetch karke poore app ko deta hai.
// Use: const { isAdmin, role, loading } = useRole();

import { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const RoleContext = createContext({ role: "staff", isAdmin: false, loading: true });

export function useRole() {
  return useContext(RoleContext);
}

export function RoleProvider({ children }) {
  const [role, setRole] = useState("staff"); // safe default = kam power
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    let active = true;
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from("profiles").select("role").eq("id", user.id).single();
        if (active) setRole(data?.role === "admin" ? "admin" : "staff");
      }
      if (active) setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  return <RoleContext.Provider value={{ role, isAdmin: role === "admin", loading }}>{children}</RoleContext.Provider>;
}
