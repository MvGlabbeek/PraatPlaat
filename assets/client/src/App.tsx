import { Switch, Route, Router as WouterRouter } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import EditorPage from "@/pages/editor";
import NotFound from "@/pages/not-found";

function AppRoutes() {
  return (
    <Switch>
      <Route path="/" component={EditorPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter hook={useHashLocation}>
        <AppRoutes />
      </WouterRouter>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
