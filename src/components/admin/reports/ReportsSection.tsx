import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileText, Users, MessageSquare } from "lucide-react";

export function ReportsSection() {
  const handleExport = (type: string) => {
    console.log(`Exporting ${type} data...`);
    // TODO: Implement export functionality
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Export Data</CardTitle>
          <CardDescription>Download reports and data exports</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <FileText className="w-8 h-8 text-primary" />
              <div>
                <h3 className="font-semibold">Problems Report</h3>
                <p className="text-sm text-muted-foreground">Export all problems data to CSV</p>
              </div>
            </div>
            <Button onClick={() => handleExport("problems")}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-primary" />
              <div>
                <h3 className="font-semibold">Users Report</h3>
                <p className="text-sm text-muted-foreground">Export all users data to CSV</p>
              </div>
            </div>
            <Button onClick={() => handleExport("users")}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <MessageSquare className="w-8 h-8 text-primary" />
              <div>
                <h3 className="font-semibold">Messages Report</h3>
                <p className="text-sm text-muted-foreground">Export all conversations to CSV</p>
              </div>
            </div>
            <Button onClick={() => handleExport("messages")}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Analytics Summary</CardTitle>
          <CardDescription>Generate monthly or weekly reports</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Analytics reports feature coming soon. You'll be able to generate comprehensive reports with charts and insights.
          </p>
          <Button variant="outline" disabled>
            Generate Report
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
