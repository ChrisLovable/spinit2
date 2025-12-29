# PayPal Setup Complete Guide

## ✅ What's Already Done

1. ✅ PayPal SDK script added to `index.html`
2. ✅ PayPal client ID configured: `AcOhAoDv1YGtO6KG9VUwBkdNmqpTI9VUVVzkzWTpCP2GVu17nrsElPtuxQm-WK4j6xMFOsILJkH1W3Am`
3. ✅ Currency set to ZAR (South African Rand)
4. ✅ Code updated to use ticket price from admin panel
5. ✅ Payment flow implemented with success/error handling

## 🔧 What You Need to Do

### 1. **Verify PayPal Client ID**

The current client ID in your code is:
```
AcOhAoDv1YGtO6KG9VUwBkdNmqpTI9VUVVzkzWTpCP2GVu17nrsElPtuxQm-WK4j6xMFOsILJkH1W3Am
```

**Action Required:**
- Go to [PayPal Developer Dashboard](https://developer.paypal.com/)
- Log in with your PayPal business account
- Navigate to **My Apps & Credentials**
- Verify this is your **LIVE** client ID (not sandbox)
- If using sandbox for testing, replace with your sandbox client ID

### 2. **Set Up PayPal Business Account**

**If you don't have one:**
1. Go to [PayPal Business](https://www.paypal.com/business)
2. Sign up for a business account
3. Complete business verification
4. Get your client ID from developer dashboard

### 3. **Configure PayPal App**

In PayPal Developer Dashboard:
1. Create a new app (or use existing)
2. Set app name (e.g., "Prize Wheel App")
3. Get your **Client ID** and **Secret**
4. Copy the Client ID to your code

### 4. **Test Mode vs Live Mode**

**For Testing (Sandbox):**
- Use sandbox client ID
- Test with PayPal sandbox accounts
- No real money transactions

**For Production (Live):**
- Use live client ID
- Real money transactions
- Requires verified business account

### 5. **Update Client ID in Code (if needed)**

If you need to change the client ID, edit `index.html`:

```html
<script src="https://www.paypal.com/sdk/js?client-id=YOUR_CLIENT_ID_HERE&currency=ZAR"></script>
```

### 6. **Backend Integration (Optional but Recommended)**

Currently, payments are processed client-side. For production, you should:

**A. Create a backend endpoint to:**
- Verify payment on server side
- Save payment details to database
- Prevent payment manipulation
- Send confirmation emails

**B. Update `onApprove` handler to:**
```javascript
onApprove: (data, actions) => {
  return actions.order.capture().then(async (details) => {
    // Send to your backend
    const response = await fetch('/api/verify-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderID: data.orderID,
        payerID: data.payerID,
        paymentDetails: details,
        selectedNumbers: Array.from(selectedNumbers.entries()),
        ticketPrice: getTicketPriceFromAdmin()
      })
    });
    
    if (response.ok) {
      // Payment verified and saved
      alert('Payment completed ✅');
    }
  });
}
```

### 7. **Database Integration**

Update the `onApprove` handler to save to database:

```javascript
onApprove: (data, actions) => {
  return actions.order.capture().then(async (details) => {
    // Save to database
    const paymentData = {
      transaction_id: details.id,
      payer_email: details.payer.email_address,
      amount: details.purchase_units[0].amount.value,
      currency: details.purchase_units[0].amount.currency_code,
      status: details.status,
      selected_numbers: Array.from(selectedNumbers.entries()),
      ticket_price: getTicketPriceFromAdmin(),
      timestamp: new Date().toISOString()
    };
    
    // TODO: Send to your backend API
    // await fetch('/api/save-payment', { ... });
    
    console.log('Payment data to save:', paymentData);
  });
}
```

### 8. **Security Considerations**

**Important Security Steps:**
1. ✅ **Never expose your PayPal Secret** in frontend code
2. ✅ **Verify payments on backend** (don't trust client-side only)
3. ✅ **Use HTTPS** in production
4. ✅ **Validate amounts server-side** before processing
5. ✅ **Log all transactions** for audit trail

### 9. **Testing Checklist**

Before going live, test:
- [ ] Payment with 1 ticket
- [ ] Payment with multiple tickets
- [ ] Payment cancellation
- [ ] Payment errors
- [ ] Different ticket prices from admin
- [ ] Currency display (ZAR)
- [ ] Success message display
- [ ] Selection clearing after payment

### 10. **Current Implementation Status**

✅ **Working:**
- PayPal SDK loaded
- Payment buttons render
- Uses ticket price from admin panel
- Calculates total correctly
- Processes payments
- Shows success/error messages
- Clears selections after payment

⚠️ **Needs Backend:**
- Payment verification on server
- Database saving
- Email confirmations
- Receipt generation

## 📝 Quick Start

1. **Verify your PayPal Client ID** in `index.html`
2. **Set ticket price in admin panel** (password: 11274)
3. **Test with PayPal sandbox** first
4. **Switch to live client ID** when ready for production
5. **Add backend verification** for security

## 🔗 Useful Links

- [PayPal Developer Dashboard](https://developer.paypal.com/)
- [PayPal REST API Docs](https://developer.paypal.com/docs/api/overview/)
- [PayPal SDK Reference](https://developer.paypal.com/docs/checkout/)
- [PayPal Testing Guide](https://developer.paypal.com/docs/api-basics/sandbox/)

## 💡 Current Code Features

- ✅ Dynamically gets ticket price from admin panel
- ✅ Calculates total: `ticketPrice × quantity`
- ✅ Currency: ZAR (South African Rand)
- ✅ Simplified payment structure
- ✅ Error handling
- ✅ Success confirmation
- ✅ Auto-clears selections after payment

## 🚀 Next Steps

1. Test with sandbox account
2. Set up backend API for payment verification
3. Integrate with database
4. Add email notifications
5. Switch to live mode when ready


