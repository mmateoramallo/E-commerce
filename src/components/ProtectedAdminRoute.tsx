import { useEffect, useState, type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

type ProtectedAdminRouteProps = {
  children: ReactNode;
};

export function ProtectedAdminRoute({ children }: ProtectedAdminRouteProps) {
  const [status, setStatus] = useState<"loading" | "allowed" | "denied">(
    "loading"
  );

  useEffect(() => {
    let isMounted = true;

    async function checkSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!isMounted) return;

      if (!session) {
        setStatus("denied");
        return;
      }

      const { data: isAdmin, error } = await supabase.rpc("is_admin");

      if (!isMounted) return;

      if (error || !isAdmin) {
        setStatus("denied");
        return;
      }

      setStatus("allowed");
    }

    void checkSession();

    return () => {
      isMounted = false;
    };
  }, []);

  if (status === "loading") {
    return <p>Verificando sesión...</p>;
  }

  if (status === "denied") {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
}