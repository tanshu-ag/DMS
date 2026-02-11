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
const CUSTOMIZABLE_IDS = ["mail_id", "docket_readiness", "n1", "status", "cre_name"];

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

  const updateOutcome = async (appointmentId, outcome) => {
    try {
      await axios.put(`${API}/appointments/${appointmentId}`,
        { appointment_day_outcome: outcome },
        { withCredentials: true }
      );
      const up = (list) => list.map(a =>
        a.appointment_id === appointmentId ? { ...a, appointment_day_outcome: outcome } : a
      );
      setAppointments(up);
      setRescheduledCancelled(up);
      toast.success("Status updated");
    } catch {
      toast.error("Failed to update status");
    }
  };

  const AppointmentTable = ({ appointments, showEmpty = true }) => (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="table-header bg-gray-50">
            <TableHead className="text-xs font-bold uppercase whitespace-nowrap text-center">Time</TableHead>
            <TableHead className="text-xs font-bold uppercase whitespace-nowrap text-center">Source</TableHead>
            <TableHead className="text-xs font-bold uppercase whitespace-nowrap text-center">Customer Name</TableHead>
            <TableHead className="text-xs font-bold uppercase whitespace-nowrap text-center">PH. No</TableHead>
            <TableHead className="text-xs font-bold uppercase whitespace-nowrap text-center">Mail ID</TableHead>
            <TableHead className="text-xs font-bold uppercase whitespace-nowrap text-center">Reg No</TableHead>
            <TableHead className="text-xs font-bold uppercase whitespace-nowrap text-center">Model</TableHead>
            <TableHead className="text-xs font-bold uppercase whitespace-nowrap text-center">Current KM</TableHead>
            <TableHead className="text-xs font-bold uppercase whitespace-nowrap text-center">OTS</TableHead>
            <TableHead className="text-xs font-bold uppercase whitespace-nowrap text-center">Service Type</TableHead>
            <TableHead className="text-xs font-bold uppercase whitespace-nowrap text-center">SA Name</TableHead>
            <TableHead className="text-xs font-bold uppercase whitespace-nowrap text-center">Docket Readiness</TableHead>
            <TableHead className="text-xs font-bold uppercase whitespace-nowrap text-center">N-1</TableHead>
            <TableHead className="text-xs font-bold uppercase whitespace-nowrap text-center">Status</TableHead>
            <TableHead className="text-xs font-bold uppercase whitespace-nowrap text-center">CRE Name</TableHead>
            <TableHead className="text-xs font-bold uppercase whitespace-nowrap text-center">Lost Customer</TableHead>
            <TableHead className="text-xs font-bold uppercase whitespace-nowrap text-center">Remarks</TableHead>
            <TableHead className="text-xs font-bold uppercase whitespace-nowrap text-center w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {appointments.length === 0 && showEmpty ? (
            <TableRow>
              <TableCell colSpan={18} className="text-center text-gray-400 py-8">
                No appointments
              </TableCell>
            </TableRow>
          ) : (
            appointments.map((appt) => (
              <TableRow
                key={appt.appointment_id}
                className="hover:bg-gray-50"
              >
                <TableCell className="text-sm font-medium whitespace-nowrap text-center">
                  {appt.appointment_time}
                </TableCell>
                <TableCell className="text-sm whitespace-nowrap text-center">
                  {appt.source}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{appt.customer_name}</span>
                    {appt.priority_customer && (
                      <div className="w-5 h-5 bg-black text-white rounded-sm flex items-center justify-center text-xs font-bold">
                        P
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-sm whitespace-nowrap text-center">
                  {appt.customer_phone}
                </TableCell>
                <TableCell className="text-sm whitespace-nowrap text-center">
                  {appt.customer_email || "-"}
                </TableCell>
                <TableCell className="text-sm font-medium whitespace-nowrap text-center">
                  {appt.vehicle_reg}
                </TableCell>
                <TableCell className="text-sm whitespace-nowrap text-center">
                  {appt.vehicle_model}
                </TableCell>
                <TableCell className="text-sm whitespace-nowrap text-center">
                  {appt.current_km || "-"}
                </TableCell>
                <TableCell className="text-sm whitespace-nowrap text-center">
                  {appt.ots ? "Yes" : "No"}
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant="outline" className="rounded-sm text-xs font-medium whitespace-nowrap">
                    {appt.service_type}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm whitespace-nowrap text-center">
                  {appt.allocated_sa}
                </TableCell>
                <TableCell className="text-center">
                  <Badge 
                    className={`rounded-sm text-xs font-medium border-0 whitespace-nowrap ${
                      appt.docket_readiness ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                    }`}
                  >
                    {appt.docket_readiness ? "Yes" : "No"}
                  </Badge>
                </TableCell>
                <TableCell className="whitespace-nowrap text-center">
                  <span className="text-xs">{appt.n_minus_1_confirmation || "Pending"}</span>
                </TableCell>
                <TableCell className="whitespace-nowrap text-center">
                  <Select
                    value={appt.appointment_day_outcome || ""}
                    onValueChange={(v) => updateOutcome(appt.appointment_id, v)}
                  >
                    <SelectTrigger className="h-7 w-[120px] rounded-sm text-xs mx-auto" data-testid={`status-select-${appt.appointment_id}`}>
                      <SelectValue>
                        <span className="text-xs">{appt.appointment_day_outcome || appt.appointment_status || "Booked"}</span>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {settings?.appointment_day_outcomes?.map((opt) => (
                        <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="text-sm whitespace-nowrap text-center">
                  {appt.cre_name}
                </TableCell>
                <TableCell className="text-center">
                  <Badge 
                    className={`rounded-sm text-xs font-medium border-0 whitespace-nowrap ${
                      appt.lost_customer ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {appt.lost_customer ? "Yes" : "No"}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  {appt.specific_repair ? (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="text-xs font-medium cursor-help underline decoration-dotted">
                            Yes
                          </span>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p className="text-sm">{appt.specific_repair}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ) : (
                    <span className="text-xs text-gray-400">No</span>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-sm"
                    onClick={() => navigate(`/appointments/${appt.appointment_id}`)}
                    data-testid={`action-btn-${appt.appointment_id}`}
                  >
                    <Eye className="w-4 h-4" strokeWidth={1.5} />
                  </Button>
                </TableCell>
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
        <div className="text-sm text-gray-600 font-medium">
          {appointments.length} appointment{appointments.length !== 1 ? 's' : ''}
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
    </div>
  );
};

export default DayView;
