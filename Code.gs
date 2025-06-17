/**
 * Google Apps Script for AMNESIA Staff Commission 2025 (Fixed Save Issue)
 * Handles saving and loading commission data with better error handling
 */

// Configuration
const SHEET_NAME = 'Commission_Data';
const SPREADSHEET_NAME = 'AMNESIA Staff Commission 2025';
const HEADERS = [
  'Timestamp',
  'Month',
  'Total Sales (incl VAT) ฿',
  'VAT %',
  'Sales Ex-VAT ฿',
  'Total Commission ฿',
  'Employee Name',
  'Shared Commission ฿',
  'Net Shared Commission ฿',
  'Overtime ฿',
  'Net OT ฿',
  'Final Amount ฿'
];

// Global variable to store spreadsheet ID
let SPREADSHEET_ID = null;

/**
 * Handle POST requests (saving data) - FIXED VERSION WITH CORS
 */
function doPost(e) {
  try {
    console.log('📥 Received POST request');
    console.log('📋 Headers:', JSON.stringify(e));
    
    // Check if we have post data
    if (!e || !e.postData || !e.postData.contents) {
      console.error('❌ No post data received');
      return createCorsResponse(false, 'No data received in POST request');
    }
    
    console.log('📄 Raw POST data:', e.postData.contents);
    
    const data = JSON.parse(e.postData.contents);
    console.log('📊 Parsed data:', JSON.stringify(data, null, 2));
    
    if (data.action === 'save') {
      console.log('💾 Processing save action...');
      return saveCommissionData(data.data);
    }
    
    console.error('❌ Invalid action:', data.action);
    return createCorsResponse(false, 'Invalid action specified: ' + (data.action || 'none'));
    
  } catch (error) {
    console.error('❌ Error in doPost:', error);
    console.error('❌ Error stack:', error.stack);
    return createCorsResponse(false, 'Server error in doPost: ' + error.message);
  }
}

/**
 * Handle GET requests (loading data) - ENHANCED VERSION WITH CORS
 */
function doGet(e) {
  try {
    console.log('📥 Received GET request');
    console.log('📋 Parameters:', JSON.stringify(e.parameter));
    
    const action = e.parameter.action;
    
    if (action === 'load') {
      const month = e.parameter.month;
      if (month) {
        console.log('📊 Loading data for month:', month);
        return loadCommissionData(month);
      } else {
        console.log('📊 Loading all months');
        return loadAllMonths();
      }
    }
    
    // Default response for basic connectivity test
    console.log('✅ Basic connectivity test');
    return createCorsResponse(true, 'AMNESIA Commission API is working! 🎉', {
      timestamp: new Date().toISOString(),
      version: '2.1',
      spreadsheetName: SPREADSHEET_NAME,
      deploymentUrl: ScriptApp.getService().getUrl()
    });
    
  } catch (error) {
    console.error('❌ Error in doGet:', error);
    return createCorsResponse(false, 'Server error in doGet: ' + error.message);
  }
}

/**
 * Get or create spreadsheet (ENHANCED VERSION)
 */
function getOrCreateSpreadsheet() {
  try {
    console.log('📊 Getting or creating spreadsheet...');
    
    // Try to get existing spreadsheet by ID if we have one
    if (SPREADSHEET_ID) {
      try {
        const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
        console.log('✅ Found existing spreadsheet by ID:', SPREADSHEET_ID);
        return spreadsheet;
      } catch (e) {
        console.log('⚠️ Stored spreadsheet ID not found, searching by name...');
        SPREADSHEET_ID = null;
      }
    }
    
    // Try to find existing spreadsheet by name
    const files = DriveApp.getFilesByName(SPREADSHEET_NAME);
    if (files.hasNext()) {
      const file = files.next();
      SPREADSHEET_ID = file.getId();
      console.log('✅ Found existing spreadsheet by name:', file.getUrl());
      return SpreadsheetApp.openById(SPREADSHEET_ID);
    }
    
    // Create new spreadsheet
    console.log('🆕 Creating new spreadsheet...');
    const spreadsheet = SpreadsheetApp.create(SPREADSHEET_NAME);
    SPREADSHEET_ID = spreadsheet.getId();
    
    console.log('✅ New spreadsheet created!');
    console.log('📊 Spreadsheet URL:', spreadsheet.getUrl());
    console.log('🔗 Spreadsheet ID:', SPREADSHEET_ID);
    
    return spreadsheet;
    
  } catch (error) {
    console.error('❌ Error getting/creating spreadsheet:', error);
    throw new Error('Failed to access spreadsheet: ' + error.message);
  }
}

