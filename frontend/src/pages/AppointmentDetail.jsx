import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth, API } from "@/App";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { StatusSidebar } from "@/components/StatusSidebar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  ArrowLeft,
  Save,
  Pencil,
  MessageCircle,
  User,
  Car,
  Calendar,
  Clock,
  History,
  Edit2,
  CheckCircle,
  Circle,
  XCircle,
} from "lucide-react";

const AppointmentDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [appointment, setAppointment] = useState(null);
  const [activityLogs, setActivityLogs] = useState([]);
  const [settings, setSettings] = useState(null);
  const [cres, setCres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({});
  const [branches, setBranches] = useState([]);

  const today = new Date().toISOString().split("T")[0];
  const tomorrow = (() => {
    const d = new Date(); d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  })();

  useEffect(() => {
    fetchData();
  }, [id]);

  // Auto-enable edit mode when navigated with ?edit=true
  useEffect(() => {
    if (searchParams.get("edit") === "true") {
      setEditMode(true);
    }
  }, [searchParams]);

  const fetchData = async () => {
    try {
      const [apptRes, logsRes, settingsRes, cresRes, branchesRes] = await Promise.all([
        axios.get(`${API}/appointments/${id}`, { withCredentials: true }),
        axios.get(`${API}/appointments/${id}/activity`, { withCredentials: true }),
        axios.get(`${API}/settings`, { withCredentials: true }),
        axios.get(`${API}/users/cres`, { withCredentials: true }),
        axios.get(`${API}/branches`, { withCredentials: true }),
      ]);

      setAppointment(apptRes.data);
      setFormData(apptRes.data);
      setActivityLogs(logsRes.data);
      setSettings(settingsRes.data);
      setCres(cresRes.data);
      setBranches(branchesRes.data || []);
    } catch (error) {
      toast.error("Failed to load appointment");
      navigate("/day");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updateData = {};
      
      // Only include changed fields
      Object.keys(formData).forEach((key) => {
        if (formData[key] !== appointment[key]) {
          updateData[key] = formData[key];
        }
      });

      if (Object.keys(updateData).length === 0) {
        toast.info("No changes to save");
        setEditMode(false);
        setSaving(false);
        return;
      }

      await axios.put(`${API}/appointments/${id}`, updateData, {
        withCredentials: true,
      });

      toast.success("Appointment updated");
      setEditMode(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  const handleQuickUpdate = async (field, value) => {
    try {
      await axios.put(`${API}/appointments/${id}`, { [field]: value }, {
        withCredentials: true,
      });
      toast.success("Updated successfully");
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Update failed");
    }
  };

  // Permission checks
  const canEdit = () => {
    if (user?.role === "CRM") return true;
    if (user?.role === "DP") return true;
    if (user?.role === "CRE" && appointment?.assigned_cre_user === user?.user_id) return true;
    if (user?.role === "Receptionist") return true;
    return false;
  };

  const canEditOutcome = () => {
    if (user?.role === "CRM") return true;
    if (user?.role === "Receptionist" && appointment?.appointment_date === today) return true;
    return false;
  };

  const canEditN1 = () => {
    if (user?.role === "CRM") return true;
    if (user?.role === "CRE" && appointment?.assigned_cre_user === user?.user_id) return true;
    return false;
  };

  const canReassign = () => {
    return user?.role === "CRM";
  };

  const isAppointmentDay = appointment?.appointment_date === today;

  const getStatusIcon = (status) => {
    switch (status) {
      case "Confirmed":
        return <CheckCircle className="w-4 h-4" strokeWidth={1.5} />;
      case "Closed":
        return <XCircle className="w-4 h-4" strokeWidth={1.5} />;
      default:
        return <Circle className="w-4 h-4" strokeWidth={1.5} />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!appointment) return null;

  return (
    <div className="max-w-5xl mx-auto space-y-6" data-testid="appointment-detail-page">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
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
            <h1 className="font-heading font-black text-2xl md:text-3xl tracking-tighter uppercase">
              {appointment.customer_name}
            </h1>
            <div className="flex items-center gap-3 mt-1">
              <span className="font-mono text-sm text-gray-500">{appointment.booking_id || `#${appointment.sl_no}`}</span>
              <Badge
                className={`rounded-sm text-xs ${
                  appointment.appointment_status === "Confirmed"
                    ? "bg-black text-white"
                    : appointment.appointment_status === "Closed"
                    ? "bg-gray-100 text-black border border-black"
                    : "bg-white text-black border border-dashed border-black"
                }`}
              >
                {getStatusIcon(appointment.appointment_status)}
                <span className="ml-1">{appointment.appointment_status}</span>
              </Badge>
              {appointment.priority_customer && (
                <Badge className="bg-black text-white rounded-sm text-xs">PRIORITY</Badge>
              )}
              {appointment.is_rescheduled && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Badge className="bg-amber-100 text-amber-800 rounded-sm text-xs">[R]</Badge>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-[280px]">
                      <p className="font-bold text-xs mb-1">Reschedule History</p>
                      {(appointment.reschedule_history || []).map((h, i) => (
                        <p key={i} className="text-xs">{h.from_date} → {h.to_date}{h.remarks ? ` (${h.remarks})` : ""}</p>
                      ))}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {canEdit() && (
            <Button
              variant="outline"
              size="icon"
              className="rounded-sm"
              onClick={() => editMode ? handleSave() : setEditMode(true)}
              disabled={saving}
              data-testid="edit-icon-btn"
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
              ) : editMode ? (
                <Save className="w-4 h-4" strokeWidth={1.5} />
              ) : (
                <Pencil className="w-4 h-4" strokeWidth={1.5} />
              )}
            </Button>
          )}
          <Button
            variant="outline"
            size="icon"
            className="rounded-sm"
            onClick={() => window.open(`https://wa.me/91${appointment.customer_phone}`)}
            data-testid="whatsapp-btn"
          >
            <MessageCircle className="w-4 h-4" strokeWidth={1.5} />
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Appointment Details */}
          <Card className="border border-gray-200 rounded-sm shadow-none">
            <CardHeader className="border-b border-gray-100 pb-4">
              <CardTitle className="font-heading font-bold text-lg tracking-tight uppercase flex items-center gap-2">
                <Calendar className="w-5 h-5" strokeWidth={1.5} />
                Appointment Details
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <Label className="form-label">Date</Label>
                  {editMode ? (
                    <Input
                      type="date"
                      value={formData.appointment_date}
                      onChange={(e) => setFormData({ ...formData, appointment_date: e.target.value })}
                      className="rounded-sm font-mono"
                    />
                  ) : (
                    <p className="font-mono text-lg">{appointment.appointment_date}</p>
                  )}
                </div>
                <div>
                  <Label className="form-label">Time</Label>
                  {editMode ? (
                    <Input
                      type="time"
                      value={formData.appointment_time}
                      onChange={(e) => setFormData({ ...formData, appointment_time: e.target.value })}
                      className="rounded-sm font-mono"
                    />
                  ) : (
                    <p className="font-mono text-lg font-bold">{appointment.appointment_time}</p>
                  )}
                </div>
                <div>
                  <Label className="form-label">Branch</Label>
                  {editMode ? (
                    <Select
                      value={formData.branch}
                      onValueChange={(v) => setFormData({ ...formData, branch: v })}
                    >
                      <SelectTrigger className="rounded-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {branches.map((b) => (
                          <SelectItem key={b.branch_id || b.location} value={b.location}>{b.location}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-sm">{appointment.branch}</p>
                  )}
                </div>
                <div>
                  <Label className="form-label">Source</Label>
                  {editMode ? (
                    <Select
                      value={formData.source}
                      onValueChange={(v) => setFormData({ ...formData, source: v })}
                    >
                      <SelectTrigger className="rounded-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {settings?.sources?.map((s) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-sm mt-1" data-testid="source-value">{appointment.source || "-"}</p>
                  )}
                </div>
                <div>
                  <Label className="form-label">Service Type</Label>
                  {editMode ? (
                    <Select
                      value={formData.service_type}
                      onValueChange={(v) => setFormData({ ...formData, service_type: v })}
                    >
                      <SelectTrigger className="rounded-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {settings?.service_types?.map((t) => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-sm font-mono mt-1" data-testid="service-type-value">{appointment.service_type || "-"}</p>
                  )}
                </div>
                <div>
                  <Label className="form-label">Service Advisor</Label>
                  {editMode || (canEditOutcome() && isAppointmentDay) ? (
                    <Select
                      value={formData.allocated_sa || ""}
                      onValueChange={(v) => {
                        if (editMode) {
                          setFormData({ ...formData, allocated_sa: v });
                        } else {
                          handleQuickUpdate("allocated_sa", v);
                        }
                      }}
                    >
                      <SelectTrigger className="rounded-sm">
                        <SelectValue placeholder="Assign SA" />
                      </SelectTrigger>
                      <SelectContent>
                        {settings?.service_advisors?.map((sa) => (
                          <SelectItem key={sa} value={sa}>{sa}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-sm">{appointment.allocated_sa || "-"}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Customer Info */}
          <Card className="border border-gray-200 rounded-sm shadow-none">
            <CardHeader className="border-b border-gray-100 pb-4">
              <CardTitle className="font-heading font-bold text-lg tracking-tight uppercase flex items-center gap-2">
                <User className="w-5 h-5" strokeWidth={1.5} />
                Customer
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label className="form-label">Name</Label>
                  {editMode ? (
                    <Input
                      value={formData.customer_name}
                      onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                      className="rounded-sm"
                    />
                  ) : (
                    <p className="font-medium">{appointment.customer_name}</p>
                  )}
                </div>
                <div>
                  <Label className="form-label">Phone</Label>
                  {editMode ? (
                    <Input
                      value={formData.customer_phone}
                      onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                      className="rounded-sm font-mono"
                    />
                  ) : (
                    <p className="font-mono">{appointment.customer_phone}</p>
                  )}
                </div>
                <div className="md:col-span-2">
                  <Label className="form-label">Email</Label>
                  {editMode ? (
                    <Input
                      type="email"
                      value={formData.customer_email || ""}
                      onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
                      className="rounded-sm"
                    />
                  ) : (
                    <p className="text-sm">{appointment.customer_email || "-"}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Vehicle Info */}
          <Card className="border border-gray-200 rounded-sm shadow-none">
            <CardHeader className="border-b border-gray-100 pb-4">
              <CardTitle className="font-heading font-bold text-lg tracking-tight uppercase flex items-center gap-2">
                <Car className="w-5 h-5" strokeWidth={1.5} />
                Vehicle
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <Label className="form-label">Registration</Label>
                  {editMode ? (
                    <Input
                      value={formData.vehicle_reg_no || ""}
                      onChange={(e) => setFormData({ ...formData, vehicle_reg_no: e.target.value.toUpperCase() })}
                      className="rounded-sm font-mono uppercase"
                    />
                  ) : (
                    <p className="font-mono font-bold">{appointment.vehicle_reg_no || "-"}</p>
                  )}
                </div>
                <div>
                  <Label className="form-label">Model</Label>
                  {editMode ? (
                    <Input
                      value={formData.model || ""}
                      onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                      className="rounded-sm"
                    />
                  ) : (
                    <p>{appointment.model || "-"}</p>
                  )}
                </div>
                <div>
                  <Label className="form-label">Current KM</Label>
                  {editMode ? (
                    <Input
                      type="number"
                      value={formData.current_km || ""}
                      onChange={(e) => setFormData({ ...formData, current_km: parseInt(e.target.value) || null })}
                      className="rounded-sm font-mono"
                    />
                  ) : (
                    <p className="font-mono">{appointment.current_km || "-"}</p>
                  )}
                </div>
              </div>
              
              {appointment.specific_repair_request && (
                <div className="mt-6">
                  <Label className="form-label">Repair Request</Label>
                  {editMode ? (
                    <Textarea
                      value={formData.specific_repair_request || ""}
                      onChange={(e) => setFormData({ ...formData, specific_repair_request: e.target.value })}
                      className="rounded-sm"
                    />
                  ) : (
                    <p className="text-sm mt-2 p-3 bg-gray-50 border border-gray-100 rounded-sm">
                      {appointment.specific_repair_request}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <StatusSidebar
            appointment={appointment}
            editMode={editMode}
            canEdit={canEdit()}
            formData={formData}
            setFormData={setFormData}
            settings={settings}
            tomorrow={tomorrow}
          />

          {/* Assigned CRE */}
          {canReassign() && (
            <Card className="border border-gray-200 rounded-sm shadow-none">
              <CardContent className="p-6">
                <Label className="form-label">Assigned CRE</Label>
                <Select
                  value={appointment.assigned_cre_user}
                  onValueChange={(v) => handleQuickUpdate("assigned_cre_user", v)}
                >
                  <SelectTrigger className="rounded-sm mt-1" data-testid="cre-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {cres.map((c) => (
                      <SelectItem key={c.user_id} value={c.user_id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          )}

          {/* Activity Log */}
          <Card className="border border-gray-200 rounded-sm shadow-none">
            <CardHeader className="border-b border-gray-100 pb-4">
              <CardTitle className="font-heading font-bold text-lg tracking-tight uppercase flex items-center gap-2">
                <History className="w-5 h-5" strokeWidth={1.5} />
                Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {activityLogs.length === 0 ? (
                <div className="p-6 text-center text-gray-500 text-sm">
                  No activity yet
                </div>
              ) : (
                <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
                  {activityLogs.map((log) => (
                    <div key={log.log_id} className="p-4" data-testid={`log-${log.log_id}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{log.user_name}</p>
                          <p className="text-xs text-gray-500">{log.action}</p>
                          {log.field_changed && (
                            <p className="text-xs text-gray-400 mt-1">
                              {log.old_value} → {log.new_value}
                            </p>
                          )}
                        </div>
                        <span className="text-[10px] font-mono text-gray-400 whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AppointmentDetail;
