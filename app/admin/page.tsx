import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import db from "@/db/db";
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

export default async function AdminDashboard() {
  const sales = await GetSalesData();
  const cards: CardsType[] = [
    {
      title: "Sales",
      description: sales?.numberOfSales.toLocaleString("bn-BD"),
      content: sales?.amount.toLocaleString("bn-BD", {
        style: "currency",
        currency: "BDT",
      }),
    },
    {
      title: "Orders",
      description: "Lorem ipsum dolor sit amet.",
      content:
        "Lorem ipsum dolor sit amet, consectetur adipisicing elit. Quaerat, atque.",
    },
    {
      title: "Products",
      description: "Lorem ipsum dolor sit amet.",
      content:
        "Lorem ipsum dolor sit amet, consectetur adipisicing elit. Quaer",
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
