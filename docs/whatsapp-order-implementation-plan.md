# WhatsApp Order Implementation Plan

## Executive Summary
Implement WhatsApp integration to allow customers to place orders directly through WhatsApp, with automated order processing, payment links, and order tracking.

---

## 1. Integration Options

### Option A: WhatsApp Business API (Official - Recommended)
**Pros:**
- Official Meta integration
- Full automation capabilities
- Message templates
- Rich media support
- Verified business account
- Better deliverability

**Cons:**
- Requires Meta Business verification
- Monthly costs (~$0.005-0.009 per message)
- Setup complexity
- Approval process for message templates

**Best For:** Professional, scalable solution with automation

### Option B: WhatsApp Business App + Link-based
**Pros:**
- Free to use
- Quick to implement
- No API setup needed
- Works immediately

**Cons:**
- Manual message handling
- Limited automation
- No webhooks
- Can't initiate conversations

**Best For:** Quick MVP, small businesses

### Option C: Third-Party Services (Twilio, 360Dialog, etc.)
**Pros:**
- Easier setup than direct API
- Good documentation
- Support included
- Quick integration

**Cons:**
- Additional service fees
- Dependency on third party
- Still requires Business API access

**Best For:** Medium businesses wanting easier setup

---

## 2. Recommended Approach: Hybrid Solution (Phase 1 & 2)

### Phase 1: Link-Based Orders (Quick Win - 1 week)
Start with WhatsApp link generation and manual processing

### Phase 2: WhatsApp Business API Integration (2-3 weeks)
Full automation with message templates and webhooks

---

## 3. Phase 1: Link-Based Implementation

### 3.1 Core Features

#### A. Order Link Generation
- Generate unique WhatsApp links with pre-filled order details
- Format: `https://wa.me/60123456789?text=Order%20Details`
- Include: Order ID, Product list, Total amount, Payment link

#### B. Customer Portal for WhatsApp Orders
- Dedicated page: `/order/whatsapp/[orderId]`
- QR code for easy mobile scanning
- "Order via WhatsApp" button
- Auto-populate order details in WhatsApp message

#### C. Business Features
- WhatsApp number configuration in company settings
- Order notification preferences
- Message templates customization
- Order confirmation via WhatsApp link sharing

### 3.2 Database Schema Changes

```sql
-- Add WhatsApp support to company_settings
ALTER TABLE company_settings
ADD COLUMN whatsapp_number VARCHAR(20),
ADD COLUMN whatsapp_enabled BOOLEAN DEFAULT false,
ADD COLUMN whatsapp_order_template TEXT;

-- Add WhatsApp tracking to orders
ALTER TABLE orders
ADD COLUMN whatsapp_order_id VARCHAR(100),
ADD COLUMN whatsapp_customer_phone VARCHAR(20),
ADD COLUMN whatsapp_message_sent BOOLEAN DEFAULT false,
ADD COLUMN whatsapp_message_sent_at TIMESTAMP;

-- Create WhatsApp message log table
CREATE TABLE whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  customer_phone VARCHAR(20) NOT NULL,
  message_type VARCHAR(50) NOT NULL, -- 'order_confirmation', 'payment_link', 'status_update'
  message_content TEXT NOT NULL,
  direction VARCHAR(10) NOT NULL, -- 'outbound', 'inbound'
  status VARCHAR(20) NOT NULL, -- 'pending', 'sent', 'delivered', 'read', 'failed'
  whatsapp_message_id VARCHAR(100),
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_whatsapp_messages_order ON whatsapp_messages(order_id);
CREATE INDEX idx_whatsapp_messages_user ON whatsapp_messages(user_id);
CREATE INDEX idx_whatsapp_messages_phone ON whatsapp_messages(customer_phone);
```

### 3.3 User Flow (Phase 1)

