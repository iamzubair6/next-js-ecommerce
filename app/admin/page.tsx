import db from "@/db/db";
import { formatCurrency, formatNumber } from "@/lib/currencyFormater";
import DashBoardCards from "./_components/DashBoardCards";

interface CardsType {
  title: string;
  description: string | number;
  content: string | number;
}

async function GetSalesData() {
  try {
    const salesData = await db?.order?.aggregate({
      _sum: { pricePaidInTaka: true },
      _count: true,
    });

    let amount = salesData?._sum?.pricePaidInTaka || 0;
    let numberOfSales = salesData?._count || 0;

    await wait(1000); // Simulating delay

    return {
      amount,
      numberOfSales,
    };
  } catch (error) {
    console.error("Error fetching sales data:", error);
    return {
      amount: 0, // Fallback to zero if error occurs
      numberOfSales: 0, // Fallback to zero if error occurs
    };
  }
}

async function GetUserData() {
  try {
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
  } catch (error) {
    console.error("Error fetching user data:", error);
    return {
      userCount: 0,
      averageValuePerUser: 0,
    };
  }
}

async function GetProductData() {
  try {
    const [activeProducts, inactiveProducts] = await Promise.all([
      db.product.count({ where: { isAvailableForPurchase: true } }),
      db.product.count({ where: { isAvailableForPurchase: false } }),
    ]);
    return {
      activeProducts,
      inactiveProducts,
    };
  } catch (error) {
    console.error("Error fetching product data:", error);
    return {
      activeProducts: 0,
      inactiveProducts: 0,
    };
  }
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
      description: `${formatCurrency(users?.averageValuePerUser) + " Average Value"}`,
      content: `${formatNumber(users?.userCount)}`,
    },
    {
      title: "Active Products",
      description: `${formatNumber(product?.inactiveProducts) + " Inactive"}`,
      content: `${formatNumber(product?.activeProducts) + " Active"}`,
    },
  ];

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <DashBoardCards cards={cards} />
      </div>
    </>
  );
}
