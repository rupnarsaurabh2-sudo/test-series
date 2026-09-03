const Razorpay = require('razorpay');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  // Key ID public hai isliye direct likhi hai, Secret Vercel se aayega
  const razorpay = new Razorpay({
    key_id: 'rzp_test_TXaJFc0u3LxNqI', 
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'oyjtZKZZXyQGcemCo1MBwII2',
  });

  const { amount, currency } = req.body;

  try {
    const options = {
      amount: amount || 9900, // ₹99 = 9900 paise
      currency: currency || 'INR',
      receipt: 'receipt_order_' + Math.floor(Math.random() * 1000000),
    };

    const order = await razorpay.orders.create(options);
    res.status(200).json(order);
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ message: 'Error creating order', error: error });
  }
}