#### Customer Journey:
1. Customer receives product link (existing feature)
2. Customer selects products and quantities
3. On checkout, sees "Order via WhatsApp" option
4. Clicks button → Opens WhatsApp with pre-filled message:
   ```
   Hi! I'd like to place an order:

   Order ID: #WA12345
   Products:
   - Product A x 2 = RM 50.00
   - Product B x 1 = RM 25.00

   Subtotal: RM 75.00
   Tax (6%): RM 4.50
   Total: RM 79.50

   Please confirm my order and send payment details.

   Order Link: https://getinvoice.com/order/wa/12345
   ```

5. Business owner receives WhatsApp message
6. Business replies with payment link or invoice
7. Customer pays and confirms
8. Business marks order as paid in system

#### Business Owner Journey:
1. Receives WhatsApp notification
2. Opens order link from message
3. Reviews order details in system
4. Clicks "Send Payment Link via WhatsApp"
5. Shares invoice/payment link
6. Updates order status when paid

### 3.4 Implementation Files (Phase 1)

**New Files:**
```
src/lib/whatsapp/
  ├── link-generator.ts          # Generate WhatsApp links
  ├── message-templates.ts       # Pre-defined message formats
  └── phone-formatter.ts         # Format phone numbers

src/app/api/whatsapp/
  └── generate-link/route.ts     # API to generate WhatsApp links

src/components/whatsapp/
  ├── whatsapp-order-button.tsx  # Button component
  ├── whatsapp-qr-code.tsx       # QR code generator
  └── whatsapp-settings.tsx      # Settings panel

src/app/dashboard/company/
  └── whatsapp-config.tsx        # WhatsApp number setup
```

**Modified Files:**
```
src/app/order/[token]/page.tsx              # Add WhatsApp option
src/app/dashboard/orders/page.tsx           # Add WhatsApp actions
src/app/dashboard/company/page.tsx          # Add WhatsApp settings
supabase/migrations/XXX_whatsapp_schema.sql # Database changes
```

---

## 4. Phase 2: WhatsApp Business API Integration

### 4.1 Prerequisites

#### A. WhatsApp Business API Access
1. Create Meta Business Account
2. Apply for WhatsApp Business API access
3. Verify business
4. Get Phone Number ID
5. Get Access Token

#### B. Required Services
- Meta WhatsApp Business Platform
- Webhook endpoint (for receiving messages)
- SSL certificate (required for webhooks)
- Cloud hosting (Vercel supports webhooks)

### 4.2 Advanced Features

#### A. Automated Order Processing
- Customer sends "order" → Bot responds with product catalog
- Customer selects products → Bot calculates total
- Customer confirms → Order created automatically
- Bot sends payment link
- Bot confirms payment → Order marked as paid

#### B. Interactive Messages
- Product catalog messages (list up to 10 products)
- Quick reply buttons
- List messages for product selection
- Call-to-action buttons

#### C. Message Templates (Pre-approved)
```
Template: order_confirmation
Category: TRANSACTIONAL

Hello {{1}},

Your order {{2}} has been confirmed!

Total: {{3}}

Expected delivery: {{4}}

Track your order: {{5}}

Thank you for your business!
```

#### D. Webhooks & Real-time Updates
- Receive customer messages
- Message status updates (sent, delivered, read)
- Customer replies
- Order updates trigger WhatsApp notifications

### 4.3 Technical Architecture (Phase 2)

```
┌─────────────────┐
│   Customer      │
│   (WhatsApp)    │
└────────┬────────┘
         │
         ↓
┌─────────────────────────────┐
│  Meta WhatsApp Business API │
└────────┬───────────┬────────┘
         │           │
    Webhook      Send Message
         │           │
         ↓           ↓
┌─────────────────────────────┐
│  Next.js API Routes         │
│  /api/whatsapp/             │
│    ├── webhook/route.ts     │
│    ├── send-message/route.ts│
│    └── catalog/route.ts     │
└────────┬────────────────────┘
         │
         ↓
┌─────────────────────────────┐
│  Business Logic Layer       │
│  - Order Processing         │
│  - Payment Integration      │
│  - Inventory Management     │
└────────┬────────────────────┘
         │
         ↓
┌─────────────────────────────┐
│  Supabase Database          │
│  - orders                   │
│  - whatsapp_messages        │
│  - whatsapp_sessions        │
└─────────────────────────────┘
```

