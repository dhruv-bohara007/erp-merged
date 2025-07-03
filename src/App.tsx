
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import InvoiceForm from "./components/InvoiceForm";
import InvoiceList from "./components/InvoiceList";
import ClientManagement from "./components/ClientManagement";
import Payments from "./components/Payments";
import Reports from "./components/Reports";
import Settings from "./components/Settings";
import Navigation from "./components/Navigation";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/invoices" element={
              <div>
                <Navigation />
                <div className="lg:pl-64">
                  <InvoiceList />
                </div>
              </div>
            } />
            <Route path="/invoices/new" element={
              <div>
                <Navigation />
                <div className="lg:pl-64">
                  <InvoiceForm />
                </div>
              </div>
            } />
            <Route path="/clients" element={
              <div>
                <Navigation />
                <div className="lg:pl-64">
                  <ClientManagement />
                </div>
              </div>
            } />
            <Route path="/payments" element={
              <div>
                <Navigation />
                <div className="lg:pl-64">
                  <Payments />
                </div>
              </div>
            } />
            <Route path="/reports" element={
              <div>
                <Navigation />
                <div className="lg:pl-64">
                  <Reports />
                </div>
              </div>
            } />
            <Route path="/settings" element={
              <div>
                <Navigation />
                <div className="lg:pl-64">
                  <Settings />
                </div>
              </div>
            } />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
