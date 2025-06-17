"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Trash2, Plus, Download, Save, RefreshCw, FileSpreadsheet } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface CommissionEntry {
  id: string
  employeeName: string
  month: string
  totalSales: number
  vatPercent: number
  overtime: number
  salesExVAT: number
  commission: number
  netCommission: number
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

  const calculateCommission = (totalSales: number, vatPercent: number, overtime: number): Partial<CommissionEntry> => {
    const salesExVAT = totalSales / (1 + vatPercent / 100)
    const commission = salesExVAT * 0.1 // 10% commission
    const employeeCommission = commission * 0.7 // Employee gets 70%
    const netCommission = employeeCommission * 0.97 // 3% tax deduction
    const netOT = overtime * 0.97 // 3% tax deduction on OT
    const finalAmount = netCommission + netOT

    return {
      salesExVAT: Number(salesExVAT.toFixed(2)),
      commission: Number(commission.toFixed(2)),
      netCommission: Number(netCommission.toFixed(2)),
      netOT: Number(netOT.toFixed(2)),
      finalAmount: Number(finalAmount.toFixed(2)),
    }
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
      commission: 0,
      netCommission: 0,
      netOT: 0,
      finalAmount: 0,
    }
    setEntries([...entries, newEntry])
  }

  const removeEntry = (id: string) => {
    setEntries(entries.filter((entry) => entry.id !== id))
  }

  const updateEntry = (id: string, field: keyof CommissionEntry, value: string | number) => {
    setEntries(
      entries.map((entry) => {
        if (entry.id === id) {
          const updatedEntry = { ...entry, [field]: value }

          // Recalculate if numeric fields change
          if (["totalSales", "vatPercent", "overtime"].includes(field)) {
            const calculations = calculateCommission(
              updatedEntry.totalSales,
              updatedEntry.vatPercent,
              updatedEntry.overtime,
            )
            Object.assign(updatedEntry, calculations)
          }

          return updatedEntry
        }
        return entry
      }),
    )
  }

  const exportToCSV = () => {
    const headers = [
      "Employee Name",
      "Month",
      "Total Sales (incl. VAT)",
      "VAT %",
      "Overtime",
      "Sales Ex-VAT",
      "Commission",
      "Net Commission",
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
          entry.commission,
          entry.netCommission,
          entry.netOT,
          entry.finalAmount,
        ].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `amnesia-commission-report-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)

    toast({
      title: "Export Successful",
      description: "Commission data exported to CSV file.",
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
              commission: Number(item.commission) || 0,
              netCommission: Number(item.netCommission) || 0,
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

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">💰 AMNESIA Staff Commission Calculator</div>
            <Button variant="outline" onClick={openSpreadsheet} className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4" />
              Open Spreadsheet
            </Button>
          </CardTitle>
          <CardDescription>
            Calculate employee commissions with overtime and tax deductions (3% tax on both commission and OT)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
                  <TableHead>Commission</TableHead>
                  <TableHead>Net Commission (67%)</TableHead>
                  <TableHead>Net OT (97%)</TableHead>
                  <TableHead className="font-bold">Final Amount</TableHead>
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
                    <TableCell className="font-mono">${entry.salesExVAT.toFixed(2)}</TableCell>
                    <TableCell className="font-mono">${entry.commission.toFixed(2)}</TableCell>
                    <TableCell className="font-mono">${entry.netCommission.toFixed(2)}</TableCell>
                    <TableCell className="font-mono">${entry.netOT.toFixed(2)}</TableCell>
                    <TableCell className="font-bold font-mono text-green-600">
                      ${entry.finalAmount.toFixed(2)}
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
                    <p className="text-2xl font-bold">
                      ${entries.reduce((sum, entry) => sum + entry.totalSales, 0).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Commission</p>
                    <p className="text-2xl font-bold">
                      ${entries.reduce((sum, entry) => sum + entry.netCommission, 0).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Payout</p>
                    <p className="text-2xl font-bold text-green-600">
                      ${entries.reduce((sum, entry) => sum + entry.finalAmount, 0).toFixed(2)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Calculation Formula */}
          <Card className="bg-gray-50">
            <CardHeader>
              <CardTitle className="text-lg">📊 Calculation Formula</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>
                <strong>1.</strong> Sales Excluding VAT = Total Sales ÷ (1 + VAT%)
              </p>
              <p>
                <strong>2.</strong> Commission = Sales Ex-VAT × 10%
              </p>
              <p>
                <strong>3.</strong> Employee Commission = Commission × 70%
              </p>
              <p>
                <strong>4.</strong> Net Commission = Employee Commission × 97% (3% tax deduction)
              </p>
              <p>
                <strong>5.</strong> Net Overtime = Overtime × 97% (3% tax deduction)
              </p>
              <p>
                <strong>6.</strong> <strong>Final Amount = Net Commission + Net Overtime</strong>
              </p>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  )
}
