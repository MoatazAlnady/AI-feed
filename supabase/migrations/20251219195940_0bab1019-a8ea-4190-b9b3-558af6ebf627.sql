UPDATE user_profiles 
SET is_premium = true, 
    premium_until = NOW() + INTERVAL '1 year'
WHERE id = 'f603cf89-6e48-4fd4-b3f8-dadeed2f949c';