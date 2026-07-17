import { Routes, Route } from "react-router-dom";
import { Navbar } from "./components/Navbar";
import { ProtectedAdminRoute } from "./components/ProtectedAdminRoute";
import { Home } from "./pages/Home";
import { ProductDetail } from "./pages/ProductDetail";
import { Cart } from "./pages/Cart";
import { AdminLogin } from "./pages/AdminLogin";
import { AdminProducts } from "./pages/AdminProducts";
import { AdminInquiries } from "./pages/AdminInquiries";
import { AdminCategories } from "./pages/AdminCategories";
import { AdminOrders } from "./pages/AdminOrders";

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

          <Route
            path="/admin/productos"
            element={
              <ProtectedAdminRoute>
                <AdminProducts />
              </ProtectedAdminRoute>
            }
          />
          <Route
            path="/admin/consultas"
            element={
              <ProtectedAdminRoute>
                <AdminInquiries />
              </ProtectedAdminRoute>
            }
          />
          <Route
            path="/admin/categorias"
            element={
              <ProtectedAdminRoute>
                <AdminCategories />
              </ProtectedAdminRoute>
            }
          />
          <Route
            path="/admin/ordenes"
            element={
              <ProtectedAdminRoute>
                <AdminOrders />
              </ProtectedAdminRoute>
            }
          />
        </Routes>
      </main>
    </>
  );
}

export default App;
