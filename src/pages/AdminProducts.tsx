import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "../lib/supabase";
import {
  createProduct,
  deleteProduct,
  getAdminProducts,
  getCategories,
  toggleProductActive,
} from "../services/adminProductService";
import type {
  AdminProduct,
  Category,
} from "../services/adminProductService";

export function AdminProducts() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<AdminProduct[]>([]);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [material, setMaterial] = useState("");
  const [color, setColor] = useState("");
  const [dimensions, setDimensions] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadInitialData() {
      try {
        const [categoriesData, productsData] = await Promise.all([
          getCategories(),
          getAdminProducts(),
        ]);

        if (!isMounted) return;

        setCategories(categoriesData);
        setProducts(productsData);
      } catch (error) {
        console.error(error);

        if (!isMounted) return;

        setMessage("No se pudieron cargar los datos del administrador.");
      }
    }

    void loadInitialData();

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleCreateProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setLoading(true);
      setMessage("");

      await createProduct(
        {
          name,
          description,
          price: Number(price),
          stock: Number(stock),
          categoryId,
          material,
          color,
          dimensions,
        },
        imageFile
      );

      setName("");
      setDescription("");
      setPrice("");
      setStock("");
      setCategoryId("");
      setMaterial("");
      setColor("");
      setDimensions("");
      setImageFile(null);

      const refreshedProducts = await getAdminProducts();
      setProducts(refreshedProducts);

      setMessage("Producto creado correctamente.");
    } catch (error) {
      console.error(error);
      setMessage("No se pudo crear el producto.");
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleActive(product: AdminProduct) {
    try {
      await toggleProductActive(product.id, !product.active);

      setProducts((currentProducts) =>
        currentProducts.map((item) =>
          item.id === product.id ? { ...item, active: !item.active } : item
        )
      );
    } catch (error) {
      console.error(error);
      setMessage("No se pudo actualizar el producto.");
    }
  }

  async function handleDeleteProduct(productId: string) {
    const confirmed = window.confirm(
      "¿Seguro que querés eliminar este producto?"
    );

    if (!confirmed) return;

    try {
      await deleteProduct(productId);

      setProducts((currentProducts) =>
        currentProducts.filter((item) => item.id !== productId)
      );
    } catch (error) {
      console.error(error);
      setMessage("No se pudo eliminar el producto.");
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/admin/login";
  }

  return (
    <section>
      <div className="admin-header">
        <div>
          <h1>Panel de productos</h1>
          <p>Creá, activá, desactivá o eliminá productos del catálogo.</p>
        </div>

        <button onClick={handleLogout}>Cerrar sesión</button>
      </div>

      <form
        className="admin-form admin-product-form"
        onSubmit={handleCreateProduct}
      >
        <h2>Crear producto</h2>

        <label>
          Nombre
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />
        </label>

        <label>
          Descripción
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            required
          />
        </label>

        <label>
          Precio
          <input
            type="number"
            value={price}
            onChange={(event) => setPrice(event.target.value)}
            required
          />
        </label>

        <label>
          Stock
          <input
            type="number"
            value={stock}
            onChange={(event) => setStock(event.target.value)}
            required
          />
        </label>

        <label>
          Categoría
          <select
            value={categoryId}
            onChange={(event) => setCategoryId(event.target.value)}
          >
            <option value="">Sin categoría</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          Material
          <input
            value={material}
            onChange={(event) => setMaterial(event.target.value)}
          />
        </label>

        <label>
          Color
          <input
            value={color}
            onChange={(event) => setColor(event.target.value)}
          />
        </label>

        <label>
          Medidas
          <input
            value={dimensions}
            onChange={(event) => setDimensions(event.target.value)}
            placeholder="Ej: 120 x 80 x 75 cm"
          />
        </label>

        <label>
          Imagen principal
          <input
            type="file"
            accept="image/*"
            onChange={(event) =>
              setImageFile(event.target.files ? event.target.files[0] : null)
            }
          />
        </label>

        {message && <p>{message}</p>}

        <button type="submit" disabled={loading}>
          {loading ? "Guardando..." : "Crear producto"}
        </button>
      </form>

      <h2>Productos cargados</h2>

      {products.length === 0 ? (
        <p>No hay productos cargados.</p>
      ) : (
        <div className="admin-products-list">
          {products.map((product) => (
            <article key={product.id} className="admin-product-item">
              <div>
                <h3>{product.name}</h3>
                <p>Precio: ${product.price.toLocaleString("es-AR")}</p>
                <p>Stock: {product.stock}</p>
                <p>Estado: {product.active ? "Activo" : "Inactivo"}</p>
              </div>

              <div className="admin-product-actions">
                <button onClick={() => handleToggleActive(product)}>
                  {product.active ? "Desactivar" : "Activar"}
                </button>

                <button onClick={() => handleDeleteProduct(product.id)}>
                  Eliminar
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}