"use server";
import db from "@/db/db";
import fs from "fs/promises";
import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";
const fileSchema = z.instanceof(File, { message: "File is required" });
const imageSchema = fileSchema.refine(
  (file) => file.size === 0 || file.type.startsWith("image/")
);
const addSchema = z.object({
  product_name: z.string().min(1),
  product_price: z.coerce.number().int().min(1),
  description: z.string().min(1),
  file: fileSchema.refine((file) => file.size > 0, {
    message: "File is required",
  }),
  image: imageSchema.refine((file) => file.size > 0, {
    message: "Image is required",
  }),
});

export async function addProduct(_prevState: unknown, formData: FormData) {
  const result = addSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!result.success) {
    return result.error.formErrors.fieldErrors;
  }
  const data = result.data;
  await fs.mkdir("products", { recursive: true });
  const filePath = `products/${crypto.randomUUID()}-${data.file.name}`;
  await fs.writeFile(filePath, Buffer.from(await data.file.arrayBuffer()));

  await fs.mkdir("public/products", { recursive: true });
  const imagePath = `/products/${crypto.randomUUID()}-${data.image.name}`;
  await fs.writeFile(
    `public${imagePath}`,
    Buffer.from(await data.image.arrayBuffer())
  );
  await db.product.create({
    data: {
      isAvailableForPurchase: false,
      name: data.product_name,
      priceInTaka: data.product_price,
      description: data.description,
      filePath,
      imagePath,
    },
  });
  revalidatePath("/");
  revalidatePath("/products");
  redirect("/admin/products");
}
const editSchema = addSchema?.extend({
  file: fileSchema.optional(),
  image: imageSchema.optional(),
});
export async function editProduct(
  id: string,
  _prevState: unknown,
  formData: FormData
) {
  const result = editSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!result.success) {
    return result.error.formErrors.fieldErrors;
  }
  const data = result.data;
  const product = await db.product.findUnique({
    where: {
      id,
    },
  });
  if (product == null) {
    return notFound();
  }

  let filePath = product.filePath;
  if (data?.file != null && data?.file.size > 0) {
    await fs.unlink(product.filePath);
    filePath = `products/${crypto.randomUUID()}-${data.file.name}`;
    await fs.writeFile(filePath, Buffer.from(await data.file.arrayBuffer()));
  }
  let imagePath = product.imagePath;
  if (data?.image != null && data?.image.size > 0) {
    await fs.unlink(`public${product.imagePath}`);
    imagePath = `/products/${crypto.randomUUID()}-${data.image.name}`;
    await fs.writeFile(
      `public${imagePath}`,
      Buffer.from(await data.image.arrayBuffer())
    );
  }
  await db.product.update({
    where: { id },
    data: {
      name: data.product_name,
      priceInTaka: data.product_price,
      description: data.description,
      filePath,
      imagePath,
    },
  });
  // revalidatePath("/");
  // revalidatePath("/products");
  redirect("/admin/products");
}
export async function toggleProductAvailability(
  id: string,
  isAvailableForPurchase: boolean
) {
  await db.product.update({
    where: { id },
    data: { isAvailableForPurchase },
  });
  revalidatePath("/");
  revalidatePath("/products");
}
export async function deleteProduct(id: string) {
  const product = db.product.delete({ where: { id } });
  if (product == null) {
    return notFound();
  }
  await fs.unlink((await product).filePath);
  await fs.unlink(`public${(await product).imagePath}`);
  revalidatePath("/");
  revalidatePath("/products");
}
