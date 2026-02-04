import { useState, useEffect } from "react";
import { useAuth, API } from "@/App";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
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
  ChevronLeft,
  ChevronRight,
  Download,
  Filter,
  RefreshCw,
  Eye,
  CheckCircle,
  Circle,
  XCircle,
} from "lucide-react";

const YearView = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [settings, setSettings] = useState(null);
  const [cres, setCres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [filters, setFilters] = useState({
    branch: "",
    source: "",
    service_type: "",
    cre: "",
    sa: "",
    status: "",
    outcome: "",
    n1_status: "",
  });

  useEffect(() => {
    fetchData();
  }, [currentYear, filters]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ view: "year", year: currentYear });
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

  const handleExport = async () => {
    if (user?.role !== "CRM") {
      toast.error("Only CRM can export data");
      return;
    }

    try {
      const response = await axios.get(
        `${API}/export/csv?view=year&year=${currentYear}`,
        { withCredentials: true, responseType: "blob" }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `appointments_${currentYear}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Export downloaded");
    } catch (error) {
      toast.error("Export failed");
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Confirmed":
        return <CheckCircle className="w-3 h-3" strokeWidth={1.5} />;
      case "Closed":
        return <XCircle className="w-3 h-3" strokeWidth={1.5} />;
      default:
        return <Circle className="w-3 h-3" strokeWidth={1.5} />;
    }
  };

  const clearFilters = () => {
    setFilters({
      branch: "",
      source: "",
      service_type: "",
      cre: "",
      sa: "",
      status: "",
      outcome: "",
      n1_status: "",
    });
  };

  return (
    <div className="space-y-6" data-testid="year-view-page">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-heading font-black text-3xl md:text-4xl tracking-tighter uppercase">
            Year View
          </h1>
          <div className="flex items-center gap-4 mt-2">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-sm"
              onClick={() => setCurrentYear(currentYear - 1)}
            >
              <ChevronLeft className="w-5 h-5" strokeWidth={1.5} />
            </Button>
            <span className="font-mono text-xl font-bold">{currentYear}</span>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-sm"
              onClick={() => setCurrentYear(currentYear + 1)}
            >
              <ChevronRight className="w-5 h-5" strokeWidth={1.5} />
            </Button>
          </div>
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
          {user?.role === "CRM" && (
            <>
              <Button
                variant="outline"
                className="rounded-sm font-mono text-xs uppercase tracking-wider"
                onClick={handleExport}
                data-testid="export-csv-btn"
              >
                <Download className="w-4 h-4 mr-2" strokeWidth={1.5} />
                Export CSV
              </Button>
              <Button
                variant="outline"
                className="rounded-sm font-mono text-xs uppercase tracking-wider opacity-50 cursor-not-allowed"
                disabled
                title="Coming Soon"
              >
                <Download className="w-4 h-4 mr-2" strokeWidth={1.5} />
                Export PDF
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card className="border border-gray-200 rounded-sm shadow-none">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" strokeWidth={1.5} />
              <span className="text-xs font-mono uppercase tracking-wider text-gray-500">
                Filters
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs"
              onClick={clearFilters}
              data-testid="clear-filters-btn"
            >
              Clear All
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
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
              value={filters.service_type}
              onValueChange={(v) => setFilters({ ...filters, service_type: v === "all" ? "" : v })}
            >
              <SelectTrigger className="rounded-sm h-9 text-sm">
                <SelectValue placeholder="Service" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {settings?.service_types?.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
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
              value={filters.n1_status}
              onValueChange={(v) => setFilters({ ...filters, n1_status: v === "all" ? "" : v })}
            >
              <SelectTrigger className="rounded-sm h-9 text-sm">
                <SelectValue placeholder="N-1 Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All N-1</SelectItem>
                {settings?.n_minus_1_confirmation_statuses?.map((s) => (
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
          </div>
        </CardContent>
      </Card>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <Badge variant="outline" className="rounded-sm border-black text-xs font-mono">
          {appointments.length} appointments
        </Badge>
      </div>

      {/* Table */}
      <Card className="border border-gray-200 rounded-sm shadow-none overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="table-header bg-gray-50">
                <TableHead className="text-xs">Date</TableHead>
                <TableHead className="text-xs">Time</TableHead>
                <TableHead className="text-xs">Customer</TableHead>
                <TableHead className="text-xs">Phone</TableHead>
                <TableHead className="text-xs">Vehicle</TableHead>
                <TableHead className="text-xs">Branch</TableHead>
                <TableHead className="text-xs">Service</TableHead>
                <TableHead className="text-xs">SA</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs">N-1</TableHead>
                <TableHead className="text-xs">Outcome</TableHead>
                <TableHead className="text-xs w-16"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={12} className="text-center py-8">
                    <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto"></div>
                  </TableCell>
                </TableRow>
              ) : appointments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={12} className="text-center py-8 text-gray-500">
                    No appointments found for {currentYear}
                  </TableCell>
                </TableRow>
              ) : (
                appointments.map((appt) => (
                  <TableRow
                    key={appt.appointment_id}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/appointments/${appt.appointment_id}`)}
                    data-testid={`row-${appt.appointment_id}`}
                  >
                    <TableCell className="font-mono text-xs">{appt.appointment_date}</TableCell>
                    <TableCell className="font-mono text-xs font-bold">{appt.appointment_time}</TableCell>
                    <TableCell className="font-medium text-sm">
                      {appt.customer_name}
                      {appt.priority_customer && (
                        <Badge className="ml-2 bg-black text-white rounded-sm text-[8px]">P</Badge>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{appt.customer_phone}</TableCell>
                    <TableCell className="font-mono text-xs">{appt.vehicle_reg_no || "-"}</TableCell>
                    <TableCell className="text-xs">{appt.branch}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="rounded-sm text-[10px] font-mono">
                        {appt.service_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">{appt.allocated_sa || "-"}</TableCell>
                    <TableCell>
                      <Badge
                        className={`rounded-sm text-[10px] ${
                          appt.appointment_status === "Confirmed"
                            ? "bg-black text-white"
                            : appt.appointment_status === "Closed"
                            ? "bg-gray-100 text-black border border-black"
                            : "bg-white text-black border border-dashed border-black"
                        }`}
                      >
                        {getStatusIcon(appt.appointment_status)}
                        <span className="ml-1">{appt.appointment_status}</span>
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">{appt.n_minus_1_confirmation_status}</TableCell>
                    <TableCell className="text-xs">{appt.appointment_day_outcome || "-"}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-sm h-7 w-7"
                        data-testid={`view-${appt.appointment_id}`}
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
      </Card>
    </div>
  );
};

export default YearView;
