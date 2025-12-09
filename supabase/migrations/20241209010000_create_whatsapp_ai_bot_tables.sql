-- =====================================================
-- WhatsApp AI Marketing Bot - Database Schema
-- =====================================================
-- This migration creates tables and functions for the WhatsApp AI Bot feature:
-- 1. Bot session management (QR registration, connection state)
-- 2. Customer conversations with AI (Q&A, appointments, payments)
-- 3. Knowledge base (products + FAQs for AI context)
-- 4. Appointment system (time slots and bookings)
-- 5. RPC functions for atomic operations
-- =====================================================

-- =====================================================
-- TABLE: whatsapp_bot_sessions
-- Purpose: Track WhatsApp bot connection state and session data
-- =====================================================
CREATE TABLE IF NOT EXISTS public.whatsapp_bot_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id VARCHAR(255) UNIQUE,
  phone_number VARCHAR(20),

  -- Bot connection status
  status VARCHAR(20) NOT NULL DEFAULT 'disconnected',
  -- Status values: 'disconnected', 'connecting', 'qr_ready', 'authenticated', 'ready', 'error'

  -- QR Code data (base64 encoded)
  qr_code TEXT,
  qr_expires_at TIMESTAMP WITH TIME ZONE,

  -- Session persistence (path to Supabase Storage)
  session_data_path TEXT,

  -- Bot settings
  settings JSONB DEFAULT jsonb_build_object(
    'business_hours', jsonb_build_object(
      'enabled', false,
      'timezone', 'Asia/Kuala_Lumpur',
      'schedule', jsonb_build_object(
        'monday', jsonb_build_object('open', '09:00', 'close', '17:00'),
        'tuesday', jsonb_build_object('open', '09:00', 'close', '17:00'),
        'wednesday', jsonb_build_object('open', '09:00', 'close', '17:00'),
        'thursday', jsonb_build_object('open', '09:00', 'close', '17:00'),
        'friday', jsonb_build_object('open', '09:00', 'close', '17:00'),
        'saturday', jsonb_build_object('open', '09:00', 'close', '17:00'),
        'sunday', jsonb_build_object('open', '09:00', 'close', '17:00')
      )
    ),
    'auto_reply', true,
    'welcome_message', 'Hi! Thanks for contacting us. How can I help you today?'
  ),

  -- Health monitoring
  last_heartbeat TIMESTAMP WITH TIME ZONE,
  connected_at TIMESTAMP WITH TIME ZONE,
  disconnected_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,

  -- One active session per user
  CONSTRAINT one_session_per_user UNIQUE(user_id)
);

-- Indexes for whatsapp_bot_sessions
CREATE INDEX IF NOT EXISTS idx_whatsapp_bot_sessions_user ON public.whatsapp_bot_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_bot_sessions_status ON public.whatsapp_bot_sessions(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_bot_sessions_phone ON public.whatsapp_bot_sessions(phone_number);

-- =====================================================
-- TABLE: whatsapp_conversations
-- Purpose: Track customer conversations and conversation state
-- =====================================================
CREATE TABLE IF NOT EXISTS public.whatsapp_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_phone VARCHAR(20) NOT NULL,
  customer_name VARCHAR(255),

  -- Conversation metrics
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()),
  message_count INTEGER DEFAULT 0,

  -- Conversation state machine
  conversation_state VARCHAR(50) NOT NULL DEFAULT 'active',
  -- States: 'active', 'waiting_for_appointment', 'waiting_for_appointment_confirmation',
  --         'waiting_for_payment', 'completed', 'archived'

  -- Context storage (JSONB for flexible data)
  context JSONB DEFAULT jsonb_build_object(
    'selected_product', null,
    'appointment_slot', null,
    'payment_link', null,
    'customer_email', null,
    'last_intent', null
  ),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,

  -- One conversation per customer per business
  CONSTRAINT unique_conversation_per_customer UNIQUE(user_id, customer_phone)
);

-- Indexes for whatsapp_conversations
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_user ON public.whatsapp_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_phone ON public.whatsapp_conversations(customer_phone);
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_state ON public.whatsapp_conversations(conversation_state);
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_last_message ON public.whatsapp_conversations(last_message_at DESC);

