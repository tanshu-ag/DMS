import { useState, useEffect } from "react";
import { useAuth, API } from "@/App";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import {
  Users,
  Plus,
  Edit2,
  Trash2,
  UserCheck,
  UserX,
} from "lucide-react";

const UserManagement = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    email: "",
    name: "",
    role: "CRE",
  });

  useEffect(() => {
    if (user?.role !== "CRM") {
      toast.error("Access denied");
      navigate("/dashboard");
      return;
    }
    fetchUsers();
  }, [user, navigate]);

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API}/users`, { withCredentials: true });
      setUsers(response.data);
    } catch (error) {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.email || !formData.name || !formData.role) {
      toast.error("Please fill all fields");
      return;
    }

    try {
      if (editingUser) {
        await axios.put(`${API}/users/${editingUser.user_id}`, formData, {
          withCredentials: true,
        });
        toast.success("User updated");
      } else {
        await axios.post(`${API}/users`, formData, { withCredentials: true });
        toast.success("User created");
      }
      setDialogOpen(false);
      resetForm();
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to save user");
    }
  };

  const handleEdit = (u) => {
    setEditingUser(u);
    setFormData({
      email: u.email,
      name: u.name,
      role: u.role,
    });
    setDialogOpen(true);
  };

  const handleDeactivate = async (userId) => {
    if (!confirm("Are you sure you want to deactivate this user?")) return;

    try {
      await axios.delete(`${API}/users/${userId}`, { withCredentials: true });
      toast.success("User deactivated");
      fetchUsers();
    } catch (error) {
      toast.error("Failed to deactivate user");
    }
  };

  const resetForm = () => {
    setEditingUser(null);
    setFormData({ email: "", name: "", role: "CRE" });
  };

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case "CRM":
        return "bg-black text-white";
      case "Receptionist":
        return "bg-gray-200 text-black border border-black";
      default:
        return "bg-white text-black border border-dashed border-black";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6" data-testid="users-page">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-black text-white rounded-sm flex items-center justify-center">
            <Users className="w-6 h-6" strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="font-heading font-black text-3xl md:text-4xl tracking-tighter uppercase">
              Users
            </h1>
            <p className="text-sm text-gray-500 mt-1">Manage team members and roles</p>
          </div>
        </div>

        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button
              className="bg-black text-white hover:bg-gray-800 rounded-sm font-mono text-xs uppercase tracking-wider"
              data-testid="add-user-btn"
            >
              <Plus className="w-4 h-4 mr-2" strokeWidth={1.5} />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-sm">
            <DialogHeader>
              <DialogTitle className="font-heading font-bold text-xl tracking-tight uppercase">
                {editingUser ? "Edit User" : "Add User"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div>
                <Label className="form-label">Email</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="user@bohania.com"
                  className="rounded-sm"
                  disabled={!!editingUser}
                  data-testid="input-email"
                />
                {editingUser && (
                  <p className="text-[10px] text-gray-400 mt-1">Email cannot be changed</p>
                )}
              </div>
              <div>
                <Label className="form-label">Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Full name"
                  className="rounded-sm"
                  data-testid="input-name"
                />
              </div>
              <div>
                <Label className="form-label">Role</Label>
                <Select
                  value={formData.role}
                  onValueChange={(v) => setFormData({ ...formData, role: v })}
                >
                  <SelectTrigger className="rounded-sm" data-testid="input-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CRE">CRE</SelectItem>
                    <SelectItem value="Receptionist">Receptionist</SelectItem>
                    <SelectItem value="CRM">CRM (Admin)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-sm"
                  onClick={() => setDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-black text-white hover:bg-gray-800 rounded-sm"
                  data-testid="save-user-btn"
                >
                  {editingUser ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border border-gray-200 rounded-sm shadow-none">
          <CardContent className="p-4 text-center">
            <p className="font-heading font-black text-3xl">
              {users.filter((u) => u.role === "CRM").length}
            </p>
            <p className="text-xs font-mono uppercase tracking-wider text-gray-500">CRM</p>
          </CardContent>
        </Card>
        <Card className="border border-gray-200 rounded-sm shadow-none">
          <CardContent className="p-4 text-center">
            <p className="font-heading font-black text-3xl">
              {users.filter((u) => u.role === "Receptionist").length}
            </p>
            <p className="text-xs font-mono uppercase tracking-wider text-gray-500">Receptionist</p>
          </CardContent>
        </Card>
        <Card className="border border-gray-200 rounded-sm shadow-none">
          <CardContent className="p-4 text-center">
            <p className="font-heading font-black text-3xl">
              {users.filter((u) => u.role === "CRE").length}
            </p>
            <p className="text-xs font-mono uppercase tracking-wider text-gray-500">CRE</p>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card className="border border-gray-200 rounded-sm shadow-none overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="table-header bg-gray-50">
              <TableHead className="text-xs">Name</TableHead>
              <TableHead className="text-xs">Email</TableHead>
              <TableHead className="text-xs">Role</TableHead>
              <TableHead className="text-xs">Status</TableHead>
              <TableHead className="text-xs w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.user_id} className="hover:bg-gray-50" data-testid={`user-row-${u.user_id}`}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    {u.picture ? (
                      <img src={u.picture} alt="" className="w-8 h-8 rounded-sm object-cover" />
                    ) : (
                      <div className="w-8 h-8 bg-gray-200 rounded-sm flex items-center justify-center">
                        <span className="text-xs font-bold">{u.name?.[0] || "U"}</span>
                      </div>
                    )}
                    <span className="font-medium">{u.name}</span>
                  </div>
                </TableCell>
                <TableCell className="font-mono text-sm">{u.email}</TableCell>
                <TableCell>
                  <Badge className={`rounded-sm text-xs ${getRoleBadgeClass(u.role)}`}>
                    {u.role}
                  </Badge>
                </TableCell>
                <TableCell>
                  {u.is_active ? (
                    <Badge variant="outline" className="rounded-sm text-xs border-black">
                      <UserCheck className="w-3 h-3 mr-1" strokeWidth={1.5} />
                      Active
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="rounded-sm text-xs text-gray-400">
                      <UserX className="w-3 h-3 mr-1" strokeWidth={1.5} />
                      Inactive
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-sm"
                      onClick={() => handleEdit(u)}
                      data-testid={`edit-${u.user_id}`}
                    >
                      <Edit2 className="w-4 h-4" strokeWidth={1.5} />
                    </Button>
                    {u.user_id !== user?.user_id && u.is_active && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-sm text-gray-400 hover:text-black"
                        onClick={() => handleDeactivate(u.user_id)}
                        data-testid={`deactivate-${u.user_id}`}
                      >
                        <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Demo Credentials */}
      <Card className="border border-dashed border-gray-300 rounded-sm shadow-none">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-mono uppercase tracking-wider text-gray-500">
            Demo Login Info
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-xs text-gray-500">
            Users can sign in with their Google account. The first login assigns them as CRE by default.
            CRM can then update their role from this page. Pre-seeded users will be available after running seed endpoint.
          </p>
          <div className="mt-3 space-y-1 text-xs font-mono">
            <p><span className="text-gray-400">CRM:</span> crm@bohania.com</p>
            <p><span className="text-gray-400">Receptionist:</span> reception@bohania.com</p>
            <p><span className="text-gray-400">CRE 1:</span> cre1@bohania.com</p>
            <p><span className="text-gray-400">CRE 2:</span> cre2@bohania.com</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserManagement;
