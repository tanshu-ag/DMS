import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, History as HistoryIcon, Filter, RefreshCw, Eye, SlidersHorizontal, GripVertical, Pencil, MoreVertical } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, addDays, subDays, addMonths, subMonths, addYears, subYears, isAfter, startOfDay, startOfMonth, startOfYear } from "date-fns";
import axios from "axios";
import { useAuth, API } from "@/App";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const HISTORY_COLS = [
  { id: "date", label: "Date" },
  { id: "customer", label: "Customer" },
  { id: "vehicle", label: "Vehicle" },
  { id: "service", label: "Service" },
  { id: "status", label: "Status" },
  { id: "actions", label: "" },
];
const HIST_CUSTOMIZABLE = [];
const HIST_CUSTOM_LABELS = {};

const History = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "date");
  const today = startOfDay(new Date());
  const yesterday = subDays(today, 1);

  const [selectedDate, setSelectedDate] = useState(yesterday);
  const [selectedMonth, setSelectedMonth] = useState(yesterday);
  const [selectedYear, setSelectedYear] = useState(yesterday);
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const [dateAppointments, setDateAppointments] = useState([]);
  const [monthAppointments, setMonthAppointments] = useState([]);
  const [yearAppointments, setYearAppointments] = useState([]);
  const [customRangeAppointments, setCustomRangeAppointments] = useState([]);
  const [customRangeApplied, setCustomRangeApplied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  // Filter state — keys match backend query params
  const [filters, setFilters] = useState({
    source: "",
    sa: "",
    service_type: "",
    status: "",
  });
  const [settings, setSettings] = useState({});
  // Column preferences
  const [hiddenCols, setHiddenCols] = useState([]);
  const [colOrder, setColOrder] = useState(HISTORY_COLS.map((c) => c.id));
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [rearrangeOpen, setRearrangeOpen] = useState(false);
  const [tempHidden, setTempHidden] = useState([]);
  const [tempOrder, setTempOrder] = useState([]);
  const [dragIdx, setDragIdx] = useState(null);

  useEffect(() => {
    if (activeTab) {
      setSearchParams({ tab: activeTab });
    }
  }, [activeTab, setSearchParams]);

  useEffect(() => {
    fetchSettings();
    loadColPrefs();
  }, []);

  useEffect(() => {
    if (activeTab === "date") {
      fetchDateAppointments();
    } else if (activeTab === "month") {
      fetchMonthAppointments();
    } else if (activeTab === "year") {
      fetchYearAppointments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, selectedMonth, selectedYear, activeTab, filters]);

  const fetchSettings = async () => {
    try {
      const response = await axios.get(`${API}/settings`, { withCredentials: true });
      setSettings(response.data);
    } catch (error) {
      console.error("Failed to load settings");
    }
  };

  const loadColPrefs = async () => {
    try {
      const res = await axios.get(`${API}/user-preferences/history`, { withCredentials: true });
      if (res.data.hidden_columns?.length) setHiddenCols(res.data.hidden_columns);
      if (res.data.column_order?.length) setColOrder(res.data.column_order);
    } catch {}
  };

  const saveColPrefs = async (hidden, order) => {
    try {
      await axios.put(`${API}/user-preferences/history`, { hidden_columns: hidden, column_order: order }, { withCredentials: true });
    } catch {}
  };

  const handleSaveCustomize = () => {
    setHiddenCols(tempHidden);
    saveColPrefs(tempHidden, colOrder);
    setCustomizeOpen(false);
    toast.success("Column visibility saved");
  };

  const handleSaveRearrange = () => {
    setColOrder(tempOrder);
    saveColPrefs(hiddenCols, tempOrder);
    setRearrangeOpen(false);
    toast.success("Column order saved");
  };

  const visibleCols = colOrder.filter((id) => !hiddenCols.includes(id)).map((id) => HISTORY_COLS.find((c) => c.id === id)).filter(Boolean);

  const renderHistCell = (colId, apt) => {
    switch (colId) {
      case "date": return <span className="text-sm">{apt.appointment_date?.split("-").reverse().join("-")}</span>;
      case "customer": return <span className="text-sm font-medium">{apt.customer_name}</span>;
      case "vehicle": return <span className="text-sm">{apt.vehicle_reg_no}</span>;
      case "service": return <Badge variant="outline" className="rounded-sm">{apt.service_type}</Badge>;
      case "status": return <Badge variant="outline" className="rounded-sm">{apt.appointment_status}</Badge>;
      case "actions":
        return (
          <div className="flex items-center gap-1 justify-center">
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-sm" onClick={() => navigate(`/appointments/${apt.appointment_id}`)} data-testid={`action-btn-${apt.appointment_id}`}>
              <Eye className="w-4 h-4" strokeWidth={1.5} />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-sm" onClick={() => navigate(`/appointments/${apt.appointment_id}?edit=true`)} data-testid={`edit-btn-${apt.appointment_id}`}>
              <Edit2 className="w-4 h-4" strokeWidth={1.5} />
            </Button>
          </div>
        );
      default: return null;
    }
  };

  const buildFilterParams = (params) => {
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    return params;
  };

  const fetchDateAppointments = async () => {
    setLoading(true);
    try {
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      const params = buildFilterParams(new URLSearchParams({ view: "day", date: dateStr }));
      const response = await axios.get(`${API}/appointments?${params}`, { withCredentials: true });
      setDateAppointments(response.data);
    } catch (error) {
      toast.error("Failed to load appointments");
    } finally {
      setLoading(false);
    }
  };

  const fetchMonthAppointments = async () => {
    setLoading(true);
    try {
      const month = selectedMonth.getMonth() + 1;
      const year = selectedMonth.getFullYear();
      const params = buildFilterParams(new URLSearchParams({ view: "month", month: month.toString(), year: year.toString() }));
      const response = await axios.get(`${API}/appointments?${params}`, { withCredentials: true });
      setMonthAppointments(response.data);
    } catch (error) {
      toast.error("Failed to load appointments");
    } finally {
      setLoading(false);
    }
  };

  const fetchYearAppointments = async () => {
    setLoading(true);
    try {
      const year = selectedYear.getFullYear();
      const params = buildFilterParams(new URLSearchParams({ view: "year", year: year.toString() }));
      const response = await axios.get(`${API}/appointments?${params}`, { withCredentials: true });
      setYearAppointments(response.data);
    } catch (error) {
      toast.error("Failed to load appointments");
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomRangeAppointments = async () => {
    if (!fromDate || !toDate) {
      toast.error("Please select both dates");
      return;
    }
    setLoading(true);
    setCustomRangeApplied(true);
    try {
      const fromStr = format(fromDate, "yyyy-MM-dd");
      const toStr = format(toDate, "yyyy-MM-dd");
      const params = buildFilterParams(new URLSearchParams({ view: "custom", date_from: fromStr, date_to: toStr }));
      const response = await axios.get(`${API}/appointments?${params}`, { withCredentials: true });
      setCustomRangeAppointments(response.data);
    } catch (error) {
      toast.error("Failed to load appointments");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    if (activeTab === "date") fetchDateAppointments();
    else if (activeTab === "month") fetchMonthAppointments();
    else if (activeTab === "year") fetchYearAppointments();
    else if (activeTab === "custom") fetchCustomRangeAppointments();
  };

  // Date navigation — history only goes up to yesterday
  const handlePrevDate = () => setSelectedDate(subDays(selectedDate, 1));
  const handleNextDate = () => {
    const newDate = addDays(selectedDate, 1);
    if (!isAfter(newDate, yesterday)) setSelectedDate(newDate);
  };
  const canGoForwardDate = !isAfter(addDays(selectedDate, 1), yesterday);

  // Month navigation
  const handlePrevMonth = () => setSelectedMonth(subMonths(selectedMonth, 1));
  const handleNextMonth = () => {
    const newMonth = addMonths(selectedMonth, 1);
    if (!isAfter(startOfMonth(newMonth), startOfMonth(yesterday))) setSelectedMonth(newMonth);
  };
  const canGoForwardMonth = !isAfter(startOfMonth(addMonths(selectedMonth, 1)), startOfMonth(yesterday));

  // Year navigation
  const handlePrevYear = () => setSelectedYear(subYears(selectedYear, 1));
  const handleNextYear = () => {
    const newYear = addYears(selectedYear, 1);
    if (!isAfter(startOfYear(newYear), startOfYear(yesterday))) setSelectedYear(newYear);
  };
  const canGoForwardYear = !isAfter(startOfYear(addYears(selectedYear, 1)), startOfYear(yesterday));

  const updateFilter = (key, v) => {
    setFilters((prev) => ({ ...prev, [key]: v === "all" ? "" : v }));
  };

  const AppointmentTable = ({ appointments }) => (
    <Card className="border border-gray-200 rounded-sm shadow-none overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="table-header bg-gray-50">
            {visibleCols.map((col) => (
              <TableHead key={col.id} className={`text-xs${col.id === "actions" ? " w-12" : ""}`}>{col.label}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {appointments.length === 0 ? (
            <TableRow>
              <TableCell colSpan={visibleCols.length} className="text-center text-gray-400 py-8">
                No appointments found
              </TableCell>
            </TableRow>
          ) : (
            appointments.map((apt) => (
              <TableRow key={apt.appointment_id} className="hover:bg-gray-50">
                {visibleCols.map((col) => (
                  <TableCell key={col.id} className="whitespace-nowrap">
                    {renderHistCell(col.id, apt)}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </Card>
  );

  const FilterDialog = () => (
    <Dialog open={filterOpen} onOpenChange={setFilterOpen}>
      <DialogContent className="rounded-sm max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-heading font-bold text-xl tracking-tight uppercase">
            Filters
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 pt-4">
          <div>
            <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1.5 block">
              Source
            </Label>
            <Select
              value={filters.source || "all"}
              onValueChange={(v) => updateFilter("source", v)}
            >
              <SelectTrigger className="rounded-sm" data-testid="history-filter-source">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {settings.sources?.map((src) => (
                  <SelectItem key={src} value={src}>{src}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1.5 block">
              Service Advisor
            </Label>
            <Select
              value={filters.sa || "all"}
              onValueChange={(v) => updateFilter("sa", v)}
            >
              <SelectTrigger className="rounded-sm" data-testid="history-filter-sa">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {settings.service_advisors?.map((sa) => (
                  <SelectItem key={sa} value={sa}>{sa}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1.5 block">
              Service Type
            </Label>
            <Select
              value={filters.service_type || "all"}
              onValueChange={(v) => updateFilter("service_type", v)}
            >
              <SelectTrigger className="rounded-sm" data-testid="history-filter-service-type">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {settings.service_types?.map((st) => (
                  <SelectItem key={st} value={st}>{st}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1.5 block">
              Status
            </Label>
            <Select
              value={filters.status || "all"}
              onValueChange={(v) => updateFilter("status", v)}
            >
              <SelectTrigger className="rounded-sm" data-testid="history-filter-status">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {settings.appointment_statuses?.map((st) => (
                  <SelectItem key={st} value={st}>{st}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-4">
          <Button
            variant="outline"
            className="rounded-sm"
            onClick={() => {
              setFilters({ source: "", sa: "", service_type: "", status: "" });
            }}
            data-testid="history-filter-clear"
          >
            Clear All
          </Button>
          <Button
            className="bg-black text-white hover:bg-gray-800 rounded-sm"
            onClick={() => setFilterOpen(false)}
            data-testid="history-filter-apply"
          >
            Apply
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6" data-testid="history-page">
      {/* Header with Refresh */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-black text-white rounded-sm flex items-center justify-center">
            <HistoryIcon className="w-6 h-6" strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="font-heading font-black text-3xl md:text-4xl tracking-tighter uppercase">
              History
            </h1>
            <p className="text-sm text-gray-500 mt-1">Appointment History</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 rounded-sm"
            onClick={() => setFilterOpen(true)}
            data-testid="history-filter-btn"
          >
            <Filter className="w-4 h-4" strokeWidth={1.5} />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 rounded-sm"
            onClick={handleRefresh}
            data-testid="history-refresh-btn"
          >
            <RefreshCw className="w-4 h-4" strokeWidth={1.5} />
          </Button>
        </div>
      </div>

      {/* Column Controls */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" className="rounded-sm h-8 text-xs gap-1.5" data-testid="customize-columns-btn" onClick={() => { setTempHidden([...hiddenCols]); setCustomizeOpen(true); }}>
          <SlidersHorizontal className="w-3.5 h-3.5" strokeWidth={1.5} />Customize Columns
        </Button>
        <Button variant="outline" size="sm" className="rounded-sm h-8 text-xs gap-1.5" data-testid="rearrange-columns-btn" onClick={() => { setTempOrder(colOrder.filter((id) => !hiddenCols.includes(id))); setRearrangeOpen(true); }}>
          <GripVertical className="w-3.5 h-3.5" strokeWidth={1.5} />Rearrange Columns
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-2xl grid-cols-4 mb-6">
          <TabsTrigger value="date" className="rounded-sm" data-testid="history-tab-date">Date</TabsTrigger>
          <TabsTrigger value="month" className="rounded-sm" data-testid="history-tab-month">Month</TabsTrigger>
          <TabsTrigger value="year" className="rounded-sm" data-testid="history-tab-year">Year</TabsTrigger>
          <TabsTrigger value="custom" className="rounded-sm" data-testid="history-tab-custom">Custom Range</TabsTrigger>
        </TabsList>

        {/* Date Tab */}
        <TabsContent value="date" className="mt-0 space-y-6">
          <div className="flex items-center justify-center gap-2">
            <Button variant="ghost" size="icon" onClick={handlePrevDate} className="h-10 w-10 rounded-sm" data-testid="date-prev-btn">
              <ChevronLeft className="w-5 h-5" strokeWidth={1.5} />
            </Button>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="min-w-[200px] rounded-sm font-mono text-sm" data-testid="date-picker-btn">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(selectedDate, "dd-MM-yyyy")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 rounded-sm" align="center">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  disabled={(date) => isAfter(date, yesterday)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <Button variant="ghost" size="icon" onClick={handleNextDate} disabled={!canGoForwardDate} className="h-10 w-10 rounded-sm" data-testid="date-next-btn">
              <ChevronRight className="w-5 h-5" strokeWidth={1.5} />
            </Button>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <AppointmentTable appointments={dateAppointments} />
          )}
        </TabsContent>

        {/* Month Tab */}
        <TabsContent value="month" className="mt-0 space-y-6">
          <div className="flex items-center justify-center gap-2">
            <Button variant="ghost" size="icon" onClick={handlePrevMonth} className="h-10 w-10 rounded-sm">
              <ChevronLeft className="w-5 h-5" strokeWidth={1.5} />
            </Button>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="min-w-[200px] rounded-sm font-mono text-sm">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(selectedMonth, "MMMM yyyy")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 rounded-sm" align="center">
                <Calendar
                  mode="single"
                  selected={selectedMonth}
                  onSelect={(date) => date && setSelectedMonth(startOfMonth(date))}
                  disabled={(date) => isAfter(startOfMonth(date), startOfMonth(today))}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <Button variant="ghost" size="icon" onClick={handleNextMonth} disabled={!canGoForwardMonth} className="h-10 w-10 rounded-sm">
              <ChevronRight className="w-5 h-5" strokeWidth={1.5} />
            </Button>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <AppointmentTable appointments={monthAppointments} />
          )}
        </TabsContent>

        {/* Year Tab */}
        <TabsContent value="year" className="mt-0 space-y-6">
          <div className="flex items-center justify-center gap-2">
            <Button variant="ghost" size="icon" onClick={handlePrevYear} className="h-10 w-10 rounded-sm">
              <ChevronLeft className="w-5 h-5" strokeWidth={1.5} />
            </Button>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="min-w-[200px] rounded-sm font-mono text-sm">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(selectedYear, "yyyy")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 rounded-sm" align="center">
                <Calendar
                  mode="single"
                  selected={selectedYear}
                  onSelect={(date) => date && setSelectedYear(startOfYear(date))}
                  disabled={(date) => isAfter(startOfYear(date), startOfYear(today))}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <Button variant="ghost" size="icon" onClick={handleNextYear} disabled={!canGoForwardYear} className="h-10 w-10 rounded-sm">
              <ChevronRight className="w-5 h-5" strokeWidth={1.5} />
            </Button>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <AppointmentTable appointments={yearAppointments} />
          )}
        </TabsContent>

        {/* Custom Range Tab */}
        <TabsContent value="custom" className="mt-0 space-y-6">
          <Card className="border border-gray-200 rounded-sm shadow-none p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div>
                <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2 block">
                  From Date
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full rounded-sm justify-start font-mono text-sm" data-testid="custom-from-btn">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {fromDate ? format(fromDate, "dd-MM-yyyy") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 rounded-sm" align="start">
                    <Calendar
                      mode="single"
                      selected={fromDate}
                      onSelect={setFromDate}
                      disabled={(date) => isAfter(date, yesterday)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2 block">
                  To Date
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full rounded-sm justify-start font-mono text-sm" data-testid="custom-to-btn">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {toDate ? format(toDate, "dd-MM-yyyy") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 rounded-sm" align="start">
                    <Calendar
                      mode="single"
                      selected={toDate}
                      onSelect={setToDate}
                      disabled={(date) => isAfter(date, today) || (fromDate && date < fromDate)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Button
                  onClick={fetchCustomRangeAppointments}
                  disabled={!fromDate || !toDate || loading}
                  className="w-full bg-black text-white hover:bg-gray-800 rounded-sm font-mono text-xs uppercase tracking-wider"
                  data-testid="custom-apply-btn"
                >
                  Apply
                </Button>
              </div>
            </div>
          </Card>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : customRangeApplied ? (
            customRangeAppointments.length > 0 ? (
              <AppointmentTable appointments={customRangeAppointments} />
            ) : (
              <Card className="border border-gray-200 rounded-sm shadow-none p-12 text-center">
                <p className="text-gray-400">No data found, select different dates and click on Apply</p>
              </Card>
            )
          ) : (
            <Card className="border border-gray-200 rounded-sm shadow-none p-12 text-center">
              <p className="text-gray-400">Select date range and click Apply to view appointments</p>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Filter Dialog */}
      <FilterDialog />

      {/* Customize Columns Modal */}
      <Dialog open={customizeOpen} onOpenChange={setCustomizeOpen}>
        <DialogContent className="sm:max-w-md" data-testid="customize-columns-modal">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold uppercase tracking-tight">Customize Columns</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {HIST_CUSTOMIZABLE.map((id) => (
              <label key={id} className="flex items-center gap-3 cursor-pointer" data-testid={`toggle-col-${id}`}>
                <input type="checkbox" checked={!tempHidden.includes(id)} onChange={() => setTempHidden((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])} className="h-4 w-4 rounded border-gray-300 accent-black" />
                <span className="text-sm font-medium">{HIST_CUSTOM_LABELS[id]}</span>
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
              const col = HISTORY_COLS.find((c) => c.id === id);
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

export default History;