/**
 * Get or create the commission data sheet (ENHANCED VERSION)
 */
function getOrCreateSheet() {
  try {
    console.log('📋 Getting or creating sheet...');
    
    const spreadsheet = getOrCreateSpreadsheet();
    let sheet = spreadsheet.getSheetByName(SHEET_NAME);
    
    if (!sheet) {
      console.log('🆕 Creating new sheet:', SHEET_NAME);
      
      // Delete default sheet if it exists and is empty
      const defaultSheet = spreadsheet.getSheetByName('Sheet1');
      if (defaultSheet && defaultSheet.getLastRow() <= 1) {
        console.log('🗑️ Deleting default empty sheet');
        spreadsheet.deleteSheet(defaultSheet);
      }
      
      sheet = spreadsheet.insertSheet(SHEET_NAME);
      
      // Add headers
      const headerRange = sheet.getRange(1, 1, 1, HEADERS.length);
      headerRange.setValues([HEADERS]);
      
      // Format headers
      headerRange.setFontWeight('bold');
      headerRange.setBackground('#4285f4');
      headerRange.setFontColor('white');
      
      // Set column widths
      sheet.setColumnWidth(1, 150); // Timestamp
      sheet.setColumnWidth(2, 100); // Month
      sheet.setColumnWidth(3, 120); // Total Sales
      sheet.setColumnWidth(4, 80);  // VAT %
      sheet.setColumnWidth(5, 120); // Sales Ex-VAT
      sheet.setColumnWidth(6, 120); // Total Commission
      sheet.setColumnWidth(7, 120); // Employee Name
      for (let i = 8; i <= HEADERS.length; i++) {
        sheet.setColumnWidth(i, 120); // Other numeric columns
      }
      
      // Freeze header row
      sheet.setFrozenRows(1);
      
      console.log('✅ Commission data sheet created with headers');
    } else {
      console.log('✅ Found existing sheet:', SHEET_NAME);
    }
    
    return sheet;
    
  } catch (error) {
    console.error('❌ Error getting/creating sheet:', error);
    throw new Error('Failed to get/create sheet: ' + error.message);
  }
}

/**
 * Save commission data to Google Sheets (ENHANCED VERSION WITH CORS)
 */
