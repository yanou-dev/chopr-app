import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Divider,
  Container,
  Grid,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  FolderOpen as FolderOpenIcon,
  Refresh as RefreshIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon
} from '@mui/icons-material';
import { useTheme } from '../contexts/ThemeContext';

const HomePage = ({ setCurrentProject }) => {
  const navigate = useNavigate();
  const { mode, toggleTheme } = useTheme();
  const [recentProjects, setRecentProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load recent projects on component mount
  useEffect(() => {
    loadRecentProjects();
  }, []);

  const loadRecentProjects = async () => {
    setLoading(true);
    try {
      const projects = await window.electron.getRecentProjects();
      setRecentProjects(projects);
    } catch (error) {
      console.error('Failed to load recent projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = () => {
    navigate('/create');
  };

  const handleOpenProjectDialog = async () => {
    try {
      const result = await window.electron.selectProjectFile();
      if (!result.canceled && result.filePath) {
        openProject(result.filePath);
      }
    } catch (error) {
      console.error('Error opening project file dialog:', error);
    }
  };

  const openProject = async (filePath) => {
    try {
      const result = await window.electron.openProject(filePath);
      if (result.success) {
        setCurrentProject(result.data);
        navigate('/viewer');
      } else {
        console.error('Failed to open project:', result.error);
      }
    } catch (error) {
      console.error('Error opening project:', error);
    }
  };

  return (
    <Container maxWidth="md">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          py: 4
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            width: '100%',
            borderRadius: 2,
            background: mode === 'light' 
              ? 'linear-gradient(145deg, #ffffff 0%, #f0f7ff 100%)' 
              : 'linear-gradient(145deg, #1e1e1e 0%, #2d3748 100%)'
          }}
        >
          <Box sx={{ position: 'absolute', top: 16, right: 16 }}>
            <Tooltip title={`Switch to ${mode === 'light' ? 'dark' : 'light'} mode`}>
              <IconButton onClick={toggleTheme} color="inherit">
                {mode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
              </IconButton>
            </Tooltip>
          </Box>

          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography variant="h2" component="h1" gutterBottom>
              LogViewer
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              A modern desktop application for visualizing logs from various sources
            </Typography>
          </Box>

          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" component="h2" gutterBottom>
                    Create New Project
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Start a new log visualization project with custom settings
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleCreateProject}
                    fullWidth
                  >
                    Create Project
                  </Button>
                </CardActions>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" component="h2" gutterBottom>
                    Open Existing Project
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Load a previously saved log visualization project
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button
                    variant="outlined"
                    startIcon={<FolderOpenIcon />}
                    onClick={handleOpenProjectDialog}
                    fullWidth
                  >
                    Open Project
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          </Grid>

          <Box sx={{ mt: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" component="h2">
                Recent Projects
              </Typography>
              <Tooltip title="Refresh recent projects">
                <IconButton onClick={loadRecentProjects} size="small">
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
            </Box>
            <Divider />
            <List sx={{ width: '100%' }}>
              {recentProjects.length > 0 ? (
                recentProjects.map((project, index) => (
                  <React.Fragment key={project.path}>
                    <ListItem disablePadding>
                      <ListItemButton onClick={() => openProject(project.path)}>
                        <ListItemText
                          primary={project.name}
                          secondary={`Last modified: ${new Date(project.lastModified).toLocaleString()}`}
                        />
                      </ListItemButton>
                    </ListItem>
                    {index < recentProjects.length - 1 && <Divider />}
                  </React.Fragment>
                ))
              ) : (
                <ListItem>
                  <ListItemText
                    primary={loading ? "Loading recent projects..." : "No recent projects found"}
                    secondary={!loading && "Create a new project to get started"}
                  />
                </ListItem>
              )}
            </List>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default HomePage;
