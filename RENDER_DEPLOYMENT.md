# Deploy Gym Backend to Render

This guide will help you deploy your NestJS backend to Render with PostgreSQL database.

## Prerequisites

1. Create a [Render account](https://render.com)
2. Push your code to a Git repository (GitHub, GitLab, or Bitbucket)

## Step 1: Prepare Your Repository

Make sure your backend code is pushed to a Git repository with the following files:
- `render.yaml` ✅ (Created)
- `Dockerfile` ✅ (Created) 
- Updated `package.json` with production scripts ✅
- `prisma/schema.prisma` ✅ (Updated)
- `prisma/seed.ts` ✅ (Ready)

## Step 2: Deploy to Render

### Option A: Using render.yaml (Blueprint - Recommended)

1. **Connect Repository**
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New" → "Blueprint"
   - Connect your Git repository
   - Select the repository containing your backend

2. **Configure Blueprint**
   - Render will detect the `render.yaml` file
   - Review the services configuration:
     - Web Service: `gym-backend`
     - Database: `gym-postgres`
   - Click "Apply" to create services

### Option B: Manual Setup

If you prefer manual setup or blueprint doesn't work:

1. **Create PostgreSQL Database**
   - Dashboard → "New" → "PostgreSQL"
   - Name: `gym-postgres`
   - Database Name: `gym_db` 
   - User: `gym_user`
   - Plan: Free
   - Click "Create Database"

2. **Create Web Service**
   - Dashboard → "New" → "Web Service"
   - Connect your Git repository
   - Configure:
     - Name: `gym-backend`
     - Environment: `Node`
     - Build Command: `npm ci && npm run build && npx prisma generate && npx prisma migrate deploy`
     - Start Command: `npm run start:prod`
     - Plan: Free

## Step 3: Configure Environment Variables

In your web service settings, add these environment variables:

### Required Variables
```
DATABASE_URL=<copy-from-postgres-service>
JWT_SECRET=<generate-secure-random-string>
JWT_EXPIRES_IN=7d
NODE_ENV=production
```

### Optional Variables (for CORS)
```
FRONTEND_URL=https://your-frontend-domain.com
ADMIN_URL=https://your-admin-domain.com
```

### How to get DATABASE_URL:
1. Go to your PostgreSQL service in Render
2. Copy the "Internal Database URL" or "External Database URL"
3. Use the Internal URL for better performance (format: `postgresql://user:password@host:port/database`)

### Generate JWT_SECRET:
You can use any secure random string generator, or run in terminal:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## Step 4: Database Setup

After the first deployment, you need to seed the database:

1. **Access your service shell**
   - Go to your web service in Render
   - Click "Shell" tab
   - Run: `npm run db:seed`

This will create:
- Admin user: `admin@gym.com` / `admin123`
- Test user: `user@gym.com` / `user123`

## Step 5: Update Your Frontend URLs

Update your frontend applications to use the new backend URL:

### Get your backend URL:
- Go to your web service in Render
- Copy the service URL (e.g., `https://gym-backend-xyz.onrender.com`)

### Update frontend API configuration:
Replace `http://localhost:3001/api` with `https://your-backend-url.onrender.com/api`

## Step 6: File Uploads Configuration

Your backend is configured with persistent disk storage for file uploads:
- Mount path: `/opt/render/project/src/uploads`
- Size: 1GB (Free tier)
- Files uploaded will persist across deployments

## Common Issues & Solutions

### 1. Build Failures
- Check build logs for specific errors
- Ensure all dependencies are in `package.json`
- Verify Node.js version compatibility

### 2. Database Connection Issues
- Verify DATABASE_URL is correct
- Check if database service is running
- Ensure migrations ran successfully

### 3. CORS Issues
- Add your frontend domains to CORS configuration
- Update environment variables: `FRONTEND_URL`, `ADMIN_URL`

### 4. File Upload Issues
- Ensure persistent disk is mounted correctly
- Check file permissions
- Verify upload directory exists

## Deployment Commands

For future deployments, Render will automatically:
1. Pull latest code changes
2. Run build command
3. Deploy migrations
4. Restart service

## Monitoring

Monitor your deployment:
- **Logs**: Check service logs for errors
- **Metrics**: Monitor CPU, memory, and response times
- **Events**: Track deployment history

## Database Management

### Run Migrations
```bash
# In Render shell
npm run migrate:deploy
```

### Seed Database
```bash
# In Render shell  
npm run db:seed
```

### Reset Database (Development only)
```bash
# In Render shell - BE CAREFUL!
npm run db:reset
```

## Production Checklist

- [ ] Environment variables configured
- [ ] Database connected and migrations applied
- [ ] Admin user created via seeding
- [ ] CORS configured for production domains
- [ ] File uploads working
- [ ] Frontend applications updated with new API URL
- [ ] SSL certificate working (automatic with Render)

## Cost Information

**Free Tier Limits:**
- Web Service: 750 hours/month
- PostgreSQL: 1GB storage, 1 month data retention
- Disk Storage: 1GB for file uploads
- Bandwidth: 100GB/month

**Upgrade Options:**
- Paid plans available for higher limits
- Custom domains supported
- Enhanced performance and reliability

---

Your gym backend should now be successfully deployed to Render! 🎉

**Important URLs:**
- Backend API: `https://your-service-name.onrender.com/api`
- Admin Login: Use `admin@gym.com` / `admin123`
- Database: Managed by Render PostgreSQL service