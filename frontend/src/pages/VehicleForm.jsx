import { useState, useEffect, useRef } from "react";
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
import { ArrowLeft, ArrowRight, Save, Check, Upload, Copy, FileText, Trash2, X } from "lucide-react";
import { toast } from "sonner";

// Country codes list
const countryCodes = [
  { code: "+91", country: "India" },
  { code: "+1", country: "USA" },
  { code: "+44", country: "UK" },
  { code: "+971", country: "UAE" },
  { code: "+65", country: "Singapore" },
  { code: "+61", country: "Australia" },
];

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

// Phone field with country code
const PhoneField = ({ label, countryCode, phone, onCountryCodeChange, onPhoneChange, required = false }) => (
  <div className="space-y-1">
    <Label className="text-xs text-gray-500 uppercase tracking-wider">
      {label} {required && <span className="text-red-500">*</span>}
    </Label>
    <div className="flex gap-2">
      <Select value={countryCode || "+91"} onValueChange={onCountryCodeChange}>
        <SelectTrigger className="rounded-sm w-24">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {countryCodes.map(c => (
            <SelectItem key={c.code} value={c.code}>{c.code}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        type="tel"
        value={phone || ""}
        onChange={(e) => onPhoneChange(e.target.value)}
        placeholder="Mobile number"
        className="rounded-sm flex-1"
      />
    </div>
  </div>
);

// Section component
const Section = ({ title, children, action }) => (
  <div className="mb-6">
    <div className="flex items-center justify-between mb-4">
      {title && <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">{title}</h3>}
      {action}
    </div>
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
  const [currentStep, setCurrentStep] = useState(0);
  const [masterModels, setMasterModels] = useState([]);
  
  // File upload refs
  const odPolicyFileRef = useRef(null);
  const tpPolicyFileRef = useRef(null);
  
  // Insurance document state
  const [odPolicyFile, setOdPolicyFile] = useState(null);
  const [tpPolicyFile, setTpPolicyFile] = useState(null);

  const isRenault = brand === "renault";
  const isEdit = mode === "edit";

  // Define steps (only used for Add mode)
  const steps = isRenault
    ? [
        { id: "vehicle", label: "Vehicle", description: "Vehicle details" },
        { id: "customer", label: "Customer", description: "Contact information" },
        { id: "insurance", label: "Insurance", description: "Insurance policies" },
        { id: "dates", label: "Dates & Programs", description: "Warranty and programs" },
        { id: "dealer", label: "Dealer", description: "Dealer information" },
      ]
    : [
        { id: "vehicle", label: "Vehicle", description: "Vehicle details" },
        { id: "customer", label: "Customer", description: "Contact information" },
        { id: "insurance", label: "Insurance", description: "Insurance policies" },
        { id: "dates", label: "Dates & Programs", description: "Warranty and programs" },
      ];

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
    customer_country_code: "+91",
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

  // Copy OD policy details to TP
  const copyOdToTp = () => {
    setFormData(prev => ({
      ...prev,
      tp_policy_start_date: prev.od_policy_start_date,
      tp_policy_end_date: prev.od_policy_end_date,
      tp_insurer: prev.od_insurer,
      tp_policy_number: prev.od_policy_number,
    }));
    toast.success("OD policy details copied to TP");
  };

  // Handle policy file upload
  const handlePolicyUpload = async (file, type) => {
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }
    
    const allowedTypes = [".pdf", ".jpg", ".jpeg", ".png"];
    const ext = file.name.toLowerCase().substring(file.name.lastIndexOf("."));
    if (!allowedTypes.includes(ext)) {
      toast.error("Only PDF, JPG, JPEG, PNG files are allowed");
      return;
    }

    if (type === "od") {
      setOdPolicyFile(file);
      toast.success("OD Policy document selected");
    } else {
      setTpPolicyFile(file);
      toast.success("TP Policy document selected");
    }
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

  const validateForm = () => {
    if (!formData.vehicle_reg_no) {
      toast.error("Registration number is required");
      return false;
    }
    if (!formData.vin) {
      toast.error("VIN is required");
      return false;
    }
    if (isRenault && !formData.model) {
      toast.error("Model is required for Renault vehicles");
      return false;
    }
    if (!isRenault && !formData.make) {
      toast.error("Brand is required");
      return false;
    }
    return true;
  };

  const validateCurrentStep = () => {
    const step = steps[currentStep];
    
    if (step.id === "vehicle") {
      if (!formData.vehicle_reg_no) {
        toast.error("Registration number is required");
        return false;
      }
      if (!formData.vin) {
        toast.error("VIN is required");
        return false;
      }
      if (isRenault && !formData.model) {
        toast.error("Model is required for Renault vehicles");
        return false;
      }
      if (!isRenault && !formData.make) {
        toast.error("Brand is required");
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const handleSave = async () => {
    if (isEdit) {
      if (!validateForm()) return;
    } else {
      if (!validateCurrentStep()) return;
    }

    setSaving(true);
    try {
      const fullPhone = formData.customer_phone 
        ? `${formData.customer_country_code || '+91'}${formData.customer_phone}`
        : "";
      
      const payload = {
        ...formData,
        customer_phone: fullPhone,
        brand: isRenault ? "renault" : "other",
      };

      let savedVehicle;
      if (isEdit) {
        const res = await axios.put(`${API}/vehicles/${vehicleId}`, payload, { withCredentials: true });
        savedVehicle = res.data;
        toast.success("Vehicle updated successfully");
      } else {
        const res = await axios.post(`${API}/vehicles`, payload, { withCredentials: true });
        savedVehicle = res.data;
        toast.success("Vehicle added successfully");
      }

      // Upload policy documents if selected
      if (odPolicyFile && savedVehicle.vehicle_id) {
        const formDataFile = new FormData();
        formDataFile.append("file", odPolicyFile);
        formDataFile.append("document_type", "OD Insurance Policy");
        await axios.post(
          `${API}/vehicles/${savedVehicle.vehicle_id}/documents`,
          formDataFile,
          { withCredentials: true, headers: { "Content-Type": "multipart/form-data" } }
        );
      }
      
      if (tpPolicyFile && savedVehicle.vehicle_id) {
        const formDataFile = new FormData();
        formDataFile.append("file", tpPolicyFile);
        formDataFile.append("document_type", "TP Insurance Policy");
        await axios.post(
          `${API}/vehicles/${savedVehicle.vehicle_id}/documents`,
          formDataFile,
          { withCredentials: true, headers: { "Content-Type": "multipart/form-data" } }
        );
      }

      handleBack();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to save vehicle");
    } finally {
      setSaving(false);
    }
  };

  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-gray-700 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // EDIT MODE - Show all fields on one page
  if (isEdit) {
    return (
      <div className="space-y-6" data-testid="vehicle-form-page">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading font-black text-3xl md:text-4xl tracking-tighter uppercase">
              Edit Vehicle
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {isRenault ? "Renault Vehicle" : "Other Brand Vehicle"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              className="rounded-sm bg-black text-white hover:bg-gray-800"
              onClick={handleSave}
              disabled={saving}
              data-testid="save-btn"
            >
              <Save className="w-4 h-4 mr-2" strokeWidth={1.5} />
              {saving ? "Saving..." : "Save Changes"}
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="rounded-sm bg-red-600 hover:bg-red-700 text-white h-8 w-8" 
              onClick={handleBack} 
              data-testid="cancel-btn"
            >
              <X className="w-4 h-4" strokeWidth={2.5} />
            </Button>
          </div>
        </div>

        {/* Vehicle Details */}
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
                required
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
                  <FormField label="Variant Description" value={formData.variant_description} onChange={(v) => updateField("variant_description", v)} />
                  <FormField label="Model Code" value={formData.model_code} onChange={(v) => updateField("model_code", v)} />
                  <FormField label="Color Type" value={formData.color_type} onChange={(v) => updateField("color_type", v)} />
                  <FormField label="Exterior Colour" value={formData.exterior_colour} onChange={(v) => updateField("exterior_colour", v)} />
                  <FormField label="Exterior Colour Code" value={formData.exterior_colour_code} onChange={(v) => updateField("exterior_colour_code", v)} />
                </>
              )}
            </Section>

            <Section title="Service">
              <FormField label="Last Service Date" value={formData.last_service_date} onChange={(v) => updateField("last_service_date", v)} type="date" />
              <FormField label="Next Service Due" value={formData.next_service_due} onChange={(v) => updateField("next_service_due", v)} type="date" />
              <FormField label="Last Odometer Reading" value={formData.last_odometer_reading} onChange={(v) => updateField("last_odometer_reading", v)} placeholder="e.g., 45000" />
            </Section>
          </CardContent>
        </Card>

        {/* Customer Details */}
        <Card className="border border-gray-200 rounded-sm shadow-none">
          <CardContent className="p-6">
            <Section title="Contact Information">
              <FormField label="Contact Name" value={formData.customer_name} onChange={(v) => updateField("customer_name", v)} placeholder="Full name" />
              <PhoneField 
                label="Phone"
                countryCode={formData.customer_country_code}
                phone={formData.customer_phone}
                onCountryCodeChange={(v) => updateField("customer_country_code", v)}
                onPhoneChange={(v) => updateField("customer_phone", v)}
              />
              <FormField label="Email" value={formData.customer_email} onChange={(v) => updateField("customer_email", v)} type="email" placeholder="Email address" />
            </Section>

            <Section title="Address">
              <FormField label="Contact Address" value={formData.contact_address} onChange={(v) => updateField("contact_address", v)} placeholder="Street address" />
              <FormField label="Contact Address 2" value={formData.contact_address2} onChange={(v) => updateField("contact_address2", v)} placeholder="Apartment, suite, etc." />
              <FormField label="City" value={formData.contact_city} onChange={(v) => updateField("contact_city", v)} />
              <FormField label="District" value={formData.contact_district} onChange={(v) => updateField("contact_district", v)} />
              <FormField label="State" value={formData.contact_state} onChange={(v) => updateField("contact_state", v)} />
              <FormField label="Country" value={formData.contact_country} onChange={(v) => updateField("contact_country", v)} />
              <FormField label="Zipcode" value={formData.contact_zipcode} onChange={(v) => updateField("contact_zipcode", v)} />
            </Section>
          </CardContent>
        </Card>

        {/* Insurance */}
        <Card className="border border-gray-200 rounded-sm shadow-none">
          <CardContent className="p-6">
            <Section title="Own Damage (OD)">
              <FormField label="OD Policy Start Date" value={formData.od_policy_start_date} onChange={(v) => updateField("od_policy_start_date", v)} type="date" />
              <FormField label="OD Policy End Date" value={formData.od_policy_end_date} onChange={(v) => updateField("od_policy_end_date", v)} type="date" />
              <FormField label="Own Damage Insurer" value={formData.od_insurer} onChange={(v) => updateField("od_insurer", v)} placeholder="Insurance company name" />
              <FormField label="OD Policy Number" value={formData.od_policy_number} onChange={(v) => updateField("od_policy_number", v)} />
            </Section>

            <Section 
              title="Third Party (TP)"
              action={
                <Button type="button" variant="outline" size="sm" className="rounded-sm" onClick={copyOdToTp} data-testid="copy-od-to-tp">
                  <Copy className="w-3 h-3 mr-2" strokeWidth={1.5} />
                  Same as OD Policy
                </Button>
              }
            >
              <FormField label="TP Policy Start Date" value={formData.tp_policy_start_date} onChange={(v) => updateField("tp_policy_start_date", v)} type="date" />
              <FormField label="TP Policy End Date" value={formData.tp_policy_end_date} onChange={(v) => updateField("tp_policy_end_date", v)} type="date" />
              <FormField label="Third Party Insurer" value={formData.tp_insurer} onChange={(v) => updateField("tp_insurer", v)} placeholder="Insurance company name" />
              <FormField label="TP Policy Number" value={formData.tp_policy_number} onChange={(v) => updateField("tp_policy_number", v)} />
            </Section>
          </CardContent>
        </Card>

        {/* Dates & Programs */}
        <Card className="border border-gray-200 rounded-sm shadow-none">
          <CardContent className="p-6">
            <Section title="Common Dates">
              <FormField label="Invoiced Date" value={formData.invoiced_date} onChange={(v) => updateField("invoiced_date", v)} type="date" />
              <FormField label="Vehicle Delivery Date" value={formData.delivery_date} onChange={(v) => updateField("delivery_date", v)} type="date" />
              <FormField label="VIN Mfg Year" value={formData.vin_mfg_year} onChange={(v) => updateField("vin_mfg_year", v)} placeholder="e.g., 2024" />
              <FormField label="Warranty Start Date" value={formData.warranty_start_date} onChange={(v) => updateField("warranty_start_date", v)} type="date" />
              <FormField label="Warranty End Date" value={formData.warranty_end_date} onChange={(v) => updateField("warranty_end_date", v)} type="date" />
              <FormField label="Warranty End Km" value={formData.warranty_end_km} onChange={(v) => updateField("warranty_end_km", v)} placeholder="e.g., 100000" />
            </Section>

            {isRenault && (
              <>
                <Section title="Extended Warranty">
                  <FormField label="Extended Warranty Start Date" value={formData.ext_warranty_start_date} onChange={(v) => updateField("ext_warranty_start_date", v)} type="date" />
                  <FormField label="Extended Warranty End Date" value={formData.ext_warranty_end_date} onChange={(v) => updateField("ext_warranty_end_date", v)} type="date" />
                  <FormField label="Extended Warranty End Km" value={formData.ext_warranty_end_km} onChange={(v) => updateField("ext_warranty_end_km", v)} />
                </Section>
                <Section title="Easy Care">
                  <FormField label="Easy Care Name" value={formData.easy_care_name} onChange={(v) => updateField("easy_care_name", v)} />
                  <FormField label="Easy Care Start Date" value={formData.easy_care_start_date} onChange={(v) => updateField("easy_care_start_date", v)} type="date" />
                  <FormField label="Easy Care End Date" value={formData.easy_care_end_date} onChange={(v) => updateField("easy_care_end_date", v)} type="date" />
                  <FormField label="Easy Care End KM" value={formData.easy_care_end_km} onChange={(v) => updateField("easy_care_end_km", v)} />
                </Section>
                <Section title="RSA (Roadside Assistance)">
                  <FormField label="RSA Product Name" value={formData.rsa_product_name} onChange={(v) => updateField("rsa_product_name", v)} />
                  <FormField label="RSA Certification Number" value={formData.rsa_certification_number} onChange={(v) => updateField("rsa_certification_number", v)} />
                  <FormField label="RSA Start Date" value={formData.rsa_start_date} onChange={(v) => updateField("rsa_start_date", v)} type="date" />
                  <FormField label="RSA End Date" value={formData.rsa_end_date} onChange={(v) => updateField("rsa_end_date", v)} type="date" />
                </Section>
              </>
            )}
          </CardContent>
        </Card>

        {/* Dealer (Renault only) */}
        {isRenault && (
          <Card className="border border-gray-200 rounded-sm shadow-none">
            <CardContent className="p-6">
              <Section title="Dealer Information">
                <FormField label="Dealer Code" value={formData.dealer_code} onChange={(v) => updateField("dealer_code", v)} />
                <FormField label="Dealer Name" value={formData.dealer_name} onChange={(v) => updateField("dealer_name", v)} />
                <FormField label="Dealer Group" value={formData.dealer_group} onChange={(v) => updateField("dealer_group", v)} />
                <FormField label="Last Servicing Dealer" value={formData.last_servicing_dealer} onChange={(v) => updateField("last_servicing_dealer", v)} />
                <FormField label="Penultimate Servicing Dealer" value={formData.penultimate_servicing_dealer} onChange={(v) => updateField("penultimate_servicing_dealer", v)} />
              </Section>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // ADD MODE - Step-based wizard
  return (
    <div className="space-y-6" data-testid="vehicle-form-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading font-black text-3xl md:text-4xl tracking-tighter uppercase">
            Add Vehicle
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {isRenault ? "Renault Vehicle" : "Other Brand Vehicle"}
          </p>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          className="rounded-sm bg-red-600 hover:bg-red-700 text-white h-8 w-8" 
          onClick={handleBack} 
          data-testid="cancel-btn"
        >
          <X className="w-4 h-4" strokeWidth={2.5} />
        </Button>
      </div>

      {/* Step Indicator */}
      <div className="flex flex-col items-center">
        <div className="flex items-center">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                  index < currentStep
                    ? "bg-green-500 text-white"
                    : index === currentStep
                    ? "bg-black text-white"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                {index < currentStep ? <Check className="w-4 h-4" /> : index + 1}
              </div>
              {index < steps.length - 1 && (
                <div className={`h-0.5 w-12 md:w-16 ${index < currentStep ? "bg-green-500" : "bg-gray-200"}`} />
              )}
            </div>
          ))}
        </div>
        <div className="flex items-center mt-2">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className="w-9 flex justify-center">
                <span className={`text-xs font-medium whitespace-nowrap ${index === currentStep ? "text-black" : "text-gray-400"}`}>
                  {step.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div className="w-12 md:w-16" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <Card className="border border-gray-200 rounded-sm shadow-none">
        <CardContent className="p-6">
          <div className="mb-6">
            <h2 className="text-lg font-bold">{steps[currentStep].label}</h2>
            <p className="text-sm text-gray-500">{steps[currentStep].description}</p>
          </div>

          {/* STEP 1 — Vehicle */}
          {currentStep === 0 && (
            <>
              <Section title="Vehicle Details">
                {isRenault ? (
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500 uppercase tracking-wider">Brand</Label>
                    <Input value="Renault" disabled className="rounded-sm bg-gray-50" />
                  </div>
                ) : (
                  <FormField label="Brand" value={formData.make} onChange={(v) => updateField("make", v)} placeholder="e.g., Toyota, Honda, Maruti" required />
                )}
                <FormField label="VIN #" value={formData.vin} onChange={(v) => updateField("vin", v.toUpperCase())} placeholder="Vehicle Identification Number" required />
                <FormField label="Engine #" value={formData.engine_no} onChange={(v) => updateField("engine_no", v.toUpperCase())} placeholder="Engine Number" />
                <FormField label="Temporary/Registration No" value={formData.vehicle_reg_no} onChange={(v) => updateField("vehicle_reg_no", v.toUpperCase())} placeholder="e.g., MH01AB1234" required />
                {isRenault ? (
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500 uppercase tracking-wider">Model Description <span className="text-red-500">*</span></Label>
                    <Select value={formData.model || ""} onValueChange={(v) => updateField("model", v)}>
                      <SelectTrigger className="rounded-sm"><SelectValue placeholder="Select model" /></SelectTrigger>
                      <SelectContent>{masterModels.map(m => (<SelectItem key={m} value={m}>{m}</SelectItem>))}</SelectContent>
                    </Select>
                  </div>
                ) : (
                  <FormField label="Model Description" value={formData.model} onChange={(v) => updateField("model", v)} placeholder="e.g., Corolla, City, Swift" />
                )}
                {isRenault && (
                  <>
                    <FormField label="Variant Description" value={formData.variant_description} onChange={(v) => updateField("variant_description", v)} />
                    <FormField label="Model Code" value={formData.model_code} onChange={(v) => updateField("model_code", v)} />
                    <FormField label="Color Type" value={formData.color_type} onChange={(v) => updateField("color_type", v)} />
                    <FormField label="Exterior Colour" value={formData.exterior_colour} onChange={(v) => updateField("exterior_colour", v)} />
                    <FormField label="Exterior Colour Code" value={formData.exterior_colour_code} onChange={(v) => updateField("exterior_colour_code", v)} />
                  </>
                )}
              </Section>
            </>
          )}

          {/* STEP 2 — Customer */}
          {currentStep === 1 && (
            <>
              <Section title="Contact Information">
                <FormField label="Contact Name" value={formData.customer_name} onChange={(v) => updateField("customer_name", v)} placeholder="Full name" />
                <PhoneField label="Phone" countryCode={formData.customer_country_code} phone={formData.customer_phone} onCountryCodeChange={(v) => updateField("customer_country_code", v)} onPhoneChange={(v) => updateField("customer_phone", v)} />
                <FormField label="Email" value={formData.customer_email} onChange={(v) => updateField("customer_email", v)} type="email" placeholder="Email address" />
              </Section>
              <Section title="Address">
                <FormField label="Contact Address" value={formData.contact_address} onChange={(v) => updateField("contact_address", v)} placeholder="Street address" />
                <FormField label="Contact Address 2" value={formData.contact_address2} onChange={(v) => updateField("contact_address2", v)} placeholder="Apartment, suite, etc." />
                <FormField label="City" value={formData.contact_city} onChange={(v) => updateField("contact_city", v)} />
                <FormField label="District" value={formData.contact_district} onChange={(v) => updateField("contact_district", v)} />
                <FormField label="State" value={formData.contact_state} onChange={(v) => updateField("contact_state", v)} />
                <FormField label="Country" value={formData.contact_country} onChange={(v) => updateField("contact_country", v)} />
                <FormField label="Zipcode" value={formData.contact_zipcode} onChange={(v) => updateField("contact_zipcode", v)} />
              </Section>
            </>
          )}

          {/* STEP 3 — Insurance */}
          {currentStep === 2 && (
            <>
              <Section title="Own Damage (OD)">
                <FormField label="OD Policy Start Date" value={formData.od_policy_start_date} onChange={(v) => updateField("od_policy_start_date", v)} type="date" />
                <FormField label="OD Policy End Date" value={formData.od_policy_end_date} onChange={(v) => updateField("od_policy_end_date", v)} type="date" />
                <FormField label="Own Damage Insurer" value={formData.od_insurer} onChange={(v) => updateField("od_insurer", v)} placeholder="Insurance company name" />
                <FormField label="OD Policy Number" value={formData.od_policy_number} onChange={(v) => updateField("od_policy_number", v)} />
                <div className="space-y-1 col-span-full lg:col-span-1">
                  <Label className="text-xs text-gray-500 uppercase tracking-wider">Upload OD Policy</Label>
                  <input type="file" ref={odPolicyFileRef} onChange={(e) => handlePolicyUpload(e.target.files?.[0], "od")} accept=".pdf,.jpg,.jpeg,.png" className="hidden" />
                  <Button type="button" variant="outline" className="rounded-sm w-full" onClick={() => odPolicyFileRef.current?.click()}>
                    <Upload className="w-4 h-4 mr-2" strokeWidth={1.5} />{odPolicyFile ? "Change File" : "Select File"}
                  </Button>
                  {odPolicyFile && (
                    <div className="flex items-center gap-2 mt-2 p-2 bg-green-50 border border-green-200 rounded-sm">
                      <FileText className="w-4 h-4 text-green-600" />
                      <span className="text-xs text-green-700 flex-1 truncate">{odPolicyFile.name}</span>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setOdPolicyFile(null)}><Trash2 className="w-3 h-3 text-red-500" /></Button>
                    </div>
                  )}
                </div>
              </Section>
              <Section title="Third Party (TP)" action={<Button type="button" variant="outline" size="sm" className="rounded-sm" onClick={copyOdToTp} data-testid="copy-od-to-tp"><Copy className="w-3 h-3 mr-2" strokeWidth={1.5} />Same as OD Policy</Button>}>
                <FormField label="TP Policy Start Date" value={formData.tp_policy_start_date} onChange={(v) => updateField("tp_policy_start_date", v)} type="date" />
                <FormField label="TP Policy End Date" value={formData.tp_policy_end_date} onChange={(v) => updateField("tp_policy_end_date", v)} type="date" />
                <FormField label="Third Party Insurer" value={formData.tp_insurer} onChange={(v) => updateField("tp_insurer", v)} placeholder="Insurance company name" />
                <FormField label="TP Policy Number" value={formData.tp_policy_number} onChange={(v) => updateField("tp_policy_number", v)} />
                <div className="space-y-1 col-span-full lg:col-span-1">
                  <Label className="text-xs text-gray-500 uppercase tracking-wider">Upload TP Policy</Label>
                  <input type="file" ref={tpPolicyFileRef} onChange={(e) => handlePolicyUpload(e.target.files?.[0], "tp")} accept=".pdf,.jpg,.jpeg,.png" className="hidden" />
                  <Button type="button" variant="outline" className="rounded-sm w-full" onClick={() => tpPolicyFileRef.current?.click()}>
                    <Upload className="w-4 h-4 mr-2" strokeWidth={1.5} />{tpPolicyFile ? "Change File" : "Select File"}
                  </Button>
                  {tpPolicyFile && (
                    <div className="flex items-center gap-2 mt-2 p-2 bg-green-50 border border-green-200 rounded-sm">
                      <FileText className="w-4 h-4 text-green-600" />
                      <span className="text-xs text-green-700 flex-1 truncate">{tpPolicyFile.name}</span>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setTpPolicyFile(null)}><Trash2 className="w-3 h-3 text-red-500" /></Button>
                    </div>
                  )}
                </div>
              </Section>
            </>
          )}

          {/* STEP 4 — Dates & Programs */}
          {currentStep === 3 && (
            <>
              <Section title="Common Dates">
                <FormField label="Invoiced Date" value={formData.invoiced_date} onChange={(v) => updateField("invoiced_date", v)} type="date" />
                <FormField label="Vehicle Delivery Date" value={formData.delivery_date} onChange={(v) => updateField("delivery_date", v)} type="date" />
                <FormField label="VIN Mfg Year" value={formData.vin_mfg_year} onChange={(v) => updateField("vin_mfg_year", v)} placeholder="e.g., 2024" />
                <FormField label="Warranty Start Date" value={formData.warranty_start_date} onChange={(v) => updateField("warranty_start_date", v)} type="date" />
                <FormField label="Warranty End Date" value={formData.warranty_end_date} onChange={(v) => updateField("warranty_end_date", v)} type="date" />
                <FormField label="Warranty End Km" value={formData.warranty_end_km} onChange={(v) => updateField("warranty_end_km", v)} placeholder="e.g., 100000" />
              </Section>
              {isRenault && (
                <>
                  <Section title="Extended Warranty">
                    <FormField label="Extended Warranty Start Date" value={formData.ext_warranty_start_date} onChange={(v) => updateField("ext_warranty_start_date", v)} type="date" />
                    <FormField label="Extended Warranty End Date" value={formData.ext_warranty_end_date} onChange={(v) => updateField("ext_warranty_end_date", v)} type="date" />
                    <FormField label="Extended Warranty End Km" value={formData.ext_warranty_end_km} onChange={(v) => updateField("ext_warranty_end_km", v)} />
                  </Section>
                  <Section title="Easy Care">
                    <FormField label="Easy Care Name" value={formData.easy_care_name} onChange={(v) => updateField("easy_care_name", v)} />
                    <FormField label="Easy Care Start Date" value={formData.easy_care_start_date} onChange={(v) => updateField("easy_care_start_date", v)} type="date" />
                    <FormField label="Easy Care End Date" value={formData.easy_care_end_date} onChange={(v) => updateField("easy_care_end_date", v)} type="date" />
                    <FormField label="Easy Care End KM" value={formData.easy_care_end_km} onChange={(v) => updateField("easy_care_end_km", v)} />
                  </Section>
                  <Section title="RSA (Roadside Assistance)">
                    <FormField label="RSA Product Name" value={formData.rsa_product_name} onChange={(v) => updateField("rsa_product_name", v)} />
                    <FormField label="RSA Certification Number" value={formData.rsa_certification_number} onChange={(v) => updateField("rsa_certification_number", v)} />
                    <FormField label="RSA Start Date" value={formData.rsa_start_date} onChange={(v) => updateField("rsa_start_date", v)} type="date" />
                    <FormField label="RSA End Date" value={formData.rsa_end_date} onChange={(v) => updateField("rsa_end_date", v)} type="date" />
                  </Section>
                </>
              )}
            </>
          )}

          {/* STEP 5 — Dealer (Renault only) */}
          {isRenault && currentStep === 4 && (
            <Section title="Dealer Information">
              <FormField label="Dealer Code" value={formData.dealer_code} onChange={(v) => updateField("dealer_code", v)} />
              <FormField label="Dealer Name" value={formData.dealer_name} onChange={(v) => updateField("dealer_name", v)} />
              <FormField label="Dealer Group" value={formData.dealer_group} onChange={(v) => updateField("dealer_group", v)} />
              <FormField label="Last Servicing Dealer" value={formData.last_servicing_dealer} onChange={(v) => updateField("last_servicing_dealer", v)} />
              <FormField label="Penultimate Servicing Dealer" value={formData.penultimate_servicing_dealer} onChange={(v) => updateField("penultimate_servicing_dealer", v)} />
            </Section>
          )}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between">
        <Button variant="outline" className="rounded-sm" onClick={handlePrevious} disabled={isFirstStep} data-testid="prev-btn">
          <ArrowLeft className="w-4 h-4 mr-2" strokeWidth={1.5} />Previous
        </Button>
        <div className="flex gap-2">
          {!isLastStep ? (
            <Button className="rounded-sm bg-black text-white hover:bg-gray-800" onClick={handleNext} data-testid="next-btn">
              Next<ArrowRight className="w-4 h-4 ml-2" strokeWidth={1.5} />
            </Button>
          ) : (
            <Button className="rounded-sm bg-green-600 text-white hover:bg-green-700" onClick={handleSave} disabled={saving} data-testid="save-btn">
              <Save className="w-4 h-4 mr-2" strokeWidth={1.5} />{saving ? "Saving..." : "Save Vehicle"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default VehicleForm;
