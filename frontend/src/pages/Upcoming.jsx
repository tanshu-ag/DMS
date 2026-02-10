import { useState, useEffect } from "react";
import { useAuth, API } from "@/App";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Filter, RefreshCw } from "lucide-react";

const Upcoming = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cres, setCres] = useState([]);
  const [filters, setFilters] = useState({
    branch: "",
    status: "",
    outcome: "",
    cre: "",
    sa: "",
    source: "",
  });

  useEffect(() => {
    fetchData();
  }, [filters]);

  const fetchData = async () => {
    try {
      const params = new URLSearchParams({ view: "upcoming" });
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const [apptsRes, settingsRes, cresRes] = await Promise.all([
        axios.get(`${API}/appointments?${params}`, { withCredentials: true }),
        axios.get(`${API}/settings`, { withCredentials: true }),
        axios.get(`${API}/users/cres`, { withCredentials: true }),
      ]);

      setAppointments(apptsRes.data);
      setSettings(settingsRes.data);
      setCres(cresRes.data);
    } catch (error) {
      toast.error("Failed to load upcoming appointments");
    } finally {
      setLoading(false);
    }
  };

  const getSourceColor = (source) => {
    const colors = {
      SDR: "bg-blue-100 text-blue-800",
      "Incoming Call": "bg-green-100 text-green-800",
      MYR: "bg-purple-100 text-purple-800",
      Other: "bg-gray-100 text-gray-800",
    };
    return colors[source] || "bg-gray-100 text-gray-800";
  };

  const formatDateHeading = (dateStr) => {
    const date = new Date(dateStr + "T00:00:00");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const target = new Date(dateStr + "T00:00:00");

    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    const formatted = `${day}-${month}-${year}`;

    if (target.getTime() === tomorrow.getTime()) {
      return `${formatted} (Tomorrow)`;
    }
    return `${formatted} (${dayNames[date.getDay()]})`;
  };

  // Group appointments by date
  const groupedByDate = appointments.reduce((acc, appt) => {
    const date = appt.appointment_date;
    if (!acc[date]) acc[date] = [];
    acc[date].push(appt);
    return acc;
  }, {});

  const sortedDates = Object.keys(groupedByDate).sort();

  const AppointmentTable = ({ appointments }) => (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="table-header bg-gray-50">
            <TableHead className="text-xs font-bold uppercase whitespace-nowrap">Time</TableHead>
            <TableHead className="text-xs font-bold uppercase whitespace-nowrap">Source</TableHead>
            <TableHead className="text-xs font-bold uppercase whitespace-nowrap">Customer Name</TableHead>
            <TableHead className="text-xs font-bold uppercase whitespace-nowrap">Ph. No</TableHead>
            <TableHead className="text-xs font-bold uppercase whitespace-nowrap">Mail ID</TableHead>
            <TableHead className="text-xs font-bold uppercase whitespace-nowrap">Veh Reg No</TableHead>
            <TableHead className="text-xs font-bold uppercase whitespace-nowrap">Model</TableHead>
            <TableHead className="text-xs font-bold uppercase whitespace-nowrap">Current KM</TableHead>
            <TableHead className="text-xs font-bold uppercase whitespace-nowrap">OTS No</TableHead>
            <TableHead className="text-xs font-bold uppercase whitespace-nowrap">Type of Service</TableHead>
            <TableHead className="text-xs font-bold uppercase whitespace-nowrap">Allocated SA Name</TableHead>
            <TableHead className="text-xs font-bold uppercase whitespace-nowrap">Remarks</TableHead>
            <TableHead className="text-xs font-bold uppercase whitespace-nowrap">Status</TableHead>
            <TableHead className="text-xs font-bold uppercase whitespace-nowrap">Docket Readiness</TableHead>
            <TableHead className="text-xs font-bold uppercase whitespace-nowrap">CRE Name</TableHead>
            <TableHead className="text-xs font-bold uppercase whitespace-nowrap">Lost Customer</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {appointments.map((appt) => (
            <TableRow key={appt.appointment_id} className="hover:bg-gray-50">
              <TableCell className="text-sm font-medium whitespace-nowrap">
                {appt.appointment_time}
              </TableCell>
              <TableCell>
                <Badge className={`${getSourceColor(appt.source)} rounded-sm text-xs font-medium border-0`}>
                  {appt.source}
                </Badge>
              </TableCell>
              <TableCell className="whitespace-nowrap">
                <div className="flex items-center gap-2">
                  {appt.priority_customer && (
                    <div className="w-5 h-5 bg-black text-white rounded-sm flex items-center justify-center text-xs font-bold">
                      P
                    </div>
                  )}
                  <span className="font-medium">{appt.customer_name}</span>
                </div>
              </TableCell>
              <TableCell className="text-sm font-mono whitespace-nowrap">
                {appt.customer_phone}
              </TableCell>
              <TableCell className="text-sm whitespace-nowrap">
                {appt.customer_email || "-"}
              </TableCell>
              <TableCell className="text-sm font-medium whitespace-nowrap">
                {appt.vehicle_reg}
              </TableCell>
              <TableCell className="text-sm whitespace-nowrap">
                {appt.vehicle_model}
              </TableCell>
              <TableCell className="text-sm whitespace-nowrap">
                {appt.current_km || "-"}
              </TableCell>
              <TableCell className="text-sm whitespace-nowrap">
                {appt.ots ? "Yes" : "No"}
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="rounded-sm text-xs font-medium whitespace-nowrap">
                  {appt.service_type}
                </Badge>
              </TableCell>
              <TableCell className="text-sm whitespace-nowrap">
                {appt.allocated_sa}
              </TableCell>
              <TableCell>
                {appt.specific_repair ? (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="text-xs font-medium cursor-help underline decoration-dotted" data-testid={`remarks-tooltip-${appt.appointment_id}`}>
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
              <TableCell className="whitespace-nowrap">
                <div className="text-xs space-y-0.5">
                  <div>
                    <span className="font-medium">N-1:</span> {appt.n_minus_1_confirmation || "Pending"}
                  </div>
                  <div>
                    <span className="font-medium">UP:</span> {appt.upcoming_status || "Scheduled"}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge
                  className={`rounded-sm text-xs font-medium border-0 whitespace-nowrap ${
                    appt.docket_readiness ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                  }`}
                >
                  {appt.docket_readiness ? "Yes" : "No"}
                </Badge>
              </TableCell>
              <TableCell className="text-sm whitespace-nowrap">
                {appt.cre_name}
              </TableCell>
              <TableCell>
                <Badge
                  className={`rounded-sm text-xs font-medium border-0 whitespace-nowrap ${
                    appt.lost_customer ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {appt.lost_customer ? "Yes" : "No"}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
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
    <div className="space-y-6" data-testid="upcoming-page">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-heading font-black text-3xl md:text-4xl tracking-tighter uppercase">
            Upcoming
          </h1>
          <p className="text-sm text-gray-500 font-mono mt-1">
            Future scheduled appointments
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="rounded-sm"
            onClick={fetchData}
            data-testid="upcoming-refresh-btn"
          >
            <RefreshCw className="w-4 h-4" strokeWidth={1.5} />
          </Button>
          <Button
            onClick={() => navigate("/new-appointment")}
            className="bg-black text-white hover:bg-gray-800 rounded-sm font-mono text-xs uppercase tracking-wider"
            data-testid="new-appointment-btn"
          >
            New Appointment
          </Button>
        </div>
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
              <SelectTrigger className="rounded-sm h-9 text-sm" data-testid="upcoming-filter-branch">
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
              <SelectTrigger className="rounded-sm h-9 text-sm" data-testid="upcoming-filter-status">
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
              <SelectTrigger className="rounded-sm h-9 text-sm" data-testid="upcoming-filter-outcome">
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
              <SelectTrigger className="rounded-sm h-9 text-sm" data-testid="upcoming-filter-source">
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
              <SelectTrigger className="rounded-sm h-9 text-sm" data-testid="upcoming-filter-sa">
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
              <SelectTrigger className="rounded-sm h-9 text-sm" data-testid="upcoming-filter-cre">
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

      {/* Appointment Tables grouped by date */}
      {sortedDates.length === 0 ? (
        <Card className="border border-gray-200 rounded-sm shadow-none">
          <div className="text-center text-gray-400 py-12">
            No upcoming appointments
          </div>
        </Card>
      ) : (
        sortedDates.map((date) => (
          <div key={date} className="space-y-3" data-testid={`date-group-${date}`}>
            <div className="flex items-center gap-3">
              <h2 className="font-heading font-bold text-lg tracking-tight uppercase">
                {formatDateHeading(date)}
              </h2>
              <span className="text-sm text-gray-500 font-mono">
                {groupedByDate[date].length} appointment{groupedByDate[date].length !== 1 ? "s" : ""}
              </span>
            </div>
            <Card className="border border-gray-200 rounded-sm shadow-none overflow-hidden">
              <AppointmentTable appointments={groupedByDate[date]} />
            </Card>
          </div>
        ))
      )}
    </div>
  );
};

export default Upcoming;
