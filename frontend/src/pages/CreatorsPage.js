import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { API } from "../App";
import {
  Plus,
  MoreHorizontal,
  Instagram,
  Youtube,
  Twitter,
  Linkedin,
  Star,
  Mail,
  Calendar,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { toast } from "sonner";

const PIPELINE_STAGES = [
  "discovery",
  "contacted",
  "confirmed",
  "briefed",
  "delivered",
  "live",
  "amplified",
  "complete",
];

const STAGE_COLORS = {
  discovery: "border-zinc-700",
  contacted: "border-blue-800",
  confirmed: "border-purple-800",
  briefed: "border-yellow-800",
  delivered: "border-orange-800",
  live: "border-green-800",
  amplified: "border-pink-800",
  complete: "border-zinc-600",
};

export default function CreatorsPage() {
  const { workspaceId } = useParams();
  const [creators, setCreators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [filter, setFilter] = useState("all");
  const [newCreator, setNewCreator] = useState({
    name: "",
    handle: "",
    platform: "instagram",
    follower_count: "",
    engagement_rate: "",
    notes: "",
    fit_score: "",
    contact_email: "",
  });

  useEffect(() => {
    fetchCreators();
  }, [workspaceId]);

  const fetchCreators = async () => {
    try {
      const response = await axios.get(
        `${API}/workspaces/${workspaceId}/creators`,
        
      );
      setCreators(response.data);
    } catch (error) {
      console.error("Failed to fetch creators:", error);
    } finally {
      setLoading(false);
    }
  };

  const createCreator = async () => {
    try {
      const payload = {
        ...newCreator,
        follower_count: parseInt(newCreator.follower_count) || null,
        engagement_rate: parseFloat(newCreator.engagement_rate) || null,
        fit_score: parseInt(newCreator.fit_score) || null,
      };
      await axios.post(
        `${API}/workspaces/${workspaceId}/creators`,
        payload,
        
      );
      toast.success("Creator added");
      setShowCreateDialog(false);
      setNewCreator({
        name: "",
        handle: "",
        platform: "instagram",
        follower_count: "",
        engagement_rate: "",
        notes: "",
        fit_score: "",
        contact_email: "",
      });
      fetchCreators();
    } catch (error) {
      toast.error("Failed to add creator");
    }
  };

  const updateCreatorStatus = async (creatorId, newStatus) => {
    try {
      await axios.put(
        `${API}/workspaces/${workspaceId}/creators/${creatorId}`,
        { pipeline_status: newStatus },
        
      );
      fetchCreators();
      toast.success("Status updated");
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const PlatformIcon = ({ platform }) => {
    const icons = {
      instagram: <Instagram className="h-4 w-4" />,
      youtube: <Youtube className="h-4 w-4" />,
      twitter: <Twitter className="h-4 w-4" />,
      tiktok: (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z" />
        </svg>
      ),
      linkedin: <Linkedin className="h-4 w-4" />,
    };
    return icons[platform] || <Instagram className="h-4 w-4" />;
  };

  const formatFollowers = (count) => {
    if (!count) return "N/A";
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  const filteredCreators =
    filter === "all"
      ? creators
      : creators.filter((c) => c.pipeline_status === filter);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-zinc-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in" data-testid="creators-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight">
            Creators
          </h1>
          <p className="text-zinc-500 mt-1">
            {creators.length} creators in pipeline
          </p>
        </div>

        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button
              className="bg-white text-black hover:bg-zinc-200 rounded-full"
              data-testid="add-creator-btn"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Creator
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-zinc-900 border-zinc-800 max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-heading">Add Creator</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Name</Label>
                  <Input
                    value={newCreator.name}
                    onChange={(e) =>
                      setNewCreator({ ...newCreator, name: e.target.value })
                    }
                    className="bg-black border-zinc-800 mt-1"
                    placeholder="Creator name"
                    data-testid="creator-name-input"
                  />
                </div>
                <div>
                  <Label>Handle</Label>
                  <Input
                    value={newCreator.handle}
                    onChange={(e) =>
                      setNewCreator({ ...newCreator, handle: e.target.value })
                    }
                    className="bg-black border-zinc-800 mt-1"
                    placeholder="@handle"
                    data-testid="creator-handle-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Platform</Label>
                  <Select
                    value={newCreator.platform}
                    onValueChange={(value) =>
                      setNewCreator({ ...newCreator, platform: value })
                    }
                  >
                    <SelectTrigger className="bg-black border-zinc-800 mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800">
                      <SelectItem value="instagram">Instagram</SelectItem>
                      <SelectItem value="tiktok">TikTok</SelectItem>
                      <SelectItem value="youtube">YouTube</SelectItem>
                      <SelectItem value="linkedin">LinkedIn</SelectItem>
                      <SelectItem value="twitter">Twitter</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Fit Score (1-10)</Label>
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    value={newCreator.fit_score}
                    onChange={(e) =>
                      setNewCreator({ ...newCreator, fit_score: e.target.value })
                    }
                    className="bg-black border-zinc-800 mt-1"
                    placeholder="8"
                    data-testid="creator-fit-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Followers</Label>
                  <Input
                    type="number"
                    value={newCreator.follower_count}
                    onChange={(e) =>
                      setNewCreator({
                        ...newCreator,
                        follower_count: e.target.value,
                      })
                    }
                    className="bg-black border-zinc-800 mt-1"
                    placeholder="50000"
                  />
                </div>
                <div>
                  <Label>Engagement Rate (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={newCreator.engagement_rate}
                    onChange={(e) =>
                      setNewCreator({
                        ...newCreator,
                        engagement_rate: e.target.value,
                      })
                    }
                    className="bg-black border-zinc-800 mt-1"
                    placeholder="4.5"
                  />
                </div>
              </div>

              <div>
                <Label>Contact Email</Label>
                <Input
                  type="email"
                  value={newCreator.contact_email}
                  onChange={(e) =>
                    setNewCreator({ ...newCreator, contact_email: e.target.value })
                  }
                  className="bg-black border-zinc-800 mt-1"
                  placeholder="creator@email.com"
                />
              </div>

              <div>
                <Label>Notes</Label>
                <Textarea
                  value={newCreator.notes}
                  onChange={(e) =>
                    setNewCreator({ ...newCreator, notes: e.target.value })
                  }
                  className="bg-black border-zinc-800 mt-1"
                  placeholder="Fit assessment, content style, etc."
                  rows={3}
                />
              </div>

              <Button
                onClick={createCreator}
                className="w-full bg-white text-black hover:bg-zinc-200"
                data-testid="create-creator-submit"
              >
                Add Creator
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Pipeline Filter */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={filter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("all")}
          className={filter === "all" ? "bg-white text-black" : "border-zinc-800"}
        >
          All ({creators.length})
        </Button>
        {PIPELINE_STAGES.map((stage) => {
          const count = creators.filter((c) => c.pipeline_status === stage).length;
          return (
            <Button
              key={stage}
              variant={filter === stage ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(stage)}
              className={
                filter === stage ? "bg-white text-black" : "border-zinc-800"
              }
            >
              {stage.charAt(0).toUpperCase() + stage.slice(1)} ({count})
            </Button>
          );
        })}
      </div>

      {/* Creators Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCreators.map((creator) => (
          <Card
            key={creator.creator_id}
            className={`bg-black border-2 ${
              STAGE_COLORS[creator.pipeline_status] || "border-zinc-800"
            } hover:border-opacity-80 transition-colors`}
            data-testid={`creator-card-${creator.creator_id}`}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-zinc-800 flex items-center justify-center">
                    <PlatformIcon platform={creator.platform} />
                  </div>
                  <div>
                    <p className="font-medium">{creator.name}</p>
                    <p className="text-sm text-zinc-500">{creator.handle}</p>
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-zinc-900 border-zinc-800">
                    <DropdownMenuItem disabled className="text-xs text-zinc-500">
                      Move to stage:
                    </DropdownMenuItem>
                    {PIPELINE_STAGES.filter(
                      (s) => s !== creator.pipeline_status
                    ).map((stage) => (
                      <DropdownMenuItem
                        key={stage}
                        onClick={() =>
                          updateCreatorStatus(creator.creator_id, stage)
                        }
                      >
                        {stage.charAt(0).toUpperCase() + stage.slice(1)}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <div className="p-2 bg-zinc-900 rounded-sm">
                  <p className="text-lg font-heading font-bold">
                    {formatFollowers(creator.follower_count)}
                  </p>
                  <p className="text-xs text-zinc-500">Followers</p>
                </div>
                <div className="p-2 bg-zinc-900 rounded-sm">
                  <p className="text-lg font-heading font-bold">
                    {creator.engagement_rate
                      ? `${creator.engagement_rate}%`
                      : "N/A"}
                  </p>
                  <p className="text-xs text-zinc-500">Eng. Rate</p>
                </div>
                <div className="p-2 bg-zinc-900 rounded-sm">
                  <div className="flex items-center justify-center gap-1">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <p className="text-lg font-heading font-bold">
                      {creator.fit_score || "-"}
                    </p>
                  </div>
                  <p className="text-xs text-zinc-500">Fit</p>
                </div>
              </div>

              {creator.notes && (
                <p className="mt-4 text-sm text-zinc-400 line-clamp-2">
                  {creator.notes}
                </p>
              )}

              <div className="mt-4 flex items-center justify-between">
                <Badge
                  variant="outline"
                  className="capitalize border-zinc-700 text-zinc-400"
                >
                  {creator.pipeline_status.replace("_", " ")}
                </Badge>

                {creator.contact_email && (
                  <Button variant="ghost" size="sm" asChild>
                    <a href={`mailto:${creator.contact_email}`}>
                      <Mail className="h-4 w-4" />
                    </a>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredCreators.length === 0 && (
        <div className="text-center py-12 border border-dashed border-zinc-800 rounded-sm">
          <AlertCircle className="h-12 w-12 mx-auto text-zinc-600 mb-4" />
          <p className="text-zinc-500">No creators found</p>
          <Button
            variant="outline"
            className="mt-4 border-zinc-800"
            onClick={() => setShowCreateDialog(true)}
          >
            Add your first creator
          </Button>
        </div>
      )}
    </div>
  );
}
