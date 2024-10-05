"use client";
import { userOrderExists } from "@/app/(customerFacing)/action/orders";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatCurrency } from "@/lib/currencyFormater";
import {
  Elements,
  LinkAuthenticationElement,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import Image from "next/legacy/image";
import { FormEvent, useState } from "react";

type CheckoutFormProps = {
  clientSecret: string;
  product: {
    id: string;
    name: string;
    priceInTaka: number;
    imagePath: string;
    description: string;
  };
};
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY as string
);
export function CheckoutForm({ clientSecret, product }: CheckoutFormProps) {
  return (
    <div className="max-w-5xl w-full mx-auto space-y-8">
      <div className="flex gap-4 items-center">
        <div className="aspect-video flex-shrink-0 w-1/3 relative">
          <Image
            src={product?.imagePath}
            layout="fill"
            objectFit="cover"
            priority
            alt={product?.name}
          />
        </div>
        <div>
          <div className="text-lg">
            {formatCurrency(product?.priceInTaka / 100)}
          </div>
          <h1 className="text-2xl font-bold">{product?.name}</h1>
          <div className="line-clamp-3 text-muted-foreground">
            {product?.description}
          </div>
        </div>
      </div>
      <Elements options={{ clientSecret }} stripe={stripePromise}>
        <Form priceInTaka={product?.priceInTaka} productId={product?.id} />
      </Elements>
    </div>
  );
}

function Form({
  priceInTaka,
  productId,
}: {
  priceInTaka: number;
  productId: string;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>("");
  const [email, setEmail] = useState<string>();
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (stripe == null || elements == null || email == null) return;
    setIsLoading(true);

    const orderExists = await userOrderExists(email, productId);
    if (orderExists) {
      setErrorMessage(
        "You have already purchased this product. Try downloading it from My Orders page."
      );
      setIsLoading(false);
      return;
    }
    // check for existing order

    const isProduction = process.env.NODE_ENV === "production";
    stripe
      .confirmPayment({
        elements,
        confirmParams: {
          return_url: `${isProduction ? process.env.NEXT_PUBLIC_SERVER_URL : process.env.NEXT_PUBLIC_LOCAL_URL}/purchase-success`,
        },
      })
      .then(({ error }) => {
        if (error.type === "card_error" || error.type === "validation_error") {
          setErrorMessage(error.message);
        } else {
          setErrorMessage("An unknown error occurred. Please try again.");
        }
      })
      .finally(() => setIsLoading(false));
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Payment Information</CardTitle>
          {errorMessage && (
            <CardDescription className="text-destructive">
              {errorMessage}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <PaymentElement />
          <LinkAuthenticationElement
            onChange={(e) => setEmail(e.value.email)}
          />
        </CardContent>
        <CardFooter>
          <Button
            className="w-full"
            size={"lg"}
            disabled={stripe == null || elements == null || isLoading}
          >
            {isLoading
              ? "Purchasing..."
              : `Purchase - ${formatCurrency(priceInTaka / 100)}`}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
