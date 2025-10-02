-- Backfill conversation_participants from conversations table
-- This ensures all existing conversations have their participants properly recorded

INSERT INTO conversation_participants (conversation_id, user_id)
SELECT DISTINCT c.id, c.participant_1_id
FROM conversations c
WHERE c.participant_1_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM conversation_participants cp
    WHERE cp.conversation_id = c.id AND cp.user_id = c.participant_1_id
  );

INSERT INTO conversation_participants (conversation_id, user_id)
SELECT DISTINCT c.id, c.participant_2_id
FROM conversations c
WHERE c.participant_2_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM conversation_participants cp
    WHERE cp.conversation_id = c.id AND cp.user_id = c.participant_2_id
  );