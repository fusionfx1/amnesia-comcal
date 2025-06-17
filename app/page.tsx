"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Trash2, Plus, Download, Save, RefreshCw, FileSpreadsheet, Calculator, CheckCircle, AlertTriangle, ExternalLink } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface CommissionEntry {
  id: string
  employeeName: string
  month: string
  overtime: number
  netOT: number
  finalAmount: number
}

interface MonthlyData {
  month: string
  totalSales: number
  vatPercent: number
  salesExVAT: number
  totalCommission: number
  sharedCommissionPerPerson: number
  netSharedCommissionPerPerson: number
  entries: CommissionEntry[]
}

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
]

const employees = ["Ting", "Bank", "Tann"]

export default function AmnesiaCommissionCalculator() {
  const [googleSheetsUrl, setGoogleSheetsUrl] = useState<string>(
    "https://script.google.com/macros/s/AKfycbx1ycoCG7IHa5KPMzElhhPGWHUv8yLLX7nflMzqbywUyJfN8ZTrVqY_cHVEBcFKNaqt/exec"
  )
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([])
  const [selectedMonth, setSelectedMonth] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [availableMonths, setAvailableMonths] = useState<string[]>([])
  const [apiStatus, setApiStatus] = useState<"checking" | "connected" | "error">("checking")
  const [testResults, setTestResults] = useState<string>("")
  const [showTestPanel, setShowTestPanel] = useState(false)
  const { toast } = useToast()

  // Check API connection on load
  useEffect(() => {
    checkApiConnection()
  }, [googleSheetsUrl])

  // Add initial empty month
  useEffect(() => {
    if (monthlyData.length === 0) {
      addNewMonth()
    }
  }, [])

  // Load available months when URL is set
  useEffect(() => {
    if (googleSheetsUrl && apiStatus === "connected") {
      loadAvailableMonths()
    }
  }, [googleSheetsUrl, apiStatus])

  const addTestResult = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setTestResults(prev => prev + `[${timestamp}] ${message}\n`)
  }

  const checkApiConnection = async () => {
    if (!googleSheetsUrl) return

    setApiStatus("checking")
    addTestResult("🚀 เริ่มทดสอบการเชื่อมต่อ...")
    
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000) // Increased timeout

      // Add no-cors mode and additional headers for better compatibility
      const response = await fetch(googleSheetsUrl, {
        method: 'GET',
        signal: controller.signal,
        mode: 'cors', // Explicitly set CORS mode
        headers: {
          'Accept': 'application/json, text/plain, */*',
          'Content-Type': 'application/json',
        },
        // Add credentials if needed
        credentials: 'omit'
      })
      
      clearTimeout(timeoutId)

      if (response.ok) {
        const data = await response.text()
        if (data.includes("AMNESIA Commission API is working") || 
            data.includes("success") || 
            data.includes("API")) {
          setApiStatus("connected")
          addTestResult("✅ การเชื่อมต่อสำเร็จ! API ทำงานปกติ")
          toast({
            title: "✅ API Connected",
            description: "Google Apps Script เชื่อมต่อสำเร็จ!",
          })
        } else {
          setApiStatus("error")
          addTestResult("⚠️ ได้รับ response แต่ไม่ใช่ข้อความที่คาดหวัง")
          addTestResult(`Response: ${data.substring(0, 200)}...`)
        }
      } else {
        setApiStatus("error")
        addTestResult(`❌ HTTP Error: ${response.status} - ${response.statusText}`)
      }
    } catch (error: any) {
      setApiStatus("error")
      if (error.name === "AbortError") {
        addTestResult("❌ Request timeout (15 seconds)")
      } else if (error.message.includes("Failed to fetch")) {
        addTestResult("❌ Network Error: Cannot reach the API")
        addTestResult("🔧 Possible solutions:")
        addTestResult("   1. Check if the Google Apps Script URL is correct")
        addTestResult("   2. Ensure the Web App is deployed with 'Anyone' access")
        addTestResult("   3. Try redeploying the Google Apps Script")
        addTestResult("   4. Check if the script is published as a web app")
      } else {
        addTestResult(`❌ Network Error: ${error.message}`)
      }
    }
  }

  const calculateCommissions = (totalSales: number, vatPercent: number) => {
    const salesExVAT = totalSales / (1 + vatPercent / 100)
    const totalCommission = salesExVAT * 0.1 * 0.7 // 10% commission, 70% to employees
    const sharedCommissionPerPerson = totalCommission / 3 // Divide by 3 employees
    const netSharedCommissionPerPerson = sharedCommissionPerPerson * 0.97 // 3% tax deduction

    return {
      salesExVAT: Number(salesExVAT.toFixed(2)),
      totalCommission: Number(totalCommission.toFixed(2)),
      sharedCommissionPerPerson: Number(sharedCommissionPerPerson.toFixed(2)),
      netSharedCommissionPerPerson: Number(netSharedCommissionPerPerson.toFixed(2)),
    }
  }

  const addNewMonth = () => {
    const newMonth: MonthlyData = {
      month: "",
      totalSales: 0,
      vatPercent: 7, // Default VAT for Thailand
      salesExVAT: 0,
      totalCommission: 0,
      sharedCommissionPerPerson: 0,
      netSharedCommissionPerPerson: 0,
      entries: employees.map((employee) => ({
        id: `${Date.now()}-${employee}`,
        employeeName: employee,
        month: "",
        overtime: 0,
        netOT: 0,
        finalAmount: 0,
      })),
    }
    setMonthlyData([...monthlyData, newMonth])
  }

  const removeMonth = (index: number) => {
    setMonthlyData(monthlyData.filter((_, i) => i !== index))
  }

  const updateMonthlyData = (index: number, field: keyof MonthlyData, value: string | number) => {
    setMonthlyData((prevData) =>
      prevData.map((monthData, i) => {
        if (i === index) {
          const updatedData = { ...monthData, [field]: value }

          // Recalculate commissions if sales or VAT changes
          if (field === "totalSales" || field === "vatPercent") {
            const calculations = calculateCommissions(
              field === "totalSales" ? Number(value) : updatedData.totalSales,
              field === "vatPercent" ? Number(value) : updatedData.vatPercent,
            )

            Object.assign(updatedData, calculations)

            // Update all employee entries with new shared commission
            updatedData.entries = updatedData.entries.map((entry) => ({
              ...entry,
              month: updatedData.month,
              finalAmount: calculations.netSharedCommissionPerPerson + entry.netOT,
            }))
          }

          // Update month for all entries
          if (field === "month") {
            updatedData.entries = updatedData.entries.map((entry) => ({
              ...entry,
              month: String(value),
            }))
          }

          return updatedData
        }
        return monthData
      }),
    )
  }

  const updateEmployeeOT = (monthIndex: number, employeeId: string, overtime: number) => {
    setMonthlyData((prevData) =>
      prevData.map((monthData, i) => {
        if (i === monthIndex) {
          const updatedData = { ...monthData }
          updatedData.entries = updatedData.entries.map((entry) => {
            if (entry.id === employeeId) {
              const netOT = overtime * 0.97 // 3% tax deduction
              return {
                ...entry,
                overtime,
                netOT: Number(netOT.toFixed(2)),
                finalAmount: Number((updatedData.netSharedCommissionPerPerson + netOT).toFixed(2)),
              }
            }
            return entry
          })
          return updatedData
        }
        return monthData
      }),
    )
  }

  const exportToCSV = () => {
    const headers = [
      "Month", "Total Sales (incl. VAT)", "VAT %", "Sales Ex-VAT", "Total Commission",
      "Employee Name", "Shared Commission Per Person", "Net Shared Commission",
      "Overtime", "Net OT", "Final Amount"
    ]

    const csvRows: string[] = [headers.join(",")]

    monthlyData.forEach((monthData) => {
      monthData.entries.forEach((entry) => {
        csvRows.push([
          monthData.month, monthData.totalSales, monthData.vatPercent, monthData.salesExVAT,
          monthData.totalCommission, entry.employeeName, monthData.sharedCommissionPerPerson,
          monthData.netSharedCommissionPerPerson, entry.overtime, entry.netOT, entry.finalAmount
        ].join(","))
      })
    })

    const csvContent = csvRows.join("\n")
    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `amnesia-commission-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)

    toast({
      title: "Export Successful",
      description: "ข้อมูลค่าคอมมิชชั่นส่งออกเป็น CSV แล้ว",
    })
  }

  const loadAvailableMonths = async () => {
    if (!googleSheetsUrl || apiStatus !== "connected") return

    try {
      addTestResult("📊 กำลังโหลดรายการเดือน...")
      
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)

      const response = await fetch(`${googleSheetsUrl}?action=load`, {
        method: 'GET',
        signal: controller.signal,
        mode: 'cors',
        headers: {
          'Accept': 'application/json, text/plain, */*',
          'Content-Type': 'application/json',
        },
        credentials: 'omit'
      })
      
      clearTimeout(timeoutId)

      if (response.ok) {
        const data = await response.json()
        if (Array.isArray(data)) {
          setAvailableMonths(data)
          addTestResult(`📊 พบ ${data.length} เดือน: ${data.join(", ")}`)
        } else {
          setAvailableMonths([])
          addTestResult("📊 ไม่พบข้อมูลเดือน")
        }
      } else {
        addTestResult(`❌ Error loading months: ${response.status} - ${response.statusText}`)
        setAvailableMonths([])
      }
    } catch (error: any) {
      if (error.name === "AbortError") {
        addTestResult("❌ Timeout loading months")
      } else {
        addTestResult(`❌ Failed to load available months: ${error.message}`)
      }
      setAvailableMonths([])
    }
  }

  const saveToGoogleSheets = async () => {
    if (apiStatus !== "connected") {
      toast({
        title: "Error",
        description: "API not connected. Please check your connection.",
        variant: "destructive",
      })
      return
    }

    // Flatten all entries from all months
    const allEntries = monthlyData.flatMap((monthData) =>
      monthData.entries
        .filter((entry) => monthData.month && entry.employeeName)
        .map((entry) => ({
          ...entry,
          totalSales: monthData.totalSales,
          vatPercent: monthData.vatPercent,
          salesExVAT: monthData.salesExVAT,
          totalCommission: monthData.totalCommission,
          sharedCommission: monthData.sharedCommissionPerPerson,
          netSharedCommission: monthData.netSharedCommissionPerPerson,
        })),
    )

    if (allEntries.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one month with data.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000) // Longer timeout for save

      const response = await fetch(googleSheetsUrl, {
        method: "POST",
        signal: controller.signal,
        mode: 'cors',
        headers: { 
          "Content-Type": "application/json",
          'Accept': 'application/json, text/plain, */*',
        },
        credentials: 'omit',
        body: JSON.stringify({ action: "save", data: allEntries }),
      })

      clearTimeout(timeoutId)

      if (response.ok) {
        const result = await response.json()
        toast({
          title: "Success",
          description: result.message || `${allEntries.length} entries saved successfully.`,
        })
        loadAvailableMonths()
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
    } catch (error: any) {
      if (error.name === "AbortError") {
        toast({
          title: "Error",
          description: "Request timeout. Please try again.",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Error",
          description: `Failed to save data: ${error.message}`,
          variant: "destructive",
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  const loadFromGoogleSheets = async () => {
    if (!googleSheetsUrl || !selectedMonth) {
      toast({
        title: "Error",
        description: "Please select a month to load.",
        variant: "destructive",
      })
      return
    }

    if (apiStatus !== "connected") {
      toast({
        title: "Error",
        description: "API not connected. Please check connection first.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000)

      const response = await fetch(`${googleSheetsUrl}?action=load&month=${selectedMonth}`, {
        method: 'GET',
        signal: controller.signal,
        mode: 'cors',
        headers: {
          'Accept': 'application/json, text/plain, */*',
          'Content-Type': 'application/json',
        },
        credentials: 'omit'
      })

      clearTimeout(timeoutId)

      if (response.ok) {
        const data = await response.json()

        if (data && data.length > 0) {
          // Group data by month and reconstruct monthly data
          const monthData: MonthlyData = {
            month: selectedMonth,
            totalSales: Number(data[0].totalSales) || 0,
            vatPercent: Number(data[0].vatPercent) || 7,
            salesExVAT: Number(data[0].salesExVAT) || 0,
            totalCommission: Number(data[0].totalCommission) || 0,
            sharedCommissionPerPerson: Number(data[0].sharedCommission) || 0,
            netSharedCommissionPerPerson: Number(data[0].netSharedCommission) || 0,
            entries: data.map((item: any) => ({
              id: `loaded-${item.employeeName}-${Date.now()}`,
              employeeName: item.employeeName || "",
              month: item.month || "",
              overtime: Number(item.overtime) || 0,
              netOT: Number(item.netOT) || 0,
              finalAmount: Number(item.finalAmount) || 0,
            })),
          }

          setMonthlyData([monthData])
          toast({
            title: "Success",
            description: `Loaded ${data.length} entries for ${selectedMonth}.`,
          })
        } else {
          toast({
            title: "No Data",
            description: `No entries found for ${selectedMonth}.`,
          })
        }
      } else {
        const errorText = await response.text()
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }
    } catch (error: any) {
      if (error.name === "AbortError") {
        toast({
          title: "Error",
          description: "Request timeout. Please try again.",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Error",
          description: `Failed to load data: ${error.message}`,
          variant: "destructive",
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  const getApiStatusBadge = () => {
    switch (apiStatus) {
      case "connected":
        return <Badge className="bg-green-500">✅ Connected</Badge>
      case "error":
        return <Badge variant="destructive">❌ Error</Badge>
      case "checking":
        return <Badge variant="secondary">🔄 Checking...</Badge>
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calculator className="w-6 h-6" />
              💰 AMNESIA Commission Calculator
              <Badge className="bg-blue-500 text-white">🆕 New Version</Badge>
            </div>
            <div className="flex items-center gap-2">
              {getApiStatusBadge()}
              <Button
                variant="outline"
                onClick={() => setShowTestPanel(!showTestPanel)}
                className="flex items-center gap-2"
              >
                <AlertTriangle className="w-4 h-4" />
                Test API
              </Button>
              <Button
                variant="outline"
                onClick={() => window.open("https://docs.google.com/spreadsheets", "_blank")}
                className="flex items-center gap-2"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Open Sheets
              </Button>
            </div>
          </CardTitle>
          <CardDescription>
            คำนวณค่าคอมมิชชั่นจากยอดขายรวม แล้วหารให้ทั้ง 3 คน (Ting, Bank, Tann) เท่าๆ กัน + OT แยกตามคน
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Test Panel */}
          {showTestPanel && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardHeader>
                <CardTitle className="text-lg text-yellow-800">🧪 API Test Panel</CardTitle>
                <CardDescription className="text-yellow-700">
                  If you see connection errors, please check your Google Apps Script deployment:
                  <br />
                  1. Go to your Google Apps Script project
                  <br />
                  2. Click "Deploy" → "Manage deployments"
                  <br />
                  3. Edit your Web App deployment
                  <br />
                  4. Set "Execute as" to "Me" and "Who has access" to "Anyone"
                  <br />
                  5. Click "Deploy" to get a new URL
                  <br />
                  6. Update the URL in the field below
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Button onClick={checkApiConnection} size="sm">
                    Test Connection
                  </Button>
                  <Button onClick={loadAvailableMonths} size="sm" variant="outline">
                    Test Load Months
                  </Button>
                  <Button onClick={() => setTestResults("")} size="sm" variant="outline">
                    Clear Log
                  </Button>
                </div>
                {testResults && (
                  <Textarea
                    value={testResults}
                    readOnly
                    className="min-h-[150px] font-mono text-xs"
                    placeholder="Test results will appear here..."
                  />
                )}
              </CardContent>
            </Card>
          )}

          {/* API Status and Integration */}
          <Card className={`border-2 ${apiStatus === "connected" ? "border-green-200 bg-green-50" : "border-gray-200"}`}>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sheets-url">Google Apps Script URL</Label>
                  <div className="flex gap-2">
                    <Input
                      id="sheets-url"
                      value={googleSheetsUrl}
                      onChange={(e) => setGoogleSheetsUrl(e.target.value)}
                      className="flex-1"
                      placeholder="https://script.google.com/macros/s/..."
                    />
                    <Button variant="outline" size="sm" onClick={checkApiConnection}>
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                  </div>
                  {apiStatus === "error" && (
                    <p className="text-sm text-red-600">
                      ⚠️ Connection failed. Please check the deployment settings in Google Apps Script.
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="load-month">Load Data for Month</Label>
                  <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                    <SelectTrigger id="load-month">
                      <SelectValue placeholder="Select month" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableMonths.length > 0
                        ? availableMonths.map((month) => (
                            <SelectItem key={month} value={month}>
                              {month}
                            </SelectItem>
                          ))
                        : months.map((month) => (
                            <SelectItem key={month} value={month}>
                              {month}
                            </SelectItem>
                          ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end gap-2">
                  <Button
                    onClick={loadFromGoogleSheets}
                    disabled={isLoading || apiStatus !== "connected"}
                    className="flex-1"
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
                    Load Data
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            <Button onClick={addNewMonth} variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Add Month
            </Button>
            <Button onClick={exportToCSV} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            <Button onClick={saveToGoogleSheets} disabled={isLoading || apiStatus !== "connected"}>
              <Save className="w-4 h-4 mr-2" />
              Save to Sheets
            </Button>
            <Button onClick={loadAvailableMonths} variant="outline" disabled={isLoading || apiStatus !== "connected"}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Months
            </Button>
          </div>

          {/* Monthly Data */}
          {monthlyData.map((monthData, monthIndex) => (
            <Card key={monthIndex} className="border-2">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">📅 {monthData.month || "New Month"}</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeMonth(monthIndex)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Month and Sales Input */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-blue-50 rounded-lg">
                  <div className="space-y-2">
                    <Label>Month</Label>
                    <Select
                      value={monthData.month}
                      onValueChange={(value) => updateMonthlyData(monthIndex, "month", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select month" />
                      </SelectTrigger>
                      <SelectContent>
                        {months.map((month) => (
                          <SelectItem key={month} value={month}>
                            {month}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Total Sales (incl. VAT)</Label>
                    <Input
                      type="number"
                      value={monthData.totalSales || ""}
                      onChange={(e) => updateMonthlyData(monthIndex, "totalSales", Number(e.target.value))}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>VAT %</Label>
                    <Input
                      type="number"
                      value={monthData.vatPercent || ""}
                      onChange={(e) => updateMonthlyData(monthIndex, "vatPercent", Number(e.target.value))}
                      placeholder="7"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Sales Ex-VAT</Label>
                    <div className="p-2 bg-white rounded border font-mono">฿{monthData.salesExVAT.toFixed(2)}</div>
                  </div>
                </div>

                {/* Commission Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-yellow-50 rounded-lg">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Total Commission</p>
                    <p className="text-xl font-bold">฿{monthData.totalCommission.toFixed(2)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Per Person (Before Tax)</p>
                    <p className="text-xl font-bold text-blue-600">฿{monthData.sharedCommissionPerPerson.toFixed(2)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Per Person (After Tax)</p>
                    <p className="text-xl font-bold text-green-600">
                      ฿{monthData.netSharedCommissionPerPerson.toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Employee Table */}
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Employee</TableHead>
                        <TableHead>Shared Commission</TableHead>
                        <TableHead>Net Commission (97%)</TableHead>
                        <TableHead>Overtime</TableHead>
                        <TableHead>Net OT (97%)</TableHead>
                        <TableHead className="font-bold bg-green-50">Final Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {monthData.entries.map((entry) => (
                        <TableRow key={entry.id}>
                          <TableCell className="font-semibold">{entry.employeeName}</TableCell>
                          <TableCell className="font-mono">฿{monthData.sharedCommissionPerPerson.toFixed(2)}</TableCell>
                          <TableCell className="font-mono bg-blue-50">
                            ฿{monthData.netSharedCommissionPerPerson.toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={entry.overtime || ""}
                              onChange={(e) => updateEmployeeOT(monthIndex, entry.id, Number(e.target.value))}
                              placeholder="0.00"
                              className="min-w-24"
                            />
                          </TableCell>
                          <TableCell className="font-mono">฿{entry.netOT.toFixed(2)}</TableCell>
                          <TableCell className="font-bold font-mono text-green-600 bg-green-50">
                            ฿{entry.finalAmount.toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Overall Summary */}
          {monthlyData.length > 0 && (
            <Card className="bg-purple-50">
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-4">📊 Overall Summary</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <p className="text-sm text-gray-600">Total Months</p>
                    <p className="text-2xl font-bold">{monthlyData.length}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Sales</p>
                    <p className="text-2xl font-bold">
                      ฿{monthlyData.reduce((sum, month) => sum + month.totalSales, 0).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Commission</p>
                    <p className="text-2xl font-bold">
                      ฿{monthlyData.reduce((sum, month) => sum + month.totalCommission, 0).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Avg Per Person/Month</p>
                    <p className="text-2xl font-bold text-green-600">
                      ฿
                      {monthlyData.length > 0
                        ? (
                            monthlyData.reduce((sum, month) => sum + month.netSharedCommissionPerPerson, 0) /
                            monthlyData.length
                          ).toFixed(2)
                        : "0.00"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Success Message */}
          {apiStatus === "connected" && (
            <Card className="bg-green-50 border-green-200">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-6 h-6 text-green-500" />
                  <div>
                    <h3 className="font-semibold text-green-800">🎉 System Ready!</h3>
                    <p className="text-sm text-green-700">
                      Your commission calculator is connected to Google Sheets and ready to use!
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Available Months Display */}
          {apiStatus === "connected" && availableMonths.length > 0 && (
            <div className="text-xs text-green-600 mt-1">
              Found {availableMonths.length} months: {availableMonths.join(", ")}
            </div>
          )}

          {/* Calculation Formula */}
          <Card className="bg-gray-50">
            <CardHeader>
              <CardTitle className="text-lg">📊 Calculation Formula</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p><strong>1.</strong> Sales Excluding VAT = Total Sales ÷ (1 + VAT%)</p>
              <p><strong>2.</strong> Total Commission = Sales Ex-VAT × 10% × 70%</p>
              <p><strong>3.</strong> <span className="bg-blue-200 px-1 rounded">Shared Commission Per Person = Total Commission ÷ 3</span></p>
              <p><strong>4.</strong> Net Shared Commission = Shared Commission × 97% (3% tax deduction)</p>
              <p><strong>5.</strong> Net Overtime = Individual Overtime × 97% (3% tax deduction)</p>
              <p><strong>6.</strong> <strong>Final Amount = Net Shared Commission + Net Overtime</strong></p>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  )
}