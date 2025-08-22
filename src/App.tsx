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
import PostDetails from "./pages/PostDetails";
import About from "./pages/About";
import Categories from "./pages/Categories";
import Community from "./pages/Community";
import Blog from "./pages/Blog";
import ToolDetails from "./pages/ToolDetails";
import Profile from "./pages/Profile";
import UserView from "./pages/UserView";
import CreatorProfile from "./pages/CreatorProfile";
import Settings from "./pages/Settings";
import Jobs from "./pages/Jobs";
import Upgrade from "./pages/Upgrade";
import ToolComparison from "./pages/ToolComparison";
import AdminNewsletter from "./pages/AdminNewsletter";
import Notifications from "./pages/Notifications";
import ConnectionRequests from './pages/ConnectionRequests';

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
               <Route path="tools/:id/edit" element={<SubmitTool />} />
              <Route path="tools/compare/:toolIds" element={<ToolComparison />} />
               <Route path="posts/create" element={<CreatePost />} />
               <Route path="posts/:id" element={<PostDetails />} />
               <Route path="create-post" element={<CreatePost />} />
             <Route path="articles/create" element={<SubmitArticle />} />
              <Route path="categories" element={<Categories />} />
              <Route path="about" element={<About />} />
              <Route path="blog" element={<Blog />} />
              <Route path="community" element={<Community />} />
               <Route path="talent" element={<Talent />} />
               <Route path="jobs" element={<Jobs />} />
               
                {/* Creator Profile Routes */}
                <Route path="creator/:handleOrId" element={<CreatorProfile />} />
               
               {/* Legacy Profile Routes - Redirect to creator profile for handle-based navigation */}
               <Route path="profile/:id" element={<CreatorProfile />} />
               <Route path="u/:handle" element={<CreatorProfile />} />
               <Route path="user/:userId" element={<CreatorProfile />} />
               <Route path="user-view/:userId" element={<CreatorProfile />} />
               
               {/* Current User Profile (Edit Mode) */}
               <Route path="profile" element={<Profile />} />
               
               <Route path="settings" element={<Settings />} />
               <Route path="upgrade" element={<Upgrade />} />
               <Route path="dashboard" element={<EmployerDashboard />} />
                <Route path="employer/*" element={<EmployerDashboard />} />
                <Route path="admin" element={<Admin />} />
                <Route path="admin/newsletter" element={<AdminNewsletter />} />
                  <Route path="messages" element={<Messages />} />
                  <Route path="notifications" element={<Notifications />} />
                  <Route path="connection-requests" element={<ConnectionRequests />} />
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
