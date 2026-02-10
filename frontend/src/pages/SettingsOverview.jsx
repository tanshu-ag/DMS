import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import {
  Settings as SettingsIcon,
  Building2,
  Users,
  MapPin,
  Shield,
  FileText,
  Package,
  Car,
  Wrench,
  UserCog,
  Calendar,
} from "lucide-react";

const SettingsOverview = () => {
  const navigate = useNavigate();

  const organizationSettings = [
    {
      title: "Organization",
      items: [
        { label: "Company Details", path: null, icon: Building2 },
        { label: "Branches", path: "/branches", icon: MapPin },
        { label: "Fiscal Year", path: null, icon: Calendar },
      ],
    },
    {
      title: "Users & Roles",
      items: [
        { label: "Users", path: "/users", icon: Users },
        { label: "Roles", path: null, icon: Shield },
        { label: "Permissions", path: null, icon: Shield },
      ],
    },
    {
      title: "General",
      items: [
        { label: "Templates", path: null, icon: FileText },
        { label: "Other Settings", path: "/other-settings", icon: SettingsIcon },
      ],
    },
  ];

  const moduleSettings = [
    {
      title: "Customer Relations",
      items: [
        { label: "Appointment Settings", path: null, icon: Calendar },
        { label: "Workflow Rules", path: null, icon: FileText },
      ],
    },
    {
      title: "Parts",
      items: [
        { label: "Part Categories", path: null, icon: Package },
        { label: "Inventory Settings", path: null, icon: Package },
      ],
    },
    {
      title: "Bodyshop",
      items: [
        { label: "Job Types", path: null, icon: Car },
        { label: "Estimation Templates", path: null, icon: FileText },
      ],
    },
    {
      title: "Mechanical",
      items: [
        { label: "Service Types", path: null, icon: Wrench },
        { label: "Maintenance Schedules", path: null, icon: Calendar },
      ],
    },
    {
      title: "HR",
      items: [
        { label: "Employee Categories", path: null, icon: UserCog },
        { label: "Leave Types", path: null, icon: Calendar },
      ],
    },
  ];

  const handleItemClick = (path) => {
    if (path) {
      navigate(path);
    }
  };

  const renderSettingsSection = (sectionTitle, groups) => (
    <div className="space-y-4">
      <h2 className="text-sm font-mono uppercase tracking-widest text-gray-500">
        {sectionTitle}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {groups.map((group, idx) => (
          <Card key={idx} className="border border-gray-200 rounded-sm shadow-none">
            <CardContent className="p-4">
              <h3 className="font-heading font-bold text-base tracking-tight mb-3">
                {group.title}
              </h3>
              <div className="space-y-2">
                {group.items.map((item, itemIdx) => (
                  <button
                    key={itemIdx}
                    onClick={() => handleItemClick(item.path)}
                    disabled={!item.path}
                    className={`w-full text-left py-2 px-3 rounded-sm text-sm flex items-center gap-3 transition-colors ${
                      item.path
                        ? "hover:bg-gray-100 cursor-pointer"
                        : "cursor-not-allowed hover:text-red-600"
                    }`}
                  >
                    <item.icon className="w-4 h-4 text-gray-400" strokeWidth={1.5} />
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-black text-white rounded-sm flex items-center justify-center">
          <SettingsIcon className="w-6 h-6" strokeWidth={1.5} />
        </div>
        <div>
          <h1 className="font-heading font-black text-3xl md:text-4xl tracking-tighter uppercase">
            Settings
          </h1>
          <p className="text-sm text-gray-500 mt-1">Configure your system preferences</p>
        </div>
      </div>

      {/* Organization Settings */}
      {renderSettingsSection("Organization Settings", organizationSettings)}

      {/* Module Settings */}
      <div className="pt-4">
        {renderSettingsSection("Module Settings", moduleSettings)}
      </div>
    </div>
  );
};

export default SettingsOverview;
