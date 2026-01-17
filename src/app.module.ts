import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { CategoriesModule } from './categories/categories.module';
import { CoursesModule } from './courses/courses.module';
import { ContactsModule } from './contacts/contacts.module';
import { LocationsModule } from './locations/locations.module';
import { BmiModule } from './bmi/bmi.module';
import { HealthModule } from './health/health.module';
import { StoriesModule } from './stories/stories.module';
import { SupabaseModule } from './supabase/supabase.module';
import { ExercisesModule } from './exercises/exercises.module';
import { WorkoutPlansModule } from './workout-plans/workout-plans.module';
import { UserProgressModule } from './user-progress/user-progress.module';
import { WorkoutSessionsModule } from './workout-sessions/workout-sessions.module';
import { UsersModule } from './users/users.module';
import { FeedModule } from './feed/feed.module';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
    }]),
    PrismaModule,
    SupabaseModule,
    HealthModule,
    AuthModule,
    CategoriesModule,
    CoursesModule,
    ContactsModule,
    LocationsModule,
    BmiModule,
    StoriesModule,
    ExercisesModule,
    WorkoutPlansModule,
    UserProgressModule,
    WorkoutSessionsModule,
    UsersModule,
    FeedModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule { }
