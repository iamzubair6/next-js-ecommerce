"use client";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import React from "react";

type CheckoutFormProps = {
  clientSecret: string;
  product: {};
};
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY as string
);
const CheckoutForm: React.FC<CheckoutFormProps> = ({
  clientSecret,
  product,
}) => {
  return (
    <Elements options={{ clientSecret }} stripe={stripePromise}>
      <Form />
    </Elements>
  );
};

export default CheckoutForm;

function Form() {
  const stripe = useStripe();
  const elements = useElements();
  return <PaymentElement />;
}
