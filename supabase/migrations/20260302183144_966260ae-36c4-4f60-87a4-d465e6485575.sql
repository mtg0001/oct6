
-- Fix avatars bucket: restrict update/delete to file owner only
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;

CREATE POLICY "Users update own avatar"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'avatars' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users delete own avatar"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'avatars' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Make chat-attachments private (require auth to read)
UPDATE storage.buckets SET public = false WHERE id = 'chat-attachments';

-- Drop old public SELECT policy for chat-attachments
DROP POLICY IF EXISTS "Anyone can view chat files" ON storage.objects;

-- Create auth-required SELECT policy for chat-attachments
CREATE POLICY "Authenticated users can view chat files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'chat-attachments');
