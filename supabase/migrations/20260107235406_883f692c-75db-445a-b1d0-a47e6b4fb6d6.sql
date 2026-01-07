-- Add columns to notes table to support Google Drive file metadata and folder structure
ALTER TABLE notes
ADD COLUMN IF NOT EXISTS drive_file_id TEXT,
ADD COLUMN IF NOT EXISTS mime_type TEXT,
ADD COLUMN IF NOT EXISTS is_folder BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS folder_path TEXT[];

-- Create index for faster folder lookups
CREATE INDEX IF NOT EXISTS idx_notes_drive_file_id ON notes(drive_file_id);
CREATE INDEX IF NOT EXISTS idx_notes_is_folder ON notes(is_folder);
CREATE INDEX IF NOT EXISTS idx_notes_folder_path ON notes USING GIN(folder_path);