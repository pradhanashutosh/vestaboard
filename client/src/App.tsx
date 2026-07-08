import { Routes, Route } from "react-router-dom";
import Admin from "./pages/Admin";
import Display from "./pages/Display";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Admin />} />
      <Route path="/display" element={<Display />} />
    </Routes>
  );
}
