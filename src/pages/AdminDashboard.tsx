import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Users, FileText, BarChart3, ShieldCheck, Calendar, RefreshCw, LogOut, Radio } from "lucide-react";
import {
  fetchAdminAudit,
  fetchAdminAttempts,
  fetchAdminBookings,
  fetchAdminLiveTests,
  fetchAdminStats,
  fetchVerificationQueue,
  postVerificationDecision,
  type AdminStats,
  type LiveTestSession,
  type VerificationQueueRow,
} from "@/lib/adminApi";
import { useAuthContext } from "@/components/auth/AuthProvider";
import VerificationDocumentsDialog from "@/components/admin/VerificationDocumentsDialog";
import { candidateHasDocument } from "@/lib/documentUrl";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [queue, setQueue] = useState<VerificationQueueRow[]>([]);
  const [bookings, setBookings] = useState<Record<string, unknown>[]>([]);
  const [attempts, setAttempts] = useState<Record<string, unknown>[]>([]);
  const [liveTests, setLiveTests] = useState<LiveTestSession[]>([]);
  const [audit, setAudit] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectTarget, setRejectTarget] = useState<VerificationQueueRow | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectSubmitting, setRejectSubmitting] = useState(false);
  const [documentsTarget, setDocumentsTarget] = useState<VerificationQueueRow | null>(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [s, q, b, a, au] = await Promise.all([
        fetchAdminStats(),
        fetchVerificationQueue(),
        fetchAdminBookings(),
        fetchAdminAttempts(),
        fetchAdminAudit(),
      ]);
      setStats(s);
      setQueue(q ?? []);
      setBookings((b as Record<string, unknown>[]) ?? []);
      setAttempts((a as Record<string, unknown>[]) ?? []);
      setAudit((au as Record<string, unknown>[]) ?? []);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const refreshLiveTests = useCallback(async () => {
    try {
      const sessions = await fetchAdminLiveTests();
      setLiveTests(sessions ?? []);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }, []);

  useEffect(() => {
    void refreshLiveTests();
    const interval = window.setInterval(() => void refreshLiveTests(), 5000);
    return () => window.clearInterval(interval);
  }, [refreshLiveTests]);

  const approveCandidate = async (profileId: string) => {
    try {
      await postVerificationDecision(profileId, "approved");
      toast.success("Profile approved.");
      await loadAll();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const submitRejection = async () => {
    if (!rejectTarget) return;
    if (!rejectReason.trim()) {
      toast.error("Please enter a rejection reason.");
      return;
    }
    setRejectSubmitting(true);
    try {
      await postVerificationDecision(rejectTarget.id, "rejected", rejectReason.trim());
      toast.success("Profile rejected.");
      setRejectTarget(null);
      setRejectReason("");
      await loadAll();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setRejectSubmitting(false);
    }
  };

  const { logout } = useAuthContext();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const passRate =
    stats && stats.totalAttempts > 0
      ? Math.round((stats.passedAttempts / stats.totalAttempts) * 100)
      : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/20 to-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold">Verifier console</h1>
            <p className="text-muted-foreground">Review candidates, bookings, and test attempts.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => void loadAll()} disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button variant="ghost" onClick={() => void handleLogout()}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Profiles</p>
                <p className="text-2xl font-bold">{stats?.totalProfiles ?? "—"}</p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-amber-500/10">
                <ShieldCheck className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending verification</p>
                <p className="text-2xl font-bold">{stats?.pendingVerification ?? "—"}</p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-success/10">
                <FileText className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active questions</p>
                <p className="text-2xl font-bold">{stats?.activeQuestions ?? "—"}</p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-secondary/10">
                <BarChart3 className="h-6 w-6 text-secondary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pass rate (stored attempts)</p>
                <p className="text-2xl font-bold">{stats?.totalAttempts ? `${passRate}%` : "—"}</p>
              </div>
            </div>
          </Card>
        </div>

        <Tabs defaultValue="live" className="space-y-4">
          <TabsList className="grid w-full max-w-4xl grid-cols-5">
            <TabsTrigger value="live">Live tests</TabsTrigger>
            <TabsTrigger value="verification">Verification</TabsTrigger>
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
            <TabsTrigger value="attempts">Attempts</TabsTrigger>
            <TabsTrigger value="audit">Audit</TabsTrigger>
          </TabsList>
          <TabsContent value="live">
            <Card className="p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Radio className="h-5 w-5 text-destructive animate-pulse" />
                  Candidates taking the test now
                </h2>
                <p className="text-sm text-muted-foreground">Refreshes every 5 seconds</p>
              </div>
              {liveTests.length === 0 ? (
                <p className="text-sm text-muted-foreground">No active test sessions right now.</p>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {liveTests.map((session) => {
                    const name = `${(session.first_name ?? "").trim()} ${(session.surname ?? "").trim()}`.trim();
                    const progress =
                      session.total_questions > 0
                        ? Math.round((session.current_question / session.total_questions) * 100)
                        : 0;
                    const flagged = session.tab_switches > 0 || session.face_missing_events > 0;

                    return (
                      <Card key={session.profile_id} className="overflow-hidden border-2 p-0">
                        <div className="aspect-video bg-muted flex items-center justify-center">
                          {session.latest_snapshot_data ? (
                            <img
                              src={session.latest_snapshot_data}
                              alt={`Webcam feed for ${name || session.email}`}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <p className="text-sm text-muted-foreground px-4 text-center">
                              Waiting for webcam snapshot…
                            </p>
                          )}
                        </div>
                        <div className="space-y-3 p-4">
                          <div>
                            <p className="font-medium">{name || "Candidate"}</p>
                            <p className="text-xs text-muted-foreground">{session.email}</p>
                          </div>
                          <div className="text-sm">
                            Question {session.current_question} of {session.total_questions} ·{" "}
                            {session.answered_count} answered
                          </div>
                          <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                            <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
                          </div>
                          <div className="flex flex-wrap gap-2 text-xs">
                            {flagged ? (
                              <Badge variant="destructive">Review signals</Badge>
                            ) : (
                              <Badge variant="secondary">Monitoring OK</Badge>
                            )}
                            {session.tab_switches > 0 ? (
                              <Badge variant="outline">Tab switches: {session.tab_switches}</Badge>
                            ) : null}
                            {session.face_missing_events > 0 ? (
                              <Badge variant="outline">Face missing: {session.face_missing_events}</Badge>
                            ) : null}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Started {new Date(session.started_at).toLocaleTimeString()}
                          </p>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </Card>
          </TabsContent>
          <TabsContent value="verification">
            <Card className="p-6 space-y-3">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <ShieldCheck className="h-5 w-5" /> Queue
              </h2>
              {queue.length === 0 ? (
                <p className="text-sm text-muted-foreground">No pending candidate profiles.</p>
              ) : (
                <ul className="space-y-2">
                  {queue.map((row) => (
                    <li
                      key={row.id}
                      className="flex flex-col gap-3 rounded-md border p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="text-sm">
                        <p className="font-medium">
                          {(row.first_name ?? "").trim()} {(row.surname ?? "").trim()}
                        </p>
                        <p className="text-muted-foreground">{row.email}</p>
                        {row.id_number ? <p className="text-xs text-muted-foreground">ID: {row.id_number}</p> : null}
                        <p className="text-xs text-muted-foreground mt-1">
                          {[
                            candidateHasDocument(row.has_id_copy, row.id_copy_path, null) && "ID",
                            candidateHasDocument(row.has_passport_copy, row.passport_copy_path, null) && "Passport",
                            candidateHasDocument(row.has_face_capture, row.face_capture_path, null) && "Face",
                          ]
                            .filter(Boolean)
                            .join(" · ") || "No files on record"}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setDocumentsTarget(row)}
                        >
                          View documents
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setRejectTarget(row)}>
                          Reject
                        </Button>
                        <Button size="sm" onClick={() => void approveCandidate(row.id)}>
                          Approve
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </TabsContent>
          <TabsContent value="bookings">
            <Card className="p-6 space-y-2">
              <h2 className="text-xl font-semibold flex items-center gap-2 mb-2">
                <Calendar className="h-5 w-5" /> Recent bookings
              </h2>
              {bookings.length === 0 ? (
                <p className="text-sm text-muted-foreground">No bookings yet.</p>
              ) : (
                <ul className="divide-y rounded-md border">
                  {bookings.map((b) => (
                    <li key={String(b.id)} className="flex flex-wrap items-center justify-between gap-2 p-3 text-sm">
                      <span>
                        {(b.email as string) ?? ""} · {String(b.booking_date)} {String(b.slot_time)}
                      </span>
                      <Badge variant="secondary">{String(b.status)}</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </TabsContent>
          <TabsContent value="attempts">
            <Card className="p-6 space-y-2">
              <h2 className="text-xl font-semibold flex items-center gap-2 mb-2">
                <BarChart3 className="h-5 w-5" /> Recent attempts
              </h2>
              {attempts.length === 0 ? (
                <p className="text-sm text-muted-foreground">No attempts recorded.</p>
              ) : (
                <ul className="divide-y rounded-md border">
                  {attempts.map((a) => (
                    <li key={String(a.id)} className="flex flex-wrap items-center justify-between gap-2 p-3 text-sm">
                      <span>{(a.email as string) ?? ""}</span>
                      <span>
                        {String(a.score)}/{String(a.total)} — {Number(a.percentage).toFixed(1)}%
                        {a.passed ? (
                          <Badge className="ml-2">Pass</Badge>
                        ) : (
                          <Badge variant="destructive" className="ml-2">
                            Fail
                          </Badge>
                        )}
                        {a.review_flagged ? (
                          <Badge variant="outline" className="ml-2">
                            Flagged
                          </Badge>
                        ) : null}
                        {a.suspicion_score ? (
                          <span className="ml-2 text-xs text-muted-foreground">
                            Suspicion {String(a.suspicion_score)}
                          </span>
                        ) : null}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </TabsContent>
          <TabsContent value="audit">
            <Card className="p-6 space-y-2">
              <h2 className="text-xl font-semibold flex items-center gap-2 mb-2">
                <ShieldCheck className="h-5 w-5" /> Admin audit trail
              </h2>
              {audit.length === 0 ? (
                <p className="text-sm text-muted-foreground">No audit events yet.</p>
              ) : (
                <ul className="divide-y rounded-md border">
                  {audit.map((item) => (
                    <li key={String(item.id)} className="p-3 text-sm">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-medium">{String(item.action)}</span>
                        <span className="text-xs text-muted-foreground">{String(item.created_at)}</span>
                      </div>
                      <p className="text-muted-foreground text-xs mt-1">
                        Admin: {String(item.admin_email ?? "unknown")} · Target: {String(item.target_type)}:{String(item.target_id)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </TabsContent>
        </Tabs>

        <VerificationDocumentsDialog
          candidate={documentsTarget}
          open={documentsTarget !== null}
          onOpenChange={(open) => {
            if (!open) setDocumentsTarget(null);
          }}
        />

        <Dialog
          open={rejectTarget !== null}
          onOpenChange={(open) => {
            if (!open && !rejectSubmitting) {
              setRejectTarget(null);
              setRejectReason("");
            }
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject application</DialogTitle>
              <DialogDescription>
                {rejectTarget
                  ? `Explain why ${(rejectTarget.first_name ?? "").trim()} ${(rejectTarget.surname ?? "").trim()} was not approved. The candidate will see this message on their portal.`
                  : "Provide a reason for rejection."}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor="rejection-reason">Reason for rejection</Label>
              <Textarea
                id="rejection-reason"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. ID copy is unclear, face photo does not match ID, or documents are expired."
                rows={4}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={rejectSubmitting}
                onClick={() => {
                  setRejectTarget(null);
                  setRejectReason("");
                }}
              >
                Cancel
              </Button>
              <Button type="button" variant="destructive" disabled={rejectSubmitting} onClick={() => void submitRejection()}>
                {rejectSubmitting ? "Sending…" : "Send rejection"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default AdminDashboard;
