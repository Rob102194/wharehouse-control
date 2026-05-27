-- Add is_compensation column to public.movements table
ALTER TABLE public.movements ADD COLUMN IF NOT EXISTS is_compensation BOOLEAN NOT NULL DEFAULT false;
