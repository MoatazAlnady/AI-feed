import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { AuthProvider } from "@/context/AuthContext";
import AppLayout from "@/components/AppLayout";
import Index from "./pages/Index";
import Tools from "./pages/Tools";
import Talent from "./pages/Talent";
import EmployerDashboard from "./pages/EmployerDashboard";
import Admin from "./pages/Admin";
import Messages from "./pages/Messages";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import About from "./pages/About";
import Categories from "./pages/Categories";
import Community from "./pages/Community";
import Blog from "./pages/Blog";
import ToolDetails from "./pages/ToolDetails";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={<AppLayout />}>
              <Route index element={<Index />} />
              <Route path="tools" element={<Tools />} />
              <Route path="tools/:id" element={<ToolDetails />} />
              <Route path="categories" element={<Categories />} />
              <Route path="about" element={<About />} />
              <Route path="blog" element={<Blog />} />
              <Route path="community" element={<Community />} />
              <Route path="talent" element={<Talent />} />
              <Route path="dashboard" element={<EmployerDashboard />} />
              <Route path="admin" element={<Admin />} />
              <Route path="messages" element={<Messages />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