-- =====================================================
-- TABLE: whatsapp_knowledge_base
-- Purpose: Store product information and FAQs for AI context
-- =====================================================
CREATE TABLE IF NOT EXISTS public.whatsapp_knowledge_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Entry type
  entry_type VARCHAR(50) NOT NULL,
  -- Types: 'product', 'faq', 'company_info', 'policy'

  -- Content
  question TEXT,
  answer TEXT,
  content TEXT NOT NULL,

  -- Product link (nullable, only for product entries)
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,

  -- Search optimization
  keywords TEXT[] DEFAULT ARRAY[]::TEXT[],
  priority INTEGER DEFAULT 0, -- Higher priority = shown first to AI

  -- Auto-sync tracking
  is_auto_synced BOOLEAN DEFAULT false, -- True if synced from products table

  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

-- Indexes for whatsapp_knowledge_base
CREATE INDEX IF NOT EXISTS idx_whatsapp_knowledge_base_user ON public.whatsapp_knowledge_base(user_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_knowledge_base_type ON public.whatsapp_knowledge_base(entry_type);
CREATE INDEX IF NOT EXISTS idx_whatsapp_knowledge_base_product ON public.whatsapp_knowledge_base(product_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_knowledge_base_priority ON public.whatsapp_knowledge_base(priority DESC);
CREATE INDEX IF NOT EXISTS idx_whatsapp_knowledge_base_keywords ON public.whatsapp_knowledge_base USING GIN(keywords);

-- =====================================================
-- TABLE: appointment_slots
-- Purpose: Define available appointment time slots
-- =====================================================
CREATE TABLE IF NOT EXISTS public.appointment_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Time slot details
  slot_date DATE NOT NULL,
  slot_time TIME NOT NULL,
  duration_minutes INTEGER DEFAULT 60,

  -- Booking capacity
  max_bookings INTEGER DEFAULT 1,
  current_bookings INTEGER DEFAULT 0,
  is_available BOOLEAN GENERATED ALWAYS AS (current_bookings < max_bookings) STORED,

  -- Notes
  notes TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,

  -- Prevent duplicate slots
  CONSTRAINT unique_slot_per_user UNIQUE(user_id, slot_date, slot_time),

  -- Ensure bookings don't exceed capacity
  CONSTRAINT check_booking_capacity CHECK (current_bookings <= max_bookings)
);

-- Indexes for appointment_slots
CREATE INDEX IF NOT EXISTS idx_appointment_slots_user ON public.appointment_slots(user_id);
CREATE INDEX IF NOT EXISTS idx_appointment_slots_date ON public.appointment_slots(slot_date);
CREATE INDEX IF NOT EXISTS idx_appointment_slots_available ON public.appointment_slots(is_available) WHERE is_available = true;

-- =====================================================
-- TABLE: appointments
-- Purpose: Store customer appointment bookings
-- =====================================================
CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  slot_id UUID NOT NULL REFERENCES public.appointment_slots(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES public.whatsapp_conversations(id) ON DELETE SET NULL,

  -- Customer information
  customer_name VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(20) NOT NULL,
  customer_email VARCHAR(255),

  -- Appointment details
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,

  -- Status tracking
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  -- Status values: 'pending', 'confirmed', 'cancelled', 'completed', 'no_show'

  -- Reminder system
  reminder_sent BOOLEAN DEFAULT false,
  reminder_sent_at TIMESTAMP WITH TIME ZONE,

  -- Notes
  notes TEXT,
  cancellation_reason TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

-- Indexes for appointments
CREATE INDEX IF NOT EXISTS idx_appointments_user ON public.appointments(user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_slot ON public.appointments(slot_id);
CREATE INDEX IF NOT EXISTS idx_appointments_conversation ON public.appointments(conversation_id);
CREATE INDEX IF NOT EXISTS idx_appointments_phone ON public.appointments(customer_phone);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON public.appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON public.appointments(status);

-- =====================================================
-- ENHANCE: whatsapp_messages table
-- Purpose: Add AI bot fields to existing whatsapp_messages table
-- =====================================================
ALTER TABLE public.whatsapp_messages
ADD COLUMN IF NOT EXISTS conversation_id UUID REFERENCES public.whatsapp_conversations(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS intent VARCHAR(50), -- 'product_query', 'appointment', 'payment', 'general', 'unknown'
ADD COLUMN IF NOT EXISTS ai_processed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Add index for conversation lookup
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_conversation ON public.whatsapp_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_intent ON public.whatsapp_messages(intent);

-- =====================================================
-- RPC FUNCTION: check_appointment_availability
-- Purpose: Check if appointment slot has available space (with row lock)
-- =====================================================
CREATE OR REPLACE FUNCTION public.check_appointment_availability(p_slot_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_available BOOLEAN;
BEGIN
  -- Lock the row to prevent race conditions
  SELECT is_available INTO v_available
  FROM public.appointment_slots
  WHERE id = p_slot_id
  FOR UPDATE;

  RETURN COALESCE(v_available, false);
END;
$$;

-- =====================================================
-- RPC FUNCTION: book_appointment_atomic
-- Purpose: Atomically book appointment and increment slot count
-- =====================================================
CREATE OR REPLACE FUNCTION public.book_appointment_atomic(
  p_user_id UUID,
  p_slot_id UUID,
  p_conversation_id UUID,
  p_customer_name VARCHAR(255),
  p_customer_phone VARCHAR(20),
  p_customer_email VARCHAR(255),
  p_notes TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_appointment_id UUID;
  v_slot_date DATE;
  v_slot_time TIME;
  v_is_available BOOLEAN;
BEGIN
  -- Start transaction (implicit in function)

  -- Lock the slot row and check availability
  SELECT slot_date, slot_time, is_available
  INTO v_slot_date, v_slot_time, v_is_available
  FROM public.appointment_slots
  WHERE id = p_slot_id AND user_id = p_user_id
  FOR UPDATE;

  -- Check if slot exists and is available
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Slot not found or unauthorized';
  END IF;

  IF NOT v_is_available THEN
    RAISE EXCEPTION 'Slot is fully booked';
  END IF;

  -- Create appointment
  INSERT INTO public.appointments (
    user_id, slot_id, conversation_id,
    customer_name, customer_phone, customer_email,
    appointment_date, appointment_time, notes,
    status
  ) VALUES (
    p_user_id, p_slot_id, p_conversation_id,
    p_customer_name, p_customer_phone, p_customer_email,
    v_slot_date, v_slot_time, p_notes,
    'pending'
  )
  RETURNING id INTO v_appointment_id;

  -- Increment booking count
  UPDATE public.appointment_slots
  SET current_bookings = current_bookings + 1,
      updated_at = TIMEZONE('utc'::TEXT, NOW())
  WHERE id = p_slot_id;

  RETURN v_appointment_id;
END;
$$;

-- =====================================================
-- RPC FUNCTION: get_knowledge_base_context
-- Purpose: Fetch relevant KB entries for AI context (keyword matching)
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_knowledge_base_context(
  p_user_id UUID,
  p_keywords TEXT[],
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  entry_type VARCHAR(50),
  question TEXT,
  answer TEXT,
  content TEXT,
  priority INTEGER,
  relevance_score INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    kb.id,
    kb.entry_type,
    kb.question,
    kb.answer,
    kb.content,
    kb.priority,
    -- Calculate relevance score (number of matching keywords)
    (
      SELECT COUNT(*)::INTEGER
      FROM unnest(kb.keywords) AS kw
      WHERE kw = ANY(p_keywords)
    ) AS relevance_score
  FROM public.whatsapp_knowledge_base kb
  WHERE kb.user_id = p_user_id
    AND (
      -- Match keywords
      kb.keywords && p_keywords
      OR
      -- Match in content (case-insensitive)
      EXISTS (
        SELECT 1 FROM unnest(p_keywords) AS keyword
        WHERE kb.content ILIKE '%' || keyword || '%'
      )
    )
  ORDER BY
    kb.priority DESC,
    relevance_score DESC,
    kb.created_at DESC
  LIMIT p_limit;
END;
$$;

-- =====================================================
-- TRIGGER FUNCTION: sync_product_to_knowledge_base
-- Purpose: Auto-create/update KB entry when product is created/updated
-- =====================================================
CREATE OR REPLACE FUNCTION public.sync_product_to_knowledge_base()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_content TEXT;
  v_keywords TEXT[];
BEGIN
  -- Build content from product data
  v_content := format(
    'Product: %s
Description: %s
Price: RM %.2f
SKU: %s
Stock: %s',
    NEW.name,
    COALESCE(NEW.description, 'No description'),
    NEW.price,
    COALESCE(NEW.sku, 'N/A'),
    CASE
      WHEN NEW.track_stock THEN COALESCE(NEW.stock::TEXT, '0') || ' units'
      ELSE 'Stock not tracked'
    END
  );

  -- Extract keywords from product name
  v_keywords := string_to_array(lower(NEW.name), ' ');

  -- Upsert into knowledge base
  INSERT INTO public.whatsapp_knowledge_base (
    user_id, entry_type, question, answer, content,
    product_id, keywords, priority, is_auto_synced
  ) VALUES (
    NEW.user_id,
    'product',
    'What is ' || NEW.name || '?',
    NEW.description,
    v_content,
    NEW.id,
    v_keywords,
    10, -- Medium priority for products
    true
  )
  ON CONFLICT (user_id, product_id)
  WHERE product_id IS NOT NULL
  DO UPDATE SET
    question = EXCLUDED.question,
    answer = EXCLUDED.answer,
    content = EXCLUDED.content,
    keywords = EXCLUDED.keywords,
    updated_at = TIMEZONE('utc'::TEXT, NOW());

  RETURN NEW;
END;
$$;

-- Create trigger for product sync
DROP TRIGGER IF EXISTS trigger_sync_product_to_kb ON public.products;
CREATE TRIGGER trigger_sync_product_to_kb
  AFTER INSERT OR UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_product_to_knowledge_base();

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Enable RLS on all new tables
ALTER TABLE public.whatsapp_bot_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointment_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- whatsapp_bot_sessions policies
CREATE POLICY "Users can view own bot session"
  ON public.whatsapp_bot_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bot session"
  ON public.whatsapp_bot_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bot session"
  ON public.whatsapp_bot_sessions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own bot session"
  ON public.whatsapp_bot_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- whatsapp_conversations policies
CREATE POLICY "Users can view own conversations"
  ON public.whatsapp_conversations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own conversations"
  ON public.whatsapp_conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversations"
  ON public.whatsapp_conversations FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own conversations"
  ON public.whatsapp_conversations FOR DELETE
  USING (auth.uid() = user_id);

-- whatsapp_knowledge_base policies
CREATE POLICY "Users can view own knowledge base"
  ON public.whatsapp_knowledge_base FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own knowledge base entries"
  ON public.whatsapp_knowledge_base FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own knowledge base entries"
  ON public.whatsapp_knowledge_base FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own knowledge base entries"
  ON public.whatsapp_knowledge_base FOR DELETE
  USING (auth.uid() = user_id);

-- appointment_slots policies
CREATE POLICY "Users can view own appointment slots"
  ON public.appointment_slots FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own appointment slots"
  ON public.appointment_slots FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own appointment slots"
  ON public.appointment_slots FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own appointment slots"
  ON public.appointment_slots FOR DELETE
  USING (auth.uid() = user_id);

-- appointments policies
CREATE POLICY "Users can view own appointments"
  ON public.appointments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own appointments"
  ON public.appointments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own appointments"
  ON public.appointments FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own appointments"
  ON public.appointments FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- UPDATED_AT TRIGGERS
-- =====================================================

-- Trigger for whatsapp_bot_sessions
CREATE TRIGGER set_whatsapp_bot_sessions_updated_at
  BEFORE UPDATE ON public.whatsapp_bot_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for whatsapp_conversations
CREATE TRIGGER set_whatsapp_conversations_updated_at
  BEFORE UPDATE ON public.whatsapp_conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for whatsapp_knowledge_base
CREATE TRIGGER set_whatsapp_knowledge_base_updated_at
  BEFORE UPDATE ON public.whatsapp_knowledge_base
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for appointment_slots
CREATE TRIGGER set_appointment_slots_updated_at
  BEFORE UPDATE ON public.appointment_slots
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for appointments
CREATE TRIGGER set_appointments_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE public.whatsapp_bot_sessions IS 'Manages WhatsApp bot connection state, QR codes, and session persistence';
COMMENT ON TABLE public.whatsapp_conversations IS 'Tracks customer conversations with state machine for multi-step flows';
COMMENT ON TABLE public.whatsapp_knowledge_base IS 'Stores product information and FAQs for AI context generation';
COMMENT ON TABLE public.appointment_slots IS 'Defines available appointment time slots with capacity management';
COMMENT ON TABLE public.appointments IS 'Customer appointment bookings linked to slots and conversations';

COMMENT ON FUNCTION public.check_appointment_availability IS 'Checks slot availability with row lock to prevent race conditions';
COMMENT ON FUNCTION public.book_appointment_atomic IS 'Atomically books appointment and increments slot count (prevents double booking)';
COMMENT ON FUNCTION public.get_knowledge_base_context IS 'Fetches relevant KB entries for AI context based on keyword matching';
COMMENT ON FUNCTION public.sync_product_to_knowledge_base IS 'Auto-syncs product data to knowledge base when product is created/updated';
