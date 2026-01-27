import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { API } from "../App";
import {
  Plus,
  Upload,
  Image,
  Video,
  FileText,
  Tag,
  Eye,
  EyeOff,
  Calendar,
  MoreHorizontal,
  Search,
  Grid,
  List,
} from "lucide-react";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
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
import { Switch } from "../components/ui/switch";
import { toast } from "sonner";

export default function CreativeOSPage() {
  const { workspaceId } = useParams();
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("grid");
  const [filter, setFilter] = useState({ type: "all", clientVisible: "all" });
  const [searchQuery, setSearchQuery] = useState("");
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [newAsset, setNewAsset] = useState({
    name: "",
    description: "",
    file_type: "image",
    file_url: "",
    is_client_visible: false,
    tags: {
      angle: "",
      hook: "",
      format: "",
      icp: "",
      funnel_stage: "",
    },
  });

  useEffect(() => {
    fetchAssets();
  }, [workspaceId]);

  const fetchAssets = async () => {
    try {
      const response = await axios.get(
        `${API}/workspaces/${workspaceId}/assets`,
        { withCredentials: true }
      );
      setAssets(response.data);
    } catch (error) {
      console.error("Failed to fetch assets:", error);
    } finally {
      setLoading(false);
    }
  };

  const createAsset = async () => {
    try {
      await axios.post(
        `${API}/workspaces/${workspaceId}/assets`,
        newAsset,
        { withCredentials: true }
      );
      toast.success("Asset created");
      setShowUploadDialog(false);
      setNewAsset({
        name: "",
        description: "",
        file_type: "image",
        file_url: "",
        is_client_visible: false,
        tags: { angle: "", hook: "", format: "", icp: "", funnel_stage: "" },
      });
      fetchAssets();
    } catch (error) {
      toast.error("Failed to create asset");
    }
  };

  const toggleClientVisibility = async (assetId, currentValue) => {
    try {
      await axios.put(
        `${API}/workspaces/${workspaceId}/assets/${assetId}`,
        { is_client_visible: !currentValue },
        { withCredentials: true }
      );
      fetchAssets();
      toast.success(
        !currentValue ? "Asset now visible to clients" : "Asset hidden from clients"
      );
    } catch (error) {
      toast.error("Failed to update asset");
    }
  };

  const filteredAssets = assets.filter((asset) => {
    if (filter.type !== "all" && asset.file_type !== filter.type) return false;
    if (filter.clientVisible === "visible" && !asset.is_client_visible) return false;
    if (filter.clientVisible === "hidden" && asset.is_client_visible) return false;
    if (
      searchQuery &&
      !asset.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
      return false;
    return true;
  });

  const FileTypeIcon = ({ type }) => {
    const icons = {
      image: <Image className="h-5 w-5" />,
      video: <Video className="h-5 w-5" />,
      document: <FileText className="h-5 w-5" />,
    };
    return icons[type] || <FileText className="h-5 w-5" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-zinc-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in" data-testid="creative-os-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight">
            Creative OS
          </h1>
          <p className="text-zinc-500 mt-1">
            {assets.length} assets in library
          </p>
        </div>

        <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
          <DialogTrigger asChild>
            <Button
              className="bg-white text-black hover:bg-zinc-200 rounded-full"
              data-testid="upload-asset-btn"
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload Asset
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-zinc-900 border-zinc-800 max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-heading">Upload Asset</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Name</Label>
                <Input
                  value={newAsset.name}
                  onChange={(e) =>
                    setNewAsset({ ...newAsset, name: e.target.value })
                  }
                  className="bg-black border-zinc-800 mt-1"
                  placeholder="Asset name"
                  data-testid="asset-name-input"
                />
              </div>

              <div>
                <Label>Type</Label>
                <Select
                  value={newAsset.file_type}
                  onValueChange={(value) =>
                    setNewAsset({ ...newAsset, file_type: value })
                  }
                >
                  <SelectTrigger className="bg-black border-zinc-800 mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800">
                    <SelectItem value="image">Image</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="document">Document</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>File URL (Mock - Cloudinary integration stubbed)</Label>
                <Input
                  value={newAsset.file_url}
                  onChange={(e) =>
                    setNewAsset({ ...newAsset, file_url: e.target.value })
                  }
                  className="bg-black border-zinc-800 mt-1"
                  placeholder="/uploads/my-asset.png"
                  data-testid="asset-url-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Angle</Label>
                  <Input
                    value={newAsset.tags.angle}
                    onChange={(e) =>
                      setNewAsset({
                        ...newAsset,
                        tags: { ...newAsset.tags, angle: e.target.value },
                      })
                    }
                    className="bg-black border-zinc-800 mt-1"
                    placeholder="e.g., testimonial"
                  />
                </div>
                <div>
                  <Label>Hook</Label>
                  <Input
                    value={newAsset.tags.hook}
                    onChange={(e) =>
                      setNewAsset({
                        ...newAsset,
                        tags: { ...newAsset.tags, hook: e.target.value },
                      })
                    }
                    className="bg-black border-zinc-800 mt-1"
                    placeholder="e.g., problem_agitation"
                  />
                </div>
                <div>
                  <Label>Format</Label>
                  <Input
                    value={newAsset.tags.format}
                    onChange={(e) =>
                      setNewAsset({
                        ...newAsset,
                        tags: { ...newAsset.tags, format: e.target.value },
                      })
                    }
                    className="bg-black border-zinc-800 mt-1"
                    placeholder="e.g., video_15s"
                  />
                </div>
                <div>
                  <Label>Funnel Stage</Label>
                  <Input
                    value={newAsset.tags.funnel_stage}
                    onChange={(e) =>
                      setNewAsset({
                        ...newAsset,
                        tags: { ...newAsset.tags, funnel_stage: e.target.value },
                      })
                    }
                    className="bg-black border-zinc-800 mt-1"
                    placeholder="e.g., awareness"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Label>Client Visible</Label>
                <Switch
                  checked={newAsset.is_client_visible}
                  onCheckedChange={(checked) =>
                    setNewAsset({ ...newAsset, is_client_visible: checked })
                  }
                  data-testid="asset-visibility-toggle"
                />
              </div>

              <Button
                onClick={createAsset}
                className="w-full bg-white text-black hover:bg-zinc-200"
                data-testid="create-asset-submit"
              >
                Create Asset
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex-1 max-w-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search assets..."
              className="bg-black border-zinc-800 pl-10"
              data-testid="asset-search"
            />
          </div>
        </div>

        <Select
          value={filter.type}
          onValueChange={(value) => setFilter({ ...filter, type: value })}
        >
          <SelectTrigger className="w-32 bg-black border-zinc-800">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent className="bg-zinc-900 border-zinc-800">
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="image">Images</SelectItem>
            <SelectItem value="video">Videos</SelectItem>
            <SelectItem value="document">Documents</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filter.clientVisible}
          onValueChange={(value) =>
            setFilter({ ...filter, clientVisible: value })
          }
        >
          <SelectTrigger className="w-40 bg-black border-zinc-800">
            <SelectValue placeholder="Visibility" />
          </SelectTrigger>
          <SelectContent className="bg-zinc-900 border-zinc-800">
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="visible">Client Visible</SelectItem>
            <SelectItem value="hidden">Hidden</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center gap-1 border border-zinc-800 rounded-sm">
          <Button
            variant="ghost"
            size="icon"
            className={viewMode === "grid" ? "bg-zinc-800" : ""}
            onClick={() => setViewMode("grid")}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={viewMode === "list" ? "bg-zinc-800" : ""}
            onClick={() => setViewMode("list")}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Assets Grid/List */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredAssets.map((asset) => (
            <Card
              key={asset.asset_id}
              className="bg-black border-zinc-800 overflow-hidden group hover:border-zinc-700 transition-colors"
              data-testid={`asset-card-${asset.asset_id}`}
            >
              {/* Thumbnail */}
              <div className="aspect-video bg-zinc-900 relative">
                {asset.thumbnail_url ? (
                  <img
                    src={asset.thumbnail_url}
                    alt={asset.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <FileTypeIcon type={asset.file_type} />
                  </div>
                )}

                {/* Overlay badges */}
                <div className="absolute top-2 left-2 flex items-center gap-2">
                  <Badge
                    variant="secondary"
                    className="bg-black/80 backdrop-blur-sm"
                  >
                    {asset.file_type}
                  </Badge>
                </div>

                <div className="absolute top-2 right-2">
                  {asset.is_client_visible ? (
                    <Eye className="h-4 w-4 text-green-500" />
                  ) : (
                    <EyeOff className="h-4 w-4 text-zinc-500" />
                  )}
                </div>

                {/* Performance overlay */}
                {asset.performance?.ctr && (
                  <div className="absolute bottom-2 left-2 right-2 flex gap-2 text-xs">
                    <Badge variant="secondary" className="bg-black/80">
                      CTR {(asset.performance.ctr * 100).toFixed(1)}%
                    </Badge>
                    {asset.performance.cpa && (
                      <Badge variant="secondary" className="bg-black/80">
                        CPA ${asset.performance.cpa.toFixed(0)}
                      </Badge>
                    )}
                  </div>
                )}
              </div>

              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{asset.name}</p>
                    <p className="text-xs text-zinc-500 truncate">
                      v{asset.current_version}
                      {asset.is_creator_asset && " • Creator"}
                    </p>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-zinc-900 border-zinc-800">
                      <DropdownMenuItem
                        onClick={() =>
                          toggleClientVisibility(
                            asset.asset_id,
                            asset.is_client_visible
                          )
                        }
                      >
                        {asset.is_client_visible
                          ? "Hide from clients"
                          : "Show to clients"}
                      </DropdownMenuItem>
                      <DropdownMenuItem>Edit tags</DropdownMenuItem>
                      <DropdownMenuItem>View versions</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Tags */}
                {asset.tags && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {asset.tags.angle && (
                      <Badge variant="outline" className="text-xs border-zinc-700">
                        {asset.tags.angle}
                      </Badge>
                    )}
                    {asset.tags.hook && (
                      <Badge variant="outline" className="text-xs border-zinc-700">
                        {asset.tags.hook}
                      </Badge>
                    )}
                    {asset.tags.funnel_stage && (
                      <Badge variant="outline" className="text-xs border-zinc-700">
                        {asset.tags.funnel_stage}
                      </Badge>
                    )}
                  </div>
                )}

                {/* Rights expiry warning */}
                {asset.rights_expiry && (
                  <div className="mt-3 flex items-center gap-2 text-xs text-yellow-500">
                    <Calendar className="h-3 w-3" />
                    Rights expire{" "}
                    {new Date(asset.rights_expiry).toLocaleDateString()}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredAssets.map((asset) => (
            <div
              key={asset.asset_id}
              className="flex items-center gap-4 p-4 border border-zinc-800 rounded-sm hover:border-zinc-700 transition-colors"
              data-testid={`asset-row-${asset.asset_id}`}
            >
              <div className="w-16 h-16 bg-zinc-900 rounded-sm flex items-center justify-center flex-shrink-0">
                {asset.thumbnail_url ? (
                  <img
                    src={asset.thumbnail_url}
                    alt={asset.name}
                    className="w-full h-full object-cover rounded-sm"
                  />
                ) : (
                  <FileTypeIcon type={asset.file_type} />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{asset.name}</p>
                <p className="text-sm text-zinc-500">
                  {asset.file_type} • v{asset.current_version}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {asset.is_client_visible ? (
                  <Badge variant="outline" className="border-green-700 text-green-500">
                    Client Visible
                  </Badge>
                ) : (
                  <Badge variant="outline" className="border-zinc-700">
                    Hidden
                  </Badge>
                )}
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-zinc-900 border-zinc-800">
                  <DropdownMenuItem
                    onClick={() =>
                      toggleClientVisibility(asset.asset_id, asset.is_client_visible)
                    }
                  >
                    {asset.is_client_visible
                      ? "Hide from clients"
                      : "Show to clients"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </div>
      )}

      {filteredAssets.length === 0 && (
        <div className="text-center py-12 border border-dashed border-zinc-800 rounded-sm">
          <Image className="h-12 w-12 mx-auto text-zinc-600 mb-4" />
          <p className="text-zinc-500">No assets found</p>
          <Button
            variant="outline"
            className="mt-4 border-zinc-800"
            onClick={() => setShowUploadDialog(true)}
          >
            Upload your first asset
          </Button>
        </div>
      )}
    </div>
  );
}
