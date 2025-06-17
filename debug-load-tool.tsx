"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Play, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function DebugLoadTool() {
  const [webAppUrl, setWebAppUrl] = useState(
    "https://script.google.com/macros/s/AKfycbw7k9tkaJ0rGDWgK9IstGTfLXqZYSY6-aAMQ-wQIf3gVPfQ2W02W52QzNldebBnLbYV/exec",
  )
  const [testMonth, setTestMonth] = useState("January")
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<string>("")
  const { toast } = useToast()

  const testLoadAllMonths = async () => {
    setIsLoading(true)
    setResults("🔄 Testing load all months...\n")

    try {
      const response = await fetch(`${webAppUrl}?action=load`)
      const responseText = await response.text()

      setResults((prev) => prev + `\n📥 Response Status: ${response.status}\n`)
      setResults((prev) => prev + `📄 Response Text: ${responseText}\n`)

      if (response.ok) {
        try {
          const data = JSON.parse(responseText)
          setResults((prev) => prev + `✅ Parsed JSON: ${JSON.stringify(data, null, 2)}\n`)

          if (Array.isArray(data)) {
            setResults((prev) => prev + `📊 Found ${data.length} months: ${data.join(", ")}\n`)
          } else {
            setResults((prev) => prev + `⚠️ Response is not an array\n`)
          }
        } catch (parseError) {
          setResults((prev) => prev + `❌ JSON Parse Error: ${parseError}\n`)
        }
      } else {
        setResults((prev) => prev + `❌ HTTP Error: ${response.status} ${response.statusText}\n`)
      }
    } catch (error) {
      setResults((prev) => prev + `❌ Network Error: ${error}\n`)
    } finally {
      setIsLoading(false)
    }
  }

  const testLoadSpecificMonth = async () => {
    setIsLoading(true)
    setResults((prev) => prev + `\n🔄 Testing load specific month: ${testMonth}...\n`)

    try {
      const response = await fetch(`${webAppUrl}?action=load&month=${testMonth}`)
      const responseText = await response.text()

      setResults((prev) => prev + `📥 Response Status: ${response.status}\n`)
      setResults((prev) => prev + `📄 Response Text: ${responseText}\n`)

      if (response.ok) {
        try {
          const data = JSON.parse(responseText)
          setResults((prev) => prev + `✅ Parsed JSON: ${JSON.stringify(data, null, 2)}\n`)

          if (Array.isArray(data)) {
            setResults((prev) => prev + `📊 Found ${data.length} entries for ${testMonth}\n`)
          } else {
            setResults((prev) => prev + `⚠️ Response is not an array\n`)
          }
        } catch (parseError) {
          setResults((prev) => prev + `❌ JSON Parse Error: ${parseError}\n`)
        }
      } else {
        setResults((prev) => prev + `❌ HTTP Error: ${response.status} ${response.statusText}\n`)
      }
    } catch (error) {
      setResults((prev) => prev + `❌ Network Error: ${error}\n`)
    } finally {
      setIsLoading(false)
    }
  }

  const testBasicConnection = async () => {
    setIsLoading(true)
    setResults("🔄 Testing basic connection...\n")

    try {
      const response = await fetch(webAppUrl)
      const responseText = await response.text()

      setResults((prev) => prev + `📥 Response Status: ${response.status}\n`)
      setResults((prev) => prev + `📄 Response Text: ${responseText}\n`)

      if (response.ok && responseText.includes("AMNESIA Commission API is working")) {
        setResults((prev) => prev + `✅ API is working correctly!\n`)
      } else {
        setResults((prev) => prev + `⚠️ Unexpected response\n`)
      }
    } catch (error) {
      setResults((prev) => prev + `❌ Connection Error: ${error}\n`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">🔧 Debug Load Data Tool</CardTitle>
          <CardDescription>Test and debug the load data functionality</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* URL Input */}
          <div className="space-y-2">
            <Label htmlFor="webapp-url">Web App URL</Label>
            <Input id="webapp-url" value={webAppUrl} onChange={(e) => setWebAppUrl(e.target.value)} />
          </div>

          {/* Test Month Input */}
          <div className="space-y-2">
            <Label htmlFor="test-month">Test Month</Label>
            <Input
              id="test-month"
              value={testMonth}
              onChange={(e) => setTestMonth(e.target.value)}
              placeholder="January"
            />
          </div>

          {/* Test Buttons */}
          <div className="flex flex-wrap gap-2">
            <Button onClick={testBasicConnection} disabled={isLoading} variant="outline">
              <Play className="w-4 h-4 mr-2" />
              Test Basic Connection
            </Button>
            <Button onClick={testLoadAllMonths} disabled={isLoading}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Test Load All Months
            </Button>
            <Button onClick={testLoadSpecificMonth} disabled={isLoading}>
              <Play className="w-4 h-4 mr-2" />
              Test Load Specific Month
            </Button>
            <Button onClick={() => setResults("")} variant="outline">
              Clear Results
            </Button>
          </div>

          {/* Loading Status */}
          {isLoading && <Badge variant="secondary">🔄 Testing...</Badge>}

          {/* Results */}
          {results && (
            <div className="space-y-2">
              <Label>Test Results</Label>
              <Textarea value={results} readOnly className="min-h-[300px] font-mono text-xs" />
            </div>
          )}

          {/* Instructions */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <h4 className="font-semibold mb-2">🔍 How to Debug:</h4>
              <ol className="text-sm space-y-1 list-decimal list-inside">
                <li>First test "Basic Connection" - should show API working message</li>
                <li>Test "Load All Months" - should return array of available months</li>
                <li>Test "Load Specific Month" - should return data for that month</li>
                <li>Check the response format and any error messages</li>
              </ol>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  )
}
