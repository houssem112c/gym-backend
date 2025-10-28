import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { CategoriesModule } from './categories/categories.module';
import { CoursesModule } from './courses/courses.module';
import { VideosModule } from './videos/videos.module';
import { ContactsModule } from './contacts/contacts.module';
import { LocationsModule } from './locations/locations.module';
import { BmiModule } from './bmi/bmi.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    HealthModule,
    AuthModule,
    CategoriesModule,
    CoursesModule,
    VideosModule,
    ContactsModule,
    LocationsModule,
    BmiModule,
  ],
})
export class AppModule {}
