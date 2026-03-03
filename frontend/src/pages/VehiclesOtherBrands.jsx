import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { API } from "@/App";
import axios from "axios";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Car, Plus, RefreshCw, Search, Pencil, Trash2, Eye } from "lucide-react";

const VehiclesOtherBrands = () => {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch vehicles (only "other" brand)
  const fetchVehicles = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("brand", "other");
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
  }, [searchQuery]);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  // Navigate to add vehicle page
  const handleAdd = () => {
    navigate("/vehicles/other-brands/new");
  };

  // Navigate to edit vehicle page
  const handleEdit = (vehicle) => {
    navigate(`/vehicles/other-brands/${vehicle.vehicle_id}/edit`);
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

  return (
    <div className="space-y-6" data-testid="vehicles-other-brands-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-black text-white rounded-sm flex items-center justify-center">
            <Car className="w-6 h-6" strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="font-heading font-black text-3xl md:text-4xl tracking-tighter uppercase">
              Other Brands
            </h1>
            <p className="text-sm text-gray-500 mt-1">Manage non-Renault vehicles</p>
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
                  placeholder="Reg No / VIN / Engine No / Make / Phone / Customer" 
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
              <TableHead className="text-xs font-bold uppercase tracking-wider">Brand</TableHead>
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
                  <div className="w-6 h-6 border-2 border-gray-700 border-t-transparent rounded-full animate-spin mx-auto"></div>
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
                  <TableCell>
                    <Badge variant="secondary" className="rounded-sm text-xs bg-gray-100">
                      {v.make || "-"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{v.model || "-"}</TableCell>
                  <TableCell className="text-sm">{v.customer_name || "-"}</TableCell>
                  <TableCell className="font-mono text-xs">{v.customer_phone || "-"}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7 rounded-sm" onClick={() => navigate(`/vehicles/other-brands/${v.vehicle_id}`)} data-testid={`view-${v.vehicle_id}`}>
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
    </div>
  );
};

export default VehiclesOtherBrands;
