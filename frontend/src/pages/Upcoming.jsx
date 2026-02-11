import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, API } from "@/App";
import axios from "axios";
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
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Filter, RefreshCw, Eye, SlidersHorizontal, GripVertical, Pencil, MessageCircle } from "lucide-react";

const N1_OPTIONS = ["Confirmed", "Pending", "Not Reachable", "Rescheduled", "Cancelled"];

const getN1Color = (val) => {
  const map = {
    Confirmed: "bg-green-100 text-green-800",
    Pending: "bg-yellow-100 text-yellow-800",
    "Not Reachable": "bg-orange-100 text-orange-800",
    Rescheduled: "bg-blue-100 text-blue-800",
    Cancelled: "bg-red-100 text-red-800",
  };
  return map[val] || "bg-gray-100 text-gray-800";
};

// Column definitions
const TOMORROW_COLS = [
  { id: "time", label: "Time" },
  { id: "customer_name", label: "Customer Name" },
  { id: "phone", label: "Phone No" },
  { id: "reg_no", label: "Reg No" },
  { id: "model", label: "Model" },
  { id: "service_type", label: "Service Type" },
  { id: "sa", label: "SA" },
  { id: "source", label: "Source" },
  { id: "status", label: "Status" },
  { id: "n1_status", label: "N-1 Status" },
  { id: "docket_ready", label: "Docket Ready" },
  { id: "actions", label: "" },
];
const FUTURE_COLS = [
  { id: "date", label: "Date" },
  { id: "time", label: "Time" },
  { id: "customer_name", label: "Customer Name" },
  { id: "phone", label: "Phone No" },
  { id: "reg_no", label: "Reg No" },
  { id: "model", label: "Model" },
  { id: "service_type", label: "Service Type" },
  { id: "sa", label: "SA" },
  { id: "source", label: "Source" },
  { id: "status", label: "Status" },
  { id: "actions", label: "" },
];
const CUSTOMIZABLE_IDS = ["n1_status", "docket_ready"];
const CUSTOMIZABLE_LABELS = { n1_status: "N-1 Status", docket_ready: "Docket Ready" };

