import { formatCurrency } from "@/lib/currencyFormater";
import Image from "next/legacy/image";
import Link from "next/link";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";

type ProductCardProp = {
  id: string;
  name: string;
  priceInTaka: number;
  description: string;
  imagePath: string;
};
const ProductCard = ({
  id,
  name,
  priceInTaka,
  description,
  imagePath,
}: ProductCardProp) => {
  return (
    <Card className="flex overflow-hidden flex-col">
      <div className="relative w-full h-auto aspect-video">
        <Image src={imagePath} layout="fill" alt={name} priority />
      </div>
      <CardHeader>
        <CardTitle>{name}</CardTitle>
        <CardDescription>{formatCurrency(priceInTaka / 100)}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="line-clamp-4">{description}</p>
      </CardContent>
      <CardFooter>
        <Button asChild size={"lg"} className="w-full">
          <Link href={`/products/${id}/purchase`}>Purchase</Link>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ProductCard;
// components/ProductCardSkeleton.tsx this is a component that will be used in the ProductGridSection to display the skeleton of the products
export const ProductCardSkeleton = () => {
  return (
    <Card className="flex overflow-hidden flex-col animate-pulse">
      <div className="relative w-full bg-gray-300 aspect-video" />
      <CardHeader>
        <CardTitle>
          <div className="w-3/4 h-6 rounded-full bg-gray-300" />
        </CardTitle>
        <CardDescription>
          <div className="w-3/4 h-4 rounded-full bg-gray-300" />
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="w-full h-4 rounded-full bg-gray-300" />
        <div className="w-full h-4 rounded-full bg-gray-300" />
        <div className="w-3/4 h-4 rounded-full bg-gray-300" />
      </CardContent>
      <CardFooter>
        <Button disabled size={"lg"} className="w-full"></Button>
      </CardFooter>
    </Card>
  );
};
