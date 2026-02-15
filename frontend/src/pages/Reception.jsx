import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { API, useAuth } from "@/App";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  RadioGroup, RadioGroupItem,
} from "@/components/ui/radio-group";
import { toast } from "sonner";
import { Plus, RefreshCw, Eye, Search, ArrowLeft, ChevronRight, ChevronLeft, Paperclip, FileCheck, FileX } from "lucide-react";

const SOURCES = ["Walk-in", "Appointment", "RSA"];
const STATUSES = ["Pending Contact Validation", "Validated", "Documents Pending", "Completed"];
const DATE_FILTERS = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "this_week", label: "This Week" },
  { value: "custom", label: "Custom" },
];

export default function Reception() {
  const { entryId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Register state
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [branches, setBranches] = useState([]);
  const [filters, setFilters] = useState({ branch: "", date_filter: "today", source: "", status: "", date_from: "", date_to: "" });

  // Wizard state
  const [wizardOpen, setWizardOpen] = useState(false);
  const [step, setStep] = useState(1);

  // Detail view state
  const [detailEntry, setDetailEntry] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // Step 1 state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [selectedVehicleIndex, setSelectedVehicleIndex] = useState(-1); // Store index instead of object reference
  const [selectedVin, setSelectedVin] = useState(""); // Separate state for VIN input when vehicle is missing VIN
  const [selectedVinMissing, setSelectedVinMissing] = useState(false); // Track if VIN was originally missing
  const [createNew, setCreateNew] = useState(false);
  const [newVehicle, setNewVehicle] = useState({ vehicle_reg_no: "", vin: "", engine_no: "" });
  const [dupError, setDupError] = useState({ reg: false, vin: false });
  const [receptionTime, setReceptionTime] = useState("");
  const [entrySource, setEntrySource] = useState("Walk-in");
  
  // Computed: get selected vehicle from index
  const selectedVehicle = selectedVehicleIndex >= 0 ? searchResults[selectedVehicleIndex] : null;

  // Step 2 state
  const [customerType, setCustomerType] = useState("Individual");
  const [contactData, setContactData] = useState({
    first_name: "", last_name: "", company_name: "",
    address: "", city: "", state: "", pin: "",
    contact_no: "", alternate_no: "", email: "",
    date_of_birth: "", anniversary: "",
    driven_by: "Owner",
    preferred_contact_mode: [],
    preferred_contact_time: [],
  });
  const [oldContactData, setOldContactData] = useState(null);

  // Step 3 state
  const [docs, setDocs] = useState({
    insurance_attached: false, insurance_not_collected: false, insurance_reason: "",
    rc_attached: false, rc_not_collected: false, rc_reason: "",
  });

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.branch) params.set("branch", filters.branch);
      if (filters.date_filter) params.set("date_filter", filters.date_filter);
      if (filters.source) params.set("source", filters.source);
      if (filters.status) params.set("status", filters.status);
      if (filters.date_filter === "custom") {
        if (filters.date_from) params.set("date_from", filters.date_from);
        if (filters.date_to) params.set("date_to", filters.date_to);
      }
      const res = await axios.get(`${API}/reception?${params.toString()}`, { withCredentials: true });
      setEntries(res.data);
    } catch { toast.error("Failed to load reception entries"); }
    setLoading(false);
  }, [filters]);

  const fetchBranches = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/branches`, { withCredentials: true });
      setBranches(res.data || []);
    } catch {}
  }, []);

  useEffect(() => { fetchBranches(); }, [fetchBranches]);
  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  // Detail view via URL param
  useEffect(() => {
    if (entryId) {
      axios.get(`${API}/reception/${entryId}`, { withCredentials: true })
        .then(res => { setDetailEntry(res.data); setDetailOpen(true); })
        .catch(() => toast.error("Entry not found"));
    }
  }, [entryId]);

  // Search vehicle
  const handleSearch = async () => {
    if (!searchQuery || searchQuery.length < 2) { toast.error("Enter at least 2 characters"); return; }
    setSearching(true); setSearched(true); setCreateNew(false);
    // Reset selection state
    setSelectedVehicleIndex(-1);
    setSelectedVin("");
    setSelectedVinMissing(false);
    try {
      const res = await axios.get(`${API}/reception/search-vehicle?q=${encodeURIComponent(searchQuery)}`, { withCredentials: true });
      setSearchResults(res.data || []);
    } catch { setSearchResults([]); }
    setSearching(false);
  };

  // Check duplicates for new vehicle
  const checkDuplicate = async (field, value) => {
    if (!value || value.length < 3) return;
    try {
      const params = field === "reg_no" ? `reg_no=${encodeURIComponent(value)}` : `vin=${encodeURIComponent(value)}`;
      const res = await axios.get(`${API}/reception/check-duplicate?${params}`, { withCredentials: true });
      setDupError(prev => ({ ...prev, [field === "reg_no" ? "reg" : "vin"]: field === "reg_no" ? res.data.duplicate_reg : res.data.duplicate_vin }));
    } catch {}
  };

  // Select existing vehicle → prefill contact data
  const selectVehicle = async (index) => {
    const v = searchResults[index];
    if (!v) return;
    
    setSelectedVehicleIndex(index);
    setCreateNew(false);
    // Track if VIN was originally missing
    const vinMissing = !v.vin;
    setSelectedVinMissing(vinMissing);
    setSelectedVin(v.vin || "");
    // Try to get full stored customer data
    try {
      const res = await axios.get(`${API}/reception/vehicle/${encodeURIComponent(v.vehicle_reg_no)}`, { withCredentials: true });
      if (res.data) {
        const d = res.data;
        setContactData({
          first_name: d.first_name || "", last_name: d.last_name || "",
          company_name: d.company_name || "",
          address: d.address || "", city: d.city || "", state: d.state || "", pin: d.pin || "",
          contact_no: d.contact_no || v.customer_phone || "",
          alternate_no: d.alternate_no || "", email: d.email || v.customer_email || "",
          date_of_birth: d.date_of_birth || "", anniversary: d.anniversary || "",
          driven_by: d.driven_by || "Owner",
          preferred_contact_mode: d.preferred_contact_mode || [],
          preferred_contact_time: d.preferred_contact_time || [],
        });
        setCustomerType(d.customer_type || "Individual");
        // Store old data for masked display
        setOldContactData({ ...d });
        return;
      }
    } catch {}
    // Fallback: use search result data
    const nameParts = (v.customer_name || "").split(" ");
    setContactData(prev => ({
      ...prev,
      first_name: nameParts[0] || "", last_name: nameParts.slice(1).join(" ") || "",
      contact_no: v.customer_phone || "", email: v.customer_email || "",
    }));
    setOldContactData(null);
  };

  // Mask value for display
  const maskValue = (val) => {
    if (!val || val.length < 4) return "";
    return val[0] + val[1] + "X".repeat(Math.max(0, val.length - 4)) + val.slice(-2);
  };

  // Reset wizard
  const resetWizard = () => {
    setStep(1); setSearchQuery(""); setSearchResults([]); setSearched(false);
    setSelectedVehicleIndex(-1); setSelectedVin(""); setSelectedVinMissing(false); setCreateNew(false);
    setNewVehicle({ vehicle_reg_no: "", vin: "", engine_no: "" });
    setDupError({ reg: false, vin: false });
    setReceptionTime(""); setEntrySource("Walk-in");
    setCustomerType("Individual");
    setContactData({ first_name: "", last_name: "", company_name: "", address: "", city: "", state: "", pin: "", contact_no: "", alternate_no: "", email: "", date_of_birth: "", anniversary: "", driven_by: "Owner", preferred_contact_mode: [], preferred_contact_time: [] });
    setOldContactData(null);
    setDocs({ insurance_attached: false, insurance_not_collected: false, insurance_reason: "", rc_attached: false, rc_not_collected: false, rc_reason: "" });
  };

  // Save entry
  const handleSave = async () => {
    const regNo = createNew ? newVehicle.vehicle_reg_no : getSelectedRegNo();
    const vin = createNew ? newVehicle.vin : getSelectedVin();
    if (!regNo || !vin) { toast.error("Vehicle Reg No and VIN are required"); return; }
    if (!receptionTime) { toast.error("Vehicle Reception Time is required"); return; }
    if (customerType === "Individual" && (!contactData.first_name || !contactData.last_name)) { toast.error("First Name and Last Name are required"); return; }
    if (customerType === "Company" && !contactData.company_name) { toast.error("Company Name is required"); return; }
    if (!contactData.contact_no) { toast.error("Contact No is required"); return; }

    try {
      await axios.post(`${API}/reception`, {
        vehicle_reception_time: receptionTime,
        source: entrySource,
        vehicle_reg_no: regNo,
        vin: vin,
        engine_no: createNew ? newVehicle.engine_no : (selectedVehicle?.engine_no || ""),
        customer_type: customerType,
        ...contactData,
        insurance_attached: docs.insurance_attached,
        insurance_not_collected: docs.insurance_not_collected,
        insurance_not_collected_reason: docs.insurance_reason,
        rc_attached: docs.rc_attached,
        rc_not_collected: docs.rc_not_collected,
        rc_not_collected_reason: docs.rc_reason,
        branch: branches[0]?.name || "",
        linked_appointment_id: selectedVehicle?.appointment_id || "",
      }, { withCredentials: true });
      toast.success("Reception entry created");
      setWizardOpen(false);
      resetWizard();
      fetchEntries();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Failed to create entry");
    }
  };

  const fmtTime = (iso) => {
    if (!iso) return "-";
    try {
      const d = new Date(iso);
      return d.toLocaleString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true });
    } catch { return iso; }
  };

  const canGoNext1 = (selectedVehicle ? (getSelectedRegNo() && getSelectedVin()) : (createNew && newVehicle.vehicle_reg_no && newVehicle.vin && !dupError.reg && !dupError.vin)) && receptionTime;

  // Helpers to get final reg/vin accounting for inline edits on selected vehicle
  function getSelectedRegNo() { return selectedVehicle?.vehicle_reg_no || ""; }
  function getSelectedVin() { return selectedVinMissing ? selectedVin : (selectedVehicle?.vin || ""); }

  // ===================== RENDER =====================

  // Detail view
  if (detailOpen && detailEntry) {
    return (
      <div className="space-y-6" data-testid="reception-detail">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => { setDetailOpen(false); setDetailEntry(null); navigate("/customer-relations/reception"); }} data-testid="back-btn">
            <ArrowLeft className="w-5 h-5" strokeWidth={1.5} />
          </Button>
          <div>
            <h1 className="font-heading font-black text-2xl tracking-tight uppercase">{detailEntry.vehicle_reg_no}</h1>
            <p className="text-sm text-gray-500 font-mono">{detailEntry.entry_id}</p>
          </div>
          <Badge className={`ml-2 rounded-sm text-xs ${detailEntry.status === "Completed" ? "bg-green-100 text-green-800" : detailEntry.status === "Documents Pending" ? "bg-amber-100 text-amber-800" : "bg-gray-100 text-gray-800"}`}>{detailEntry.status}</Badge>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="border border-gray-200 rounded-sm shadow-none">
              <CardHeader className="border-b border-gray-100 pb-4"><CardTitle className="font-heading font-bold text-base tracking-tight uppercase flex items-center gap-2">Vehicle</CardTitle></CardHeader>
              <CardContent className="p-6 grid grid-cols-2 md:grid-cols-4 gap-6">
                <div><Label className="form-label">Reg No</Label><p className="text-sm font-mono mt-1">{detailEntry.vehicle_reg_no}</p></div>
                <div><Label className="form-label">VIN</Label><p className="text-sm font-mono mt-1">{detailEntry.vin || "-"}</p></div>
                <div><Label className="form-label">Engine No</Label><p className="text-sm font-mono mt-1">{detailEntry.engine_no || "-"}</p></div>
                <div><Label className="form-label">Source</Label><p className="text-sm mt-1">{detailEntry.source}</p></div>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 rounded-sm shadow-none">
              <CardHeader className="border-b border-gray-100 pb-4"><CardTitle className="font-heading font-bold text-base tracking-tight uppercase flex items-center gap-2">Customer</CardTitle></CardHeader>
              <CardContent className="p-6 grid grid-cols-2 md:grid-cols-3 gap-6">
                <div><Label className="form-label">Name</Label><p className="text-sm mt-1">{detailEntry.customer_name || "-"}</p></div>
                <div><Label className="form-label">Phone</Label><p className="text-sm mt-1">{detailEntry.contact_no}</p></div>
                <div><Label className="form-label">Email</Label><p className="text-sm mt-1">{detailEntry.email || "-"}</p></div>
                <div><Label className="form-label">Address</Label><p className="text-sm mt-1">{[detailEntry.address, detailEntry.city, detailEntry.state, detailEntry.pin].filter(Boolean).join(", ") || "-"}</p></div>
                <div><Label className="form-label">Driven By</Label><p className="text-sm mt-1">{detailEntry.driven_by || "-"}</p></div>
                <div><Label className="form-label">Contact Validation</Label><Badge variant={detailEntry.contact_validation ? "default" : "outline"} className="rounded-sm text-xs mt-1">{detailEntry.contact_validation ? "Yes" : "No"}</Badge></div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border border-gray-200 rounded-sm shadow-none">
              <CardHeader className="border-b border-gray-100 pb-4"><CardTitle className="font-heading font-bold text-base tracking-tight uppercase">Timings</CardTitle></CardHeader>
              <CardContent className="p-6 space-y-4">
                <div><Label className="form-label">Vehicle Reception Time</Label><p className="text-sm font-mono mt-1">{fmtTime(detailEntry.vehicle_reception_time)}</p></div>
                <div><Label className="form-label">Entry Time</Label><p className="text-sm font-mono mt-1">{fmtTime(detailEntry.entry_time)}</p></div>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 rounded-sm shadow-none">
              <CardHeader className="border-b border-gray-100 pb-4"><CardTitle className="font-heading font-bold text-base tracking-tight uppercase">Documents</CardTitle></CardHeader>
              <CardContent className="p-6 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Insurance</span>
                  {detailEntry.insurance_attached ? <Badge className="bg-green-100 text-green-800 rounded-sm text-xs">Attached</Badge> : detailEntry.insurance_not_collected ? <Badge variant="outline" className="rounded-sm text-xs">Not Collected</Badge> : <Badge variant="outline" className="rounded-sm text-xs text-red-600 border-red-200">Missing</Badge>}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">RC</span>
                  {detailEntry.rc_attached ? <Badge className="bg-green-100 text-green-800 rounded-sm text-xs">Attached</Badge> : detailEntry.rc_not_collected ? <Badge variant="outline" className="rounded-sm text-xs">Not Collected</Badge> : <Badge variant="outline" className="rounded-sm text-xs text-red-600 border-red-200">Missing</Badge>}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Main register view
  return (
    <div className="space-y-6" data-testid="reception-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading font-black text-3xl tracking-tight uppercase" data-testid="reception-title">Reception</h1>
          <p className="text-sm text-gray-500 mt-1">Vehicle reception register</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="rounded-sm" onClick={fetchEntries} data-testid="refresh-btn">
            <RefreshCw className="w-4 h-4" strokeWidth={1.5} />
          </Button>
          <Button className="bg-black text-white hover:bg-gray-800 rounded-sm" onClick={() => { resetWizard(); setWizardOpen(true); }} data-testid="new-entry-btn">
            <Plus className="w-4 h-4 mr-2" strokeWidth={1.5} /> New Entry
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-40">
          <Label className="form-label">Branch</Label>
          <Select value={filters.branch} onValueChange={(v) => setFilters(f => ({ ...f, branch: v === "all" ? "" : v }))}>
            <SelectTrigger className="rounded-sm h-9 text-sm" data-testid="filter-branch"><SelectValue placeholder="All" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {branches.map(b => <SelectItem key={b.branch_id || b.name} value={b.name}>{b.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="w-36">
          <Label className="form-label">Date</Label>
          <Select value={filters.date_filter} onValueChange={(v) => setFilters(f => ({ ...f, date_filter: v }))}>
            <SelectTrigger className="rounded-sm h-9 text-sm" data-testid="filter-date"><SelectValue /></SelectTrigger>
            <SelectContent>{DATE_FILTERS.map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        {filters.date_filter === "custom" && (
          <>
            <div><Label className="form-label">From</Label><Input type="date" value={filters.date_from} onChange={e => setFilters(f => ({ ...f, date_from: e.target.value }))} className="rounded-sm h-9 text-sm w-36" /></div>
            <div><Label className="form-label">To</Label><Input type="date" value={filters.date_to} onChange={e => setFilters(f => ({ ...f, date_to: e.target.value }))} className="rounded-sm h-9 text-sm w-36" /></div>
          </>
        )}
        <div className="w-36">
          <Label className="form-label">Source</Label>
          <Select value={filters.source} onValueChange={(v) => setFilters(f => ({ ...f, source: v === "all" ? "" : v }))}>
            <SelectTrigger className="rounded-sm h-9 text-sm" data-testid="filter-source"><SelectValue placeholder="All" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {SOURCES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="w-52">
          <Label className="form-label">Status</Label>
          <Select value={filters.status} onValueChange={(v) => setFilters(f => ({ ...f, status: v === "all" ? "" : v }))}>
            <SelectTrigger className="rounded-sm h-9 text-sm" data-testid="filter-status"><SelectValue placeholder="All" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <Card className="border border-gray-200 rounded-sm shadow-none">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/80">
              <TableHead className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Vehicle Reception</TableHead>
              <TableHead className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Entry Time</TableHead>
              <TableHead className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Source</TableHead>
              <TableHead className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Reg No</TableHead>
              <TableHead className="text-[10px] uppercase tracking-widest font-bold text-gray-500">VIN</TableHead>
              <TableHead className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Customer</TableHead>
              <TableHead className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Phone</TableHead>
              <TableHead className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Contact Valid.</TableHead>
              <TableHead className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Documents</TableHead>
              <TableHead className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Status</TableHead>
              <TableHead className="text-[10px] uppercase tracking-widest font-bold text-gray-500 w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={11} className="text-center py-12 text-gray-400">Loading...</TableCell></TableRow>
            ) : entries.length === 0 ? (
              <TableRow><TableCell colSpan={11} className="text-center py-12 text-gray-400">No entries found</TableCell></TableRow>
            ) : entries.map((e) => (
              <TableRow key={e.entry_id} className="hover:bg-gray-50/50" data-testid={`row-${e.entry_id}`}>
                <TableCell className="text-xs font-mono">{fmtTime(e.vehicle_reception_time)}</TableCell>
                <TableCell className="text-xs font-mono">{fmtTime(e.entry_time)}</TableCell>
                <TableCell><Badge variant="outline" className="rounded-sm text-xs">{e.source}</Badge></TableCell>
                <TableCell className="text-sm font-mono font-medium">{e.vehicle_reg_no}</TableCell>
                <TableCell className="text-xs font-mono text-gray-500">{e.vin}</TableCell>
                <TableCell className="text-sm">{e.customer_name}</TableCell>
                <TableCell className="text-xs font-mono">{e.contact_no}</TableCell>
                <TableCell>{e.contact_validation ? <Badge className="bg-green-100 text-green-800 rounded-sm text-xs">Yes</Badge> : <Badge variant="outline" className="rounded-sm text-xs">No</Badge>}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    {e.insurance_attached ? <Badge className="bg-green-100 text-green-800 rounded-sm text-[10px]">Ins</Badge> : <Badge variant="outline" className="rounded-sm text-[10px] text-red-500 border-red-200">Ins</Badge>}
                    {e.rc_attached ? <Badge className="bg-green-100 text-green-800 rounded-sm text-[10px]">RC</Badge> : <Badge variant="outline" className="rounded-sm text-[10px] text-red-500 border-red-200">RC</Badge>}
                  </div>
                </TableCell>
                <TableCell><Badge className={`rounded-sm text-xs ${e.status === "Completed" ? "bg-green-100 text-green-800" : e.status === "Documents Pending" ? "bg-amber-100 text-amber-800" : "bg-gray-100 text-gray-800"}`}>{e.status}</Badge></TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" className="h-7 w-7 rounded-sm" onClick={() => { setDetailEntry(e); setDetailOpen(true); }} data-testid={`action-btn-${e.entry_id}`}>
                    <Eye className="w-4 h-4" strokeWidth={1.5} />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* ========== 3-STEP WIZARD MODAL ========== */}
      <Dialog open={wizardOpen} onOpenChange={(open) => { if (!open) { setWizardOpen(false); resetWizard(); } }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="wizard-modal">
          <DialogHeader>
            <DialogTitle className="font-heading font-bold text-lg tracking-tight uppercase">
              New Reception Entry — Step {step} of 3
            </DialogTitle>
            <div className="flex gap-1 mt-2">
              {[1, 2, 3].map(s => (
                <div key={s} className={`h-1 flex-1 rounded-full ${s <= step ? "bg-black" : "bg-gray-200"}`} />
              ))}
            </div>
          </DialogHeader>

          {/* STEP 1: Find Vehicle */}
          {step === 1 && (
            <div className="space-y-5 py-2" data-testid="wizard-step-1">
              <div className="flex gap-2">
                <Input placeholder="Enter Reg No / Phone / VIN" value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSearch()}
                  className="rounded-sm flex-1" data-testid="vehicle-search-input" />
                <Button onClick={handleSearch} className="rounded-sm bg-black text-white hover:bg-gray-800" disabled={searching} data-testid="vehicle-search-btn">
                  <Search className="w-4 h-4 mr-1" /> Search
                </Button>
              </div>

              {searched && !searching && searchResults.length === 0 && !createNew && (
                <div className="text-center py-4 border border-dashed border-gray-300 rounded-sm">
                  <p className="text-sm text-gray-500 mb-2">No vehicle found.</p>
                  <Button variant="outline" className="rounded-sm" onClick={() => setCreateNew(true)} data-testid="create-new-vehicle-btn">Create New Vehicle</Button>
                </div>
              )}

              {searchResults.length > 0 && !createNew && (
                <div className="space-y-2">
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {searchResults.map((r, i) => (
                      <div key={i} className={`p-3 border rounded-sm cursor-pointer transition-colors ${selectedVehicle === r ? "border-black bg-gray-50" : "border-gray-200 hover:border-gray-400"}`}
                        onClick={() => {
                          // Only select if not already selected (prevents re-triggering)
                          if (selectedVehicle !== r) {
                            selectVehicle(r);
                          }
                        }} data-testid={`search-result-${i}`}>
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm font-mono font-bold">{r.vehicle_reg_no || "No Reg"}</p>
                            <p className="text-xs text-gray-500">{r.customer_name} &middot; {r.customer_phone}</p>
                          </div>
                          {r.model && <Badge variant="outline" className="rounded-sm text-xs">{r.model}</Badge>}
                        </div>
                      </div>
                    ))}
                  </div>
                  {selectedVehicle && selectedVinMissing && (
                    <div className="p-3 border border-amber-300 bg-amber-50 rounded-sm space-y-2">
                      <p className="text-xs text-amber-700 font-medium">VIN is missing for this vehicle. Please enter:</p>
                      <Input placeholder="Enter VIN" className="rounded-sm uppercase" value={selectedVin}
                        onChange={e => setSelectedVin(e.target.value.toUpperCase().replace(/\s/g, ""))}
                        onKeyDown={e => {
                          // Prevent Enter from triggering search
                          if (e.key === "Enter") {
                            e.preventDefault();
                            e.stopPropagation();
                          }
                        }}
                        onClick={e => e.stopPropagation()}
                        onMouseDown={e => e.stopPropagation()}
                        data-testid="missing-vin-input" />
                    </div>
                  )}
                  {selectedVehicle && !selectedVehicle.vehicle_reg_no && (
                    <div className="p-3 border border-amber-300 bg-amber-50 rounded-sm space-y-2">
                      <p className="text-xs text-amber-700 font-medium">Registration No is missing. Please enter:</p>
                      <Input placeholder="Enter Reg No" className="rounded-sm uppercase" value={selectedVehicle.vehicle_reg_no || ""}
                        onChange={e => setSelectedVehicle(v => ({ ...v, vehicle_reg_no: e.target.value.toUpperCase().replace(/\s/g, "") }))}
                        onKeyDown={e => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            e.stopPropagation();
                          }
                        }}
                        onClick={e => e.stopPropagation()}
                        onMouseDown={e => e.stopPropagation()}
                        data-testid="missing-reg-input" />
                    </div>
                  )}
                  <Button variant="link" className="text-xs p-0 h-auto" onClick={() => setCreateNew(true)}>Or create new vehicle</Button>
                </div>
              )}

              {createNew && (
                <div className="space-y-3 p-4 border border-gray-200 rounded-sm bg-gray-50/50">
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-500">New Vehicle</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Registration No *</Label>
                      <Input value={newVehicle.vehicle_reg_no} className="rounded-sm uppercase"
                        onChange={e => setNewVehicle(v => ({ ...v, vehicle_reg_no: e.target.value.toUpperCase().replace(/\s/g, "") }))}
                        onBlur={() => checkDuplicate("reg_no", newVehicle.vehicle_reg_no)}
                        data-testid="new-reg-no" />
                      {dupError.reg && <p className="text-xs text-red-600 mt-1" data-testid="dup-reg-error">Vehicle Already Exist</p>}
                    </div>
                    <div>
                      <Label className="text-xs">VIN *</Label>
                      <Input value={newVehicle.vin} className="rounded-sm uppercase"
                        onChange={e => setNewVehicle(v => ({ ...v, vin: e.target.value.toUpperCase().replace(/\s/g, "") }))}
                        onBlur={() => checkDuplicate("vin", newVehicle.vin)}
                        data-testid="new-vin" />
                      {dupError.vin && <p className="text-xs text-red-600 mt-1" data-testid="dup-vin-error">Vehicle Already Exist</p>}
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Engine No (optional)</Label>
                    <Input value={newVehicle.engine_no} className="rounded-sm uppercase"
                      onChange={e => setNewVehicle(v => ({ ...v, engine_no: e.target.value.toUpperCase() }))}
                      data-testid="new-engine-no" />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="form-label">Vehicle Reception Time *</Label>
                  <Input type="datetime-local" value={receptionTime} onChange={e => setReceptionTime(e.target.value)} className="rounded-sm" data-testid="reception-time" />
                </div>
                <div>
                  <Label className="form-label">Source</Label>
                  <Select value={entrySource} onValueChange={setEntrySource}>
                    <SelectTrigger className="rounded-sm" data-testid="entry-source"><SelectValue /></SelectTrigger>
                    <SelectContent>{SOURCES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Validate Contact */}
          {step === 2 && (
            <div className="space-y-4 py-2" data-testid="wizard-step-2">
              <div>
                <Label className="form-label">Customer Type</Label>
                <Select value={customerType} onValueChange={setCustomerType}>
                  <SelectTrigger className="rounded-sm w-48" data-testid="customer-type"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Individual">Individual</SelectItem>
                    <SelectItem value="Company">Company</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {customerType === "Individual" ? (
                <div className="grid grid-cols-2 gap-3">
                  <FieldWithOld label="First Name *" value={contactData.first_name} oldValue={oldContactData?.first_name} onChange={v => setContactData(d => ({ ...d, first_name: v }))} testId="first-name" mask={maskValue} />
                  <FieldWithOld label="Last Name *" value={contactData.last_name} oldValue={oldContactData?.last_name} onChange={v => setContactData(d => ({ ...d, last_name: v }))} testId="last-name" mask={maskValue} />
                </div>
              ) : (
                <FieldWithOld label="Company Name *" value={contactData.company_name} oldValue={oldContactData?.company_name} onChange={v => setContactData(d => ({ ...d, company_name: v }))} testId="company-name" mask={maskValue} />
              )}

              <div className="grid grid-cols-2 gap-3">
                <FieldWithOld label="Contact No *" value={contactData.contact_no} oldValue={oldContactData?.contact_no} onChange={v => setContactData(d => ({ ...d, contact_no: v }))} testId="contact-no" mask={maskValue} />
                <FieldWithOld label="Alternate No" value={contactData.alternate_no} oldValue={oldContactData?.alternate_no} onChange={v => setContactData(d => ({ ...d, alternate_no: v }))} testId="alt-no" mask={maskValue} />
              </div>
              <FieldWithOld label="Email" value={contactData.email} oldValue={oldContactData?.email} onChange={v => setContactData(d => ({ ...d, email: v }))} testId="email" mask={maskValue} />

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <FieldWithOld label="Address" value={contactData.address} oldValue={oldContactData?.address} onChange={v => setContactData(d => ({ ...d, address: v }))} testId="address" mask={maskValue} />
                <FieldWithOld label="City" value={contactData.city} oldValue={oldContactData?.city} onChange={v => setContactData(d => ({ ...d, city: v }))} testId="city" mask={maskValue} />
                <FieldWithOld label="State" value={contactData.state} oldValue={oldContactData?.state} onChange={v => setContactData(d => ({ ...d, state: v }))} testId="state" mask={maskValue} />
                <FieldWithOld label="Pin" value={contactData.pin} oldValue={oldContactData?.pin} onChange={v => setContactData(d => ({ ...d, pin: v }))} testId="pin" mask={maskValue} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs">Date of Birth</Label><Input type="date" value={contactData.date_of_birth} onChange={e => setContactData(d => ({ ...d, date_of_birth: e.target.value }))} className="rounded-sm" /></div>
                <div><Label className="text-xs">Anniversary</Label><Input type="date" value={contactData.anniversary} onChange={e => setContactData(d => ({ ...d, anniversary: e.target.value }))} className="rounded-sm" /></div>
              </div>

              <div>
                <Label className="form-label">Driven By</Label>
                <RadioGroup value={contactData.driven_by} onValueChange={v => setContactData(d => ({ ...d, driven_by: v }))} className="flex gap-4 mt-1">
                  {["Owner", "User", "Driver"].map(o => (
                    <div key={o} className="flex items-center gap-1.5"><RadioGroupItem value={o} id={`driven-${o}`} /><Label htmlFor={`driven-${o}`} className="text-sm">{o}</Label></div>
                  ))}
                </RadioGroup>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="form-label">Preferred Contact Mode</Label>
                  <div className="flex flex-wrap gap-3 mt-1">
                    {["Phone", "SMS", "Email"].map(m => (
                      <label key={m} className="flex items-center gap-1.5 text-sm cursor-pointer">
                        <Checkbox checked={contactData.preferred_contact_mode.includes(m)} onCheckedChange={c => setContactData(d => ({ ...d, preferred_contact_mode: c ? [...d.preferred_contact_mode, m] : d.preferred_contact_mode.filter(x => x !== m) }))} />
                        {m}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="form-label">Preferred Contact Time</Label>
                  <div className="flex flex-wrap gap-3 mt-1">
                    {["Morning", "Afternoon", "Evening"].map(t => (
                      <label key={t} className="flex items-center gap-1.5 text-sm cursor-pointer">
                        <Checkbox checked={contactData.preferred_contact_time.includes(t)} onCheckedChange={c => setContactData(d => ({ ...d, preferred_contact_time: c ? [...d.preferred_contact_time, t] : d.preferred_contact_time.filter(x => x !== t) }))} />
                        {t}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Documents */}
          {step === 3 && (
            <div className="space-y-6 py-2" data-testid="wizard-step-3">
              <DocBlock
                title="Insurance Document"
                attached={docs.insurance_attached}
                notCollected={docs.insurance_not_collected}
                reason={docs.insurance_reason}
                onAttach={() => setDocs(d => ({ ...d, insurance_attached: !d.insurance_attached, insurance_not_collected: false }))}
                onNotCollected={v => setDocs(d => ({ ...d, insurance_not_collected: v, insurance_attached: false }))}
                onReasonChange={v => setDocs(d => ({ ...d, insurance_reason: v }))}
                testIdPrefix="ins"
              />
              <DocBlock
                title="Registration (RC) Document"
                attached={docs.rc_attached}
                notCollected={docs.rc_not_collected}
                reason={docs.rc_reason}
                onAttach={() => setDocs(d => ({ ...d, rc_attached: !d.rc_attached, rc_not_collected: false }))}
                onNotCollected={v => setDocs(d => ({ ...d, rc_not_collected: v, rc_attached: false }))}
                onReasonChange={v => setDocs(d => ({ ...d, rc_reason: v }))}
                testIdPrefix="rc"
              />
            </div>
          )}

          <DialogFooter className="flex justify-between gap-2 pt-2">
            <Button variant="outline" className="rounded-sm" disabled={step === 1} onClick={() => setStep(s => s - 1)} data-testid="wizard-back">
              <ChevronLeft className="w-4 h-4 mr-1" /> Back
            </Button>
            {step < 3 ? (
              <Button className="rounded-sm bg-black text-white hover:bg-gray-800" disabled={step === 1 && !canGoNext1} onClick={() => setStep(s => s + 1)} data-testid="wizard-next">
                Next <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button className="rounded-sm bg-black text-white hover:bg-gray-800" onClick={handleSave} data-testid="wizard-save">
                Save Entry
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Helper: Input field with old masked value
const FieldWithOld = ({ label, value, oldValue, onChange, testId, mask }) => (
  <div>
    <Label className="text-xs">{label}</Label>
    <Input value={value} onChange={e => onChange(e.target.value)} className="rounded-sm" data-testid={testId} />
    {oldValue && <p className="text-[10px] text-gray-400 mt-0.5 font-mono">{mask(oldValue)}</p>}
  </div>
);

// Helper: Document upload block
const DocBlock = ({ title, attached, notCollected, reason, onAttach, onNotCollected, onReasonChange, testIdPrefix }) => (
  <div className="p-4 border border-gray-200 rounded-sm space-y-3">
    <p className="text-sm font-bold">{title}</p>
    <div className="flex items-center gap-3">
      <Button variant={attached ? "default" : "outline"} size="sm" className="rounded-sm" onClick={onAttach} data-testid={`${testIdPrefix}-attach-btn`}>
        {attached ? <><FileCheck className="w-4 h-4 mr-1" /> Attached</> : <><Paperclip className="w-4 h-4 mr-1" /> Attach</>}
      </Button>
    </div>
    <label className="flex items-center gap-2 text-sm cursor-pointer">
      <Checkbox checked={notCollected} onCheckedChange={onNotCollected} data-testid={`${testIdPrefix}-not-collected`} />
      Not Collected
    </label>
    {notCollected && (
      <Input placeholder="Reason (optional)" value={reason} onChange={e => onReasonChange(e.target.value)} className="rounded-sm text-sm" data-testid={`${testIdPrefix}-reason`} />
    )}
  </div>
);
