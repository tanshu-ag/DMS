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
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Car, Plus, RefreshCw, Search, AlertTriangle } from "lucide-react";

const Vehicles = () => {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [masterModels, setMasterModels] = useState([]);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [modelFilter, setModelFilter] = useState("all");

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
      params.append("brand", "renault");
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

  // Navigate to add vehicle page
  const handleAdd = () => {
    navigate("/vehicles/renault/new");
  };

  // Navigate to vehicle profile when clicking row
  const handleRowClick = (vehicleId) => {
    navigate(`/vehicles/renault/${vehicleId}`);
  };

  return (
    <div className="space-y-6" data-testid="vehicles-renault-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-black text-white rounded-sm flex items-center justify-center">
            <Car className="w-6 h-6" strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="font-heading font-black text-3xl md:text-4xl tracking-tighter uppercase">
              Renault
            </h1>
            <p className="text-sm text-gray-500 mt-1">Manage Renault vehicles</p>
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
              <TableHead className="text-xs font-bold uppercase tracking-wider">Model</TableHead>
              <TableHead className="text-xs font-bold uppercase tracking-wider">Customer</TableHead>
              <TableHead className="text-xs font-bold uppercase tracking-wider">Phone</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <div className="w-6 h-6 border-2 border-gray-700 border-t-transparent rounded-full animate-spin mx-auto"></div>
                </TableCell>
              </TableRow>
            ) : vehicles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                  No vehicles found
                </TableCell>
              </TableRow>
            ) : (
              vehicles.map(v => (
                <TableRow 
                  key={v.vehicle_id} 
                  className="border-b border-gray-100 hover:bg-gray-50/50 cursor-pointer"
                  onClick={() => handleRowClick(v.vehicle_id)}
                >
                  <TableCell className="font-mono text-sm font-medium">{v.vehicle_reg_no}</TableCell>
                  <TableCell>
                    <span className="font-mono text-xs text-blue-600 hover:text-blue-800 hover:underline">
                      {v.vin || "-"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="rounded-sm text-xs">
                        {v.model || "-"}
                      </Badge>
                      {v.model && !v.is_model_valid && (
                        <span className="text-amber-500" title="Model not in master list">
                          <AlertTriangle className="w-4 h-4" />
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{v.customer_name || "-"}</TableCell>
                  <TableCell className="font-mono text-xs">{v.customer_phone || "-"}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

export default Vehicles;
