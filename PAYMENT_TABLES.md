# Tables Populated on Successful Payment

## Current Implementation

### ✅ **user_entries** table
**This is the ONLY table populated on successful payment.**

When a payment is successful, the following data is inserted into `user_entries`:

- `competition_id` - UUID (or NULL if temp competition)
- `entry_number` - INTEGER (1-20, the selected number)
- `player_name` - VARCHAR (the name entered by the user)
- `payment_transaction_id` - VARCHAR (PayPal transaction ID)
- `payment_amount` - DECIMAL (amount paid)
- `payment_currency` - VARCHAR (currency code, e.g., 'USD' or 'ZAR')
- `payment_status` - VARCHAR (set to 'completed')
- `payment_completed_at` - TIMESTAMPTZ (timestamp of payment)
- `created_at` - TIMESTAMPTZ (timestamp of record creation)

**One row is inserted for each selected number** (if user selects 3 numbers, 3 rows are created).

---

## Tables NOT Populated on Payment

### ❌ **competitions** table
- **NOT populated on payment**
- Should be populated when admin saves prize data (currently not implemented in code)
- Contains competition details (title, photo, description, prize value, ticket price, spin date/time)

### ❌ **spin_results** table
- **REMOVED** - This table was deleted as unused
- Was intended for storing winning spin results

### ❌ **winners** table
- **REMOVED** - This table was deleted as unused
- Was intended for storing winner information

---

## Summary

**On successful payment, only ONE table is populated:**
1. **user_entries** - One row per selected number with payment details

**Total tables in database:**
1. **competitions** - Competition details (populated by admin, not on payment)
2. **user_entries** - Payment/entry data (populated on successful payment)


