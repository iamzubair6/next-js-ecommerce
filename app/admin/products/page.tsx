import { Button } from "@/components/ui/button";
import { Table, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Link from "next/link";
import PageHeader from "../_components/PageHeader";

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
function ProductTable() {
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
    </Table>
  );
}
