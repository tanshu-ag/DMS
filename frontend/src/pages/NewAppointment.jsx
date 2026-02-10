import { useState, useEffect } from "react";
import { useAuth, API } from "@/App";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import {
  ArrowLeft,
  Save,
  AlertTriangle,
  User,
  Car,
  Calendar,
  Search,
  Clock,
} from "lucide-react";

// Time slots 10:00 AM – 4:00 PM, 30-min intervals
const TIME_SLOTS = [
  { value: "10:00", label: "10:00 AM", disabled: false },
  { value: "10:30", label: "10:30 AM", disabled: false },
  { value: "11:00", label: "11:00 AM", disabled: false },
  { value: "11:30", label: "11:30 AM", disabled: false },
  { value: "12:00", label: "12:00 PM", disabled: false },
  { value: "13:00", label: "1:00 PM", disabled: true },
  { value: "13:30", label: "1:30 PM", disabled: true },
  { value: "14:00", label: "2:00 PM", disabled: false },
  { value: "14:30", label: "2:30 PM", disabled: false },
  { value: "15:00", label: "3:00 PM", disabled: false },
  { value: "15:30", label: "3:30 PM", disabled: false },
  { value: "16:00", label: "4:00 PM", disabled: false },
];

const BASE_SERVICE_TYPES = ["1FS", "2FS", "3FS", "PMS", "RR", "BP", "Other"];
const PMS_INTERVALS = ["30K PMS", "40K PMS", "50K PMS", "60K PMS", "70K PMS", "80K PMS", "90K PMS", "100K PMS", "110K PMS", "120K PMS", "130K PMS", "140K PMS", "150K PMS", "160K PMS", "170K PMS", "180K PMS", "190K PMS", "200K PMS"];
const COUNTRY_CODES = [
  { code: "+91", country: "India" },
  { code: "+977", country: "Nepal" },
  { code: "+975", country: "Bhutan" },
];

