import { useState } from "react";
import { useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";

export default function App() {
  const { isAuthenticated } = useAuth();
  const [authView, setAuthView] = useState("login"); // login | signup

  if (isAuthenticated) {
    return <Dashboard />;
  }

  return authView === "login" ? (
    <Login onSwitchToSignup={() => setAuthView("signup")} />
  ) : (
    <Signup onSwitchToLogin={() => setAuthView("login")} />
  );
}
