-- Migrate group_events data into events table
INSERT INTO events (
  id, title, description, event_date, event_end_date, 
  location, is_online, online_link, max_attendees, is_public, 
  cover_image_url, group_id, creator_id, interests, tags, 
  start_time, end_time, created_at, timezone
)
SELECT 
  id, title, description,
  start_date::date,
  end_date::date,
  location, is_online, online_link, max_attendees, is_public, 
  cover_image, group_id, created_by, interests, tags,
  start_time, end_time, created_at, 'UTC'
FROM group_events
ON CONFLICT (id) DO NOTHING;

-- Migrate standalone_events data into events table
INSERT INTO events (
  id, title, description, event_date, event_end_date,
  location, is_online, online_link, max_attendees, is_public,
  cover_image_url, creator_id, category, interests, tags,
  created_at, timezone
)
SELECT 
  id, title, description, event_date::date, event_end_date::date,
  location, is_online, online_link, max_attendees, is_public,
  cover_image, creator_id, category, interests, tags,
  created_at, 'UTC'
FROM standalone_events
ON CONFLICT (id) DO NOTHING;

-- Migrate group_event_attendees to event_attendees
INSERT INTO event_attendees (event_id, user_id, status, created_at)
SELECT event_id, user_id, status, created_at
FROM group_event_attendees
ON CONFLICT (event_id, user_id) DO NOTHING;

-- Migrate standalone_event_attendees to event_attendees  
INSERT INTO event_attendees (event_id, user_id, status, created_at)
SELECT event_id, user_id, status, created_at
FROM standalone_event_attendees
ON CONFLICT (event_id, user_id) DO NOTHING;

-- Update shared_posts to use original_event_id for group events
UPDATE shared_posts 
SET original_event_id = original_group_event_id 
WHERE original_group_event_id IS NOT NULL AND original_event_id IS NULL;

-- Update shared_posts to use original_event_id for standalone events
UPDATE shared_posts 
SET original_event_id = original_standalone_event_id 
WHERE original_standalone_event_id IS NOT NULL AND original_event_id IS NULL;