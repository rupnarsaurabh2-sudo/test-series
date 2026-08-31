const Razorpay = require('razorpay');

export default async function handler(req, res) {
  // Sirf POST request accept karega
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  // Initialize Razorpay (Vercel ke environment variables use kar)
  const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_YOUR_KEY_ID_HERE', 
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'YOUR_KEY_SECRET_HERE',
  });

  const { amount, currency } = req.body;

  try {
    const options = {
      amount: amount || 9900, // ₹99
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
