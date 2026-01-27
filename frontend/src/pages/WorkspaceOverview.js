import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { API } from "../App";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Target,
  AlertCircle,
  Beaker,
  Edit2,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Progress } from "../components/ui/progress";

export default function WorkspaceOverview() {
  const { workspaceId } = useParams();
  const navigate = useNavigate();
  const [workspace, setWorkspace] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWorkspace();
  }, [workspaceId]);

  const fetchWorkspace = async () => {
    try {
      const response = await axios.get(`${API}/workspaces/${workspaceId}`, {
        withCredentials: true,
      });
      setWorkspace(response.data);
    } catch (error) {
      console.error("Failed to fetch workspace:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-zinc-500">Loading...</div>
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="text-center py-12">
        <p className="text-zinc-500">Workspace not found</p>
      </div>
    );
  }

  const TrendIndicator = ({ value }) => {
    if (value > 0)
      return (
        <span className="flex items-center gap-1 text-green-500">
          <TrendingUp className="h-4 w-4" />
          {value > 0 ? "+" : ""}{value.toFixed(1)}%
        </span>
      );
    if (value < 0)
      return (
        <span className="flex items-center gap-1 text-red-500">
          <TrendingDown className="h-4 w-4" />
          {value.toFixed(1)}%
        </span>
      );
    return (
      <span className="flex items-center gap-1 text-zinc-500">
        <Minus className="h-4 w-4" />
        0%
      </span>
    );
  };

  const nsm = workspace.north_star;
  const progress = nsm ? (nsm.current_value / nsm.target_value) * 100 : 0;

  return (
    <div className="space-y-8 animate-in" data-testid="workspace-overview">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-heading text-4xl font-bold tracking-tight">
            {workspace.name}
          </h1>
          <p className="text-zinc-500 mt-2">{workspace.description}</p>
        </div>
        <Button
          variant="outline"
          className="border-zinc-800"
          data-testid="edit-workspace-btn"
        >
          <Edit2 className="h-4 w-4 mr-2" />
          Edit
        </Button>
      </div>

      {/* North Star Metric */}
      {nsm && (
        <Card className="bg-black border-zinc-800" data-testid="north-star-card">
          <CardHeader>
            <CardTitle className="text-sm font-mono uppercase text-zinc-500 tracking-wider flex items-center gap-2">
              <Target className="h-4 w-4" />
              North Star Metric
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-5xl font-heading font-bold">
                    {nsm.current_value.toLocaleString()}
                  </p>
                  <p className="text-zinc-500 mt-1">{nsm.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-zinc-500">Target</p>
                  <p className="text-2xl font-heading">
                    {nsm.target_value.toLocaleString()} {nsm.unit}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Progress to target</span>
                  <span className="font-mono">{Math.min(progress, 100).toFixed(0)}%</span>
                </div>
                <Progress value={Math.min(progress, 100)} className="h-2" />
              </div>

              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-zinc-800">
                <div>
                  <p className="text-xs text-zinc-500 mb-1">7-day trend</p>
                  <TrendIndicator value={nsm.trend_7d} />
                </div>
                <div>
                  <p className="text-xs text-zinc-500 mb-1">30-day trend</p>
                  <TrendIndicator value={nsm.trend_30d} />
                </div>
                <div>
                  <p className="text-xs text-zinc-500 mb-1">90-day trend</p>
                  <TrendIndicator value={nsm.trend_90d} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Current Constraint */}
        <Card className="bg-black border-zinc-800" data-testid="constraint-card">
          <CardHeader>
            <CardTitle className="text-sm font-mono uppercase text-zinc-500 tracking-wider">
              Current Constraint
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg text-white">
              {workspace.current_constraint || "No constraint defined"}
            </p>
          </CardContent>
        </Card>

        {/* This Week's Focus */}
        <Card className="bg-black border-zinc-800 lg:col-span-2" data-testid="focus-card">
          <CardHeader>
            <CardTitle className="text-sm font-mono uppercase text-zinc-500 tracking-wider">
              This Week's Focus
            </CardTitle>
          </CardHeader>
          <CardContent>
            {workspace.this_week_focus?.length > 0 ? (
              <ul className="space-y-3">
                {workspace.this_week_focus.map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="text-zinc-500 font-mono text-sm">{i + 1}.</span>
                    <span className="text-white">{item}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-zinc-500">No focus items defined</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Funnel Snapshot */}
      {workspace.funnel && (
        <Card className="bg-black border-zinc-800" data-testid="funnel-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-mono uppercase text-zinc-500 tracking-wider">
              Funnel Snapshot
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/workspace/${workspaceId}/funnel`)}
              data-testid="view-funnel-btn"
            >
              View Builder
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 overflow-x-auto pb-4">
              {workspace.funnel.steps?.map((step, i) => (
                <React.Fragment key={step.step_id}>
                  <div className="flex-shrink-0 p-4 border border-zinc-800 rounded-sm min-w-[150px]">
                    <p className="text-xs text-zinc-500 mb-1">{step.name}</p>
                    <p className="text-2xl font-heading font-bold">
                      {step.volume?.toLocaleString() || 0}
                    </p>
                    <p className="text-xs text-zinc-500 mt-1">
                      {step.conversion_rate}% conv.
                    </p>
                  </div>
                  {i < workspace.funnel.steps.length - 1 && (
                    <ChevronRight className="h-5 w-5 text-zinc-600 flex-shrink-0" />
                  )}
                </React.Fragment>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {Object.entries(workspace.experiment_counts || {}).map(([status, count]) => (
          <Card
            key={status}
            className="bg-black border-zinc-800 cursor-pointer hover:border-zinc-700 transition-colors"
            onClick={() => navigate(`/workspace/${workspaceId}/experiments`)}
            data-testid={`exp-count-${status}`}
          >
            <CardContent className="pt-4">
              <p className="text-xs text-zinc-500 capitalize">{status.replace("_", " ")}</p>
              <p className="text-2xl font-heading font-bold mt-1">{count}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Active Alerts */}
      {workspace.active_alerts?.length > 0 && (
        <Card className="bg-black border-zinc-800 border-red-900/50" data-testid="alerts-card">
          <CardHeader>
            <CardTitle className="text-sm font-mono uppercase text-red-500 tracking-wider flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Active Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {workspace.active_alerts.map((alert) => (
                <div
                  key={alert.alert_id}
                  className="flex items-center justify-between p-3 border border-zinc-800 rounded-sm"
                >
                  <div>
                    <p className="font-medium">{alert.title}</p>
                    <p className="text-sm text-zinc-500">{alert.description}</p>
                  </div>
                  <Badge
                    variant={alert.severity === "critical" ? "destructive" : "outline"}
                    className={
                      alert.severity === "high"
                        ? "border-orange-500 text-orange-500"
                        : alert.severity === "medium"
                        ? "border-yellow-500 text-yellow-500"
                        : ""
                    }
                  >
                    {alert.severity}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
