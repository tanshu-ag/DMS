import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CalendarRange, RefreshCw } from "lucide-react";

const Upcoming = () => {
  const navigate = useNavigate();

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

      {/* Placeholder */}
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <CalendarRange className="w-12 h-12 text-gray-300 mb-4" strokeWidth={1} />
        <p className="text-sm font-mono uppercase tracking-wider text-gray-400">
          Coming Soon
        </p>
      </div>
    </div>
  );
};

export default Upcoming;
