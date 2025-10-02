-- Clean up the specific duplicate connection request
-- Keep only the most recent request between these users
DELETE FROM connection_requests
WHERE id = 'ecf6bd88-e893-48ff-b0d7-3fa1e5c6f56a'
  AND created_at < '2025-10-02 19:11:57.631+00';