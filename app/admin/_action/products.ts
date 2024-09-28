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
import { del, put } from "@vercel/blob";
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

interface BlobUploadResult {
  url: string;
}

async function uploadToBlobStorage(file: File): Promise<BlobUploadResult> {
  console.log("Uploading file to Blob Storage...");
  console.log("File type:", file.type);

  // Upload the file using @vercel/blob's `put` method
  const { url } = await put(file.name, file, {
    access: "public", // Specify the access level ('public' or 'private')
  });

  console.log("File uploaded successfully to:", url);
  return { url };
}

// Add Product Function
export async function addProduct(_prevState: unknown, formData: FormData) {
  const result = addSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!result.success) {
    return result.error.formErrors.fieldErrors; // Handle validation errors
  }

  const data = result.data;
  let filePath;
  let imagePath;

  const isProduction = process.env.NODE_ENV === "production";

  if (isProduction) {
    // Upload file and image to Blob Storage using @vercel/blob
    const fileBlobData = await uploadToBlobStorage(data.file);
    filePath = fileBlobData.url;

    const imageBlobData = await uploadToBlobStorage(data.image);
    imagePath = imageBlobData.url;
  } else {
    // Local file system logic for development
    await fs.mkdir("products", { recursive: true });
    const localFileName = `${crypto.randomUUID()}-${data.file.name}`;
    const localFilePath = `products/${localFileName}`;
    await fs.writeFile(
      localFilePath,
      Buffer.from(await data.file.arrayBuffer())
    );
    filePath = localFilePath;

    await fs.mkdir("public/products", { recursive: true });
    const localImageName = `${crypto.randomUUID()}-${data.image.name}`;
    const localImagePath = `public/products/${localImageName}`;
    await fs.writeFile(
      localImagePath,
      Buffer.from(await data.image.arrayBuffer())
    );
    imagePath = `/products/${localImageName}`;
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

  // Perform redirect
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

  if (!product) {
    return notFound();
  }

  let filePath = product.filePath;
  let imagePath = product.imagePath;

  const isProduction = process.env.NODE_ENV === "production";

  if (data?.file != null && data.file.size > 0) {
    // Delete the old file
    if (isProduction) {
      // Production environment: Use the Vercel Blob API to delete the old file
      await del(filePath); // Assuming 'filePath' is the URL of the blob file
      console.log(`File deleted from blob storage: ${filePath}`);

      // Upload the new file to Blob Storage
      const fileBlobData = await uploadToBlobStorage(data.file);
      filePath = fileBlobData.url;
    } else {
      // Local environment: Use fs.unlink to delete the old local file
      await fs.unlink(filePath);
      console.log(`Local file deleted: ${filePath}`);

      // Save the new file locally
      filePath = `products/${crypto.randomUUID()}-${data.file.name}`;
      await fs.writeFile(filePath, Buffer.from(await data.file.arrayBuffer()));
    }
  }

  if (data?.image != null && data.image.size > 0) {
    // Delete the old image
    if (isProduction) {
      // Production environment: Use the Vercel Blob API to delete the old image
      await del(imagePath); // Assuming 'imagePath' is the URL of the blob image
      console.log(`Image deleted from blob storage: ${imagePath}`);

      // Upload the new image to Blob Storage
      const imageBlobData = await uploadToBlobStorage(data.image);
      imagePath = imageBlobData.url;
    } else {
      // Local environment: Use fs.unlink to delete the old local image
      await fs.unlink(`public${imagePath}`);
      console.log(`Local image deleted: ${imagePath}`);

      // Save the new image locally
      imagePath = `/products/${crypto.randomUUID()}-${data.image.name}`;
      await fs.writeFile(
        `public${imagePath}`,
        Buffer.from(await data.image.arrayBuffer())
      );
    }
  }

  // Update the product in the database
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

  // Revalidate paths after successful update
  revalidatePath("/");
  revalidatePath("/products");
  redirect("/admin/products");
}

// Toggle Product Availability Function
export async function toggleProductAvailability(
  id: string,
  isAvailableForPurchase: boolean
): Promise<void> {
  try {
    await db.product.update({
      where: { id },
      data: { isAvailableForPurchase },
    });

    // Revalidate paths if the update is successful
    revalidatePath("/");
    revalidatePath("/products");
  } catch (error) {
    console.error("Error updating product availability:", error);
    throw new Error("Failed to update product availability.");
  }
}

// Delete Product Function
export async function deleteProduct(id: string): Promise<void> {
  const product = await db.product.findUnique({ where: { id } });

  if (!product) {
    return notFound(); // Return early if the product is not found
  }

  const filePath = product.filePath;
  const imagePath = `public${product.imagePath}`;

  try {
    const isProduction = process.env.NODE_ENV === "production";

    if (isProduction) {
      // Handle blob storage file deletion if in production
      // Use Vercel Blob API or appropriate method to delete the file from blob storage
      console.log("Deleting from Blob Storage...");
      // Add your blob deletion logic here
    } else {
      // Local file deletion
      try {
        await fs.unlink(filePath);
        console.log(`File deleted: ${filePath}`);
      } catch (error) {
        console.error(`Error deleting file: ${filePath}`, error);
      }

      try {
        await fs.unlink(imagePath);
        console.log(`Image deleted: ${imagePath}`);
      } catch (error) {
        console.error(`Error deleting image: ${imagePath}`, error);
      }
    }

    // Delete product from the database
    await db.product.delete({ where: { id } });

    // Revalidate paths after successful deletion
    revalidatePath("/");
    revalidatePath("/products");
  } catch (error) {
    console.error("Error deleting product:", error);
    throw new Error("An error occurred while deleting the product.");
  }
}
