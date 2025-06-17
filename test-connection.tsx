"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { CheckCircle, XCircle, Clock, Play, AlertTriangle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function TestConnection() {
  const [isLoading, setIsLoading] = useState(false)
  const [testResults, setTestResults] = useState<string>("")
  const [connectionStatus, setConnectionStatus] = useState<"idle" | "testing" | "success" | "error">("idle")
  const { toast } = useToast()

  const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbx1ycoCG7IHa5KPMzElhhPGWHUv8yLLX7nflMzqbywUyJfN8ZTrVqY_cHVEBcFKNaqt/exec"

  const addResult = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setTestResults(prev => prev + `[${timestamp}] ${message}\n`)
  }

  const testConnection = async () => {
    setIsLoading(true)
    setConnectionStatus("testing")
    setTestResults("")
    
    addResult("🚀 เริ่มทดสอบการเชื่อมต่อ...")
    addResult(`📡 URL: ${WEB_APP_URL}`)

    try {
      // Test 1: Basic GET request
      addResult("🔄 ทดสอบ GET request...")
      
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000)

      const response = await fetch(WEB_APP_URL, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        signal: controller.signal,
      })

      clearTimeout(timeoutId)
      
      addResult(`📥 Response Status: ${response.status}`)
      
      const responseText = await response.text()
      addResult(`📄 Response Text: ${responseText}`)

      if (response.ok) {
        if (responseText.includes("AMNESIA Commission API is working") || 
            responseText.includes("success") || 
            responseText.includes("API")) {
          setConnectionStatus("success")
          addResult("✅ การเชื่อมต่อสำเร็จ! API ทำงานปกติ")
          
          toast({
            title: "✅ เชื่อมต่อสำเร็จ!",
            description: "Google Apps Script API ทำงานปกติ",
          })
        } else {
          setConnectionStatus("error")
          addResult("⚠️ ได้รับ response แต่ไม่ใช่ข้อความที่คาดหวัง")
        }
      } else {
        setConnectionStatus("error")
        addResult(`❌ HTTP Error: ${response.status} ${response.statusText}`)
      }

    } catch (error: any) {
      setConnectionStatus("error")
      
      if (error.name === "AbortError") {
        addResult("❌ Request timeout (>15 วินาที)")
      } else if (error.message.includes("NetworkError") || error.message.includes("Failed to fetch")) {
        addResult("❌ Network Error - ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้")
      } else if (error.message.includes("CORS")) {
        addResult("❌ CORS Policy Error")
      } else {
        addResult(`❌ Error: ${error.message}`)
      }
      
      toast({
        title: "❌ การเชื่อมต่อล้มเหลว",
        description: "กรุณาตรวจสอบการตั้งค่า Google Apps Script",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const testLoadMonths = async () => {
    if (connectionStatus !== "success") {
      toast({
        title: "⚠️ คำเตือน",
        description: "กรุณาทดสอบการเชื่อมต่อพื้นฐานก่อน",
        variant: "destructive",
      })
      return
    }

    addResult("\n🔄 ทดสอบโหลดรายการเดือน...")
    
    try {
      const response = await fetch(`${WEB_APP_URL}?action=load`)
      const responseText = await response.text()
      
      addResult(`📥 Load Months Response: ${responseText}`)
      
      if (response.ok) {
        try {
          const data = JSON.parse(responseText)
          if (Array.isArray(data)) {
            addResult(`✅ พบ ${data.length} เดือน: ${data.join(", ")}`)
          } else {
            addResult("⚠️ Response ไม่ใช่ array")
          }
        } catch (parseError) {
          addResult(`❌ JSON Parse Error: ${parseError}`)
        }
      }
    } catch (error) {
      addResult(`❌ Load Months Error: ${error}`)
    }
  }

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case "success":
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case "error":
        return <XCircle className="w-5 h-5 text-red-500" />
      case "testing":
        return <Clock className="w-5 h-5 text-yellow-500 animate-spin" />
      default:
        return <AlertTriangle className="w-5 h-5 text-gray-500" />
    }
  }

  const getStatusBadge = () => {
    switch (connectionStatus) {
      case "success":
        return <Badge className="bg-green-500">✅ เชื่อมต่อแล้ว</Badge>
      case "error":
        return <Badge variant="destructive">❌ ผิดพลาด</Badge>
      case "testing":
        return <Badge variant="secondary">🔄 กำลังทดสอบ...</Badge>
      default:
        return <Badge variant="outline">⏳ ยังไม่ได้ทดสอบ</Badge>
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🧪 ทดสอบการเชื่อมต่อ Google Apps Script
          </CardTitle>
          <CardDescription>
            ทดสอบว่า URL ใหม่ของคุณทำงานหรือไม่
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* URL Display */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <h3 className="font-semibold text-blue-800">URL ที่กำลังทดสอบ:</h3>
                <code className="text-xs bg-white p-2 rounded border block break-all">
                  {WEB_APP_URL}
                </code>
              </div>
            </CardContent>
          </Card>

          {/* Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getStatusIcon()}
              <span className="font-semibold">สถานะ:</span>
              {getStatusBadge()}
            </div>
          </div>

          {/* Test Buttons */}
          <div className="flex gap-2">
            <Button onClick={testConnection} disabled={isLoading} className="flex items-center gap-2">
              <Play className="w-4 h-4" />
              {isLoading ? "กำลังทดสอบ..." : "ทดสอบการเชื่อมต่อ"}
            </Button>
            
            <Button 
              onClick={testLoadMonths} 
              disabled={isLoading || connectionStatus !== "success"}
              variant="outline"
            >
              ทดสอบโหลดเดือน
            </Button>
            
            <Button 
              onClick={() => setTestResults("")} 
              variant="outline"
            >
              ล้างผลลัพธ์
            </Button>
          </div>

          {/* Results */}
          {testResults && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">📋 ผลการทดสอบ</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={testResults}
                  readOnly
                  className="min-h-[300px] font-mono text-xs"
                  placeholder="ผลการทดสอบจะแสดงที่นี่..."
                />
              </CardContent>
            </Card>
          )}

          {/* Instructions */}
          <Card className="bg-yellow-50 border-yellow-200">
            <CardContent className="pt-6">
              <h4 className="font-semibold mb-2 text-yellow-800">📝 วิธีการใช้งาน:</h4>
              <ol className="text-sm space-y-1 list-decimal list-inside text-yellow-700">
                <li>คลิก "ทดสอบการเชื่อมต่อ" เพื่อตรวจสอบ API</li>
                <li>หากสำเร็จ จะแสดง "เชื่อมต่อแล้ว" สีเขียว</li>
                <li>ทดสอบ "โหลดเดือน" เพื่อดูว่าข้อมูลโหลดได้หรือไม่</li>
                <li>ดูผลลัพธ์ในกล่องข้อความด้านล่าง</li>
              </ol>
            </CardContent>
          </Card>

          {/* Success Message */}
          {connectionStatus === "success" && (
            <Card className="bg-green-50 border-green-200">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-6 h-6 text-green-500" />
                  <div>
                    <h3 className="font-semibold text-green-800">🎉 เชื่อมต่อสำเร็จ!</h3>
                    <p className="text-sm text-green-700">
                      Google Apps Script ของคุณทำงานปกติ พร้อมใช้งานแล้ว!
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  )
}