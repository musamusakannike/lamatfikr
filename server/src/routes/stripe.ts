import express, { Router } from "express";
import Stripe from "stripe";

import { env } from "../config/env";

export const stripeWebhookRouter = Router();

stripeWebhookRouter.post(
  "/",
  express.raw({ type: "application/json" }),
  (req: express.Request, res: express.Response) => {
    if (!env.STRIPE_SECRET_KEY || !env.STRIPE_WEBHOOK_SECRET) {
      res.status(501).json({ message: "Stripe is not configured" });
      return;
    }

    const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
      apiVersion: "2024-06-20" as Stripe.LatestApiVersion,
    });

    const signature = req.headers["stripe-signature"];
    if (typeof signature !== "string") {
      res.status(400).send("Missing stripe-signature");
      return;
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(req.body, signature, env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      res.status(400).send("Webhook Error");
      return;
    }

    console.log("[stripe] event", event.type);

    res.json({ received: true });
  }
);
