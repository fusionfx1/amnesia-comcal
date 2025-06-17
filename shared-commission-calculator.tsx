"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Trash2, Plus, Download, Save, RefreshCw, FileSpreadsheet, Users } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface CommissionEntry {
  id: string
  employeeName: string
  month: string
  totalSales: number
  vatPercent: number
  overtime: number
  salesExVAT: number
  individualCommission: number
  sharedCommission: number
  netSharedCommission: number
  netOT: number
  finalAmount: number
}

const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
]

const employees = ["Ting", "Bank", "Tann"]

export default function Component() {
  const [entries, setEntries] = useState<CommissionEntry[]>([])
  const [selectedMonth, setSelectedMonth] = useState<string>("")
  const [googleSheetsUrl, setGoogleSheetsUrl] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [availableMonths, setAvailableMonths] = useState<string[]>([])
  const { toast } = useToast()

  // Add initial empty entry
  useEffect(() => {
    if (entries.length === 0) {
      addNewEntry()
    }
  }, [])

  // Load available months when URL is set
  useEffect(() => {
    if (googleSheetsUrl) {
      loadAvailableMonths()
    }
  }, [googleSheetsUrl])

  // Recalculate shared commission whenever entries change
  useEffect(() => {
    recalculateSharedCommissions()
  }, [entries.length])

  const calculateIndividualCommission = (totalSales: number, vatPercent: number): number => {
    const salesExVAT = totalSales / (1 + vatPercent / 100)
    const commission = salesExVAT * 0.1 // 10% commission
    const employeeCommission = commission * 0.7 // Employee gets 70%
    return employeeCommission
  }

  const recalculateSharedCommissions = () => {
    if (entries.length === 0) return

    // Calculate total commission from all entries
    const totalCommission = entries.reduce((sum, entry) => {
      const salesExVAT = entry.totalSales / (1 + entry.vatPercent / 100)
      const commission = salesExVAT * 0.1 * 0.7 // 10% commission, 70% to employees
      return sum + commission
    }, 0)

    // Divide by 3 employees
    const sharedCommissionPerPerson = totalCommission / 3

    // Apply 3% tax deduction
    const netSharedCommissionPerPerson = sharedCommissionPerPerson * 0.97

    // Update all entries with shared commission
    setEntries((prevEntries) =>
      prevEntries.map((entry) => {
        const salesExVAT = entry.totalSales / (1 + entry.vatPercent / 100)
        const individualCommission = calculateIndividualCommission(entry.totalSales, entry.vatPercent)
        const netOT = entry.overtime * 0.97
        const finalAmount = netSharedCommissionPerPerson + netOT

        return {
          ...entry,
          salesExVAT: Number(salesExVAT.toFixed(2)),
          individualCommission: Number(individualCommission.toFixed(2)),
          sharedCommission: Number(sharedCommissionPerPerson.toFixed(2)),
          netSharedCommission: Number(netSharedCommissionPerPerson.toFixed(2)),
          netOT: Number(netOT.toFixed(2)),
          finalAmount: Number(finalAmount.toFixed(2)),
        }
      }),
    )
  }

  const addNewEntry = () => {
    const newEntry: CommissionEntry = {
      id: Date.now().toString(),
      employeeName: "",
      month: "",
      totalSales: 0,
      vatPercent: 15, // Default VAT
      overtime: 0,
      salesExVAT: 0,
      individualCommission: 0,
      sharedCommission: 0,
      netSharedCommission: 0,
      netOT: 0,
      finalAmount: 0,
    }
    setEntries([...entries, newEntry])
  }

  const removeEntry = (id: string) => {
    setEntries(entries.filter((entry) => entry.id !== id))
  }

  const updateEntry = (id: string, field: keyof CommissionEntry, value: string | number) => {
    setEntries((prevEntries) => {
      const updatedEntries = prevEntries.map((entry) => {
        if (entry.id === id) {
          return { ...entry, [field]: value }
        }
        return entry
      })

      // Trigger recalculation after state update
      setTimeout(() => recalculateSharedCommissions(), 0)

      return updatedEntries
    })
  }

  const exportToCSV = () => {
    const headers = [
      "Employee Name",
      "Month",
      "Total Sales (incl. VAT)",
      "VAT %",
      "Overtime",
      "Sales Ex-VAT",
      "Individual Commission",
      "Shared Commission",
      "Net Shared Commission",
      "Net OT",
      "Final Amount",
    ]

    const csvContent = [
      headers.join(","),
      ...entries.map((entry) =>
        [
          entry.employeeName,
          entry.month,
          entry.totalSales,
          entry.vatPercent,
          entry.overtime,
          entry.salesExVAT,
          entry.individualCommission,
          entry.sharedCommission,
          entry.netSharedCommission,
          entry.netOT,
          entry.finalAmount,
        ].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `amnesia-commission-baht-report-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)

    toast({
      title: "Export Successful",
      description: "ข้อมูลค่าคอมมิชชั่น (บาท) ส่งออกเป็น CSV แล้ว",
    })
  }

  const loadAvailableMonths = async () => {
    if (!googleSheetsUrl) {
      return
    }

    try {
      const response = await fetch(`${googleSheetsUrl}?action=load`)

      if (response.ok) {
        const months = await response.json()
        setAvailableMonths(months)
      }
    } catch (error) {
      console.error("Failed to load available months:", error)
    }
  }

  const saveToGoogleSheets = async () => {
    if (!googleSheetsUrl) {
      toast({
        title: "Error",
        description: "Please enter Google Sheets Web App URL.",
        variant: "destructive",
      })
      return
    }

    const validEntries = entries.filter((entry) => entry.employeeName && entry.month)

    if (validEntries.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one entry with employee name and month.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(googleSheetsUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "save",
          data: validEntries,
        }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: `${validEntries.length} entries saved to AMNESIA Staff Commission 2025 spreadsheet.`,
        })

        // Refresh available months
        loadAvailableMonths()
      } else {
        throw new Error("Failed to save data")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save data to Google Sheets.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const loadFromGoogleSheets = async () => {
    if (!googleSheetsUrl || !selectedMonth) {
      toast({
        title: "Error",
        description: "Please enter Google Sheets URL and select a month.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`${googleSheetsUrl}?action=load&month=${selectedMonth}`)

      if (response.ok) {
        const data = await response.json()
        if (data.length > 0) {
          setEntries(
            data.map((item: any, index: number) => ({
              id: `loaded-${index}-${Date.now()}`,
              employeeName: item.employeeName || "",
              month: item.month || "",
              totalSales: Number(item.totalSales) || 0,
              vatPercent: Number(item.vatPercent) || 15,
              overtime: Number(item.overtime) || 0,
              salesExVAT: Number(item.salesExVAT) || 0,
              individualCommission: Number(item.individualCommission) || 0,
              sharedCommission: Number(item.sharedCommission) || 0,
              netSharedCommission: Number(item.netSharedCommission) || 0,
              netOT: Number(item.netOT) || 0,
              finalAmount: Number(item.finalAmount) || 0,
            })),
          )
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
        throw new Error("Failed to load data")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load data from Google Sheets.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const openSpreadsheet = () => {
    window.open("https://docs.google.com/spreadsheets/d/1vfqb7BwLOJEL32CrtoUoOzkQF_p8vjvjVC0IwwbVJms/edit", "_blank")
  }

  // Calculate totals for summary
  const totalSales = entries.reduce((sum, entry) => sum + entry.totalSales, 0)
  const totalIndividualCommission = entries.reduce((sum, entry) => sum + entry.individualCommission, 0)
  const sharedCommissionPerPerson = entries.length > 0 ? entries[0].netSharedCommission : 0

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-6 h-6" />💰 AMNESIA Shared Commission Calculator
            </div>
            <Button variant="outline" onClick={openSpreadsheet} className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4" />
              Open Spreadsheet
            </Button>
          </CardTitle>
          <CardDescription>คำนวณค่าคอมมิชชั่นแบบหารกันทั้ง 3 คน (Ting, Bank, Tann) พร้อมหักภาษี 3% ทั้งค่าคอมและ OT</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Shared Commission Explanation */}
          <Card className="bg-yellow-50 border-yellow-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-5 h-5 text-yellow-600" />
                <h3 className="font-semibold text-yellow-800">วิธีการคำนวณค่าคอมแบบหารกัน</h3>
              </div>
              <p className="text-sm text-yellow-700">
                ค่าคอมมิชชั่นจากยอดขายทั้งหมดจะถูกรวมกันแล้วหารให้ทั้ง 3 คน เท่าๆ กัน + OT ของแต่ละคนแยก
              </p>
            </CardContent>
          </Card>

          {/* Google Sheets Integration */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="space-y-2">
              <Label htmlFor="sheets-url">Google Sheets Web App URL</Label>
              <Input
                id="sheets-url"
                placeholder="https://script.google.com/macros/s/..."
                value={googleSheetsUrl}
                onChange={(e) => setGoogleSheetsUrl(e.target.value)}
              />
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
              <Button onClick={loadFromGoogleSheets} disabled={isLoading} className="flex-1">
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
                Load Data
              </Button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            <Button onClick={addNewEntry} variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Add Entry
            </Button>
            <Button onClick={exportToCSV} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            <Button onClick={saveToGoogleSheets} disabled={isLoading}>
              <Save className="w-4 h-4 mr-2" />
              Save to Sheets
            </Button>
          </div>

          {/* Commission Table */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Month</TableHead>
                  <TableHead>Total Sales (incl. VAT)</TableHead>
                  <TableHead>VAT %</TableHead>
                  <TableHead>Overtime</TableHead>
                  <TableHead>Sales Ex-VAT</TableHead>
                  <TableHead>Individual Commission</TableHead>
                  <TableHead className="bg-blue-50">Shared Commission</TableHead>
                  <TableHead className="bg-blue-50">Net Shared (97%)</TableHead>
                  <TableHead>Net OT (97%)</TableHead>
                  <TableHead className="font-bold bg-green-50">Final Amount</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>
                      <Select
                        value={entry.employeeName}
                        onValueChange={(value) => updateEntry(entry.id, "employeeName", value)}
                      >
                        <SelectTrigger className="min-w-32">
                          <SelectValue placeholder="Select employee" />
                        </SelectTrigger>
                        <SelectContent>
                          {employees.map((employee) => (
                            <SelectItem key={employee} value={employee}>
                              {employee}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Select value={entry.month} onValueChange={(value) => updateEntry(entry.id, "month", value)}>
                        <SelectTrigger className="min-w-32">
                          <SelectValue placeholder="Month" />
                        </SelectTrigger>
                        <SelectContent>
                          {months.map((month) => (
                            <SelectItem key={month} value={month}>
                              {month}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={entry.totalSales || ""}
                        onChange={(e) => updateEntry(entry.id, "totalSales", Number(e.target.value))}
                        placeholder="0.00"
                        className="min-w-24"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={entry.vatPercent || ""}
                        onChange={(e) => updateEntry(entry.id, "vatPercent", Number(e.target.value))}
                        placeholder="15"
                        className="min-w-20"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={entry.overtime || ""}
                        onChange={(e) => updateEntry(entry.id, "overtime", Number(e.target.value))}
                        placeholder="0.00"
                        className="min-w-24"
                      />
                    </TableCell>
                    <TableCell className="font-mono">฿{entry.salesExVAT.toFixed(2)}</TableCell>
                    <TableCell className="font-mono text-gray-500">฿{entry.individualCommission.toFixed(2)}</TableCell>
                    <TableCell className="font-mono bg-blue-50">฿{entry.sharedCommission.toFixed(2)}</TableCell>
                    <TableCell className="font-mono bg-blue-50">฿{entry.netSharedCommission.toFixed(2)}</TableCell>
                    <TableCell className="font-mono">฿{entry.netOT.toFixed(2)}</TableCell>
                    <TableCell className="font-bold font-mono text-green-600 bg-green-50">
                      ฿{entry.finalAmount.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeEntry(entry.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Summary */}
          {entries.length > 0 && (
            <Card className="bg-blue-50">
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <p className="text-sm text-gray-600">Total Entries</p>
                    <p className="text-2xl font-bold">{entries.length}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Sales</p>
                    <p className="text-2xl font-bold">฿{totalSales.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Individual Commission</p>
                    <p className="text-2xl font-bold text-gray-500">฿{totalIndividualCommission.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Shared Commission Per Person</p>
                    <p className="text-2xl font-bold text-blue-600">฿{sharedCommissionPerPerson.toFixed(2)}</p>
                  </div>
                </div>
                <div className="mt-4 p-4 bg-white rounded-lg">
                  <h3 className="font-semibold mb-2">💰 Final Payout Per Employee:</h3>
                  <div className="grid grid-cols-3 gap-4">
                    {employees.map((employee) => {
                      const employeeEntry = entries.find((e) => e.employeeName === employee)
                      const finalAmount = employeeEntry ? employeeEntry.finalAmount : sharedCommissionPerPerson
                      return (
                        <div key={employee} className="text-center p-2 bg-green-50 rounded">
                          <p className="font-semibold">{employee}</p>
                          <p className="text-lg font-bold text-green-600">฿{finalAmount.toFixed(2)}</p>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Calculation Formula */}
          <Card className="bg-gray-50">
            <CardHeader>
              <CardTitle className="text-lg">📊 Shared Commission Formula</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>
                <strong>1.</strong> Sales Excluding VAT = Total Sales ÷ (1 + VAT%)
              </p>
              <p>
                <strong>2.</strong> Individual Commission = Sales Ex-VAT × 10% × 70%
              </p>
              <p>
                <strong>3.</strong>{" "}
                <span className="bg-yellow-200 px-1 rounded">Total Commission = Sum of all Individual Commissions</span>
              </p>
              <p>
                <strong>4.</strong>{" "}
                <span className="bg-blue-200 px-1 rounded">Shared Commission Per Person = Total Commission ÷ 3</span>
              </p>
              <p>
                <strong>5.</strong> Net Shared Commission = Shared Commission × 97% (3% tax deduction)
              </p>
              <p>
                <strong>6.</strong> Net Overtime = Individual Overtime × 97% (3% tax deduction)
              </p>
              <p>
                <strong>7.</strong> <strong>Final Amount = Net Shared Commission + Net Overtime</strong>
              </p>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  )
}
