import { useParams } from "react-router-dom";

const moduleNames = {
  parts: "Parts",
  bodyshop: "Bodyshop",
  mechanical: "Mechanical",
  insurance: "Insurance",
  hr: "HR",
  customers: "Customers",
};

const ComingSoon = () => {
  const { module } = useParams();
  const moduleName = moduleNames[module] || module;

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center" data-testid="coming-soon-page">
      <h1 className="font-heading font-black text-5xl md:text-6xl tracking-tighter uppercase mb-4 text-black">
        {moduleName}
      </h1>
      <p className="text-4xl md:text-5xl font-bold text-gray-300 mb-4">
        Coming Soon
      </p>
      <p className="text-sm text-gray-400">
        Module under development
      </p>
    </div>
  );
};

export default ComingSoon;
