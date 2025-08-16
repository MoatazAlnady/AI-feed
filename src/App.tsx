import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { AuthProvider } from "@/context/AuthContext";
import { ChatDockProvider } from "@/context/ChatDockContext";
import AppLayout from "@/components/AppLayout";
import Index from "./pages/Index";
import Tools from "./pages/Tools";
import Talent from "./pages/Talent";
import EmployerDashboard from "./pages/EmployerDashboard";
import Admin from "./pages/Admin";
import Messages from "./pages/Messages";
import SubmitTool from "./pages/SubmitTool";
import SubmitArticle from "./pages/SubmitArticle";
import NotFound from "./pages/NotFound";
import CreatePost from "./pages/CreatePost";
import About from "./pages/About";
import Categories from "./pages/Categories";
import Community from "./pages/Community";
import Blog from "./pages/Blog";
import ToolDetails from "./pages/ToolDetails";
import Profile from "./pages/Profile";
import UserView from "./pages/UserView";
import Settings from "./pages/Settings";
import Jobs from "./pages/Jobs";
import Upgrade from "./pages/Upgrade";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ChatDockProvider>
        <ThemeProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
          <Routes>
            <Route path="/" element={<AppLayout />}>
              <Route index element={<Index />} />
              <Route path="newsfeed" element={<Index />} />
              <Route path="tools" element={<Tools />} />
              <Route path="tools/create" element={
                <div className="animate-fade-in">
                  <SubmitTool />
                </div>
              } />
              <Route path="tools/:id" element={<ToolDetails />} />
              <Route path="posts/create" element={<CreatePost />} />
              <Route path="articles/create" element={<SubmitArticle />} />
              <Route path="categories" element={<Categories />} />
              <Route path="about" element={<About />} />
              <Route path="blog" element={<Blog />} />
              <Route path="community" element={<Community />} />
              <Route path="talent" element={<Talent />} />
              <Route path="jobs" element={<Jobs />} />
              <Route path="profile" element={<Profile />} />
              <Route path="profile/:id" element={<UserView />} />
              <Route path="u/:handle" element={<UserView />} />
              <Route path="settings" element={<Settings />} />
              <Route path="upgrade" element={<Upgrade />} />
              <Route path="user/:userId" element={<Profile />} />
              <Route path="user-view/:userId" element={<Profile />} />
              <Route path="dashboard" element={<EmployerDashboard />} />
              <Route path="employer/*" element={<EmployerDashboard />} />
              <Route path="admin" element={<Admin />} />
              <Route path="messages" element={<Messages />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </ChatDockProvider>
  </AuthProvider>
</QueryClientProvider>
);

export default App;
