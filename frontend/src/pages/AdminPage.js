import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { API, AuthContext } from "../App";
import {
  Users,
  Shield,
  Plus,
  Trash2,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { toast } from "sonner";

const ROLES = [
  { value: "admin", label: "Admin", color: "bg-red-900/50 text-red-400" },
  { value: "growth_lead", label: "Growth Lead", color: "bg-purple-900/50 text-purple-400" },
  { value: "performance", label: "Performance", color: "bg-blue-900/50 text-blue-400" },
  { value: "creative", label: "Creative", color: "bg-pink-900/50 text-pink-400" },
  { value: "analyst_ops", label: "Analyst/Ops", color: "bg-yellow-900/50 text-yellow-400" },
  { value: "client_viewer", label: "Client Viewer", color: "bg-green-900/50 text-green-400" },
];

export default function AdminPage() {
  const { user } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [workspaces, setWorkspaces] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newRole, setNewRole] = useState({ role: "", workspace_id: "" });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [usersRes, wsRes, logsRes] = await Promise.all([
        axios.get(`${API}/admin/users`),
        axios.get(`${API}/workspaces`),
        axios.get(`${API}/audit-logs?limit=20`),
      ]);
      setUsers(usersRes.data);
      setWorkspaces(wsRes.data);
      setAuditLogs(logsRes.data);
    } catch (error) {
      console.error("Failed to fetch admin data:", error);
    } finally {
      setLoading(false);
    }
  };

  const assignRole = async () => {
    if (!selectedUser || !newRole.role) return;
    try {
      await axios.post(
        `${API}/admin/users/${selectedUser.user_id}/roles`,
        {
          role: newRole.role,
          workspace_id: newRole.workspace_id || null,
        },
        
      );
      toast.success("Role assigned");
      setShowRoleDialog(false);
      setNewRole({ role: "", workspace_id: "" });
      fetchData();
    } catch (error) {
      toast.error("Failed to assign role");
    }
  };

  const removeRole = async (userId, assignmentId) => {
    try {
      await axios.delete(
        `${API}/admin/users/${userId}/roles/${assignmentId}`,
        
      );
      toast.success("Role removed");
      fetchData();
    } catch (error) {
      toast.error("Failed to remove role");
    }
  };

  const getRoleConfig = (role) => {
    return ROLES.find((r) => r.value === role) || { label: role, color: "" };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-zinc-500">Loading...</div>
      </div>
    );
  }

  // Check if current user is admin
  const isAdmin = user?.roles?.some((r) => r.role === "admin");
  if (!isAdmin) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 mx-auto text-red-500 mb-4" />
        <p className="text-zinc-500">Admin access required</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in" data-testid="admin-page">
      {/* Header */}
      <div>
        <h1 className="font-heading text-3xl font-bold tracking-tight">
          Admin Settings
        </h1>
        <p className="text-zinc-500 mt-1">
          Manage users, roles, and permissions
        </p>
      </div>

      {/* Users & Roles */}
      <Card className="bg-black border-zinc-800" data-testid="users-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-heading flex items-center gap-2">
            <Users className="h-5 w-5" />
            Users & Roles
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-800">
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Roles</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.user_id} className="border-zinc-800">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-zinc-800 flex items-center justify-center text-sm">
                        {u.name?.charAt(0)?.toUpperCase() || "U"}
                      </div>
                      <span className="font-medium">{u.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-zinc-500">{u.email}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {u.roles?.map((role) => {
                        const config = getRoleConfig(role.role);
                        const ws = workspaces.find(
                          (w) => w.workspace_id === role.workspace_id
                        );
                        return (
                          <div
                            key={role.assignment_id}
                            className="flex items-center gap-1"
                          >
                            <Badge className={config.color}>
                              {config.label}
                              {ws && ` (${ws.name})`}
                            </Badge>
                            <button
                              onClick={() => removeRole(u.user_id, role.assignment_id)}
                              className="text-zinc-500 hover:text-red-500 transition-colors"
                              data-testid={`remove-role-${role.assignment_id}`}
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-zinc-800"
                      onClick={() => {
                        setSelectedUser(u);
                        setShowRoleDialog(true);
                      }}
                      data-testid={`add-role-${u.user_id}`}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Role
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Audit Logs */}
      <Card className="bg-black border-zinc-800" data-testid="audit-logs-card">
        <CardHeader>
          <CardTitle className="text-lg font-heading flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Recent Audit Logs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {auditLogs.map((log) => (
              <div
                key={log.log_id}
                className="flex items-center justify-between p-3 border border-zinc-800 rounded-sm"
              >
                <div>
                  <p className="text-sm">
                    <span className="font-medium">{log.action}</span> on{" "}
                    <span className="text-zinc-500">{log.resource_type}</span>
                  </p>
                  <p className="text-xs text-zinc-500">
                    User: {log.user_id} •{" "}
                    {new Date(log.created_at).toLocaleString()}
                  </p>
                </div>
                <Badge variant="outline" className="border-zinc-700 text-xs">
                  {log.resource_id}
                </Badge>
              </div>
            ))}

            {auditLogs.length === 0 && (
              <div className="text-center py-8 text-zinc-500">
                No audit logs yet
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Role Assignment Dialog */}
      <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
        <DialogContent className="bg-zinc-900 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="font-heading">
              Assign Role to {selectedUser?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>Role</Label>
              <Select
                value={newRole.role}
                onValueChange={(value) =>
                  setNewRole({ ...newRole, role: value })
                }
              >
                <SelectTrigger className="bg-black border-zinc-800 mt-1">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800">
                  {ROLES.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Workspace (optional - leave empty for org-level)</Label>
              <Select
                value={newRole.workspace_id}
                onValueChange={(value) =>
                  setNewRole({ ...newRole, workspace_id: value })
                }
              >
                <SelectTrigger className="bg-black border-zinc-800 mt-1">
                  <SelectValue placeholder="Select workspace" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800">
                  <SelectItem value="">Organization Level</SelectItem>
                  {workspaces.map((ws) => (
                    <SelectItem key={ws.workspace_id} value={ws.workspace_id}>
                      {ws.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={assignRole}
              className="w-full bg-white text-black hover:bg-zinc-200"
              disabled={!newRole.role}
              data-testid="assign-role-submit"
            >
              Assign Role
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
