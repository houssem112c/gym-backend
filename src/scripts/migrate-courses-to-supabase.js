const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function uploadFileToSupabase(filePath, fileName, bucket, folder, supabaseService) {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`❌ File not found: ${filePath}`);
      return null;
    }

    const fileBuffer = fs.readFileSync(filePath);
    const publicUrl = await supabaseService.uploadFile(
      fileBuffer,
      fileName,
      bucket,
      folder
    );
    
    console.log(`✅ Uploaded ${fileName} to Supabase: ${publicUrl}`);
    return publicUrl;
  } catch (error) {
    console.error(`❌ Failed to upload ${fileName}:`, error.message);
    return null;
  }
}

async function migrateCourses() {
  console.log('🚀 Starting course migration to Supabase...');
  
  // Import SupabaseService (this requires the app to be running)
  const { SupabaseService } = require('../supabase/supabase.service');
  const { ConfigService } = require('@nestjs/config');
  
  // Create service instances
  const configService = new ConfigService();
  const supabaseService = new SupabaseService(configService);
  
  try {
    // Find all courses with local file paths
    const courses = await prisma.course.findMany({
      where: {
        OR: [
          { videoUrl: { startsWith: '/uploads/' } },
          { thumbnail: { startsWith: '/uploads/' } }
        ]
      }
    });

    console.log(`📋 Found ${courses.length} courses to migrate`);

    for (const course of courses) {
      console.log(`\n🔄 Migrating course: ${course.title} (${course.id})`);
      
      const updates = {};
      
      // Migrate video if it's a local path
      if (course.videoUrl && course.videoUrl.startsWith('/uploads/')) {
        const videoPath = path.join(__dirname, '../../', course.videoUrl);
        const videoFileName = path.basename(course.videoUrl);
        
        console.log(`📹 Migrating video: ${videoFileName}`);
        const videoUrl = await uploadFileToSupabase(
          videoPath, 
          videoFileName, 
          'gym-courses', 
          'videos',
          supabaseService
        );
        
        if (videoUrl) {
          updates.videoUrl = videoUrl;
        }
      }
      
      // Migrate thumbnail if it's a local path
      if (course.thumbnail && course.thumbnail.startsWith('/uploads/')) {
        const thumbnailPath = path.join(__dirname, '../../', course.thumbnail);
        const thumbnailFileName = path.basename(course.thumbnail);
        
        console.log(`📸 Migrating thumbnail: ${thumbnailFileName}`);
        const thumbnailUrl = await uploadFileToSupabase(
          thumbnailPath, 
          thumbnailFileName, 
          'gym-courses', 
          'thumbnails',
          supabaseService
        );
        
        if (thumbnailUrl) {
          updates.thumbnail = thumbnailUrl;
        }
      }
      
      // Update the course if we have changes
      if (Object.keys(updates).length > 0) {
        await prisma.course.update({
          where: { id: course.id },
          data: updates
        });
        console.log(`✅ Updated course ${course.title} in database`);
      } else {
        console.log(`⚠️  No files to migrate for course ${course.title}`);
      }
    }

    console.log('\n🎉 Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Self-executing function
if (require.main === module) {
  migrateCourses()
    .then(() => {
      console.log('✅ Migration script finished');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = { migrateCourses };