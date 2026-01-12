# Story Feature - File Upload Setup

## Overview
The story feature now supports direct file uploads instead of URLs. Images and videos are uploaded to Supabase Storage.

## Setup Instructions

### 1. Create Supabase Storage Bucket

1. Go to your Supabase project dashboard
2. Navigate to **Storage** in the sidebar
3. Click **New Bucket**
4. Create a bucket named: `gym-stories`
5. Set it as **Public** (so URLs are accessible)
6. Click **Create bucket**

### 2. Configure Environment Variables

Add these to your `gym-backend/.env` file:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-supabase-anon-key
```

**Where to find these:**
- Go to Supabase Dashboard → Project Settings → API
- **SUPABASE_URL**: Your Project URL
- **SUPABASE_KEY**: Use the `anon` `public` key

### 3. Restart Backend

```bash
cd gym-backend
npm run start:dev
```

## How to Use

### Admin Panel

1. Go to **Stories** page
2. Click **Add Story**
3. Select a category
4. Click **Upload Media** and choose an image or video file
   - Supported: JPEG, PNG, GIF (images)
   - Supported: MP4, MOV (videos)
   - Max size: 10MB
5. Add optional caption, duration, expiry
6. Click **Create**

### File Types Supported

- **Images**: `.jpg`, `.jpeg`, `.png`, `.gif`
- **Videos**: `.mp4`, `.mov`
- **Max Size**: 10MB per file

### API Endpoint

**Upload Story:**
```
POST /stories/upload
Content-Type: multipart/form-data
Authorization: Bearer <token>

Body:
- file: File (required)
- categoryId: string (required)
- caption: string (optional)
- duration: number (optional, default: 5)
- expiresAt: date (optional)
- order: number (optional, default: 0)
```

## Storage Structure

Files are stored in Supabase with this structure:
```
gym-stories/
  stories/
    1704840000000-image.jpg
    1704840001000-video.mp4
```

Filename format: `{timestamp}-{original-filename}`

## Troubleshooting

### "Supabase is not configured" error
- Check that `SUPABASE_URL` and `SUPABASE_KEY` are set in `.env`
- Restart the backend server

### "Failed to upload file" error
- Verify the bucket name is `gym-stories`
- Ensure the bucket is set to **Public**
- Check file size is under 10MB
- Verify file type is supported

### Files not accessible/404
- Make sure the bucket is **Public** not Private
- Check bucket policies allow public read access

## Migration Notes

If you have existing stories with URLs, they will continue to work. The system supports both:
- Old stories: URL-based (mediaUrl field)
- New stories: Uploaded files (stored in Supabase, then mediaUrl is set)
