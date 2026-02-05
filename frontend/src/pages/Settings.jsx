import { useState, useEffect } from "react";
import { useAuth, API } from "@/App";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Settings as SettingsIcon,
  Plus,
  X,
  Save,
  MapPin,
  Users,
  Phone,
  Wrench,
  CheckCircle,
  Calendar,
  Target,
} from "lucide-react";

const Settings = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newItems, setNewItems] = useState({
    branches: "",
    service_advisors: "",
    sources: "",
    service_types: "",
    n_minus_1_confirmation_statuses: "",
    appointment_statuses: "",
    appointment_day_outcomes: "",
  });

  useEffect(() => {
    // DP and CRM have admin access
    if (user?.role !== "CRM" && user?.role !== "DP") {
      toast.error("Access denied");
      navigate("/dashboard");
      return;
    }
    fetchSettings();
  }, [user, navigate]);

  const fetchSettings = async () => {
    try {
      const response = await axios.get(`${API}/settings`, { withCredentials: true });
      setSettings(response.data);
    } catch (error) {
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async (field) => {
    const value = newItems[field].trim();
    if (!value) return;

    if (settings[field]?.includes(value)) {
      toast.error("Item already exists");
      return;
    }

    const updatedList = [...(settings[field] || []), value];
    await saveField(field, updatedList);
    setNewItems({ ...newItems, [field]: "" });
  };

  const handleRemoveItem = async (field, item) => {
    const updatedList = settings[field].filter((i) => i !== item);
    await saveField(field, updatedList);
  };

  const saveField = async (field, value) => {
    setSaving(true);
    try {
      await axios.put(`${API}/settings`, { [field]: value }, { withCredentials: true });
      setSettings({ ...settings, [field]: value });
      toast.success("Settings updated");
    } catch (error) {
      toast.error("Failed to update settings");
    } finally {
      setSaving(false);
    }
  };

  const settingsConfig = [
    {
      key: "branches",
      label: "Branches",
      icon: MapPin,
      description: "Service center locations",
    },
    {
      key: "service_advisors",
      label: "Service Advisors",
      icon: Users,
      description: "SA names for assignment",
    },
    {
      key: "sources",
      label: "Sources",
      icon: Phone,
      description: "Lead sources (SDR, Call, MYR, etc.)",
    },
    {
      key: "service_types",
      label: "Service Types",
      icon: Wrench,
      description: "Service categories (1FS, PMS, RR, etc.)",
    },
    {
      key: "n_minus_1_confirmation_statuses",
      label: "N-1 Confirmation Status",
      icon: CheckCircle,
      description: "Day-before confirmation statuses",
    },
    {
      key: "appointment_statuses",
      label: "Appointment Status",
      icon: Calendar,
      description: "Booked, Confirmed, Closed, etc.",
    },
    {
      key: "appointment_day_outcomes",
      label: "Day Outcomes",
      icon: Target,
      description: "Reported, Rescheduled, No-show, etc.",
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6" data-testid="settings-page">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-black text-white rounded-sm flex items-center justify-center">
          <SettingsIcon className="w-6 h-6" strokeWidth={1.5} />
        </div>
        <div>
          <h1 className="font-heading font-black text-3xl md:text-4xl tracking-tighter uppercase">
            Settings
          </h1>
          <p className="text-sm text-gray-500 mt-1">Manage dropdown options and lists</p>
        </div>
      </div>

      {/* Settings Cards */}
      <div className="grid gap-6">
        {settingsConfig.map((config) => (
          <Card key={config.key} className="border border-gray-200 rounded-sm shadow-none">
            <CardHeader className="border-b border-gray-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-sm flex items-center justify-center">
                  <config.icon className="w-5 h-5" strokeWidth={1.5} />
                </div>
                <div>
                  <CardTitle className="font-heading font-bold text-lg tracking-tight uppercase">
                    {config.label}
                  </CardTitle>
                  <p className="text-xs text-gray-500">{config.description}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {/* Add New */}
              <div className="flex gap-2 mb-4">
                <Input
                  placeholder={`Add new ${config.label.toLowerCase()}...`}
                  value={newItems[config.key]}
                  onChange={(e) => setNewItems({ ...newItems, [config.key]: e.target.value })}
                  onKeyDown={(e) => e.key === "Enter" && handleAddItem(config.key)}
                  className="rounded-sm"
                  data-testid={`input-${config.key}`}
                />
                <Button
                  onClick={() => handleAddItem(config.key)}
                  className="bg-black text-white hover:bg-gray-800 rounded-sm px-6"
                  disabled={saving || !newItems[config.key].trim()}
                  data-testid={`add-${config.key}`}
                >
                  <Plus className="w-4 h-4" strokeWidth={1.5} />
                </Button>
              </div>

              {/* Items */}
              <div className="flex flex-wrap gap-2">
                {settings[config.key]?.map((item) => (
                  <Badge
                    key={item}
                    variant="outline"
                    className="rounded-sm pl-3 pr-1 py-1.5 text-sm font-medium border-gray-300 hover:border-black group"
                  >
                    {item}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 ml-1 rounded-sm opacity-50 group-hover:opacity-100"
                      onClick={() => handleRemoveItem(config.key, item)}
                      data-testid={`remove-${config.key}-${item}`}
                    >
                      <X className="w-3 h-3" strokeWidth={2} />
                    </Button>
                  </Badge>
                ))}
                {(!settings[config.key] || settings[config.key].length === 0) && (
                  <p className="text-sm text-gray-400">No items added yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Settings;
