# AMNESIA Staff Commission 2025 - Apps Script Deployment Guide

## Step 1: Open the Script Editor

1. In your Google Sheet, click on **Extensions** > **Apps Script**
2. This will open the Apps Script editor in a new tab

## Step 2: Copy the Code

1. Delete any existing code in the editor
2. Copy and paste the entire `Code.gs` script into the editor
3. Click **Save** (or press Ctrl+S / Cmd+S)
4. Name your project "AMNESIA Staff Commission API"

## Step 3: Run the Setup Function

1. In the Apps Script editor, select the `setupSpreadsheet` function from the dropdown menu next to the "Debug" button
2. Click the "Run" button (play icon)
3. You'll be asked to authorize the script - follow the prompts to allow access
4. This will create the "Commission_Data" sheet with proper formatting and a "Dashboard" sheet

## Step 4: Deploy as Web App

1. Click on **Deploy** > **New deployment**
2. For "Select type", choose **Web app**
3. Fill in the following details:
   - Description: "AMNESIA Staff Commission API v1"
   - Execute as: "Me" (your Google account)
   - Who has access: "Anyone" (or "Anyone with Google account" for more security)
4. Click **Deploy**
5. **IMPORTANT**: Copy the Web App URL shown after deployment - you'll need this for your React app

## Step 5: Test the API

1. Go back to your spreadsheet
2. You should now see a new menu item called "Commission Tools"
3. Click on **Commission Tools** > **Test Save Data**
4. Check that a test entry appears in the Commission_Data sheet
5. Click on **Commission Tools** > **Test Load Data**
6. You should see a success message with the loaded data

## Step 6: Update Your React App

1. Open your React commission calculator app
2. Paste the Web App URL into the "Google Sheets Web App URL" field
3. Test saving and loading data

## Troubleshooting

If you encounter any issues:

1. **Authorization errors**: Make sure you've granted all necessary permissions
2. **Script errors**: Check the Apps Script editor's "Execution log" for details
3. **CORS errors**: Make sure your deployment settings allow access from your app
4. **Data not saving**: Verify the spreadsheet permissions allow editing

## Additional Features

The script includes:

- Automatic sheet creation and formatting
- Data validation and error handling
- A dashboard with summary charts
- Custom menu items for easy management
- Support for loading all months or filtering by specific month

## Security Notes

- The Web App URL acts as an API key - keep it secure
- Consider setting access to "Anyone with Google account" for added security
- The script validates all input data before saving
