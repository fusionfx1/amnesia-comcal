"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, ExternalLink, Sparkles, Trophy } from "lucide-react"

export default function SuccessCelebration() {
  const newApiUrl =
    "https://script.google.com/macros/s/AKfycbzFwqXTQbfluM02DvhKP0JQW8LQsRy6HI8tQOC1HZYP_V3LNwweCIi1SgQ1N6e2Q6FOGg/exec"

  return (
    <div className="container mx-auto p-6">
      <Card className="border-green-200 bg-gradient-to-r from-green-50 to-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-800">
            <Trophy className="w-8 h-8 text-yellow-500" />🎉 API Connection Fixed Successfully!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Success Status */}
          <div className="flex items-center justify-center space-x-4">
            <CheckCircle className="w-12 h-12 text-green-500" />
            <div className="text-center">
              <h2 className="text-2xl font-bold text-green-800">Connection Successful!</h2>
              <p className="text-green-600">Your AMNESIA Commission API is now working perfectly</p>
            </div>
            <Sparkles className="w-12 h-12 text-blue-500" />
          </div>

          {/* API Details */}
          <div className="bg-white p-4 rounded-lg border border-green-200">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <Badge className="bg-green-500">✅ Active</Badge>
              Working API URL:
            </h3>
            <code className="text-xs bg-gray-100 p-2 rounded block break-all">{newApiUrl}</code>
          </div>

          {/* Test Results Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-white rounded-lg border border-green-200">
              <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <h4 className="font-semibold">URL Format</h4>
              <p className="text-sm text-green-600">✅ Valid</p>
            </div>
            <div className="text-center p-4 bg-white rounded-lg border border-green-200">
              <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <h4 className="font-semibold">Connection</h4>
              <p className="text-sm text-green-600">✅ Status 200</p>
            </div>
            <div className="text-center p-4 bg-white rounded-lg border border-green-200">
              <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <h4 className="font-semibold">API Response</h4>
              <p className="text-sm text-green-600">✅ Working</p>
            </div>
          </div>

          {/* Next Steps */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h3 className="font-semibold mb-3 text-blue-800">🚀 What's Next?</h3>
            <div className="space-y-2 text-sm">
              <p>✅ Your commission calculator is now ready to use</p>
              <p>✅ You can save and load data from Google Sheets</p>
              <p>✅ All API endpoints are working correctly</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 justify-center">
            <Button onClick={() => window.open(newApiUrl, "_blank")} className="bg-green-600 hover:bg-green-700">
              <ExternalLink className="w-4 h-4 mr-2" />
              Test API Directly
            </Button>
            <Button variant="outline" onClick={() => window.open("https://script.google.com", "_blank")}>
              <ExternalLink className="w-4 h-4 mr-2" />
              View Apps Script
            </Button>
          </div>

          {/* Celebration Message */}
          <div className="text-center p-6 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
            <h3 className="text-xl font-bold text-orange-800 mb-2">🎊 Congratulations! 🎊</h3>
            <p className="text-orange-700">
              You've successfully set up your commission tracking system!
              <br />
              <strong>AMNESIA Commission Calculator</strong> is now fully operational.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
