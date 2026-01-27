import React, { useState, useEffect, useContext } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { API, AuthContext } from "../App";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle,
  AlertCircle,
  Lightbulb,
  ArrowRight,
  Image,
  Beaker,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";

const LOGO_URL = "https://customer-assets.emergentagent.com/job_748ef24b-f1b0-4292-8fd8-756f578df920/artifacts/w50htqda_thecommons_Logo.png";

export default function ClientPortal() {
  const { workspaceId } = useParams();
  const { user } = useContext(AuthContext);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [workspaceId]);

  const fetchData = async () => {
    try {
      const response = await axios.get(
        `${API}/client-portal/${workspaceId}`,
        
      );
      setData(response.data);
    } catch (error) {
      console.error("Failed to fetch client portal:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-zinc-500">Loading...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-zinc-500">Access denied or workspace not found</div>
      </div>
    );
  }

  const TrendIndicator = ({ value }) => {
    if (value > 0)
      return (
        <span className="flex items-center gap-1 text-green-600">
          <TrendingUp className="h-4 w-4" />
          +{value.toFixed(1)}%
        </span>
      );
    if (value < 0)
      return (
        <span className="flex items-center gap-1 text-red-600">
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

  const winning = data.are_we_winning;
  const progress = winning.target_value
    ? (winning.current_value / winning.target_value) * 100
    : 0;

  // Client portal uses inverted colors (white bg, black text)
  return (
    <div className="min-h-screen bg-white text-black -m-6 md:-m-8 lg:-m-12" data-testid="client-portal">
      {/* Header */}
      <header className="border-b border-zinc-200 px-8 py-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src={LOGO_URL} alt="thecommons" className="h-8 w-8 invert" />
            <div>
              <h1 className="font-heading text-xl font-bold">{data.workspace?.name}</h1>
              <p className="text-sm text-zinc-500">Growth Dashboard</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-zinc-500">Welcome back,</p>
            <p className="font-medium">{user?.name}</p>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-8 py-12 space-y-12">
        {/* Question 1: Are we winning? */}
        <section data-testid="are-we-winning">
          <h2 className="font-heading text-3xl font-bold mb-6">
            Are we winning?
          </h2>
          <Card className="bg-zinc-50 border-zinc-200 p-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <p className="text-sm text-zinc-500 mb-2">{winning.metric_name}</p>
                <div className="flex items-baseline gap-3">
                  <span className="text-6xl font-heading font-bold">
                    {winning.current_value.toLocaleString()}
                  </span>
                  <span className="text-xl text-zinc-500">{winning.unit}</span>
                </div>
                <div className="flex items-center gap-4 mt-4">
                  <TrendIndicator value={winning.trend_7d} />
                  <span className="text-sm text-zinc-500">vs last week</span>
                </div>
              </div>
              <div className="w-full md:w-64">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-zinc-500">Progress to target</span>
                  <span className="font-mono">{Math.min(progress, 100).toFixed(0)}%</span>
                </div>
                <Progress value={Math.min(progress, 100)} className="h-3 bg-zinc-200" />
                <p className="text-sm text-zinc-500 mt-2 text-right">
                  Target: {winning.target_value.toLocaleString()} {winning.unit}
                </p>
              </div>
            </div>
            {winning.on_track ? (
              <div className="flex items-center gap-2 mt-6 text-green-600">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">On track to hit target</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 mt-6 text-yellow-600">
                <AlertCircle className="h-5 w-5" />
                <span className="font-medium">Below target pace</span>
              </div>
            )}
          </Card>
        </section>

        {/* Question 2: What did we do this week? */}
        <section data-testid="what-we-did">
          <h2 className="font-heading text-3xl font-bold mb-6">
            What did we do this week?
          </h2>
          {data.what_we_did?.length > 0 ? (
            <div className="space-y-3">
              {data.what_we_did.map((item, i) => (
                <div
                  key={i}
                  className="flex items-start gap-4 p-4 border border-zinc-200 rounded-sm"
                >
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <p className="text-lg">{item}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-zinc-500">No updates this week yet.</p>
          )}
        </section>

        {/* Question 3: What did we learn? */}
        <section data-testid="what-we-learned">
          <h2 className="font-heading text-3xl font-bold mb-6">
            What did we learn?
          </h2>
          {data.what_we_learned?.length > 0 ? (
            <div className="space-y-3">
              {data.what_we_learned.map((item, i) => (
                <div
                  key={i}
                  className="flex items-start gap-4 p-4 bg-zinc-50 border border-zinc-200 rounded-sm"
                >
                  <Lightbulb className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <p className="text-lg">{item}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-zinc-500">No learnings documented yet.</p>
          )}
        </section>

        {/* Question 4: What's next? */}
        <section data-testid="whats-next">
          <h2 className="font-heading text-3xl font-bold mb-6">What's next?</h2>
          {data.whats_next?.length > 0 ? (
            <div className="space-y-3">
              {data.whats_next.map((item, i) => (
                <div
                  key={i}
                  className="flex items-start gap-4 p-4 border border-zinc-200 rounded-sm"
                >
                  <ArrowRight className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <p className="text-lg">{item}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-zinc-500">Priorities will be shared soon.</p>
          )}
        </section>

        {/* Experiments */}
        {data.experiments?.length > 0 && (
          <section data-testid="experiments-section">
            <h2 className="font-heading text-3xl font-bold mb-6">
              Active Experiments
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.experiments.map((exp) => (
                <Card
                  key={exp.experiment_id}
                  className="border-zinc-200"
                  data-testid={`client-exp-${exp.experiment_id}`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Beaker className="h-4 w-4 text-zinc-500" />
                          <Badge
                            variant="outline"
                            className="capitalize border-zinc-300"
                          >
                            {exp.status}
                          </Badge>
                        </div>
                        <h3 className="font-heading text-lg font-semibold">
                          {exp.name}
                        </h3>
                        {exp.hypothesis && (
                          <p className="text-sm text-zinc-600 mt-2">
                            We believe {exp.hypothesis.belief} for{" "}
                            {exp.hypothesis.target} because {exp.hypothesis.because}
                          </p>
                        )}
                      </div>
                    </div>
                    {exp.decision && (
                      <div className="mt-4 pt-4 border-t border-zinc-200">
                        <p className="text-sm">
                          <span className="font-medium capitalize">
                            Decision: {exp.decision.decision_type}
                          </span>
                        </p>
                        <p className="text-sm text-zinc-600 mt-1">
                          {exp.decision.rationale}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Creative Gallery */}
        {data.creative_gallery?.length > 0 && (
          <section data-testid="creative-gallery">
            <h2 className="font-heading text-3xl font-bold mb-6">
              Creative Gallery
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {data.creative_gallery.slice(0, 8).map((asset) => (
                <div
                  key={asset.asset_id}
                  className="aspect-square bg-zinc-100 rounded-sm overflow-hidden relative group"
                  data-testid={`client-asset-${asset.asset_id}`}
                >
                  {asset.thumbnail_url ? (
                    <img
                      src={asset.thumbnail_url}
                      alt={asset.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Image className="h-8 w-8 text-zinc-400" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                    <p className="text-white text-sm truncate">{asset.name}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Tracking Health */}
        <section data-testid="tracking-health">
          <h2 className="font-heading text-3xl font-bold mb-6">
            Tracking Health
          </h2>
          <div className="flex items-center gap-4 p-6 border border-zinc-200 rounded-sm">
            <div
              className={`w-4 h-4 rounded-full ${
                data.tracking_health?.status === "green"
                  ? "bg-green-500"
                  : data.tracking_health?.status === "yellow"
                  ? "bg-yellow-500"
                  : "bg-red-500"
              }`}
            />
            <div>
              <p className="font-medium capitalize">
                {data.tracking_health?.status === "green"
                  ? "All systems operational"
                  : data.tracking_health?.status === "yellow"
                  ? "Some issues detected"
                  : "Critical issues"}
              </p>
              {data.tracking_health?.issues && (
                <p className="text-sm text-zinc-500 mt-1">
                  {data.tracking_health.issues.join(", ")}
                </p>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 px-8 py-6 mt-12">
        <div className="max-w-5xl mx-auto flex items-center justify-between text-sm text-zinc-500">
          <div className="flex items-center gap-2">
            <img src={LOGO_URL} alt="thecommons" className="h-5 w-5 invert opacity-50" />
            <span>Powered by thecommons. Growth OS</span>
          </div>
          <span>© {new Date().getFullYear()}</span>
        </div>
      </footer>
    </div>
  );
}
