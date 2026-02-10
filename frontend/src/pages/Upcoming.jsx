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

const N1_OPTIONS = ["Confirmed", "Pending", "Not Reachable", "Rescheduled", "Cancelled"];

const getN1Color = (val) => {
  const map = {
    Confirmed: "bg-green-100 text-green-800",
    Pending: "bg-yellow-100 text-yellow-800",
    "Not Reachable": "bg-red-100 text-red-800",
    Rescheduled: "bg-orange-100 text-orange-800",
    Cancelled: "bg-gray-200 text-gray-600",
  };
  return map[val] || "bg-gray-100 text-gray-800";
};

const getSourceColor = (source) => {
  return "";
};

const fmtLocal = (d) => {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const fmtDisplay = (dateStr) => {
  const p = dateStr.split("-");
  return `${p[2]}-${p[1]}-${p[0]}`;
};

// Build demo data with tomorrow having N-1 + docket fields
const buildDemoData = () => {
  const now = new Date();
  const d1 = new Date(now); d1.setDate(d1.getDate() + 1);
  const d2 = new Date(now); d2.setDate(d2.getDate() + 2);
  const d3 = new Date(now); d3.setDate(d3.getDate() + 3);
  const d4 = new Date(now); d4.setDate(d4.getDate() + 5);
  const d5 = new Date(now); d5.setDate(d5.getDate() + 7);

  return [
    // Tomorrow — 5 rows with varied N-1 & Docket
    { id: "u01", date: fmtLocal(d1), time: "10:00 AM", customer_name: "Aarav Mehta", phone: "9012345601", vehicle_reg: "WB74U1001", model: "Kiger", service_type: "1FS", sa: "Arjun", source: "SDR", status: "Scheduled", n1_status: "Confirmed", docket_ready: true },
    { id: "u02", date: fmtLocal(d1), time: "10:30 AM", customer_name: "Diya Bose", phone: "9012345602", vehicle_reg: "AS01U2002", model: "Triber", service_type: "PMS", sa: "Vivek", source: "Incoming", status: "Scheduled", n1_status: "Pending", docket_ready: false },
    { id: "u03", date: fmtLocal(d1), time: "11:30 AM", customer_name: "Kabir Sinha", phone: "9012345603", vehicle_reg: "WB73U3003", model: "Duster", service_type: "RR", sa: "Arjun", source: "MYR", status: "Confirmed", n1_status: "Not Reachable", docket_ready: true },
    { id: "u04", date: fmtLocal(d1), time: "2:00 PM", customer_name: "Ishita Ghosh", phone: "9012345604", vehicle_reg: "BR01U4004", model: "Kwid", service_type: "2FS", sa: "Vivek", source: "Other", status: "Scheduled", n1_status: "Rescheduled", docket_ready: false },
    { id: "u05", date: fmtLocal(d1), time: "3:30 PM", customer_name: "Priyanka Das", phone: "9012345613", vehicle_reg: "WB72U5013", model: "Kiger", service_type: "BP", sa: "Arjun", source: "SDR", status: "Scheduled", n1_status: "Cancelled", docket_ready: false },
    // Future — day+2 onwards
    { id: "u06", date: fmtLocal(d2), time: "10:00 AM", customer_name: "Rohan Chatterjee", phone: "9012345605", vehicle_reg: "WB72U5005", model: "Kiger", service_type: "BP", sa: "Arjun", source: "SDR", status: "Scheduled" },
    { id: "u07", date: fmtLocal(d2), time: "11:00 AM", customer_name: "Tanvi Mukherjee", phone: "9012345606", vehicle_reg: "AS01U6006", model: "Triber", service_type: "3FS", sa: "Vivek", source: "Incoming", status: "Scheduled" },
    { id: "u08", date: fmtLocal(d2), time: "3:00 PM", customer_name: "Aditya Rao", phone: "9012345607", vehicle_reg: "WB74U7007", model: "Duster", service_type: "PMS", sa: "Arjun", source: "MYR", status: "Confirmed" },
    { id: "u09", date: fmtLocal(d3), time: "10:30 AM", customer_name: "Neha Verma", phone: "9012345608", vehicle_reg: "BR01U8008", model: "Kwid", service_type: "1FS", sa: "Vivek", source: "SDR", status: "Scheduled" },
    { id: "u10", date: fmtLocal(d3), time: "2:30 PM", customer_name: "Siddharth Pal", phone: "9012345609", vehicle_reg: "WB73U9009", model: "Kiger", service_type: "Others", sa: "Arjun", source: "Other", status: "Scheduled" },
    { id: "u11", date: fmtLocal(d4), time: "10:00 AM", customer_name: "Pooja Agarwal", phone: "9012345610", vehicle_reg: "WB74U1010", model: "Triber", service_type: "RR", sa: "Vivek", source: "Incoming", status: "Scheduled" },
    { id: "u12", date: fmtLocal(d4), time: "11:30 AM", customer_name: "Manish Tiwari", phone: "9012345611", vehicle_reg: "AS01U1111", model: "Duster", service_type: "BP", sa: "Arjun", source: "SDR", status: "Confirmed" },
    { id: "u13", date: fmtLocal(d5), time: "3:30 PM", customer_name: "Ritika Sen", phone: "9012345612", vehicle_reg: "WB72U1212", model: "Kwid", service_type: "PMS", sa: "Vivek", source: "MYR", status: "Scheduled" },
  ];
};

const INITIAL_DATA = buildDemoData();
const TOMORROW_STR = (() => { const d = new Date(); d.setDate(d.getDate() + 1); return fmtLocal(d); })();

const Upcoming = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [demoData, setDemoData] = useState(INITIAL_DATA);
  const [filters, setFilters] = useState({
    branch: "",
    dateRange: "",
    service_type: "",
    sa: "",
    source: "",
    status: "",
  });

  useEffect(() => { fetchSettings(); }, []);

  const fetchSettings = async () => {
    try {
      const res = await axios.get(`${API}/settings`, { withCredentials: true });
      setSettings(res.data);
    } catch { toast.error("Failed to load settings"); }
    finally { setLoading(false); }
  };

  const tomorrowRows = demoData.filter((r) => r.date === TOMORROW_STR);

  // Filters apply only to future bookings
  const allFutureRows = demoData.filter((r) => r.date > TOMORROW_STR);
  const futureRows = allFutureRows.filter((r) => {
    if (filters.service_type && r.service_type !== filters.service_type) return false;
    if (filters.sa && r.sa !== filters.sa) return false;
    if (filters.source && r.source !== filters.source) return false;
    if (filters.status && r.status !== filters.status) return false;
    if (filters.branch && r.branch && r.branch !== filters.branch) return false;
    if (filters.dateRange) {
      const now = new Date(); now.setHours(0, 0, 0, 0);
      const rowDate = new Date(r.date + "T00:00:00");
      const dayAfter = new Date(now); dayAfter.setDate(dayAfter.getDate() + 2);
      if (filters.dateRange === "day_after") {
        if (fmtLocal(rowDate) !== fmtLocal(dayAfter)) return false;
      } else if (filters.dateRange === "3days") {
        const end = new Date(now); end.setDate(end.getDate() + 3);
        if (rowDate > end) return false;
      } else if (filters.dateRange === "7days") {
        const end = new Date(now); end.setDate(end.getDate() + 7);
        if (rowDate > end) return false;
      } else if (filters.dateRange === "14days") {
        const end = new Date(now); end.setDate(end.getDate() + 14);
        if (rowDate > end) return false;
      }
      // 30days shows all
    }
    return true;
  });

  const updateN1 = (id, val) => {
    setDemoData((prev) => prev.map((r) => (r.id === id ? { ...r, n1_status: val } : r)));
  };

  const toggleDocket = (id) => {
    setDemoData((prev) => prev.map((r) => (r.id === id ? { ...r, docket_ready: !r.docket_ready } : r)));
  };

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
          <h1 className="font-heading font-black text-3xl md:text-4xl tracking-tighter uppercase">Upcoming</h1>
          <p className="text-sm text-gray-500 font-mono mt-1">Future scheduled appointments</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="rounded-sm" onClick={fetchSettings} data-testid="upcoming-refresh-btn">
            <RefreshCw className="w-4 h-4" strokeWidth={1.5} />
          </Button>
          <Button onClick={() => navigate("/new-appointment")} className="bg-black text-white hover:bg-gray-800 rounded-sm font-mono text-xs uppercase tracking-wider" data-testid="new-appointment-btn">
            New Appointment
          </Button>
        </div>
      </div>

      {/* Section 1: Tomorrow Prep — no filters */}
      <div className="space-y-3" data-testid="tomorrow-section">
        <h2 className="font-heading font-bold text-lg tracking-tight uppercase">
          Tomorrow Prep (N-1 &amp; Docket)
        </h2>
        <div className="text-sm text-gray-600 font-medium" data-testid="tomorrow-count">
          {tomorrowRows.length} appointment{tomorrowRows.length !== 1 ? "s" : ""} for tomorrow
        </div>
        <Card className="border border-gray-200 rounded-sm shadow-none overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="text-xs font-bold uppercase whitespace-nowrap">Time</TableHead>
                  <TableHead className="text-xs font-bold uppercase whitespace-nowrap">Customer Name</TableHead>
                  <TableHead className="text-xs font-bold uppercase whitespace-nowrap">Phone No</TableHead>
                  <TableHead className="text-xs font-bold uppercase whitespace-nowrap">Vehicle Reg No</TableHead>
                  <TableHead className="text-xs font-bold uppercase whitespace-nowrap">Model</TableHead>
                  <TableHead className="text-xs font-bold uppercase whitespace-nowrap">Service Type</TableHead>
                  <TableHead className="text-xs font-bold uppercase whitespace-nowrap">SA</TableHead>
                  <TableHead className="text-xs font-bold uppercase whitespace-nowrap">Source</TableHead>
                  <TableHead className="text-xs font-bold uppercase whitespace-nowrap">Status</TableHead>
                  <TableHead className="text-xs font-bold uppercase whitespace-nowrap">N-1 Status</TableHead>
                  <TableHead className="text-xs font-bold uppercase whitespace-nowrap">Docket Ready</TableHead>
                  <TableHead className="text-xs font-bold uppercase whitespace-nowrap">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tomorrowRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={12} className="text-center text-sm text-gray-400 py-6">
                      No appointments scheduled for tomorrow.
                    </TableCell>
                  </TableRow>
                ) : (
                  tomorrowRows.map((row) => (
                    <TableRow key={row.id} className="hover:bg-gray-50">
                      <TableCell className="text-sm font-medium whitespace-nowrap">{row.time}</TableCell>
                      <TableCell className="text-sm font-medium whitespace-nowrap">{row.customer_name}</TableCell>
                      <TableCell className="text-sm whitespace-nowrap">{row.phone}</TableCell>
                      <TableCell className="text-sm font-medium whitespace-nowrap">{row.vehicle_reg}</TableCell>
                      <TableCell className="text-sm whitespace-nowrap">{row.model}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="rounded-sm text-xs font-medium whitespace-nowrap">{row.service_type}</Badge>
                      </TableCell>
                      <TableCell className="text-sm whitespace-nowrap">{row.sa}</TableCell>
                      <TableCell>
                        <Badge className={`${getSourceColor(row.source)} rounded-sm text-xs font-medium border-0`}>{row.source}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="rounded-sm text-xs font-medium whitespace-nowrap">{row.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <Select value={row.n1_status || "Pending"} onValueChange={(v) => updateN1(row.id, v)}>
                          <SelectTrigger className="h-7 w-[130px] rounded-sm text-xs border-0 p-0 pl-2" data-testid={`n1-select-${row.id}`}>
                            <Badge className={`${getN1Color(row.n1_status)} rounded-sm text-xs font-medium border-0 whitespace-nowrap`}>
                              {row.n1_status || "Pending"}
                            </Badge>
                          </SelectTrigger>
                          <SelectContent>
                            {N1_OPTIONS.map((opt) => (
                              <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <button
                          type="button"
                          onClick={() => toggleDocket(row.id)}
                          className="cursor-pointer"
                          data-testid={`docket-toggle-${row.id}`}
                        >
                          <Badge className={`rounded-sm text-xs font-medium border-0 whitespace-nowrap ${row.docket_ready ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                            {row.docket_ready ? "Yes" : "No"}
                          </Badge>
                        </button>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-sm" onClick={() => toast.info("View appointment details")} data-testid={`view-btn-${row.id}`}>
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

      {/* Filters — apply to Future Bookings only */}
      <Card className="border border-gray-200 rounded-sm shadow-none">
        <div className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-4 h-4 text-gray-500" strokeWidth={1.5} />
            <span className="text-xs font-mono uppercase tracking-wider text-gray-500">Filters</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            <Select value={filters.dateRange || "all"} onValueChange={(v) => setFilters({ ...filters, dateRange: v === "all" ? "" : v })}>
              <SelectTrigger className="rounded-sm h-9 text-sm" data-testid="upcoming-filter-date"><SelectValue placeholder="Date Range" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Dates</SelectItem>
                <SelectItem value="day_after">Day After Tomorrow</SelectItem>
                <SelectItem value="3days">Next 3 Days</SelectItem>
                <SelectItem value="7days">Next 7 Days</SelectItem>
                <SelectItem value="14days">Next 14 Days</SelectItem>
                <SelectItem value="30days">Next 30 Days</SelectItem>
                <SelectItem value="this_month">This Month</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filters.service_type || "all"} onValueChange={(v) => setFilters({ ...filters, service_type: v === "all" ? "" : v })}>
              <SelectTrigger className="rounded-sm h-9 text-sm" data-testid="upcoming-filter-service-type"><SelectValue placeholder="Service Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {settings?.service_types?.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filters.sa || "all"} onValueChange={(v) => setFilters({ ...filters, sa: v === "all" ? "" : v })}>
              <SelectTrigger className="rounded-sm h-9 text-sm" data-testid="upcoming-filter-sa"><SelectValue placeholder="SA" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All SAs</SelectItem>
                {settings?.service_advisors?.map((sa) => <SelectItem key={sa} value={sa}>{sa}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filters.source || "all"} onValueChange={(v) => setFilters({ ...filters, source: v === "all" ? "" : v })}>
              <SelectTrigger className="rounded-sm h-9 text-sm" data-testid="upcoming-filter-source"><SelectValue placeholder="Source" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                {settings?.sources?.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filters.status || "all"} onValueChange={(v) => setFilters({ ...filters, status: v === "all" ? "" : v })}>
              <SelectTrigger className="rounded-sm h-9 text-sm" data-testid="upcoming-filter-status"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Scheduled">Scheduled</SelectItem>
                <SelectItem value="Confirmed">Confirmed</SelectItem>
                <SelectItem value="Rescheduled">Rescheduled</SelectItem>
                <SelectItem value="Cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filters.branch || "all"} onValueChange={(v) => setFilters({ ...filters, branch: v === "all" ? "" : v })}>
              <SelectTrigger className="rounded-sm h-9 text-sm" data-testid="upcoming-filter-branch"><SelectValue placeholder="Branch" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Branches</SelectItem>
                {settings?.branches?.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Section 2: Future Bookings */}
      <div className="space-y-3" data-testid="future-section">
        <h2 className="font-heading font-bold text-lg tracking-tight uppercase">Future Bookings</h2>
        <div className="text-sm text-gray-600 font-medium" data-testid="future-count">
          {futureRows.length} future booking{futureRows.length !== 1 ? "s" : ""}
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
                {futureRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center text-sm text-gray-400 py-6">
                      No future bookings found.
                    </TableCell>
                  </TableRow>
                ) : (
                  futureRows.map((row) => (
                    <TableRow key={row.id} className="hover:bg-gray-50">
                      <TableCell className="text-sm whitespace-nowrap">{fmtDisplay(row.date)}</TableCell>
                      <TableCell className="text-sm font-medium whitespace-nowrap">{row.time}</TableCell>
                      <TableCell className="text-sm font-medium whitespace-nowrap">{row.customer_name}</TableCell>
                      <TableCell className="text-sm whitespace-nowrap">{row.phone}</TableCell>
                      <TableCell className="text-sm font-medium whitespace-nowrap">{row.vehicle_reg}</TableCell>
                      <TableCell className="text-sm whitespace-nowrap">{row.model}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="rounded-sm text-xs font-medium whitespace-nowrap">{row.service_type}</Badge>
                      </TableCell>
                      <TableCell className="text-sm whitespace-nowrap">{row.sa}</TableCell>
                      <TableCell>
                        <Badge className={`${getSourceColor(row.source)} rounded-sm text-xs font-medium border-0`}>{row.source}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="rounded-sm text-xs font-medium whitespace-nowrap">{row.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-sm" onClick={() => toast.info("View appointment details")} data-testid={`view-btn-${row.id}`}>
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
    </div>
  );
};

export default Upcoming;
