import { useState, useCallback } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { BookingProvider } from "@/context/BookingContext";
import TopNav from "@/components/TopNav";
import BottomNav from "@/components/BottomNav";
import Footer from "@/components/Footer";
import SplashScreen from "@/components/SplashScreen";
import ToastContainer from "@/components/Toast";
import HomeView from "@/views/HomeView";
import ResultsView from "@/views/ResultsView";
import SeatsView from "@/views/SeatsView";
import CheckoutView from "@/views/CheckoutView";
import ConfirmationView from "@/views/ConfirmationView";
import AllTripsView from "@/views/AllTripsView";

function AppRoutes() {
  const location = useLocation();
  return (
    <div key={location.pathname} className="animate-fade-in">
      <Routes location={location}>
        <Route path="/" element={<HomeView />} />
        <Route path="/results" element={<ResultsView />} />
        <Route path="/select-seats" element={<SeatsView />} />
        <Route path="/checkout" element={<CheckoutView />} />
        <Route path="/ticket" element={<ConfirmationView />} />
        <Route path="/confirmation" element={<ConfirmationView />} />
        <Route path="/all-trips" element={<AllTripsView />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

function AppInner() {
  const [splashDone, setSplashDone] = useState(false);
  const handleSplashComplete = useCallback(() => setSplashDone(true), []);

  return (
    <>
      {!splashDone && <SplashScreen onComplete={handleSplashComplete} />}
      <div className={`flex min-h-screen flex-col transition-opacity duration-500 ${splashDone ? "opacity-100" : "opacity-0"}`}>
        <TopNav />
        <main className="flex-1 flex flex-col">
          <AppRoutes />
        </main>
        {/* Spacer for bottom nav on mobile */}
        <div className="h-20 md:hidden" />
        <Footer />
        <BottomNav />
      </div>
      <ToastContainer />
    </>
  );
}

export default function App() {
  return (
    <BookingProvider>
      <AppInner />
    </BookingProvider>
  );
}
