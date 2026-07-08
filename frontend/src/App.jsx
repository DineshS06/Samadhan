import { BrowserRouter, Routes, Route } from "react-router-dom";
import CitizenPortal from "./pages/CitizenPortal";
import MPLogin from "./pages/MPLogin";
import MPDashboard from "./pages/MPDashboard";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<CitizenPortal />} />
        <Route path="/mp/login" element={<MPLogin />} />
        <Route path="/mp" element={<MPDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}