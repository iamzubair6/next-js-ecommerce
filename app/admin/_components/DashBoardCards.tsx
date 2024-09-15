import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import React from "react";

const DashBoardCards:React.FC<any> = ({cards}) => {
  return cards?.map((item:any, idx: number) => {
    return (
      <Card key={idx}>
        <CardHeader>
          <CardTitle>{item?.title}</CardTitle>
          <CardDescription>{item?.description}</CardDescription>
        </CardHeader>
        <CardContent>{item?.content}</CardContent>
      </Card>
    );
  });
}

export default DashBoardCards