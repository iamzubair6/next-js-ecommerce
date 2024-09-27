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

// export async function addProduct(_prevState: unknown, formData: FormData) {
//   const result = addSchema.safeParse(Object.fromEntries(formData.entries()));
//   if (!result.success) {
//     return result.error.formErrors.fieldErrors;
//   }
//   const data = result.data;
//   const productsDir = path.resolve("products");
//   await fs.mkdir(productsDir, { recursive: true });
//   const filePath = path.join(
//     productsDir,
//     `${crypto.randomUUID()}-${data.file.name}`
//   );
//   await fs.writeFile(filePath, Buffer.from(await data.file.arrayBuffer()));

//   const publicProductsDir = path.resolve("public", "products");
//   await fs.mkdir(publicProductsDir, { recursive: true });

//   const imagePath = path.join(
//     "/products",
//     `${crypto.randomUUID()}-${data.image.name}`
//   );
//   await fs.writeFile(
//     path.join("public", imagePath),
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

//   revalidatePath("/");
//   revalidatePath("/products");
//   redirect("/admin/products");
// }
export async function addProduct(_prevState: unknown, formData: FormData) {
  const result = addSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!result.success) {
    return result.error.formErrors.fieldErrors;
  }

  const data = result.data;
  let filePath, imagePath;

  // Determine if the environment is production
  const isProduction = process.env.NODE_ENV === "production";

  if (isProduction) {
    // Production environment: Upload to Vercel Blob Storage
    const blobReadWriteUrl = process.env.VERCEL_BLOB_READ_WRITE_URL;
    const blobToken = process.env.BLOB_READ_WRITE_TOKEN;

    if (!blobReadWriteUrl || !blobToken) {
      throw new Error("Blob storage URL or token is not defined");
    }

    // Upload file to Blob Storage
    const fileResponse = await fetch(blobReadWriteUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${blobToken}`,
        "Content-Type": data.file.type,
      },
      body: await data.file.arrayBuffer(),
    });

    if (!fileResponse.ok) {
      const errorText = await fileResponse.text();
      console.error("File upload failed:", errorText);
      throw new Error(`Failed to upload file: ${fileResponse.statusText}`);
    }

    const fileBlobData = await fileResponse.json();
    filePath = fileBlobData.url;

    // Upload image to Blob Storage
    const imageResponse = await fetch(blobReadWriteUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${blobToken}`,
        "Content-Type": data.image.type,
      },
      body: await data.image.arrayBuffer(),
    });

    if (!imageResponse.ok) {
      const errorText = await imageResponse.text();
      console.error("Image upload failed:", errorText);
      throw new Error(`Failed to upload image: ${imageResponse.statusText}`);
    }

    const imageBlobData = await imageResponse.json();
    imagePath = imageBlobData.url;
  } else {
    // Local environment: Save files to /products and /public/products
    try {
      // Ensure products directory exists
      await fs.mkdir("products", { recursive: true });

      // Save file to /products
      const localFileName = `${crypto.randomUUID()}-${data.file.name}`;
      const localFilePath = `products/${localFileName}`;
      await fs.writeFile(
        localFilePath,
        Buffer.from(await data.file.arrayBuffer())
      );
      filePath = localFilePath;

      console.log("Local file saved to:", filePath);

      // Ensure public/products directory exists
      await fs.mkdir("public/products", { recursive: true });

      // Save image to /public/products
      const localImageName = `${crypto.randomUUID()}-${data.image.name}`;
      const localImagePath = `public/products/${localImageName}`;
      await fs.writeFile(
        localImagePath,
        Buffer.from(await data.image.arrayBuffer())
      );
      imagePath = `/products/${localImageName}`; // Use the correct public path

      console.log("Local image saved to:", imagePath);
    } catch (error) {
      console.error("Error during local file save:", error);
      throw new Error("An error occurred while saving files locally.");
    }
  }

  // Check if paths are defined before proceeding
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

  // Revalidate paths and redirect to the admin page
  revalidatePath("/");
  revalidatePath("/products");
  redirect("/admin/products");
}
const editSchema = addSchema?.extend({
  file: fileSchema.optional(),
  image: imageSchema.optional(),
});
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
//   revalidatePath("/");
//   revalidatePath("/products");
//   redirect("/admin/products");
// }
// export async function toggleProductAvailability(
//   id: string,
//   isAvailableForPurchase: boolean
// ) {
//   await db.product.update({
//     where: { id },
//     data: { isAvailableForPurchase },
//   });
//   revalidatePath("/");
//   revalidatePath("/products");
// }
// export async function deleteProduct(id: string) {
//   const product = db.product.delete({ where: { id } });
//   if (product == null) {
//     return notFound();
//   }
//   await fs.unlink((await product).filePath);
//   await fs.unlink(`public${(await product).imagePath}`);
//   revalidatePath("/");
//   revalidatePath("/products");
// }
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

  // Find the existing product
  const product = await db.product.findUnique({
    where: { id },
  });

  if (product == null) {
    return notFound();
  }

  let filePath = product.filePath;

  // Check if a new file is uploaded and replace the old one
  if (data?.file != null && data.file.size > 0) {
    await fs.unlink(filePath); // Remove the old file
    filePath = `products/${crypto.randomUUID()}-${data.file.name}`;
    await fs.writeFile(filePath, Buffer.from(await data.file.arrayBuffer()));
  }

  let imagePath = product.imagePath;

  // Check if a new image is uploaded and replace the old one
  if (data?.image != null && data.image.size > 0) {
    await fs.unlink(`public${product.imagePath}`); // Remove the old image
    imagePath = `/products/${crypto.randomUUID()}-${data.image.name}`;
    await fs.writeFile(
      `public${imagePath}`,
      Buffer.from(await data.image.arrayBuffer())
    );
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

  // Revalidate paths and redirect
  revalidatePath("/");
  revalidatePath("/products");
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

  // Revalidate paths after toggling availability
  revalidatePath("/");
  revalidatePath("/products");
}

export async function deleteProduct(id: string) {
  // Fetch the product before deletion to get paths
  const product = await db.product.findUnique({ where: { id } });
  if (product == null) {
    return notFound();
  }

  const filePath = product.filePath;
  const imagePath = `public${product.imagePath}`; // Ensure you're using the correct path

  try {
    // Delete the files associated with the product
    await fs.unlink(filePath);
    console.log(`File deleted: ${filePath}`);

    await fs.unlink(imagePath); // Use the full path for the image
    console.log(`Image deleted: ${imagePath}`);

    // Proceed to delete the product from the database
    await db.product.delete({ where: { id } });

    // Revalidate paths after deletion
    revalidatePath("/");
    revalidatePath("/products");
  } catch (error) {
    console.error("Error deleting files:", error);
    throw new Error("An error occurred while deleting the product files.");
  }
}
