"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Copy, ExternalLink, AlertTriangle, CheckCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function FixedAppsScriptSetup() {
  const [currentMethod, setCurrentMethod] = useState<"method1" | "method2">("method1")
  const { toast } = useToast()

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    toast({
      title: "Code Copied!",
      description: "Paste this code into your Apps Script editor",
    })
  }

  const openLink = (url: string) => {
    window.open(url, "_blank")
  }

  const fixedAppsScriptCode = `/**
 * Google Apps Script for AMNESIA Staff Commission 2025 (Fixed Version)
 * This version creates its own spreadsheet automatically
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
    
    return createResponse(true, \`Successfully saved \${validEntries.length} entries to \${SPREADSHEET_NAME}\`);
    
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
 * Setup function - FIXED VERSION
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
 * Get spreadsheet info
 */
function getSpreadsheetInfo() {
  try {
    const spreadsheet = getOrCreateSpreadsheet();
    return {
      name: spreadsheet.getName(),
      url: spreadsheet.getUrl(),
      id: spreadsheet.getId(),
      sheets: spreadsheet.getSheets().map(sheet => sheet.getName())
    };
  } catch (error) {
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
    .addItem('ℹ️ ข้อมูล Spreadsheet (Info)', 'getSpreadsheetInfo')
    .addToUi();
}`

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">🔧 Fixed Google Apps Script Code</CardTitle>
          <CardDescription>
            This version automatically creates its own spreadsheet and fixes the "Cannot read properties of null" error
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Error Explanation */}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>สาเหตุของ Error:</strong> Apps Script ไม่ได้เชื่อมต่อกับ Google Spreadsheet ใดๆ ทำให้{" "}
              <code>SpreadsheetApp.getActiveSpreadsheet()</code> return null
            </AlertDescription>
          </Alert>

          {/* Solution Methods */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card
              className={`cursor-pointer border-2 ${
                currentMethod === "method1" ? "border-blue-500 bg-blue-50" : "border-gray-200"
              }`}
              onClick={() => setCurrentMethod("method1")}
            >
              <CardHeader>
                <CardTitle className="text-lg">🚀 วิธีที่ 1: ใช้โค้ดใหม่ (แนะนำ)</CardTitle>
                <CardDescription>โค้ดที่แก้ไขแล้ว สร้าง Spreadsheet อัตโนมัติ</CardDescription>
              </CardHeader>
            </Card>

            <Card
              className={`cursor-pointer border-2 ${
                currentMethod === "method2" ? "border-blue-500 bg-blue-50" : "border-gray-200"
              }`}
              onClick={() => setCurrentMethod("method2")}
            >
              <CardHeader>
                <CardTitle className="text-lg">📊 วิธีที่ 2: เชื่อมต่อ Spreadsheet</CardTitle>
                <CardDescription>เชื่อมต่อ Apps Script กับ Spreadsheet ที่มีอยู่</CardDescription>
              </CardHeader>
            </Card>
          </div>

          {/* Method 1: Fixed Code */}
          {currentMethod === "method1" && (
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="text-green-800">🚀 วิธีที่ 1: ใช้โค้ดที่แก้ไขแล้ว</CardTitle>
                <CardDescription className="text-green-700">
                  โค้ดนี้จะสร้าง Google Spreadsheet ใหม่อัตโนมัติ ไม่ต้องเชื่อมต่อด้วยตนเอง
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-semibold">ขั้นตอน:</h4>
                  <ol className="list-decimal list-inside text-sm space-y-1">
                    <li>ลบโค้ดเดิมทั้งหมดใน Apps Script</li>
                    <li>คัดลอกโค้ดใหม่ด้านล่างนี้ทั้งหมด</li>
                    <li>วางใน Apps Script Editor</li>
                    <li>บันทึก (Ctrl+S)</li>
                    <li>รัน setupSpreadsheet() function</li>
                    <li>Deploy เป็น Web App</li>
                  </ol>
                </div>

                <div className="relative">
                  <pre className="bg-white p-4 rounded text-xs overflow-x-auto max-h-60 border">
                    {fixedAppsScriptCode}
                  </pre>
                  <Button onClick={() => copyCode(fixedAppsScriptCode)} className="absolute top-2 right-2" size="sm">
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>

                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>ข้อดี:</strong> โค้ดนี้จะสร้าง Spreadsheet ชื่อ "AMNESIA Staff Commission 2025" ให้อัตโนมัติ และแสดง URL
                    ใน console log
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          )}

          {/* Method 2: Connect to Existing Spreadsheet */}
          {currentMethod === "method2" && (
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-blue-800">📊 วิธีที่ 2: เชื่อมต่อกับ Spreadsheet ที่มีอยู่</CardTitle>
                <CardDescription className="text-blue-700">
                  เชื่อมต่อ Apps Script กับ Google Spreadsheet ที่สร้างไว้แล้ว
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-semibold">ขั้นตอน:</h4>
                  <ol className="list-decimal list-inside text-sm space-y-1">
                    <li>
                      เปิด{" "}
                      <Button
                        variant="link"
                        className="p-0 h-auto"
                        onClick={() =>
                          openLink(
                            "https://docs.google.com/spreadsheets/d/1vfqb7BwLOJEL32CrtoUoOzkQF_p8vjvjVC0IwwbVJms/edit",
                          )
                        }
                      >
                        Google Spreadsheet ที่มีอยู่
                      </Button>
                    </li>
                    <li>ใน Spreadsheet คลิก Extensions → Apps Script</li>
                    <li>วางโค้ดเดิม (ไม่ใช่โค้ดใหม่) ลงไป</li>
                    <li>บันทึกและรัน setupSpreadsheet()</li>
                    <li>Deploy เป็น Web App</li>
                  </ol>
                </div>

                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>ข้อควรระวัง:</strong> วิธีนี้ต้องเริ่มจาก Spreadsheet ก่อน แล้วค่อยสร้าง Apps Script ไม่ใช่สร้าง Apps Script
                    ก่อน
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          )}

          {/* Next Steps */}
          <Card>
            <CardHeader>
              <CardTitle>📋 ขั้นตอนต่อไป</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">หลังจากรันโค้ดสำเร็จ:</h4>
                  <ul className="text-sm space-y-1">
                    <li>✅ ดู console log เพื่อหา Spreadsheet URL</li>
                    <li>✅ Deploy เป็น Web App</li>
                    <li>✅ ตั้งค่า "Who has access" เป็น "Anyone"</li>
                    <li>✅ ทดสอบ Web App URL</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">สิ่งที่ควรเห็นใน console:</h4>
                  <div className="bg-green-100 p-2 rounded text-xs font-mono">
                    ✅ Setup complete!
                    <br />📊 Spreadsheet URL: https://docs.google.com/...
                    <br />📋 Sheet Name: Commission_Data
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="flex gap-2">
            <Button onClick={() => openLink("https://script.google.com")} className="flex items-center gap-2">
              <ExternalLink className="w-4 h-4" />
              เปิด Google Apps Script
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                openLink("https://docs.google.com/spreadsheets/d/1vfqb7BwLOJEL32CrtoUoOzkQF_p8vjvjVC0IwwbVJms/edit")
              }
              className="flex items-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              เปิด Spreadsheet เดิม
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
