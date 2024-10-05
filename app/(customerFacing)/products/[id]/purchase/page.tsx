import db from "@/db/db";
import { notFound } from "next/navigation";
import Stripe from "stripe";
import { CheckoutForm } from "./_components/CheckoutForm";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

const PurchaseProduct = async ({
  params: { id },
}: {
  params: { id: string };
}) => {
  const product = await db.product.findUnique({
    where: { id },
  });
  if (!product) {
    return notFound();
  }
  const paymentIntent = await stripe.paymentIntents.create({
    amount: product.priceInTaka,
    currency: "BDT",
    metadata: { productId: product.id },
  });
  if (paymentIntent.client_secret == null) {
    throw new Error("Stripe faild to create payment intent");
  }
  return (
    <CheckoutForm
      product={product}
      clientSecret={paymentIntent.client_secret}
    />
  );
};

export default PurchaseProduct;
