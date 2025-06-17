/**
 * Google Apps Script for AMNESIA Staff Commission 2025 (Thai Baht)
 * Handles saving and loading commission data to/from the spreadsheet
 */

// Configuration - Update these values for your setup
const SHEET_NAME = 'Commission_Data';
const HEADERS = [
  'Timestamp',
  'Employee Name', 
  'Month', 
  'Total Sales (incl VAT) ฿', 
  'VAT %', 
  'Overtime ฿', 
  'Sales Ex-VAT ฿', 
  'Individual Commission ฿', 
  'Shared Commission ฿', 
  'Net Shared Commission ฿', 
  'Net OT ฿', 
  'Final Amount ฿'
];

/**
 * Main function to handle HTTP requests for saving data
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
 * Handle GET requests for loading data
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
    
    return createResponse(false, 'Invalid parameters. Use ?action=load&month=MonthName');
  } catch (error) {
    console.error('Error in doGet:', error);
    return createResponse(false, 'Server error: ' + error.message);
  }
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
    
    // Validate and prepare data
    const validEmployees = ['Ting', 'Bank', 'Tann'];
    const validEntries = entries.filter(entry => 
      entry.employeeName && 
      validEmployees.includes(entry.employeeName) &&
      entry.month && 
      entry.month.trim() !== ''
    );
    
    if (validEntries.length === 0) {
      return createResponse(false, 'No valid entries found (missing employee name or month)');
    }
    
    // Prepare rows for insertion
    const rows = validEntries.map(entry => [
      timestamp,
      entry.employeeName || '',
      entry.month || '',
      entry.totalSales || 0,
      entry.vatPercent || 0,
      entry.overtime || 0,
      entry.salesExVAT || 0,
      entry.individualCommission || 0,
      entry.sharedCommission || 0,
      entry.netSharedCommission || 0,
      entry.netOT || 0,
      entry.finalAmount || 0
    ]);
    
    // Insert data
    if (rows.length > 0) {
      const lastRow = sheet.getLastRow();
      const range = sheet.getRange(lastRow + 1, 1, rows.length, HEADERS.length);
      range.setValues(rows);
      
      // Format currency columns (Thai Baht)
      formatCurrencyColumns(sheet, lastRow + 1, rows.length);
    }
    
    return createResponse(true, `Successfully saved ${validEntries.length} commission entries`);
    
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
    
    // Filter data by month (case-insensitive)
    const monthLower = month.toLowerCase();
    const filteredData = data.slice(1).filter(row => {
      const rowMonth = (row[2] || '').toString().toLowerCase();
      return rowMonth === monthLower;
    });
    
    // Convert to objects
    const result = filteredData.map(row => ({
      employeeName: row[1] || '',
      month: row[2] || '',
      totalSales: parseFloat(row[3]) || 0,
      vatPercent: parseFloat(row[4]) || 0,
      overtime: parseFloat(row[5]) || 0,
      salesExVAT: parseFloat(row[6]) || 0,
      individualCommission: parseFloat(row[7]) || 0,
      sharedCommission: parseFloat(row[8]) || 0,
      netSharedCommission: parseFloat(row[9]) || 0,
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
 * Load all months for dropdown selection
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
      .map(row => row[2])
      .filter(month => month && month.trim() !== '')
    )];
    
    return createJsonResponse(months);
    
  } catch (error) {
    console.error('Error loading months:', error);
    return createResponse(false, 'Failed to load months: ' + error.message);
  }
}

/**
 * Get or create the commission data sheet
 */
function getOrCreateSheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);
  
  if (!sheet) {
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
    sheet.setColumnWidth(2, 150); // Employee Name
    sheet.setColumnWidth(3, 100); // Month
    for (let i = 4; i <= HEADERS.length; i++) {
      sheet.setColumnWidth(i, 120); // Numeric columns
    }
    
    // Freeze header row
    sheet.setFrozenRows(1);
  }
  
  return sheet;
}

/**
 * Format currency columns (Thai Baht)
 */
