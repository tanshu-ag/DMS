import { useState, useEffect } from "react";
import { useAuth, API } from "@/App";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  DialogFooter,
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
  Key,
  Lock,
  LockOpen,
} from "lucide-react";

const DEPARTMENTS = [
  "Customer Relations",
  "Parts",
  "Bodyshop",
  "Mechanical",
  "Insurance",
  "HR",
  "Customers",
  "Admin",
];

const MODULES = [
  "Dashboard",
  "Customer Relations",
  "Parts",
  "Bodyshop",
  "Mechanical",
  "Insurance",
  "HR",
  "Customers",
  "Settings",
  "Users",
];

const UserManagement = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [resetPasswordUser, setResetPasswordUser] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [activeTab, setActiveTab] = useState("active");
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    name: "",
    role: "CRE",
    email: "",
    mobile: "",
    department: "Customer Relations",
    designation: "",
    branch: "",
    is_active: true,
    module_access: ["Dashboard", "Customer Relations"],
  });

  useEffect(() => {
    // DP and CRM have admin access
    if (user?.role !== "CRM" && user?.role !== "DP") {
      toast.error("Access denied");
      navigate("/dashboard");
      return;
    }
    fetchUsers();
    fetchSettings();
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

  const fetchSettings = async () => {
    try {
      const response = await axios.get(`${API}/settings`, { withCredentials: true });
      setBranches(response.data.branches || []);
    } catch (error) {
      console.error("Failed to load settings");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.department || !formData.designation) {
      toast.error("Please fill required fields");
      return;
    }

    if (!editingUser && (!formData.username || !formData.password)) {
      toast.error("Username and password are required for new users");
      return;
    }

    try {
      if (editingUser) {
        const updateData = {
          name: formData.name,
          role: formData.role,
          email: formData.email || null,
          mobile: formData.mobile || null,
          department: formData.department,
          designation: formData.designation,
          branch: formData.branch || null,
          is_active: formData.is_active,
          module_access: formData.module_access,
        };
        await axios.put(`${API}/users/${editingUser.user_id}`, updateData, {
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
      username: u.username,
      password: "",
      name: u.name,
      role: u.role,
      email: u.email || "",
      mobile: u.mobile || "",
      department: u.department || "Customer Relations",
      designation: u.designation || "",
      branch: u.branch || "",
      is_active: u.is_active,
      module_access: u.module_access || ["Dashboard"],
    });
    setDialogOpen(true);
  };

  const handleDeactivate = async () => {
    if (!window.confirm("Are you sure you want to deactivate this user?")) return;

    try {
      await axios.put(
        `${API}/users/${editingUser.user_id}`,
        { is_active: false },
        { withCredentials: true }
      );
      toast.success("User deactivated");
      setDialogOpen(false);
      resetForm();
      fetchUsers();
    } catch (error) {
      toast.error("Failed to deactivate user");
    }
  };

  const handleToggleLock = async (userId, currentLockStatus) => {
    try {
      await axios.post(`${API}/users/${userId}/toggle-lock`, {}, { withCredentials: true });
      toast.success(currentLockStatus ? "User unlocked" : "User locked");
      fetchUsers();
    } catch (error) {
      toast.error("Failed to update lock status");
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword) {
      toast.error("Please enter a new password");
      return;
    }

    try {
      await axios.post(
        `${API}/users/${resetPasswordUser.user_id}/reset-password`,
        { password: newPassword },
        { withCredentials: true }
      );
      toast.success("Password reset successfully");
      setResetPasswordDialogOpen(false);
      setResetPasswordUser(null);
      setNewPassword("");
    } catch (error) {
      toast.error("Failed to reset password");
    }
  };

  const resetForm = () => {
    setEditingUser(null);
    setFormData({
      username: "",
      password: "",
      name: "",
      role: "CRE",
      email: "",
      mobile: "",
      department: "Customer Relations",
      designation: "",
      branch: "",
      is_active: true,
      module_access: ["Dashboard", "Customer Relations"],
    });
  };

  const handleModuleAccessChange = (module, checked) => {
    if (checked) {
      setFormData({
        ...formData,
        module_access: [...formData.module_access, module],
      });
    } else {
      setFormData({
        ...formData,
        module_access: formData.module_access.filter((m) => m !== module),
      });
    }
  };

  const handleDepartmentChange = (dept) => {
    let defaultModules = ["Dashboard"];
    
    // Auto-enable department-related module
    const deptModuleMap = {
      "Customer Relations": "Customer Relations",
      "Parts": "Parts",
      "Bodyshop": "Bodyshop",
      "Mechanical": "Mechanical",
      "Insurance": "Insurance",
      "HR": "HR",
      "Customers": "Customers",
      "Admin": "Settings",
    };

    if (deptModuleMap[dept]) {
      defaultModules.push(deptModuleMap[dept]);
    }

    // Admin department gets Settings + Users
    if (dept === "Admin") {
      defaultModules.push("Users");
    }

    setFormData({
      ...formData,
      department: dept,
      module_access: defaultModules,
    });
  };

  const filteredUsers = users.filter((u) =>
    activeTab === "active" ? u.is_active : !u.is_active
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6" data-testid="users-page">
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
            <p className="text-sm text-gray-500 mt-1">Manage team members and access</p>
          </div>
        </div>

        <Dialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button
              className="bg-black text-white hover:bg-gray-800 rounded-sm font-mono text-xs uppercase tracking-wider"
              data-testid="add-user-btn"
            >
              <Plus className="w-4 h-4 mr-2" strokeWidth={1.5} />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-sm max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-heading font-bold text-xl tracking-tight uppercase">
                {editingUser ? "Edit User" : "Add User"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1.5 block">
                    Name *
                  </Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Full name"
                    className="rounded-sm"
                    data-testid="input-name"
                  />
                </div>
                <div>
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1.5 block">
                    Username *
                  </Label>
                  <Input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="username"
                    className="rounded-sm font-mono"
                    disabled={!!editingUser}
                    data-testid="input-username"
                  />
                  {editingUser && (
                    <p className="text-[10px] text-gray-400 mt-1">Username cannot be changed</p>
                  )}
                </div>
              </div>

              {!editingUser && (
                <div>
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1.5 block">
                    Password *
                  </Label>
                  <Input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Password"
                    className="rounded-sm"
                    data-testid="input-password"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1.5 block">
                    Email
                  </Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@bohania.com"
                    className="rounded-sm"
                    data-testid="input-email"
                  />
                </div>
                <div>
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1.5 block">
                    Mobile
                  </Label>
                  <Input
                    type="tel"
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                    placeholder="Mobile number"
                    className="rounded-sm"
                    data-testid="input-mobile"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1.5 block">
                    Department *
                  </Label>
                  <Select
                    value={formData.department}
                    onValueChange={handleDepartmentChange}
                  >
                    <SelectTrigger className="rounded-sm" data-testid="input-department">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DEPARTMENTS.map((dept) => (
                        <SelectItem key={dept} value={dept}>
                          {dept}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1.5 block">
                    Designation *
                  </Label>
                  <Input
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    placeholder="Job title"
                    className="rounded-sm"
                    data-testid="input-designation"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1.5 block">
                    Branch
                  </Label>
                  {branches.length > 0 ? (
                    <Select
                      value={formData.branch}
                      onValueChange={(v) => setFormData({ ...formData, branch: v })}
                    >
                      <SelectTrigger className="rounded-sm" data-testid="input-branch">
                        <SelectValue placeholder="Select branch" />
                      </SelectTrigger>
                      <SelectContent>
                        {branches.map((branch) => (
                          <SelectItem key={branch} value={branch}>
                            {branch}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      value={formData.branch}
                      onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                      placeholder="Branch name"
                      className="rounded-sm"
                      data-testid="input-branch"
                    />
                  )}
                </div>
                <div>
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1.5 block">
                    Status *
                  </Label>
                  <Select
                    value={formData.is_active ? "active" : "inactive"}
                    onValueChange={(v) => setFormData({ ...formData, is_active: v === "active" })}
                  >
                    <SelectTrigger className="rounded-sm" data-testid="input-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1.5 block">
                  Role *
                </Label>
                <Select
                  value={formData.role}
                  onValueChange={(v) => setFormData({ ...formData, role: v })}
                >
                  <SelectTrigger className="rounded-sm" data-testid="input-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CRE">CRE (Customer Relationship Executive)</SelectItem>
                    <SelectItem value="Receptionist">Receptionist</SelectItem>
                    <SelectItem value="CRM">CRM (Customer Relationship Manager)</SelectItem>
                    <SelectItem value="DP">DP (Dealer Principal)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-3 block">
                  Module Access
                </Label>
                <div className="grid grid-cols-2 gap-3 p-4 border border-gray-200 rounded-sm">
                  {MODULES.map((module) => {
                    const isAdminModule = module === "Settings" || module === "Users";
                    const isDisabled = isAdminModule && formData.department !== "Admin";

                    return (
                      <div key={module} className="flex items-center space-x-2">
                        <Checkbox
                          id={`module-${module}`}
                          checked={formData.module_access.includes(module)}
                          onCheckedChange={(checked) =>
                            handleModuleAccessChange(module, checked)
                          }
                          disabled={isDisabled}
                          className="rounded-sm"
                        />
                        <label
                          htmlFor={`module-${module}`}
                          className={`text-sm ${isDisabled ? "text-gray-400" : "text-gray-700"}`}
                        >
                          {module}
                          {isDisabled && (
                            <span className="text-xs text-gray-400 ml-1">(Admin only)</span>
                          )}
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>

              <DialogFooter className="flex justify-between items-center pt-4 border-t">
                <div>
                  {editingUser && editingUser.is_active && (
                    <Button
                      type="button"
                      variant="outline"
                      className="text-red-600 border-red-200 hover:bg-red-50 rounded-sm"
                      onClick={handleDeactivate}
                    >
                      Deactivate User
                    </Button>
                  )}
                </div>
                <div className="flex gap-2">
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
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border border-gray-200 rounded-sm shadow-none">
          <CardContent className="p-4 text-center">
            <p className="font-heading font-black text-3xl">
              {users.filter((u) => u.role === "DP" || u.role === "CRM").length}
            </p>
            <p className="text-xs font-mono uppercase tracking-wider text-gray-500">Admin</p>
          </CardContent>
        </Card>
        <Card className="border border-gray-200 rounded-sm shadow-none">
          <CardContent className="p-4 text-center">
            <p className="font-heading font-black text-3xl">
              {users.filter((u) => u.role === "Receptionist").length}
            </p>
            <p className="text-xs font-mono uppercase tracking-wider text-gray-500">
              Receptionist
            </p>
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

      {/* Tabs and Users Table */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="active" className="rounded-sm">
            Active
          </TabsTrigger>
          <TabsTrigger value="inactive" className="rounded-sm">
            Inactive
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          <Card className="border border-gray-200 rounded-sm shadow-none overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="table-header bg-gray-50">
                  <TableHead className="text-xs">Name</TableHead>
                  <TableHead className="text-xs">Username</TableHead>
                  <TableHead className="text-xs">Department</TableHead>
                  <TableHead className="text-xs">Designation</TableHead>
                  <TableHead className="text-xs w-32">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((u) => (
                  <TableRow
                    key={u.user_id}
                    className="hover:bg-gray-50"
                    data-testid={`user-row-${u.user_id}`}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-200 rounded-sm flex items-center justify-center">
                          <span className="text-xs font-bold">{u.name?.[0] || "U"}</span>
                        </div>
                        <span className="font-medium">{u.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{u.username}</TableCell>
                    <TableCell className="text-sm">{u.department || "-"}</TableCell>
                    <TableCell className="text-sm">{u.designation || "-"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-sm"
                          onClick={() => handleEdit(u)}
                          data-testid={`edit-${u.user_id}`}
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" strokeWidth={1.5} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-sm"
                          onClick={() => {
                            setResetPasswordUser(u);
                            setResetPasswordDialogOpen(true);
                          }}
                          data-testid={`reset-password-${u.user_id}`}
                          title="Reset Password"
                        >
                          <Key className="w-4 h-4" strokeWidth={1.5} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-sm"
                          onClick={() => handleToggleLock(u.user_id, u.is_locked)}
                          data-testid={`lock-${u.user_id}`}
                          title={u.is_locked ? "Unlock" : "Lock"}
                        >
                          {u.is_locked ? (
                            <div className="w-5 h-5 bg-black rounded-full flex items-center justify-center">
                              <Lock className="w-3 h-3 text-white" strokeWidth={2} />
                            </div>
                          ) : (
                            <LockOpen className="w-4 h-4" strokeWidth={1.5} />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Demo Credentials */}
      <Card className="border border-dashed border-gray-300 rounded-sm shadow-none">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-mono uppercase tracking-wider text-gray-500">
            Default Login Credentials
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-xs text-gray-500 mb-3">
            Users sign in with their username and password. Default accounts created during setup:
          </p>
          <div className="space-y-1 text-xs font-mono bg-gray-50 p-3 rounded-sm">
            <p>
              <span className="text-gray-400">Dealer Principal:</span> admin / admin
            </p>
            <p>
              <span className="text-gray-400">Receptionist:</span> reception / reception123
            </p>
            <p>
              <span className="text-gray-400">CRE 1:</span> cre1 / cre123
            </p>
            <p>
              <span className="text-gray-400">CRE 2:</span> cre2 / cre123
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Reset Password Dialog */}
      <Dialog open={resetPasswordDialogOpen} onOpenChange={setResetPasswordDialogOpen}>
        <DialogContent className="rounded-sm">
          <DialogHeader>
            <DialogTitle className="font-heading font-bold text-xl tracking-tight uppercase">
              Reset Password
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <p className="text-sm text-gray-600">
              Reset password for <strong>{resetPasswordUser?.name}</strong>
            </p>
            <div>
              <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1.5 block">
                New Password *
              </Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                className="rounded-sm"
              />
            </div>
          </div>
          <DialogFooter className="pt-4">
            <Button
              variant="outline"
              className="rounded-sm"
              onClick={() => {
                setResetPasswordDialogOpen(false);
                setResetPasswordUser(null);
                setNewPassword("");
              }}
            >
              Cancel
            </Button>
            <Button
              className="bg-black text-white hover:bg-gray-800 rounded-sm"
              onClick={handleResetPassword}
            >
              Reset Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagement;
