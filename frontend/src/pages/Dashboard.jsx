import { useState, useEffect } from "react";
import { useAuth, API } from "@/App";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import {
  CalendarDays,
  Phone,
  ChevronRight,
  CheckCircle,
  Plus,
} from "lucide-react";

// Check if user has admin access (DP or CRM)
const hasAdminAccess = (role) => role === "DP" || role === "CRM";

// Dashboard tabs - internal views only (no navigation)
const dashboardTabs = [
  { id: "dp-dashboard", label: "DP Dashboard" },
  { id: "customer-relations", label: "Customer Relations" },
  { id: "parts", label: "Parts" },
  { id: "bodyshop", label: "Bodyshop" },
  { id: "mechanical", label: "Mechanical" },
  { id: "insurance", label: "Insurance" },
  { id: "hr", label: "HR" },
  { id: "customers", label: "Customers" },
];

// Coming Soon placeholder component for tabs
const ComingSoonContent = ({ title }) => (
  <div className="min-h-[50vh] flex flex-col items-center justify-center">
    <h2 className="font-heading font-black text-4xl md:text-5xl tracking-tighter uppercase mb-4 text-black">
      {title}
    </h2>
    <p className="text-3xl md:text-4xl font-bold text-gray-300">
      Coming Soon
    </p>
  </div>
);

