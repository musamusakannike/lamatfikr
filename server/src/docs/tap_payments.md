# Tap Payments Integration

Here’s a simple explanation of how to integrate TAP Payments (a popular payment gateway for the MENA region) into a Node.js + Express + TypeScript backend app:

🧩 Overview
TAP Payments allows you to accept payments from users via cards, Apple Pay, Mada, etc., commonly used in MENA countries.
 Integration steps are generally:
Create a charge (payment request) from your backend.

Redirect the user to the TAP-hosted payment page.

Handle the callback/redirect after payment (success or failure).

Verify the payment status via the TAP API.

⚙️ Step 1: Setup
Install dependencies:
npm install express axios body-parser
npm install --save-dev typescript @types/express @types/node

Initialize TypeScript if not yet done:
npx tsc --init

⚙️ Step 2: Setup Environment Variables
Create a .env file:
TAP_SECRET_KEY=sk_test_your_secret_key
TAP_PUBLIC_KEY=pk_test_your_public_key

(You can find these keys in your TAP dashboard → Developers → API Keys)

🧱 Step 3: Basic Express Server (TypeScript)
src/server.ts
import express, { Request, Response } from "express";
import axios from "axios";
import bodyParser from "body-parser";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(bodyParser.json());

const TAP_API_URL = <https://api.tap.company/v2/charges>;

// Create a payment charge
app.post("/api/pay", async (req: Request, res: Response) => {
  try {
    const { amount, currency, customerEmail } = req.body;

    const response = await axios.post(
      TAP_API_URL,
      {
        amount,
        currency,
        threeDSecure: true,
        save_card: false,
        description: "Payment for order #1234",
        statement_descriptor: "MyApp",
        customer: {
          email: customerEmail,
        },
        source: {
          id: "src_all", // allows user to choose from all available sources
        },
        redirect: {
          url: "https://yourdomain.com/api/payment/callback", // your redirect URL
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.TAP_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    // Send the payment page URL to frontend
    res.json({ redirectUrl: response.data.transaction.url });
  } catch (error: any) {
    console.error(error.response?.data || error.message);
    res.status(500).json({ message: "Payment initiation failed" });
  }
});

// Callback endpoint for TAP redirect
app.get("/api/payment/callback", (req: Request, res: Response) => {
  const { tap_id } = req.query;
  res.send(`Payment completed. Tap ID: ${tap_id}`);
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

🪄 Step 4: Frontend Flow
Your frontend (React, React Native, etc.) calls POST /api/pay with amount and currency.

Backend responds with redirectUrl (TAP-hosted checkout page).

Redirect the user to that URL.

After payment, TAP redirects the user back to your /api/payment/callback.

🧾 Step 5: (Optional) Verify Payment Status
Once the user returns, you can verify the payment:
app.get("/api/payment/verify/:tap_id", async (req: Request, res: Response) => {
  try {
    const { tap_id } = req.params;
    const response = await axios.get(`https://api.tap.company/v2/charges/${tap_id}`, {
      headers: {
        Authorization: `Bearer ${process.env.TAP_SECRET_KEY}`,
      },
    });

    res.json(response.data);
  } catch (error: any) {
    res.status(500).json({ message: "Verification failed" });
  }
});

✅ Flow Summary
Frontend → POST /api/pay → Backend creates a TAP charge.

Backend → TAP API → Returns checkout URL.

User → Redirects to TAP’s secure payment page.

TAP → Redirects to /api/payment/callback after payment.

Backend → (Optional) Verify payment with /charges/:tap_id.