function saveCommissionData(entries) {
  try {
    console.log('💾 Starting save process...');
    console.log('📊 Received entries:', JSON.stringify(entries, null, 2));
    
    // Validate input
    if (!entries) {
      console.error('❌ No entries provided');
      return createCorsResponse(false, 'No entries provided');
    }
    
    if (!Array.isArray(entries)) {
      console.error('❌ Entries is not an array:', typeof entries);
      return createCorsResponse(false, 'Entries must be an array, received: ' + typeof entries);
    }
    
    if (entries.length === 0) {
      console.error('❌ Empty entries array');
      return createCorsResponse(false, 'Empty entries array provided');
    }
    
    console.log('📊 Processing', entries.length, 'entries...');
    
    const sheet = getOrCreateSheet();
    const timestamp = new Date();
    
    // Validate employees
    const validEmployees = ['Ting', 'Bank', 'Tann'];
    const validEntries = entries.filter(entry => {
      const isValid = entry.employeeName && 
                     validEmployees.includes(entry.employeeName) &&
                     entry.month && 
                     entry.month.trim() !== '';
      
      if (!isValid) {
        console.log('⚠️ Invalid entry:', JSON.stringify(entry));
      }
      
      return isValid;
    });
    
    console.log('✅ Valid entries:', validEntries.length, 'out of', entries.length);
    
    if (validEntries.length === 0) {
      console.error('❌ No valid entries found');
      return createCorsResponse(false, 'No valid entries found. Check employee names and months.');
    }
    
    // Prepare rows for insertion
    const rows = validEntries.map(entry => {
      const row = [
        timestamp,
        entry.month || '',
        parseFloat(entry.totalSales) || 0,
        parseFloat(entry.vatPercent) || 0,
        parseFloat(entry.salesExVAT) || 0,
        parseFloat(entry.totalCommission) || 0,
        entry.employeeName || '',
        parseFloat(entry.sharedCommission) || 0,
        parseFloat(entry.netSharedCommission) || 0,
        parseFloat(entry.overtime) || 0,
        parseFloat(entry.netOT) || 0,
        parseFloat(entry.finalAmount) || 0
      ];
      
      console.log('📝 Prepared row for', entry.employeeName, ':', row);
      return row;
    });
    
    // Insert data
    console.log('📝 Inserting', rows.length, 'rows into sheet...');
    
    const lastRow = sheet.getLastRow();
    console.log('📊 Current last row:', lastRow);
    
    const range = sheet.getRange(lastRow + 1, 1, rows.length, HEADERS.length);
    range.setValues(rows);
    
    console.log('✅ Data inserted successfully');
    
    // Format currency columns
    formatCurrencyColumns(sheet, lastRow + 1, rows.length);
    
    const successMessage = `Successfully saved ${validEntries.length} entries to ${SPREADSHEET_NAME}`;
    console.log('🎉', successMessage);
    
    return createCorsResponse(true, successMessage, {
      savedEntries: validEntries.length,
      totalEntries: entries.length,
      spreadsheetId: SPREADSHEET_ID,
      sheetName: SHEET_NAME,
      timestamp: timestamp.toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error saving data:', error);
    console.error('❌ Error stack:', error.stack);
    return createCorsResponse(false, 'Failed to save data: ' + error.message);
  }
}

/**
 * Load commission data by month (ENHANCED VERSION WITH CORS)
 */
function loadCommissionData(month) {
  try {
    console.log('📥 Loading data for month:', month);
    
    const sheet = getOrCreateSheet();
    const data = sheet.getDataRange().getValues();
    
    console.log('📊 Total rows in sheet:', data.length);
    
    if (data.length <= 1) {
      console.log('📊 No data found (only headers or empty sheet)');
      return createCorsJsonResponse([]);
    }
    
    // Filter data by month
    const monthLower = month.toLowerCase();
    const filteredData = data.slice(1).filter(row => {
      const rowMonth = (row[1] || '').toString().toLowerCase();
      return rowMonth === monthLower;
    });
    
    console.log('📊 Found', filteredData.length, 'entries for month:', month);
    
    // Convert to objects
    const result = filteredData.map(row => ({
      month: row[1] || '',
      totalSales: parseFloat(row[2]) || 0,
      vatPercent: parseFloat(row[3]) || 0,
      salesExVAT: parseFloat(row[4]) || 0,
      totalCommission: parseFloat(row[5]) || 0,
      employeeName: row[6] || '',
      sharedCommission: parseFloat(row[7]) || 0,
      netSharedCommission: parseFloat(row[8]) || 0,
      overtime: parseFloat(row[9]) || 0,
      netOT: parseFloat(row[10]) || 0,
      finalAmount: parseFloat(row[11]) || 0
    }));
    
    console.log('✅ Returning', result.length, 'processed entries');
    return createCorsJsonResponse(result);
    
  } catch (error) {
    console.error('❌ Error loading data:', error);
    return createCorsResponse(false, 'Failed to load data: ' + error.message);
  }
}

/**
 * Load all available months (ENHANCED VERSION WITH CORS)
 */
function loadAllMonths() {
  try {
    console.log('📊 Loading all available months...');
    
    const sheet = getOrCreateSheet();
    const data = sheet.getDataRange().getValues();
    
    console.log('📊 Total rows in sheet:', data.length);
    
    if (data.length <= 1) {
      console.log('📊 No data found');
      return createCorsJsonResponse([]);
    }
    
    // Extract unique months
    const months = [...new Set(data.slice(1)
      .map(row => row[1])
      .filter(month => month && month.trim() !== '')
    )];
    
    console.log('📊 Found months:', months);
    return createCorsJsonResponse(months);
    
  } catch (error) {
    console.error('❌ Error loading months:', error);
    return createCorsResponse(false, 'Failed to load months: ' + error.message);
  }
}

/**
 * Format currency columns (Thai Baht)
 */
function formatCurrencyColumns(sheet, startRow, numRows) {
  try {
    console.log('💰 Formatting currency columns...');
    
    // Currency columns: Total Sales, Sales Ex-VAT, Total Commission, Shared Commission, Net Shared Commission, Overtime, Net OT, Final Amount
    const currencyColumns = [3, 5, 6, 8, 9, 10, 11, 12];
    
    currencyColumns.forEach(col => {
      const range = sheet.getRange(startRow, col, numRows, 1);
      range.setNumberFormat('฿#,##0.00');
    });
    
    // Percentage column: VAT %
    const percentRange = sheet.getRange(startRow, 4, numRows, 1);
    percentRange.setNumberFormat('0.00%');
    
    console.log('✅ Currency formatting applied');
    
  } catch (error) {
    console.error('❌ Error formatting columns:', error);
  }
}

/**
 * Create a CORS-enabled JSON response (FIXED VERSION)
 */
function createCorsResponse(success, message, data = null) {
  const response = {
    success: success,
    message: message,
    timestamp: new Date().toISOString()
  };
  
  if (data !== null) {
    response.data = data;
  }
  
  console.log('📤 Sending CORS response:', JSON.stringify(response));
  
  return ContentService
    .createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON)
    .setHeaders({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '3600'
    });
}

/**
 * Create a CORS-enabled JSON response for data
 */
function createCorsJsonResponse(data) {
  console.log('📤 Sending CORS JSON data:', JSON.stringify(data));
  
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON)
    .setHeaders({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '3600'
    });
}

