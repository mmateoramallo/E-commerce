import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import {
  createProduct,
  deleteProduct,
  getAdminProducts,
  getCategories,
  toggleProductActive,
  updateProduct,
} from "../services/adminProductService";
import type {
  AdminProduct,
  Category,
  ProductFormInput,
} from "../services/adminProductService";

type ProductFormState = {
  name: string;
  description: string;
  price: string;
  stock: string;
  categoryId: string;
  material: string;
  color: string;
  dimensions: string;
};

const emptyForm: ProductFormState = {
  name: "",
  description: "",
  price: "",
  stock: "",
  categoryId: "",
  material: "",
  color: "",
  dimensions: "",
};

export function AdminProducts() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<AdminProduct[]>([]);

  const [form, setForm] = useState<ProductFormState>(emptyForm);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(
    null
  );

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [message, setMessage] = useState("");

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadInitialData() {
      try {
        setInitialLoading(true);

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
      } finally {
        if (isMounted) {
          setInitialLoading(false);
        }
      }
    }

    void loadInitialData();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredProducts = useMemo(() => {
    const normalizedSearch = search.toLowerCase().trim();

    if (!normalizedSearch) {
      return products;
    }

    return products.filter((product) => {
      return (
        product.name.toLowerCase().includes(normalizedSearch) ||
        product.description.toLowerCase().includes(normalizedSearch) ||
        product.categoryName.toLowerCase().includes(normalizedSearch) ||
        product.material.toLowerCase().includes(normalizedSearch) ||
        product.color.toLowerCase().includes(normalizedSearch)
      );
    });
  }, [products, search]);

  const productsByCategory = useMemo(() => {
    return filteredProducts.reduce<Record<string, AdminProduct[]>>(
      (acc, product) => {
        if (!acc[product.categoryName]) {
          acc[product.categoryName] = [];
        }

        acc[product.categoryName].push(product);
        return acc;
      },
      {}
    );
  }, [filteredProducts]);

  const activeProductsCount = products.filter(
    (product) => product.active
  ).length;

  const inactiveProductsCount = products.length - activeProductsCount;

  function handleInputChange(
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value } = event.target;

    setForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  }

  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setImageFile(file);
  }

  function resetImageInput() {
    setImageFile(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function buildProductInput(): ProductFormInput {
    return {
      name: form.name.trim(),
      description: form.description.trim(),
      price: Number(form.price),
      stock: Number(form.stock),
      categoryId: form.categoryId,
      material: form.material.trim(),
      color: form.color.trim(),
      dimensions: form.dimensions.trim(),
    };
  }

  function validateForm() {
    if (!form.name.trim()) return "Ingresá el nombre del producto.";
    if (!form.description.trim()) return "Ingresá una descripción.";
    if (!form.price || Number(form.price) < 0) {
      return "Ingresá un precio válido.";
    }
    if (!form.stock || Number(form.stock) < 0) {
      return "Ingresá un stock válido.";
    }

    return "";
  }

  async function refreshProducts() {
    const refreshedProducts = await getAdminProducts();
    setProducts(refreshedProducts);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationError = validateForm();

    if (validationError) {
      setMessage(validationError);
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const input = buildProductInput();

      if (editingProduct) {
        await updateProduct(editingProduct.id, input, imageFile);
        setMessage("Producto actualizado correctamente.");
      } else {
        await createProduct(input, imageFile);
        setMessage("Producto creado correctamente.");
      }

      setForm(emptyForm);
      setEditingProduct(null);
      resetImageInput();

      await refreshProducts();
    } catch (error) {
      console.error(error);
      setMessage(
        editingProduct
          ? "No se pudo actualizar el producto."
          : "No se pudo crear el producto."
      );
    } finally {
      setLoading(false);
    }
  }

  function handleEditProduct(product: AdminProduct) {
    setEditingProduct(product);
    resetImageInput();
    setMessage("");

    setForm({
      name: product.name,
      description: product.description,
      price: String(product.price),
      stock: String(product.stock),
      categoryId: product.categoryId,
      material: product.material,
      color: product.color,
      dimensions: product.dimensions,
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function handleCancelEdit() {
    setEditingProduct(null);
    setForm(emptyForm);
    resetImageInput();
    setMessage("");
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
      setMessage("No se pudo actualizar el estado del producto.");
    }
  }

  async function handleDeleteProduct(productId: string) {
    const confirmed = window.confirm(
      "¿Seguro que querés eliminar este producto? Esta acción no se puede deshacer."
    );

    if (!confirmed) return;

    try {
      await deleteProduct(productId);

      setProducts((currentProducts) =>
        currentProducts.filter((item) => item.id !== productId)
      );

      if (editingProduct?.id === productId) {
        handleCancelEdit();
      }

      setMessage("Producto eliminado correctamente.");
    } catch (error) {
      console.error(error);
      setMessage("No se pudo eliminar el producto.");
    }
  }

  return (
    <section className="admin-page">
      <header className="admin-topbar">
        <div>
          <p className="eyebrow">Administrador</p>
          <h1>Panel de productos</h1>
          <p>Gestioná el catálogo, editá productos y controlá su visibilidad.</p>
        </div>
      </header>

      <div className="admin-stats">
        <article>
          <span>Total productos</span>
          <strong>{products.length}</strong>
        </article>

        <article>
          <span>Activos</span>
          <strong>{activeProductsCount}</strong>
        </article>

        <article>
          <span>Inactivos</span>
          <strong>{inactiveProductsCount}</strong>
        </article>

        <article>
          <span>Categorías</span>
          <strong>{categories.length}</strong>
        </article>
      </div>

      <div className="admin-layout">
        <aside className="admin-form-card">
          <div className="admin-form-title">
            <div>
              <h2>{editingProduct ? "Editar producto" : "Crear producto"}</h2>
              <p>
                {editingProduct
                  ? "Modificá los datos del producto seleccionado."
                  : "Cargá un nuevo producto para mostrarlo en el catálogo."}
              </p>
            </div>

            {editingProduct && (
              <button
                type="button"
                className="secondary-button small-button"
                onClick={handleCancelEdit}
              >
                Cancelar
              </button>
            )}
          </div>

          {editingProduct && (
            <div className="editing-preview">
              <img src={editingProduct.imageUrl} alt={editingProduct.name} />
              <div>
                <span>Editando</span>
                <strong>{editingProduct.name}</strong>
              </div>
            </div>
          )}

          <form className="admin-product-form" onSubmit={handleSubmit}>
            <label>
              Nombre
              <input
                name="name"
                value={form.name}
                onChange={handleInputChange}
                placeholder="Ej: Silla de madera"
              />
            </label>

            <label>
              Descripción
              <textarea
                name="description"
                value={form.description}
                onChange={handleInputChange}
                placeholder="Ej: Silla de madera con tapizado..."
              />
            </label>

            <div className="form-grid">
              <label>
                Precio
                <input
                  name="price"
                  type="number"
                  value={form.price}
                  onChange={handleInputChange}
                  placeholder="45000"
                />
              </label>

              <label>
                Stock
                <input
                  name="stock"
                  type="number"
                  value={form.stock}
                  onChange={handleInputChange}
                  placeholder="10"
                />
              </label>
            </div>

            <label>
              Categoría
              <select
                name="categoryId"
                value={form.categoryId}
                onChange={handleInputChange}
              >
                <option value="">Sin categoría</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>

            <div className="form-grid">
              <label>
                Material
                <input
                  name="material"
                  value={form.material}
                  onChange={handleInputChange}
                  placeholder="Ej: Madera"
                />
              </label>

              <label>
                Color
                <input
                  name="color"
                  value={form.color}
                  onChange={handleInputChange}
                  placeholder="Ej: Natural"
                />
              </label>
            </div>

            <label>
              Medidas
              <input
                name="dimensions"
                value={form.dimensions}
                onChange={handleInputChange}
                placeholder="Ej: 120 x 80 x 75 cm"
              />
            </label>

            <div className="file-field">
              <span className="file-field-label">
                {editingProduct
                  ? "Reemplazar imagen principal"
                  : "Imagen principal"}
              </span>

              <label className="file-upload-box">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                />

                <span className="file-upload-button">Seleccionar imagen</span>

                <span className="file-upload-text">
                  {imageFile
                    ? imageFile.name
                    : "Ningún archivo seleccionado"}
                </span>
              </label>
            </div>

            {message && <p className="admin-message">{message}</p>}

            <button
              className="primary-admin-button"
              type="submit"
              disabled={loading}
            >
              {loading
                ? "Guardando..."
                : editingProduct
                ? "Guardar cambios"
                : "Crear producto"}
            </button>
          </form>
        </aside>

        <main className="admin-products-panel">
          <div className="admin-products-header">
            <div>
              <h2>Productos cargados</h2>
              <p>Buscá y editá productos agrupados por categoría.</p>
            </div>

            <input
              className="admin-search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar producto..."
            />
          </div>

          {initialLoading ? (
            <div className="admin-empty-card">
              <p>Cargando productos...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="admin-empty-card">
              <h3>No hay productos para mostrar</h3>
              <p>Probá cambiando la búsqueda o cargando un producto nuevo.</p>
            </div>
          ) : (
            <div className="admin-category-list">
              {Object.entries(productsByCategory).map(([category, items]) => (
                <section key={category} className="admin-category-section">
                  <div className="admin-category-title">
                    <h3>{category}</h3>
                    <span>{items.length} productos</span>
                  </div>

                  <div className="admin-product-grid">
                    {items.map((product) => (
                      <article key={product.id} className="admin-product-card">
                        <div className="admin-product-image">
                          <img src={product.imageUrl} alt={product.name} />

                          <span
                            className={
                              product.active
                                ? "status-pill active"
                                : "status-pill inactive"
                            }
                          >
                            {product.active ? "Activo" : "Inactivo"}
                          </span>
                        </div>

                        <div className="admin-product-content">
                          <h4>{product.name}</h4>

                          <p className="admin-product-description">
                            {product.description || "Sin descripción"}
                          </p>

                          <div className="admin-product-meta">
                            <span>
                              Precio
                              <strong>
                                ${product.price.toLocaleString("es-AR")}
                              </strong>
                            </span>

                            <span>
                              Stock
                              <strong>{product.stock}</strong>
                            </span>
                          </div>

                          <div className="admin-product-details">
                            {product.material && <span>{product.material}</span>}
                            {product.color && <span>{product.color}</span>}
                            {product.dimensions && (
                              <span>{product.dimensions}</span>
                            )}
                          </div>

                          <div className="admin-product-actions">
                            <button onClick={() => handleEditProduct(product)}>
                              Editar
                            </button>

                            <button onClick={() => handleToggleActive(product)}>
                              {product.active ? "Desactivar" : "Activar"}
                            </button>

                            <button
                              className="danger-button"
                              onClick={() => handleDeleteProduct(product.id)}
                            >
                              Eliminar
                            </button>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </main>
      </div>
    </section>
  );
}