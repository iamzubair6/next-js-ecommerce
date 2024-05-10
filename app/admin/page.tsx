import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import db from "@/db/db";
import { formatCurrency, formatNumber } from "@/lib/currencyFormater";
interface CardsType {
  title: string;
  description: string | number;
  content: string | number;
}
async function GetSalesData() {
  const salesData = await db?.order?.aggregate({
    _sum: { pricePaidInTaka: true },
    _count: true,
  });

  let amount = salesData?._sum?.pricePaidInTaka || 0;
  let numberOfSales = salesData?._count || 0;

  return {
    amount,
    numberOfSales,
  };
}
async function GetUserData() {
  const [userCount, orderData] = await Promise.all([
    db.user.count(),
    db.order.aggregate({ _sum: { pricePaidInTaka: true } }),
  ]);

  let averageValuePerUser =
    userCount === 0 ? 0 : (orderData?._sum?.pricePaidInTaka || 0) / userCount;

  return {
    userCount,
    averageValuePerUser,
  };
}
async function GetProductData() {
  const [activeProducts, inactiveProducts] = await Promise.all([
    db.product.count({ where: { isAvailableForPurchase: true } }),
    db.product.count({ where: { isAvailableForPurchase: false } }),
  ]);
  return {
    activeProducts,
    inactiveProducts,
  };
}
export default async function AdminDashboard() {
  const [sales, users, product] = await Promise.all([
    GetSalesData(),
    GetUserData(),
    GetProductData(),
  ]);

  const cards: CardsType[] = [
    {
      title: "Sales",
      description: sales?.numberOfSales.toLocaleString("bn-BD") + " Orders",
      content: sales?.amount.toLocaleString("bn-BD", {
        style: "currency",
        currency: "BDT",
        minimumFractionDigits: 0,
      }),
    },
    {
      title: "Customers",
      // description: users?.userCount.toLocaleString("bn-BD") + " Users",
      // content: users?.averageValuePerUser.toLocaleString("bn-BD", {
      //   style: "currency",
      //   currency: "BDT",
      //   minimumFractionDigits: 0,
      // }),
      description: `${formatCurrency(users?.averageValuePerUser) + " " + "Average Value"}`,
      content: `${formatNumber(users?.userCount)}`,
    },
    {
      title: "Active Products",
      description: `${formatNumber(product?.inactiveProducts) + " " + "Inactive"}`,
      content: `${formatNumber(product?.activeProducts) + " " + "Active"}`,
    },
  ];

  return (
    <>
      <div className="grid grid-cols-1-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <DashboardCards cards={cards} />
      </div>
    </>
  );
}

type DashboardCardsProp = {
  cards: CardsType[];
};
export function DashboardCards({ cards }: DashboardCardsProp) {
  return cards?.map(({ title, description, content }, idx: number) => {
    return (
      <Card key={idx}>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>{content}</CardContent>
      </Card>
    );
  });
}
