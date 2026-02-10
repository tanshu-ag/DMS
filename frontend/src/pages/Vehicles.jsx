import { Car } from "lucide-react";

const Vehicles = () => {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-black text-white rounded-sm flex items-center justify-center">
          <Car className="w-6 h-6" strokeWidth={1.5} />
        </div>
        <div>
          <h1 className="font-heading font-black text-3xl md:text-4xl tracking-tighter uppercase">
            Vehicles
          </h1>
          <p className="text-sm text-gray-500 mt-1">Manage customer vehicles</p>
        </div>
      </div>

      {/* Coming Soon */}
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-24 h-24 bg-gray-100 rounded-sm flex items-center justify-center mb-6">
          <Car className="w-12 h-12 text-gray-400" strokeWidth={1.5} />
        </div>
        <h2 className="font-heading font-bold text-2xl tracking-tight mb-2">Coming Soon</h2>
        <p className="text-gray-500 text-center max-w-md">
          Vehicle management features are under development. Stay tuned for updates.
        </p>
      </div>
    </div>
  );
};

export default Vehicles;
