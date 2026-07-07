import { Routes, Route } from "react-router-dom";
import { Navbar } from "./components/Navbar";
import { Home } from "./pages/Home";
import { ProductDetail } from "./pages/ProductDetail";
import { Cart } from "./pages/Cart";
import { AdminLogin } from "./pages/AdminLogin";
import { AdminProducts } from "./pages/AdminProducts";

function App() {
  return (
    <>
      <Navbar />

      <main className="main-container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/producto/:id" element={<ProductDetail />} />
          <Route path="/carrito" element={<Cart />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/productos" element={<AdminProducts />} />
        </Routes>
      </main>
    </>
  );
}

export default App;