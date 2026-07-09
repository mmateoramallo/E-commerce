import { supabase } from "../lib/supabase";

export type Category = {
  id: string;
  name: string;
};

export type ProductImage = {
  id: string;
  productId: string;
  imagePath: string;
  imageUrl: string;
  position: number;
  isCover: boolean;
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
  images: ProductImage[];
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

type CategoryRelation = { name: string } | { name: string }[] | null;

type ProductImageRow = {
  id: string;
  product_id: string;
  image_path: string;
  image_url: string;
  position: number | null;
  is_cover: boolean | null;
};

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

const PRODUCT_IMAGES_BUCKET = "product-images";

function getCategoryName(categoryRelation: CategoryRelation) {
  if (!categoryRelation) return "Sin categoría";

  if (Array.isArray(categoryRelation)) {
    return categoryRelation[0]?.name ?? "Sin categoría";
  }

  return categoryRelation.name ?? "Sin categoría";
}

function normalizeImageFiles(files?: File | File[] | null): File[] {
  if (!files) return [];
  if (Array.isArray(files)) return files;
  return [files];
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

function mapAdminProduct(row: AdminProductRow): AdminProduct {
  const images = (row.product_images ?? [])
    .map(mapProductImage)
    .sort((a, b) => a.position - b.position);

  const coverImage = getCoverImage(images);

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
    imageUrl: coverImage?.imageUrl ?? "",
    imagePath: coverImage?.imagePath ?? "",
    images,
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
        id,
        product_id,
        image_path,
        image_url,
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

async function getProductImagesCount(productId: string) {
  const { count, error } = await supabase
    .from("product_images")
    .select("id", { count: "exact", head: true })
    .eq("product_id", productId);

  if (error) {
    throw new Error(error.message);
  }

  return count ?? 0;
}

async function productHasCoverImage(productId: string) {
  const { data, error } = await supabase
    .from("product_images")
    .select("id")
    .eq("product_id", productId)
    .eq("is_cover", true)
    .limit(1);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).length > 0;
}

async function uploadProductImages(productId: string, files: File[]) {
  if (files.length === 0) return;

  const existingImagesCount = await getProductImagesCount(productId);
  const hasCoverImage = await productHasCoverImage(productId);

  const rowsToInsert = [];

  for (let index = 0; index < files.length; index++) {
    const file = files[index];

    const fileExtension = file.name.split(".").pop();
    const safeFileName = `${crypto.randomUUID()}.${fileExtension}`;
    const imagePath = `${productId}/${safeFileName}`;

    const { error: uploadError } = await supabase.storage
      .from(PRODUCT_IMAGES_BUCKET)
      .upload(imagePath, file);

    if (uploadError) {
      throw new Error(uploadError.message);
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(PRODUCT_IMAGES_BUCKET).getPublicUrl(imagePath);

    rowsToInsert.push({
      product_id: productId,
      image_path: imagePath,
      image_url: publicUrl,
      position: existingImagesCount + index,
      is_cover: !hasCoverImage && index === 0,
    });
  }

  const { error: insertError } = await supabase
    .from("product_images")
    .insert(rowsToInsert);

  if (insertError) {
    throw new Error(insertError.message);
  }
}

export async function createProduct(
  input: ProductFormInput,
  imageFiles?: File | File[] | null
) {
  const { data: product, error } = await supabase
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

  if (error) {
    throw new Error(error.message);
  }

  const files = normalizeImageFiles(imageFiles);
  await uploadProductImages(product.id, files);

  return product.id as string;
}

export async function updateProduct(
  productId: string,
  input: ProductFormInput,
  imageFiles?: File | File[] | null
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

  const files = normalizeImageFiles(imageFiles);
  await uploadProductImages(productId, files);
}

export async function toggleProductActive(
  productId: string,
  active: boolean
) {
  const { error } = await supabase
    .from("products")
    .update({ active })
    .eq("id", productId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function deleteProduct(productId: string) {
  const { data: images, error: imagesError } = await supabase
    .from("product_images")
    .select("image_path")
    .eq("product_id", productId);

  if (imagesError) {
    throw new Error(imagesError.message);
  }

  const imagePaths = (images ?? []).map((image) => image.image_path);

  if (imagePaths.length > 0) {
    const { error: storageError } = await supabase.storage
      .from(PRODUCT_IMAGES_BUCKET)
      .remove(imagePaths);

    if (storageError) {
      throw new Error(storageError.message);
    }
  }

  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", productId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function setProductCoverImage(
  productId: string,
  imageId: string
) {
  const { error: resetError } = await supabase
    .from("product_images")
    .update({ is_cover: false })
    .eq("product_id", productId);

  if (resetError) {
    throw new Error(resetError.message);
  }

  const { error: coverError } = await supabase
    .from("product_images")
    .update({ is_cover: true })
    .eq("id", imageId)
    .eq("product_id", productId);

  if (coverError) {
    throw new Error(coverError.message);
  }
}

async function setFirstImageAsCoverIfNeeded(productId: string) {
  const hasCover = await productHasCoverImage(productId);

  if (hasCover) return;

  const { data: firstImage, error } = await supabase
    .from("product_images")
    .select("id")
    .eq("product_id", productId)
    .order("position", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!firstImage) return;

  await setProductCoverImage(productId, firstImage.id);
}

export async function deleteProductImage(
  productId: string,
  imageId: string,
  imagePath: string
) {
  const { error: storageError } = await supabase.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .remove([imagePath]);

  if (storageError) {
    throw new Error(storageError.message);
  }

  const { error: deleteError } = await supabase
    .from("product_images")
    .delete()
    .eq("id", imageId)
    .eq("product_id", productId);

  if (deleteError) {
    throw new Error(deleteError.message);
  }

  await setFirstImageAsCoverIfNeeded(productId);
}