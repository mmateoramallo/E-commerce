import { supabase } from "../lib/supabase";

export type Category = {
  id: string;
  name: string;
};

export type AdminProduct = {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  active: boolean;
  categoryId: string;
  categoryName: string;
  material: string;
  color: string;
  dimensions: string;
  imageUrl: string;
  imagePath: string;
  createdAt: string;
};

export type ProductFormInput = {
  name: string;
  description: string;
  price: number;
  stock: number;
  categoryId: string;
  material: string;
  color: string;
  dimensions: string;
};

type ProductImageRow = {
  image_url: string;
  image_path: string;
  position: number;
  is_cover: boolean;
};

type CategoryRelation =
  | {
      name: string;
    }
  | {
      name: string;
    }[]
  | null;

type AdminProductRow = {
  id: string;
  name: string;
  description: string | null;
  price: number | string;
  stock: number;
  active: boolean;
  category_id: string | null;
  material: string | null;
  color: string | null;
  dimensions: string | null;
  created_at: string;
  categories: CategoryRelation;
  product_images: ProductImageRow[];
};

function getCoverImage(images: ProductImageRow[] = []) {
  const sortedImages = [...images].sort((a, b) => {
    if (a.is_cover && !b.is_cover) return -1;
    if (!a.is_cover && b.is_cover) return 1;
    return a.position - b.position;
  });

  return sortedImages[0];
}

function getCategoryName(categoryRelation: CategoryRelation) {
  if (!categoryRelation) {
    return "Sin categoría";
  }

  if (Array.isArray(categoryRelation)) {
    return categoryRelation[0]?.name ?? "Sin categoría";
  }

  return categoryRelation.name ?? "Sin categoría";
}

function mapAdminProduct(row: AdminProductRow): AdminProduct {
  const coverImage = getCoverImage(row.product_images);

  return {
    id: row.id,
    name: row.name,
    description: row.description ?? "",
    price: Number(row.price),
    stock: row.stock,
    active: row.active,
    categoryId: row.category_id ?? "",
    categoryName: getCategoryName(row.categories),
    material: row.material ?? "",
    color: row.color ?? "",
    dimensions: row.dimensions ?? "",
    imageUrl:
      coverImage?.image_url ?? "https://placehold.co/600x400?text=Sin+Imagen",
    imagePath: coverImage?.image_path ?? "",
    createdAt: row.created_at,
  };
}

export async function getCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("id, name")
    .order("name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function getAdminProducts(): Promise<AdminProduct[]> {
  const { data, error } = await supabase
    .from("products")
    .select(
      `
      id,
      name,
      description,
      price,
      stock,
      active,
      category_id,
      material,
      color,
      dimensions,
      created_at,
      categories (
        name
      ),
      product_images (
        image_url,
        image_path,
        position,
        is_cover
      )
    `
    )
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

return (data ?? []).map((product) =>
  mapAdminProduct(product as unknown as AdminProductRow)
);
}

async function uploadProductImage(file: File) {
  const fileExt = file.name.split(".").pop();
  const fileName = `${crypto.randomUUID()}.${fileExt}`;
  const filePath = `products/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from("product-images")
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const { data } = supabase.storage
    .from("product-images")
    .getPublicUrl(filePath);

  return {
    imagePath: filePath,
    imageUrl: data.publicUrl,
  };
}

async function setCoverImage(productId: string, imageFile: File) {
  const uploadedImage = await uploadProductImage(imageFile);

  await supabase
    .from("product_images")
    .update({ is_cover: false })
    .eq("product_id", productId);

  const { error: imageError } = await supabase.from("product_images").insert({
    product_id: productId,
    image_path: uploadedImage.imagePath,
    image_url: uploadedImage.imageUrl,
    position: 0,
    is_cover: true,
  });

  if (imageError) {
    throw new Error(imageError.message);
  }
}

export async function createProduct(
  input: ProductFormInput,
  imageFile: File | null
) {
  const { data: product, error: productError } = await supabase
    .from("products")
    .insert({
      name: input.name,
      description: input.description,
      price: input.price,
      stock: input.stock,
      category_id: input.categoryId || null,
      material: input.material,
      color: input.color,
      dimensions: input.dimensions,
      active: true,
    })
    .select("id")
    .single();

  if (productError) {
    throw new Error(productError.message);
  }

  if (imageFile) {
    await setCoverImage(product.id, imageFile);
  }

  return product;
}

export async function updateProduct(
  productId: string,
  input: ProductFormInput,
  imageFile: File | null
) {
  const { error } = await supabase
    .from("products")
    .update({
      name: input.name,
      description: input.description,
      price: input.price,
      stock: input.stock,
      category_id: input.categoryId || null,
      material: input.material,
      color: input.color,
      dimensions: input.dimensions,
    })
    .eq("id", productId);

  if (error) {
    throw new Error(error.message);
  }

  if (imageFile) {
    await setCoverImage(productId, imageFile);
  }
}

export async function toggleProductActive(productId: string, active: boolean) {
  const { error } = await supabase
    .from("products")
    .update({ active })
    .eq("id", productId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function deleteProduct(productId: string) {
  const { error } = await supabase.from("products").delete().eq("id", productId);

  if (error) {
    throw new Error(error.message);
  }
}