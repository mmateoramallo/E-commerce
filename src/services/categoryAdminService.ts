import { supabase } from "../lib/supabase";

export type AdminCategory = {
  id: string;
  name: string;
  createdAt: string;
  productsCount: number;
};

type CategoryRow = {
  id: string;
  name: string;
  created_at: string;
};

type ProductCategoryRow = {
  category_id: string | null;
};

function mapCategory(
  category: CategoryRow,
  productCountByCategory: Record<string, number>
): AdminCategory {
  return {
    id: category.id,
    name: category.name,
    createdAt: category.created_at,
    productsCount: productCountByCategory[category.id] ?? 0,
  };
}

export async function getAdminCategories(): Promise<AdminCategory[]> {
  const { data: categoriesData, error: categoriesError } = await supabase
    .from("categories")
    .select("id, name, created_at")
    .order("name", { ascending: true });

  if (categoriesError) {
    throw new Error(categoriesError.message);
  }

  const { data: productsData, error: productsError } = await supabase
    .from("products")
    .select("category_id")
    .not("category_id", "is", null);

  if (productsError) {
    throw new Error(productsError.message);
  }

  const productCountByCategory = (productsData ?? []).reduce<
    Record<string, number>
  >((acc, product) => {
    const row = product as ProductCategoryRow;

    if (!row.category_id) return acc;

    acc[row.category_id] = (acc[row.category_id] ?? 0) + 1;
    return acc;
  }, {});

  return (categoriesData ?? []).map((category) =>
    mapCategory(category as CategoryRow, productCountByCategory)
  );
}

export async function createCategory(name: string) {
  const normalizedName = name.trim();

  if (!normalizedName) {
    throw new Error("El nombre de la categoría es obligatorio.");
  }

  const { error } = await supabase.from("categories").insert({
    name: normalizedName,
  });

  if (error) {
    if (error.code === "23505") {
      throw new Error("Ya existe una categoría con ese nombre.");
    }

    throw new Error(error.message);
  }
}

export async function updateCategory(categoryId: string, name: string) {
  const normalizedName = name.trim();

  if (!normalizedName) {
    throw new Error("El nombre de la categoría es obligatorio.");
  }

  const { error } = await supabase
    .from("categories")
    .update({
      name: normalizedName,
    })
    .eq("id", categoryId);

  if (error) {
    if (error.code === "23505") {
      throw new Error("Ya existe una categoría con ese nombre.");
    }

    throw new Error(error.message);
  }
}

export async function deleteCategory(categoryId: string) {
  const { count, error: countError } = await supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("category_id", categoryId);

  if (countError) {
    throw new Error(countError.message);
  }

  if ((count ?? 0) > 0) {
    throw new Error(
      "No se puede eliminar una categoría que todavía tiene productos asociados."
    );
  }

  const { error } = await supabase
    .from("categories")
    .delete()
    .eq("id", categoryId);

  if (error) {
    throw new Error(error.message);
  }
}