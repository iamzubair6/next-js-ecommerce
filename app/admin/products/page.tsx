import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import db from "@/db/db";
import { formatCurrency, formatNumber } from "@/lib/currencyFormater";
import { CheckCircle2, MoreVertical, XCircle } from "lucide-react";
import Link from "next/link";
import PageHeader from "../_components/PageHeader";
import {
  ActiveToggleDropdownItem,
  DeleteDropdownItem,
} from "./_components/ProductAction";

export default function AdminProductsPage() {
  return (
    <>
      <div className="flex justify-between gap-4">
        <PageHeader>Products</PageHeader>
        <Button asChild>
          <Link href={"/admin/products/new"}>Add New Product</Link>
        </Button>
      </div>
      <ProductTable />
    </>
  );
}
async function ProductTable() {
  const products = await db.product.findMany({
    select: {
      id: true,
      name: true,
      priceInTaka: true,
      isAvailableForPurchase: true,
      _count: {
        select: {
          orders: true,
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });
  if (products?.length === 0) {
    return <p>No Products Found</p>;
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-0">
            <span className="sr-only">Available For Purchase</span>
          </TableHead>
          <TableHead align="center">Name</TableHead>
          <TableHead align="center">Price</TableHead>
          <TableHead align="center">Order</TableHead>
          <TableHead className="w-0">
            <span className="sr-only">Action</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {products?.map((item, idx) => {
          return (
            <TableRow key={idx}>
              <TableCell>
                {item?.isAvailableForPurchase ? (
                  <>
                    <span className="sr-only">Available</span>
                    <CheckCircle2 className="stroke-green-600" />
                  </>
                ) : (
                  <>
                    <span className="sr-only">Unavailable</span>
                    <XCircle className="stroke-destructive" />
                  </>
                )}
              </TableCell>
              <TableCell>{item?.name}</TableCell>
              <TableCell>{formatCurrency(item?.priceInTaka)}</TableCell>
              <TableCell>{formatNumber(item?._count?.orders)}</TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger>
                    <MoreVertical />
                    <span className="sr-only">Action</span>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem asChild>
                      <a download href={`/admin/products/${item?.id}/download`}>
                        Download
                      </a>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/admin/products/${item?.id}/edit`}>
                        Edit
                      </Link>
                    </DropdownMenuItem>
                    {/* <DropdownMenuItem asChild>
                      <Link href={`/admin/products/${item?.id}/delete`}>
                        Delete
                      </Link>
                    </DropdownMenuItem> */}
                    <ActiveToggleDropdownItem
                      id={item?.id}
                      isAvailableForPurchase={item?.isAvailableForPurchase}
                    />
                    <DropdownMenuSeparator />
                    <DeleteDropdownItem
                      id={item?.id}
                      disabled={item?._count?.orders > 0}
                    />
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
