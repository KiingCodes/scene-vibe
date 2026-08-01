import VenueManagementPortal from "@/components/venue-portal/VenueManagementPortal";
import Navbar from "@/components/Navbar";

const VenuePortalPage = () => (
  <div className="min-h-screen">
    <Navbar />
    <main className="px-3 sm:px-6 pt-28 pb-16">
      <VenueManagementPortal />
    </main>
  </div>
);

export default VenuePortalPage;