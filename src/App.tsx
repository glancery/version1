import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ScrollToTop from "./components/ScrollToTop";
import Index from "./pages/Index";
import Edit from "./pages/Edit";
import Dashboard from "./pages/Dashboard";
import Auth from "./pages/Auth";
import Verify from "./pages/Verify";
import Onboarding from "./pages/Onboarding";
import NotFound from "./pages/NotFound";
import Magic from "./pages/Magic";
import Draft from "./pages/Draft";
import Glance from "./pages/Glance";
import Subscribed from "./pages/Subscribed";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          {/* <Route path="/" element={<Index />} /> */}
          <Route
            path="/:publisher/:publication/:gcode/:email/:faqId"
            element={<Glance />}
          />
          <Route path="/:publication/:gcode" element={<Glance />} />
          <Route
            path="/subscribed/:publisher/:gcode/:email"
            element={<Subscribed />}
          />
          <Route path="/edit/:gcode" element={<Edit />} />
          <Route path="/edit/:id" element={<Edit />} />
          <Route path="/create" element={<Edit />} />
          <Route
            path="/draft/:dcode/:publication/:email/:icode"
            element={<Draft />}
          />
          <Route path="/draft/:dcode" element={<Draft />} />
          <Route path="/" element={<Dashboard />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/verify" element={<Verify />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/magic/:email/:otp" element={<Magic />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
