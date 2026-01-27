import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { API, AuthContext } from "../App";
import {
  Plus,
  FileText,
  Check,
  Send,
  Archive,
  Sparkles,
  Link as LinkIcon,
  ChevronRight,
  Eye,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Calendar } from "../components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../components/ui/popover";
import { format } from "date-fns";
import { toast } from "sonner";

const STATUS_FLOW = ["draft", "internal_review", "client_ready", "sent", "archived"];

const STATUS_CONFIG = {
  draft: { label: "Draft", color: "border-zinc-600 text-zinc-400", icon: FileText },
  internal_review: { label: "Internal Review", color: "border-yellow-600 text-yellow-400", icon: Eye },
  client_ready: { label: "Client Ready", color: "border-blue-600 text-blue-400", icon: Check },
  sent: { label: "Sent", color: "border-green-600 text-green-400", icon: Send },
  archived: { label: "Archived", color: "border-zinc-700 text-zinc-500", icon: Archive },
};

export default function ReportsPage() {
  const { user } = useContext(AuthContext);
  const [workspaces, setWorkspaces] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedWorkspace, setSelectedWorkspace] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [newReport, setNewReport] = useState({
    week_start: new Date(),
    week_end: new Date(),
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const wsRes = await axios.get(`${API}/workspaces`, { withCredentials: true });
      setWorkspaces(wsRes.data);

      // Fetch reports for each workspace
      const allReports = [];
      for (const ws of wsRes.data) {
        try {
          const reportsRes = await axios.get(
            `${API}/workspaces/${ws.workspace_id}/reports`,
            { withCredentials: true }
          );
          allReports.push(
            ...reportsRes.data.map((r) => ({
              ...r,
              workspace_name: ws.name,
            }))
          );
        } catch (e) {
          // Skip if no access
        }
      }
      setReports(allReports);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  const createReport = async () => {
    if (!selectedWorkspace) return;
    try {
      await axios.post(
        `${API}/workspaces/${selectedWorkspace}/reports`,
        {
          week_start: newReport.week_start.toISOString(),
          week_end: newReport.week_end.toISOString(),
        },
        { withCredentials: true }
      );
      toast.success("Report created");
      setShowCreateDialog(false);
      fetchData();
    } catch (error) {
      toast.error("Failed to create report");
    }
  };

  const generateDraft = async (workspaceId, reportId) => {
    setGenerating(true);
    try {
      const response = await axios.post(
        `${API}/workspaces/${workspaceId}/reports/${reportId}/generate-draft`,
        {},
        { withCredentials: true }
      );
      toast.success("AI draft generated");
      fetchData();
      return response.data.draft;
    } catch (error) {
      toast.error("Failed to generate draft");
    } finally {
      setGenerating(false);
    }
  };

  const approveReport = async (workspaceId, reportId) => {
    try {
      await axios.post(
        `${API}/workspaces/${workspaceId}/reports/${reportId}/approve`,
        {},
        { withCredentials: true }
      );
      toast.success("Report approved");
      fetchData();
    } catch (error) {
      toast.error("Failed to approve report");
    }
  };

  const updateReportStatus = async (workspaceId, reportId, status) => {
    try {
      await axios.put(
        `${API}/workspaces/${workspaceId}/reports/${reportId}`,
        { status },
        { withCredentials: true }
      );
      toast.success("Report status updated");
      fetchData();
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-zinc-500">Loading...</div>
      </div>
    );
  }

  // Group reports by status
  const reportsByStatus = STATUS_FLOW.reduce((acc, status) => {
    acc[status] = reports.filter((r) => r.status === status);
    return acc;
  }, {});

  return (
    <div className="space-y-6 animate-in" data-testid="reports-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight">
            Weekly Reports
          </h1>
          <p className="text-zinc-500 mt-1">
            {reports.length} reports across all workspaces
          </p>
        </div>

        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button
              className="bg-white text-black hover:bg-zinc-200 rounded-full"
              data-testid="create-report-btn"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Report
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-zinc-900 border-zinc-800">
            <DialogHeader>
              <DialogTitle className="font-heading">Create Weekly Report</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Workspace</Label>
                <select
                  value={selectedWorkspace || ""}
                  onChange={(e) => setSelectedWorkspace(e.target.value)}
                  className="w-full mt-1 bg-black border border-zinc-800 rounded-sm p-2 text-white"
                  data-testid="workspace-select"
                >
                  <option value="">Select workspace</option>
                  {workspaces.map((ws) => (
                    <option key={ws.workspace_id} value={ws.workspace_id}>
                      {ws.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Week Start</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full mt-1 justify-start border-zinc-800"
                      >
                        {format(newReport.week_start, "PPP")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="bg-zinc-900 border-zinc-800 p-0">
                      <Calendar
                        mode="single"
                        selected={newReport.week_start}
                        onSelect={(date) =>
                          setNewReport({ ...newReport, week_start: date || new Date() })
                        }
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Label>Week End</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full mt-1 justify-start border-zinc-800"
                      >
                        {format(newReport.week_end, "PPP")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="bg-zinc-900 border-zinc-800 p-0">
                      <Calendar
                        mode="single"
                        selected={newReport.week_end}
                        onSelect={(date) =>
                          setNewReport({ ...newReport, week_end: date || new Date() })
                        }
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <Button
                onClick={createReport}
                className="w-full bg-white text-black hover:bg-zinc-200"
                disabled={!selectedWorkspace}
                data-testid="create-report-submit"
              >
                Create Report
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Reports by Status */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {STATUS_FLOW.map((status) => {
          const config = STATUS_CONFIG[status];
          const Icon = config.icon;
          const statusReports = reportsByStatus[status] || [];

          return (
            <div key={status} data-testid={`report-column-${status}`}>
              <div className="flex items-center gap-2 mb-3">
                <Icon className="h-4 w-4 text-zinc-500" />
                <h3 className="text-sm font-mono uppercase text-zinc-500 tracking-wider">
                  {config.label}
                </h3>
                <Badge variant="outline" className="border-zinc-700 ml-auto">
                  {statusReports.length}
                </Badge>
              </div>

              <div className="space-y-3">
                {statusReports.map((report) => (
                  <Card
                    key={report.report_id}
                    className="bg-black border-zinc-800 hover:border-zinc-700 cursor-pointer transition-colors"
                    onClick={() => setSelectedReport(report)}
                    data-testid={`report-card-${report.report_id}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div>
                          <p className="font-medium text-sm">
                            {report.workspace_name}
                          </p>
                          <p className="text-xs text-zinc-500 font-mono">
                            Week of{" "}
                            {new Date(report.week_start).toLocaleDateString()}
                          </p>
                        </div>
                        {report.is_ai_generated && (
                          <Sparkles className="h-4 w-4 text-purple-500" />
                        )}
                      </div>

                      {report.content?.exec_summary?.length > 0 && (
                        <p className="text-xs text-zinc-400 line-clamp-2 mb-3">
                          {report.content.exec_summary[0]}
                        </p>
                      )}

                      <div className="flex items-center gap-2">
                        {status === "draft" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-zinc-800 text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              generateDraft(report.workspace_id, report.report_id);
                            }}
                            disabled={generating}
                            data-testid={`generate-draft-${report.report_id}`}
                          >
                            <Sparkles className="h-3 w-3 mr-1" />
                            {generating ? "..." : "AI Draft"}
                          </Button>
                        )}
                        {(status === "draft" || status === "internal_review") && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-zinc-800 text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              approveReport(report.workspace_id, report.report_id);
                            }}
                            data-testid={`approve-${report.report_id}`}
                          >
                            <Check className="h-3 w-3 mr-1" />
                            Approve
                          </Button>
                        )}
                        {report.share_link && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigator.clipboard.writeText(
                                `${window.location.origin}/report/${report.share_link}`
                              );
                              toast.success("Link copied!");
                            }}
                          >
                            <LinkIcon className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {statusReports.length === 0 && (
                  <div className="border border-dashed border-zinc-800 rounded-sm p-4 text-center">
                    <p className="text-xs text-zinc-600">No reports</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Report Detail Dialog */}
      <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
        <DialogContent className="bg-zinc-900 border-zinc-800 max-w-2xl max-h-[80vh] overflow-y-auto">
          {selectedReport && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <DialogTitle className="font-heading">
                      {selectedReport.workspace_name} - Weekly Report
                    </DialogTitle>
                    <p className="text-sm text-zinc-500 mt-1">
                      Week of{" "}
                      {new Date(selectedReport.week_start).toLocaleDateString()} -{" "}
                      {new Date(selectedReport.week_end).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant="outline" className={STATUS_CONFIG[selectedReport.status]?.color}>
                    {STATUS_CONFIG[selectedReport.status]?.label}
                  </Badge>
                </div>
              </DialogHeader>

              <div className="space-y-6 mt-4">
                {/* AI Draft */}
                {selectedReport.ai_draft && (
                  <div className="p-4 border border-purple-900/50 bg-purple-900/10 rounded-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="h-4 w-4 text-purple-500" />
                      <span className="text-xs font-mono uppercase text-purple-500">
                        AI DRAFT - Requires Human Review
                      </span>
                    </div>
                    <div className="prose prose-invert prose-sm max-w-none">
                      <pre className="whitespace-pre-wrap text-sm text-zinc-300 font-sans">
                        {selectedReport.ai_draft}
                      </pre>
                    </div>
                  </div>
                )}

                {/* Executive Summary */}
                {selectedReport.content?.exec_summary?.length > 0 && (
                  <div>
                    <h4 className="text-xs font-mono uppercase text-zinc-500 mb-2">
                      Executive Summary
                    </h4>
                    <ul className="space-y-2">
                      {selectedReport.content.exec_summary.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <span className="text-zinc-500">•</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* What Shipped */}
                {selectedReport.content?.what_shipped?.length > 0 && (
                  <div>
                    <h4 className="text-xs font-mono uppercase text-zinc-500 mb-2">
                      What Shipped
                    </h4>
                    <ul className="space-y-2">
                      {selectedReport.content.what_shipped.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Learnings */}
                {selectedReport.content?.learnings?.length > 0 && (
                  <div>
                    <h4 className="text-xs font-mono uppercase text-zinc-500 mb-2">
                      Key Learnings
                    </h4>
                    <ul className="space-y-2">
                      {selectedReport.content.learnings.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <span className="text-zinc-500">{i + 1}.</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-3 pt-4 border-t border-zinc-800">
                  {selectedReport.status === "draft" && (
                    <>
                      <Button
                        variant="outline"
                        className="border-zinc-800"
                        onClick={() =>
                          generateDraft(
                            selectedReport.workspace_id,
                            selectedReport.report_id
                          )
                        }
                        disabled={generating}
                      >
                        <Sparkles className="h-4 w-4 mr-2" />
                        {generating ? "Generating..." : "Generate AI Draft"}
                      </Button>
                      <Button
                        className="bg-white text-black hover:bg-zinc-200"
                        onClick={() => {
                          approveReport(
                            selectedReport.workspace_id,
                            selectedReport.report_id
                          );
                          setSelectedReport(null);
                        }}
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Approve & Share
                      </Button>
                    </>
                  )}
                  {selectedReport.status === "client_ready" && (
                    <Button
                      className="bg-white text-black hover:bg-zinc-200"
                      onClick={() => {
                        updateReportStatus(
                          selectedReport.workspace_id,
                          selectedReport.report_id,
                          "sent"
                        );
                        setSelectedReport(null);
                      }}
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Mark as Sent
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
