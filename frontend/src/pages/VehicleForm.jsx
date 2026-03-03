import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { API } from "@/App";
import axios from "axios";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";

// Reusable input field component
const FormField = ({ label, value, onChange, placeholder, type = "text", required = false, disabled = false }) => (
  <div className="space-y-1">
    <Label className="text-xs text-gray-500 uppercase tracking-wider">
      {label} {required && <span className="text-red-500">*</span>}
    </Label>
    <Input
      type={type}
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="rounded-sm"
      disabled={disabled}
    />
  </div>
);

// Section component
const Section = ({ title, children }) => (
  <div className="mb-8">
    {title && <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4">{title}</h3>}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {children}
    </div>
  </div>
);

const VehicleForm = ({ brand = "other", mode = "add" }) => {
  const { vehicleId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(mode === "edit");
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("vehicle");
  const [masterModels, setMasterModels] = useState([]);

  const isRenault = brand === "renault";
  const isEdit = mode === "edit";

  // Form data state
  const [formData, setFormData] = useState({
    // Vehicle Details
    make: "",
    vin: "",
    engine_no: "",
    vehicle_reg_no: "",
    model: "",
    variant_description: "",
    model_code: "",
    color_type: "",
    exterior_colour: "",
    exterior_colour_code: "",
    // Service
    last_service_date: "",
    next_service_due: "",
    last_odometer_reading: "",
    // Customer
    customer_name: "",
    customer_phone: "",
    customer_email: "",
    contact_address: "",
    contact_address2: "",
    contact_city: "",
    contact_district: "",
    contact_state: "",
    contact_country: "",
    contact_zipcode: "",
    // Insurance - OD
    od_policy_start_date: "",
    od_policy_end_date: "",
    od_insurer: "",
    od_policy_number: "",
    // Insurance - TP
    tp_policy_start_date: "",
    tp_policy_end_date: "",
    tp_insurer: "",
    tp_policy_number: "",
    // Dates & Programs
    invoiced_date: "",
    delivery_date: "",
    vin_mfg_year: "",
    warranty_start_date: "",
    warranty_end_date: "",
    warranty_end_km: "",
    // Renault-specific
    ext_warranty_start_date: "",
    ext_warranty_end_date: "",
    ext_warranty_end_km: "",
    easy_care_name: "",
    easy_care_start_date: "",
    easy_care_end_date: "",
    easy_care_end_km: "",
    rsa_product_name: "",
    rsa_certification_number: "",
    rsa_start_date: "",
    rsa_end_date: "",
    // Dealer (Renault only)
    dealer_code: "",
    dealer_name: "",
    dealer_group: "",
    last_servicing_dealer: "",
    penultimate_servicing_dealer: "",
  });

  // Update a single field
  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

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

  // Fetch vehicle data if editing
  useEffect(() => {
    const fetchVehicle = async () => {
      if (!isEdit || !vehicleId) return;
      setLoading(true);
      try {
        const res = await axios.get(`${API}/vehicles/${vehicleId}`, { withCredentials: true });
        setFormData(res.data);
      } catch (e) {
        console.error("Failed to fetch vehicle", e);
        toast.error("Failed to load vehicle data");
      } finally {
        setLoading(false);
      }
    };
    fetchVehicle();
  }, [isEdit, vehicleId]);

  const handleBack = () => {
    navigate(isRenault ? "/vehicles/renault" : "/vehicles/other-brands");
  };

  const handleSave = async () => {
    // Validation
    if (!formData.vehicle_reg_no) {
      toast.error("Registration number is required");
      setActiveTab("vehicle");
      return;
    }
    if (isRenault && !formData.model) {
      toast.error("Model is required for Renault vehicles");
      setActiveTab("vehicle");
      return;
    }
    if (!isRenault && !formData.make) {
      toast.error("Brand is required");
      setActiveTab("vehicle");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...formData,
        brand: isRenault ? "renault" : "other",
      };

      if (isEdit) {
        await axios.put(`${API}/vehicles/${vehicleId}`, payload, { withCredentials: true });
        toast.success("Vehicle updated successfully");
      } else {
        await axios.post(`${API}/vehicles`, payload, { withCredentials: true });
        toast.success("Vehicle added successfully");
      }
      handleBack();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to save vehicle");
    } finally {
      setSaving(false);
    }
  };

  // Determine which tabs to show
  const tabs = isRenault
    ? ["vehicle", "customer", "insurance", "dates", "dealer"]
    : ["vehicle", "customer", "insurance", "dates"];

  const tabLabels = {
    vehicle: "Vehicle",
    customer: "Customer",
    insurance: "Insurance",
    dates: "Dates & Programs",
    dealer: "Dealer"
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-gray-700 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="vehicle-form-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="rounded-sm" onClick={handleBack} data-testid="back-btn">
            <ArrowLeft className="w-5 h-5" strokeWidth={1.5} />
          </Button>
          <div>
            <h1 className="font-heading font-black text-3xl md:text-4xl tracking-tighter uppercase">
              {isEdit ? "Edit Vehicle" : "Add Vehicle"}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {isRenault ? "Renault Vehicle" : "Other Brand Vehicle"}
            </p>
          </div>
        </div>
        <Button 
          className="rounded-sm bg-black text-white hover:bg-gray-800" 
          onClick={handleSave}
          disabled={saving}
          data-testid="save-btn"
        >
          <Save className="w-4 h-4 mr-2" strokeWidth={1.5} />
          {saving ? "Saving..." : isEdit ? "Update Vehicle" : "Save Vehicle"}
        </Button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-1 overflow-x-auto pb-px">
          {tabs.map((tab) => (
            <Button
              key={tab}
              variant="ghost"
              className={`px-4 py-2 rounded-none border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === tab
                  ? "border-black text-black"
                  : "border-transparent text-gray-500 hover:text-black hover:border-gray-300"
              }`}
              onClick={() => setActiveTab(tab)}
              data-testid={`tab-${tab}`}
            >
              {tabLabels[tab]}
            </Button>
          ))}
        </div>
      </div>

      {/* TAB 1 — Vehicle */}
      {activeTab === "vehicle" && (
        <div className="mt-6">
          <Card className="border border-gray-200 rounded-sm shadow-none">
            <CardContent className="p-6">
              <Section title="Vehicle Details">
                {isRenault ? (
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500 uppercase tracking-wider">Brand</Label>
                    <Input value="Renault" disabled className="rounded-sm bg-gray-50" />
                  </div>
                ) : (
                  <FormField 
                    label="Brand" 
                    value={formData.make} 
                    onChange={(v) => updateField("make", v)} 
                    placeholder="e.g., Toyota, Honda, Maruti"
                    required
                  />
                )}
                <FormField 
                  label="VIN #" 
                  value={formData.vin} 
                  onChange={(v) => updateField("vin", v.toUpperCase())} 
                  placeholder="Vehicle Identification Number"
                />
                <FormField 
                  label="Engine #" 
                  value={formData.engine_no} 
                  onChange={(v) => updateField("engine_no", v.toUpperCase())} 
                  placeholder="Engine Number"
                />
                <FormField 
                  label="Temporary/Registration No" 
                  value={formData.vehicle_reg_no} 
                  onChange={(v) => updateField("vehicle_reg_no", v.toUpperCase())} 
                  placeholder="e.g., MH01AB1234"
                  required
                />
                {isRenault ? (
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500 uppercase tracking-wider">
                      Model Description <span className="text-red-500">*</span>
                    </Label>
                    <Select value={formData.model || ""} onValueChange={(v) => updateField("model", v)}>
                      <SelectTrigger className="rounded-sm">
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
                  <FormField 
                    label="Model Description" 
                    value={formData.model} 
                    onChange={(v) => updateField("model", v)} 
                    placeholder="e.g., Corolla, City, Swift"
                  />
                )}
                {isRenault && (
                  <>
                    <FormField 
                      label="Variant Description" 
                      value={formData.variant_description} 
                      onChange={(v) => updateField("variant_description", v)} 
                    />
                    <FormField 
                      label="Model Code" 
                      value={formData.model_code} 
                      onChange={(v) => updateField("model_code", v)} 
                    />
                    <FormField 
                      label="Color Type" 
                      value={formData.color_type} 
                      onChange={(v) => updateField("color_type", v)} 
                    />
                    <FormField 
                      label="Exterior Colour" 
                      value={formData.exterior_colour} 
                      onChange={(v) => updateField("exterior_colour", v)} 
                    />
                    <FormField 
                      label="Exterior Colour Code" 
                      value={formData.exterior_colour_code} 
                      onChange={(v) => updateField("exterior_colour_code", v)} 
                    />
                  </>
                )}
              </Section>

              <Section title="Service">
                <FormField 
                  label="Last Service Date" 
                  value={formData.last_service_date} 
                  onChange={(v) => updateField("last_service_date", v)} 
                  type="date"
                />
                <FormField 
                  label="Next Service Due" 
                  value={formData.next_service_due} 
                  onChange={(v) => updateField("next_service_due", v)} 
                  type="date"
                />
                <FormField 
                  label="Last Odometer Reading" 
                  value={formData.last_odometer_reading} 
                  onChange={(v) => updateField("last_odometer_reading", v)} 
                  placeholder="e.g., 45000"
                />
              </Section>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 2 — Customer */}
      {activeTab === "customer" && (
        <div className="mt-6">
          <Card className="border border-gray-200 rounded-sm shadow-none">
            <CardContent className="p-6">
              <Section title="Contact Information">
                <FormField 
                  label="Contact Name" 
                  value={formData.customer_name} 
                  onChange={(v) => updateField("customer_name", v)} 
                  placeholder="Full name"
                />
                <FormField 
                  label="Phone" 
                  value={formData.customer_phone} 
                  onChange={(v) => updateField("customer_phone", v)} 
                  placeholder="Mobile number"
                />
                <FormField 
                  label="Email" 
                  value={formData.customer_email} 
                  onChange={(v) => updateField("customer_email", v)} 
                  type="email"
                  placeholder="Email address"
                />
              </Section>

              <Section title="Address">
                <FormField 
                  label="Contact Address" 
                  value={formData.contact_address} 
                  onChange={(v) => updateField("contact_address", v)} 
                  placeholder="Street address"
                />
                <FormField 
                  label="Contact Address 2" 
                  value={formData.contact_address2} 
                  onChange={(v) => updateField("contact_address2", v)} 
                  placeholder="Apartment, suite, etc."
                />
                <FormField 
                  label="City" 
                  value={formData.contact_city} 
                  onChange={(v) => updateField("contact_city", v)} 
                />
                <FormField 
                  label="District" 
                  value={formData.contact_district} 
                  onChange={(v) => updateField("contact_district", v)} 
                />
                <FormField 
                  label="State" 
                  value={formData.contact_state} 
                  onChange={(v) => updateField("contact_state", v)} 
                />
                <FormField 
                  label="Country" 
                  value={formData.contact_country} 
                  onChange={(v) => updateField("contact_country", v)} 
                />
                <FormField 
                  label="Zipcode" 
                  value={formData.contact_zipcode} 
                  onChange={(v) => updateField("contact_zipcode", v)} 
                />
              </Section>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 3 — Insurance */}
      {activeTab === "insurance" && (
        <div className="mt-6">
          <Card className="border border-gray-200 rounded-sm shadow-none">
            <CardContent className="p-6">
              <Section title="Own Damage (OD)">
                <FormField 
                  label="OD Policy Start Date" 
                  value={formData.od_policy_start_date} 
                  onChange={(v) => updateField("od_policy_start_date", v)} 
                  type="date"
                />
                <FormField 
                  label="OD Policy End Date" 
                  value={formData.od_policy_end_date} 
                  onChange={(v) => updateField("od_policy_end_date", v)} 
                  type="date"
                />
                <FormField 
                  label="Own Damage Insurer" 
                  value={formData.od_insurer} 
                  onChange={(v) => updateField("od_insurer", v)} 
                  placeholder="Insurance company name"
                />
                <FormField 
                  label="OD Policy Number" 
                  value={formData.od_policy_number} 
                  onChange={(v) => updateField("od_policy_number", v)} 
                />
              </Section>

              <Section title="Third Party (TP)">
                <FormField 
                  label="TP Policy Start Date" 
                  value={formData.tp_policy_start_date} 
                  onChange={(v) => updateField("tp_policy_start_date", v)} 
                  type="date"
                />
                <FormField 
                  label="TP Policy End Date" 
                  value={formData.tp_policy_end_date} 
                  onChange={(v) => updateField("tp_policy_end_date", v)} 
                  type="date"
                />
                <FormField 
                  label="Third Party Insurer" 
                  value={formData.tp_insurer} 
                  onChange={(v) => updateField("tp_insurer", v)} 
                  placeholder="Insurance company name"
                />
                <FormField 
                  label="TP Policy Number" 
                  value={formData.tp_policy_number} 
                  onChange={(v) => updateField("tp_policy_number", v)} 
                />
              </Section>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 4 — Dates & Programs */}
      {activeTab === "dates" && (
        <div className="mt-6">
          <Card className="border border-gray-200 rounded-sm shadow-none">
            <CardContent className="p-6">
              <Section title="Common Dates">
                <FormField 
                  label="Invoiced Date" 
                  value={formData.invoiced_date} 
                  onChange={(v) => updateField("invoiced_date", v)} 
                  type="date"
                />
                <FormField 
                  label="Vehicle Delivery Date" 
                  value={formData.delivery_date} 
                  onChange={(v) => updateField("delivery_date", v)} 
                  type="date"
                />
                <FormField 
                  label="VIN Mfg Year" 
                  value={formData.vin_mfg_year} 
                  onChange={(v) => updateField("vin_mfg_year", v)} 
                  placeholder="e.g., 2024"
                />
                <FormField 
                  label="Warranty Start Date" 
                  value={formData.warranty_start_date} 
                  onChange={(v) => updateField("warranty_start_date", v)} 
                  type="date"
                />
                <FormField 
                  label="Warranty End Date" 
                  value={formData.warranty_end_date} 
                  onChange={(v) => updateField("warranty_end_date", v)} 
                  type="date"
                />
                <FormField 
                  label="Warranty End Km" 
                  value={formData.warranty_end_km} 
                  onChange={(v) => updateField("warranty_end_km", v)} 
                  placeholder="e.g., 100000"
                />
              </Section>

              {isRenault && (
                <>
                  <Section title="Extended Warranty">
                    <FormField 
                      label="Extended Warranty Start Date" 
                      value={formData.ext_warranty_start_date} 
                      onChange={(v) => updateField("ext_warranty_start_date", v)} 
                      type="date"
                    />
                    <FormField 
                      label="Extended Warranty End Date" 
                      value={formData.ext_warranty_end_date} 
                      onChange={(v) => updateField("ext_warranty_end_date", v)} 
                      type="date"
                    />
                    <FormField 
                      label="Extended Warranty End Km" 
                      value={formData.ext_warranty_end_km} 
                      onChange={(v) => updateField("ext_warranty_end_km", v)} 
                    />
                  </Section>

                  <Section title="Easy Care">
                    <FormField 
                      label="Easy Care Name" 
                      value={formData.easy_care_name} 
                      onChange={(v) => updateField("easy_care_name", v)} 
                    />
                    <FormField 
                      label="Easy Care Start Date" 
                      value={formData.easy_care_start_date} 
                      onChange={(v) => updateField("easy_care_start_date", v)} 
                      type="date"
                    />
                    <FormField 
                      label="Easy Care End Date" 
                      value={formData.easy_care_end_date} 
                      onChange={(v) => updateField("easy_care_end_date", v)} 
                      type="date"
                    />
                    <FormField 
                      label="Easy Care End KM" 
                      value={formData.easy_care_end_km} 
                      onChange={(v) => updateField("easy_care_end_km", v)} 
                    />
                  </Section>

                  <Section title="RSA (Roadside Assistance)">
                    <FormField 
                      label="RSA Product Name" 
                      value={formData.rsa_product_name} 
                      onChange={(v) => updateField("rsa_product_name", v)} 
                    />
                    <FormField 
                      label="RSA Certification Number" 
                      value={formData.rsa_certification_number} 
                      onChange={(v) => updateField("rsa_certification_number", v)} 
                    />
                    <FormField 
                      label="RSA Start Date" 
                      value={formData.rsa_start_date} 
                      onChange={(v) => updateField("rsa_start_date", v)} 
                      type="date"
                    />
                    <FormField 
                      label="RSA End Date" 
                      value={formData.rsa_end_date} 
                      onChange={(v) => updateField("rsa_end_date", v)} 
                      type="date"
                    />
                  </Section>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 5 — Dealer (Renault only) */}
      {isRenault && activeTab === "dealer" && (
        <div className="mt-6">
          <Card className="border border-gray-200 rounded-sm shadow-none">
            <CardContent className="p-6">
              <Section title="Dealer Information">
                <FormField 
                  label="Dealer Code" 
                  value={formData.dealer_code} 
                  onChange={(v) => updateField("dealer_code", v)} 
                />
                <FormField 
                  label="Dealer Name" 
                  value={formData.dealer_name} 
                  onChange={(v) => updateField("dealer_name", v)} 
                />
                <FormField 
                  label="Dealer Group" 
                  value={formData.dealer_group} 
                  onChange={(v) => updateField("dealer_group", v)} 
                />
                <FormField 
                  label="Last Servicing Dealer" 
                  value={formData.last_servicing_dealer} 
                  onChange={(v) => updateField("last_servicing_dealer", v)} 
                />
                <FormField 
                  label="Penultimate Servicing Dealer" 
                  value={formData.penultimate_servicing_dealer} 
                  onChange={(v) => updateField("penultimate_servicing_dealer", v)} 
                />
              </Section>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default VehicleForm;
