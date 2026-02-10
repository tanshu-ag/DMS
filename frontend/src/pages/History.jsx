import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, History as HistoryIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, addDays, subDays, isAfter, startOfDay } from "date-fns";
import MonthView from "./MonthView";
import YearView from "./YearView";
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

const History = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "date");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const [dateAppointments, setDateAppointments] = useState([]);
  const [customRangeAppointments, setCustomRangeAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const today = startOfDay(new Date());

  useEffect(() => {
    if (activeTab) {
      setSearchParams({ tab: activeTab });
    }
  }, [activeTab, setSearchParams]);

  useEffect(() => {
    if (activeTab === "date") {
      fetchDateAppointments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, activeTab]);

  const fetchDateAppointments = async () => {
    setLoading(true);
    try {
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      const response = await axios.get(
        `${API}/appointments?view=day&date=${dateStr}`,
        { withCredentials: true }
      );
      setDateAppointments(response.data);
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
    try {
      const fromStr = format(fromDate, "yyyy-MM-dd");
      const toStr = format(toDate, "yyyy-MM-dd");
      const response = await axios.get(
        `${API}/appointments?from=${fromStr}&to=${toStr}`,
        { withCredentials: true }
      );
      setCustomRangeAppointments(response.data);
    } catch (error) {
      toast.error("Failed to load appointments");
    } finally {
      setLoading(false);
    }
  };

  const handlePrevDate = () => {
    const newDate = subDays(selectedDate, 1);
    setSelectedDate(newDate);
  };

  const handleNextDate = () => {
    const newDate = addDays(selectedDate, 1);
    if (!isAfter(newDate, today)) {
      setSelectedDate(newDate);
    }
  };

  const canGoForward = !isAfter(addDays(selectedDate, 1), today);

  const AppointmentTable = ({ appointments }) => (
    <Card className="border border-gray-200 rounded-sm shadow-none overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="table-header bg-gray-50">
            <TableHead className="text-xs">Date</TableHead>
            <TableHead className="text-xs">Customer</TableHead>
            <TableHead className="text-xs">Vehicle</TableHead>
            <TableHead className="text-xs">Service</TableHead>
            <TableHead className="text-xs">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {appointments.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-gray-400 py-8">
                No appointments found
              </TableCell>
            </TableRow>
          ) : (
            appointments.map((apt) => (
              <TableRow key={apt.appointment_id} className="hover:bg-gray-50">
                <TableCell className="text-sm">
                  {format(new Date(apt.appointment_date), "dd MMM yyyy")}
                </TableCell>
                <TableCell className="font-medium">{apt.customer_name}</TableCell>
                <TableCell className="text-sm">{apt.vehicle_reg || "-"}</TableCell>
                <TableCell className="text-sm">{apt.service_type}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="rounded-sm">
                    {apt.appointment_status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </Card>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
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

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-2xl grid-cols-4 mb-6">
          <TabsTrigger value="date" className="rounded-sm">
            Date
          </TabsTrigger>
          <TabsTrigger value="month" className="rounded-sm">
            Month
          </TabsTrigger>
          <TabsTrigger value="year" className="rounded-sm">
            Year
          </TabsTrigger>
          <TabsTrigger value="custom" className="rounded-sm">
            Custom Range
          </TabsTrigger>
        </TabsList>

        {/* Date Tab */}
        <TabsContent value="date" className="mt-0 space-y-6">
          {/* Date Navigator */}
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePrevDate}
              className="h-10 w-10 rounded-sm"
            >
              <ChevronLeft className="w-5 h-5" strokeWidth={1.5} />
            </Button>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="min-w-[200px] rounded-sm font-mono text-sm"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(selectedDate, "dd-MM-yyyy")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 rounded-sm" align="center">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  disabled={(date) => isAfter(date, today)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleNextDate}
              disabled={!canGoForward}
              className="h-10 w-10 rounded-sm"
            >
              <ChevronRight className="w-5 h-5" strokeWidth={1.5} />
            </Button>
          </div>

          {/* Date Appointments Table */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <AppointmentTable appointments={dateAppointments} />
          )}
        </TabsContent>

        {/* Month Tab */}
        <TabsContent value="month" className="mt-0">
          <MonthView />
        </TabsContent>

        {/* Year Tab */}
        <TabsContent value="year" className="mt-0">
          <YearView />
        </TabsContent>

        {/* Custom Range Tab */}
        <TabsContent value="custom" className="mt-0 space-y-6">
          {/* Date Range Selectors */}
          <Card className="border border-gray-200 rounded-sm shadow-none p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div>
                <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2 block">
                  From Date
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full rounded-sm justify-start font-mono text-sm"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {fromDate ? format(fromDate, "dd-MM-yyyy") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 rounded-sm" align="start">
                    <Calendar
                      mode="single"
                      selected={fromDate}
                      onSelect={setFromDate}
                      disabled={(date) => isAfter(date, today)}
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
                    <Button
                      variant="outline"
                      className="w-full rounded-sm justify-start font-mono text-sm"
                    >
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
                >
                  Apply
                </Button>
              </div>
            </div>
          </Card>

          {/* Custom Range Appointments Table */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : customRangeAppointments.length > 0 ? (
            <AppointmentTable appointments={customRangeAppointments} />
          ) : (
            <Card className="border border-gray-200 rounded-sm shadow-none p-12 text-center">
              <p className="text-gray-400">Select date range and click Apply to view appointments</p>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default History;
