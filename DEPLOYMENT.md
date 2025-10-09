# Safeguard App - Render Deployment Guide

This guide will walk you through deploying your Safeguard women safety app to Render.

## Prerequisites

1. **GitHub Account**: Your code should be pushed to a GitHub repository
2. **Render Account**: Sign up at [render.com](https://render.com)
3. **Firebase Project**: Set up your Firebase project and get the configuration values

## Pre-Deployment Setup

### 1. Firebase Configuration

1. Go to your Firebase Console
2. Select your project
3. Go to Project Settings > General
4. Scroll down to "Your apps" section
5. Copy the Firebase configuration values

### 2. Environment Variables

Create a `.env` file in your project root with your Firebase configuration:

```env
VITE_FIREBASE_API_KEY=your_actual_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

## Deployment Methods

### Method 1: Using render.yaml (Recommended)

1. **Push your code to GitHub** with the `render.yaml` file included
2. **Go to Render Dashboard**
3. **Click "New +"** and select **"Blueprint"**
4. **Connect your GitHub repository**
5. **Render will automatically detect the `render.yaml` file**
6. **Configure environment variables** (see Environment Variables section below)
7. **Click "Apply"** to deploy

### Method 2: Manual Configuration

1. **Go to Render Dashboard**
2. **Click "New +"** and select **"Web Service"**
3. **Connect your GitHub repository**
4. **Configure the following settings:**
   - **Name**: `safeguard-app` (or your preferred name)
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run preview`
   - **Root Directory**: Leave empty (or specify if your app is in a subdirectory)

## Environment Variables Configuration

In your Render service settings, add these environment variables:

| Variable | Value | Description |
|----------|-------|-------------|
| `NODE_ENV` | `production` | Environment setting |
| `VITE_FIREBASE_API_KEY` | Your Firebase API key | Firebase configuration |
| `VITE_FIREBASE_AUTH_DOMAIN` | `your_project_id.firebaseapp.com` | Firebase auth domain |
| `VITE_FIREBASE_PROJECT_ID` | Your project ID | Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | `your_project_id.appspot.com` | Firebase storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Your sender ID | Firebase messaging |
| `VITE_FIREBASE_APP_ID` | Your app ID | Firebase app ID |
| `VITE_FIREBASE_MEASUREMENT_ID` | Your measurement ID | Firebase analytics |

## Firebase Security Rules

Make sure your Firebase security rules are properly configured for production:

### Firestore Rules (`firestore.rules`)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Incidents are readable by authenticated users, writable by the creator
    match /incidents/{incidentId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == resource.data.userId;
    }
    
    // Add more rules as needed for your app
  }
}
```

### Storage Rules (`storage.rules`)
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Post-Deployment Steps

1. **Test your deployed app** by visiting the provided URL
2. **Verify Firebase connection** by testing authentication
3. **Check all features** work as expected
4. **Set up custom domain** (optional) in Render settings
5. **Configure SSL** (automatically handled by Render)

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check that all dependencies are in `package.json`
   - Ensure TypeScript compilation passes locally
   - Check build logs in Render dashboard

2. **Environment Variables Not Working**
   - Ensure all `VITE_` prefixed variables are set
   - Check variable names match exactly
   - Redeploy after adding new variables

3. **Firebase Connection Issues**
   - Verify Firebase configuration values
   - Check Firebase project is active
   - Ensure security rules allow your operations

4. **App Not Loading**
   - Check if build completed successfully
   - Verify start command is correct
   - Check application logs in Render dashboard

### Debug Commands

Test your build locally:
```bash
npm run build
npm run preview
```

## Monitoring and Maintenance

1. **Check Render logs** regularly for any errors
2. **Monitor Firebase usage** in Firebase Console
3. **Update dependencies** regularly for security
4. **Backup your data** regularly

## Scaling

- **Free tier**: Limited to 750 hours/month
- **Paid plans**: Start at $7/month for unlimited usage
- **Auto-scaling**: Available on paid plans

## Support

- **Render Documentation**: [render.com/docs](https://render.com/docs)
- **Firebase Documentation**: [firebase.google.com/docs](https://firebase.google.com/docs)
- **Project Issues**: Check your GitHub repository issues

---

**Note**: This deployment guide assumes you have a working React + Vite + Firebase application. Make sure to test your application thoroughly before deploying to production.
