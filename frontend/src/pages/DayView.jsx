import { useState, useEffect } from "react";
import { useAuth, API } from "@/App";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Phone,
  MessageCircle,
  Clock,
  CheckCircle,
  Circle,
  XCircle,
  User,
  Car,
  ChevronRight,
  Filter,
  RefreshCw,
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

  const handleQuickAction = async (appointmentId, action, value) => {
    try {
      let updateData = {};
      if (action === "confirm") {
        updateData = { n_minus_1_confirmation_status: "Confirmed" };
      } else if (action === "outcome") {
        updateData = { appointment_day_outcome: value };
      }

      await axios.put(`${API}/appointments/${appointmentId}`, updateData, {
        withCredentials: true,
      });
      toast.success("Updated successfully");
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Update failed");
    }
  };

  // Group appointments by branch
  const groupedByBranch = appointments.reduce((acc, appt) => {
    if (!acc[appt.branch]) acc[appt.branch] = [];
    acc[appt.branch].push(appt);
    return acc;
  }, {});

  const getStatusIcon = (status) => {
    switch (status) {
      case "Confirmed":
        return <CheckCircle className="w-4 h-4" strokeWidth={1.5} />;
      case "Closed":
        return <XCircle className="w-4 h-4" strokeWidth={1.5} />;
      default:
        return <Circle className="w-4 h-4" strokeWidth={1.5} />;
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "Confirmed":
        return "status-confirmed";
      case "Closed":
        return "status-completed";
      default:
        return "status-pending";
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
        <CardContent className="p-4">
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
        </CardContent>
      </Card>

      {/* Appointments by Branch */}
      {Object.keys(groupedByBranch).length === 0 ? (
        <Card className="border border-gray-200 rounded-sm shadow-none">
          <CardContent className="p-12 text-center">
            <Clock className="w-16 h-16 mx-auto mb-4 text-gray-300" strokeWidth={1} />
            <p className="text-lg font-medium text-gray-500">No appointments for today</p>
            <p className="text-sm text-gray-400 mt-1">
              Click "New Appointment" to schedule one
            </p>
          </CardContent>
        </Card>
      ) : (
        Object.entries(groupedByBranch).map(([branch, appts]) => (
          <div key={branch} className="space-y-3">
            <div className="flex items-center gap-3">
              <h2 className="font-heading font-bold text-xl tracking-tight uppercase">{branch}</h2>
              <Badge variant="outline" className="rounded-sm border-black text-xs font-mono">
                {appts.length}
              </Badge>
            </div>
            <div className="grid gap-3">
              {appts.map((appt) => (
                <Card
                  key={appt.appointment_id}
                  className={`border border-gray-200 rounded-sm shadow-none hover:border-gray-400 transition-all cursor-pointer ${
                    appt.appointment_status === "Confirmed"
                      ? "appt-card-confirmed"
                      : appt.appointment_status === "Closed"
                      ? "appt-card-cancelled"
                      : "appt-card-pending"
                  }`}
                  onClick={() => navigate(`/appointments/${appt.appointment_id}`)}
                  data-testid={`appointment-card-${appt.appointment_id}`}
                >
                  <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                      {/* Time */}
                      <div className="flex items-center gap-3 md:w-20">
                        <Clock className="w-4 h-4 text-gray-400" strokeWidth={1.5} />
                        <span className="font-mono text-lg font-bold">{appt.appointment_time}</span>
                      </div>

                      {/* Customer Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" strokeWidth={1.5} />
                          <span className="font-medium truncate">{appt.customer_name}</span>
                          {appt.priority_customer && (
                            <Badge className="bg-black text-white rounded-sm text-[10px]">
                              PRIORITY
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                          <span className="font-mono">{appt.customer_phone}</span>
                          {appt.vehicle_reg_no && (
                            <span className="flex items-center gap-1">
                              <Car className="w-3 h-3" strokeWidth={1.5} />
                              {appt.vehicle_reg_no}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Service Info */}
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="rounded-sm text-xs font-mono">
                          {appt.service_type}
                        </Badge>
                        {appt.allocated_sa && (
                          <Badge variant="outline" className="rounded-sm text-xs">
                            {appt.allocated_sa}
                          </Badge>
                        )}
                      </div>

                      {/* Status */}
                      <div className="flex items-center gap-2">
                        <Badge className={`rounded-sm text-xs ${getStatusClass(appt.appointment_status)}`}>
                          {getStatusIcon(appt.appointment_status)}
                          <span className="ml-1">{appt.appointment_status}</span>
                        </Badge>
                        {appt.appointment_day_outcome && (
                          <Badge variant="outline" className="rounded-sm text-xs font-mono">
                            {appt.appointment_day_outcome}
                          </Badge>
                        )}
                      </div>

                      {/* Quick Actions */}
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="rounded-sm h-8 w-8"
                          onClick={() => window.open(`tel:${appt.customer_phone}`)}
                          data-testid={`call-${appt.appointment_id}`}
                        >
                          <Phone className="w-4 h-4" strokeWidth={1.5} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="rounded-sm h-8 w-8"
                          onClick={() =>
                            window.open(`https://wa.me/91${appt.customer_phone}`)
                          }
                          data-testid={`whatsapp-${appt.appointment_id}`}
                        >
                          <MessageCircle className="w-4 h-4" strokeWidth={1.5} />
                        </Button>

                        {/* Quick confirm for CRE */}
                        {(user?.role === "CRE" || user?.role === "CRM") &&
                          appt.n_minus_1_confirmation_status === "Pending" && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="rounded-sm h-8 text-xs"
                              onClick={() => handleQuickAction(appt.appointment_id, "confirm")}
                              data-testid={`confirm-${appt.appointment_id}`}
                            >
                              <CheckCircle className="w-3 h-3 mr-1" strokeWidth={1.5} />
                              Confirm
                            </Button>
                          )}

                        {/* Outcome buttons for Receptionist */}
                        {(user?.role === "Receptionist" || user?.role === "CRM") &&
                          !appt.appointment_day_outcome && (
                            <Select
                              onValueChange={(v) => handleQuickAction(appt.appointment_id, "outcome", v)}
                            >
                              <SelectTrigger className="w-28 h-8 rounded-sm text-xs" data-testid={`outcome-select-${appt.appointment_id}`}>
                                <SelectValue placeholder="Outcome" />
                              </SelectTrigger>
                              <SelectContent>
                                {settings?.appointment_day_outcomes?.map((o) => (
                                  <SelectItem key={o} value={o}>{o}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}

                        <ChevronRight className="w-4 h-4 text-gray-400" strokeWidth={1.5} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default DayView;
