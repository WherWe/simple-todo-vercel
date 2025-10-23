-- Clean up todos without userId (orphaned from before authentication)
-- Run this in your database console or via a SQL client

DELETE FROM todos 
WHERE user_id IS NULL OR user_id = '';

-- Verify cleanup
SELECT COUNT(*) as remaining_todos FROM todos;
