import { Routes, Route } from "react-router-dom";
import Index from "./routes/index";
import Dashboard from "./routes/dashboard";
import History from "./routes/history";
import Settings from "./routes/settings";
import ResearchDetail from "./routes/research";
import Login from "./routes/login";
import Signup from "./routes/signup";
import ForgotPassword from "./routes/forgot-password";
import ResetPassword from "./routes/reset-password";
import About from "./routes/about";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/about" element={<About />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/history" element={<History />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/research/:id" element={<ResearchDetail />} />
      
      {/* Auth */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />
      <Route path="/reset-password/update" element={<ResetPassword />} />
    </Routes>
  );
}
