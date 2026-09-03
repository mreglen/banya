-- Contact phone for public landing / admin settings
ALTER TABLE organization_details
ADD COLUMN IF NOT EXISTS phone VARCHAR(20) NOT NULL DEFAULT '';

UPDATE organization_details
SET phone = '+7 (343) 344-87-55'
WHERE id = 1 AND (phone IS NULL OR phone = '');
