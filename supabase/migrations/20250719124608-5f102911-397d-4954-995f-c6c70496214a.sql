-- First, let's check if there are any users at all
-- If there are users, make the first one an admin
-- This will allow category management to work

DO $$
DECLARE
    first_user_id UUID;
BEGIN
    -- Get the first user ID
    SELECT id INTO first_user_id 
    FROM user_profiles 
    LIMIT 1;
    
    -- If we found a user, make them admin
    IF first_user_id IS NOT NULL THEN
        UPDATE user_profiles 
        SET account_type = 'admin'
        WHERE id = first_user_id;
        
        RAISE NOTICE 'Made user % an admin', first_user_id;
    ELSE
        RAISE NOTICE 'No users found to make admin';
    END IF;
END $$;