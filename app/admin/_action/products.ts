// "use server";
// import db from "@/db/db";
// import fs from "fs/promises";
// import { notFound, redirect } from "next/navigation";
// import { z } from "zod";
// const fileSchema = z.instanceof(File, { message: "File is required" });
// const imageSchema = fileSchema.refine(
//   (file) => file.size === 0 || file.type.startsWith("image/")
// );
// const addSchema = z.object({
//   product_name: z.string().min(1),
//   product_price: z.coerce.number().int().min(1),
//   description: z.string().min(1),
//   file: fileSchema.refine((file) => file.size > 0, {
//     message: "File is required",
//   }),
//   image: imageSchema.refine((file) => file.size > 0, {
//     message: "Image is required",
//   }),
// });

// export async function addProduct(_prevState: unknown, formData: FormData) {
//   const result = addSchema.safeParse(Object.fromEntries(formData.entries()));
//   if (!result.success) {
//     return result.error.formErrors.fieldErrors;
//   }
//   const data = result.data;
//   await fs.mkdir("products", { recursive: true });
//   const filePath = `products/${crypto.randomUUID()}-${data.file.name}`;
//   await fs.writeFile(filePath, Buffer.from(await data.file.arrayBuffer()));

//   await fs.mkdir("public/products", { recursive: true });
//   const imagePath = `/products/${crypto.randomUUID()}-${data.image.name}`;
//   await fs.writeFile(
//     `public${imagePath}`,
//     Buffer.from(await data.image.arrayBuffer())
//   );
//   await db.product.create({
//     data: {
//       isAvailableForPurchase: false,
//       name: data.product_name,
//       priceInTaka: data.product_price,
//       description: data.description,
//       filePath,
//       imagePath,
//     },
//   });
//   redirect("/admin/products");
// }
// const editSchema = addSchema?.extend({
//   file: fileSchema.optional(),
//   image: imageSchema.optional(),
// });
// export async function editProduct(
//   id: string,
//   _prevState: unknown,
//   formData: FormData
// ) {
//   const result = editSchema.safeParse(Object.fromEntries(formData.entries()));
//   if (!result.success) {
//     return result.error.formErrors.fieldErrors;
//   }
//   const data = result.data;
//   const product = await db.product.findUnique({
//     where: {
//       id,
//     },
//   });
//   if (product == null) {
//     return notFound();
//   }

//   let filePath = product.filePath;
//   if (data?.file != null && data?.file.size > 0) {
//     await fs.unlink(product.filePath);
//     filePath = `products/${crypto.randomUUID()}-${data.file.name}`;
//     await fs.writeFile(filePath, Buffer.from(await data.file.arrayBuffer()));
//   }
//   let imagePath = product.imagePath;
//   if (data?.image != null && data?.image.size > 0) {
//     await fs.unlink(`public${product.imagePath}`);
//     imagePath = `/products/${crypto.randomUUID()}-${data.image.name}`;
//     await fs.writeFile(
//       `public${imagePath}`,
//       Buffer.from(await data.image.arrayBuffer())
//     );
//   }
//   await db.product.update({
//     where: { id },
//     data: {
//       name: data.product_name,
//       priceInTaka: data.product_price,
//       description: data.description,
//       filePath,
//       imagePath,
//     },
//   });
//   redirect("/admin/products");
// }
// export async function toggleProductAvailability(
//   id: string,
//   isAvailableForPurchase: boolean
// ) {
//   return db.product.update({
//     where: { id },
//     data: { isAvailableForPurchase },
//   });
// }
// export async function deleteProduct(id: string) {
//   const product = db.product.delete({ where: { id } });
//   if (product == null) {
//     return notFound();
//   }
//   await fs.unlink((await product).filePath);
//   await fs.unlink(`public${(await product).imagePath}`);
// }

//update
"use server";
import db from "@/db/db";
import fs from "fs/promises";
import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";

// Schema definitions
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

