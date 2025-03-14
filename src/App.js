import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { CssBaseline, Box } from '@mui/material';
import { useTheme } from './contexts/ThemeContext';

// Pages
import HomePage from './pages/HomePage';
import CreateProjectPage from './pages/CreateProjectPage';
import ViewerPage from './pages/ViewerPage';

function App() {
  const { theme } = useTheme();
  const [currentProject, setCurrentProject] = useState(null);

  return (
    <Router>
      <CssBaseline />
      <Box
        sx={{
          minHeight: '100vh',
          bgcolor: 'background.default',
          color: 'text.primary',
          transition: theme.transitions.create(['background-color', 'color']),
        }}
      >
        <Routes>
          <Route 
            path="/" 
            element={<HomePage setCurrentProject={setCurrentProject} />} 
          />
          <Route 
            path="/create" 
            element={<CreateProjectPage setCurrentProject={setCurrentProject} />} 
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
}

export default App;
