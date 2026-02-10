import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DayView from "./DayView";
import MonthView from "./MonthView";
import YearView from "./YearView";

const Appointment = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(searchParams.get("view") || "today");

  useEffect(() => {
    // Update URL when tab changes
    if (activeTab) {
      setSearchParams({ view: activeTab });
    }
  }, [activeTab, setSearchParams]);

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3 mb-6">
          <TabsTrigger value="today" className="rounded-sm">
            Today
          </TabsTrigger>
          <TabsTrigger value="month" className="rounded-sm">
            Month View
          </TabsTrigger>
          <TabsTrigger value="year" className="rounded-sm">
            Year View
          </TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="mt-0">
          <DayView />
        </TabsContent>

        <TabsContent value="month" className="mt-0">
          <MonthView />
        </TabsContent>

        <TabsContent value="year" className="mt-0">
          <YearView />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Appointment;
