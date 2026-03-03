import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { API } from "@/App";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Car, Plus, RefreshCw, Search, Pencil, Trash2, Eye, AlertTriangle } from "lucide-react";

const Vehicles = () => {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [masterModels, setMasterModels] = useState([]);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [modelFilter, setModelFilter] = useState("all");
  
  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [formData, setFormData] = useState({
    vehicle_reg_no: "",
    vin: "",
    engine_no: "",
    model: "",
    customer_name: "",
    customer_phone: "",
  });
  const [saving, setSaving] = useState(false);

  // Fetch master models from settings
  const fetchMasterModels = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/settings`, { withCredentials: true });
      setMasterModels(res.data.vehicle_models || []);
    } catch (e) {
      console.error("Failed to fetch settings", e);
    }
  }, []);

  // Fetch vehicles
  const fetchVehicles = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (modelFilter && modelFilter !== "all") {
        params.append("model", modelFilter);
      }
      if (searchQuery.trim()) {
        params.append("search", searchQuery.trim());
      }
      const res = await axios.get(`${API}/vehicles?${params.toString()}`, { withCredentials: true });
      setVehicles(res.data);
    } catch (e) {
      toast.error("Failed to fetch vehicles");
    } finally {
      setLoading(false);
    }
  }, [modelFilter, searchQuery]);

  useEffect(() => {
    fetchMasterModels();
  }, [fetchMasterModels]);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  // Open modal for adding
  const handleAdd = () => {
    setEditingVehicle(null);
    setFormData({
      vehicle_reg_no: "",
      vin: "",
      engine_no: "",
      model: "",
      customer_name: "",
      customer_phone: "",
    });
    setModalOpen(true);
  };

  // Open modal for editing
  const handleEdit = (vehicle) => {
    setEditingVehicle(vehicle);
    setFormData({
      vehicle_reg_no: vehicle.vehicle_reg_no || "",
      vin: vehicle.vin || "",
      engine_no: vehicle.engine_no || "",
      model: vehicle.is_model_valid ? vehicle.model : "", // Force re-selection if invalid
      customer_name: vehicle.customer_name || "",
      customer_phone: vehicle.customer_phone || "",
    });
    setModalOpen(true);
  };

  // Save vehicle
  const handleSave = async () => {
    if (!formData.vehicle_reg_no) {
      toast.error("Registration number is required");
      return;
    }
    if (!formData.model) {
      toast.error("Please select a model from the list");
      return;
    }

    setSaving(true);
    try {
      if (editingVehicle) {
        await axios.put(`${API}/vehicles/${editingVehicle.vehicle_id}`, formData, { withCredentials: true });
        toast.success("Vehicle updated");
      } else {
        await axios.post(`${API}/vehicles`, formData, { withCredentials: true });
        toast.success("Vehicle added");
      }
      setModalOpen(false);
      fetchVehicles();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Failed to save vehicle");
    } finally {
      setSaving(false);
    }
  };

  // Delete vehicle
  const handleDelete = async (vehicleId) => {
    if (!window.confirm("Are you sure you want to delete this vehicle?")) return;
    try {
      await axios.delete(`${API}/vehicles/${vehicleId}`, { withCredentials: true });
      toast.success("Vehicle deleted");
      fetchVehicles();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Failed to delete vehicle");
    }
  };

  // Get display model (handle unmapped)
  const getDisplayModel = (vehicle) => {
    if (!vehicle.model) return "-";
    if (vehicle.is_model_valid) return vehicle.model;
    return "(Unmapped)";
  };

  return (
    <div className="space-y-6" data-testid="vehicles-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-black text-white rounded-sm flex items-center justify-center">
            <Car className="w-6 h-6" strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="font-heading font-black text-3xl md:text-4xl tracking-tighter uppercase">
              Vehicles
            </h1>
            <p className="text-sm text-gray-500 mt-1">Manage customer vehicles</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="rounded-sm" onClick={fetchVehicles} data-testid="refresh-btn">
            <RefreshCw className="w-4 h-4" strokeWidth={1.5} />
          </Button>
          <Button className="rounded-sm bg-black text-white hover:bg-gray-800" onClick={handleAdd} data-testid="add-vehicle-btn">
            <Plus className="w-4 h-4 mr-1" strokeWidth={1.5} /> Add Vehicle
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="border border-gray-200 rounded-sm shadow-none">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <Label className="text-xs text-gray-500 mb-1 block">Search</Label>
              <div className="flex gap-2">
                <Input 
                  placeholder="Reg No / VIN / Engine No / Phone / Customer" 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && fetchVehicles()}
                  className="rounded-sm"
                  data-testid="search-input"
                />
                <Button variant="outline" className="rounded-sm" onClick={fetchVehicles} data-testid="search-btn">
                  <Search className="w-4 h-4" strokeWidth={1.5} />
                </Button>
              </div>
            </div>
            <div className="w-48">
              <Label className="text-xs text-gray-500 mb-1 block">Model</Label>
              <Select value={modelFilter} onValueChange={setModelFilter}>
                <SelectTrigger className="rounded-sm" data-testid="model-filter">
                  <SelectValue placeholder="All Models" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Models</SelectItem>
                  {masterModels.map(m => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vehicles Table */}
      <Card className="border border-gray-200 rounded-sm shadow-none">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-gray-200 bg-gray-50/50">
              <TableHead className="text-xs font-bold uppercase tracking-wider">Reg No</TableHead>
              <TableHead className="text-xs font-bold uppercase tracking-wider">VIN</TableHead>
              <TableHead className="text-xs font-bold uppercase tracking-wider">Engine No</TableHead>
              <TableHead className="text-xs font-bold uppercase tracking-wider">Model</TableHead>
              <TableHead className="text-xs font-bold uppercase tracking-wider">Customer</TableHead>
              <TableHead className="text-xs font-bold uppercase tracking-wider">Phone</TableHead>
              <TableHead className="text-xs font-bold uppercase tracking-wider w-20">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto"></div>
                </TableCell>
              </TableRow>
            ) : vehicles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                  No vehicles found
                </TableCell>
              </TableRow>
            ) : (
              vehicles.map(v => (
                <TableRow key={v.vehicle_id} className="border-b border-gray-100 hover:bg-gray-50/50">
                  <TableCell className="font-mono text-sm font-medium">{v.vehicle_reg_no}</TableCell>
                  <TableCell className="font-mono text-xs text-gray-500">{v.vin || "-"}</TableCell>
                  <TableCell className="font-mono text-xs text-gray-500">{v.engine_no || "-"}</TableCell>
                  <TableCell>
                    {v.is_model_valid ? (
                      <Badge variant="outline" className="rounded-sm text-xs">{v.model}</Badge>
                    ) : v.model ? (
                      <Badge variant="outline" className="rounded-sm text-xs text-amber-600 border-amber-300 bg-amber-50">
                        <AlertTriangle className="w-3 h-3 mr-1" /> (Unmapped)
                      </Badge>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">{v.customer_name || "-"}</TableCell>
                  <TableCell className="font-mono text-xs">{v.customer_phone || "-"}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7 rounded-sm" onClick={() => navigate(`/vehicles/renault/${v.vehicle_id}`)} data-testid={`view-${v.vehicle_id}`}>
                        <Eye className="w-4 h-4" strokeWidth={1.5} />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 rounded-sm" onClick={() => handleEdit(v)} data-testid={`edit-${v.vehicle_id}`}>
                        <Pencil className="w-4 h-4" strokeWidth={1.5} />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 rounded-sm text-red-500 hover:text-red-600" onClick={() => handleDelete(v.vehicle_id)} data-testid={`delete-${v.vehicle_id}`}>
                        <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Add/Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-lg" data-testid="vehicle-modal">
          <DialogHeader>
            <DialogTitle className="font-heading font-bold text-lg tracking-tight uppercase">
              {editingVehicle ? "Edit Vehicle" : "Add Vehicle"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Show stored model warning if editing unmapped vehicle */}
            {editingVehicle && !editingVehicle.is_model_valid && editingVehicle.model && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-sm">
                <p className="text-xs text-amber-700 flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Stored model: <span className="font-mono font-medium">{editingVehicle.model}</span> (not in master list)</span>
                </p>
                <p className="text-xs text-amber-600 mt-1">Please select a valid model from the dropdown below.</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">Registration No *</Label>
                <Input 
                  value={formData.vehicle_reg_no}
                  onChange={e => setFormData({ ...formData, vehicle_reg_no: e.target.value.toUpperCase() })}
                  className="rounded-sm uppercase"
                  placeholder="KA01AB1234"
                  data-testid="input-reg-no"
                />
              </div>
              <div>
                <Label className="text-xs">Model *</Label>
                {masterModels.length === 0 ? (
                  <div className="p-2 border border-dashed border-gray-300 rounded-sm bg-gray-50 text-center">
                    <p className="text-xs text-gray-500">No models available</p>
                    <p className="text-xs text-gray-400">Add models from Other Settings</p>
                  </div>
                ) : (
                  <Select value={formData.model} onValueChange={v => setFormData({ ...formData, model: v })}>
                    <SelectTrigger className="rounded-sm" data-testid="input-model">
                      <SelectValue placeholder="Select model" />
                    </SelectTrigger>
                    <SelectContent>
                      {masterModels.map(m => (
                        <SelectItem key={m} value={m}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">VIN</Label>
                <Input 
                  value={formData.vin}
                  onChange={e => setFormData({ ...formData, vin: e.target.value.toUpperCase() })}
                  className="rounded-sm uppercase"
                  placeholder="Optional"
                  data-testid="input-vin"
                />
              </div>
              <div>
                <Label className="text-xs">Engine No</Label>
                <Input 
                  value={formData.engine_no}
                  onChange={e => setFormData({ ...formData, engine_no: e.target.value.toUpperCase() })}
                  className="rounded-sm uppercase"
                  placeholder="Optional"
                  data-testid="input-engine-no"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">Customer Name</Label>
                <Input 
                  value={formData.customer_name}
                  onChange={e => setFormData({ ...formData, customer_name: e.target.value })}
                  className="rounded-sm"
                  placeholder="Optional"
                  data-testid="input-customer-name"
                />
              </div>
              <div>
                <Label className="text-xs">Customer Phone</Label>
                <Input 
                  value={formData.customer_phone}
                  onChange={e => setFormData({ ...formData, customer_phone: e.target.value })}
                  className="rounded-sm"
                  placeholder="Optional"
                  data-testid="input-customer-phone"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" className="rounded-sm" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              className="rounded-sm bg-black text-white hover:bg-gray-800" 
              onClick={handleSave}
              disabled={saving || !formData.vehicle_reg_no || !formData.model || masterModels.length === 0}
              data-testid="save-vehicle-btn"
            >
              {saving ? "Saving..." : editingVehicle ? "Update" : "Add Vehicle"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Vehicles;
