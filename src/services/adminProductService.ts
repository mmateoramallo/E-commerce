import { supabase } from "../lib/supabase";

export type Category = {
  id: string;
  name: string;
};

export type AdminProduct = {
  id: string;
  name: string;
  price: number;
  stock: number;
  active: boolean;
  created_at: string;
};

export type CreateProductInput = {
  name: string;
  description: string;
  price: number;
  stock: number;
  categoryId: string;
  material: string;
  color: string;
  dimensions: string;
};

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
    .select("id, name, price, stock, active, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((product) => ({
    ...product,
    price: Number(product.price),
  }));
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

export async function createProduct(
  input: CreateProductInput,
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
    const uploadedImage = await uploadProductImage(imageFile);

    const { error: imageError } = await supabase.from("product_images").insert({
      product_id: product.id,
      image_path: uploadedImage.imagePath,
      image_url: uploadedImage.imageUrl,
      position: 0,
      is_cover: true,
    });

    if (imageError) {
      throw new Error(imageError.message);
    }
  }

  return product;
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