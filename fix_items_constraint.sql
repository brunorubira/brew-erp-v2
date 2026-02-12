-- Fix: Release 473ml restriction on products to allow Kegs and other formats
-- The check constraint 'items_check' (or similar) restricts volume_ml to 473 if type is 'product'.

-- 1. Identify and Drop the restrictive constraint
-- Note: In Postgres, if not named explicitly, it might be named 'items_check' or 'items_volume_ml_check'
-- We attempt to drop the one mentioned by the user first.

DO $$ 
BEGIN 
    -- Try to drop 'items_check' if it exists
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'items_check') THEN
        ALTER TABLE items DROP CONSTRAINT items_check;
    END IF;

    -- Also check for the most common auto-generated name if the above wasn't it
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'items_volume_ml_check') THEN
        ALTER TABLE items DROP CONSTRAINT items_volume_ml_check;
    END IF;
END $$;

-- 2. Add a new, flexible constraint
-- Products must have a positive volume, but we don't restrict it to 473ml anymore.
ALTER TABLE items ADD CONSTRAINT items_volume_check 
CHECK (type != 'product' OR (volume_ml IS NOT NULL AND volume_ml > 0));

-- 3. Update schema.sql for future deployments
-- (I will do this in the next step via replace_file_content)
