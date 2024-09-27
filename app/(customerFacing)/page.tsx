import ProductCard, { ProductCardSkeleton } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import db from "@/db/db";
import { cache } from "@/lib/cache";
import { Product } from "@prisma/client";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

const getMostPopularProducts = cache(
  () => {
    return db.product.findMany({
      where: { isAvailableForPurchase: true },
      orderBy: { orders: { _count: "desc" } },
      take: 6,
    });
  },
  ["/", "getMostPopularProducts"],
  { revalidate: 60 * 60 * 24 }
);

const getNewestProducts = cache(() => {
  return db.product.findMany({
    where: { isAvailableForPurchase: true },
    orderBy: { createdAt: "desc" },
    take: 6,
  });
}, ["/", "getNewestProducts"]);
// client site main home page
const HomePage = () => {
  return (
    <main className="space-y-12">
      <ProductGridSection
        title="Most Popular"
        productFetcher={getMostPopularProducts}
      />
      <ProductGridSection
        title="Newest Product"
        productFetcher={getNewestProducts}
      />
    </main>
  );
};

export default HomePage;

// components/ProductGridSection.tsx this is a component that will be used in the HomePage to display the most popular and newest products
type ProductGridSectionProp = {
  title: string;
  productFetcher: () => Promise<Product[]>;
};
function ProductGridSection({ productFetcher, title }: ProductGridSectionProp) {
  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <h2 className="text-3xl font-bold">{title}</h2>
        <Button variant={"outline"} asChild>
          <Link href={"/products"} className="space-x-2">
            <span>View All</span>
            <ArrowRight size={16} />
          </Link>
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Suspense
          fallback={
            <>
              <ProductCardSkeleton />
              <ProductCardSkeleton />
              <ProductCardSkeleton />
            </>
          }
        >
          <ProductSuspense productFetcher={productFetcher} />
        </Suspense>
      </div>
    </div>
  );
}

// components/ProductSuspense.tsx this is a component that will be used in the ProductGridSection to display the products
async function ProductSuspense({
  productFetcher,
}: {
  productFetcher: () => Promise<Product[]>;
}) {
  return (await productFetcher()).map((product) => (
    <ProductCard
      key={product.id}
      id={product.id}
      name={product.name}
      priceInTaka={product.priceInTaka}
      description={product.description}
      imagePath={product.imagePath}
    />
  ));
}
