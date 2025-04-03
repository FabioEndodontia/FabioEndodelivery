import { useState } from "react";
import QuickStats from "@/components/dashboard/QuickStats";
import RecentActivity from "@/components/dashboard/RecentActivity";
import UpcomingAppointments from "@/components/dashboard/UpcomingAppointments";
import QuickActions from "@/components/dashboard/QuickActions";
import PaymentOverview from "@/components/dashboard/PaymentOverview";
import TopPractices from "@/components/dashboard/TopPractices";
import NewTreatmentDialog from "@/components/NewTreatmentDialog";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const [treatmentDialogOpen, setTreatmentDialogOpen] = useState(false);
  
  return (
    <>
      <QuickStats />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentActivity />
          <UpcomingAppointments />
        </div>
        
        <div className="lg:col-span-1 space-y-6">
          <QuickActions />
          <PaymentOverview />
          <TopPractices />
        </div>
      </div>
      
      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-10">
        <Button 
          size="lg" 
          className="bg-primary-600 hover:bg-primary-700 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg"
          onClick={() => setTreatmentDialogOpen(true)}
        >
          <i className="ri-add-line text-2xl"></i>
        </Button>
      </div>
      
      <NewTreatmentDialog
        open={treatmentDialogOpen}
        onOpenChange={setTreatmentDialogOpen}
      />
    </>
  );
}
