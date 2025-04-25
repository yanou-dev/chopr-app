import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import {
  Add as AddIcon,
  FolderOpen as FolderOpenIcon,
  Delete as DeleteIcon,
  Upload as UploadIcon,
  Download as DownloadIcon,
} from "@mui/icons-material";
import { useTheme } from "../contexts/ThemeContext";
import TitleBar from "../components/TitleBar";
import JSZip from "jszip";

const HomePage = ({ setCurrentProject }) => {
  const navigate = useNavigate();
  const { mode, toggleTheme } = useTheme();
  const [recentProjects, setRecentProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadRecentProjects();
  }, []);

  const loadRecentProjects = async () => {
    setLoading(true);
    try {
      const projects = await window.electron.getRecentProjects();
      setRecentProjects(projects);
    } catch (error) {
      console.error("Error loading recent projects:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = () => {
    navigate("/create");
  };

  const handleOpenProject = async () => {
    try {
      const result = await window.electron.openProject();
      if (result.success) {
        setCurrentProject(result.data);
        navigate("/viewer");
      }
    } catch (error) {
      console.error("Error opening project:", error);
    }
  };

  const handleOpenRecentProject = async (project) => {
    try {
      const result = await window.electron.loadProject(project.path);
      if (result.success) {
        setCurrentProject(result.data);
        navigate("/viewer");
      }
    } catch (error) {
      console.error("Error opening recent project:", error);
    }
  };

  const confirmDeleteProject = (project) => {
    setProjectToDelete(project);
    setOpenDialog(true);
  };

  const handleDeleteProject = async () => {
    if (!projectToDelete) return;

    try {
      const result = await window.electron.deleteProject(projectToDelete.id);
      if (result.success) {
        setOpenDialog(false);
        setProjectToDelete(null);
        loadRecentProjects();
      } else {
        setError(`Failed to delete project: ${result.error}`);
      }
    } catch (error) {
      console.error("Error deleting project:", error);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return isNaN(date) ? "Invalid date" : date.toLocaleDateString();
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        bgcolor: "background.default",
      }}
    >
      <TitleBar title="Chopr" />

      <Box
        sx={{
          display: "flex",
          flexGrow: 1,
          overflow: "hidden",
        }}
      >
        {/* Left side - Actions */}
        <Box
          sx={{
            width: "250px",
            p: 3,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            borderRight: 1,
            borderColor: "divider",
          }}
        >
          <Typography
            variant="subtitle2"
            gutterBottom
            sx={{ fontWeight: "bold", mb: 2 }}
          >
            Welcome to Chopr
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
            paragraph
            sx={{ mb: 3 }}
          >
            Create a new project or open an existing one to get started.
          </Typography>

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateProject}
            fullWidth
            sx={{ mb: 2 }}
            disableElevation
          >
            New Project
          </Button>

          <Button
            variant="outlined"
            startIcon={<FolderOpenIcon />}
            onClick={handleOpenProject}
            fullWidth
          >
            Open Project
          </Button>
        </Box>

        {/* Right side - Recent Projects */}
        <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              p: 2,
              borderBottom: 1,
              borderColor: "divider",
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>
              Projects
            </Typography>
            <Box sx={{ display: "flex", gap: 1 }}>
              <Tooltip title="Export Projects">
                <IconButton aria-label="export">
                  <UploadIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Import Projects">
                <IconButton aria-label="import">
                  <DownloadIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          <Box sx={{ flexGrow: 1, overflow: "auto", p: 1 }}>
            {loading ? (
              <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
                Loading recent projects...
              </Typography>
            ) : recentProjects.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
                No recent projects found. Create a new project to get started.
              </Typography>
            ) : (
              <List dense>
                {recentProjects.map((project) => (
                  <ListItem
                    key={project.id}
                    button
                    onClick={() => handleOpenRecentProject(project)}
                    secondaryAction={
                      <Tooltip title="Delete">
                        <IconButton
                          edge="end"
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            confirmDeleteProject(project);
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    }
                    sx={{
                      borderRadius: 1,
                      mb: 0.5,
                      "&:hover": {
                        bgcolor: "action.hover",
                      },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <FolderOpenIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary={project.name}
                      secondary={`Last opened: ${formatDate(
                        project.lastOpened
                      )}`}
                      primaryTypographyProps={{ variant: "body2" }}
                      secondaryTypographyProps={{ variant: "caption" }}
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Box>

          <Box
            sx={{
              p: 1,
              borderTop: 1,
              borderColor: "divider",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Typography variant="caption" color="text.secondary">
              Chopr v1.0.0
            </Typography>
            <Button
              variant="text"
              size="small"
              onClick={toggleTheme}
              sx={{ minWidth: "auto" }}
            >
              {mode === "light" ? "Dark Mode" : "Light Mode"}
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Delete Project</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{projectToDelete?.name}"? This
            action cannot be undone.
          </Typography>
          {error && <Typography color="error">{error}</Typography>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)} size="small">
            Cancel
          </Button>
          <Button onClick={handleDeleteProject} color="error" size="small">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default HomePage;
