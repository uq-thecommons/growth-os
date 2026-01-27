import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { API } from "../App";
import {
  Plus,
  Trash2,
  Save,
  ChevronRight,
  ChevronDown,
  AlertCircle,
  GripVertical,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../components/ui/collapsible";
import { toast } from "sonner";

export default function FunnelBuilder() {
  const { workspaceId } = useParams();
  const [funnels, setFunnels] = useState([]);
  const [activations, setActivations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFunnelDialog, setShowFunnelDialog] = useState(false);
  const [showActivationDialog, setShowActivationDialog] = useState(false);
  const [expandedActivation, setExpandedActivation] = useState(null);

  const [newFunnel, setNewFunnel] = useState({
    name: "",
    description: "",
    steps: [{ name: "", event_name: "", order: 1 }],
  });

  const [newActivation, setNewActivation] = useState({
    name: "",
    description: "",
    rule: {
      rule_type: "single_event",
      event_name: "",
      events: [],
      time_window_hours: 24,
    },
    confidence: "medium",
  });

  useEffect(() => {
    fetchData();
  }, [workspaceId]);

  const fetchData = async () => {
    try {
      const [funnelsRes, activationsRes] = await Promise.all([
        axios.get(`${API}/workspaces/${workspaceId}/funnels`, {
          withCredentials: true,
        }),
        axios.get(`${API}/workspaces/${workspaceId}/activations`, {
          withCredentials: true,
        }),
      ]);
      setFunnels(funnelsRes.data);
      setActivations(activationsRes.data);
    } catch (error) {
      console.error("Failed to fetch funnel data:", error);
    } finally {
      setLoading(false);
    }
  };

  const createFunnel = async () => {
    try {
      await axios.post(
        `${API}/workspaces/${workspaceId}/funnels`,
        newFunnel,
        
      );
      toast.success("Funnel created");
      setShowFunnelDialog(false);
      setNewFunnel({
        name: "",
        description: "",
        steps: [{ name: "", event_name: "", order: 1 }],
      });
      fetchData();
    } catch (error) {
      toast.error("Failed to create funnel");
    }
  };

  const createActivation = async () => {
    try {
      const payload = {
        ...newActivation,
        rule: {
          ...newActivation.rule,
          events:
            newActivation.rule.rule_type === "sequence"
              ? newActivation.rule.events
              : undefined,
          event_name:
            newActivation.rule.rule_type === "single_event"
              ? newActivation.rule.event_name
              : undefined,
        },
      };
      await axios.post(
        `${API}/workspaces/${workspaceId}/activations`,
        payload,
        
      );
      toast.success("Activation definition created");
      setShowActivationDialog(false);
      setNewActivation({
        name: "",
        description: "",
        rule: {
          rule_type: "single_event",
          event_name: "",
          events: [],
          time_window_hours: 24,
        },
        confidence: "medium",
      });
      fetchData();
    } catch (error) {
      toast.error("Failed to create activation");
    }
  };

  const addFunnelStep = () => {
    setNewFunnel({
      ...newFunnel,
      steps: [
        ...newFunnel.steps,
        { name: "", event_name: "", order: newFunnel.steps.length + 1 },
      ],
    });
  };

  const removeFunnelStep = (index) => {
    const steps = newFunnel.steps.filter((_, i) => i !== index);
    setNewFunnel({
      ...newFunnel,
      steps: steps.map((s, i) => ({ ...s, order: i + 1 })),
    });
  };

  const updateFunnelStep = (index, field, value) => {
    const steps = [...newFunnel.steps];
    steps[index] = { ...steps[index], [field]: value };
    setNewFunnel({ ...newFunnel, steps });
  };

  const addSequenceEvent = () => {
    setNewActivation({
      ...newActivation,
      rule: {
        ...newActivation.rule,
        events: [...(newActivation.rule.events || []), ""],
      },
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-zinc-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in" data-testid="funnel-builder">
      {/* Header */}
      <div>
        <h1 className="font-heading text-3xl font-bold tracking-tight">
          Funnel & Activation Builder
        </h1>
        <p className="text-zinc-500 mt-1">
          Define funnels and activation rules for this workspace
        </p>
      </div>

      {/* Funnels Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-heading font-semibold">Funnels</h2>
          <Dialog open={showFunnelDialog} onOpenChange={setShowFunnelDialog}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="border-zinc-800"
                data-testid="create-funnel-btn"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Funnel
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-zinc-900 border-zinc-800 max-w-lg max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="font-heading">Create Funnel</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label>Funnel Name</Label>
                  <Input
                    value={newFunnel.name}
                    onChange={(e) =>
                      setNewFunnel({ ...newFunnel, name: e.target.value })
                    }
                    className="bg-black border-zinc-800 mt-1"
                    placeholder="e.g., Lead Generation Funnel"
                    data-testid="funnel-name-input"
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={newFunnel.description}
                    onChange={(e) =>
                      setNewFunnel({ ...newFunnel, description: e.target.value })
                    }
                    className="bg-black border-zinc-800 mt-1"
                    placeholder="Describe this funnel..."
                  />
                </div>

                <div>
                  <Label>Funnel Steps</Label>
                  <div className="space-y-3 mt-2">
                    {newFunnel.steps.map((step, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 p-3 border border-zinc-800 rounded-sm"
                      >
                        <GripVertical className="h-4 w-4 text-zinc-600" />
                        <span className="text-zinc-500 text-sm w-6">{i + 1}.</span>
                        <Input
                          value={step.name}
                          onChange={(e) =>
                            updateFunnelStep(i, "name", e.target.value)
                          }
                          className="bg-black border-zinc-800 flex-1"
                          placeholder="Step name"
                        />
                        <Input
                          value={step.event_name}
                          onChange={(e) =>
                            updateFunnelStep(i, "event_name", e.target.value)
                          }
                          className="bg-black border-zinc-800 flex-1"
                          placeholder="GA4 event name"
                        />
                        {newFunnel.steps.length > 1 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeFunnelStep(i)}
                            className="text-zinc-500 hover:text-red-500"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={addFunnelStep}
                      className="border-zinc-800"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Step
                    </Button>
                  </div>
                </div>

                <Button
                  onClick={createFunnel}
                  className="w-full bg-white text-black hover:bg-zinc-200"
                  data-testid="create-funnel-submit"
                >
                  Create Funnel
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-4">
          {funnels.map((funnel) => (
            <Card
              key={funnel.funnel_id}
              className="bg-black border-zinc-800"
              data-testid={`funnel-${funnel.funnel_id}`}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-heading">
                    {funnel.name}
                  </CardTitle>
                  <Badge variant="outline" className="border-zinc-700">
                    {funnel.steps?.length || 0} steps
                  </Badge>
                </div>
                {funnel.description && (
                  <p className="text-sm text-zinc-500">{funnel.description}</p>
                )}
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 overflow-x-auto pb-2">
                  {funnel.steps?.map((step, i) => (
                    <React.Fragment key={step.step_id}>
                      <div className="flex-shrink-0 p-3 border border-zinc-800 rounded-sm min-w-[120px]">
                        <p className="text-xs text-zinc-500 mb-1">{step.name}</p>
                        <p className="text-lg font-heading font-bold">
                          {step.volume?.toLocaleString() || 0}
                        </p>
                        <p className="text-xs text-zinc-600 font-mono mt-1">
                          {step.event_name}
                        </p>
                      </div>
                      {i < funnel.steps.length - 1 && (
                        <ChevronRight className="h-5 w-5 text-zinc-600 flex-shrink-0" />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}

          {funnels.length === 0 && (
            <div className="border border-dashed border-zinc-800 rounded-sm p-8 text-center">
              <AlertCircle className="h-8 w-8 mx-auto text-zinc-600 mb-2" />
              <p className="text-zinc-500">No funnels defined</p>
            </div>
          )}
        </div>
      </section>

      {/* Activation Definitions Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-heading font-semibold">
            Activation Definitions
          </h2>
          <Dialog
            open={showActivationDialog}
            onOpenChange={setShowActivationDialog}
          >
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="border-zinc-800"
                data-testid="create-activation-btn"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Activation
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-zinc-900 border-zinc-800 max-w-lg max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="font-heading">
                  Create Activation Definition
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label>Name</Label>
                  <Input
                    value={newActivation.name}
                    onChange={(e) =>
                      setNewActivation({ ...newActivation, name: e.target.value })
                    }
                    className="bg-black border-zinc-800 mt-1"
                    placeholder="e.g., MQL Activation"
                    data-testid="activation-name-input"
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={newActivation.description}
                    onChange={(e) =>
                      setNewActivation({
                        ...newActivation,
                        description: e.target.value,
                      })
                    }
                    className="bg-black border-zinc-800 mt-1"
                    placeholder="What defines activation?"
                  />
                </div>

                <div>
                  <Label>Rule Type</Label>
                  <Select
                    value={newActivation.rule.rule_type}
                    onValueChange={(value) =>
                      setNewActivation({
                        ...newActivation,
                        rule: { ...newActivation.rule, rule_type: value },
                      })
                    }
                  >
                    <SelectTrigger className="bg-black border-zinc-800 mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800">
                      <SelectItem value="single_event">Single Event</SelectItem>
                      <SelectItem value="sequence">Event Sequence</SelectItem>
                      <SelectItem value="composite">Composite (AND/OR)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {newActivation.rule.rule_type === "single_event" && (
                  <div>
                    <Label>Event Name</Label>
                    <Input
                      value={newActivation.rule.event_name || ""}
                      onChange={(e) =>
                        setNewActivation({
                          ...newActivation,
                          rule: {
                            ...newActivation.rule,
                            event_name: e.target.value,
                          },
                        })
                      }
                      className="bg-black border-zinc-800 mt-1"
                      placeholder="e.g., purchase"
                    />
                  </div>
                )}

                {newActivation.rule.rule_type === "sequence" && (
                  <>
                    <div>
                      <Label>Events (in order)</Label>
                      <div className="space-y-2 mt-2">
                        {(newActivation.rule.events || []).map((event, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <span className="text-zinc-500 text-sm">{i + 1}.</span>
                            <Input
                              value={event}
                              onChange={(e) => {
                                const events = [...newActivation.rule.events];
                                events[i] = e.target.value;
                                setNewActivation({
                                  ...newActivation,
                                  rule: { ...newActivation.rule, events },
                                });
                              }}
                              className="bg-black border-zinc-800"
                              placeholder="Event name"
                            />
                          </div>
                        ))}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={addSequenceEvent}
                          className="border-zinc-800"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Event
                        </Button>
                      </div>
                    </div>
                    <div>
                      <Label>Time Window (hours)</Label>
                      <Input
                        type="number"
                        value={newActivation.rule.time_window_hours || ""}
                        onChange={(e) =>
                          setNewActivation({
                            ...newActivation,
                            rule: {
                              ...newActivation.rule,
                              time_window_hours: parseInt(e.target.value) || 24,
                            },
                          })
                        }
                        className="bg-black border-zinc-800 mt-1"
                        placeholder="24"
                      />
                    </div>
                  </>
                )}

                <div>
                  <Label>Confidence Level</Label>
                  <Select
                    value={newActivation.confidence}
                    onValueChange={(value) =>
                      setNewActivation({ ...newActivation, confidence: value })
                    }
                  >
                    <SelectTrigger className="bg-black border-zinc-800 mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800">
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={createActivation}
                  className="w-full bg-white text-black hover:bg-zinc-200"
                  data-testid="create-activation-submit"
                >
                  Create Activation Definition
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-3">
          {activations.map((activation) => (
            <Collapsible
              key={activation.definition_id}
              open={expandedActivation === activation.definition_id}
              onOpenChange={(open) =>
                setExpandedActivation(open ? activation.definition_id : null)
              }
            >
              <Card
                className="bg-black border-zinc-800"
                data-testid={`activation-${activation.definition_id}`}
              >
                <CollapsibleTrigger className="w-full">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div className="flex items-center gap-3">
                      {expandedActivation === activation.definition_id ? (
                        <ChevronDown className="h-4 w-4 text-zinc-500" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-zinc-500" />
                      )}
                      <div className="text-left">
                        <CardTitle className="text-lg font-heading">
                          {activation.name}
                        </CardTitle>
                        <p className="text-sm text-zinc-500">
                          {activation.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="border-zinc-700">
                        v{activation.version}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={
                          activation.confidence === "high"
                            ? "border-green-700 text-green-500"
                            : activation.confidence === "medium"
                            ? "border-yellow-700 text-yellow-500"
                            : "border-red-700 text-red-500"
                        }
                      >
                        {activation.confidence}
                      </Badge>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0">
                    <div className="p-4 bg-zinc-900 rounded-sm font-mono text-sm">
                      <p className="text-zinc-500 mb-2">Rule Configuration:</p>
                      <pre className="text-zinc-300">
                        {JSON.stringify(activation.rule, null, 2)}
                      </pre>
                    </div>
                    {activation.last_verified && (
                      <p className="text-xs text-zinc-500 mt-3">
                        Last verified:{" "}
                        {new Date(activation.last_verified).toLocaleString()}
                      </p>
                    )}
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          ))}

          {activations.length === 0 && (
            <div className="border border-dashed border-zinc-800 rounded-sm p-8 text-center">
              <AlertCircle className="h-8 w-8 mx-auto text-zinc-600 mb-2" />
              <p className="text-zinc-500">No activation definitions</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