function formatCurrencyColumns(sheet, startRow, numRows) {
  try {
    // Currency columns (Thai Baht): Total Sales, Overtime, Sales Ex-VAT, Individual Commission, Shared Commission, Net Shared Commission, Net OT, Final Amount
    const currencyColumns = [4, 6, 7, 8, 9, 10, 11, 12];
    
    currencyColumns.forEach(col => {
      const range = sheet.getRange(startRow, col, numRows, 1);
      range.setNumberFormat('฿#,##0.00');
    });
    
    // Percentage column: VAT %
    const percentRange = sheet.getRange(startRow, 5, numRows, 1);
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
 * Create a summary dashboard sheet
 */
function createDashboard() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let dashboardSheet = spreadsheet.getSheetByName('Dashboard');
  
  if (!dashboardSheet) {
    dashboardSheet = spreadsheet.insertSheet('Dashboard', 0);
    
    // Set up dashboard title
    dashboardSheet.getRange('A1:F1').merge();
    dashboardSheet.getRange('A1').setValue('AMNESIA STAFF COMMISSION DASHBOARD (฿)');
    dashboardSheet.getRange('A1').setFontSize(16);
    dashboardSheet.getRange('A1').setFontWeight('bold');
    dashboardSheet.getRange('A1').setHorizontalAlignment('center');
    dashboardSheet.getRange('A1').setBackground('#4285f4');
    dashboardSheet.getRange('A1').setFontColor('white');
    
    // Set up summary sections
    dashboardSheet.getRange('A3').setValue('สรุปรายเดือน (Monthly Summary)');
    dashboardSheet.getRange('A3').setFontWeight('bold');
    
    // Create charts and summaries
    createMonthlySummaryChart(dashboardSheet);
    
    // Format dashboard
    dashboardSheet.autoResizeColumns(1, 6);
  }
  
  return dashboardSheet;
}

/**
 * Create monthly summary chart
 */
function createMonthlySummaryChart(dashboardSheet) {
  const dataSheet = getOrCreateSheet();
  
  // Create a chart only if we have data
  if (dataSheet.getLastRow() > 1) {
    // Create a chart for monthly commission totals
    const chartBuilder = dashboardSheet.newChart()
      .setChartType(Charts.ChartType.COLUMN)
      .addRange(dataSheet.getRange('C2:C'))
      .addRange(dataSheet.getRange('L2:L'))
      .setPosition(4, 1, 0, 0)
      .setOption('title', 'ยอดค่าคอมรายเดือน (Monthly Commission Totals)')
      .setOption('hAxis.title', 'เดือน (Month)')
      .setOption('vAxis.title', 'จำนวนเงิน (Amount ฿)')
      .setOption('width', 600)
      .setOption('height', 400);
    
    dashboardSheet.insertChart(chartBuilder.build());
  }
}

/**
 * Setup function to initialize the spreadsheet
 */
function setupSpreadsheet() {
  try {
    const sheet = getOrCreateSheet();
    createDashboard();
    
    console.log('Spreadsheet setup complete. Sheet name: ' + SHEET_NAME);
    console.log('Sheet URL: ' + SpreadsheetApp.getActiveSpreadsheet().getUrl());
    
    return "Setup complete! Your commission tracking system is ready to use.";
  } catch (error) {
    console.error('Error setting up spreadsheet:', error);
    return "Error: " + error.message;
  }
}

/**
 * Test function for development
 */
function testSaveData() {
  const testData = [
    {
      employeeName: "Ting",
      month: "January",
      totalSales: 50000,
      vatPercent: 7,
      overtime: 2000,
      salesExVAT: 46728.97,
      individualCommission: 3270.83,
      sharedCommission: 10000,
      netSharedCommission: 9700,
      netOT: 1940,
      finalAmount: 11640
    }
  ];
  
  const result = saveCommissionData(testData);
  return result.getContent();
}

/**
 * Test function for loading data
 */
function testLoadData() {
  const result = loadCommissionData("January");
  return result.getContent();
}

/**
 * Create a menu in the spreadsheet UI
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('Commission Tools')
    .addItem('ตั้งค่าสเปรดชีต (Setup Spreadsheet)', 'setupSpreadsheet')
    .addItem('สร้างแดชบอร์ด (Create Dashboard)', 'createDashboard')
    .addItem('ทดสอบบันทึกข้อมูล (Test Save Data)', 'testSaveData')
    .addItem('ทดสอบโหลดข้อมูล (Test Load Data)', 'testLoadData')
    .addToUi();
}

/**
 * Get employee summary data
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
      const employeeData = data.slice(1).filter(row => row[1] === employee);
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
