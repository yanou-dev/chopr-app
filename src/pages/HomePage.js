import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  IconButton,
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
import { useTranslation } from "../i18n/i18n";
import LogFormats from "../parsers/LogFormats";

const HomePage = ({ setCurrentProject }) => {
  const navigate = useNavigate();
  const { mode } = useTheme();
  const { t } = useTranslation();
  const [recentProjects, setRecentProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [error, setError] = useState(null);
  const [appVersion, setAppVersion] = useState("");

  useEffect(() => {
    loadRecentProjects();
    loadAppVersion();
  }, []);

  const loadAppVersion = async () => {
    try {
      const version = await window.electron.getVersion();
      setAppVersion(version);
    } catch (error) {
      console.error("Error loading app version:", error);
      setAppVersion("?.?.?");
    }
  };

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
            {t("welcomeTitle")}
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
            paragraph
            sx={{ mb: 3 }}
          >
            {t("noProjects")}
          </Typography>

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateProject}
            fullWidth
            sx={{ mb: 2 }}
            disableElevation
          >
            {t("createProject")}
          </Button>

          <Button
            variant="outlined"
            startIcon={<FolderOpenIcon />}
            onClick={handleOpenProject}
            fullWidth
          >
            {t("openProject")}
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
              {t("projectsList")}
            </Typography>
          </Box>

          <Box sx={{ flexGrow: 1, overflow: "auto", p: 1 }}>
            {loading ? (
              <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
                {t("loadingProjects")}
              </Typography>
            ) : recentProjects.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
                {t("noRecentProjects")}
              </Typography>
            ) : (
              <List>
                {recentProjects.map((project) => (
                  <ListItem
                    key={project.id}
                    sx={{
                      borderRadius: 1,
                      mb: 0.5,
                      "&:hover": {
                        bgcolor: "action.hover",
                      },
                    }}
                    secondaryAction={
                      <IconButton
                        edge="end"
                        size="small"
                        onClick={() => confirmDeleteProject(project)}
                        color="error"
                        sx={{ ml: 1 }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    }
                  >
                    <ListItemText
                      primary={project.name}
                      secondary={`${formatDate(project.lastOpened)} • ${
                        LogFormats.find(
                          (format) => format.value === project.type
                        )?.label
                      }`}
                      sx={{ cursor: "pointer" }}
                      onClick={() => handleOpenRecentProject(project)}
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
              Chopr v{appVersion} • by{" "}
              <Box
                component="span"
                onClick={() =>
                  window.electron.openExternalUrl("https://yanou.dev")
                }
                sx={{
                  color: "#bfc7d5",
                  fontWeight: "bold",
                  cursor: "pointer",
                  "&:hover": {
                    textDecoration: "underline",
                  },
                }}
              >
                yanou.<span style={{ color: "#82aaff" }}>dev</span>()
              </Box>
            </Typography>
            <Button
              variant="text"
              size="small"
              onClick={() =>
                window.electron.openExternalUrl(
                  "https://github.com/yanouhd/chopr/issues"
                )
              }
              sx={{ minWidth: "auto" }}
            >
              {t("feedbackButton")}
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Delete confirmation dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>{t("deleteProject")}</DialogTitle>
        <DialogContent>
          <Typography>{t("confirmDeleteProject")}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)} color="primary">
            {t("cancelButton")}
          </Button>
          <Button onClick={handleDeleteProject} color="error">
            {t("deleteButton")}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default HomePage;
