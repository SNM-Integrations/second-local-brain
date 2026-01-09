-- Add call tracking columns to contacts table
ALTER TABLE public.contacts
ADD COLUMN IF NOT EXISTS call_status TEXT,
ADD COLUMN IF NOT EXISTS call_started_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_call_duration INTEGER,
ADD COLUMN IF NOT EXISTS last_call_at TIMESTAMPTZ;

-- Add index for phone lookups (used by webhook)
CREATE INDEX IF NOT EXISTS idx_contacts_phone ON public.contacts(phone);

-- Add comment for clarity
COMMENT ON COLUMN public.contacts.call_status IS 'Current call status: ringing, in_call, call_done, or null';
COMMENT ON COLUMN public.contacts.call_started_at IS 'Timestamp when call was answered';
COMMENT ON COLUMN public.contacts.last_call_duration IS 'Duration of last call in seconds';
COMMENT ON COLUMN public.contacts.last_call_at IS 'Timestamp of last completed call';