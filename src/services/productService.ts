import { supabase } from "../lib/supabase";
import type { Product, ProductImage } from "../types/Product";

type CategoryRelation = { name: string } | { name: string }[] | null;

type ProductImageRow = {
  id: string;
  product_id: string;
  image_path: string;
  image_url: string;
  position: number | null;
  is_cover: boolean | null;
};

type ProductRow = {
  id: string;
  name: string;
  description: string | null;
  price: number | string;
  category_id: string | null;
  material: string | null;
  color: string | null;
  dimensions: string | null;
  stock: number;
  categories: CategoryRelation;
  product_images: ProductImageRow[];
};

function getCategoryName(categoryRelation: CategoryRelation) {
  if (!categoryRelation) return "Sin categoría";

  if (Array.isArray(categoryRelation)) {
    return categoryRelation[0]?.name ?? "Sin categoría";
  }

  return categoryRelation.name ?? "Sin categoría";
}

function mapProductImage(row: ProductImageRow): ProductImage {
  return {
    id: row.id,
    productId: row.product_id,
    imagePath: row.image_path,
    imageUrl: row.image_url,
    position: row.position ?? 0,
    isCover: row.is_cover ?? false,
  };
}

function getCoverImage(images: ProductImage[]) {
  return (
    images.find((image) => image.isCover) ??
    images.sort((a, b) => a.position - b.position)[0] ??
    null
  );
}

function mapProduct(row: ProductRow): Product {
  const images = (row.product_images ?? [])
    .map(mapProductImage)
    .sort((a, b) => a.position - b.position);

  const coverImage = getCoverImage(images);

  return {
    id: row.id,
    name: row.name,
    description: row.description ?? "",
    price: Number(row.price),
    category: getCategoryName(row.categories),
    material: row.material ?? "",
    color: row.color ?? "",
    dimensions: row.dimensions ?? "",
    stock: row.stock,
    imageUrl: coverImage?.imageUrl ?? "",
    images,
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
      category_id,
      material,
      color,
      dimensions,
      stock,
      categories (
        name
      ),
      product_images (
        id,
        product_id,
        image_path,
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

  return (data ?? []).map((product) =>
    mapProduct(product as unknown as ProductRow)
  );
}

export async function getProductById(productId: string): Promise<Product | null> {
  const { data, error } = await supabase
    .from("products")
    .select(
      `
      id,
      name,
      description,
      price,
      category_id,
      material,
      color,
      dimensions,
      stock,
      categories (
        name
      ),
      product_images (
        id,
        product_id,
        image_path,
        image_url,
        position,
        is_cover
      )
    `
    )
    .eq("id", productId)
    .eq("active", true)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) return null;

  return mapProduct(data as unknown as ProductRow);
}