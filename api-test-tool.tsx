"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { CheckCircle, XCircle, Clock, Play, Database } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface TestResult {
  test: string
  status: "pending" | "success" | "error"
  message: string
  data?: any
  duration?: number
}

export default function ApiTestTool() {
  const [isLoading, setIsLoading] = useState(false)
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [rawResponse, setRawResponse] = useState("")
  const { toast } = useToast()

  const WEB_APP_URL =
    "https://script.google.com/macros/s/AKfycbzFwqXTQbfluM02DvhKP0JQW8LQsRy6HI8tQOC1HZYP_V3LNwweCIi1SgQ1N6e2Q6FOGg/exec"

  const updateTestResult = (
    testName: string,
    status: "pending" | "success" | "error",
    message: string,
    data?: any,
    duration?: number,
  ) => {
    setTestResults((prev) => {
      const existing = prev.find((r) => r.test === testName)
      const newResult = { test: testName, status, message, data, duration }

      if (existing) {
        return prev.map((r) => (r.test === testName ? newResult : r))
      } else {
        return [...prev, newResult]
      }
    })
  }

  const testBasicConnection = async () => {
    const startTime = Date.now()
    updateTestResult("Basic Connection", "pending", "Testing basic connectivity...")

    try {
      const response = await fetch(WEB_APP_URL, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const duration = Date.now() - startTime
      const responseText = await response.text()
      setRawResponse((prev) => prev + `\n=== Basic Connection Response ===\n${responseText}\n`)

      if (response.ok) {
        updateTestResult(
          "Basic Connection",
          "success",
          `Connected successfully (${duration}ms)`,
          responseText,
          duration,
        )
        return true
      } else {
        updateTestResult(
          "Basic Connection",
          "error",
          `HTTP ${response.status}: ${response.statusText}`,
          responseText,
          duration,
        )
        return false
      }
    } catch (error) {
      const duration = Date.now() - startTime
      updateTestResult("Basic Connection", "error", `Network error: ${error}`, null, duration)
      return false
    }
  }

  const testLoadMonths = async () => {
    const startTime = Date.now()
    updateTestResult("Load Months", "pending", "Testing load months endpoint...")

    try {
      const response = await fetch(`${WEB_APP_URL}?action=load`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const duration = Date.now() - startTime
      const responseText = await response.text()
      setRawResponse((prev) => prev + `\n=== Load Months Response ===\n${responseText}\n`)

      if (response.ok) {
        try {
          const data = JSON.parse(responseText)
          updateTestResult(
            "Load Months",
            "success",
            `Loaded ${Array.isArray(data) ? data.length : 0} months (${duration}ms)`,
            data,
            duration,
          )
          return true
        } catch (parseError) {
          updateTestResult("Load Months", "error", `Invalid JSON response: ${parseError}`, responseText, duration)
          return false
        }
      } else {
        updateTestResult(
          "Load Months",
          "error",
          `HTTP ${response.status}: ${response.statusText}`,
          responseText,
          duration,
        )
        return false
      }
    } catch (error) {
      const duration = Date.now() - startTime
      updateTestResult("Load Months", "error", `Network error: ${error}`, null, duration)
      return false
    }
  }

  const testSaveData = async () => {
    const startTime = Date.now()
    updateTestResult("Save Data", "pending", "Testing save data endpoint...")

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
        finalAmount: 4055.27,
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
        finalAmount: 3570.27,
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
        finalAmount: 3085.27,
      },
    ]

    try {
      const response = await fetch(WEB_APP_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "save",
          data: testData,
        }),
      })

      const duration = Date.now() - startTime
      const responseText = await response.text()
      setRawResponse((prev) => prev + `\n=== Save Data Response ===\n${responseText}\n`)

      if (response.ok) {
        try {
          const data = JSON.parse(responseText)
          updateTestResult("Save Data", "success", `Data saved successfully (${duration}ms)`, data, duration)
          return true
        } catch (parseError) {
          updateTestResult("Save Data", "error", `Invalid JSON response: ${parseError}`, responseText, duration)
          return false
        }
      } else {
        updateTestResult(
          "Save Data",
          "error",
          `HTTP ${response.status}: ${response.statusText}`,
          responseText,
          duration,
        )
        return false
      }
    } catch (error) {
      const duration = Date.now() - startTime
      updateTestResult("Save Data", "error", `Network error: ${error}`, null, duration)
      return false
    }
  }

  const testLoadSpecificMonth = async () => {
    const startTime = Date.now()
    updateTestResult("Load Specific Month", "pending", "Testing load specific month...")

    try {
      const response = await fetch(`${WEB_APP_URL}?action=load&month=TestMonth`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const duration = Date.now() - startTime
      const responseText = await response.text()
      setRawResponse((prev) => prev + `\n=== Load TestMonth Response ===\n${responseText}\n`)

      if (response.ok) {
        try {
          const data = JSON.parse(responseText)
          updateTestResult("Load Specific Month", "success", `Loaded TestMonth data (${duration}ms)`, data, duration)
          return true
        } catch (parseError) {
          updateTestResult(
            "Load Specific Month",
            "error",
            `Invalid JSON response: ${parseError}`,
            responseText,
            duration,
          )
          return false
        }
      } else {
        updateTestResult(
          "Load Specific Month",
          "error",
          `HTTP ${response.status}: ${response.statusText}`,
          responseText,
          duration,
        )
        return false
      }
    } catch (error) {
      const duration = Date.now() - startTime
      updateTestResult("Load Specific Month", "error", `Network error: ${error}`, null, duration)
      return false
    }
  }

  const runAllTests = async () => {
    setIsLoading(true)
    setTestResults([])
    setRawResponse("")

    toast({
      title: "Starting API Tests",
      description: "Testing connection to Google Apps Script...",
    })

    // Test 1: Basic Connection
    const basicOk = await testBasicConnection()
    await new Promise((resolve) => setTimeout(resolve, 1000))

    if (basicOk) {
      // Test 2: Load Months
      await testLoadMonths()
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Test 3: Save Data
      const saveOk = await testSaveData()
      await new Promise((resolve) => setTimeout(resolve, 1000))

      if (saveOk) {
        // Test 4: Load Specific Month
        await testLoadSpecificMonth()
      }
    }

    setIsLoading(false)

    const successCount = testResults.filter((r) => r.status === "success").length
    const totalTests = testResults.length

    toast({
      title: "Tests Completed",
      description: `${successCount}/${totalTests} tests passed`,
      variant: successCount === totalTests ? "default" : "destructive",
    })
  }

  const getStatusIcon = (status: "pending" | "success" | "error") => {
    switch (status) {
      case "pending":
        return <Clock className="w-4 h-4 text-yellow-500 animate-spin" />
      case "success":
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case "error":
        return <XCircle className="w-4 h-4 text-red-500" />
    }
  }

  const getStatusBadge = (status: "pending" | "success" | "error") => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary">Running...</Badge>
      case "success":
        return (
          <Badge variant="default" className="bg-green-500">
            Success
          </Badge>
        )
      case "error":
        return <Badge variant="destructive">Failed</Badge>
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-6 h-6" />🧪 Google Apps Script API Test Tool
          </CardTitle>
          <CardDescription>
            Test connection and functionality with your AMNESIA Commission Calculator API
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* API URL Display */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <h3 className="font-semibold text-blue-800">Testing Web App URL:</h3>
                <code className="text-sm bg-white p-2 rounded border block break-all">{WEB_APP_URL}</code>
              </div>
            </CardContent>
          </Card>

          {/* Test Button */}
          <div className="flex gap-2">
            <Button onClick={runAllTests} disabled={isLoading} className="flex items-center gap-2">
              <Play className="w-4 h-4" />
              {isLoading ? "Running Tests..." : "Run All Tests"}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setTestResults([])
                setRawResponse("")
              }}
            >
              Clear Results
            </Button>
          </div>

          {/* Test Results */}
          {testResults.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">📊 Test Results</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {testResults.map((result, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                    <div className="mt-1">{getStatusIcon(result.status)}</div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold">{result.test}</h4>
                        <div className="flex items-center gap-2">
                          {result.duration && <span className="text-xs text-gray-500">{result.duration}ms</span>}
                          {getStatusBadge(result.status)}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600">{result.message}</p>
                      {result.data && (
                        <details className="text-xs">
                          <summary className="cursor-pointer text-blue-600">Show Response Data</summary>
                          <pre className="mt-2 p-2 bg-gray-100 rounded overflow-x-auto">
                            {typeof result.data === "string" ? result.data : JSON.stringify(result.data, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Raw Response Log */}
          {rawResponse && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">📝 Raw Response Log</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={rawResponse}
                  readOnly
                  className="min-h-[300px] font-mono text-xs"
                  placeholder="Raw API responses will appear here..."
                />
              </CardContent>
            </Card>
          )}

          {/* Troubleshooting Guide */}
          <Card className="bg-yellow-50 border-yellow-200">
            <CardHeader>
              <CardTitle className="text-lg text-yellow-800">🔧 Troubleshooting Guide</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-yellow-700">
              <div>
                <strong>❌ If Basic Connection fails:</strong>
                <ul className="list-disc list-inside ml-4 mt-1">
                  <li>Check if Web App URL is correct</li>
                  <li>Verify Apps Script is deployed as Web App</li>
                  <li>Check "Who has access" setting in deployment</li>
                </ul>
              </div>
              <div>
                <strong>🔐 If you see Google Sign-in page:</strong>
                <ul className="list-disc list-inside ml-4 mt-1">
                  <li>Change "Who has access" to "Anyone" in Apps Script</li>
                  <li>Or sign in with the Google account that owns the script</li>
                </ul>
              </div>
              <div>
                <strong>📝 If Save/Load fails:</strong>
                <ul className="list-disc list-inside ml-4 mt-1">
                  <li>Check if doPost() and doGet() functions exist in Apps Script</li>
                  <li>Verify the script has permission to access Google Sheets</li>
                  <li>Run setupSpreadsheet() function in Apps Script</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  )
}