/**
 * Handle OPTIONS requests for CORS preflight
 */
function doOptions(e) {
  console.log('📋 Handling OPTIONS request for CORS');
  
  return ContentService
    .createTextOutput('')
    .setHeaders({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '3600'
    });
}

/**
 * Setup function - RUN THIS FIRST!
 */
function setupSpreadsheet() {
  try {
    console.log('🚀 Starting setup...');
    
    const spreadsheet = getOrCreateSpreadsheet();
    const sheet = getOrCreateSheet();
    
    console.log('✅ Setup complete!');
    console.log('📊 Spreadsheet Name:', SPREADSHEET_NAME);
    console.log('📊 Spreadsheet URL:', spreadsheet.getUrl());
    console.log('📋 Sheet Name:', SHEET_NAME);
    console.log('🔗 Spreadsheet ID:', spreadsheet.getId());
    
    return {
      success: true,
      message: "Setup complete! Commission tracking system ready.",
      spreadsheetUrl: spreadsheet.getUrl(),
      spreadsheetId: spreadsheet.getId(),
      sheetName: SHEET_NAME
    };
    
  } catch (error) {
    console.error('❌ Setup error:', error);
    return {
      success: false,
      message: "Error: " + error.message
    };
  }
}

/**
 * Test saving data (ENHANCED VERSION)
 */
