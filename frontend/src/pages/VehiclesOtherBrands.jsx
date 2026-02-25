import { Car } from "lucide-react";

const VehiclesOtherBrands = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center" data-testid="other-brands-page">
      <div className="w-20 h-20 bg-gray-100 rounded-sm flex items-center justify-center mb-6">
        <Car className="w-10 h-10 text-gray-400" strokeWidth={1.5} />
      </div>
      <h1 className="font-heading font-black text-4xl md:text-5xl tracking-tighter uppercase mb-2">
        Other Brands
      </h1>
      <p className="text-xl text-gray-500 font-medium mb-4">Coming Soon</p>
      <p className="text-sm text-gray-400 max-w-md">
        This module will be enabled later.
      </p>
    </div>
  );
};

export default VehiclesOtherBrands;