const Upcoming = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [demoData, setDemoData] = useState([]);
  const [filters, setFilters] = useState({ dateRange: "", service_type: "", sa: "", source: "", status: "", branch: "" });
  // Column preferences
  const [hiddenCols, setHiddenCols] = useState([]);
  const [tmrOrder, setTmrOrder] = useState(TOMORROW_COLS.map((c) => c.id));
  const [futOrder, setFutOrder] = useState(FUTURE_COLS.map((c) => c.id));
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [rearrangeOpen, setRearrangeOpen] = useState(false);
  const [rearrangeTarget, setRearrangeTarget] = useState("tomorrow");
  const [tempHidden, setTempHidden] = useState([]);
  const [tempOrder, setTempOrder] = useState([]);
  const [dragIdx, setDragIdx] = useState(null);

  const fmtDisplay = (d) => d ? d.split("-").reverse().join("-") : "";

  useEffect(() => {
    fetchSettings();
    loadPrefs();
  }, []);

  const loadPrefs = async () => {
    try {
      const res = await axios.get(`${API}/user-preferences/upcoming`, { withCredentials: true });
      if (res.data.hidden_columns?.length) setHiddenCols(res.data.hidden_columns);
      if (res.data.column_order?.length) {
        // column_order stores { tomorrow: [...], future: [...] } encoded as JSON string or we store tomorrow order
        try {
          const parsed = JSON.parse(res.data.column_order[0]);
          if (parsed.tomorrow) setTmrOrder(parsed.tomorrow);
          if (parsed.future) setFutOrder(parsed.future);
        } catch {
          // fallback: single order array
        }
      }
    } catch {}
  };

  const savePrefs = async (hidden, tmr, fut) => {
    try {
      await axios.put(`${API}/user-preferences/upcoming`,
        { hidden_columns: hidden, column_order: [JSON.stringify({ tomorrow: tmr, future: fut })] },
        { withCredentials: true }
      );
    } catch {}
  };

  const fetchSettings = async () => {
    try {
      const res = await axios.get(`${API}/settings`, { withCredentials: true });
      setSettings(res.data);
      buildDemoData(res.data);
    } catch {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const buildDemoData = (sett) => {
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const makeDateStr = (offset) => {
      const d = new Date(now);
      d.setDate(d.getDate() + offset);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    };
    const sas = sett?.service_advisors || ["Arjun", "Vivek"];
    const sources = sett?.sources || ["SDR", "Incoming Call", "MYR"];
    const types = sett?.service_types || ["1FS", "PMS", "RR", "BP"];
    const models = ["Kiger", "Triber", "Duster", "Kwid"];
    const names = ["Tanvi Mukherjee", "Aarav Banerjee", "Priya Reddy", "Vikram Shah", "Neha Kapoor", "Arjun Nair", "Pooja Agarwal"];
    const statuses = ["Scheduled", "Confirmed", "Rescheduled"];
    const rows = [];
    for (let i = 0; i < 12; i++) {
      const dayOffset = i < 5 ? 1 : 2 + Math.floor((i - 5) / 2);
      rows.push({
        id: `u${String(i + 1).padStart(2, "0")}`,
        date: makeDateStr(dayOffset),
        time: `${String(9 + (i % 8)).padStart(2, "0")}:${i % 2 === 0 ? "00" : "30"}`,
        customer_name: names[i % names.length],
        phone: `90123456${String(i + 6).padStart(2, "0")}`,
        vehicle_reg: `WB${70 + i}U${1000 + i}`,
        model: models[i % models.length],
        service_type: types[i % types.length],
        sa: sas[i % sas.length],
        source: sources[i % sources.length],
        status: statuses[i % statuses.length],
        n1_status: i % 3 === 0 ? "Confirmed" : i % 3 === 1 ? "Pending" : "Not Reachable",
        docket_ready: i % 2 === 0,
      });
    }
    setDemoData(rows);
  };

  const applyFilters = (rows) => {
    return rows.filter((r) => {
      if (filters.service_type && r.service_type !== filters.service_type) return false;
      if (filters.sa && r.sa !== filters.sa) return false;
      if (filters.source && r.source !== filters.source) return false;
      if (filters.status && r.status !== filters.status) return false;
      return true;
    });
  };

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const tmrDate = new Date(now); tmrDate.setDate(tmrDate.getDate() + 1);
  const tmrStr = `${tmrDate.getFullYear()}-${String(tmrDate.getMonth() + 1).padStart(2, "0")}-${String(tmrDate.getDate()).padStart(2, "0")}`;

  const tomorrowRows = demoData.filter((r) => r.date === tmrStr);
  let futureRows = demoData.filter((r) => r.date > tmrStr);

  // Apply date-range filter
  if (filters.dateRange) {
    const makeFutureDate = (offset) => {
      const d = new Date(now); d.setDate(d.getDate() + offset);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    };
    const rangeMap = { day_after: 2, "3days": 4, "7days": 8, "14days": 15, "30days": 31 };
    if (filters.dateRange === "this_month") {
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      const endStr = `${endOfMonth.getFullYear()}-${String(endOfMonth.getMonth() + 1).padStart(2, "0")}-${String(endOfMonth.getDate()).padStart(2, "0")}`;
      futureRows = futureRows.filter((r) => r.date <= endStr);
    } else if (rangeMap[filters.dateRange]) {
      const endStr = makeFutureDate(rangeMap[filters.dateRange]);
      futureRows = futureRows.filter((r) => r.date <= endStr);
    }
  }
  futureRows = applyFilters(futureRows);

  const updateN1 = (id, val) => {
    setDemoData((prev) => prev.map((r) => (r.id === id ? { ...r, n1_status: val } : r)));
  };
  const toggleDocket = (id) => {
    setDemoData((prev) => prev.map((r) => (r.id === id ? { ...r, docket_ready: !r.docket_ready } : r)));
  };

  // Visible column lists
  const visTmr = tmrOrder.filter((id) => !hiddenCols.includes(id)).map((id) => TOMORROW_COLS.find((c) => c.id === id)).filter(Boolean);
  const visFut = futOrder.filter((id) => !hiddenCols.includes(id)).map((id) => FUTURE_COLS.find((c) => c.id === id)).filter(Boolean);

  // Cell renderers
  const renderTmrCell = (colId, row) => {
    switch (colId) {
      case "time": return <span className="text-sm font-medium">{row.time}</span>;
      case "customer_name": return <span className="text-sm font-medium">{row.customer_name}</span>;
      case "phone": return <span className="text-sm">{row.phone}</span>;
      case "reg_no": return <span className="text-sm font-medium">{row.vehicle_reg}</span>;
      case "model": return <span className="text-sm">{row.model}</span>;
      case "service_type": return <Badge variant="outline" className="rounded-sm text-xs font-medium whitespace-nowrap">{row.service_type}</Badge>;
      case "sa": return <span className="text-sm">{row.sa}</span>;
      case "source": return <span className="text-sm">{row.source}</span>;
      case "status": return <Badge variant="outline" className="rounded-sm text-xs font-medium whitespace-nowrap">{row.status}</Badge>;
      case "n1_status":
        return (
          <Select value={row.n1_status || "Pending"} onValueChange={(v) => updateN1(row.id, v)}>
            <SelectTrigger className="h-7 w-[130px] rounded-sm text-xs border-0 p-0 pl-2 mx-auto" data-testid={`n1-select-${row.id}`}>
              <Badge className={`${getN1Color(row.n1_status)} rounded-sm text-xs font-medium border-0 whitespace-nowrap`}>{row.n1_status || "Pending"}</Badge>
            </SelectTrigger>
            <SelectContent>{N1_OPTIONS.map((opt) => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}</SelectContent>
          </Select>
        );
      case "docket_ready":
        return (
          <button type="button" onClick={() => toggleDocket(row.id)} className="cursor-pointer" data-testid={`docket-toggle-${row.id}`}>
            <Badge className={`rounded-sm text-xs font-medium border-0 whitespace-nowrap ${row.docket_ready ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>{row.docket_ready ? "Yes" : "No"}</Badge>
          </button>
        );
      case "actions":
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-sm" data-testid={`action-menu-btn-${row.id}`}>
                <Eye className="w-4 h-4" strokeWidth={1.5} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-sm min-w-[120px]">
              <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => navigate(`/appointments/${row.id}?edit=true`)} data-testid={`edit-btn-${row.id}`}>
                <Pencil className="w-4 h-4" strokeWidth={1.5} /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2 cursor-pointer" data-testid={`message-btn-${row.id}`}>
                <MessageCircle className="w-4 h-4" strokeWidth={1.5} /> Message
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      default: return null;
    }
  };

  const renderFutCell = (colId, row) => {
    switch (colId) {
      case "date": return <span className="text-sm">{fmtDisplay(row.date)}</span>;
      case "time": return <span className="text-sm font-medium">{row.time}</span>;
      case "customer_name": return <span className="text-sm font-medium">{row.customer_name}</span>;
      case "phone": return <span className="text-sm">{row.phone}</span>;
      case "reg_no": return <span className="text-sm font-medium">{row.vehicle_reg}</span>;
      case "model": return <span className="text-sm">{row.model}</span>;
      case "service_type": return <Badge variant="outline" className="rounded-sm text-xs font-medium whitespace-nowrap">{row.service_type}</Badge>;
      case "sa": return <span className="text-sm">{row.sa}</span>;
      case "source": return <span className="text-sm">{row.source}</span>;
      case "status": return <Badge variant="outline" className="rounded-sm text-xs font-medium whitespace-nowrap">{row.status}</Badge>;
      case "actions":
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-sm" data-testid={`action-menu-btn-${row.id}`}>
                <Eye className="w-4 h-4" strokeWidth={1.5} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-sm min-w-[120px]">
              <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => navigate(`/appointments/${row.id}?edit=true`)} data-testid={`edit-btn-${row.id}`}>
                <Pencil className="w-4 h-4" strokeWidth={1.5} /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2 cursor-pointer" data-testid={`message-btn-${row.id}`}>
                <MessageCircle className="w-4 h-4" strokeWidth={1.5} /> Message
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      default: return null;
    }
  };

  const handleSaveCustomize = () => {
    setHiddenCols(tempHidden);
    savePrefs(tempHidden, tmrOrder, futOrder);
    setCustomizeOpen(false);
    toast.success("Column visibility saved");
  };

  const handleSaveRearrange = () => {
    if (rearrangeTarget === "tomorrow") {
      setTmrOrder(tempOrder);
      savePrefs(hiddenCols, tempOrder, futOrder);
    } else {
      setFutOrder(tempOrder);
      savePrefs(hiddenCols, tmrOrder, tempOrder);
    }
    setRearrangeOpen(false);
    toast.success("Column order saved");
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

      {/* Section 1: Tomorrow Prep */}
      <div className="space-y-3" data-testid="tomorrow-section">
        <h2 className="font-heading font-bold text-lg tracking-tight uppercase">Tomorrow Prep (N-1 &amp; Docket)</h2>
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600 font-medium" data-testid="tomorrow-count">
            {tomorrowRows.length} appointment{tomorrowRows.length !== 1 ? "s" : ""} for tomorrow
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="rounded-sm h-8 text-xs gap-1.5" data-testid="customize-columns-btn" onClick={() => { setTempHidden([...hiddenCols]); setCustomizeOpen(true); }}>
              <SlidersHorizontal className="w-3.5 h-3.5" strokeWidth={1.5} />Customize Columns
            </Button>
            <Button variant="outline" size="sm" className="rounded-sm h-8 text-xs gap-1.5" data-testid="rearrange-columns-btn" onClick={() => { setRearrangeTarget("tomorrow"); setTempOrder(tmrOrder.filter((id) => !hiddenCols.includes(id))); setRearrangeOpen(true); }}>
              <GripVertical className="w-3.5 h-3.5" strokeWidth={1.5} />Rearrange Columns
            </Button>
          </div>
        </div>
        <Card className="border border-gray-200 rounded-sm shadow-none overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  {visTmr.map((col) => (
                    <TableHead key={col.id} className={`text-xs font-bold uppercase whitespace-nowrap text-center${col.id === "actions" ? " w-12" : ""}`}>{col.label}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {tomorrowRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={visTmr.length} className="text-center text-sm text-gray-400 py-6">No appointments scheduled for tomorrow.</TableCell>
                  </TableRow>
                ) : (
                  tomorrowRows.map((row) => (
                    <TableRow key={row.id} className="hover:bg-gray-50">
                      {visTmr.map((col) => (
                        <TableCell key={col.id} className={`whitespace-nowrap text-center${col.id === "customer_name" ? " text-left" : ""}`}>
                          {renderTmrCell(col.id, row)}
                        </TableCell>
                      ))}
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
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600 font-medium" data-testid="future-count">
            {futureRows.length} future booking{futureRows.length !== 1 ? "s" : ""}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="rounded-sm h-8 text-xs gap-1.5" onClick={() => { setRearrangeTarget("future"); setTempOrder(futOrder.filter((id) => !hiddenCols.includes(id))); setRearrangeOpen(true); }}>
              <GripVertical className="w-3.5 h-3.5" strokeWidth={1.5} />Rearrange Columns
            </Button>
          </div>
        </div>
        <Card className="border border-gray-200 rounded-sm shadow-none overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  {visFut.map((col) => (
                    <TableHead key={col.id} className={`text-xs font-bold uppercase whitespace-nowrap text-center${col.id === "actions" ? " w-12" : ""}`}>{col.label}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {futureRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={visFut.length} className="text-center text-sm text-gray-400 py-6">No future bookings found.</TableCell>
                  </TableRow>
                ) : (
                  futureRows.map((row) => (
                    <TableRow key={row.id} className="hover:bg-gray-50">
                      {visFut.map((col) => (
                        <TableCell key={col.id} className={`whitespace-nowrap text-center${col.id === "customer_name" ? " text-left" : ""}`}>
                          {renderFutCell(col.id, row)}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>

      {/* Customize Columns Modal */}
      <Dialog open={customizeOpen} onOpenChange={setCustomizeOpen}>
        <DialogContent className="sm:max-w-md" data-testid="customize-columns-modal">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold uppercase tracking-tight">Customize Columns</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {CUSTOMIZABLE_IDS.map((id) => (
              <label key={id} className="flex items-center gap-3 cursor-pointer" data-testid={`toggle-col-${id}`}>
                <input type="checkbox" checked={!tempHidden.includes(id)} onChange={() => setTempHidden((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])} className="h-4 w-4 rounded border-gray-300 accent-black" />
                <span className="text-sm font-medium">{CUSTOMIZABLE_LABELS[id]}</span>
              </label>
            ))}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" className="rounded-sm" onClick={() => setCustomizeOpen(false)}>Cancel</Button>
            <Button size="sm" className="rounded-sm bg-black text-white hover:bg-gray-800" onClick={handleSaveCustomize}>Save</Button>
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
              const allCols = rearrangeTarget === "tomorrow" ? TOMORROW_COLS : FUTURE_COLS;
              const col = allCols.find((c) => c.id === id);
              if (!col) return null;
              return (
                <div key={id} className={`flex items-center gap-3 p-2.5 rounded-sm border cursor-grab active:cursor-grabbing select-none ${dragIdx === idx ? "border-black bg-gray-100" : "border-gray-200 bg-white"}`}
                  draggable onDragStart={() => setDragIdx(idx)} onDragOver={(e) => e.preventDefault()}
                  onDrop={() => { if (dragIdx === null || dragIdx === idx) return; const c = [...tempOrder]; const [m] = c.splice(dragIdx, 1); c.splice(idx, 0, m); setTempOrder(c); setDragIdx(null); }}
                  onDragEnd={() => setDragIdx(null)} data-testid={`drag-col-${id}`}>
                  <GripVertical className="w-4 h-4 text-gray-400 shrink-0" strokeWidth={1.5} />
                  <span className="text-sm font-medium">{col.label || "Actions"}</span>
                </div>
              );
            })}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" className="rounded-sm" onClick={() => setRearrangeOpen(false)}>Cancel</Button>
            <Button size="sm" className="rounded-sm bg-black text-white hover:bg-gray-800" onClick={handleSaveRearrange}>Save</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Upcoming;
