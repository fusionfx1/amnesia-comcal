"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { CheckCircle, XCircle, AlertTriangle, ExternalLink, Copy, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function ApiConnectionFixer() {
  const [webAppUrl, setWebAppUrl] = useState(
    "https://script.google.com/macros/s/AKfycbw7k9tkaJ0rGDWgK9IstGTfLXqZYSY6-aAMQ-wQIf3gVPfQ2W02W52QzNldebBnLbYV/exec",
  )
  const [connectionStatus, setConnectionStatus] = useState<"idle" | "checking" | "connected" | "error">("idle")
  const [errorDetails, setErrorDetails] = useState<string>("")
  const [responseData, setResponseData] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (webAppUrl) {
      testConnection()
    }
  }, [webAppUrl])

  const testConnection = async () => {
    if (!webAppUrl.trim()) return

    setConnectionStatus("checking")
    setErrorDetails("")
    setResponseData("")
    setIsLoading(true)

    try {
      console.log("Testing connection to:", webAppUrl)

      // Test with different approaches
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 second timeout

      const response = await fetch(webAppUrl, {
        method: "GET",
        mode: "cors",
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json",
        },
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      const responseText = await response.text()
      setResponseData(responseText)

      console.log("Response status:", response.status)
      console.log("Response text:", responseText)

      if (response.ok) {
        if (
          responseText.includes("AMNESIA Commission API is working") ||
          responseText.includes("success") ||
          responseText.includes("API is working")
        ) {
          setConnectionStatus("connected")
          toast({
            title: "✅ Connection Successful",
            description: "API is working properly!",
          })
        } else {
          setConnectionStatus("error")
          setErrorDetails(`Unexpected response: ${responseText.substring(0, 200)}...`)
        }
      } else {
        setConnectionStatus("error")
        setErrorDetails(`HTTP ${response.status}: ${response.statusText}\nResponse: ${responseText}`)
      }
    } catch (error: any) {
      console.error("Connection error:", error)
      setConnectionStatus("error")

      let errorMessage = "Connection failed"
      if (error.name === "AbortError") {
        errorMessage = "Request timeout (>15 seconds)"
      } else if (error.message.includes("NetworkError") || error.message.includes("Failed to fetch")) {
        errorMessage = "Network error - Cannot reach the server"
      } else if (error.message.includes("CORS")) {
        errorMessage = "CORS policy error"
      } else {
        errorMessage = error.message || "Unknown error"
      }

      setErrorDetails(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const testDirectAccess = () => {
    window.open(webAppUrl, "_blank")
    toast({
      title: "Opening in new tab",
      description: "Check if you can access the URL directly",
    })
  }

  const copyUrl = () => {
    navigator.clipboard.writeText(webAppUrl)
    toast({
      title: "URL Copied",
      description: "Web App URL copied to clipboard",
    })
  }

  const getStatusBadge = () => {
    switch (connectionStatus) {
      case "connected":
        return <Badge className="bg-green-500">✅ Connected</Badge>
      case "error":
        return <Badge variant="destructive">❌ Error</Badge>
      case "checking":
        return <Badge variant="secondary">🔄 Checking...</Badge>
      default:
        return <Badge variant="outline">⏳ Not tested</Badge>
    }
  }

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case "connected":
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case "error":
        return <XCircle className="w-5 h-5 text-red-500" />
      case "checking":
        return <RefreshCw className="w-5 h-5 text-yellow-500 animate-spin" />
      default:
        return <AlertTriangle className="w-5 h-5 text-gray-500" />
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">🔧 API Connection Fixer</CardTitle>
          <CardDescription>Diagnose and fix Google Apps Script connection issues</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* URL Input and Status */}
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
                <Button variant="outline" size="icon" onClick={copyUrl}>
                  <Copy className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={testDirectAccess}>
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getStatusIcon()}
                <span className="font-semibold">Connection Status:</span>
                {getStatusBadge()}
              </div>
              <Button onClick={testConnection} disabled={isLoading}>
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
                Test Connection
              </Button>
            </div>
          </div>

          {/* Error Details */}
          {connectionStatus === "error" && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Connection Error:</strong> {errorDetails}
              </AlertDescription>
            </Alert>
          )}

          {/* Response Data */}
          {responseData && (
            <div className="space-y-2">
              <Label>Server Response</Label>
              <Textarea
                value={responseData}
                readOnly
                className="min-h-[100px] font-mono text-xs"
                placeholder="Server response will appear here..."
              />
            </div>
          )}

          {/* Step-by-step Fix Guide */}
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="text-orange-800">🛠️ Step-by-Step Fix Guide</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="border-l-4 border-red-500 pl-4">
                  <h4 className="font-semibold text-red-800">Step 1: Check Apps Script Deployment</h4>
                  <ol className="list-decimal list-inside text-sm space-y-1 mt-2">
                    <li>
                      Go to{" "}
                      <Button
                        variant="link"
                        className="p-0 h-auto text-red-600"
                        onClick={() => window.open("https://script.google.com", "_blank")}
                      >
                        script.google.com
                      </Button>
                    </li>
                    <li>Open your "AMNESIA Commission API" project</li>
                    <li>
                      Click <strong>Deploy</strong> → <strong>Manage deployments</strong>
                    </li>
                    <li>Check if there's an active Web app deployment</li>
                  </ol>
                </div>

                <div className="border-l-4 border-yellow-500 pl-4">
                  <h4 className="font-semibold text-yellow-800">Step 2: Fix Access Settings</h4>
                  <ol className="list-decimal list-inside text-sm space-y-1 mt-2">
                    <li>
                      In deployment settings, set <strong>"Execute as"</strong> to <strong>"Me"</strong>
                    </li>
                    <li>
                      Set <strong>"Who has access"</strong> to <strong>"Anyone"</strong> (not "Anyone with Google
                      account")
                    </li>
                    <li>
                      Click <strong>"Deploy"</strong> to update
                    </li>
                    <li>Copy the new Web App URL</li>
                  </ol>
                </div>

                <div className="border-l-4 border-blue-500 pl-4">
                  <h4 className="font-semibold text-blue-800">Step 3: Run Setup Function</h4>
                  <ol className="list-decimal list-inside text-sm space-y-1 mt-2">
                    <li>
                      In Apps Script editor, select <strong>"setupSpreadsheet"</strong> function
                    </li>
                    <li>
                      Click <strong>"Run"</strong> and authorize if needed
                    </li>
                    <li>Check execution log for success message</li>
                    <li>Test the Web App URL again</li>
                  </ol>
                </div>

                <div className="border-l-4 border-green-500 pl-4">
                  <h4 className="font-semibold text-green-800">Step 4: Verify Response</h4>
                  <div className="text-sm space-y-2 mt-2">
                    <p>When working correctly, you should see:</p>
                    <div className="bg-green-100 p-2 rounded font-mono text-xs">
                      {`{"success":true,"message":"AMNESIA Commission API is working! 🎉"}`}
                    </div>
                    <p className="text-gray-600">If you see a Google Sign-in page, the access settings are wrong.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>⚡ Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                  variant="outline"
                  onClick={() => window.open("https://script.google.com", "_blank")}
                  className="justify-start"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open Google Apps Script
                </Button>
                <Button variant="outline" onClick={testDirectAccess} className="justify-start">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Test URL in Browser
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Common Error Solutions */}
          <Card className="bg-gray-50">
            <CardHeader>
              <CardTitle>🔍 Common Error Solutions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <strong>❌ "Failed to fetch" / "NetworkError":</strong>
                <ul className="list-disc list-inside ml-4 mt-1">
                  <li>Apps Script not deployed as Web App</li>
                  <li>Wrong "Who has access" setting (should be "Anyone")</li>
                  <li>URL is incorrect or expired</li>
                </ul>
              </div>
              <div>
                <strong>🔐 Google Sign-in page appears:</strong>
                <ul className="list-disc list-inside ml-4 mt-1">
                  <li>Change "Who has access" to "Anyone" (not "Anyone with Google account")</li>
                  <li>Redeploy the Web App</li>
                </ul>
              </div>
              <div>
                <strong>⏱️ Request timeout:</strong>
                <ul className="list-disc list-inside ml-4 mt-1">
                  <li>Apps Script function is taking too long</li>
                  <li>Check for infinite loops in the code</li>
                  <li>Run setupSpreadsheet() function first</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  )
}