function testSaveData() {
  console.log('🧪 Starting test save...');
  
  const testData = [
    {
      month: "TestMonth",
      totalSales: 100000,
      vatPercent: 7,
      salesExVAT: 93457.94,
      totalCommission: 6542.06,
      sharedCommission: 2180.69,
      netSharedCommission: 2115.27,
      employeeName: "Ting",
      overtime: 2000,
      netOT: 1940,
      finalAmount: 4055.27
    },
    {
      month: "TestMonth",
      totalSales: 100000,
      vatPercent: 7,
      salesExVAT: 93457.94,
      totalCommission: 6542.06,
      sharedCommission: 2180.69,
      netSharedCommission: 2115.27,
      employeeName: "Bank",
      overtime: 1500,
      netOT: 1455,
      finalAmount: 3570.27
    },
    {
      month: "TestMonth",
      totalSales: 100000,
      vatPercent: 7,
      salesExVAT: 93457.94,
      totalCommission: 6542.06,
      sharedCommission: 2180.69,
      netSharedCommission: 2115.27,
      employeeName: "Tann",
      overtime: 1000,
      netOT: 970,
      finalAmount: 3085.27
    }
  ];
  
  console.log('🧪 Test data prepared:', JSON.stringify(testData, null, 2));
  
  const result = saveCommissionData(testData);
  const resultContent = result.getContent();
  
  console.log('🧪 Test save result:', resultContent);
  return resultContent;
}

/**
 * Test loading data
 */
function testLoadData() {
  console.log('🧪 Starting test load...');
  
  const result = loadCommissionData("TestMonth");
  const resultContent = result.getContent();
  
  console.log('🧪 Test load result:', resultContent);
  return resultContent;
}

/**
 * Test loading all months
 */
function testLoadAllMonths() {
  console.log('🧪 Starting test load all months...');
  
  const result = loadAllMonths();
  const resultContent = result.getContent();
  
  console.log('🧪 Test load all months result:', resultContent);
  return resultContent;
}

/**
 * Get spreadsheet info
 */
function getSpreadsheetInfo() {
  try {
    const spreadsheet = getOrCreateSpreadsheet();
    const info = {
      name: spreadsheet.getName(),
      url: spreadsheet.getUrl(),
      id: spreadsheet.getId(),
      sheets: spreadsheet.getSheets().map(sheet => ({
        name: sheet.getName(),
        rows: sheet.getLastRow(),
        columns: sheet.getLastColumn()
      }))
    };
    console.log('📊 Spreadsheet Info:', JSON.stringify(info, null, 2));
    return info;
  } catch (error) {
    console.error('❌ Error getting spreadsheet info:', error);
    return { error: error.message };
  }
}

/**
 * Create menu in spreadsheet
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('🏪 AMNESIA Commission Tools')
    .addItem('⚙️ ตั้งค่าระบบ (Setup)', 'setupSpreadsheet')
    .addItem('💾 ทดสอบบันทึก (Test Save)', 'testSaveData')
    .addItem('📥 ทดสอบโหลด (Test Load)', 'testLoadData')
    .addItem('📊 ทดสอบโหลดเดือน (Test Load Months)', 'testLoadAllMonths')
    .addItem('ℹ️ ข้อมูล Spreadsheet (Info)', 'getSpreadsheetInfo')
    .addItem('🗑️ ลบข้อมูลทดสอบ (Clear Test Data)', 'clearTestData')
    .addItem('🔧 ตรวจสอบ Deployment', 'checkDeploymentSettings')
    .addToUi();
}

/**
 * Create dashboard sheet
 */
