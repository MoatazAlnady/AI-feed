-- Step 1: Clean up duplicate pending connection requests, keeping only the most recent one
WITH duplicates AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (
      PARTITION BY requester_id, recipient_id, status 
      ORDER BY created_at DESC
    ) as rn
  FROM connection_requests
  WHERE status = 'pending'
)
DELETE FROM connection_requests
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- Step 2: Add a unique partial index to prevent duplicate pending requests
-- This ensures only one pending request can exist between any two users
CREATE UNIQUE INDEX IF NOT EXISTS idx_connection_requests_unique_pending
ON connection_requests (requester_id, recipient_id, status)
WHERE status = 'pending';