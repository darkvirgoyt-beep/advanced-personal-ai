import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import ChatPage from "./pages/ChatPage";
import VaultPage from "./pages/VaultPage";
import TerminalPage from "./pages/TerminalPage";
import ChartsPage from "./pages/ChartsPage";
import GitPage from "./pages/GitPage";
import SettingsPage from "./pages/SettingsPage";
import ModelsPage from "./pages/ModelsPage";
import ToolsPage from "./pages/ToolsPage";
import WorkspacePage from "./pages/WorkspacePage";
import ApiDocsPage from "./pages/ApiDocsPage";
import VirgoYTPage from "./pages/VirgoYTPage";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/chat"} component={ChatPage} />
      <Route path={"/vault"} component={VaultPage} />
      <Route path={"/terminal"} component={TerminalPage} />
      <Route path={"/charts"} component={ChartsPage} />
      <Route path={"/git"} component={GitPage} />
      <Route path={"/settings"} component={SettingsPage} />
      <Route path={"/models"} component={ModelsPage} />
      <Route path={"/tools"} component={ToolsPage} />
      <Route path={"/workspace"} component={WorkspacePage} />
      <Route path={"/api-docs"} component={ApiDocsPage} />
      <Route path={"/about-virgoyt"} component={VirgoYTPage} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