### 4.4 Implementation Files (Phase 2)

**New Files:**
```
src/lib/whatsapp/
  ├── api-client.ts              # WhatsApp API wrapper
  ├── webhook-handler.ts         # Process incoming messages
  ├── message-sender.ts          # Send messages via API
  ├── template-manager.ts        # Manage message templates
  ├── catalog-sync.ts            # Sync products to WhatsApp catalog
  └── session-manager.ts         # Manage conversation sessions

src/app/api/whatsapp/
  ├── webhook/route.ts           # Receive WhatsApp messages
  ├── send-message/route.ts      # Send messages
  ├── send-template/route.ts     # Send template messages
  ├── catalog/sync/route.ts      # Sync product catalog
  └── status/route.ts            # Message status updates

src/components/whatsapp/
  ├── message-thread.tsx         # Display conversation
  ├── quick-replies.tsx          # Quick reply interface
  ├── template-editor.tsx        # Edit message templates
  └── analytics-dashboard.tsx    # WhatsApp analytics

src/app/dashboard/whatsapp/
  ├── page.tsx                   # WhatsApp main dashboard
  ├── messages/page.tsx          # View all conversations
  ├── templates/page.tsx         # Manage templates
  └── analytics/page.tsx         # WhatsApp performance
```

### 4.5 Additional Database Tables (Phase 2)

