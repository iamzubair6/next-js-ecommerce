"use client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";

const ProductForm = () => {
  const [price, setPrice] = useState<number>();
  return (
    <form className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label className="text-lg text-black" htmlFor="name">
          Product Name
        </Label>
        <Input
          type="text"
          id="name"
          name="product_name"
          required
          placeholder="Enter Product Name"
        />
      </div>
      <div className="space-y-2">
        <Label className="text-lg text-black" htmlFor="price">
          Product Price
        </Label>
        <Input
          value={!price ? "" : price}
          onChange={(e) => setPrice(Number(e?.target?.value))}
          type="number"
          id="price"
          name="product_price"
          required
          placeholder="Enter Product Price"
        />
      </div>
    </form>
  );
};

export default ProductForm;
