# 💳 Payments API Documentation

## Overview
Complete API documentation for the Payment Link Generation System. This system handles payment link generation for cracked leads, client creation, and transaction management with role-based access control.

---

## 🔐 Authentication & Authorization

### Guards
- **`JwtAuthGuard`**: Ensures user is authenticated
- **`LeadsAccessGuard`**: Restricts access to Sales, HR, and Admin users only

### Access Control
- **Payment Link Generation**: Only the sales representative who cracked the lead can generate payment link
- **Payment Records**: Only the creator can view/update their own payment records

---

## 📋 API Endpoints

### 1. Generate Payment Link
**`POST /leads/payments/payment-link-generate`**

Generates a payment link for a cracked lead, creates client and transaction records.

#### Request Body
```json
{
  "leadId": 123,
  "clientName": "John Doe",
  "companyName": "Acme Corp",
  "email": "john.doe@acme.com",
  "phone": "+1234567890",
  "country": "United States",
  "state": "California",
  "postalCode": "90210",
  "amount": 1500.00,
  "type": "payment",
  "method": "bank"
}
```

#### Required Fields
- `leadId`: ID of the cracked lead
- `clientName`: Individual client name
- `email`: Client email address
- `phone`: Client phone number
- `country`: Client country
- `state`: Client state/province
- `postalCode`: Client postal code
- `amount`: Transaction amount

#### Optional Fields
- `companyName`: Company name (if applicable)
- `type`: Transaction type (defaults to "payment")
- `method`: Payment method (defaults to "bank")

#### Response Format
```json
{
  "success": true,
  "message": "Payment link generated successfully",
  "data": {
    "clientId": 456,
    "transactionId": 789,
    "invoiceId": 101,
    "paymentLink": "https://square.link/abc123",
    "squarePaymentLinkId": "abc123",
    "leadStatus": "payment_link_generated"
  }
}
```

#### Access Control
- **Authentication**: JWT token required
- **Authorization**: Only the sales rep who cracked the lead can generate payment link
- **Role**: Sales team, HR, Admin users

#### Business Logic
1. **Lead Validation**: Verify lead exists and is in "cracked" status
2. **User Verification**: Ensure JWT user matches the `crackedById` from the lead
3. **Square API Integration**: Generate actual payment link using Square API
4. **Database Operations**: 
   - Create client record with industry ID from cracked lead
   - Create transaction record with "pending" status and Square payment link ID
   - Create invoice record linked to the lead and transaction
   - Update lead status to "payment_link_generated"
5. **Transaction Safety**: All operations wrapped in database transaction
6. **Webhook Integration**: Handle real-time payment status updates from Square

#### Error Scenarios
- **400 Bad Request**: Lead not properly cracked, missing required fields
- **401 Unauthorized**: Invalid or missing JWT token
- **403 Forbidden**: User is not the sales rep who cracked the lead
- **404 Not Found**: Lead not found or not in cracked status
- **500 Internal Server Error**: Database operation failure, Square API failure

#### Database Tables Accessed
- **`leads`**: Read lead status, update to "payment_link_generated"
- **`cracked_leads`**: Read industry ID and closed by user
- **`clients`**: Create new client record
- **`transactions`**: Create new transaction record with Square payment link ID
- **`invoices`**: Create new invoice record linked to lead and transaction

---

### 2. Get Payment Details
**`GET /leads/payments/transaction/:id`**

Retrieves payment details for a specific transaction.

#### Request Parameters
- `id`: Transaction ID (number)

#### Response Format
```json
{
  "id": 789,
  "amount": 1500.00,
  "transactionType": "payment",
  "paymentMethod": "bank",
  "status": "pending",
  "client": {
    "id": 456,
    "clientName": "John Doe",
    "companyName": "Acme Corp",
    "email": "john.doe@acme.com"
  },
  "employee": {
    "id": 123,
    "name": "Sales Rep Name"
  }
}
```

#### Access Control
- **Authentication**: JWT token required
- **Authorization**: Only the creator of the transaction can view details

---

### 3. Update Payment Status
**`PATCH /leads/payments/transaction/:id/status`**

Updates the status of a payment transaction.

#### Request Parameters
- `id`: Transaction ID (number)

#### Request Body
```json
{
  "status": "completed"
}
```

