import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { API } from "../App";
import {
  Plus,
  MoreHorizontal,
  ChevronRight,
  GripVertical,
  CheckCircle,
  XCircle,
  RotateCw,
  ArrowUpRight,
  LayoutGrid,
  List,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { toast } from "sonner";

const STATUSES = ["backlog", "ready", "live", "analyzing", "decided"];

const STATUS_COLORS = {
  backlog: "border-zinc-700 bg-zinc-900/50",
  ready: "border-blue-900 bg-blue-900/20",
  live: "border-green-900 bg-green-900/20",
  analyzing: "border-yellow-900 bg-yellow-900/20",
  decided: "border-zinc-600 bg-zinc-800/50",
};

const STATUS_LABELS = {
  backlog: "Backlog",
  ready: "Ready",
  live: "Live",
  analyzing: "Analyzing",
  decided: "Decided",
};

export default function ExperimentsPage() {
  const { workspaceId } = useParams();
  const [experiments, setExperiments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDecisionDialog, setShowDecisionDialog] = useState(false);
  const [selectedExperiment, setSelectedExperiment] = useState(null);
  const [draggedExp, setDraggedExp] = useState(null);
  const [viewMode, setViewMode] = useState("kanban"); // "kanban" or "list"

  const [newExperiment, setNewExperiment] = useState({
    name: "",
    description: "",
    hypothesis: { belief: "", target: "", because: "" },
    metric_target: "",
  });

  const [decision, setDecision] = useState({
    decision_type: "scale",
    rationale: "",
  });

  useEffect(() => {
    fetchExperiments();
  }, [workspaceId]);

  const fetchExperiments = async () => {
    try {
      const response = await axios.get(
        `${API}/workspaces/${workspaceId}/experiments`,
        
      );
      setExperiments(response.data);
    } catch (error) {
      console.error("Failed to fetch experiments:", error);
    } finally {
      setLoading(false);
    }
  };

  const createExperiment = async () => {
    try {
      await axios.post(
        `${API}/workspaces/${workspaceId}/experiments`,
        newExperiment,
        
      );
      toast.success("Experiment created");
      setShowCreateDialog(false);
      setNewExperiment({
        name: "",
        description: "",
        hypothesis: { belief: "", target: "", because: "" },
        metric_target: "",
      });
      fetchExperiments();
    } catch (error) {
      toast.error("Failed to create experiment");
    }
  };

  const updateExperimentStatus = async (expId, newStatus) => {
    try {
      await axios.put(
        `${API}/workspaces/${workspaceId}/experiments/${expId}`,
        { status: newStatus },
        
      );
      fetchExperiments();
    } catch (error) {
      toast.error("Failed to update experiment");
    }
  };

  const addDecision = async () => {
    if (!selectedExperiment) return;
    try {
      await axios.post(
        `${API}/workspaces/${workspaceId}/experiments/${selectedExperiment.experiment_id}/decision`,
        decision,
        
      );
      toast.success("Decision recorded");
      setShowDecisionDialog(false);
      setDecision({ decision_type: "scale", rationale: "" });
      fetchExperiments();
    } catch (error) {
      toast.error("Failed to add decision");
    }
  };

  const handleDragStart = (e, exp) => {
    setDraggedExp(exp);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e, status) => {
    e.preventDefault();
    if (draggedExp && draggedExp.status !== status) {
      updateExperimentStatus(draggedExp.experiment_id, status);
    }
    setDraggedExp(null);
  };

  const getExperimentsByStatus = (status) =>
    experiments.filter((e) => e.status === status);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-zinc-500">Loading...</div>
      </div>
    );
  }

  const DecisionIcon = ({ type }) => {
    const icons = {
      kill: <XCircle className="h-4 w-4 text-red-500" />,
      iterate: <RotateCw className="h-4 w-4 text-yellow-500" />,
      scale: <ArrowUpRight className="h-4 w-4 text-green-500" />,
    };
    return icons[type] || null;
  };

  return (
    <div className="space-y-6 animate-in" data-testid="experiments-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight">
            Experiments
          </h1>
          <p className="text-zinc-500 mt-1">
            {experiments.length} experiments in pipeline
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode("kanban")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                viewMode === "kanban"
                  ? "bg-white text-black"
                  : "text-zinc-400 hover:text-white"
              }`}
              title="Kanban View"
            >
              <LayoutGrid className="h-4 w-4" />
              <span className="hidden sm:inline">Kanban</span>
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                viewMode === "list"
                  ? "bg-white text-black"
                  : "text-zinc-400 hover:text-white"
              }`}
              title="List View"
            >
              <List className="h-4 w-4" />
              <span className="hidden sm:inline">List</span>
            </button>
          </div>

          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button
                className="bg-white text-black hover:bg-zinc-200 rounded-lg"
                data-testid="create-experiment-btn"
              >
                <Plus className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">New Experiment</span>
                <span className="sm:hidden">New</span>
              </Button>
            </DialogTrigger>
          <DialogContent className="bg-zinc-900 border-zinc-800 max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-heading">Create Experiment</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Name</Label>
                <Input
                  value={newExperiment.name}
                  onChange={(e) =>
                    setNewExperiment({ ...newExperiment, name: e.target.value })
                  }
                  className="bg-black border-zinc-800 mt-1"
                  placeholder="e.g., Headline Value Prop Test"
                  data-testid="exp-name-input"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={newExperiment.description}
                  onChange={(e) =>
                    setNewExperiment({ ...newExperiment, description: e.target.value })
                  }
                  className="bg-black border-zinc-800 mt-1"
                  placeholder="What are we testing and why?"
                  data-testid="exp-desc-input"
                />
              </div>
              <div className="space-y-3">
                <Label>Hypothesis</Label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-500 text-sm w-24">We believe</span>
                    <Input
                      value={newExperiment.hypothesis.belief}
                      onChange={(e) =>
                        setNewExperiment({
                          ...newExperiment,
                          hypothesis: { ...newExperiment.hypothesis, belief: e.target.value },
                        })
                      }
                      className="bg-black border-zinc-800 flex-1"
                      placeholder="a specific value proposition"
                      data-testid="exp-belief-input"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-500 text-sm w-24">for</span>
                    <Input
                      value={newExperiment.hypothesis.target}
                      onChange={(e) =>
                        setNewExperiment({
                          ...newExperiment,
                          hypothesis: { ...newExperiment.hypothesis, target: e.target.value },
                        })
                      }
                      className="bg-black border-zinc-800 flex-1"
                      placeholder="enterprise decision makers"
                      data-testid="exp-target-input"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-500 text-sm w-24">because</span>
                    <Input
                      value={newExperiment.hypothesis.because}
                      onChange={(e) =>
                        setNewExperiment({
                          ...newExperiment,
                          hypothesis: { ...newExperiment.hypothesis, because: e.target.value },
                        })
                      }
                      className="bg-black border-zinc-800 flex-1"
                      placeholder="they need ROI justification"
                      data-testid="exp-because-input"
                    />
                  </div>
                </div>
              </div>
              <div>
                <Label>Primary Metric</Label>
                <Input
                  value={newExperiment.metric_target}
                  onChange={(e) =>
                    setNewExperiment({ ...newExperiment, metric_target: e.target.value })
                  }
                  className="bg-black border-zinc-800 mt-1"
                  placeholder="e.g., Form start rate"
                  data-testid="exp-metric-input"
                />
              </div>
              <Button
                onClick={createExperiment}
                className="w-full bg-white text-black hover:bg-zinc-200"
                data-testid="create-exp-submit"
              >
                Create Experiment
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Kanban Board */}
      {viewMode === "kanban" && (
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-max lg:grid lg:grid-cols-5 lg:min-w-0">
            {STATUSES.map((status) => (
              <div
                key={status}
                className="w-[280px] lg:w-auto flex-shrink-0"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, status)}
                data-testid={`kanban-column-${status}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-mono uppercase text-zinc-500 tracking-wider">
                    {status.replace("_", " ")}
                  </h3>
                  <Badge variant="outline" className="border-zinc-700">
                    {getExperimentsByStatus(status).length}
                  </Badge>
                </div>

                <div className="space-y-3">
                  {getExperimentsByStatus(status).map((exp) => (
                    <Card
                      key={exp.experiment_id}
                      className={`${STATUS_COLORS[status]} border cursor-move hover:border-zinc-600 transition-all`}
                      draggable
                      onDragStart={(e) => handleDragStart(e, exp)}
                      data-testid={`experiment-card-${exp.experiment_id}`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{exp.name}</p>
                            {exp.hypothesis && (
                              <p className="text-xs text-zinc-500 mt-1 line-clamp-2">
                                We believe {exp.hypothesis.belief}...
                              </p>
                            )}
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="bg-zinc-900 border-zinc-800">
                              {STATUSES.filter((s) => s !== status).map((s) => (
                                <DropdownMenuItem
                                  key={s}
                                  onClick={() =>
                                    updateExperimentStatus(exp.experiment_id, s)
                                  }
                                >
                                  Move to {s.replace("_", " ")}
                                </DropdownMenuItem>
                              ))}
                              {status === "analyzing" && (
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedExperiment(exp);
                                    setShowDecisionDialog(true);
                                  }}
                                  data-testid={`add-decision-${exp.experiment_id}`}
                                >
                                  Add Decision
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        {exp.metric_target && (
                          <div className="mt-3 pt-3 border-t border-zinc-800">
                            <p className="text-xs text-zinc-500">
                              Metric: {exp.metric_target}
                            </p>
                          </div>
                        )}

                        {exp.decision && (
                          <div className="mt-3 pt-3 border-t border-zinc-800 flex items-center gap-2">
                            <DecisionIcon type={exp.decision.decision_type} />
                            <span className="text-xs capitalize">
                              {exp.decision.decision_type}
                            </span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}

                  {getExperimentsByStatus(status).length === 0 && (
                    <div className="border border-dashed border-zinc-800 rounded-sm p-8 text-center">
                      <p className="text-xs text-zinc-600">No experiments</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* List View */}
      {viewMode === "list" && (
        <div className="space-y-3">
          {experiments.length === 0 ? (
            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="p-12 text-center">
                <p className="text-zinc-500">No experiments yet. Create your first experiment to get started.</p>
              </CardContent>
            </Card>
          ) : (
            experiments.map((exp) => (
              <Card
                key={exp.experiment_id}
                className={`${STATUS_COLORS[exp.status]} border hover:border-zinc-600 transition-all`}
              >
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex-1 min-w-0 space-y-3">
                      {/* Title and Status */}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                        <h3 className="font-medium text-base">{exp.name}</h3>
                        <Badge 
                          variant="outline" 
                          className="border-zinc-700 w-fit text-xs capitalize"
                        >
                          {STATUS_LABELS[exp.status]}
                        </Badge>
                      </div>

                      {/* Hypothesis */}
                      {exp.hypothesis && (
                        <p className="text-sm text-zinc-400">
                          We believe <span className="text-white">{exp.hypothesis.belief}</span> for{" "}
                          <span className="text-white">{exp.hypothesis.target}</span> because{" "}
                          <span className="text-white">{exp.hypothesis.because}</span>
                        </p>
                      )}

                      {/* Description */}
                      {exp.description && (
                        <p className="text-sm text-zinc-500">{exp.description}</p>
                      )}

                      {/* Metric and Decision */}
                      <div className="flex flex-wrap items-center gap-4 text-xs">
                        {exp.metric_target && (
                          <div className="flex items-center gap-2">
                            <span className="text-zinc-500">Metric:</span>
                            <span className="text-white">{exp.metric_target}</span>
                          </div>
                        )}
                        {exp.decision && (
                          <div className="flex items-center gap-2">
                            <DecisionIcon type={exp.decision.decision_type} />
                            <span className="capitalize text-white">
                              {exp.decision.decision_type}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions Dropdown */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-9 w-9 flex-shrink-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="bg-zinc-900 border-zinc-800">
                        {STATUSES.filter((s) => s !== exp.status).map((s) => (
                          <DropdownMenuItem
                            key={s}
                            onClick={() =>
                              updateExperimentStatus(exp.experiment_id, s)
                            }
                          >
                            Move to {s.replace("_", " ")}
                          </DropdownMenuItem>
                        ))}
                        {exp.status === "analyzing" && (
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedExperiment(exp);
                              setShowDecisionDialog(true);
                            }}
                          >
                            Add Decision
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Decision Dialog */}
      <Dialog open={showDecisionDialog} onOpenChange={setShowDecisionDialog}>
        <DialogContent className="bg-zinc-900 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="font-heading">Record Decision</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <p className="text-sm text-zinc-400">
              Recording decision for: {selectedExperiment?.name}
            </p>

            <div className="grid grid-cols-3 gap-3">
              {["kill", "iterate", "scale"].map((type) => (
                <button
                  key={type}
                  onClick={() => setDecision({ ...decision, decision_type: type })}
                  className={`p-4 border rounded-sm flex flex-col items-center gap-2 transition-colors ${
                    decision.decision_type === type
                      ? "border-white bg-zinc-800"
                      : "border-zinc-800 hover:border-zinc-700"
                  }`}
                  data-testid={`decision-${type}`}
                >
                  <DecisionIcon type={type} />
                  <span className="text-sm capitalize">{type}</span>
                </button>
              ))}
            </div>

            <div>
              <Label>Rationale</Label>
              <Textarea
                value={decision.rationale}
                onChange={(e) =>
                  setDecision({ ...decision, rationale: e.target.value })
                }
                className="bg-black border-zinc-800 mt-1"
                placeholder="Why are we making this decision?"
                rows={4}
                data-testid="decision-rationale"
              />
            </div>

            <Button
              onClick={addDecision}
              className="w-full bg-white text-black hover:bg-zinc-200"
              data-testid="submit-decision"
            >
              Record Decision
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
