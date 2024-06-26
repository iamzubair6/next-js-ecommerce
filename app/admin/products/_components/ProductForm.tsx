"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { addProduct } from "../../_action/products";

const ProductForm = () => {
  const [price, setPrice] = useState<number>();
  return (
    <form action={addProduct} className="grid grid-cols-2 gap-4">
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
      <div className="space-y-2 col-span-full">
        <Label className="text-lg text-black" htmlFor="description">
          Description
        </Label>
        <Textarea
          id="descritption"
          name="description"
          required
          placeholder="Enter Description"
        />
      </div>
      <div className="space-y-2">
        <Label className="text-lg text-black" htmlFor="file">
          File
        </Label>
        <Input type="file" id="file" name="file" required />
      </div>
      <div className="space-y-2">
        <Label className="text-lg text-black" htmlFor="image">
          Image
        </Label>
        <Input type="file" id="image" name="image" required accept="image/*" />
      </div>
      <Button type="submit" className="col-span-full">
        Save
      </Button>
    </form>
  );
};

export default ProductForm;
