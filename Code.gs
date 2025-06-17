/**
 * Google Apps Script for AMNESIA Staff Commission 2025 (Updated Version)
 * Handles saving and loading commission data with total sales approach
 * Compatible with new React App
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
 * Handle POST requests (saving data)
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    
    if (data.action === 'save') {
      return saveCommissionData(data.data);
    }
    
    return createResponse(false, 'Invalid action specified');
  } catch (error) {
    console.error('Error in doPost:', error);
    return createResponse(false, 'Server error: ' + error.message);
  }
}

/**
 * Handle GET requests (loading data)
 */
function doGet(e) {
  try {
    const action = e.parameter.action;
    
    if (action === 'load') {
      const month = e.parameter.month;
      if (month) {
        return loadCommissionData(month);
      } else {
        return loadAllMonths();
      }
    }
    
    // Default response for basic connectivity test
    return createResponse(true, 'AMNESIA Commission API is working! 🎉');
  } catch (error) {
    console.error('Error in doGet:', error);
    return createResponse(false, 'Server error: ' + error.message);
  }
}

/**
 * Get or create spreadsheet (FIXED VERSION)
 */
function getOrCreateSpreadsheet() {
  try {
    // Try to get existing spreadsheet by ID if we have one
    if (SPREADSHEET_ID) {
      try {
        return SpreadsheetApp.openById(SPREADSHEET_ID);
      } catch (e) {
        console.log('Stored spreadsheet ID not found, creating new one...');
        SPREADSHEET_ID = null;
      }
    }
    
    // Try to find existing spreadsheet by name
    const files = DriveApp.getFilesByName(SPREADSHEET_NAME);
    if (files.hasNext()) {
      const file = files.next();
      SPREADSHEET_ID = file.getId();
      console.log('Found existing spreadsheet: ' + file.getUrl());
      return SpreadsheetApp.openById(SPREADSHEET_ID);
    }
    
    // Create new spreadsheet
    console.log('Creating new spreadsheet...');
    const spreadsheet = SpreadsheetApp.create(SPREADSHEET_NAME);
    SPREADSHEET_ID = spreadsheet.getId();
    
    console.log('✅ New spreadsheet created!');
    console.log('📊 Spreadsheet URL: ' + spreadsheet.getUrl());
    
    return spreadsheet;
    
  } catch (error) {
    console.error('Error getting/creating spreadsheet:', error);
    throw new Error('Failed to access spreadsheet: ' + error.message);
  }
}

/**
 * Get or create the commission data sheet
 */
function getOrCreateSheet() {
  const spreadsheet = getOrCreateSpreadsheet();
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);
  
  if (!sheet) {
    // Delete default sheet if it exists and is empty
    const defaultSheet = spreadsheet.getSheetByName('Sheet1');
    if (defaultSheet && defaultSheet.getLastRow() <= 1) {
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
  }
  
  return sheet;
}

/**
 * Save commission data to Google Sheets
 */
function saveCommissionData(entries) {
  try {
    if (!entries || !Array.isArray(entries) || entries.length === 0) {
      return createResponse(false, 'No valid data provided');
    }
    
    const sheet = getOrCreateSheet();
    const timestamp = new Date();
    
    // Validate employees
    const validEmployees = ['Ting', 'Bank', 'Tann'];
    const validEntries = entries.filter(entry => 
      entry.employeeName && 
      validEmployees.includes(entry.employeeName) &&
      entry.month && 
      entry.month.trim() !== ''
    );
    
    if (validEntries.length === 0) {
      return createResponse(false, 'No valid entries found');
    }
    
    // Prepare rows for insertion
    const rows = validEntries.map(entry => [
      timestamp,
      entry.month || '',
      entry.totalSales || 0,
      entry.vatPercent || 0,
      entry.salesExVAT || 0,
      entry.totalCommission || 0,
      entry.employeeName || '',
      entry.sharedCommission || 0,
      entry.netSharedCommission || 0,
      entry.overtime || 0,
      entry.netOT || 0,
      entry.finalAmount || 0
    ]);
    
    // Insert data
    if (rows.length > 0) {
      const lastRow = sheet.getLastRow();
      const range = sheet.getRange(lastRow + 1, 1, rows.length, HEADERS.length);
      range.setValues(rows);
      
      // Format currency columns
      formatCurrencyColumns(sheet, lastRow + 1, rows.length);
    }
    
    return createResponse(true, `Successfully saved ${validEntries.length} entries to ${SPREADSHEET_NAME}`);
    
  } catch (error) {
    console.error('Error saving data:', error);
    return createResponse(false, 'Failed to save data: ' + error.message);
  }
}

/**
 * Load commission data by month
 */
