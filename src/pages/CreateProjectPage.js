import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  TextField,
  Button,
  FormControl,
  FormLabel,
  RadioGroup,
  Radio,
  FormControlLabel,
  MenuItem,
  Select,
  InputLabel,
  IconButton,
  Tooltip,
  Alert,
  Snackbar,
} from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import {
  Save as SaveIcon,
  FolderOpen as FolderOpenIcon,
} from "@mui/icons-material";
import { useTheme } from "../contexts/ThemeContext";
import TitleBar from "../components/TitleBar";
import { identifyLogType } from "../parsers/utils";
import LogFormats from "../parsers/LogFormats";

const CreateProjectPage = ({ setCurrentProject }) => {
  const navigate = useNavigate();
  const { mode } = useTheme();
  const [exampleLog, setExampleLog] = useState("");
  const [projectName, setProjectName] = useState("");
  const [source, setSource] = useState("command");
  const [commandValue, setCommandValue] = useState("");
  const [filePath, setFilePath] = useState("");
  const [parserType, setParserType] = useState("auto");
  const [error, setError] = useState("");
  const [identifiedLogType, setIdentifiedLogType] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  useEffect(() => {
    if (exampleLog) {
      const result = identifyLogType(exampleLog);
      if (result.success) {
        setParserType(result.type);
        setIdentifiedLogType(null);
        setExampleLog("");
        setSnackbarOpen(true);
      } else {
        setIdentifiedLogType(result);
      }
    }
  }, [exampleLog]);

  const handleSourceChange = (event) => {
    setSource(event.target.value);
  };

  const handleSelectFile = async () => {
    try {
      const result = await window.electron.selectLogFile();
      if (!result.canceled && result.filePath) {
        setFilePath(result.filePath);
      }
    } catch (error) {
      console.error("Error selecting log file:", error);
    }
  };

  const handleCancel = () => {
    navigate("/");
  };

  const handleSave = async () => {
    if (!projectName.trim()) {
      setError("Please enter a project name");
      return;
    }

    if (source === "command" && !commandValue.trim()) {
      setError("Please enter a command");
      return;
    }

    if (source === "file" && !filePath.trim()) {
      setError("Please select or enter a file path");
      return;
    }

    try {
      const projectData = {
        name: projectName,
        source: {
          type: source,
          value: source === "command" ? commandValue : filePath,
        },
        parser: {
          type: parserType,
        },
        lastOpened: new Date().toISOString(),
      };

      const result = await window.electron.saveProject(projectData);

      if (result.success) {
        setCurrentProject(projectData);
        navigate("/viewer");
      } else {
        setError(`Failed to save project: ${result.error}`);
      }
    } catch (error) {
      console.error("Error saving project:", error);
      setError("An error occurred while saving the project");
    }
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
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
      <TitleBar title="New Project" />

      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          flexGrow: 1,
          overflow: "auto",
          p: 3,
        }}
      >
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <TextField
          fullWidth
          label="Project Name"
          variant="outlined"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          placeholder="e.g. Kubernetes Logs, Java App Logs"
          required
          size="small"
          sx={{ mb: 3 }}
        />

        <FormControl component="fieldset" sx={{ mb: 3, width: "100%" }}>
          <FormLabel component="legend">Source Type</FormLabel>
          <RadioGroup value={source} onChange={handleSourceChange} row>
            <FormControlLabel
              value="command"
              control={<Radio size="small" />}
              label="Command Output"
            />
            <FormControlLabel
              value="file"
              control={<Radio size="small" />}
              label="Log File"
            />
            <FormControlLabel
              value="process"
              control={<Radio size="small" />}
              label="Process (Coming in v2)"
              disabled
            />
          </RadioGroup>
        </FormControl>

        {source === "command" && (
          <TextField
            fullWidth
            label="Command"
            variant="outlined"
            value={commandValue}
            onChange={(e) => setCommandValue(e.target.value)}
            placeholder="e.g. kubectl logs pod-name -f"
            helperText="Enter a command that outputs logs. The -f flag is recommended for continuous output."
            size="small"
            sx={{ mb: 3 }}
          />
        )}

        {source === "file" && (
          <Box sx={{ mb: 3 }}>
            <TextField
              fullWidth
              label="File Path"
              variant="outlined"
              value={filePath}
              onChange={(e) => setFilePath(e.target.value)}
              placeholder="/path/to/your/logfile.log"
              size="small"
              InputProps={{
                endAdornment: (
                  <Button
                    variant="outlined"
                    onClick={handleSelectFile}
                    startIcon={<FolderOpenIcon />}
                    size="small"
                    sx={{ ml: 1 }}
                  >
                    Browse
                  </Button>
                ),
              }}
            />
          </Box>
        )}

        <FormControl fullWidth size="small" sx={{ mb: 3 }}>
          <InputLabel id="parser-type-label">Log Format</InputLabel>
          <Select
            labelId="parser-type-label"
            value={parserType}
            label="Log Format"
            onChange={(e) => setParserType(e.target.value)}
            size="small"
          >
            {LogFormats.map((format) => (
              <MenuItem key={format.value} value={format.value}>
                {format.label}
              </MenuItem>
            ))}
            <MenuItem value="custom" disabled>
              Custom Format (Coming in v2)
            </MenuItem>
          </Select>
        </FormControl>

        {parserType === "auto" && (
          <>
            <TextField
              fullWidth
              label="Example Log"
              variant="outlined"
              value={exampleLog}
              onChange={(e) => setExampleLog(e.target.value)}
              placeholder='e.g. {"level":"INFO","message":"Starting application..."}'
              size="small"
              sx={{ mb: 3 }}
              error={!!identifiedLogType && !identifiedLogType.success}
              helperText={!!identifiedLogType && identifiedLogType.error}
            />
            <Alert severity="info" sx={{ mb: 3 }} variant="outlined">
              Chopr will automaticaly identify the log format from the example
              log you provide.
            </Alert>
          </>
        )}
      </Box>

      <Box
        sx={{
          p: 2,
          display: "flex",
          justifyContent: "flex-end",
          gap: 1,
          borderTop: 1,
          borderColor: "divider",
        }}
      >
        <Button variant="outlined" onClick={handleCancel} size="small">
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          startIcon={<SaveIcon />}
          disableElevation
          size="small"
          disabled={parserType === "auto"}
        >
          Create Project
        </Button>
      </Box>
      <Snackbar
        open={snackbarOpen}
        onClose={handleSnackbarClose}
        autoHideDuration={3000}
      >
        <Alert
          icon={<CheckIcon fontSize="inherit" />}
          severity="success"
          variant="filled"
          sx={{ width: "100%" }}
        >
          Log type identified ! ({parserType})
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CreateProjectPage;
