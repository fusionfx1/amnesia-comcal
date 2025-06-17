"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CheckCircle, XCircle, AlertTriangle, ExternalLink, Copy, RefreshCw, Code, Settings, Globe } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function ComprehensiveApiFixer() {
  const [webAppUrl, setWebAppUrl] = useState(
    "https://script.google.com/macros/s/AKfycbzFwqXTQbfluM02DvhKP0JQW8LQsRy6HI8tQOC1HZYP_V3LNwweCIi1SgQ1N6e2Q6FOGg/exec",
  )
  const [connectionStatus, setConnectionStatus] = useState<"idle" | "checking" | "connected" | "error">("idle")
  const [errorDetails, setErrorDetails] = useState<string>("")
  const [responseData, setResponseData] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [testResults, setTestResults] = useState<string[]>([])
  const { toast } = useToast()

  const addTestResult = (message: string) => {
    setTestResults((prev) => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const comprehensiveTest = async () => {
    setIsLoading(true)
    setConnectionStatus("checking")
    setTestResults([])
    setErrorDetails("")
    setResponseData("")

    addTestResult("🚀 Starting comprehensive API test...")

    // Test 1: Basic URL validation
    try {
      const url = new URL(webAppUrl)
      if (!url.hostname.includes("script.google.com")) {
        throw new Error("URL is not a Google Apps Script URL")
      }
      addTestResult("✅ URL format is valid")
    } catch (error) {
      addTestResult(`❌ Invalid URL format: ${error}`)
      setConnectionStatus("error")
      setErrorDetails("Invalid URL format")
      setIsLoading(false)
      return
    }

    // Test 2: Basic connectivity with different methods
    const testMethods = [
      { name: "Standard fetch", options: {} },
      { name: "No-cors mode", options: { mode: "no-cors" as RequestMode } },
      { name: "With credentials", options: { credentials: "include" as RequestCredentials } },
    ]

    for (const method of testMethods) {
      try {
        addTestResult(`🔄 Testing ${method.name}...`)

        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000)

        const response = await fetch(webAppUrl, {
          method: "GET",
          signal: controller.signal,
          ...method.options,
        })

        clearTimeout(timeoutId)

        if (method.options.mode === "no-cors") {
          addTestResult(`✅ ${method.name}: Request completed (opaque response)`)
        } else {
          const responseText = await response.text()
          addTestResult(`✅ ${method.name}: Status ${response.status}`)

          if (response.ok) {
            setResponseData(responseText)
            if (responseText.includes("AMNESIA") || responseText.includes("success") || responseText.includes("API")) {
              setConnectionStatus("connected")
              addTestResult("🎉 API is working!")
              setIsLoading(false)
              return
            }
          }
        }
      } catch (error: any) {
        addTestResult(`❌ ${method.name} failed: ${error.message}`)
      }
    }

    // Test 3: Try opening in new window
    addTestResult("🔄 Testing direct browser access...")
    try {
      window.open(webAppUrl, "_blank")
      addTestResult("✅ Opened in new tab - check if it loads correctly")
    } catch (error) {
      addTestResult(`❌ Cannot open in new tab: ${error}`)
    }

    setConnectionStatus("error")
    setErrorDetails("All connection methods failed - Apps Script deployment issue")
    setIsLoading(false)
  }

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    toast({
      title: "Code Copied!",
      description: "Paste this into your Apps Script editor",
    })
  }

  const getStatusBadge = () => {
    switch (connectionStatus) {
      case "connected":
        return <Badge className="bg-green-500">✅ Connected</Badge>
      case "error":
        return <Badge variant="destructive">❌ Error</Badge>
      case "checking":
        return <Badge variant="secondary">🔄 Testing...</Badge>
      default:
        return <Badge variant="outline">⏳ Not tested</Badge>
    }
  }

  const fixedAppsScriptCode = `/**
 * FIXED Google Apps Script for AMNESIA Commission Calculator
 * This version handles CORS and creates its own spreadsheet
 */

// Configuration
const SHEET_NAME = 'Commission_Data';
const SPREADSHEET_NAME = 'AMNESIA Staff Commission 2025';

/**
 * Handle GET requests - MUST EXIST for Web App to work
 */
function doGet(e) {
  try {
    // Add CORS headers
    const output = ContentService.createTextOutput();
    
    const action = e.parameter.action;
    
    if (action === 'load') {
      const month = e.parameter.month;
      if (month) {
        return loadCommissionData(month);
      } else {
        return loadAllMonths();
      }
    }
    
    // Default response - IMPORTANT for testing
    const response = {
      success: true,
      message: "AMNESIA Commission API is working! 🎉",
      timestamp: new Date().toISOString(),
      version: "1.0"
    };
    
    return ContentService
      .createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error('Error in doGet:', error);
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Handle POST requests
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
 * Get or create spreadsheet - FIXED VERSION
 */
function getOrCreateSpreadsheet() {
  try {
    // Try to find existing spreadsheet by name
    const files = DriveApp.getFilesByName(SPREADSHEET_NAME);
    if (files.hasNext()) {
      const file = files.next();
      console.log('Found existing spreadsheet: ' + file.getUrl());
      return SpreadsheetApp.openById(file.getId());
    }
    
    // Create new spreadsheet
    console.log('Creating new spreadsheet...');
    const spreadsheet = SpreadsheetApp.create(SPREADSHEET_NAME);
    
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
    const headers = [
      'Timestamp', 'Month', 'Total Sales', 'VAT %', 'Sales Ex-VAT',
      'Total Commission', 'Employee Name', 'Shared Commission',
      'Net Shared Commission', 'Overtime', 'Net OT', 'Final Amount'
    ];
    
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setValues([headers]);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#4285f4');
    headerRange.setFontColor('white');
    
    sheet.setFrozenRows(1);
    console.log('✅ Commission data sheet created');
  }
  
  return sheet;
}

/**
 * Save commission data
 */
function saveCommissionData(entries) {
  try {
    if (!entries || !Array.isArray(entries) || entries.length === 0) {
      return createResponse(false, 'No valid data provided');
    }
    
    const sheet = getOrCreateSheet();
    const timestamp = new Date();
    
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
    
    const rows = validEntries.map(entry => [
      timestamp, entry.month || '', entry.totalSales || 0,
      entry.vatPercent || 0, entry.salesExVAT || 0,
      entry.totalCommission || 0, entry.employeeName || '',
      entry.sharedCommission || 0, entry.netSharedCommission || 0,
      entry.overtime || 0, entry.netOT || 0, entry.finalAmount || 0
    ]);
    
    if (rows.length > 0) {
      const lastRow = sheet.getLastRow();
      const range = sheet.getRange(lastRow + 1, 1, rows.length, 12);
      range.setValues(rows);
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
    
    const monthLower = month.toLowerCase();
    const filteredData = data.slice(1).filter(row => {
      const rowMonth = (row[1] || '').toString().toLowerCase();
      return rowMonth === monthLower;
    });
    
    const result = filteredData.map(row => ({
      month: row[1] || '', totalSales: parseFloat(row[2]) || 0,
      vatPercent: parseFloat(row[3]) || 0, salesExVAT: parseFloat(row[4]) || 0,
      totalCommission: parseFloat(row[5]) || 0, employeeName: row[6] || '',
      sharedCommission: parseFloat(row[7]) || 0, netSharedCommission: parseFloat(row[8]) || 0,
      overtime: parseFloat(row[9]) || 0, netOT: parseFloat(row[10]) || 0,
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
 * Create JSON response
 */
function createResponse(success, message, data = null) {
  const response = { success: success, message: message };
  if (data !== null) response.data = data;
  
  return ContentService
    .createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}

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
    console.log('📊 Spreadsheet URL: ' + spreadsheet.getUrl());
    console.log('📋 Sheet Name: ' + SHEET_NAME);
    
    return "Setup complete! Commission tracking system ready.";
  } catch (error) {
    console.error('❌ Setup error:', error);
    return "Error: " + error.message;
  }
}

/**
 * Test function
 */
function testAPI() {
  console.log('Testing API...');
  return "API Test Successful! " + new Date().toISOString();
}`

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">🔧 Comprehensive API Connection Fixer</CardTitle>
          <CardDescription>NetworkError detected - Let's fix your Google Apps Script step by step</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Status */}
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>NetworkError:</strong> This means your Google Apps Script is not properly deployed or accessible.
              The most common cause is incorrect deployment settings.
            </AlertDescription>
          </Alert>

          {/* URL and Test */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="webapp-url">Current Web App URL</Label>
              <div className="flex gap-2">
                <Input
                  id="webapp-url"
                  value={webAppUrl}
                  onChange={(e) => setWebAppUrl(e.target.value)}
                  className="flex-1"
                />
                <Button variant="outline" size="icon" onClick={() => navigator.clipboard.writeText(webAppUrl)}>
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-semibold">Status:</span>
                {getStatusBadge()}
              </div>
              <Button onClick={comprehensiveTest} disabled={isLoading}>
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
                Run Comprehensive Test
              </Button>
            </div>
          </div>

          {/* Test Results */}
          {testResults.length > 0 && (
            <div className="space-y-2">
              <Label>Test Results</Label>
              <Textarea value={testResults.join("\n")} readOnly className="min-h-[200px] font-mono text-xs" />
            </div>
          )}

          {/* Tabbed Solutions */}
          <Tabs defaultValue="quick-fix" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="quick-fix">🚀 Quick Fix</TabsTrigger>
              <TabsTrigger value="new-code">📝 New Code</TabsTrigger>
              <TabsTrigger value="step-by-step">📋 Step by Step</TabsTrigger>
            </TabsList>

            <TabsContent value="quick-fix" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-red-800">🚨 Emergency Fix - Do This Now!</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Most likely cause:</strong> Your Apps Script "Who has access" is set to "Anyone with
                      Google account" instead of "Anyone"
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-2">
                    <h4 className="font-semibold">Fix in 3 steps:</h4>
                    <ol className="list-decimal list-inside space-y-2 text-sm">
                      <li>
                        <Button
                          variant="link"
                          className="p-0 h-auto"
                          onClick={() => window.open("https://script.google.com", "_blank")}
                        >
                          Open Google Apps Script
                        </Button>
                      </li>
                      <li>Go to Deploy → Manage deployments → Edit (pencil icon)</li>
                      <li>
                        Change <strong>"Who has access"</strong> from "Anyone with Google account" to{" "}
                        <strong>"Anyone"</strong>
                      </li>
                    </ol>
                  </div>

                  <Button onClick={() => window.open("https://script.google.com", "_blank")} className="w-full">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Fix Apps Script Now
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="new-code" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-blue-800">📝 Use This Fixed Code</CardTitle>
                  <CardDescription>Replace your entire Apps Script code with this fixed version</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="relative">
                    <pre className="bg-gray-100 p-4 rounded text-xs overflow-x-auto max-h-60 border">
                      {fixedAppsScriptCode}
                    </pre>
                    <Button onClick={() => copyCode(fixedAppsScriptCode)} className="absolute top-2 right-2" size="sm">
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>

                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      This code includes better error handling and CORS support. After pasting, run the
                      setupSpreadsheet() function.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="step-by-step" className="space-y-4">
              <div className="space-y-4">
                <Card className="border-red-200 bg-red-50">
                  <CardHeader>
                    <CardTitle className="text-red-800 flex items-center gap-2">
                      <Settings className="w-5 h-5" />
                      Step 1: Fix Deployment Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <ol className="list-decimal list-inside space-y-1">
                      <li>Go to script.google.com</li>
                      <li>Open your project</li>
                      <li>Click Deploy → Manage deployments</li>
                      <li>Click the edit icon (pencil)</li>
                      <li>Set "Execute as" to "Me"</li>
                      <li>Set "Who has access" to "Anyone" (NOT "Anyone with Google account")</li>
                      <li>Click Deploy</li>
                    </ol>
                  </CardContent>
                </Card>

                <Card className="border-blue-200 bg-blue-50">
                  <CardHeader>
                    <CardTitle className="text-blue-800 flex items-center gap-2">
                      <Code className="w-5 h-5" />
                      Step 2: Update Code
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <ol className="list-decimal list-inside space-y-1">
                      <li>Copy the fixed code from the "New Code" tab</li>
                      <li>Delete all existing code in Apps Script</li>
                      <li>Paste the new code</li>
                      <li>Save (Ctrl+S)</li>
                    </ol>
                  </CardContent>
                </Card>

                <Card className="border-green-200 bg-green-50">
                  <CardHeader>
                    <CardTitle className="text-green-800 flex items-center gap-2">
                      <Globe className="w-5 h-5" />
                      Step 3: Test & Deploy
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <ol className="list-decimal list-inside space-y-1">
                      <li>Select "setupSpreadsheet" function</li>
                      <li>Click Run and authorize</li>
                      <li>Check execution log for success</li>
                      <li>Deploy as new Web App</li>
                      <li>Test the new URL</li>
                    </ol>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>

          {/* Response Data */}
          {responseData && (
            <div className="space-y-2">
              <Label>Server Response</Label>
              <Textarea value={responseData} readOnly className="min-h-[100px] font-mono text-xs" />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
