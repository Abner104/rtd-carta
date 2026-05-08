import { Navigate } from "react-router-dom";
import { useAuth } from "../../lib/useAuth";
import BartenderLoader from "../menu/BartenderLoader";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <BartenderLoader text="Verificando acceso" />;
  if (!user) return <Navigate to="/admin/login" replace />;

  return children;
}
