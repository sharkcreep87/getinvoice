-- Add WhatsApp support to company_settings
ALTER TABLE company_settings
ADD COLUMN IF NOT EXISTS whatsapp_number VARCHAR(20),
ADD COLUMN IF NOT EXISTS whatsapp_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS whatsapp_order_template TEXT DEFAULT 'Hi! I would like to place an order:

Order ID: {{order_id}}
{{items}}

Subtotal: {{subtotal}}
Tax: {{tax}}
Total: {{total}}

Order Link: {{order_link}}';

-- Add WhatsApp tracking to product_orders table
ALTER TABLE product_orders
ADD COLUMN IF NOT EXISTS whatsapp_order_id VARCHAR(100),
ADD COLUMN IF NOT EXISTS whatsapp_customer_phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS whatsapp_message_sent BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS whatsapp_message_sent_at TIMESTAMP WITH TIME ZONE;

-- Create WhatsApp messages log table
CREATE TABLE IF NOT EXISTS public.whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.product_orders(id) ON DELETE CASCADE,
  customer_phone VARCHAR(20) NOT NULL,
  message_type VARCHAR(50) NOT NULL, -- 'order_request', 'payment_link', 'status_update', 'confirmation'
  message_content TEXT NOT NULL,
  direction VARCHAR(10) NOT NULL DEFAULT 'outbound', -- 'outbound' (business to customer), 'inbound' (customer to business)
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'sent', 'delivered', 'read', 'failed'
  whatsapp_link TEXT, -- The generated WhatsApp link
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

-- Create indexes for whatsapp_messages
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_order ON public.whatsapp_messages(order_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_user ON public.whatsapp_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_phone ON public.whatsapp_messages(customer_phone);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_created ON public.whatsapp_messages(created_at DESC);

-- Enable RLS on whatsapp_messages
ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for whatsapp_messages
CREATE POLICY "Users can view own WhatsApp messages"
  ON public.whatsapp_messages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own WhatsApp messages"
  ON public.whatsapp_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own WhatsApp messages"
  ON public.whatsapp_messages FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own WhatsApp messages"
  ON public.whatsapp_messages FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER set_whatsapp_messages_updated_at
  BEFORE UPDATE ON public.whatsapp_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE public.whatsapp_messages IS 'Logs all WhatsApp messages sent and received for orders';
COMMENT ON COLUMN public.company_settings.whatsapp_number IS 'Business WhatsApp number in international format (e.g., 60123456789)';
COMMENT ON COLUMN public.company_settings.whatsapp_enabled IS 'Enable/disable WhatsApp ordering feature';
COMMENT ON COLUMN public.company_settings.whatsapp_order_template IS 'Template for WhatsApp order messages with placeholders';