function loadCommissionData(month) {
  try {
    const sheet = getOrCreateSheet();
    const data = sheet.getDataRange().getValues();
    
    if (data.length <= 1) {
      return createJsonResponse([]);
    }
    
    // Filter data by month
    const monthLower = month.toLowerCase();
    const filteredData = data.slice(1).filter(row => {
      const rowMonth = (row[1] || '').toString().toLowerCase();
      return rowMonth === monthLower;
    });
    
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
    
    return createJsonResponse(result);
    
  } catch (error) {
    console.error('Error loading data:', error);
    return createResponse(false, 'Failed to load data: ' + error.message);
  }
}

/**
 * Load all available months
 */
function loadAllMonths() {
  try {
    const sheet = getOrCreateSheet();
    const data = sheet.getDataRange().getValues();
    
    if (data.length <= 1) {
      return createJsonResponse([]);
    }
    
    // Extract unique months
    const months = [...new Set(data.slice(1)
      .map(row => row[1])
      .filter(month => month && month.trim() !== '')
    )];
    
    return createJsonResponse(months);
    
  } catch (error) {
    console.error('Error loading months:', error);
    return createResponse(false, 'Failed to load months: ' + error.message);
  }
}

/**
 * Format currency columns (Thai Baht)
 */
function formatCurrencyColumns(sheet, startRow, numRows) {
  try {
    // Currency columns: Total Sales, Sales Ex-VAT, Total Commission, Shared Commission, Net Shared Commission, Overtime, Net OT, Final Amount
    const currencyColumns = [3, 5, 6, 8, 9, 10, 11, 12];
    
    currencyColumns.forEach(col => {
      const range = sheet.getRange(startRow, col, numRows, 1);
      range.setNumberFormat('฿#,##0.00');
    });
    
    // Percentage column: VAT %
    const percentRange = sheet.getRange(startRow, 4, numRows, 1);
    percentRange.setNumberFormat('0.00%');
    
  } catch (error) {
    console.error('Error formatting columns:', error);
  }
}

/**
 * Create a standard JSON response
 */
function createResponse(success, message, data = null) {
  const response = {
    success: success,
    message: message
  };
  
  if (data !== null) {
    response.data = data;
  }
  
  return ContentService
    .createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Create a JSON response for data
 */
function createJsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
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
    console.log('📊 Spreadsheet Name: ' + SPREADSHEET_NAME);
    console.log('📊 Spreadsheet URL: ' + spreadsheet.getUrl());
    console.log('📋 Sheet Name: ' + SHEET_NAME);
    console.log('🔗 Spreadsheet ID: ' + spreadsheet.getId());
    
    return {
      success: true,
      message: "Setup complete! Commission tracking system ready.",
      spreadsheetUrl: spreadsheet.getUrl(),
      spreadsheetId: spreadsheet.getId()
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
 * Test saving data
 */
function testSaveData() {
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
  
  const result = saveCommissionData(testData);
  console.log('💾 Test save result:', result.getContent());
  return result.getContent();
}

/**
 * Test loading data
 */
function testLoadData() {
  const result = loadCommissionData("TestMonth");
  console.log('📥 Test load result:', result.getContent());
  return result.getContent();
}

/**
 * Test loading all months
 */
function testLoadAllMonths() {
  const result = loadAllMonths();
  console.log('📊 Test load all months result:', result.getContent());
  return result.getContent();
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
      sheets: spreadsheet.getSheets().map(sheet => sheet.getName())
    };
    console.log('📊 Spreadsheet Info:', JSON.stringify(info, null, 2));
    return info;
  } catch (error) {
    console.error('Error getting spreadsheet info:', error);
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
    console.error('Error creating dashboard:', error);
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
      return createJsonResponse([]);
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
    
    return createJsonResponse(summary);
    
  } catch (error) {
    console.error('Error getting employee summary:', error);
    return createResponse(false, 'Failed to get employee summary: ' + error.message);
  }
}

/**
 * Clear test data
 */
function clearTestData() {
  try {
    const sheet = getOrCreateSheet();
    const data = sheet.getDataRange().getValues();
    
    if (data.length <= 1) {
      return "No data to clear";
    }
    
    // Find rows with "TestMonth"
    const rowsToDelete = [];
    for (let i = 1; i < data.length; i++) {
      if (data[i][1] === "TestMonth") {
        rowsToDelete.push(i + 1); // +1 because sheet rows are 1-indexed
      }
    }
    
    // Delete rows in reverse order to maintain correct indices
    rowsToDelete.reverse().forEach(rowIndex => {
      sheet.deleteRow(rowIndex);
    });
    
    console.log(`🗑️ Cleared ${rowsToDelete.length} test entries`);
    return `Cleared ${rowsToDelete.length} test entries`;
    
  } catch (error) {
    console.error('Error clearing test data:', error);
    return "Error: " + error.message;
  }
}