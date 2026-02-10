import { CalendarRange } from "lucide-react";

const Upcoming = () => {
  return (
    <div className="space-y-6" data-testid="upcoming-page">
      <div>
        <h1 className="font-heading font-black text-3xl md:text-4xl tracking-tighter uppercase">
          Upcoming
        </h1>
        <p className="text-sm text-gray-500 font-mono mt-1">
          Future scheduled appointments
        </p>
      </div>

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
