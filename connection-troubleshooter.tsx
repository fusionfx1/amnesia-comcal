"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, XCircle, AlertTriangle, ExternalLink, Copy, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function ConnectionTroubleshooter() {
  const [webAppUrl, setWebAppUrl] = useState(
    "https://script.google.com/macros/s/AKfycbw7k9tkaJ0rGDWgK9IstGTfLXqZYSY6-aAMQ-wQIf3gVPfQ2W02W52QzNldebBnLbYV/exec",
  )
  const [testResult, setTestResult] = useState<{
    status: "idle" | "testing" | "success" | "error"
    message: string
    details?: string
    response?: string
  }>({ status: "idle", message: "" })
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied!",
      description: "URL copied to clipboard",
    })
  }

  const openInNewTab = (url: string) => {
    window.open(url, "_blank")
  }

  const testConnection = async () => {
    if (!webAppUrl.trim()) {
      toast({
        title: "Error",
        description: "Please enter a Web App URL",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    setTestResult({ status: "testing", message: "Testing connection..." })

    try {
      // Test with different approaches
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

      const response = await fetch(webAppUrl, {
        method: "GET",
        mode: "cors", // Explicitly set CORS mode
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json, text/plain, */*",
        },
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      const responseText = await response.text()

      if (response.ok) {
        setTestResult({
          status: "success",
          message: `✅ Connection successful! Status: ${response.status}`,
          details: `Response received in ${response.headers.get("content-length") || "unknown"} bytes`,
          response: responseText,
        })
      } else {
        setTestResult({
          status: "error",
          message: `❌ HTTP Error: ${response.status} ${response.statusText}`,
          details: "The server responded but with an error status",
          response: responseText,
        })
      }
    } catch (error: any) {
      let errorMessage = "❌ Connection failed"
      let errorDetails = ""

      if (error.name === "AbortError") {
        errorMessage = "❌ Request timeout (>10 seconds)"
        errorDetails = "The request took too long to complete. This might indicate server issues."
      } else if (error.message.includes("NetworkError")) {
        errorMessage = "❌ Network Error"
        errorDetails = "Cannot reach the server. This could be due to CORS policy, network issues, or incorrect URL."
      } else if (error.message.includes("CORS")) {
        errorMessage = "❌ CORS Policy Error"
        errorDetails = "The server is blocking cross-origin requests. Check Apps Script deployment settings."
      } else {
        errorMessage = `❌ ${error.name || "Unknown Error"}`
        errorDetails = error.message || "An unexpected error occurred"
      }

      setTestResult({
        status: "error",
        message: errorMessage,
        details: errorDetails,
        response: error.toString(),
      })
    } finally {
      setIsLoading(false)
    }
  }

  const testDirectAccess = () => {
    openInNewTab(webAppUrl)
    toast({
      title: "Opening in new tab",
      description: "Check if you can access the URL directly in your browser",
    })
  }

  const getStatusColor = () => {
    switch (testResult.status) {
      case "success":
        return "text-green-600"
      case "error":
        return "text-red-600"
      case "testing":
        return "text-yellow-600"
      default:
        return "text-gray-600"
    }
  }

  const getStatusIcon = () => {
    switch (testResult.status) {
      case "success":
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case "error":
        return <XCircle className="w-5 h-5 text-red-500" />
      case "testing":
        return <RefreshCw className="w-5 h-5 text-yellow-500 animate-spin" />
      default:
        return <AlertTriangle className="w-5 h-5 text-gray-500" />
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">🔧 Google Apps Script Connection Troubleshooter</CardTitle>
          <CardDescription>Diagnose and fix connection issues with your Google Apps Script Web App</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* URL Input and Test */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="webapp-url">Google Apps Script Web App URL</Label>
              <div className="flex gap-2">
                <Input
                  id="webapp-url"
                  value={webAppUrl}
                  onChange={(e) => setWebAppUrl(e.target.value)}
                  placeholder="https://script.google.com/macros/s/..."
                  className="flex-1"
                />
                <Button variant="outline" size="icon" onClick={() => copyToClipboard(webAppUrl)}>
                  <Copy className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => testDirectAccess()}>
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={testConnection} disabled={isLoading} className="flex items-center gap-2">
                <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
                {isLoading ? "Testing..." : "Test Connection"}
              </Button>
              <Button variant="outline" onClick={testDirectAccess}>
                <ExternalLink className="w-4 h-4 mr-2" />
                Open in Browser
              </Button>
            </div>
          </div>

          {/* Test Results */}
          {testResult.status !== "idle" && (
            <Card
              className={`border-2 ${
                testResult.status === "success"
                  ? "border-green-200 bg-green-50"
                  : testResult.status === "error"
                    ? "border-red-200 bg-red-50"
                    : "border-yellow-200 bg-yellow-50"
              }`}
            >
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  {getStatusIcon()}
                  <div className="flex-1 space-y-2">
                    <h3 className={`font-semibold ${getStatusColor()}`}>{testResult.message}</h3>
                    {testResult.details && <p className="text-sm text-gray-600">{testResult.details}</p>}
                    {testResult.response && (
                      <details className="text-xs">
                        <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
                          Show Server Response
                        </summary>
                        <pre className="mt-2 p-3 bg-white border rounded overflow-x-auto max-h-40">
                          {testResult.response}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step-by-step Fix Guide */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">🛠️ Step-by-Step Fix Guide</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>NetworkError</strong> usually means the Apps Script isn't properly deployed or accessible.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div className="border-l-4 border-blue-500 pl-4">
                  <h4 className="font-semibold text-blue-800">Step 1: Check Apps Script Deployment</h4>
                  <ol className="list-decimal list-inside text-sm space-y-1 mt-2">
                    <li>
                      Go to{" "}
                      <a
                        href="https://script.google.com"
                        target="_blank"
                        className="text-blue-600 underline"
                        rel="noreferrer"
                      >
                        script.google.com
                      </a>
                    </li>
                    <li>Open your "AMNESIA Commission Calculator API" project</li>
                    <li>
                      Click <strong>Deploy</strong> → <strong>Manage deployments</strong>
                    </li>
                    <li>Check if there's an active Web app deployment</li>
                  </ol>
                </div>

                <div className="border-l-4 border-green-500 pl-4">
                  <h4 className="font-semibold text-green-800">Step 2: Fix Access Settings</h4>
                  <ol className="list-decimal list-inside text-sm space-y-1 mt-2">
                    <li>
                      In deployment settings, set <strong>"Execute as"</strong> to <strong>"Me"</strong>
                    </li>
                    <li>
                      Set <strong>"Who has access"</strong> to <strong>"Anyone"</strong>
                    </li>
                    <li>
                      Click <strong>"Deploy"</strong> to update
                    </li>
                    <li>Copy the new Web App URL</li>
                  </ol>
                </div>

                <div className="border-l-4 border-orange-500 pl-4">
                  <h4 className="font-semibold text-orange-800">Step 3: Test Functions</h4>
                  <ol className="list-decimal list-inside text-sm space-y-1 mt-2">
                    <li>
                      In Apps Script editor, select <strong>"setupSpreadsheet"</strong> function
                    </li>
                    <li>
                      Click <strong>"Run"</strong> and authorize if needed
                    </li>
                    <li>Check execution log for any errors</li>
                    <li>Test the Web App URL again</li>
                  </ol>
                </div>

                <div className="border-l-4 border-purple-500 pl-4">
                  <h4 className="font-semibold text-purple-800">Step 4: Alternative Testing</h4>
                  <div className="text-sm space-y-2 mt-2">
                    <p>If the connection still fails, try these URLs manually in your browser:</p>
                    <div className="bg-gray-100 p-2 rounded font-mono text-xs break-all">{webAppUrl}</div>
                    <div className="bg-gray-100 p-2 rounded font-mono text-xs break-all">{webAppUrl}?action=load</div>
                    <p className="text-gray-600">You should see JSON data or a success message, not a sign-in page.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="bg-gray-50">
            <CardHeader>
              <CardTitle className="text-lg">⚡ Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                  variant="outline"
                  onClick={() => openInNewTab("https://script.google.com")}
                  className="justify-start"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open Google Apps Script
                </Button>
                <Button
                  variant="outline"
                  onClick={() =>
                    openInNewTab(
                      "https://docs.google.com/spreadsheets/d/1vfqb7BwLOJEL32CrtoUoOzkQF_p8vjvjVC0IwwbVJms/edit",
                    )
                  }
                  className="justify-start"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open Google Spreadsheet
                </Button>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  )
}
