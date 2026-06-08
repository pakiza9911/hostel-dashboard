# Hostel Admin Panel - Deployment Guide

## Backend Deployment (Railway)

### Prerequisites

- Railway account (free tier available)
- GitHub account

### Steps to Deploy Backend

1. **Push code to GitHub**

   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Deploy on Railway**
   - Go to [railway.app](https://railway.app)
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your repository
   - Railway will detect the backend folder automatically

3. **Configure Environment Variables**
   In Railway project settings, add these variables:

   ```
   PORT=5000
   NODE_ENV=production
   JWT_SECRET=your_secure_random_secret_key_here
   FRONTEND_URL=your_frontend_url
   ```

4. **Add MySQL Database**
   - In Railway project, click "New Service" → "Database" → "MySQL"
   - Railway will provide connection details
   - Add these to environment variables:

   ```
   DB_HOST=your_railway_mysql_host
   DB_USER=your_railway_mysql_user
   DB_PASSWORD=your_railway_mysql_password
   DB_NAME=railway
   ```

5. **Initialize Database**
   - Go to Railway MySQL service → "Console"
   - Run the database initialization script:

   ```bash
   # Copy the content from backend/scripts/initDatabase.js
   # Or use Railway's built-in MySQL editor to run the SQL commands
   ```

6. **Get Your Backend URL**
   - Railway will provide a URL like: `https://your-app-name.up.railway.app`
   - This is your backend API URL

## Frontend Deployment (Vercel/Netlify)

### Prerequisites

- Vercel or Netlify account
- GitHub account

### Steps to Deploy Frontend

1. **Update API URL**
   In `src/lib/api.ts`, update the base URL:

   ```typescript
   const API_BASE_URL =
     import.meta.env.VITE_API_URL ||
     "https://your-backend-url.up.railway.app/api";
   ```

2. **Deploy on Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project" → Import from GitHub
   - Select your repository
   - Add environment variable:
     ```
     VITE_API_URL=https://your-backend-url.up.railway.app/api
     ```
   - Click "Deploy"

3. **Deploy on Netlify (Alternative)**
   - Go to [netlify.com](https://netlify.com)
   - Click "Add new site" → "Import an existing project"
   - Connect to GitHub
   - Build settings:
     - Build command: `npm run build`
     - Publish directory: `dist`
   - Add environment variable:
     ```
     VITE_API_URL=https://your-backend-url.up.railway.app/api
     ```

## Access Your Deployed Application

After deployment:

- **Backend API**: `https://your-backend-name.up.railway.app/api`
- **Frontend**: `https://your-frontend-name.vercel.app` or `https://your-frontend-name.netlify.app`

## Default Credentials

**Super Admin:**

- Email: `admin@hostelhub.pk`
- Password: `admin123`

## Testing the Deployment

1. Test backend health:

   ```bash
   curl https://your-backend-url.up.railway.app/api/health
   ```

2. Test login:
   ```bash
   curl -X POST https://your-backend-url.up.railway.app/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@hostelhub.pk","password":"admin123"}'
   ```

## Free Tier Limits

**Railway (Backend):**

- $5 free credit/month
- 512MB RAM
- 0.5 vCPU
- 1GB storage

**Vercel (Frontend):**

- Unlimited projects
- 100GB bandwidth/month
- Free SSL certificates

**Netlify (Frontend):**

- Unlimited sites
- 100GB bandwidth/month
- Free SSL certificates

## Troubleshooting

**Backend not starting:**

- Check Railway logs for errors
- Verify all environment variables are set
- Ensure MySQL database is running

**Frontend can't connect to backend:**

- Verify CORS is configured correctly
- Check VITE_API_URL environment variable
- Ensure backend is running

**Database connection errors:**

- Verify DB_HOST, DB_USER, DB_PASSWORD are correct
- Check MySQL service is running on Railway