```sql
-- Conversation sessions
CREATE TABLE whatsapp_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  customer_phone VARCHAR(20) NOT NULL,
  customer_name VARCHAR(255),
  session_status VARCHAR(20) DEFAULT 'active', -- 'active', 'completed', 'abandoned'
  current_step VARCHAR(50), -- 'browsing', 'selecting', 'confirming', 'payment'
  cart_data JSONB,
  last_message_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- WhatsApp templates
CREATE TABLE whatsapp_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  template_name VARCHAR(100) NOT NULL,
  template_category VARCHAR(50) NOT NULL,
  language VARCHAR(10) DEFAULT 'en',
  header_text TEXT,
  body_text TEXT NOT NULL,
  footer_text TEXT,
  buttons JSONB,
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  whatsapp_template_id VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- WhatsApp catalog sync
CREATE TABLE whatsapp_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  product_id UUID REFERENCES products(id),
  whatsapp_product_id VARCHAR(100),
  sync_status VARCHAR(20) DEFAULT 'pending',
  last_synced_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 5. Security & Compliance

### 5.1 Security Measures
- Verify webhook signatures from Meta
- Encrypt WhatsApp API credentials
- Rate limiting on webhook endpoint
- Phone number validation
- Sanitize all incoming messages
- HTTPS only (required by WhatsApp)

### 5.2 Data Privacy
- Store minimal customer data
- GDPR compliance for EU customers
- Clear opt-in/opt-out mechanism
- Data retention policies
- Customer data export capability

### 5.3 WhatsApp Policies
- No spam messages
- Obtain customer consent
- 24-hour response window
- Use approved templates only
- No promotional messages without opt-in

---

## 6. Cost Estimation

### Phase 1 (Link-Based): FREE
- No API costs
- Only development time

### Phase 2 (WhatsApp Business API):
- **Setup:** FREE (through Meta)
- **Messaging Costs:**
  - Business-initiated: $0.005-0.009 per message (varies by country)
  - User-initiated (24hr window): FREE
  - Template messages: Charged
- **Estimated Monthly Cost:**
  - 1000 orders/month: ~$5-10
  - 5000 orders/month: ~$25-45
  - 10,000 orders/month: ~$50-90

### Third-Party Provider (Optional):
- **Twilio WhatsApp:**
  - $0.005 per message + Twilio fees
  - ~$15-30/month for moderate volume
- **360Dialog:**
  - €49-199/month based on volume
  - Includes support

---

## 7. Implementation Timeline

### Phase 1: Link-Based (1 Week)
- **Day 1-2:** Database schema + migration
- **Day 3-4:** Link generator + message templates
- **Day 5:** Order page integration
- **Day 6:** Company settings integration
- **Day 7:** Testing + refinement

### Phase 2: API Integration (2-3 Weeks)
- **Week 1:**
  - Day 1-2: Meta Business setup + API credentials
  - Day 3-4: Webhook implementation
  - Day 5-7: Message sending functionality
- **Week 2:**
  - Day 1-3: Template management
  - Day 4-5: Catalog sync
  - Day 6-7: Conversation handling
- **Week 3:**
  - Day 1-3: Analytics + dashboard
  - Day 4-5: Testing
  - Day 6-7: Documentation + deployment

---

## 8. Alternative: Simple WhatsApp Integration (Recommended Start)

For fastest time-to-market, start with this minimal approach:

### Quick Win Features:
1. **WhatsApp Share Button** on order page
2. **Pre-filled message** with order details
3. **QR Code** for easy mobile access
4. **Business WhatsApp number** in company settings
5. **"Order via WhatsApp" CTA** on product links

### Implementation (2-3 days):
```typescript
// Simple WhatsApp link generator
export function generateWhatsAppOrderLink(
  phoneNumber: string,
  orderDetails: OrderDetails
): string {
  const message = encodeURIComponent(`
Hi! I'd like to place an order:

Order ID: ${orderDetails.orderId}
${orderDetails.items.map(item =>
  `- ${item.name} x ${item.quantity} = ${formatCurrency(item.total)}`
).join('\n')}

Total: ${formatCurrency(orderDetails.total)}

Order Link: ${orderDetails.orderUrl}
  `.trim())

  return `https://wa.me/${phoneNumber}?text=${message}`
}
```

---

## 9. Recommended Implementation Strategy

### Start: Phase 1 (Link-Based)
**Why:**
- Zero cost
- Fast implementation
- Immediate value
- Test market demand
- Gather user feedback

### Evaluate: After 1 Month
**Metrics to track:**
- WhatsApp order adoption rate
- Customer satisfaction
- Manual workload on business owners
- Order volume via WhatsApp

### Upgrade: Phase 2 (API) When:
- 50+ WhatsApp orders/month
- Business wants automation
- Customer demand is high
- ROI justifies API costs

---

## 10. Success Metrics

### Phase 1 KPIs:
- WhatsApp orders per week
- Conversion rate (link click to order)
- Customer satisfaction score
- Time to order confirmation

### Phase 2 KPIs:
- Automated vs manual orders %
- Response time improvement
- Message delivery rate
- Customer retention via WhatsApp
- Revenue from WhatsApp channel

---

## 11. Next Steps

1. **Decision Point:** Choose Phase 1 or Phase 2
2. **Setup:** Configure WhatsApp Business number
3. **Development:** Follow implementation timeline
4. **Testing:** Test with real customers
5. **Launch:** Soft launch with subset of customers
6. **Monitor:** Track metrics and iterate
7. **Scale:** Expand based on success

---

## 12. Technical Requirements Summary

### For Phase 1:
- ✅ No additional services needed
- ✅ Works with current stack
- ✅ Just database + UI changes

### For Phase 2:
- Meta Business Account (verified)
- WhatsApp Business API access
- Webhook endpoint (HTTPS)
- Environment variables for API keys
- Message template approvals (5-7 days)

---

## Conclusion

**Recommendation:** Start with Phase 1 (Link-Based) to validate demand, then upgrade to Phase 2 (API Integration) when justified by order volume.

This phased approach minimizes risk, reduces costs, and allows for quick market validation while maintaining a clear path to full automation.
