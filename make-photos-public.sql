-- Make photos bucket public
UPDATE storage.buckets
SET public = true
WHERE name = 'photos';

-- Add policy to allow public read access to photos
CREATE POLICY "Public read access for photos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'photos');
