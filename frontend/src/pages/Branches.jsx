import { useState, useEffect } from "react";
import { useAuth, API } from "@/App";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { MapPin, Plus, Edit2, Trash2, Star } from "lucide-react";

const Branches = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [branches, setBranches] = useState([]);
  const [branchTypes, setBranchTypes] = useState(["Sales", "Aftersales"]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [formData, setFormData] = useState({
    location: "",
    type: "Sales",
    address: "",
    is_primary: false,
  });

  useEffect(() => {
    // DP and CRM have admin access
    if (user?.role !== "CRM" && user?.role !== "DP") {
      toast.error("Access denied");
      navigate("/dashboard");
      return;
    }
    fetchBranches();
    fetchSettings();
  }, [user, navigate]);

  const fetchBranches = async () => {
    try {
      const response = await axios.get(`${API}/branches`, { withCredentials: true });
      setBranches(response.data);
    } catch (error) {
      toast.error("Failed to load branches");
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await axios.get(`${API}/settings`, { withCredentials: true });
      if (response.data.branch_types && response.data.branch_types.length > 0) {
        setBranchTypes(response.data.branch_types);
      }
    } catch (error) {
      console.error("Failed to load settings");
    }
  };
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.location || !formData.type) {
      toast.error("Please fill required fields");
      return;
    }

    try {
      if (editingBranch) {
        await axios.put(`${API}/branches/${editingBranch.branch_id}`, formData, {
          withCredentials: true,
        });
        toast.success("Branch updated");
      } else {
        await axios.post(`${API}/branches`, formData, { withCredentials: true });
        toast.success("Branch created");
      }
      setDialogOpen(false);
      resetForm();
      fetchBranches();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to save branch");
    }
  };

  const handleEdit = (branch) => {
    setEditingBranch(branch);
    setFormData({
      location: branch.location,
      type: branch.type,
      address: branch.address || "",
      is_primary: branch.is_primary || false,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (branchId) => {
    if (!window.confirm("Are you sure you want to delete this branch?")) return;

    try {
      await axios.delete(`${API}/branches/${branchId}`, { withCredentials: true });
      toast.success("Branch deleted");
      fetchBranches();
    } catch (error) {
      toast.error("Failed to delete branch");
    }
  };

  const resetForm = () => {
    setEditingBranch(null);
    setFormData({ 
      location: "", 
      type: branchTypes[0] || "Sales", 
      address: "", 
      is_primary: false 
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-black text-white rounded-sm flex items-center justify-center">
            <MapPin className="w-6 h-6" strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="font-heading font-black text-3xl md:text-4xl tracking-tighter uppercase">
              Branches
            </h1>
            <p className="text-sm text-gray-500 mt-1">Manage your service center locations</p>
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
              data-testid="add-branch-btn"
            >
              <Plus className="w-4 h-4 mr-2" strokeWidth={1.5} />
              Add New Branch
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-sm">
            <DialogHeader>
              <DialogTitle className="font-heading font-bold text-xl tracking-tight uppercase">
                {editingBranch ? "Edit Branch" : "Add New Branch"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div>
                <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1.5 block">
                  Location *
                </Label>
                <Input
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Branch location name"
                  className="rounded-sm"
                  data-testid="input-location"
                />
              </div>
              <div>
                <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1.5 block">
                  Type *
                </Label>
                <Select
                  value={formData.type}
                  onValueChange={(v) => setFormData({ ...formData, type: v })}
                >
                  <SelectTrigger className="rounded-sm" data-testid="input-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {branchTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1.5 block">
                  Address
                </Label>
                <Input
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Full address"
                  className="rounded-sm"
                  data-testid="input-address"
                />
              </div>
              <DialogFooter className="pt-4">
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
                  data-testid="save-branch-btn"
                >
                  {editingBranch ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Branches Table */}
      <Card className="border border-gray-200 rounded-sm shadow-none overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="table-header bg-gray-50">
              <TableHead className="text-xs">Location</TableHead>
              <TableHead className="text-xs">Type</TableHead>
              <TableHead className="text-xs">Address</TableHead>
              <TableHead className="text-xs w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {branches.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-gray-400 py-8">
                  No branches added yet. Click "Add New Branch" to get started.
                </TableCell>
              </TableRow>
            ) : (
              branches.map((branch) => (
                <TableRow key={branch.branch_id} className="hover:bg-gray-50">
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {branch.is_primary && (
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" strokeWidth={1.5} />
                      )}
                      <span>{branch.location}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-gray-600">{branch.type}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-gray-600">{branch.address || "-"}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-sm"
                        onClick={() => handleEdit(branch)}
                        data-testid={`edit-${branch.branch_id}`}
                      >
                        <Edit2 className="w-4 h-4" strokeWidth={1.5} />
                      </Button>
                      {!branch.is_primary && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-sm text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleDelete(branch.branch_id)}
                          data-testid={`delete-${branch.branch_id}`}
                        >
                          <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

export default Branches;
