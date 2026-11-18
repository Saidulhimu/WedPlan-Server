import { Request, Response } from "express";
import { stripe } from "../config/stripe";
import { User } from "../models/User";
import { Transaction } from "../models/Transaction";

const PREMIUM_PRICE_CENTS = 4900; // $49.00 USD for Premium Vendor lifetime / unlimited tier

// Vendor: Create Stripe Checkout Session
export const createCheckoutSession = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    if (req.user.role !== "vendor") {
      res.status(403).json({ success: false, message: "Only vendors can upgrade to a Premium subscription." });
      return;
    }

    const vendor = await User.findById(req.user.id);
    if (!vendor) {
      res.status(404).json({ success: false, message: "Vendor not found." });
      return;
    }

    if (vendor.subscriptionPlan === "premium") {
      res.status(400).json({ success: false, message: "You already have an active Premium subscription." });
      return;
    }

    const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "WedPlan Premium Vendor Membership",
              description: "Publish unlimited wedding services, priority platform placement, and verified badge.",
              images: ["https://images.unsplash.com/photo-1519741497674-611481863552?w=800"],
            },
            unit_amount: PREMIUM_PRICE_CENTS,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      customer_email: vendor.email,
      metadata: {
        vendorId: vendor._id.toString(),
        plan: "premium",
      },
      success_url: `${clientUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${clientUrl}/payment/cancel`,
    });

    res.status(200).json({
      success: true,
      url: session.url,
      sessionId: session.id,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to create checkout session" });
  }
};

// Webhook: Verified Stripe Webhook Handler
export const handleStripeWebhook = async (req: Request, res: Response): Promise<void> => {
  const sig = req.headers["stripe-signature"] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    if (webhookSecret && sig) {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } else {
      // In case webhook secret is not set, fallback to body
      event = req.body;
    }
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  // Handle checkout.session.completed
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as any;
    const vendorId = session.metadata?.vendorId;

    if (vendorId) {
      try {
        await User.findByIdAndUpdate(vendorId, {
          subscriptionPlan: "premium",
        });

        // Save transaction
        await Transaction.findOneAndUpdate(
          { stripeSessionId: session.id },
          {
            vendorId,
            plan: "premium",
            amount: (session.amount_total || PREMIUM_PRICE_CENTS) / 100,
            currency: session.currency || "usd",
            stripeSessionId: session.id,
            status: "succeeded",
          },
          { upsert: true, new: true }
        );

        console.log(`Successfully upgraded vendor ${vendorId} to Premium via Stripe Webhook`);
      } catch (err) {
        console.error("Error updating vendor via webhook:", err);
      }
    }
  }

  res.status(200).json({ received: true });
};

// Fallback Server-Side Session Verification (ensures local evaluation without webhook tunnel)
export const verifyCheckoutSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      res.status(400).json({ success: false, message: "Session ID is required" });
      return;
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status === "paid") {
      const vendorId = session.metadata?.vendorId;
      if (vendorId) {
        await User.findByIdAndUpdate(vendorId, {
          subscriptionPlan: "premium",
        });

        const transaction = await Transaction.findOneAndUpdate(
          { stripeSessionId: session.id },
          {
            vendorId,
            plan: "premium",
            amount: (session.amount_total || PREMIUM_PRICE_CENTS) / 100,
            currency: session.currency || "usd",
            stripeSessionId: session.id,
            status: "succeeded",
          },
          { upsert: true, new: true }
        );

        res.status(200).json({
          success: true,
          message: "Payment verified successfully! Your account is now upgraded to Premium.",
          transaction,
        });
        return;
      }
    }

    res.status(400).json({ success: false, message: "Payment has not been completed or verified." });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to verify session" });
  }
};
