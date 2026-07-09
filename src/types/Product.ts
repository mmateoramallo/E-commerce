export type ProductImage = {
  id: string;
  productId: string;
  imagePath: string;
  imageUrl: string;
  position: number;
  isCover: boolean;
};

export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  material: string;
  color: string;
  dimensions: string;
  stock: number;
  imageUrl: string;
  images: ProductImage[];
};