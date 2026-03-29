-- Change default currency from USD to INR
ALTER TABLE events ALTER COLUMN currency SET DEFAULT 'INR';
UPDATE events SET currency = 'INR' WHERE currency = 'USD';
