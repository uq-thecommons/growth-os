import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { API } from "../App";
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  Activity,
  RefreshCw,
  Clock,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";

export default function MeasurementPage() {
  const { workspaceId } = useParams();
  const [channels, setChannels] = useState([]);
  const [anomalies, setAnomalies] = useState({ detected_anomalies: [], active_alerts: [] });
  const [activations, setActivations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [workspaceId]);

  const fetchData = async () => {
    try {
      const [channelsRes, anomaliesRes, activationsRes] = await Promise.all([
        axios.get(`${API}/workspaces/${workspaceId}/channels`, {
          withCredentials: true,
        }),
        axios.get(`${API}/workspaces/${workspaceId}/ai/anomalies`, {
          withCredentials: true,
        }),
        axios.get(`${API}/workspaces/${workspaceId}/activations`, {
          withCredentials: true,
        }),
      ]);
      setChannels(channelsRes.data);
      setAnomalies(anomaliesRes.data);
      setActivations(activationsRes.data);
    } catch (error) {
      console.error("Failed to fetch measurement data:", error);
    } finally {
      setLoading(false);
    }
  };

  const HealthIcon = ({ status }) => {
    const icons = {
      green: <CheckCircle className="h-5 w-5 text-green-500" />,
      yellow: <AlertTriangle className="h-5 w-5 text-yellow-500" />,
      red: <XCircle className="h-5 w-5 text-red-500" />,
    };
    return icons[status] || icons.yellow;
  };

  const getChannelHealth = (channel) => {
    if (!channel.is_connected) return "red";
    if (channel.sync_status?.startsWith("error")) return "red";
    if (!channel.last_synced) return "yellow";
    
    const lastSync = new Date(channel.last_synced);
    const hoursSinceSync = (Date.now() - lastSync.getTime()) / (1000 * 60 * 60);
    
    if (hoursSinceSync > 24) return "yellow";
    return "green";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-zinc-500">Loading...</div>
      </div>
    );
  }

  const allAlerts = [
    ...anomalies.detected_anomalies,
    ...anomalies.active_alerts,
  ];

  return (
    <div className="space-y-6 animate-in" data-testid="measurement-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight">
            Measurement & Data Health
          </h1>
          <p className="text-zinc-500 mt-1">
            Monitor tracking health, events, and anomalies
          </p>
        </div>

        <Button
          variant="outline"
          className="border-zinc-800"
          onClick={fetchData}
          data-testid="refresh-btn"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-black border-zinc-800" data-testid="stat-healthy">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-mono uppercase text-zinc-500 tracking-wider">
                  Healthy Sources
                </p>
                <p className="text-3xl font-heading font-bold mt-1 text-green-500">
                  {channels.filter((c) => getChannelHealth(c) === "green").length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black border-zinc-800" data-testid="stat-warning">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-mono uppercase text-zinc-500 tracking-wider">
                  Warnings
                </p>
                <p className="text-3xl font-heading font-bold mt-1 text-yellow-500">
                  {channels.filter((c) => getChannelHealth(c) === "yellow").length}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black border-zinc-800" data-testid="stat-critical">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-mono uppercase text-zinc-500 tracking-wider">
                  Critical Issues
                </p>
                <p className="text-3xl font-heading font-bold mt-1 text-red-500">
                  {channels.filter((c) => getChannelHealth(c) === "red").length +
                    allAlerts.filter((a) => a.severity === "critical").length}
                </p>
              </div>
              <XCircle className="h-8 w-8 text-red-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Sources Health */}
      <Card className="bg-black border-zinc-800" data-testid="sources-health">
        <CardHeader>
          <CardTitle className="text-lg font-heading flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Data Sources Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {channels.map((channel) => {
              const health = getChannelHealth(channel);
              return (
                <div
                  key={channel.channel_id}
                  className="flex items-center justify-between p-4 border border-zinc-800 rounded-sm"
                >
                  <div className="flex items-center gap-4">
                    <HealthIcon status={health} />
                    <div>
                      <p className="font-medium">{channel.name}</p>
                      <p className="text-xs text-zinc-500 font-mono">
                        {channel.connector_type.toUpperCase()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    {channel.last_synced && (
                      <div className="flex items-center gap-2 text-sm text-zinc-500">
                        <Clock className="h-4 w-4" />
                        {new Date(channel.last_synced).toLocaleString()}
                      </div>
                    )}
                    <Badge
                      variant={
                        health === "green"
                          ? "default"
                          : health === "yellow"
                          ? "secondary"
                          : "destructive"
                      }
                      className={
                        health === "green"
                          ? "bg-green-900/50 text-green-400"
                          : health === "yellow"
                          ? "bg-yellow-900/50 text-yellow-400"
                          : ""
                      }
                    >
                      {health === "green"
                        ? "Healthy"
                        : health === "yellow"
                        ? "Warning"
                        : "Error"}
                    </Badge>
                  </div>
                </div>
              );
            })}

            {channels.length === 0 && (
              <div className="text-center py-8 text-zinc-500">
                No data sources configured
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Activation Definitions */}
      <Card className="bg-black border-zinc-800" data-testid="activations-card">
        <CardHeader>
          <CardTitle className="text-lg font-heading flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Activation Definitions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {activations.map((activation) => (
              <div
                key={activation.definition_id}
                className="flex items-center justify-between p-4 border border-zinc-800 rounded-sm"
              >
                <div>
                  <p className="font-medium">{activation.name}</p>
                  <p className="text-sm text-zinc-500">{activation.description}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="text-xs border-zinc-700">
                      {activation.rule?.rule_type}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={`text-xs ${
                        activation.confidence === "high"
                          ? "border-green-700 text-green-500"
                          : activation.confidence === "medium"
                          ? "border-yellow-700 text-yellow-500"
                          : "border-red-700 text-red-500"
                      }`}
                    >
                      {activation.confidence} confidence
                    </Badge>
                    <span className="text-xs text-zinc-500">
                      v{activation.version}
                    </span>
                  </div>
                </div>

                {activation.last_verified && (
                  <div className="text-right text-xs text-zinc-500">
                    Last verified:{" "}
                    {new Date(activation.last_verified).toLocaleDateString()}
                  </div>
                )}
              </div>
            ))}

            {activations.length === 0 && (
              <div className="text-center py-8 text-zinc-500">
                No activation definitions configured
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Alerts & Anomalies */}
      {allAlerts.length > 0 && (
        <Card
          className="bg-black border-zinc-800 border-red-900/50"
          data-testid="alerts-card"
        >
          <CardHeader>
            <CardTitle className="text-lg font-heading flex items-center gap-2 text-red-500">
              <AlertTriangle className="h-5 w-5" />
              Active Alerts & Anomalies
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {allAlerts.map((alert, i) => (
                <div
                  key={alert.alert_id || i}
                  className="flex items-center justify-between p-4 border border-zinc-800 rounded-sm"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        alert.severity === "critical"
                          ? "bg-red-500"
                          : alert.severity === "high"
                          ? "bg-orange-500"
                          : alert.severity === "medium"
                          ? "bg-yellow-500"
                          : "bg-zinc-500"
                      }`}
                    />
                    <div>
                      <p className="font-medium">{alert.title}</p>
                      <p className="text-sm text-zinc-500">{alert.description}</p>
                    </div>
                  </div>

                  <Badge
                    variant={
                      alert.severity === "critical" ? "destructive" : "outline"
                    }
                    className={
                      alert.severity === "high"
                        ? "border-orange-700 text-orange-500"
                        : alert.severity === "medium"
                        ? "border-yellow-700 text-yellow-500"
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
