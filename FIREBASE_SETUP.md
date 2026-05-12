# Firebase Setup Guide for SCHOOLFEES

This guide explains how to properly set up Firebase for the School Fee Management System.

## Prerequisites

- A Google account
- Access to the [Firebase Console](https://console.firebase.google.com/)

## Steps to Configure Firebase

### Step 1: Create a Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or select "Create a project"
3. Enter a project name (e.g., "schoolfees-system")
4. Follow the setup steps and click "Create Project"

### Step 2: Enable Firestore Database

1. In the Firebase Console, go to your project
2. Click "Firestore Database" in the left navigation panel
3. Click "Create database"
4. Choose "Start in production mode" (or "Test mode" for development)
5. Select a location for your database
6. Click "Enable"

### Step 3: Create a Service Account for Admin Access

1. In the Firebase Console, go to your project
2. Go to Project Settings (gear icon) → Service Accounts
3. Select "Firebase Admin SDK" option
4. Choose "Node.js" as the target platform
5. Click "Generate new private key"
6. Save the downloaded JSON file in a secure location

### Step 4: Extract Credentials and Update .env File

The downloaded JSON file contains your credentials. Extract the values and update your [.env](file:///c%3A/Users/chris\OneDrive\Desktop\SYSTEM\.env) file:

```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "key-id-value",
  "private_key": "-----BEGIN PRIVATE KEY-----\nLONG-KEY-VALUE-WITH-NEWLINES\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com",
  "client_id": "long-number",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxxxx%40your-project-id.iam.gserviceaccount.com"
}
```

Update your [.env](file:///c%3A/Users/chris\OneDrive\Desktop\SYSTEM\.env) file with these values:

```env
FIREBASE_TYPE=service_account
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY_ID=key-id-value
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nLONG-KEY-VALUE-WITH-NEWLINES\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=long-number
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
FIREBASE_AUTH_PROVIDER_X509_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
FIREBASE_CLIENT_X509_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxxxx%40your-project-id.iam.gserviceaccount.com
```

### Step 5: Restart Your Application

After updating the [.env](file:///c%3A/Users/chris\OneDrive\Desktop\SYSTEM\.env) file, restart your application for the changes to take effect:

```bash
npm run dev
```

## Collections Used in This Application

The application expects the following Firestore collections:

1. **users** - Stores user accounts (admins and treasurers)
2. **students** - Stores student records
3. **transactions** - Stores payment transactions
4. **approval_requests** - Stores approval requests
5. **notifications** - Stores system notifications

These collections will be created automatically when data is first added to them.

## Troubleshooting

### Error: Service account object must contain a string "project_id" property

- Make sure all the required environment variables are present in your [.env](file:///c%3A/Users/chris\OneDrive\Desktop\SYSTEM\.env) file
- Verify that the values are correctly copied from the service account JSON file
- Check that there are no extra quotes or escape characters in the values

### Error: Could not load the default credentials

- Ensure the service account has the correct permissions (usually Firebase Admin)
- Check that your Firebase project is properly configured