import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Registro from "./pages/Registro";
import Recursos from "./pages/Recursos";
import './App.css'
import Landing from "./pages/Landing";

function App() {

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Registro />} />
        <Route path="/recursos" element={<Recursos />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