function createDashboard() {
  try {
    const spreadsheet = getOrCreateSpreadsheet();
    let dashboardSheet = spreadsheet.getSheetByName('Dashboard');
    
    if (!dashboardSheet) {
      dashboardSheet = spreadsheet.insertSheet('Dashboard', 0);
      
      // Set up dashboard title
      dashboardSheet.getRange('A1:F1').merge();
      dashboardSheet.getRange('A1').setValue('AMNESIA STAFF COMMISSION DASHBOARD 2025');
      dashboardSheet.getRange('A1').setFontSize(16);
      dashboardSheet.getRange('A1').setFontWeight('bold');
      dashboardSheet.getRange('A1').setHorizontalAlignment('center');
      dashboardSheet.getRange('A1').setBackground('#4285f4');
      dashboardSheet.getRange('A1').setFontColor('white');
      
      // Set up summary sections
      dashboardSheet.getRange('A3').setValue('สรุปรายเดือน (Monthly Summary)');
      dashboardSheet.getRange('A3').setFontWeight('bold');
      
      // Format dashboard
      dashboardSheet.autoResizeColumns(1, 6);
      
      console.log('✅ Dashboard created successfully');
    }
    
    return dashboardSheet;
  } catch (error) {
    console.error('❌ Error creating dashboard:', error);
    return null;
  }
}

/**
 * Get employee summary
 */
function getEmployeeSummary() {
  try {
    const sheet = getOrCreateSheet();
    const data = sheet.getDataRange().getValues();
    
    if (data.length <= 1) {
      return createCorsJsonResponse([]);
    }
    
    const employees = ['Ting', 'Bank', 'Tann'];
    const summary = employees.map(employee => {
      const employeeData = data.slice(1).filter(row => row[6] === employee);
      const totalCommission = employeeData.reduce((sum, row) => sum + (parseFloat(row[11]) || 0), 0);
      const totalEntries = employeeData.length;
      
      return {
        name: employee,
        totalEntries: totalEntries,
        totalCommission: totalCommission,
        averageCommission: totalEntries > 0 ? totalCommission / totalEntries : 0
      };
    });
    
    return createCorsJsonResponse(summary);
    
  } catch (error) {
    console.error('❌ Error getting employee summary:', error);
    return createCorsResponse(false, 'Failed to get employee summary: ' + error.message);
  }
}

/**
 * Clear test data
 */
function clearTestData() {
  try {
    console.log('🗑️ Clearing test data...');
    
    const sheet = getOrCreateSheet();
    const data = sheet.getDataRange().getValues();
    
    if (data.length <= 1) {
      console.log('📊 No data to clear');
      return "No data to clear";
    }
    
    // Find rows with "TestMonth"
    const rowsToDelete = [];
    for (let i = 1; i < data.length; i++) {
      if (data[i][1] === "TestMonth") {
        rowsToDelete.push(i + 1); // +1 because sheet rows are 1-indexed
      }
    }
    
    console.log('🗑️ Found', rowsToDelete.length, 'test rows to delete');
    
    // Delete rows in reverse order to maintain correct indices
    rowsToDelete.reverse().forEach(rowIndex => {
      sheet.deleteRow(rowIndex);
    });
    
    const message = `Cleared ${rowsToDelete.length} test entries`;
    console.log('✅', message);
    return message;
    
  } catch (error) {
    console.error('❌ Error clearing test data:', error);
    return "Error: " + error.message;
  }
}

/**
 * Debug function to check deployment settings
 */
function checkDeploymentSettings() {
  try {
    const info = {
      scriptId: ScriptApp.getScriptId(),
      triggers: ScriptApp.getProjectTriggers().length,
      spreadsheetInfo: getSpreadsheetInfo(),
      timestamp: new Date().toISOString(),
      deploymentUrl: ScriptApp.getService().getUrl()
    };
    
    console.log('🔍 Deployment info:', JSON.stringify(info, null, 2));
    return info;
    
  } catch (error) {
    console.error('❌ Error checking deployment:', error);
    return { error: error.message };
  }
}

/**
 * Get current deployment URL
 */
function getCurrentDeploymentUrl() {
  try {
    const url = ScriptApp.getService().getUrl();
    console.log('🔗 Current deployment URL:', url);
    return url;
  } catch (error) {
    console.error('❌ Error getting deployment URL:', error);
    return null;
  }
}