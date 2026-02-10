import React, { useState, useEffect } from "react";
import axios from "axios";
import { API } from "../App";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
  Beaker,
  TrendingUp,
  TrendingDown,
  Minus,
  Plus,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import AddClientModal from "../components/AddClientModal";

export default function CommandCenter() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddClient, setShowAddClient] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
    seedIfNeeded();
  }, []);

  const seedIfNeeded = async () => {
    try {
      await axios.post(`${API}/seed`, {});
    } catch (error) {
      // Ignore if already seeded
    }
  };

  const fetchData = async () => {
    try {
      const response = await axios.get(`${API}/command-center`, {
        withCredentials: true,
      });
      setData(response.data);
    } catch (error) {
      console.error("Failed to fetch command center:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleClientAdded = () => {
    fetchData(); // Refresh data
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-zinc-500">Loading...</div>
      </div>
    );
  }

  const HealthIndicator = ({ status }) => {
    const colors = {
      green: "bg-green-500",
      yellow: "bg-yellow-500",
      red: "bg-red-500",
    };
    return <div className={`w-2 h-2 rounded-full ${colors[status] || "bg-zinc-500"}`} />;
  };

  const TrendIndicator = ({ value }) => {
    if (value > 0) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (value < 0) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-zinc-500" />;
  };

  return (
    <>
      <AddClientModal
        isOpen={showAddClient}
        onClose={() => setShowAddClient(false)}
        onSuccess={handleClientAdded}
      />
      
      <div className="space-y-8 animate-in" data-testid="command-center">
        {/* Header */}
        <div>
          <div className="flex items-center justify-between">
            <h1 className="font-heading text-4xl font-bold tracking-tight">
              Command Center
            </h1>
            <button
              onClick={() => setShowAddClient(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-lg hover:bg-zinc-200 transition-colors font-medium"
            >
              <Plus className="h-4 w-4" />
              Add New Client
            </button>
          </div>
          <p className="text-zinc-500 mt-2">
            Overview of all client workspaces and operations
          </p>
        </div>

        {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-black border-zinc-800" data-testid="stat-at-risk">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-mono uppercase text-zinc-500 tracking-wider">
                  At Risk
                </p>
                <p className="text-3xl font-heading font-bold mt-1">
                  {data?.at_risk_workspaces?.length || 0}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black border-zinc-800" data-testid="stat-decisions">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-mono uppercase text-zinc-500 tracking-wider">
                  Needing Decision
                </p>
                <p className="text-3xl font-heading font-bold mt-1">
                  {data?.experiments_needing_decisions?.length || 0}
                </p>
              </div>
              <Beaker className="h-8 w-8 text-yellow-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black border-zinc-800" data-testid="stat-reports">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-mono uppercase text-zinc-500 tracking-wider">
                  Reports Due
                </p>
                <p className="text-3xl font-heading font-bold mt-1">
                  {data?.report_status?.filter((r) => r.report?.status === "draft").length || 0}
                </p>
              </div>
              <FileText className="h-8 w-8 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black border-zinc-800" data-testid="stat-health">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-mono uppercase text-zinc-500 tracking-wider">
                  Tracking Issues
                </p>
                <p className="text-3xl font-heading font-bold mt-1">
                  {data?.tracking_health?.filter((t) => t.health !== "green").length || 0}
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-orange-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* At Risk Workspaces */}
        <Card className="bg-black border-zinc-800" data-testid="at-risk-section">
          <CardHeader>
            <CardTitle className="text-lg font-heading flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              At-Risk Workspaces
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data?.at_risk_workspaces?.length === 0 ? (
              <div className="text-center py-8 text-zinc-500">
                <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                All workspaces healthy
              </div>
            ) : (
              <div className="space-y-3">
                {data?.at_risk_workspaces?.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 border border-zinc-800 rounded-sm hover:border-zinc-700 cursor-pointer transition-colors"
                    onClick={() => navigate(`/workspace/${item.workspace?.workspace_id}`)}
                  >
                    <div>
                      <p className="font-medium">{item.workspace?.name}</p>
                      <p className="text-sm text-zinc-500">{item.reason}</p>
                    </div>
                    <Badge variant="destructive">At Risk</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Experiments Needing Decisions */}
        <Card className="bg-black border-zinc-800" data-testid="decisions-section">
          <CardHeader>
            <CardTitle className="text-lg font-heading flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-500" />
              Experiments Needing Decisions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data?.experiments_needing_decisions?.length === 0 ? (
              <div className="text-center py-8 text-zinc-500">
                <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                No pending decisions
              </div>
            ) : (
              <div className="space-y-3">
                {data?.experiments_needing_decisions?.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 border border-zinc-800 rounded-sm hover:border-zinc-700 cursor-pointer transition-colors"
                    onClick={() =>
                      navigate(`/workspace/${item.workspace?.workspace_id}/experiments`)
                    }
                  >
                    <div>
                      <p className="font-medium">{item.experiment?.name}</p>
                      <p className="text-sm text-zinc-500">{item.workspace?.name}</p>
                    </div>
                    <Badge variant="outline" className="border-yellow-500 text-yellow-500">
                      Analyzing
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Report Status */}
        <Card className="bg-black border-zinc-800" data-testid="reports-section">
          <CardHeader>
            <CardTitle className="text-lg font-heading flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-500" />
              Weekly Report Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data?.report_status?.map((item, i) => {
                const statusColors = {
                  draft: "border-zinc-500 text-zinc-500",
                  internal_review: "border-yellow-500 text-yellow-500",
                  client_ready: "border-blue-500 text-blue-500",
                  sent: "border-green-500 text-green-500",
                  archived: "border-zinc-600 text-zinc-600",
                };
                return (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 border border-zinc-800 rounded-sm hover:border-zinc-700 cursor-pointer transition-colors"
                    onClick={() => navigate("/reports")}
                  >
                    <div>
                      <p className="font-medium">{item.workspace?.name}</p>
                      <p className="text-xs text-zinc-500 font-mono">
                        Week of {new Date(item.report?.week_start).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={statusColors[item.report?.status] || ""}
                    >
                      {item.report?.status?.replace("_", " ")}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Tracking Health */}
        <Card className="bg-black border-zinc-800" data-testid="tracking-section">
          <CardHeader>
            <CardTitle className="text-lg font-heading flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              Tracking Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data?.tracking_health?.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 border border-zinc-800 rounded-sm"
                >
                  <div className="flex items-center gap-3">
                    <HealthIndicator status={item.health} />
                    <div>
                      <p className="font-medium">{item.channel?.name}</p>
                      <p className="text-xs text-zinc-500">{item.workspace?.name}</p>
                    </div>
                  </div>
                  <span className="text-xs text-zinc-500 font-mono">
                    {item.channel?.last_synced
                      ? `Synced ${new Date(item.channel.last_synced).toLocaleTimeString()}`
                      : "Never synced"}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
    </>
  );
}
