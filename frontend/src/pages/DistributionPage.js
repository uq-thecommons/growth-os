import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { API } from "../App";
import {
  RefreshCw,
  TrendingUp,
  TrendingDown,
  DollarSign,
  MousePointer,
  Eye,
  Target,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { toast } from "sonner";

export default function DistributionPage() {
  const { workspaceId } = useParams();
  const [channels, setChannels] = useState([]);
  const [performance, setPerformance] = useState({});
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState({});

  useEffect(() => {
    fetchData();
  }, [workspaceId]);

  const fetchData = async () => {
    try {
      const [channelsRes, perfRes] = await Promise.all([
        axios.get(`${API}/workspaces/${workspaceId}/channels`, {
          withCredentials: true,
        }),
        axios.get(`${API}/workspaces/${workspaceId}/performance`, {
          withCredentials: true,
        }),
      ]);
      setChannels(channelsRes.data);
      setPerformance(perfRes.data);
    } catch (error) {
      console.error("Failed to fetch distribution data:", error);
    } finally {
      setLoading(false);
    }
  };

  const syncChannel = async (channelId) => {
    setSyncing({ ...syncing, [channelId]: true });
    try {
      await axios.post(
        `${API}/workspaces/${workspaceId}/channels/${channelId}/sync`,
        {},
        { withCredentials: true }
      );
      toast.success("Channel synced successfully");
      fetchData();
    } catch (error) {
      toast.error("Sync failed");
    } finally {
      setSyncing({ ...syncing, [channelId]: false });
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value) => {
    return new Intl.NumberFormat("en-US").format(value);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-zinc-500">Loading...</div>
      </div>
    );
  }

  // Calculate totals
  const totalSpend = Object.values(performance).reduce(
    (acc, p) => acc + (p.metrics?.total_spend || 0),
    0
  );
  const totalImpressions = Object.values(performance).reduce(
    (acc, p) => acc + (p.metrics?.total_impressions || 0),
    0
  );
  const totalClicks = Object.values(performance).reduce(
    (acc, p) => acc + (p.metrics?.total_clicks || 0),
    0
  );
  const totalConversions = Object.values(performance).reduce(
    (acc, p) => acc + (p.metrics?.total_conversions || 0),
    0
  );

  return (
    <div className="space-y-6 animate-in" data-testid="distribution-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight">
            Distribution Hub
          </h1>
          <p className="text-zinc-500 mt-1">
            {channels.length} connected channels
          </p>
        </div>

        <Button
          variant="outline"
          className="border-zinc-800"
          onClick={fetchData}
          data-testid="refresh-all-btn"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh All
        </Button>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-black border-zinc-800" data-testid="stat-spend">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-mono uppercase text-zinc-500 tracking-wider">
                  Total Spend
                </p>
                <p className="text-2xl font-heading font-bold mt-1">
                  {formatCurrency(totalSpend)}
                </p>
              </div>
              <DollarSign className="h-6 w-6 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black border-zinc-800" data-testid="stat-impressions">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-mono uppercase text-zinc-500 tracking-wider">
                  Impressions
                </p>
                <p className="text-2xl font-heading font-bold mt-1">
                  {formatNumber(totalImpressions)}
                </p>
              </div>
              <Eye className="h-6 w-6 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black border-zinc-800" data-testid="stat-clicks">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-mono uppercase text-zinc-500 tracking-wider">
                  Clicks
                </p>
                <p className="text-2xl font-heading font-bold mt-1">
                  {formatNumber(totalClicks)}
                </p>
              </div>
              <MousePointer className="h-6 w-6 text-yellow-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black border-zinc-800" data-testid="stat-conversions">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-mono uppercase text-zinc-500 tracking-wider">
                  Conversions
                </p>
                <p className="text-2xl font-heading font-bold mt-1">
                  {formatNumber(totalConversions)}
                </p>
              </div>
              <Target className="h-6 w-6 text-purple-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Channels */}
      <div className="space-y-4">
        {channels.map((channel) => {
          const channelPerf = performance[channel.channel_id];
          const campaigns = channelPerf?.campaigns || [];

          return (
            <Card
              key={channel.channel_id}
              className="bg-black border-zinc-800"
              data-testid={`channel-${channel.channel_id}`}
            >
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      channel.is_connected ? "bg-green-500" : "bg-red-500"
                    }`}
                  />
                  <div>
                    <CardTitle className="text-lg font-heading">
                      {channel.name}
                    </CardTitle>
                    <p className="text-xs text-zinc-500 font-mono">
                      {channel.connector_type.toUpperCase()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {channel.last_synced && (
                    <span className="text-xs text-zinc-500">
                      Last synced:{" "}
                      {new Date(channel.last_synced).toLocaleTimeString()}
                    </span>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-zinc-800"
                    onClick={() => syncChannel(channel.channel_id)}
                    disabled={syncing[channel.channel_id]}
                    data-testid={`sync-${channel.channel_id}`}
                  >
                    <RefreshCw
                      className={`h-4 w-4 mr-2 ${
                        syncing[channel.channel_id] ? "animate-spin" : ""
                      }`}
                    />
                    Sync
                  </Button>
                </div>
              </CardHeader>

              <CardContent>
                {/* Channel Metrics */}
                {channelPerf?.metrics && (
                  <div className="grid grid-cols-4 gap-4 pb-4 border-b border-zinc-800 mb-4">
                    <div>
                      <p className="text-xs text-zinc-500">Spend</p>
                      <p className="text-lg font-heading font-bold">
                        {formatCurrency(channelPerf.metrics.total_spend || 0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500">Avg CTR</p>
                      <p className="text-lg font-heading font-bold">
                        {((channelPerf.metrics.avg_ctr || 0) * 100).toFixed(2)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500">Avg CPC</p>
                      <p className="text-lg font-heading font-bold">
                        {formatCurrency(channelPerf.metrics.avg_cpc || 0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500">Avg CPA</p>
                      <p className="text-lg font-heading font-bold">
                        {formatCurrency(channelPerf.metrics.avg_cpa || 0)}
                      </p>
                    </div>
                  </div>
                )}

                {/* Campaigns */}
                {campaigns.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-mono uppercase text-zinc-500 tracking-wider mb-3">
                      Campaigns
                    </p>
                    {campaigns.slice(0, 5).map((campaign, i) => (
                      <div
                        key={campaign.id || i}
                        className="flex items-center justify-between p-3 border border-zinc-800 rounded-sm hover:border-zinc-700 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Badge
                            variant={
                              campaign.status === "ACTIVE" ||
                              campaign.status === "ENABLED"
                                ? "default"
                                : "secondary"
                            }
                            className={
                              campaign.status === "ACTIVE" ||
                              campaign.status === "ENABLED"
                                ? "bg-green-900/50 text-green-400"
                                : ""
                            }
                          >
                            {campaign.status}
                          </Badge>
                          <div>
                            <p className="font-medium">{campaign.name}</p>
                            <p className="text-xs text-zinc-500">
                              {campaign.objective || campaign.type}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-6 text-sm">
                          <div className="text-right">
                            <p className="text-zinc-500 text-xs">Spend</p>
                            <p className="font-mono">
                              {formatCurrency(campaign.metrics?.spend || 0)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-zinc-500 text-xs">CTR</p>
                            <p className="font-mono">
                              {((campaign.metrics?.ctr || 0) * 100).toFixed(2)}%
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-zinc-500 text-xs">Conv</p>
                            <p className="font-mono">
                              {campaign.metrics?.conversions || 0}
                            </p>
                          </div>
                          <ChevronRight className="h-4 w-4 text-zinc-600" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {!channel.is_connected && (
                  <div className="flex items-center gap-3 p-4 border border-dashed border-zinc-800 rounded-sm">
                    <AlertCircle className="h-5 w-5 text-yellow-500" />
                    <p className="text-sm text-zinc-500">
                      Channel not connected. Click "Connect" to set up integration.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {channels.length === 0 && (
        <div className="text-center py-12 border border-dashed border-zinc-800 rounded-sm">
          <AlertCircle className="h-12 w-12 mx-auto text-zinc-600 mb-4" />
          <p className="text-zinc-500">No channels configured</p>
          <p className="text-xs text-zinc-600 mt-2">
            Contact admin to set up integrations
          </p>
        </div>
      )}
    </div>
  );
}
