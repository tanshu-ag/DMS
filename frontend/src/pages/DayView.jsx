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
import { toast } from "sonner";
import {
  Filter,
  RefreshCw,
  Eye,
  CheckCircle,
  Circle,
} from "lucide-react";

const DayView = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
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

  const today = new Date().toISOString().split("T")[0];

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

      setAppointments(apptsRes.data);
      setSettings(settingsRes.data);
      setCres(cresRes.data);
    } catch (error) {
      toast.error("Failed to load appointments");
    } finally {
      setLoading(false);
    }
  };

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
          <p className="text-sm text-gray-500 font-mono mt-1">{today}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="rounded-sm"
            onClick={fetchData}
            data-testid="refresh-btn"
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
              <SelectTrigger className="rounded-sm h-9 text-sm" data-testid="filter-branch">
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
              <SelectTrigger className="rounded-sm h-9 text-sm" data-testid="filter-status">
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
              <SelectTrigger className="rounded-sm h-9 text-sm" data-testid="filter-outcome">
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
              <SelectTrigger className="rounded-sm h-9 text-sm" data-testid="filter-source">
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
              <SelectTrigger className="rounded-sm h-9 text-sm" data-testid="filter-sa">
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
              <SelectTrigger className="rounded-sm h-9 text-sm" data-testid="filter-cre">
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

      {/* Summary */}
      <div className="text-sm text-gray-600 font-medium">
        {appointments.length} appointment{appointments.length !== 1 ? 's' : ''}
      </div>

      {/* Appointments Table */}
      {appointments.length === 0 ? (
        <Card className="border border-gray-200 rounded-sm shadow-none">
          <div className="p-12 text-center">
            <p className="text-lg font-medium text-gray-500">No appointments for today</p>
            <p className="text-sm text-gray-400 mt-1">
              Click "New Appointment" to schedule one
            </p>
          </div>
        </Card>
      ) : (
        <Card className="border border-gray-200 rounded-sm shadow-none overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="table-header bg-gray-50">
                <TableHead className="text-xs font-bold uppercase">Date</TableHead>
                <TableHead className="text-xs font-bold uppercase">Time</TableHead>
                <TableHead className="text-xs font-bold uppercase">Customer</TableHead>
                <TableHead className="text-xs font-bold uppercase">Phone</TableHead>
                <TableHead className="text-xs font-bold uppercase">Vehicle</TableHead>
                <TableHead className="text-xs font-bold uppercase">Branch</TableHead>
                <TableHead className="text-xs font-bold uppercase">Service</TableHead>
                <TableHead className="text-xs font-bold uppercase">SA</TableHead>
                <TableHead className="text-xs font-bold uppercase">Status</TableHead>
                <TableHead className="text-xs font-bold uppercase">N-1</TableHead>
                <TableHead className="text-xs font-bold uppercase">Outcome</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {appointments.map((appt) => (
                <TableRow
                  key={appt.appointment_id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => navigate(`/appointments/${appt.appointment_id}`)}
                >
                  <TableCell className="text-sm">{appt.appointment_date}</TableCell>
                  <TableCell className="text-sm font-medium">{appt.appointment_time}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {appt.priority_customer && (
                        <div className="w-5 h-5 bg-black text-white rounded-sm flex items-center justify-center text-xs font-bold">
                          P
                        </div>
                      )}
                      <span className="font-medium">{appt.customer_name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm font-mono">{appt.customer_phone}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div className="font-medium">{appt.vehicle_reg}</div>
                      <div className="text-gray-500 text-xs">{appt.vehicle_model}</div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{appt.branch || "-"}</TableCell>
                  <TableCell className="text-sm">{appt.service_type}</TableCell>
                  <TableCell className="text-sm">{appt.allocated_sa}</TableCell>
                  <TableCell>
                    {appt.appointment_status === "Confirmed" ? (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-black text-white rounded-sm text-xs font-medium">
                        <CheckCircle className="w-3.5 h-3.5" strokeWidth={2} />
                        Confirmed
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 border-2 border-dashed border-gray-400 rounded-sm text-xs font-medium text-gray-700">
                        <Circle className="w-3.5 h-3.5" strokeWidth={2} />
                        {appt.appointment_status}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">
                    {appt.n_minus_1_confirmation || "-"}
                  </TableCell>
                  <TableCell>
                    {appt.appointment_day_outcome ? (
                      <Badge variant="outline" className="rounded-sm text-xs">
                        {appt.appointment_day_outcome}
                      </Badge>
                    ) : (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 rounded-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/appointments/${appt.appointment_id}`);
                        }}
                      >
                        <Eye className="w-4 h-4 text-gray-400" strokeWidth={1.5} />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
};

export default DayView;
