import { useEffect, useMemo, useState, type FormEvent } from "react";
import { AdminNav } from "../components/AdminNav";
import {
  createCategory,
  deleteCategory,
  getAdminCategories,
  updateCategory,
} from "../services/categoryAdminService";
import type { AdminCategory } from "../services/categoryAdminService";

export function AdminCategories() {
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [categoryName, setCategoryName] = useState("");
  const [editingCategory, setEditingCategory] =
    useState<AdminCategory | null>(null);

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadCategories() {
      try {
        setInitialLoading(true);

        const data = await getAdminCategories();

        if (!isMounted) return;

        setCategories(data);
      } catch (error) {
        console.error(error);

        if (!isMounted) return;

        setMessage("No se pudieron cargar las categorías.");
      } finally {
        if (isMounted) {
          setInitialLoading(false);
        }
      }
    }

    void loadCategories();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredCategories = useMemo(() => {
    const normalizedSearch = search.toLowerCase().trim();

    if (!normalizedSearch) {
      return categories;
    }

    return categories.filter((category) =>
      category.name.toLowerCase().includes(normalizedSearch)
    );
  }, [categories, search]);

  const categoriesWithProductsCount = categories.filter(
    (category) => category.productsCount > 0
  ).length;

  const emptyCategoriesCount = categories.length - categoriesWithProductsCount;

  async function refreshCategories() {
    const data = await getAdminCategories();
    setCategories(data);
  }

  function handleEditCategory(category: AdminCategory) {
    setEditingCategory(category);
    setCategoryName(category.name);
    setMessage("");
  }

  function handleCancelEdit() {
    setEditingCategory(null);
    setCategoryName("");
    setMessage("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!categoryName.trim()) {
      setMessage("Ingresá el nombre de la categoría.");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      if (editingCategory) {
        await updateCategory(editingCategory.id, categoryName);
        setMessage("Categoría actualizada correctamente.");
      } else {
        await createCategory(categoryName);
        setMessage("Categoría creada correctamente.");
      }

      setCategoryName("");
      setEditingCategory(null);

      await refreshCategories();
    } catch (error) {
      console.error(error);

      if (error instanceof Error) {
        setMessage(error.message);
      } else {
        setMessage("No se pudo guardar la categoría.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteCategory(category: AdminCategory) {
    if (category.productsCount > 0) {
      setMessage(
        "No se puede eliminar una categoría que todavía tiene productos asociados."
      );
      return;
    }

    const confirmed = window.confirm(
      `¿Seguro que querés eliminar la categoría "${category.name}"?`
    );

    if (!confirmed) return;

    try {
      setLoading(true);
      setMessage("");

      await deleteCategory(category.id);

      if (editingCategory?.id === category.id) {
        handleCancelEdit();
      }

      await refreshCategories();

      setMessage("Categoría eliminada correctamente.");
    } catch (error) {
      console.error(error);

      if (error instanceof Error) {
        setMessage(error.message);
      } else {
        setMessage("No se pudo eliminar la categoría.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="admin-page">
      <header className="admin-topbar">
        <div>
          <p className="eyebrow">Administrador</p>
          <h1>Categorías</h1>
          <p>
            Administrá las categorías del catálogo sin tocar Supabase
            directamente.
          </p>
        </div>
      </header>

      <AdminNav />

      <div className="admin-stats">
        <article>
          <span>Total categorías</span>
          <strong>{categories.length}</strong>
        </article>

        <article>
          <span>Con productos</span>
          <strong>{categoriesWithProductsCount}</strong>
        </article>

        <article>
          <span>Vacías</span>
          <strong>{emptyCategoriesCount}</strong>
        </article>

        <article>
          <span>Mostradas</span>
          <strong>{filteredCategories.length}</strong>
        </article>
      </div>

      <div className="admin-categories-layout">
        <aside className="admin-form-card">
          <div className="admin-form-title">
            <div>
              <h2>
                {editingCategory ? "Editar categoría" : "Crear categoría"}
              </h2>
              <p>
                {editingCategory
                  ? "Modificá el nombre de la categoría seleccionada."
                  : "Agregá una nueva categoría para usarla en productos."}
              </p>
            </div>

            {editingCategory && (
              <button
                type="button"
                className="secondary-button small-button"
                onClick={handleCancelEdit}
              >
                Cancelar
              </button>
            )}
          </div>

          <form className="admin-product-form" onSubmit={handleSubmit}>
            <label>
              Nombre de categoría
              <input
                value={categoryName}
                onChange={(event) => setCategoryName(event.target.value)}
                placeholder="Ej: Mobiliario"
              />
            </label>

            {message && <p className="admin-message">{message}</p>}

            <button
              type="submit"
              className="primary-admin-button"
              disabled={loading}
            >
              {loading
                ? "Guardando..."
                : editingCategory
                ? "Guardar cambios"
                : "Crear categoría"}
            </button>
          </form>
        </aside>

        <main className="admin-categories-panel">
          <div className="admin-products-header">
            <div>
              <h2>Categorías cargadas</h2>
              <p>Buscá, editá o eliminá categorías sin productos asociados.</p>
            </div>

            <input
              className="admin-search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar categoría..."
            />
          </div>

          {initialLoading ? (
            <div className="admin-empty-card">
              <p>Cargando categorías...</p>
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="admin-empty-card">
              <h3>No hay categorías para mostrar</h3>
              <p>Probá cambiando la búsqueda o creando una categoría nueva.</p>
            </div>
          ) : (
            <div className="category-admin-list">
              {filteredCategories.map((category) => (
                <article key={category.id} className="category-admin-card">
                  <div>
                    <span
                      className={
                        category.productsCount > 0
                          ? "category-state has-products"
                          : "category-state empty"
                      }
                    >
                      {category.productsCount > 0
                        ? "Con productos"
                        : "Sin productos"}
                    </span>

                    <h3>{category.name}</h3>

                    <p>
                      {category.productsCount === 1
                        ? "1 producto asociado"
                        : `${category.productsCount} productos asociados`}
                    </p>
                  </div>

                  <div className="category-admin-actions">
                    <button
                      type="button"
                      onClick={() => handleEditCategory(category)}
                    >
                      Editar
                    </button>

                    <button
                      type="button"
                      className="danger-button"
                      disabled={category.productsCount > 0}
                      onClick={() => handleDeleteCategory(category)}
                      title={
                        category.productsCount > 0
                          ? "No se puede eliminar una categoría con productos"
                          : "Eliminar categoría"
                      }
                    >
                      Eliminar
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </main>
      </div>
    </section>
  );
}