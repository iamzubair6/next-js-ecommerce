"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/lib/currencyFormater";
import { Product } from "@prisma/client";
import { LoaderIcon } from "lucide-react";
import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { addProduct, editProduct } from "../../_action/products";

const ProductForm = ({ product }: { product?: Product | null }) => {
  const [error, action] = useFormState(
    product == null ? addProduct : editProduct.bind(null, product?.id),
    {}
  );
  const [price, setPrice] = useState<number | undefined>(product?.priceInTaka);
  return (
    <form action={action} className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label className="text-lg text-black" htmlFor="name">
          Product Name{" "}
          <span className="text-sm ml-[-3px] text-destructive">*</span>
        </Label>
        <Input
          type="text"
          id="name"
          name="product_name"
          defaultValue={product?.name || ""}
          placeholder="Enter Product Name"
        />
        {error?.product_name && (
          <div className="text-destructive">{error?.product_name}</div>
        )}
      </div>
      <div className="space-y-2">
        <Label className="text-lg text-black" htmlFor="price">
          Product Price{" "}
          <span className="text-sm ml-[-3px] text-destructive">*</span>
        </Label>
        <Input
          value={!price ? "" : price}
          onChange={(e) => setPrice(Number(e?.target?.value))}
          type="number"
          id="price"
          name="product_price"
          placeholder="Enter Product Price"
        />
        {error?.product_price && (
          <div className="text-destructive">{error?.product_price}</div>
        )}
        <div className="text-muted-foreground">
          {formatCurrency((price || 0) / 100)}
        </div>
      </div>
      <div className="space-y-2 col-span-full">
        <Label className="text-lg text-black" htmlFor="description">
          Description{" "}
          <span className="text-sm ml-[-3px] text-destructive">*</span>
        </Label>
        <Textarea
          id="descritption"
          name="description"
          defaultValue={product?.description || ""}
          placeholder="Enter Description"
        />
        {error?.description && (
          <div className="text-destructive">{error?.description}</div>
        )}
      </div>
      <div className="space-y-2">
        <Label className="text-lg text-black" htmlFor="file">
          File <span className="text-sm ml-[-3px] text-destructive">*</span>
        </Label>
        <Input type="file" id="file" name="file" />
        {product != null && (
          <div className="text-muted-foreground">{product?.filePath}</div>
        )}
        {error?.file && <div className="text-destructive">{error?.file}</div>}
      </div>
      <div className="space-y-2">
        <Label className="text-lg text-black" htmlFor="image">
          Image <span className="text-sm ml-[-3px] text-destructive">*</span>
        </Label>
        <Input type="file" id="image" name="image" accept="image/*" />
        {product != null && (
          <div className="text-muted-foreground">{product?.imagePath}</div>
        )}
        {error?.image && <div className="text-destructive">{error?.image}</div>}
      </div>
      <SubmitButton product={product} />
    </form>
  );
};

export default ProductForm;

const SubmitButton = ({ product }: { product?: Product | null }) => {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="col-span-full" disabled={pending}>
      {pending ? (
        <LoaderIcon className="animate-spin" />
      ) : product != null ? (
        "Update"
      ) : (
        "Save"
      )}
    </Button>
  );
};
