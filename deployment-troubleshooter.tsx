"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CheckCircle, XCircle, AlertTriangle, ExternalLink, Copy, RefreshCw, Settings, Globe, Code } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function DeploymentTroubleshooter() {
  const [webAppUrl, setWebAppUrl] = useState(
    "https://script.google.com/macros/s/AKfycbx1ycoCG7IHa5KPMzElhhPGWHUv8yLLX7nflMzqbywUyJfN8ZTrVqY_cHVEBcFKNaqt/exec"
  )
  const [testResults, setTestResults] = useState<string>("")
  const [connectionStatus, setConnectionStatus] = useState<"idle" | "testing" | "success" | "error">("idle")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const addResult = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setTestResults(prev => prev + `[${timestamp}] ${message}\n`)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied!",
      description: "Text copied to clipboard",
    })
  }

  const comprehensiveTest = async () => {
    setIsLoading(true)
    setConnectionStatus("testing")
    setTestResults("")
    
    addResult("🚀 เริ่มการทดสอบแบบครอบคลุม...")
    addResult(`📡 URL: ${webAppUrl}`)

    // Test 1: URL Validation
    try {
      const url = new URL(webAppUrl)
      if (!url.hostname.includes("script.google.com")) {
        throw new Error("URL ไม่ใช่ Google Apps Script URL")
      }
      addResult("✅ รูปแบบ URL ถูกต้อง")
    } catch (error) {
      addResult(`❌ รูปแบบ URL ผิด: ${error}`)
      setConnectionStatus("error")
      setIsLoading(false)
      return
    }

    // Test 2: Basic Connectivity
    try {
      addResult("🔄 ทดสอบการเชื่อมต่อพื้นฐาน...")
      
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000)

      const response = await fetch(webAppUrl, {
        method: "GET",
        signal: controller.signal,
        mode: 'cors',
        headers: {
          'Accept': 'application/json, text/plain, */*',
          'Content-Type': 'application/json',
        },
        credentials: 'omit'
      })

      clearTimeout(timeoutId)
      
      addResult(`📥 Response Status: ${response.status}`)
      
      const responseText = await response.text()
      addResult(`📄 Response Preview: ${responseText.substring(0, 200)}...`)

      if (response.ok) {
        if (responseText.includes("AMNESIA Commission API is working") || 
            responseText.includes("success") || 
            responseText.includes("API")) {
          setConnectionStatus("success")
          addResult("✅ การเชื่อมต่อสำเร็จ! API ทำงานปกติ")
          
          // Test 3: Load Months
          await testLoadMonths()
          
          // Test 4: Test Save (if connection is good)
          await testSaveFunction()
          
        } else {
          setConnectionStatus("error")
          addResult("⚠️ ได้รับ response แต่ไม่ใช่ข้อความที่คาดหวัง")
          addResult("🔧 อาจเป็นปัญหาการตั้งค่า deployment")
        }
      } else {
        setConnectionStatus("error")
        addResult(`❌ HTTP Error: ${response.status} ${response.statusText}`)
        
        if (response.status === 403) {
          addResult("🔧 Error 403: ปัญหาการอนุญาต - ตรวจสอบ 'Who has access' setting")
        } else if (response.status === 404) {
          addResult("🔧 Error 404: ไม่พบ Web App - ตรวจสอบ URL หรือ deployment")
        }
      }

    } catch (error: any) {
      setConnectionStatus("error")
      
      if (error.name === "AbortError") {
        addResult("❌ Request timeout (>15 วินาที)")
        addResult("🔧 อาจเป็นปัญหา: Script ทำงานช้า หรือ infinite loop")
      } else if (error.message.includes("Failed to fetch")) {
        addResult("❌ Network Error - ไม่สามารถเชื่อมต่อได้")
        addResult("🔧 สาเหตุที่เป็นไปได้:")
        addResult("   1. Apps Script ไม่ได้ deploy เป็น Web App")
        addResult("   2. URL ผิดหรือหมดอายุ")
        addResult("   3. การตั้งค่า 'Who has access' ผิด")
        addResult("   4. CORS policy ปัญหา")
      } else {
        addResult(`❌ Error: ${error.message}`)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const testLoadMonths = async () => {
    try {
      addResult("\n🔄 ทดสอบโหลดรายการเดือน...")
      
      const response = await fetch(`${webAppUrl}?action=load`, {
        method: 'GET',
        mode: 'cors',
        headers: {
          'Accept': 'application/json, text/plain, */*',
          'Content-Type': 'application/json',
        },
        credentials: 'omit'
      })
      
      const responseText = await response.text()
      addResult(`📥 Load Response: ${responseText.substring(0, 200)}...`)
      
      if (response.ok) {
        try {
          const data = JSON.parse(responseText)
          if (Array.isArray(data)) {
            addResult(`✅ โหลดเดือนสำเร็จ: พบ ${data.length} เดือน`)
          } else {
            addResult("⚠️ Response ไม่ใช่ array - อาจเป็น error response")
          }
        } catch (parseError) {
          addResult(`❌ JSON Parse Error: ${parseError}`)
        }
      } else {
        addResult(`❌ Load Months Error: ${response.status}`)
      }
    } catch (error) {
      addResult(`❌ Load Months Network Error: ${error}`)
    }
  }

  const testSaveFunction = async () => {
    try {
      addResult("\n🔄 ทดสอบฟังก์ชัน Save...")
      
      const testData = {
        action: "save",
        data: [
          {
            month: "TestMonth",
            totalSales: 10000,
            vatPercent: 7,
            salesExVAT: 9345.79,
            totalCommission: 654.21,
            sharedCommission: 218.07,
            netSharedCommission: 211.53,
            employeeName: "Ting",
            overtime: 1000,
            netOT: 970,
            finalAmount: 1181.53
          }
        ]
      }
      
      const response = await fetch(webAppUrl, {
        method: "POST",
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json, text/plain, */*',
        },
        credentials: 'omit',
        body: JSON.stringify(testData)
      })
      
      const responseText = await response.text()
      addResult(`📥 Save Response: ${responseText.substring(0, 200)}...`)
      
      if (response.ok) {
        try {
          const data = JSON.parse(responseText)
          if (data.success) {
            addResult("✅ ทดสอบ Save สำเร็จ!")
          } else {
            addResult(`⚠️ Save ไม่สำเร็จ: ${data.message}`)
          }
        } catch (parseError) {
          addResult(`❌ Save JSON Parse Error: ${parseError}`)
        }
      } else {
        addResult(`❌ Save Error: ${response.status}`)
      }
    } catch (error) {
      addResult(`❌ Save Network Error: ${error}`)
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

  const getStatusIcon = () => {
    switch (connectionStatus) {
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
          <CardTitle className="flex items-center gap-2">
            🔧 Google Apps Script Deployment Troubleshooter
          </CardTitle>
          <CardDescription>
            เครื่องมือแก้ไขปัญหาการ deploy และเชื่อมต่อ Google Apps Script
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Current Error Alert */}
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>ปัญหาปัจจุบัน:</strong> "Connection failed. Please check the deployment settings in Google Apps Script."
              <br />
              <strong>สาเหตุที่เป็นไปได้:</strong> การตั้งค่า deployment ไม่ถูกต้อง หรือ URL หมดอายุ
            </AlertDescription>
          </Alert>

          {/* URL Input and Status */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="webapp-url">Google Apps Script Web App URL</Label>
              <div className="flex gap-2">
                <Input
                  id="webapp-url"
                  value={webAppUrl}
                  onChange={(e) => setWebAppUrl(e.target.value)}
                  className="flex-1"
                  placeholder="https://script.google.com/macros/s/..."
                />
                <Button variant="outline" size="icon" onClick={() => copyToClipboard(webAppUrl)}>
                  <Copy className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => window.open(webAppUrl, "_blank")}>
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getStatusIcon()}
                <span className="font-semibold">สถานะ:</span>
                {getStatusBadge()}
              </div>
              <Button onClick={comprehensiveTest} disabled={isLoading}>
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
                ทดสอบแบบครอบคลุม
              </Button>
            </div>
          </div>

          {/* Test Results */}
          {testResults && (
            <div className="space-y-2">
              <Label>ผลการทดสอบ</Label>
              <Textarea
                value={testResults}
                readOnly
                className="min-h-[300px] font-mono text-xs"
                placeholder="ผลการทดสอบจะแสดงที่นี่..."
              />
            </div>
          )}

          {/* Step-by-step Fix Guide */}
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="text-orange-800">🛠️ คู่มือแก้ไขทีละขั้นตอน</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              
              <div className="border-l-4 border-red-500 pl-4">
                <h4 className="font-semibold text-red-800 flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  ขั้นตอนที่ 1: ตรวจสอบ Apps Script Deployment
                </h4>
                <ol className="list-decimal list-inside text-sm space-y-1 mt-2">
                  <li>
                    ไปที่{" "}
                    <Button
                      variant="link"
                      className="p-0 h-auto text-red-600"
                      onClick={() => window.open("https://script.google.com", "_blank")}
                    >
                      script.google.com
                    </Button>
                  </li>
                  <li>เปิดโปรเจกต์ "AMNESIA Commission API"</li>
                  <li>คลิก <strong>Deploy</strong> → <strong>Manage deployments</strong></li>
                  <li>ตรวจสอบว่ามี Web app deployment ที่ active อยู่หรือไม่</li>
                </ol>
              </div>

              <div className="border-l-4 border-yellow-500 pl-4">
                <h4 className="font-semibold text-yellow-800 flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  ขั้นตอนที่ 2: แก้ไขการตั้งค่า Access
                </h4>
                <ol className="list-decimal list-inside text-sm space-y-1 mt-2">
                  <li>ในการตั้งค่า deployment ให้ตั้ง <strong>"Execute as"</strong> เป็น <strong>"Me"</strong></li>
                  <li>ตั้ง <strong>"Who has access"</strong> เป็น <strong>"Anyone"</strong> (ไม่ใช่ "Anyone with Google account")</li>
                  <li>คลิก <strong>"Deploy"</strong> เพื่ออัปเดต</li>
                  <li>คัดลอก Web App URL ใหม่</li>
                </ol>
              </div>

              <div className="border-l-4 border-blue-500 pl-4">
                <h4 className="font-semibold text-blue-800 flex items-center gap-2">
                  <Code className="w-5 h-5" />
                  ขั้นตอนที่ 3: รัน Setup Function
                </h4>
                <ol className="list-decimal list-inside text-sm space-y-1 mt-2">
                  <li>ใน Apps Script editor เลือก function <strong>"setupSpreadsheet"</strong></li>
                  <li>คลิก <strong>"Run"</strong> และอนุญาตหากจำเป็น</li>
                  <li>ตรวจสอบ execution log เพื่อดูข้อความสำเร็จ</li>
                  <li>ทดสอบ Web App URL อีกครั้ง</li>
                </ol>
              </div>

              <div className="border-l-4 border-green-500 pl-4">
                <h4 className="font-semibold text-green-800 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  ขั้นตอนที่ 4: ตรวจสอบ Response
                </h4>
                <div className="text-sm space-y-2 mt-2">
                  <p>เมื่อทำงานถูกต้อง คุณควรเห็น:</p>
                  <div className="bg-green-100 p-2 rounded font-mono text-xs">
                    {`{"success":true,"message":"AMNESIA Commission API is working! 🎉"}`}
                  </div>
                  <p className="text-gray-600">หากเห็นหน้า Google Sign-in แสดงว่าการตั้งค่า access ผิด</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>⚡ การดำเนินการด่วน</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                  variant="outline"
                  onClick={() => window.open("https://script.google.com", "_blank")}
                  className="justify-start"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  เปิด Google Apps Script
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => window.open(webAppUrl, "_blank")} 
                  className="justify-start"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  ทดสอบ URL ในเบราว์เซอร์
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Common Error Solutions */}
          <Card className="bg-gray-50">
            <CardHeader>
              <CardTitle>🔍 วิธีแก้ปัญหาที่พบบ่อย</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <strong>❌ "Failed to fetch" / "NetworkError":</strong>
                <ul className="list-disc list-inside ml-4 mt-1">
                  <li>Apps Script ไม่ได้ deploy เป็น Web App</li>
                  <li>การตั้งค่า "Who has access" ผิด (ควรเป็น "Anyone")</li>
                  <li>URL ผิดหรือหมดอายุ</li>
                </ul>
              </div>
              <div>
                <strong>🔐 หน้า Google Sign-in ปรากฏ:</strong>
                <ul className="list-disc list-inside ml-4 mt-1">
                  <li>เปลี่ยน "Who has access" เป็น "Anyone" (ไม่ใช่ "Anyone with Google account")</li>
                  <li>Deploy Web App ใหม่</li>
                </ul>
              </div>
              <div>
                <strong>⏱️ Request timeout:</strong>
                <ul className="list-disc list-inside ml-4 mt-1">
                  <li>Apps Script function ทำงานช้าเกินไป</li>
                  <li>ตรวจสอบ infinite loops ในโค้ด</li>
                  <li>รัน setupSpreadsheet() function ก่อน</li>
                </ul>
              </div>
              <div>
                <strong>🔧 HTTP 403 Forbidden:</strong>
                <ul className="list-disc list-inside ml-4 mt-1">
                  <li>ปัญหาการอนุญาต - ตรวจสอบ "Execute as" และ "Who has access"</li>
                  <li>อาจต้อง authorize script ใหม่</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Success Message */}
          {connectionStatus === "success" && (
            <Card className="bg-green-50 border-green-200">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-6 h-6 text-green-500" />
                  <div>
                    <h3 className="font-semibold text-green-800">🎉 การเชื่อมต่อสำเร็จ!</h3>
                    <p className="text-sm text-green-700">
                      Google Apps Script ของคุณทำงานปกติแล้ว พร้อมใช้งาน!
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