// Customer Relations Dashboard Content (moved from main dashboard)
const CustomerRelationsContent = ({ stats, tasks, user, navigate }) => (
  <div className="space-y-6">
    {/* Stats Grid */}
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="border border-gray-200 rounded-sm shadow-none hover:border-gray-400 transition-colors">
        <CardContent className="p-6">
          <p className="text-[10px] font-mono uppercase tracking-widest text-gray-500 mb-2">
            Today Total
          </p>
          <p className="font-heading font-black text-4xl tracking-tighter">
            {stats?.today_total || 0}
          </p>
          <p className="text-xs text-gray-500 mt-1">appointments</p>
        </CardContent>
      </Card>

      <Card className="border border-gray-200 rounded-sm shadow-none hover:border-gray-400 transition-colors">
        <CardContent className="p-6">
          <p className="text-[10px] font-mono uppercase tracking-widest text-gray-500 mb-2">
            Pending Tomorrow
          </p>
          <p className="font-heading font-black text-4xl tracking-tighter">
            {stats?.pending_tomorrow || 0}
          </p>
          <p className="text-xs text-gray-500 mt-1">need confirmation</p>
        </CardContent>
      </Card>

      <Card className="border border-gray-200 rounded-sm shadow-none hover:border-gray-400 transition-colors">
        <CardContent className="p-6">
          <p className="text-[10px] font-mono uppercase tracking-widest text-gray-500 mb-2">
            No-Show Rate
          </p>
          <p className="font-heading font-black text-4xl tracking-tighter">
            {stats?.no_show_rate || 0}%
          </p>
          <p className="text-xs text-gray-500 mt-1">last 30 days</p>
        </CardContent>
      </Card>

      <Card className="border border-gray-200 rounded-sm shadow-none hover:border-gray-400 transition-colors">
        <CardContent className="p-6">
          <p className="text-[10px] font-mono uppercase tracking-widest text-gray-500 mb-2">
            Recovered
          </p>
          <p className="font-heading font-black text-4xl tracking-tighter">
            {stats?.recovered_count || 0}
          </p>
          <p className="text-xs text-gray-500 mt-1">lost customers</p>
        </CardContent>
      </Card>
    </div>

    {/* Main Grid */}
    <div className="grid lg:grid-cols-3 gap-6">
      {/* Pending Tasks */}
      <Card className="lg:col-span-2 border border-gray-200 rounded-sm shadow-none">
        <CardHeader className="border-b border-gray-100 pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="font-heading font-bold text-lg tracking-tight uppercase">
              Pending Confirmations
            </CardTitle>
            <Badge variant="outline" className="rounded-sm border-black text-xs font-mono">
              {tasks.length} Tasks
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {tasks.length === 0 ? (
            <div className="p-8 text-center">
              <CheckCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" strokeWidth={1} />
              <p className="text-sm text-gray-500">All caught up</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {tasks.slice(0, 5).map((task) => (
                <div
                  key={task.task_id}
                  className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => navigate(`/appointments/${task.appointment_id}`)}
                  data-testid={`task-${task.task_id}`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gray-100 rounded-sm flex items-center justify-center">
                      <Phone className="w-4 h-4" strokeWidth={1.5} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {task.appointment_info?.customer_name || "Customer"}
                      </p>
                      <p className="text-xs text-gray-500 font-mono">
                        {task.appointment_info?.customer_phone}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-mono">
                        {task.appointment_info?.appointment_time}
                      </p>
                      <p className="text-[10px] text-gray-400 font-mono">
                        {task.appointment_info?.appointment_date}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" strokeWidth={1.5} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* By Branch */}
      <Card className="border border-gray-200 rounded-sm shadow-none">
        <CardHeader className="border-b border-gray-100 pb-4">
          <CardTitle className="font-heading font-bold text-lg tracking-tight uppercase">
            Today by Branch
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {Object.keys(stats?.by_branch || {}).length === 0 ? (
            <div className="p-8 text-center">
              <CalendarDays className="w-12 h-12 mx-auto mb-3 text-gray-300" strokeWidth={1} />
              <p className="text-sm text-gray-500">No appointments today</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {Object.entries(stats?.by_branch || {}).map(([branch, count]) => (
                <div key={branch} className="p-4 flex items-center justify-between">
                  <span className="text-sm font-medium">{branch}</span>
                  <span className="font-mono text-lg font-bold">{count}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>

    {/* Source Funnel */}
    {user?.role === "CRM" && stats?.source_funnel && (
      <Card className="border border-gray-200 rounded-sm shadow-none">
        <CardHeader className="border-b border-gray-100 pb-4">
          <CardTitle className="font-heading font-bold text-lg tracking-tight uppercase">
            Source Funnel (30 Days)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {Object.entries(stats.source_funnel).map(([source, data]) => (
              <div key={source} className="space-y-2">
                <p className="text-xs font-mono uppercase tracking-wider text-gray-500">
                  {source}
                </p>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Booked</span>
                    <span className="font-mono font-bold">{data.booked}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Confirmed</span>
                    <span className="font-mono font-bold">{data.confirmed}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Reported</span>
                    <span className="font-mono font-bold">{data.reported}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )}
  </div>
);

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dp-dashboard");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, tasksRes] = await Promise.all([
          axios.get(`${API}/dashboard/stats`, { withCredentials: true }),
          axios.get(`${API}/tasks?status=pending`, { withCredentials: true }),
        ]);
        setStats(statsRes.data);
        setTasks(tasksRes.data);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Render tab content based on active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case "dp-dashboard":
        return <ComingSoonContent title="DP Dashboard" />;
      case "customer-relations":
        return (
          <CustomerRelationsContent 
            stats={stats} 
            tasks={tasks} 
            user={user} 
            navigate={navigate} 
          />
        );
      case "parts":
        return <ComingSoonContent title="Parts" />;
      case "bodyshop":
        return <ComingSoonContent title="Bodyshop" />;
      case "mechanical":
        return <ComingSoonContent title="Mechanical" />;
      case "insurance":
        return <ComingSoonContent title="Insurance" />;
      case "hr":
        return <ComingSoonContent title="HR" />;
      case "customers":
        return <ComingSoonContent title="Customers" />;
      default:
        return <ComingSoonContent title="Dashboard" />;
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
    <div className="space-y-6" data-testid="dashboard-page">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-heading font-black text-3xl md:text-4xl tracking-tighter uppercase">
            Dashboard
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Welcome back, {user?.name}
          </p>
        </div>
        {/* Show New Appointment button ONLY on Customer Relations tab */}
        {activeTab === "customer-relations" && (
          <Button
            onClick={() => navigate("/new-appointment")}
            className="bg-black text-white hover:bg-gray-800 rounded-sm font-mono text-xs uppercase tracking-wider"
            data-testid="new-appointment-btn"
          >
            <Plus className="w-4 h-4 mr-2" strokeWidth={1.5} />
            New Appointment
          </Button>
        )}
      </div>

      {/* Module Tabs - Internal views only, no navigation */}
      <div className="border-b border-gray-200">
        <div className="flex gap-1 overflow-x-auto pb-px">
          {dashboardTabs.map((tab) => (
            <Button
              key={tab.id}
              variant="ghost"
              className={`px-4 py-2 rounded-none border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === tab.id
                  ? "border-black text-black"
                  : "border-transparent text-gray-500 hover:text-black hover:border-gray-300"
              }`}
              onClick={() => setActiveTab(tab.id)}
              data-testid={`tab-${tab.id}`}
            >
              {tab.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {renderTabContent()}
    </div>
  );
};

export default Dashboard;