// Helper function for uploading files to Blob Storage
async function uploadToBlobStorage(
  blobReadWriteUrl: string | URL | Request,
  blobToken: string,
  file: File
) {
  const response = await fetch(blobReadWriteUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${blobToken}`,
      "Content-Type": file.type,
    },
    body: await file.arrayBuffer(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to upload file: ${errorText}`);
  }

  return await response.json();
}

// Add Product Function
export async function addProduct(_prevState: unknown, formData: FormData) {
  const result = addSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!result.success) {
    return result.error.formErrors.fieldErrors; // Handle validation errors
  }

  const data = result.data;
  let filePath: string | undefined;
  let imagePath: string | undefined;

  const isProduction = process.env.NODE_ENV === "production";
  const blobReadWriteUrl = process.env.VERCEL_BLOB_READ_WRITE_URL;
  const blobToken = process.env.BLOB_READ_WRITE_TOKEN;

  if (isProduction) {
    if (!blobReadWriteUrl || !blobToken) {
      throw new Error("Blob storage URL or token is not defined");
    }

    // Upload file to Blob Storage
    const fileBlobData = await uploadToBlobStorage(
      blobReadWriteUrl,
      blobToken,
      data.file
    );
    filePath = fileBlobData.url;

    // Upload image to Blob Storage
    const imageBlobData = await uploadToBlobStorage(
      blobReadWriteUrl,
      blobToken,
      data.image
    );
    imagePath = imageBlobData.url;
  } else {
    // Local environment: Save files to /products and /public/products
    await fs.mkdir("products", { recursive: true });
    const localFileName = `${crypto.randomUUID()}-${data.file.name}`;
    const localFilePath = `products/${localFileName}`;
    await fs.writeFile(
      localFilePath,
      Buffer.from(await data.file.arrayBuffer())
    );
    filePath = localFilePath;

    console.log("Local file saved to:", filePath);

    await fs.mkdir("public/products", { recursive: true });
    const localImageName = `${crypto.randomUUID()}-${data.image.name}`;
    const localImagePath = `public/products/${localImageName}`;
    await fs.writeFile(
      localImagePath,
      Buffer.from(await data.image.arrayBuffer())
    );
    imagePath = `/products/${localImageName}`;

    console.log("Local image saved to:", imagePath);
  }

  // Ensure paths are defined
  if (!filePath || !imagePath) {
    throw new Error("File path or image path is undefined");
  }

  // Insert product data into the database
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

  // Revalidate paths
  revalidatePath("/");
  revalidatePath("/products");

  // Perform the redirect without further processing
  redirect("/admin/products");
}

// Edit Product Function
const editSchema = addSchema.extend({
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
  const product = await db.product.findUnique({ where: { id } });

  if (product == null) {
    return notFound();
  }

  let filePath = product.filePath;

  if (data?.file != null && data.file.size > 0) {
    await fs.unlink(filePath);
    filePath = `products/${crypto.randomUUID()}-${data.file.name}`;
    await fs.writeFile(filePath, Buffer.from(await data.file.arrayBuffer()));
  }

  let imagePath = product.imagePath;
  if (data?.image != null && data.image.size > 0) {
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

  revalidatePath("/");
  revalidatePath("/products");
  redirect("/admin/products");
}

// Toggle Product Availability Function
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

// Delete Product Function
export async function deleteProduct(id: string) {
  const product = await db.product.findUnique({ where: { id } });
  if (product == null) {
    return notFound();
  }

  const filePath = product.filePath;
  const imagePath = `public${product.imagePath}`;

  try {
    await fs.unlink(filePath);
    console.log(`File deleted: ${filePath}`);
    await fs.unlink(imagePath);
    console.log(`Image deleted: ${imagePath}`);

    await db.product.delete({ where: { id } });

    revalidatePath("/");
    revalidatePath("/products");
  } catch (error) {
    console.error("Error deleting files:", error);
    throw new Error("An error occurred while deleting the product files.");
  }
}
