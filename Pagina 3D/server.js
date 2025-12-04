require('dotenv').config();
const express = require('express');
const path = require('path');
const Stripe = require('stripe');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 4242;

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('WARNING: STRIPE_SECRET_KEY not set. Set it in .env before using real payments.');
}

const stripe = Stripe(process.env.STRIPE_SECRET_KEY || '');

app.use(cors());
app.use(express.json());

// Servir archivos estáticos (tu sitio)
app.use(express.static(path.join(__dirname, '.')));

// Endpoint para crear una sesión de Checkout
app.post('/create-checkout-session', async (req, res) => {
  try {
    const { order } = req.body; // order: { cart: [{id,name,price,qty,image}], name, email, address }
    if (!order || !Array.isArray(order.cart) || order.cart.length === 0) {
      return res.status(400).json({ error: 'Carrito vacío' });
    }

    const origin = req.headers.origin || `http://localhost:${PORT}`;

    const line_items = order.cart.map(item => ({
      price_data: {
        currency: 'usd',
        product_data: { name: item.name },
        unit_amount: Math.round(Number(item.price) * 100),
      },
      quantity: item.qty
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items,
      mode: 'payment',
      success_url: `${origin}/gracias.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/cart.html`,
      customer_email: order.email || undefined,
      metadata: { order_id: order.id || '' }
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => console.log(`Server listening on http://localhost:${PORT}`));
