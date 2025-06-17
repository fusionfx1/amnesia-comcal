"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, ExternalLink, Copy, FileCode, Settings, Globe } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function AppsScriptDeploymentGuide() {
  const [currentStep, setCurrentStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<number[]>([])
  const { toast } = useToast()

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    toast({
      title: "Code Copied!",
      description: "Paste this code into your Apps Script editor",
    })
  }

  const markStepComplete = (stepIndex: number) => {
    if (!completedSteps.includes(stepIndex)) {
      setCompletedSteps([...completedSteps, stepIndex])
    }
  }

  const openLink = (url: string) => {
    window.open(url, "_blank")
  }

  const steps = [
    {
      title: "Open Google Apps Script",
      icon: <Globe className="w-5 h-5" />,
      description: "Access your Google Apps Script project",
      content: (
        <div className="space-y-4">
          <p>เปิด Google Apps Script และสร้างโปรเจกต์ใหม่:</p>
          <div className="space-y-2">
            <Button onClick={() => openLink("https://script.google.com")} className="w-full justify-start">
              <ExternalLink className="w-4 h-4 mr-2" />
              เปิด script.google.com
            </Button>
            <div className="text-sm text-gray-600 space-y-1">
              <p>1. คลิก "New project" เพื่อสร้างโปรเจกต์ใหม่</p>
              <p>2. ตั้งชื่อโปรเจกต์เป็น "AMNESIA Commission API"</p>
              <p>3. ลบโค้ดเดิมทั้งหมดออก</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Paste the Apps Script Code",
      icon: <FileCode className="w-5 h-5" />,
      description: "Copy and paste the complete Apps Script code",
      content: (
        <div className="space-y-4">
          <p>คัดลอกโค้ดนี้ทั้งหมดแล้ววางใน Apps Script Editor:</p>
          <div className="relative">
            <pre className="bg-gray-100 p-4 rounded text-xs overflow-x-auto max-h-60 border">
              {`/**
 * Google Apps Script for AMNESIA Staff Commission 2025 (Total Sales)
 * Handles saving and loading commission data with total sales approach
 */

// Configuration
const SHEET_NAME = 'Commission_Data';
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
    return createResponse(true, 'AMNESIA Commission API is working!');
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
    
    return createResponse(true, \`Successfully saved \${validEntries.length} entries\`);
    
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
  }
  
  return sheet;
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
 * Setup function - run this first!
 */
function setupSpreadsheet() {
  try {
    const sheet = getOrCreateSheet();
    console.log('✅ Setup complete! Sheet created: ' + SHEET_NAME);
    console.log('📊 Sheet URL: ' + SpreadsheetApp.getActiveSpreadsheet().getUrl());
    return "Setup complete! Commission tracking system ready.";
  } catch (error) {
    console.error('❌ Setup error:', error);
    return "Error: " + error.message;
  }
}`}
            </pre>
            <Button
              onClick={() =>
                copyCode(`/**
 * Google Apps Script for AMNESIA Staff Commission 2025 (Total Sales)
 * Handles saving and loading commission data with total sales approach
 */

// Configuration
const SHEET_NAME = 'Commission_Data';
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
    return createResponse(true, 'AMNESIA Commission API is working!');
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
    
    return createResponse(true, \`Successfully saved \${validEntries.length} entries\`);
    
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
  }
  
  return sheet;
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
 * Setup function - run this first!
 */
function setupSpreadsheet() {
  try {
    const sheet = getOrCreateSheet();
    console.log('✅ Setup complete! Sheet created: ' + SHEET_NAME);
    console.log('📊 Sheet URL: ' + SpreadsheetApp.getActiveSpreadsheet().getUrl());
    return "Setup complete! Commission tracking system ready.";
  } catch (error) {
    console.error('❌ Setup error:', error);
    return "Error: " + error.message;
  }
}`)
              }
              className="absolute top-2 right-2"
              size="sm"
            >
              <Copy className="w-4 h-4" />
            </Button>
          </div>
          <div className="text-sm text-gray-600">
            <p>หลังจากวางโค้ดแล้ว:</p>
            <p>1. กด Ctrl+S (หรือ Cmd+S) เพื่อบันทึก</p>
            <p>2. ตั้งชื่อโปรเจกต์เป็น "AMNESIA Commission API"</p>
          </div>
        </div>
      ),
    },
    {
      title: "Create Google Spreadsheet",
      icon: <Settings className="w-5 h-5" />,
      description: "Create a new Google Spreadsheet for data storage",
      content: (
        <div className="space-y-4">
          <p>สร้าง Google Spreadsheet ใหม่:</p>
          <div className="space-y-2">
            <Button onClick={() => openLink("https://sheets.google.com")} className="w-full justify-start">
              <ExternalLink className="w-4 h-4 mr-2" />
              เปิด sheets.google.com
            </Button>
            <div className="text-sm text-gray-600 space-y-1">
              <p>1. คลิก "Blank spreadsheet" เพื่อสร้างใหม่</p>
              <p>2. ตั้งชื่อ Spreadsheet เป็น "AMNESIA Staff Commission 2025"</p>
              <p>3. คัดลอก URL ของ Spreadsheet ไว้</p>
              <p>4. กลับไปที่ Apps Script</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Link Spreadsheet to Apps Script",
      icon: <Settings className="w-5 h-5" />,
      description: "Connect your Apps Script to the Google Spreadsheet",
      content: (
        <div className="space-y-4">
          <p>เชื่อมต่อ Apps Script กับ Spreadsheet:</p>
          <div className="text-sm text-gray-600 space-y-2">
            <p>1. ใน Apps Script Editor คลิก "Resources" หรือไอคอน ⚙️</p>
            <p>2. เลือก "Cloud Platform project"</p>
            <p>3. หรือคลิก "Services" ทางซ้าย แล้วเพิ่ม "Google Sheets API"</p>
            <p>4. หรือใช้วิธีง่าย: รัน setupSpreadsheet() function</p>
          </div>
          <div className="bg-blue-50 p-3 rounded border">
            <p className="text-sm font-semibold text-blue-800">วิธีง่าย:</p>
            <p className="text-sm text-blue-700">
              ใน Apps Script เลือก function "setupSpreadsheet" แล้วคลิก "Run" ระบบจะสร้าง sheet ให้อัตโนมัติ
            </p>
          </div>
        </div>
      ),
    },
    {
      title: "Deploy as Web App",
      icon: <Globe className="w-5 h-5" />,
      description: "Deploy your Apps Script as a Web App with correct settings",
      content: (
        <div className="space-y-4">
          <p>Deploy Apps Script เป็น Web App:</p>
          <div className="text-sm text-gray-600 space-y-2">
            <p>1. คลิก "Deploy" → "New deployment"</p>
            <p>2. เลือก Type: "Web app"</p>
            <p>3. ตั้งค่าดังนี้:</p>
            <div className="ml-4 space-y-1">
              <p>• Description: "AMNESIA Commission API v1"</p>
              <p>• Execute as: "Me (your-email@gmail.com)"</p>
              <p>
                • Who has access: <strong>"Anyone"</strong> ⚠️ สำคัญมาก!
              </p>
            </div>
            <p>4. คลิก "Deploy"</p>
            <p>5. คัดลอก Web App URL ที่ได้</p>
          </div>
          <div className="bg-red-50 p-3 rounded border border-red-200">
            <p className="text-sm font-semibold text-red-800">⚠️ สำคัญ:</p>
            <p className="text-sm text-red-700">
              ต้องเลือก "Anyone" ไม่ใช่ "Anyone with Google account" เพื่อให้ API ทำงานได้โดยไม่ต้อง Sign-in
            </p>
          </div>
        </div>
      ),
    },
    {
      title: "Test the Web App",
      icon: <CheckCircle className="w-5 h-5" />,
      description: "Test your deployed Web App to ensure it works",
      content: (
        <div className="space-y-4">
          <p>ทดสอบ Web App ที่ Deploy แล้ว:</p>
          <div className="text-sm text-gray-600 space-y-2">
            <p>1. เปิด Web App URL ในเบราว์เซอร์ใหม่</p>
            <p>2. ควรเห็นข้อความ JSON แบบนี้:</p>
            <div className="bg-green-50 p-2 rounded font-mono text-xs">
              {`{"success":true,"message":"AMNESIA Commission API is working!"}`}
            </div>
            <p>3. ถ้าเห็นหน้า Google Sign-in แสดงว่าตั้งค่า Access ผิด</p>
            <p>4. ถ้าเห็น Error 404 แสดงว่า URL ผิดหรือยังไม่ได้ Deploy</p>
          </div>
          <div className="bg-green-50 p-3 rounded border border-green-200">
            <p className="text-sm font-semibold text-green-800">✅ สำเร็จ:</p>
            <p className="text-sm text-green-700">เมื่อเห็น JSON response แสดงว่า API พร้อมใช้งานแล้ว!</p>
          </div>
        </div>
      ),
    },
  ]

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">🚀 Google Apps Script Deployment Guide</CardTitle>
          <CardDescription>
            Step-by-step guide to properly deploy your Google Apps Script and fix CORS/Network errors
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Progress Indicator */}
          <div className="flex items-center justify-between mb-6">
            {steps.map((_, index) => (
              <div key={index} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                    completedSteps.includes(index)
                      ? "bg-green-500 text-white"
                      : currentStep === index
                        ? "bg-blue-500 text-white"
                        : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {completedSteps.includes(index) ? <CheckCircle className="w-4 h-4" /> : index + 1}
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-12 h-1 mx-2 ${completedSteps.includes(index) ? "bg-green-500" : "bg-gray-200"}`} />
                )}
              </div>
            ))}
          </div>

          {/* Current Step */}
          <Card className="border-2 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {steps[currentStep].icon}
                Step {currentStep + 1}: {steps[currentStep].title}
              </CardTitle>
              <CardDescription>{steps[currentStep].description}</CardDescription>
            </CardHeader>
            <CardContent>{steps[currentStep].content}</CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex justify-between mt-6">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
            >
              Previous
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => markStepComplete(currentStep)}
                disabled={completedSteps.includes(currentStep)}
              >
                {completedSteps.includes(currentStep) ? "✅ Completed" : "Mark Complete"}
              </Button>
              <Button
                onClick={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}
                disabled={currentStep === steps.length - 1}
              >
                Next
              </Button>
            </div>
          </div>

          {/* Completion Status */}
          {completedSteps.length === steps.length && (
            <Card className="bg-green-50 border-green-200 mt-6">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-6 h-6 text-green-500" />
                  <div>
                    <h3 className="font-semibold text-green-800">🎉 Deployment Complete!</h3>
                    <p className="text-sm text-green-700">
                      Your Google Apps Script is now properly deployed and should work without CORS errors.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Quick Reference */}
      <Card>
        <CardHeader>
          <CardTitle>📋 Quick Reference</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold mb-2">✅ Correct Settings:</h4>
              <ul className="text-sm space-y-1">
                <li>• Execute as: "Me"</li>
                <li>• Who has access: "Anyone"</li>
                <li>• Type: "Web app"</li>
                <li>• Both doGet() and doPost() functions exist</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">❌ Common Mistakes:</h4>
              <ul className="text-sm space-y-1">
                <li>• Using "Anyone with Google account"</li>
                <li>• Missing doGet() or doPost() functions</li>
                <li>• Not running setupSpreadsheet() first</li>
                <li>• Wrong deployment type (not Web app)</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
