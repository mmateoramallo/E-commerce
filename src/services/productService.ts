import { supabase } from "../lib/supabase";
import type { Product } from "../types/Product";

type ProductImageRow = {
  image_url: string;
  position: number;
  is_cover: boolean;
};

type ProductRow = {
  id: string;
  name: string;
  description: string | null;
  price: number | string;
  stock: number;
  material: string | null;
  color: string | null;
  dimensions: string | null;
  categories: {
    name: string;
  }[] | null;
  product_images: ProductImageRow[];
};

function mapProduct(row: ProductRow): Product {
  const sortedImages = [...(row.product_images ?? [])].sort((a, b) => {
    if (a.is_cover && !b.is_cover) return -1;
    if (!a.is_cover && b.is_cover) return 1;
    return a.position - b.position;
  });

  const coverImage = sortedImages[0]?.image_url;

  return {
    id: row.id,
    name: row.name,
    description: row.description ?? "",
    price: Number(row.price),
    category: row.categories?.[0]?.name ?? "Sin categoría",
    material: row.material ?? "",
    color: row.color ?? "",
    dimensions: row.dimensions ?? "",
    stock: row.stock,
    imageUrl: coverImage ?? "https://placehold.co/600x400?text=Sin+Imagen",
  };
}

export async function getActiveProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select(
      `
      id,
      name,
      description,
      price,
      stock,
      material,
      color,
      dimensions,
      categories (
        name
      ),
      product_images (
        image_url,
        position,
        is_cover
      )
    `
    )
    .eq("active", true)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => mapProduct(row as ProductRow));
}

export async function getProductById(id: string): Promise<Product | null> {
  const { data, error } = await supabase
    .from("products")
    .select(
      `
      id,
      name,
      description,
      price,
      stock,
      material,
      color,
      dimensions,
      categories (
        name
      ),
      product_images (
        image_url,
        position,
        is_cover
      )
    `
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  return mapProduct(data as ProductRow);
}