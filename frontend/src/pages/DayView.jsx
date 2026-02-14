import { useState, useEffect, useCallback } from "react";
import { useAuth, API } from "@/App";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import { Filter, RefreshCw, Eye, SlidersHorizontal, GripVertical } from "lucide-react";

// Columns that can be hidden via Customize Columns
const CUSTOMIZABLE_IDS = ["mail_id", "docket_readiness", "n1", "cre_name"];

const DEFAULT_COLUMNS = [
  { id: "time", label: "Time" },
  { id: "source", label: "Source" },
  { id: "customer_name", label: "Customer Name" },
  { id: "phone", label: "Ph. No" },
  { id: "mail_id", label: "Mail ID" },
  { id: "reg_no", label: "Reg No" },
  { id: "model", label: "Model" },
  { id: "current_km", label: "Current KM" },
  { id: "ots", label: "OTS" },
  { id: "service_type", label: "Service Type" },
  { id: "sa_name", label: "SA Name" },
  { id: "docket_readiness", label: "Docket Readiness" },
  { id: "n1", label: "N-1" },
  { id: "status", label: "Status" },
  { id: "cre_name", label: "CRE Name" },
  { id: "lost_customer", label: "Lost Customer" },
  { id: "remarks", label: "Remarks" },
  { id: "actions", label: "" },
];

