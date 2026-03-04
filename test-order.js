async function runTest() {
  const payload = {
    partner_id: 14,
    delivery_window: "12-15",
    payment_method: "efectivo",
    cart_lines: [
      { product_id: 1, qty: 2, price: 50 }, 
      { product_id: 2, qty: 1, price: 120 }
    ]
  };

  try {
    console.log("Sending order payload to Next.js API...");
    const response = await fetch('http://localhost:3001/api/orders/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    const data = await response.json();
    console.log("Response:", data);
    
    if (response.ok && data.success) {
      console.log(`✅ Success! Order created: ${data.order_name} (ID: ${data.order_id})`);
    } else {
      console.error("❌ Failed!");
    }
  } catch (err) {
    console.error("❌ Exception during test:", err.message);
  }
}

runTest();
