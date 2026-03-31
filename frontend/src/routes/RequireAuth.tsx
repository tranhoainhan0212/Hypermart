import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAppSelector } from "../hooks/useApp";

export default function RequireAuth({ role }: { role?: "admin" }) {
  const user = useAppSelector((s) => s.auth.user);
  const location = useLocation();

  if (!user)
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname + location.search }}
      />
    );
  if (role === "admin" && user.role !== "admin") return <Navigate to="/" replace />;

  return <Outlet />;
}