#### Response Format
```json
{
  "id": 789,
  "status": "completed",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

#### Access Control
- **Authentication**: JWT token required
- **Authorization**: Only the creator of the transaction can update status

---

### 4. Update Payment Link Details
**`PATCH /leads/payments/transaction/:id/details`**

Updates the payment link details including client information and transaction details. Only the salesperson who created the payment link can update these fields.

#### Request Parameters
- `id`: Transaction ID (number)

#### Request Body
```json
{
  "clientName": "Updated Client Name",
  "email": "updated@example.com",
  "phone": "+1987654321",
  "amount": 2000.00,
  "method": "credit_card"
}
```

**All fields are optional** - only include the fields you want to update.

#### Updatable Fields
**Client Fields:**
- `clientName`: Individual client name
- `companyName`: Company name
- `email`: Client email address
- `phone`: Client phone number
- `country`: Client country
- `state`: Client state/province
- `postalCode`: Client postal code

**Transaction Fields:**
- `amount`: Transaction amount
- `type`: Transaction type
- `method`: Payment method

#### Response Format
```json
{
  "success": true,
  "message": "Payment link details updated successfully",
  "data": {
    "transactionId": 789,
    "clientId": 456,
    "updatedFields": {
      "transaction": ["amount", "method"],
      "client": ["clientName", "email", "phone"]
    }
  }
}
```

#### Access Control
- **Authentication**: JWT token required
- **Authorization**: Only the creator of the payment link can update details
- **Field Restrictions**: Only the fields sent in the request body will be updated

---

## 🔄 Workflow

### Payment Link Generation Flow
```
1. Lead Status: "cracked" ✅
2. User Clicks: "Generate Payment Link" button
3. Form Opens: Client + Transaction information
4. API Call: POST /leads/payments/payment-link-generate
5. Validation: Lead exists, user authorized, fields valid
6. Square API: Simulated payment link generation
7. Success Path: Create client + transaction + invoice + update lead status
8. Failure Path: Return error, no database changes
```

### Database Transaction Safety
- **Client Creation**: Industry ID from cracked lead, createdBy = current user
- **Transaction Creation**: Status = "pending", employeeId = current user
- **Invoice Creation**: Linked to lead and transaction, issueDate = current date
- **Lead Update**: Status changed to "payment_link_generated"
- **Rollback**: If any operation fails, all changes are rolled back

---

## ⚠️ Important Notes

### 1. Industry ID Source
- **Field**: `industryId` in client record
- **Source**: Retrieved from `cracked_leads.industryId`
- **Not Required**: From form input (automatically populated)

### 2. Password Hash
- **Field**: `passwordHash` in client record
- **Value**: Temporary hash for payment link clients
- **Note**: These clients are created without full authentication setup

### 3. Transaction Status
- **Default**: "pending" for new payment links
- **Update**: Only by the creating sales representative
- **Audit**: All status changes tracked with timestamps

### 4. Square API Integration
- **Current**: Simulated API calls for development
- **Future**: Replace with actual Square API integration
- **Fallback**: Database operations only proceed after API success
- **Webhooks**: Handle real-time payment status updates
- **Payment Links**: Generate actual Square payment links
- **Environment**: Configure sandbox/production environments
- **SDK**: Use official Square Connect SDK for Node.js
- **Webhook Events**: payment.created, payment.updated, payment.cancelled

---

## 🧪 Testing Examples

### Test Payment Link Generation
```bash
# Valid request - should succeed
POST /leads/payments/payment-link-generate
{
  "leadId": 123,
  "clientName": "Test Client",
  "email": "test@example.com",
  "phone": "+1234567890",
  "country": "Test Country",
  "state": "Test State",
  "postalCode": "12345",
  "amount": 1000.00
}

# Invalid lead - should fail
POST /leads/payments/payment-link-generate
{
  "leadId": 999,  # Non-existent lead
  ...
}

# Unauthorized user - should fail
# Use JWT token of different user
```

### Test Access Control
```bash
# User A creates payment link
# User B tries to view/update - should be denied
# User A can view/update - should succeed
```

---

## 🔧 Future Enhancements

### 1. Square API Integration
- Replace simulated API calls with actual Square API
- Implement webhook handling for payment status updates
- Add payment link expiration and renewal logic
- **Environment Variables**: Configure Square access tokens and environment
- **SDK Integration**: Use official Square Connect SDK
- **Webhook Endpoints**: Handle payment.created, payment.updated events
- **Payment Link Storage**: Store Square payment link IDs in database

#### Square API Setup Steps:
1. **Install Dependencies**: `npm install @square/connect @square/web-sdk`
2. **Environment Variables**: Add Square credentials to `.env`
3. **Update Service**: Replace `simulateSquareApiCall` with actual Square API calls
4. **Webhook Handler**: Add endpoint to handle Square webhook events
5. **Database Schema**: Add Square payment link ID fields to transaction table
6. **Error Handling**: Implement proper error handling for Square API failures
7. **Testing**: Test with Square sandbox environment before production

### 2. Enhanced Security
- Implement proper password generation for clients
- Add payment link encryption and validation
- Implement rate limiting for payment link generation

### 3. Additional Features
- Payment link analytics and tracking
- Automated payment reminders
- Integration with invoice system
- Multi-currency support



private async callSquareApi(dto: GeneratePaymentLinkDto): Promise<boolean> {
  try {
    // Initialize Square client
    const client = new Client({
      accessToken: process.env.SQUARE_ACCESS_TOKEN,
      environment: process.env.SQUARE_ENVIRONMENT as Environment
    });

    // Create payment link using Square API
    const response = await client.checkoutApi.createPaymentLink({
      idempotencyKey: `payment_link_${Date.now()}`,
      quickPay: {
        name: `Payment for ${dto.clientName}`,
        priceMoney: {
          amount: Math.round(dto.amount * 100), // Square expects cents
          currency: 'USD'
        }
      }
    });

    // Store Square payment link ID for future reference
    this.squarePaymentLinkId = response.result.paymentLink?.id;
    
    return true;
  } catch (error) {
    console.error('Square API Error:', error);
    return false;
  }
}