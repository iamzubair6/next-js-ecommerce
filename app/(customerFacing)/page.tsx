import { Button } from "@/components/ui/button";
import db from "@/db/db";
import { Product } from "@prisma/client";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

function getMostPopularProducts() {
  return db.product.findMany({
    where: { isAvailableForPurchase: true },
    orderBy: { orders: { _count: "desc" } },
    take: 6,
  });
}
function getNewestProducts() {
  return db.product.findMany({
    where: { isAvailableForPurchase: true },
    orderBy: { createdAt: "desc" },
    take: 6,
  });
}

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

type ProductGridSectionProp = {
  title: string;
  productFetcher: () => Promise<Product[]>;
};
function ProductGridSection({ title }: ProductGridSectionProp) {
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"></div>
    </div>
  );
}
