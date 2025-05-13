import React, { useState, useEffect } from "react";
import {
  HashRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { CssBaseline, Box } from "@mui/material";
import { useTheme } from "./contexts/ThemeContext";

import HomePage from "./pages/HomePage";
import CreateProjectPage from "./pages/CreateProjectPage";
import ViewerPage from "./pages/ViewerPage";

// Types sont définis dans react-app-env.d.ts

const WindowResizer: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    window.electron.resizeWindow(null, null, location.pathname);
  }, [location.pathname]);

  return null;
};

const App: React.FC = () => {
  const { theme } = useTheme();
  const [currentProject, setCurrentProject] = useState<Project | null>(null);

  return (
    <Router>
      <CssBaseline />
      <WindowResizer />
      <Box
        sx={{
          minHeight: "100vh",
          bgcolor: "background.default",
          color: "text.primary",
          transition: theme.transitions.create(["background-color", "color"]),
        }}
      >
        <Routes>
          <Route
            path="/"
            element={<HomePage setCurrentProject={setCurrentProject} />}
          />
          <Route
            path="/create"
            element={
              <CreateProjectPage setCurrentProject={setCurrentProject} />
            }
          />
          <Route
            path="/viewer"
            element={
              currentProject ? (
                <ViewerPage project={currentProject} />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
        </Routes>
      </Box>
    </Router>
  );
};

export default App;
