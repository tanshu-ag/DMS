import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, API } from "@/App";
import axios from "axios";
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
import { Filter, RefreshCw, Eye } from "lucide-react";

// Demo data — future dates computed dynamically
const buildDemoData = () => {
  const today = new Date();
  const fmt = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${dd}`;
  };
  const d1 = new Date(today); d1.setDate(d1.getDate() + 1);
  const d2 = new Date(today); d2.setDate(d2.getDate() + 2);
  const d3 = new Date(today); d3.setDate(d3.getDate() + 3);
  const d4 = new Date(today); d4.setDate(d4.getDate() + 5);
  const d5 = new Date(today); d5.setDate(d5.getDate() + 7);

  return [
    { id: "u01", date: fmt(d1), time: "10:00 AM", customer_name: "Aarav Mehta", phone: "9012345601", vehicle_reg: "WB74U1001", model: "Kiger", service_type: "1FS", sa: "Arjun", source: "SDR", status: "Scheduled" },
    { id: "u02", date: fmt(d1), time: "10:30 AM", customer_name: "Diya Bose", phone: "9012345602", vehicle_reg: "AS01U2002", model: "Triber", service_type: "PMS", sa: "Vivek", source: "Incoming Call", status: "Scheduled" },
    { id: "u03", date: fmt(d1), time: "11:30 AM", customer_name: "Kabir Sinha", phone: "9012345603", vehicle_reg: "WB73U3003", model: "Duster", service_type: "RR", sa: "Arjun", source: "MYR", status: "Confirmed" },
    { id: "u04", date: fmt(d1), time: "2:00 PM", customer_name: "Ishita Ghosh", phone: "9012345604", vehicle_reg: "BR01U4004", model: "Kwid", service_type: "2FS", sa: "Vivek", source: "Other", status: "Scheduled" },
    { id: "u05", date: fmt(d2), time: "10:00 AM", customer_name: "Rohan Chatterjee", phone: "9012345605", vehicle_reg: "WB72U5005", model: "Kiger", service_type: "BP", sa: "Arjun", source: "SDR", status: "Scheduled" },
    { id: "u06", date: fmt(d2), time: "11:00 AM", customer_name: "Tanvi Mukherjee", phone: "9012345606", vehicle_reg: "AS01U6006", model: "Triber", service_type: "3FS", sa: "Vivek", source: "Incoming Call", status: "Scheduled" },
    { id: "u07", date: fmt(d2), time: "3:00 PM", customer_name: "Aditya Rao", phone: "9012345607", vehicle_reg: "WB74U7007", model: "Duster", service_type: "PMS", sa: "Arjun", source: "MYR", status: "Confirmed" },
    { id: "u08", date: fmt(d3), time: "10:30 AM", customer_name: "Neha Verma", phone: "9012345608", vehicle_reg: "BR01U8008", model: "Kwid", service_type: "1FS", sa: "Vivek", source: "SDR", status: "Scheduled" },
    { id: "u09", date: fmt(d3), time: "2:30 PM", customer_name: "Siddharth Pal", phone: "9012345609", vehicle_reg: "WB73U9009", model: "Kiger", service_type: "Others", sa: "Arjun", source: "Other", status: "Scheduled" },
    { id: "u10", date: fmt(d4), time: "10:00 AM", customer_name: "Pooja Agarwal", phone: "9012345610", vehicle_reg: "WB74U1010", model: "Triber", service_type: "RR", sa: "Vivek", source: "Incoming Call", status: "Scheduled" },
    { id: "u11", date: fmt(d4), time: "11:30 AM", customer_name: "Manish Tiwari", phone: "9012345611", vehicle_reg: "AS01U1111", model: "Duster", service_type: "BP", sa: "Arjun", source: "SDR", status: "Confirmed" },
    { id: "u12", date: fmt(d5), time: "3:30 PM", customer_name: "Ritika Sen", phone: "9012345612", vehicle_reg: "WB72U1212", model: "Kwid", service_type: "PMS", sa: "Vivek", source: "MYR", status: "Scheduled" },
  ];
};

const DEMO_DATA = buildDemoData();

const DATE_RANGE_OPTIONS = [
  { value: "tomorrow", label: "Tomorrow" },
  { value: "7days", label: "Next 7 Days" },
  { value: "30days", label: "Next 30 Days" },
  { value: "custom", label: "Custom Range" },
];

const getSourceColor = (source) => {
  const colors = {
    SDR: "bg-blue-100 text-blue-800",
    "Incoming Call": "bg-green-100 text-green-800",
    MYR: "bg-purple-100 text-purple-800",
    Other: "bg-gray-100 text-gray-800",
  };
  return colors[source] || "bg-gray-100 text-gray-800";
};

const formatDateDisplay = (dateStr) => {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

const Upcoming = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    branch: "",
    dateRange: "",
    service_type: "",
    sa: "",
    source: "",
    status: "",
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await axios.get(`${API}/settings`, { withCredentials: true });
      setSettings(res.data);
    } catch {
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  // UI-only filtering on demo data
  const filteredData = DEMO_DATA.filter((row) => {
    if (filters.branch && row.branch && row.branch !== filters.branch) return false;
    if (filters.service_type && row.service_type !== filters.service_type) return false;
    if (filters.sa && row.sa !== filters.sa) return false;
    if (filters.source && row.source !== filters.source) return false;
    if (filters.status && row.status !== filters.status) return false;
    if (filters.dateRange) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const rowDate = new Date(row.date + "T00:00:00");
      if (filters.dateRange === "tomorrow") {
        const tmrw = new Date(today);
        tmrw.setDate(tmrw.getDate() + 1);
        if (rowDate.getTime() !== tmrw.getTime()) return false;
      } else if (filters.dateRange === "7days") {
        const end = new Date(today);
        end.setDate(end.getDate() + 7);
        if (rowDate > end) return false;
      }
      // 30days and custom show all demo data
    }
    return true;
  });

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
            onClick={fetchSettings}
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
              value={filters.branch || "all"}
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
              value={filters.dateRange || "all"}
              onValueChange={(v) => setFilters({ ...filters, dateRange: v === "all" ? "" : v })}
            >
              <SelectTrigger className="rounded-sm h-9 text-sm" data-testid="upcoming-filter-date">
                <SelectValue placeholder="Date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Dates</SelectItem>
                {DATE_RANGE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.service_type || "all"}
              onValueChange={(v) => setFilters({ ...filters, service_type: v === "all" ? "" : v })}
            >
              <SelectTrigger className="rounded-sm h-9 text-sm" data-testid="upcoming-filter-service-type">
                <SelectValue placeholder="Service Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {settings?.service_types?.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.sa || "all"}
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
              value={filters.source || "all"}
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
              value={filters.status || "all"}
              onValueChange={(v) => setFilters({ ...filters, status: v === "all" ? "" : v })}
            >
              <SelectTrigger className="rounded-sm h-9 text-sm" data-testid="upcoming-filter-status">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Scheduled">Scheduled</SelectItem>
                <SelectItem value="Confirmed">Confirmed</SelectItem>
                <SelectItem value="Rescheduled">Rescheduled</SelectItem>
                <SelectItem value="Cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Content */}
      {filteredData.length === 0 ? (
        <Card className="border border-gray-200 rounded-sm shadow-none">
          <div className="flex flex-col items-center justify-center py-16 text-center" data-testid="upcoming-empty-state">
            <p className="text-sm font-medium text-gray-500">
              No upcoming appointments found.
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Try changing filters or date range.
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          <div className="text-sm text-gray-600 font-medium" data-testid="upcoming-count">
            {filteredData.length} upcoming appointment{filteredData.length !== 1 ? "s" : ""}
          </div>
          <Card className="border border-gray-200 rounded-sm shadow-none overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="text-xs font-bold uppercase whitespace-nowrap">Date</TableHead>
                    <TableHead className="text-xs font-bold uppercase whitespace-nowrap">Time</TableHead>
                    <TableHead className="text-xs font-bold uppercase whitespace-nowrap">Customer Name</TableHead>
                    <TableHead className="text-xs font-bold uppercase whitespace-nowrap">Phone No</TableHead>
                    <TableHead className="text-xs font-bold uppercase whitespace-nowrap">Vehicle Reg No</TableHead>
                    <TableHead className="text-xs font-bold uppercase whitespace-nowrap">Model</TableHead>
                    <TableHead className="text-xs font-bold uppercase whitespace-nowrap">Service Type</TableHead>
                    <TableHead className="text-xs font-bold uppercase whitespace-nowrap">SA</TableHead>
                    <TableHead className="text-xs font-bold uppercase whitespace-nowrap">Source</TableHead>
                    <TableHead className="text-xs font-bold uppercase whitespace-nowrap">Status</TableHead>
                    <TableHead className="text-xs font-bold uppercase whitespace-nowrap">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map((row) => (
                    <TableRow key={row.id} className="hover:bg-gray-50">
                      <TableCell className="text-sm whitespace-nowrap">
                        {formatDateDisplay(row.date)}
                      </TableCell>
                      <TableCell className="text-sm font-medium whitespace-nowrap">
                        {row.time}
                      </TableCell>
                      <TableCell className="text-sm font-medium whitespace-nowrap">
                        {row.customer_name}
                      </TableCell>
                      <TableCell className="text-sm whitespace-nowrap">
                        {row.phone}
                      </TableCell>
                      <TableCell className="text-sm font-medium whitespace-nowrap">
                        {row.vehicle_reg}
                      </TableCell>
                      <TableCell className="text-sm whitespace-nowrap">
                        {row.model}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="rounded-sm text-xs font-medium whitespace-nowrap">
                          {row.service_type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm whitespace-nowrap">
                        {row.sa}
                      </TableCell>
                      <TableCell>
                        <Badge className={`${getSourceColor(row.source)} rounded-sm text-xs font-medium border-0`}>
                          {row.source}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="rounded-sm text-xs font-medium whitespace-nowrap">
                          {row.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-sm"
                          onClick={() => toast.info("View appointment details")}
                          data-testid={`view-btn-${row.id}`}
                        >
                          <Eye className="w-4 h-4" strokeWidth={1.5} />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Upcoming;