const NewAppointment = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [settings, setSettings] = useState(null);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [duplicates, setDuplicates] = useState([]);
  const [selectedServiceBase, setSelectedServiceBase] = useState("");
  const [selectedPmsInterval, setSelectedPmsInterval] = useState("");

  const today = new Date().toISOString().split("T")[0];

  const [formData, setFormData] = useState({
    branch: "",
    appointment_date: today,
    appointment_time: "",
    source: "",
    customer_name: "",
    customer_phone: "",
    country_code: "+91",
    customer_email: "",
    vehicle_reg_no: "",
    vin: "",
    engine_number: "",
    model: "",
    current_km: "",
    ots_recall: false,
    service_type: "",
    allocated_sa: "",
    specific_repair_request: "",
    priority_customer: false,
    recovered_lost_customer: false,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [settingsRes, branchesRes] = await Promise.all([
          axios.get(`${API}/settings`, { withCredentials: true }),
          axios.get(`${API}/branches`, { withCredentials: true }),
        ]);
        setSettings(settingsRes.data);
        // Filter branches: only Aftersales facility
        const aftersalesBranches = branchesRes.data.filter(
          (b) => b.type === "Aftersales"
        );
        setBranches(aftersalesBranches);
      } catch (error) {
        toast.error("Failed to load settings");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const checkDuplicates = async () => {
    if (!formData.customer_phone && !formData.vehicle_reg_no) return;
    try {
      const params = new URLSearchParams();
      if (formData.customer_phone) params.append("phone", formData.customer_phone);
      if (formData.vehicle_reg_no) params.append("vehicle", formData.vehicle_reg_no);
      const response = await axios.get(
        `${API}/appointments/duplicates/check?${params}`,
        { withCredentials: true }
      );
      setDuplicates(response.data);
    } catch (error) {
      console.error("Duplicate check failed:", error);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.customer_phone.length >= 10 || formData.vehicle_reg_no.length >= 6) {
        checkDuplicates();
      }
    }, 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.customer_phone, formData.vehicle_reg_no]);

  // Sync service type from base + PMS interval
  useEffect(() => {
    if (selectedServiceBase === "PMS" && selectedPmsInterval) {
      setFormData((prev) => ({ ...prev, service_type: selectedPmsInterval }));
    } else if (selectedServiceBase && selectedServiceBase !== "PMS") {
      setFormData((prev) => ({ ...prev, service_type: selectedServiceBase }));
      setSelectedPmsInterval("");
    }
  }, [selectedServiceBase, selectedPmsInterval]);

  const handleSearchVin = () => {
    toast.info("No linked data found.");
  };

  const handleSearchReg = () => {
    toast.info("No linked data found.");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.branch || !formData.appointment_time || !formData.source ||
        !formData.customer_name || !formData.customer_phone || !formData.service_type) {
      toast.error("Please fill all required fields");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...formData,
        current_km: formData.current_km ? parseInt(formData.current_km) : null,
      };
      const response = await axios.post(`${API}/appointments`, payload, {
        withCredentials: true,
      });
      toast.success("Appointment created successfully");
      navigate(`/appointments/${response.data.appointment_id}`);
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to create appointment");
    } finally {
      setSaving(false);
    }
  };

  // Get display label for selected time
  const selectedTimeLabel = TIME_SLOTS.find((s) => s.value === formData.appointment_time)?.label || "";

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6" data-testid="new-appointment-page">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="rounded-sm"
          onClick={() => navigate(-1)}
          data-testid="back-btn"
        >
          <ArrowLeft className="w-5 h-5" strokeWidth={1.5} />
        </Button>
        <div>
          <h1 className="font-heading font-black text-3xl tracking-tighter uppercase">
            New Appointment
          </h1>
          <p className="text-sm text-gray-500 mt-1">Quick booking form</p>
        </div>
      </div>

      {/* Duplicate Warning */}
      {duplicates.length > 0 && (
        <Card className="border-2 border-black rounded-sm shadow-none bg-gray-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <AlertTriangle className="w-5 h-5" strokeWidth={1.5} />
              <span className="font-bold text-sm uppercase tracking-wider">
                Potential Duplicate Found
              </span>
            </div>
            <div className="space-y-2">
              {duplicates.map((d) => (
                <div
                  key={d.appointment_id}
                  className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-sm cursor-pointer hover:border-black"
                  onClick={() => navigate(`/appointments/${d.appointment_id}`)}
                >
                  <div>
                    <p className="font-medium">{d.customer_name}</p>
                    <p className="text-xs text-gray-500 font-mono">
                      {d.customer_phone} {d.vehicle_reg_no && `• ${d.vehicle_reg_no}`}
                    </p>
                  </div>
                  <Badge variant="outline" className="rounded-sm text-xs font-mono">
                    {d.appointment_date}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleSubmit}>
        {/* 1. Vehicle Information */}
        <Card className="border border-gray-200 rounded-sm shadow-none mb-6">
          <CardHeader className="border-b border-gray-100 pb-4">
            <CardTitle className="font-heading font-bold text-lg tracking-tight uppercase flex items-center gap-2">
              <Car className="w-5 h-5" strokeWidth={1.5} />
              Vehicle Information
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <Label className="form-label">Registration No</Label>
                <div className="relative">
                  <Input
                    value={formData.vehicle_reg_no}
                    onChange={(e) => setFormData({ ...formData, vehicle_reg_no: e.target.value.toUpperCase() })}
                    placeholder="KA01AB1234"
                    className="rounded-sm uppercase pr-9"
                    data-testid="input-vehicle-reg"
                  />
                  <button
                    type="button"
                    onClick={handleSearchReg}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black transition-colors"
                    data-testid="search-reg-btn"
                  >
                    <Search className="w-4 h-4" strokeWidth={1.5} />
                  </button>
                </div>
              </div>

              <div>
                <Label className="form-label">VIN</Label>
                <div className="relative">
                  <Input
                    value={formData.vin}
                    onChange={(e) => setFormData({ ...formData, vin: e.target.value.toUpperCase() })}
                    placeholder="Vehicle Identification Number"
                    className="rounded-sm uppercase pr-9"
                    data-testid="input-vin"
                  />
                  <button
                    type="button"
                    onClick={handleSearchVin}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black transition-colors"
                    data-testid="search-vin-btn"
                  >
                    <Search className="w-4 h-4" strokeWidth={1.5} />
                  </button>
                </div>
              </div>

              <div>
                <Label className="form-label">Engine Number</Label>
                <Input
                  value={formData.engine_number}
                  onChange={(e) => setFormData({ ...formData, engine_number: e.target.value.toUpperCase() })}
                  placeholder="Engine serial number"
                  className="rounded-sm uppercase"
                  data-testid="input-engine-number"
                />
              </div>

              <div>
                <Label className="form-label">Model</Label>
                <Input
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  placeholder="Kwid, Duster, etc."
                  className="rounded-sm"
                  data-testid="input-model"
                />
              </div>

              <div>
                <Label className="form-label">Current KM</Label>
                <Input
                  type="number"
                  value={formData.current_km}
                  onChange={(e) => setFormData({ ...formData, current_km: e.target.value })}
                  placeholder="45000"
                  className="rounded-sm"
                  data-testid="input-km"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 2. Customer Information */}
        <Card className="border border-gray-200 rounded-sm shadow-none mb-6">
          <CardHeader className="border-b border-gray-100 pb-4">
            <CardTitle className="font-heading font-bold text-lg tracking-tight uppercase flex items-center gap-2">
              <User className="w-5 h-5" strokeWidth={1.5} />
              Customer Information
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <Label className="form-label">Customer Name *</Label>
                <Input
                  value={formData.customer_name}
                  onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                  placeholder="Full name"
                  className="rounded-sm"
                  data-testid="input-customer-name"
                />
              </div>

              <div>
                <Label className="form-label">Phone Number *</Label>
                <div className="flex gap-1.5">
                  <Select
                    value={formData.country_code}
                    onValueChange={(v) => setFormData({ ...formData, country_code: v })}
                  >
                    <SelectTrigger className="rounded-sm w-[88px] shrink-0" data-testid="input-country-code">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRY_CODES.map((c) => (
                        <SelectItem key={c.code} value={c.code}>
                          {c.code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    value={formData.customer_phone}
                    onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                    placeholder="10-digit mobile"
                    className="rounded-sm"
                    data-testid="input-customer-phone"
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <Label className="form-label">Email (Optional)</Label>
                <Input
                  type="email"
                  value={formData.customer_email}
                  onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
                  placeholder="customer@email.com"
                  className="rounded-sm"
                  data-testid="input-customer-email"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 3. Required Information */}
        <Card className="border border-gray-200 rounded-sm shadow-none mb-6">
          <CardHeader className="border-b border-gray-100 pb-4">
            <CardTitle className="font-heading font-bold text-lg tracking-tight uppercase flex items-center gap-2">
              <Calendar className="w-5 h-5" strokeWidth={1.5} />
              Required Information
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <Label className="form-label">Branch *</Label>
                <Select
                  value={formData.branch}
                  onValueChange={(v) => setFormData({ ...formData, branch: v })}
                >
                  <SelectTrigger className="rounded-sm" data-testid="input-branch">
                    <SelectValue placeholder="Select branch" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.length === 0 ? (
                      <div className="px-3 py-2 text-sm text-gray-400">
                        No Aftersales branches found
                      </div>
                    ) : (
                      branches.map((b) => (
                        <SelectItem key={b.branch_id} value={b.location}>
                          {b.location}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="form-label">Date *</Label>
                <Input
                  type="date"
                  value={formData.appointment_date}
                  onChange={(e) => setFormData({ ...formData, appointment_date: e.target.value })}
                  className="rounded-sm"
                  data-testid="input-date"
                />
              </div>

              <div>
                <Label className="form-label">Time Slot *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full rounded-sm justify-start font-normal text-sm h-10"
                      data-testid="input-time-slot"
                    >
                      <Clock className="w-4 h-4 mr-2 text-gray-400" strokeWidth={1.5} />
                      {selectedTimeLabel || <span className="text-gray-500">Select time slot</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[280px] p-3 rounded-sm" align="start">
                    <div className="grid grid-cols-3 gap-1.5">
                      {TIME_SLOTS.map((slot) => (
                        <Button
                          key={slot.value}
                          type="button"
                          variant={formData.appointment_time === slot.value ? "default" : "outline"}
                          size="sm"
                          disabled={slot.disabled}
                          className={`rounded-sm text-xs font-mono h-8 ${
                            formData.appointment_time === slot.value
                              ? "bg-black text-white hover:bg-gray-800"
                              : slot.disabled
                              ? "opacity-40 line-through"
                              : ""
                          }`}
                          onClick={() => setFormData({ ...formData, appointment_time: slot.value })}
                          data-testid={`slot-${slot.value}`}
                        >
                          {slot.label}
                        </Button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label className="form-label">Source *</Label>
                <Select
                  value={formData.source}
                  onValueChange={(v) => setFormData({ ...formData, source: v })}
                >
                  <SelectTrigger className="rounded-sm" data-testid="input-source">
                    <SelectValue placeholder="Select source" />
                  </SelectTrigger>
                  <SelectContent>
                    {settings?.sources?.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="form-label">Service Type *</Label>
                <Select
                  value={selectedServiceBase}
                  onValueChange={(v) => setSelectedServiceBase(v)}
                >
                  <SelectTrigger className="rounded-sm" data-testid="input-service-type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {BASE_SERVICE_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* PMS Interval sub-dropdown */}
              {selectedServiceBase === "PMS" && (
                <div>
                  <Label className="form-label">PMS Interval *</Label>
                  <Select
                    value={selectedPmsInterval}
                    onValueChange={(v) => setSelectedPmsInterval(v)}
                  >
                    <SelectTrigger className="rounded-sm" data-testid="input-pms-interval">
                      <SelectValue placeholder="Select interval" />
                    </SelectTrigger>
                    <SelectContent>
                      {PMS_INTERVALS.map((p) => (
                        <SelectItem key={p} value={p}>{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <Label className="form-label">Service Advisor</Label>
                <Select
                  value={formData.allocated_sa}
                  onValueChange={(v) => setFormData({ ...formData, allocated_sa: v })}
                >
                  <SelectTrigger className="rounded-sm" data-testid="input-sa">
                    <SelectValue placeholder="Assign SA" />
                  </SelectTrigger>
                  <SelectContent>
                    {settings?.service_advisors?.map((sa) => (
                      <SelectItem key={sa} value={sa}>{sa}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 4. Additional Details (no DocketReady) */}
        <Card className="border border-gray-200 rounded-sm shadow-none mb-6">
          <CardHeader className="border-b border-gray-100 pb-4">
            <CardTitle className="font-heading font-bold text-lg tracking-tight uppercase">
              Additional Details
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-6">
              <div>
                <Label className="form-label">Specific Repair Request</Label>
                <Textarea
                  value={formData.specific_repair_request}
                  onChange={(e) => setFormData({ ...formData, specific_repair_request: e.target.value })}
                  placeholder="Describe any specific issues or requests..."
                  className="rounded-sm min-h-[100px]"
                  data-testid="input-repair-request"
                />
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-sm">
                  <div>
                    <p className="text-sm font-medium">OTS/Recall</p>
                    <p className="text-xs text-gray-500">Renault recall check</p>
                  </div>
                  <Switch
                    checked={formData.ots_recall}
                    onCheckedChange={(v) => setFormData({ ...formData, ots_recall: v })}
                    data-testid="switch-ots-recall"
                  />
                </div>

                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-sm">
                  <div>
                    <p className="text-sm font-medium">Priority</p>
                    <p className="text-xs text-gray-500">High priority customer</p>
                  </div>
                  <Switch
                    checked={formData.priority_customer}
                    onCheckedChange={(v) => setFormData({ ...formData, priority_customer: v })}
                    data-testid="switch-priority"
                  />
                </div>

                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-sm">
                  <div>
                    <p className="text-sm font-medium">Recovered</p>
                    <p className="text-xs text-gray-500">From lost customer list</p>
                  </div>
                  <Switch
                    checked={formData.recovered_lost_customer}
                    onCheckedChange={(v) => setFormData({ ...formData, recovered_lost_customer: v })}
                    data-testid="switch-recovered"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex items-center justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            className="rounded-sm"
            onClick={() => navigate(-1)}
            data-testid="cancel-btn"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="bg-black text-white hover:bg-gray-800 rounded-sm font-mono text-xs uppercase tracking-wider px-8"
            disabled={saving}
            data-testid="save-btn"
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" strokeWidth={1.5} />
                Create Appointment
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default NewAppointment;