const DayView = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [rescheduledCancelled, setRescheduledCancelled] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    branch: "",
    status: "",
    outcome: "",
    cre: "",
    sa: "",
    source: "",
  });
  const [cres, setCres] = useState([]);
  const [hiddenCols, setHiddenCols] = useState([]);
  const [colOrder, setColOrder] = useState(DEFAULT_COLUMNS.map((c) => c.id));
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [rearrangeOpen, setRearrangeOpen] = useState(false);
  const [tempHidden, setTempHidden] = useState([]);
  const [tempOrder, setTempOrder] = useState([]);
  const [dragIdx, setDragIdx] = useState(null);

  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const todayDisplay = today.split("-").reverse().join("-");

  // Load column preferences
  useEffect(() => {
    const loadPrefs = async () => {
      try {
        const res = await axios.get(`${API}/user-preferences/today`, { withCredentials: true });
        if (res.data.hidden_columns?.length) setHiddenCols(res.data.hidden_columns);
        if (res.data.column_order?.length) setColOrder(res.data.column_order);
      } catch {}
    };
    loadPrefs();
  }, []);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const fetchData = async () => {
    try {
      const params = new URLSearchParams({ view: "day", date: today });
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const [apptsRes, settingsRes, cresRes] = await Promise.all([
        axios.get(`${API}/appointments?${params}`, { withCredentials: true }),
        axios.get(`${API}/settings`, { withCredentials: true }),
        axios.get(`${API}/users/cres`, { withCredentials: true }),
      ]);

      // Separate regular appointments from rescheduled/cancelled in N-1
      const regular = apptsRes.data.filter(apt => 
        !apt.rescheduled_in_n1 && !apt.cancelled_in_n1
      );
      const reschCanc = apptsRes.data.filter(apt => 
        apt.rescheduled_in_n1 || apt.cancelled_in_n1
      );

      // Sort by time ascending
      regular.sort((a, b) => (a.appointment_time || "").localeCompare(b.appointment_time || ""));
      reschCanc.sort((a, b) => (a.appointment_time || "").localeCompare(b.appointment_time || ""));

      setAppointments(regular);
      setRescheduledCancelled(reschCanc);
      setSettings(settingsRes.data);
      setCres(cresRes.data);
    } catch (error) {
      toast.error("Failed to load appointments");
    } finally {
      setLoading(false);
    }
  };

  const getSourceColor = () => "";

  // Save column preferences to backend
  const savePrefs = async (hidden, order) => {
    try {
      await axios.put(`${API}/user-preferences/today`,
        { hidden_columns: hidden, column_order: order },
        { withCredentials: true }
      );
    } catch {}
  };

  const handleSaveCustomize = () => {
    setHiddenCols(tempHidden);
    savePrefs(tempHidden, colOrder);
    setCustomizeOpen(false);
    toast.success("Column visibility saved");
  };

  const handleSaveRearrange = () => {
    setColOrder(tempOrder);
    savePrefs(hiddenCols, tempOrder);
    setRearrangeOpen(false);
    toast.success("Column order saved");
  };

  // Compute visible columns in order
  const visibleCols = colOrder
    .filter((id) => !hiddenCols.includes(id))
    .map((id) => DEFAULT_COLUMNS.find((c) => c.id === id))
    .filter(Boolean);

  // Cell renderer
  const renderCell = (colId, appt) => {
    switch (colId) {
      case "time":
        return <span className="text-sm font-medium">{appt.appointment_time}</span>;
      case "source":
        return <span className="text-sm">{appt.source}</span>;
      case "customer_name":
        return (
          <div className="flex items-center gap-2">
            <span className="font-medium">{appt.customer_name}</span>
            {appt.priority_customer && (
              <div className="w-5 h-5 bg-black text-white rounded-sm flex items-center justify-center text-xs font-bold shrink-0">P</div>
            )}
            {appt.is_rescheduled && (
              <div className="relative group">
                <div className="w-5 h-5 bg-amber-100 text-amber-800 rounded-sm flex items-center justify-center text-xs font-bold shrink-0 cursor-help">R</div>
                {appt.reschedule_history?.length > 0 && (
                  <div className="absolute left-0 top-full mt-1 z-50 hidden group-hover:block bg-white border border-gray-200 shadow-lg rounded-sm p-3 min-w-[220px]">
                    <p className="text-xs font-bold mb-1">Reschedule History</p>
                    {appt.reschedule_history.map((h, i) => (
                      <div key={i} className="text-xs text-gray-600 mb-1">
                        {h.from_date} → {h.to_date}
                        {h.remarks && <span className="text-gray-400 ml-1">({h.remarks})</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      case "phone":
        return <span className="text-sm">{appt.customer_phone}</span>;
      case "mail_id":
        return <span className="text-sm">{appt.customer_email || "-"}</span>;
      case "reg_no":
        return <span className="text-sm font-medium">{appt.vehicle_reg}</span>;
      case "model":
        return <span className="text-sm">{appt.vehicle_model}</span>;
      case "current_km":
        return <span className="text-sm">{appt.current_km || "-"}</span>;
      case "ots":
        return <span className="text-sm">{appt.ots ? "Yes" : "No"}</span>;
      case "service_type":
        return <Badge variant="outline" className="rounded-sm text-xs font-medium whitespace-nowrap">{appt.service_type}</Badge>;
      case "sa_name":
        return <span className="text-sm">{appt.allocated_sa}</span>;
      case "docket_readiness":
        return (
          <Badge className={`rounded-sm text-xs font-medium border-0 whitespace-nowrap ${appt.docket_readiness ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
            {appt.docket_readiness ? "Yes" : "No"}
          </Badge>
        );
      case "n1":
        return <span className="text-xs">{appt.n_minus_1_confirmation || "Pending"}</span>;
      case "status":
        return <span className="text-xs">{appt.appointment_day_outcome || appt.appointment_status || "Booked"}</span>;
      case "cre_name":
        return <span className="text-sm">{appt.cre_name}</span>;
      case "lost_customer":
        return (
          <Badge className={`rounded-sm text-xs font-medium border-0 whitespace-nowrap ${appt.lost_customer ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-800"}`}>
            {appt.lost_customer ? "Yes" : "No"}
          </Badge>
        );
      case "remarks":
        return appt.specific_repair ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-xs font-medium cursor-help underline decoration-dotted">Yes</span>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs"><p className="text-sm">{appt.specific_repair}</p></TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : <span className="text-xs text-gray-400">No</span>;
      case "actions":
        return (
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-sm" onClick={() => navigate(`/appointments/${appt.appointment_id}`)} data-testid={`action-btn-${appt.appointment_id}`}>
            <Eye className="w-4 h-4" strokeWidth={1.5} />
          </Button>
        );
      default:
        return null;
    }
  };

  const AppointmentTable = ({ appointments, showEmpty = true }) => (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="table-header bg-gray-50">
            {visibleCols.map((col) => (
              <TableHead key={col.id} className={`text-xs font-bold uppercase whitespace-nowrap text-center${col.id === "actions" ? " w-12" : ""}`}>
                {col.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {appointments.length === 0 && showEmpty ? (
            <TableRow>
              <TableCell colSpan={visibleCols.length} className="text-center text-gray-400 py-8">
                No appointments
              </TableCell>
            </TableRow>
          ) : (
            appointments.map((appt) => (
              <TableRow key={appt.appointment_id} className="hover:bg-gray-50">
                {visibleCols.map((col) => (
                  <TableCell key={col.id} className={`whitespace-nowrap text-center${col.id === "customer_name" ? " text-left" : ""}`}>
                    {renderCell(col.id, appt)}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="day-view-page">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-heading font-black text-3xl md:text-4xl tracking-tighter uppercase">
            Today
          </h1>
          <p className="text-sm text-gray-500 font-mono mt-1">{todayDisplay}</p>
        </div>
        <Button
          variant="outline"
          size="icon"
          className="rounded-sm"
          onClick={fetchData}
          data-testid="refresh-btn"
        >
          <RefreshCw className="w-4 h-4" strokeWidth={1.5} />
        </Button>
      </div>

      {/* Filters */}
      <Card className="border border-gray-200 rounded-sm shadow-none">
        <div className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-4 h-4 text-gray-500" strokeWidth={1.5} />
            <span className="text-xs font-mono uppercase tracking-wider text-gray-500">
              Filters
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            <Select
              value={filters.branch}
              onValueChange={(v) => setFilters({ ...filters, branch: v === "all" ? "" : v })}
            >
              <SelectTrigger className="rounded-sm h-9 text-sm">
                <SelectValue placeholder="Branch" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Branches</SelectItem>
                {settings?.branches?.map((b) => (
                  <SelectItem key={b} value={b}>{b}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.status}
              onValueChange={(v) => setFilters({ ...filters, status: v === "all" ? "" : v })}
            >
              <SelectTrigger className="rounded-sm h-9 text-sm">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {settings?.appointment_statuses?.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.outcome}
              onValueChange={(v) => setFilters({ ...filters, outcome: v === "all" ? "" : v })}
            >
              <SelectTrigger className="rounded-sm h-9 text-sm">
                <SelectValue placeholder="Outcome" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Outcomes</SelectItem>
                {settings?.appointment_day_outcomes?.map((o) => (
                  <SelectItem key={o} value={o}>{o}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.source}
              onValueChange={(v) => setFilters({ ...filters, source: v === "all" ? "" : v })}
            >
              <SelectTrigger className="rounded-sm h-9 text-sm">
                <SelectValue placeholder="Source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                {settings?.sources?.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.sa}
              onValueChange={(v) => setFilters({ ...filters, sa: v === "all" ? "" : v })}
            >
              <SelectTrigger className="rounded-sm h-9 text-sm">
                <SelectValue placeholder="SA" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All SAs</SelectItem>
                {settings?.service_advisors?.map((sa) => (
                  <SelectItem key={sa} value={sa}>{sa}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.cre}
              onValueChange={(v) => setFilters({ ...filters, cre: v === "all" ? "" : v })}
            >
              <SelectTrigger className="rounded-sm h-9 text-sm">
                <SelectValue placeholder="CRE" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All CREs</SelectItem>
                {cres.map((c) => (
                  <SelectItem key={c.user_id} value={c.user_id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Main Today Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600 font-medium">
            {appointments.length} appointment{appointments.length !== 1 ? 's' : ''}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="rounded-sm h-8 text-xs gap-1.5"
              data-testid="customize-columns-btn"
              onClick={() => { setTempHidden([...hiddenCols]); setCustomizeOpen(true); }}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" strokeWidth={1.5} />
              Customize Columns
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="rounded-sm h-8 text-xs gap-1.5"
              data-testid="rearrange-columns-btn"
              onClick={() => {
                setTempOrder(colOrder.filter((id) => !hiddenCols.includes(id)));
                setRearrangeOpen(true);
              }}
            >
              <GripVertical className="w-3.5 h-3.5" strokeWidth={1.5} />
              Rearrange Columns
            </Button>
          </div>
        </div>
        <Card className="border border-gray-200 rounded-sm shadow-none overflow-hidden">
          <AppointmentTable appointments={appointments} />
        </Card>
      </div>

      {/* Rescheduled / Cancelled in N-1 Section */}
      {rescheduledCancelled.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-heading font-bold text-xl tracking-tight uppercase">
            Rescheduled / Cancelled in N-1
          </h2>
          <div className="text-sm text-gray-600 font-medium">
            {rescheduledCancelled.length} appointment{rescheduledCancelled.length !== 1 ? 's' : ''}
          </div>
          <Card className="border border-gray-200 rounded-sm shadow-none overflow-hidden">
            <AppointmentTable appointments={rescheduledCancelled} showEmpty={false} />
          </Card>
        </div>
      )}

      {/* Customize Columns Modal */}
      <Dialog open={customizeOpen} onOpenChange={setCustomizeOpen}>
        <DialogContent className="sm:max-w-md" data-testid="customize-columns-modal">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold uppercase tracking-tight">Customize Columns</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {CUSTOMIZABLE_IDS.map((id) => {
              const col = DEFAULT_COLUMNS.find((c) => c.id === id);
              return (
                <label key={id} className="flex items-center gap-3 cursor-pointer" data-testid={`toggle-col-${id}`}>
                  <input
                    type="checkbox"
                    checked={!tempHidden.includes(id)}
                    onChange={() => setTempHidden((prev) =>
                      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
                    )}
                    className="h-4 w-4 rounded border-gray-300 accent-black"
                  />
                  <span className="text-sm font-medium">{col?.label}</span>
                </label>
              );
            })}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" className="rounded-sm" onClick={() => setCustomizeOpen(false)} data-testid="customize-cancel-btn">Cancel</Button>
            <Button size="sm" className="rounded-sm bg-black text-white hover:bg-gray-800" onClick={handleSaveCustomize} data-testid="customize-save-btn">Save</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Rearrange Columns Modal */}
      <Dialog open={rearrangeOpen} onOpenChange={setRearrangeOpen}>
        <DialogContent className="sm:max-w-md" data-testid="rearrange-columns-modal">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold uppercase tracking-tight">Rearrange Columns</DialogTitle>
          </DialogHeader>
          <div className="space-y-1 py-2 max-h-[400px] overflow-y-auto">
            {tempOrder.map((id, idx) => {
              const col = DEFAULT_COLUMNS.find((c) => c.id === id);
              if (!col) return null;
              return (
                <div
                  key={id}
                  className={`flex items-center gap-3 p-2.5 rounded-sm border cursor-grab active:cursor-grabbing select-none ${dragIdx === idx ? "border-black bg-gray-100" : "border-gray-200 bg-white"}`}
                  draggable
                  onDragStart={() => setDragIdx(idx)}
                  onDragOver={(e) => { e.preventDefault(); }}
                  onDrop={() => {
                    if (dragIdx === null || dragIdx === idx) return;
                    const copy = [...tempOrder];
                    const [moved] = copy.splice(dragIdx, 1);
                    copy.splice(idx, 0, moved);
                    setTempOrder(copy);
                    setDragIdx(null);
                  }}
                  onDragEnd={() => setDragIdx(null)}
                  data-testid={`drag-col-${id}`}
                >
                  <GripVertical className="w-4 h-4 text-gray-400 shrink-0" strokeWidth={1.5} />
                  <span className="text-sm font-medium">{col.label || "Actions"}</span>
                </div>
              );
            })}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" className="rounded-sm" onClick={() => setRearrangeOpen(false)} data-testid="rearrange-cancel-btn">Cancel</Button>
            <Button size="sm" className="rounded-sm bg-black text-white hover:bg-gray-800" onClick={handleSaveRearrange} data-testid="rearrange-save-btn">Save</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DayView;
