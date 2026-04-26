import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, FileText, BarChart3, Settings, ShieldCheck, Calendar } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const AdminDashboard = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/20 to-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage tests, users, and view results</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold">1,234</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-success/10">
                <FileText className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tests Taken</p>
                <p className="text-2xl font-bold">856</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-secondary/10">
                <BarChart3 className="h-6 w-6 text-secondary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pass Rate</p>
                <p className="text-2xl font-bold">72%</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-accent/10">
                <Settings className="h-6 w-6 text-accent-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Tests</p>
                <p className="text-2xl font-bold">12</p>
              </div>
            </div>
          </Card>
        </div>

        <Tabs defaultValue="verification" className="space-y-4">
          <TabsList className="grid grid-cols-5">
            <TabsTrigger value="verification">Verification</TabsTrigger>
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
            <TabsTrigger value="questions">Questions</TabsTrigger>
            <TabsTrigger value="results">Results</TabsTrigger>
            <TabsTrigger value="audit">Audit</TabsTrigger>
          </TabsList>
          <TabsContent value="verification">
            <Card className="p-6 space-y-3">
              <h2 className="text-xl font-semibold flex items-center gap-2"><ShieldCheck className="h-5 w-5" /> Candidate Verification Queue</h2>
              {["#V-1024 / Pending documents", "#V-1025 / Face mismatch warning", "#V-1026 / Awaiting admin decision"].map((item) => (
                <div key={item} className="flex items-center justify-between p-3 rounded-md bg-muted">
                  <span>{item}</span>
                  <div className="space-x-2">
                    <Button size="sm" variant="outline">Reject</Button>
                    <Button size="sm">Approve</Button>
                  </div>
                </div>
              ))}
            </Card>
          </TabsContent>
          <TabsContent value="bookings">
            <Card className="p-6 space-y-3">
              <h2 className="text-xl font-semibold flex items-center gap-2"><Calendar className="h-5 w-5" /> Booking Management</h2>
              <div className="flex items-center justify-between p-3 rounded-md bg-muted">
                <span>Candidate C-3349 / 2026-05-02 / 10:00</span>
                <Badge>Confirmed</Badge>
              </div>
              <div className="flex gap-2">
                <Button variant="outline">Reschedule</Button>
                <Button variant="outline">Cancel Booking</Button>
              </div>
            </Card>
          </TabsContent>
          <TabsContent value="questions">
            <Card className="p-6 space-y-3">
              <h2 className="text-xl font-semibold flex items-center gap-2"><FileText className="h-5 w-5" /> Question Bank</h2>
              <p className="text-sm text-muted-foreground">Manage imports, edits and publish cycles for test papers.</p>
              <div className="flex gap-2">
                <Button>Import Questions</Button>
                <Button variant="outline">Publish Draft</Button>
              </div>
            </Card>
          </TabsContent>
          <TabsContent value="results">
            <Card className="p-6 space-y-3">
              <h2 className="text-xl font-semibold flex items-center gap-2"><BarChart3 className="h-5 w-5" /> Result Oversight</h2>
              <p className="text-sm">Pass rate this week: <strong>72%</strong></p>
              <Button variant="outline">Export Result Report</Button>
            </Card>
          </TabsContent>
          <TabsContent value="audit">
            <Card className="p-6 space-y-3">
              <h2 className="text-xl font-semibold flex items-center gap-2"><Settings className="h-5 w-5" /> Audit Log</h2>
              {["Admin A approved V-1024", "Admin B rejected V-1021", "Admin A published question set Q-14"].map((log) => (
                <div key={log} className="p-3 rounded-md bg-muted text-sm">{log}</div>
              ))}
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
