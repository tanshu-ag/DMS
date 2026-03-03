import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { API } from "@/App";
import axios from "axios";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { ArrowLeft, Pencil } from "lucide-react";
import { toast } from "sonner";

// Helper to display value or dash
const DisplayValue = ({ value }) => (
  <span className="text-sm">{value || "—"}</span>
);

// Field row component
const FieldRow = ({ label, value }) => (
  <div className="py-2 border-b border-gray-100 last:border-0">
    <Label className="text-xs text-gray-500 uppercase tracking-wider">{label}</Label>
    <p className="mt-1"><DisplayValue value={value} /></p>
  </div>
);

// Section component for grouping fields
const Section = ({ title, children }) => (
  <div className="mb-6">
    {title && <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">{title}</h3>}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8">
      {children}
    </div>
  </div>
);

const VehicleProfile = ({ brand = "renault" }) => {
  const { vehicleId } = useParams();
  const navigate = useNavigate();
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("vehicle");
  const [masterModels, setMasterModels] = useState([]);
  
  // Edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [saving, setSaving] = useState(false);

  const isRenault = brand === "renault";

  // Fetch master models for Renault
  useEffect(() => {
    const fetchMasterModels = async () => {
      if (!isRenault) return;
      try {
        const res = await axios.get(`${API}/settings`, { withCredentials: true });
        setMasterModels(res.data.vehicle_models || []);
      } catch (e) {
        console.error("Failed to fetch settings", e);
      }
    };
    fetchMasterModels();
  }, [isRenault]);

  useEffect(() => {
    const fetchVehicle = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API}/vehicles/${vehicleId}`, { withCredentials: true });
        setVehicle(res.data);
      } catch (e) {
        console.error("Failed to fetch vehicle", e);
      } finally {
        setLoading(false);
      }
    };
    if (vehicleId) fetchVehicle();
  }, [vehicleId]);

  const handleBack = () => {
    navigate(isRenault ? "/vehicles/renault" : "/vehicles/other-brands");
  };

  const handleOpenEdit = () => {
    setEditFormData({
      vehicle_reg_no: vehicle.vehicle_reg_no || "",
      vin: vehicle.vin || "",
      engine_no: vehicle.engine_no || "",
      model: vehicle.model || "",
      make: vehicle.make || "",
      customer_name: vehicle.customer_name || "",
      customer_phone: vehicle.customer_phone || "",
      customer_email: vehicle.customer_email || "",
      contact_address: vehicle.contact_address || "",
      contact_city: vehicle.contact_city || "",
      contact_state: vehicle.contact_state || "",
      contact_zipcode: vehicle.contact_zipcode || "",
    });
    setEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editFormData.vehicle_reg_no) {
      toast.error("Registration number is required");
      return;
    }
    if (isRenault && !editFormData.model) {
      toast.error("Model is required for Renault vehicles");
      return;
    }
    if (!isRenault && !editFormData.make) {
      toast.error("Make (brand name) is required");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...editFormData,
        brand: isRenault ? "renault" : "other",
      };
      await axios.put(`${API}/vehicles/${vehicleId}`, payload, { withCredentials: true });
      toast.success("Vehicle updated");
      setEditModalOpen(false);
      // Refresh vehicle data
      const res = await axios.get(`${API}/vehicles/${vehicleId}`, { withCredentials: true });
      setVehicle(res.data);
    } catch (e) {
      toast.error(e.response?.data?.detail || "Failed to update vehicle");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Vehicle not found</p>
        <Button variant="outline" className="mt-4 rounded-sm" onClick={handleBack}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Vehicles
        </Button>
      </div>
    );
  }

  // Determine which tabs to show (Vehicle+Service combined, so 5 tabs for Renault, 4 for Other)
  const tabs = isRenault
    ? ["vehicle", "customer", "insurance", "dates", "dealer"]
    : ["vehicle", "customer", "insurance", "dates"]; // Hide Dealer for Other Brands

  return (
    <div className="space-y-6" data-testid="vehicle-profile">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleBack} data-testid="back-btn">
            <ArrowLeft className="w-5 h-5" strokeWidth={1.5} />
          </Button>
          <div>
            <h1 className="font-heading font-black text-2xl md:text-3xl tracking-tighter uppercase">
              Vehicle Profile
            </h1>
            <p className="text-sm text-gray-500 font-mono mt-1">
              {vehicle.vehicle_reg_no || "—"} • {vehicle.vin || "—"}
            </p>
          </div>
        </div>
        <Button variant="outline" className="rounded-sm" onClick={handleOpenEdit} data-testid="edit-btn">
          <Pencil className="w-4 h-4 mr-2" strokeWidth={1.5} /> Edit
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full justify-start border-b border-gray-200 bg-transparent p-0 h-auto rounded-none">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab}
              value={tab}
              className="px-4 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-black data-[state=active]:bg-transparent data-[state=active]:shadow-none font-medium text-sm uppercase tracking-wider"
              data-testid={`tab-${tab}`}
            >
              {tab === "dates" ? "Dates & Programs" : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* TAB 1 — Vehicle (combined with Service) */}
        <TabsContent value="vehicle" className="mt-6">
          <Card className="border border-gray-200 rounded-sm shadow-none">
            <CardContent className="p-6">
              <Section title="Vehicle Details">
                <FieldRow label="VIN #" value={vehicle.vin} />
                <FieldRow label="Engine #" value={vehicle.engine_no} />
                <FieldRow label="Temporary/Registration No" value={vehicle.vehicle_reg_no} />
                {!isRenault && <FieldRow label="Make" value={vehicle.make} />}
                <FieldRow label="Model Description" value={vehicle.model} />
                {isRenault && (
                  <>
                    <FieldRow label="Variant Description" value={vehicle.variant_description} />
                    <FieldRow label="Model Code" value={vehicle.model_code} />
                    <FieldRow label="Color Type" value={vehicle.color_type} />
                    <FieldRow label="Exterior Colour" value={vehicle.exterior_colour} />
                    <FieldRow label="Exterior Colour Code" value={vehicle.exterior_colour_code} />
                  </>
                )}
              </Section>
              <Section title="Service">
                <FieldRow label="Last Service Date" value={vehicle.last_service_date} />
                <FieldRow label="Next Service Due" value={vehicle.next_service_due} />
                <FieldRow label="Last Odometer Reading" value={vehicle.last_odometer_reading} />
              </Section>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2 — Customer */}
        <TabsContent value="customer" className="mt-6">
          <Card className="border border-gray-200 rounded-sm shadow-none">
            <CardContent className="p-6">
              <Section>
                <FieldRow label="Contact Name" value={vehicle.customer_name} />
                <FieldRow label="Phone" value={vehicle.customer_phone} />
                <FieldRow label="Email" value={vehicle.customer_email} />
                <FieldRow label="Contact Address" value={vehicle.contact_address} />
                <FieldRow label="Contact Address2" value={vehicle.contact_address2} />
                <FieldRow label="Contact City" value={vehicle.contact_city} />
                <FieldRow label="Contact District" value={vehicle.contact_district} />
                <FieldRow label="Contact State" value={vehicle.contact_state} />
                <FieldRow label="Contact Country" value={vehicle.contact_country} />
                <FieldRow label="Contact Zipcode" value={vehicle.contact_zipcode} />
              </Section>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3 — Insurance */}
        <TabsContent value="insurance" className="mt-6">
          <Card className="border border-gray-200 rounded-sm shadow-none">
            <CardContent className="p-6">
              <Section title="Own Damage (OD)">
                <FieldRow label="OD Policy Start Date" value={vehicle.od_policy_start_date} />
                <FieldRow label="OD Policy End Date" value={vehicle.od_policy_end_date} />
                <FieldRow label="Own Damage Insurer" value={vehicle.od_insurer} />
                <FieldRow label="OD Policy Number" value={vehicle.od_policy_number} />
              </Section>
              <Section title="Third Party (TP)">
                <FieldRow label="TP Policy Start Date" value={vehicle.tp_policy_start_date} />
                <FieldRow label="TP Policy End Date" value={vehicle.tp_policy_end_date} />
                <FieldRow label="Third Party Insurer" value={vehicle.tp_insurer} />
                <FieldRow label="TP Policy Number" value={vehicle.tp_policy_number} />
              </Section>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 4 — Dates & Programs */}
        <TabsContent value="dates" className="mt-6">
          <Card className="border border-gray-200 rounded-sm shadow-none">
            <CardContent className="p-6">
              <Section title="Common Dates">
                <FieldRow label="Invoiced Date" value={vehicle.invoiced_date} />
                <FieldRow label="Vehicle Delivery Date" value={vehicle.delivery_date} />
                <FieldRow label="VIN Mfg Year" value={vehicle.vin_mfg_year} />
                <FieldRow label="Warranty Start Date" value={vehicle.warranty_start_date} />
                <FieldRow label="Warranty End Date" value={vehicle.warranty_end_date} />
                <FieldRow label="Warranty End Km" value={vehicle.warranty_end_km} />
              </Section>

              {/* Renault-only fields */}
              {isRenault && (
                <>
                  <Section title="Extended Warranty">
                    <FieldRow label="Extended Warranty Start Date" value={vehicle.ext_warranty_start_date} />
                    <FieldRow label="Extended Warranty End Date" value={vehicle.ext_warranty_end_date} />
                    <FieldRow label="Extended Warranty End Km" value={vehicle.ext_warranty_end_km} />
                  </Section>
                  <Section title="Easy Care">
                    <FieldRow label="Easy Care Name" value={vehicle.easy_care_name} />
                    <FieldRow label="Easy Care Start Date" value={vehicle.easy_care_start_date} />
                    <FieldRow label="Easy Care End Date" value={vehicle.easy_care_end_date} />
                    <FieldRow label="Easy Care End KM" value={vehicle.easy_care_end_km} />
                  </Section>
                  <Section title="RSA (Roadside Assistance)">
                    <FieldRow label="RSA Product Name" value={vehicle.rsa_product_name} />
                    <FieldRow label="RSA Certification Number" value={vehicle.rsa_certification_number} />
                    <FieldRow label="RSA Start Date" value={vehicle.rsa_start_date} />
                    <FieldRow label="RSA End Date" value={vehicle.rsa_end_date} />
                  </Section>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 5 — Dealer (Renault only) */}
        {isRenault && (
          <TabsContent value="dealer" className="mt-6">
            <Card className="border border-gray-200 rounded-sm shadow-none">
              <CardContent className="p-6">
                <Section>
                  <FieldRow label="Dealer Code" value={vehicle.dealer_code} />
                  <FieldRow label="Dealer Name" value={vehicle.dealer_name} />
                  <FieldRow label="Dealer Group" value={vehicle.dealer_group} />
                  <FieldRow label="Last Servicing Dealer" value={vehicle.last_servicing_dealer} />
                  <FieldRow label="Penultimate Servicing Dealer" value={vehicle.penultimate_servicing_dealer} />
                </Section>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* Edit Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto" data-testid="edit-vehicle-modal">
          <DialogHeader>
            <DialogTitle className="font-heading font-bold text-lg tracking-tight uppercase">
              Edit Vehicle
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">Registration No *</Label>
                <Input 
                  value={editFormData.vehicle_reg_no || ""}
                  onChange={e => setEditFormData({ ...editFormData, vehicle_reg_no: e.target.value.toUpperCase() })}
                  className="rounded-sm uppercase"
                  data-testid="edit-input-reg-no"
                />
              </div>
              {isRenault ? (
                <div>
                  <Label className="text-xs">Model *</Label>
                  <Select 
                    value={editFormData.model || ""} 
                    onValueChange={v => setEditFormData({ ...editFormData, model: v })}
                  >
                    <SelectTrigger className="rounded-sm" data-testid="edit-input-model">
                      <SelectValue placeholder="Select model" />
                    </SelectTrigger>
                    <SelectContent>
                      {masterModels.map(m => (
                        <SelectItem key={m} value={m}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div>
                  <Label className="text-xs">Make (Brand) *</Label>
                  <Input 
                    value={editFormData.make || ""}
                    onChange={e => setEditFormData({ ...editFormData, make: e.target.value })}
                    className="rounded-sm"
                    placeholder="e.g., Toyota, Honda"
                    data-testid="edit-input-make"
                  />
                </div>
              )}
            </div>

            {!isRenault && (
              <div>
                <Label className="text-xs">Model</Label>
                <Input 
                  value={editFormData.model || ""}
                  onChange={e => setEditFormData({ ...editFormData, model: e.target.value })}
                  className="rounded-sm"
                  placeholder="e.g., Corolla, City"
                  data-testid="edit-input-model-other"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">VIN</Label>
                <Input 
                  value={editFormData.vin || ""}
                  onChange={e => setEditFormData({ ...editFormData, vin: e.target.value.toUpperCase() })}
                  className="rounded-sm uppercase"
                  data-testid="edit-input-vin"
                />
              </div>
              <div>
                <Label className="text-xs">Engine No</Label>
                <Input 
                  value={editFormData.engine_no || ""}
                  onChange={e => setEditFormData({ ...editFormData, engine_no: e.target.value.toUpperCase() })}
                  className="rounded-sm uppercase"
                  data-testid="edit-input-engine-no"
                />
              </div>
            </div>

            <div className="border-t pt-4 mt-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">Customer Details</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs">Customer Name</Label>
                  <Input 
                    value={editFormData.customer_name || ""}
                    onChange={e => setEditFormData({ ...editFormData, customer_name: e.target.value })}
                    className="rounded-sm"
                    data-testid="edit-input-customer-name"
                  />
                </div>
                <div>
                  <Label className="text-xs">Customer Phone</Label>
                  <Input 
                    value={editFormData.customer_phone || ""}
                    onChange={e => setEditFormData({ ...editFormData, customer_phone: e.target.value })}
                    className="rounded-sm"
                    data-testid="edit-input-customer-phone"
                  />
                </div>
              </div>
              <div className="mt-4">
                <Label className="text-xs">Customer Email</Label>
                <Input 
                  value={editFormData.customer_email || ""}
                  onChange={e => setEditFormData({ ...editFormData, customer_email: e.target.value })}
                  className="rounded-sm"
                  type="email"
                  data-testid="edit-input-customer-email"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" className="rounded-sm" onClick={() => setEditModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              className="rounded-sm bg-black text-white hover:bg-gray-800" 
              onClick={handleSaveEdit}
              disabled={saving}
              data-testid="save-edit-btn"
            >
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VehicleProfile;
