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
  SelectChangeEvent,
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
import { useTranslation } from "../i18n/i18n";

interface LogTypeResult {
  success: boolean;
  error: string | null;
  type: string;
}

interface CreateProjectPageProps {
  setCurrentProject: React.Dispatch<React.SetStateAction<Project | null>>;
}

const CreateProjectPage: React.FC<CreateProjectPageProps> = ({
  setCurrentProject,
}) => {
  const navigate = useNavigate();
  const { mode } = useTheme();
  const { t } = useTranslation();
  const [exampleLog, setExampleLog] = useState<string>("");
  const [projectName, setProjectName] = useState<string>("");
  const [source, setSource] = useState<string>("command");
  const [commandValue, setCommandValue] = useState<string>("");
  const [filePath, setFilePath] = useState<string>("");
  const [parserType, setParserType] = useState<string>("auto");
  const [error, setError] = useState<string>("");
  const [identifiedLogType, setIdentifiedLogType] =
    useState<LogTypeResult | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);

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

  const handleSourceChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ): void => {
    setSource(event.target.value);
  };

  const handleSelectFile = async (): Promise<void> => {
    try {
      const result = await window.electron.selectLogFile();
      if (!result.canceled && result.filePath) {
        setFilePath(result.filePath);

        if (result.sampleContent) {
          const detectionResult = identifyLogType(result.sampleContent);
          if (detectionResult.success) {
            setParserType(detectionResult.type);
            setIdentifiedLogType(null);
            setSnackbarOpen(true);
          } else {
            setIdentifiedLogType(detectionResult);
          }
        }
      }
    } catch (error) {
      console.error("Error selecting log file:", error);
    }
  };

  const handleCancel = (): void => {
    navigate("/");
  };

  const handleSave = async (): Promise<void> => {
    if (!projectName.trim()) {
      setError(t("nameRequired"));
      return;
    }

    if (source === "command" && !commandValue.trim()) {
      setError(t("sourceRequired"));
      return;
    }

    if (source === "file" && !filePath.trim()) {
      setError(t("sourceRequired"));
      return;
    }

    try {
      const projectData = {
        id: projectName.replace(/[^a-z0-9]/gi, "_").toLowerCase(),
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

      const result = await window.electron.saveProject(projectData as Project);

      if (result.success) {
        setCurrentProject(result.data || (projectData as Project));
        navigate("/viewer");
      } else {
        setError(`Failed to save project: ${result.error}`);
      }
    } catch (error) {
      console.error("Error saving project:", error);
      setError("An error occurred while saving the project");
    }
  };

  const handleSnackbarClose = (): void => {
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
      <TitleBar title={t("createProjectTitle")} />

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
          label={t("projectName")}
          variant="outlined"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          placeholder="e.g. Kubernetes Logs, Java App Logs"
          required
          size="small"
          sx={{ mb: 3 }}
        />

        <FormControl component="fieldset" sx={{ mb: 3, width: "100%" }}>
          <FormLabel component="legend">{t("sourceType")}</FormLabel>
          <RadioGroup value={source} onChange={handleSourceChange} row>
            <FormControlLabel
              value="command"
              control={<Radio size="small" />}
              label={t("command")}
            />
            <FormControlLabel
              value="file"
              control={<Radio size="small" />}
              label={t("file")}
            />
          </RadioGroup>
        </FormControl>

        {source === "command" && (
          <TextField
            fullWidth
            label={t("command")}
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
              label={t("file")}
              variant="outlined"
              value={filePath}
              onChange={(e) => setFilePath(e.target.value)}
              placeholder="/path/to/your/log/file.log"
              size="small"
              InputProps={{
                endAdornment: (
                  <IconButton
                    size="small"
                    edge="end"
                    onClick={handleSelectFile}
                    title="Browse"
                  >
                    <FolderOpenIcon />
                  </IconButton>
                ),
              }}
            />
          </Box>
        )}

        <FormControl sx={{ mb: 3, minWidth: 120 }} size="small">
          <InputLabel id="parser-type-label">{t("parserType")}</InputLabel>
          <Select
            labelId="parser-type-label"
            value={parserType}
            label={t("parserType")}
            onChange={(e: SelectChangeEvent) => setParserType(e.target.value)}
            disabled={
              (parserType === "auto" && identifiedLogType?.success) || false
            }
          >
            {LogFormats.map((format) => (
              <MenuItem key={format.value} value={format.value}>
                {format.label}
              </MenuItem>
            ))}
            <MenuItem value="custom" disabled>
              Custom (v2)
            </MenuItem>
          </Select>
        </FormControl>

        {parserType === "auto" && (
          <>
            <TextField
              fullWidth
              label={t("exampleLog")}
              variant="outlined"
              value={exampleLog}
              onChange={(e) => setExampleLog(e.target.value)}
              placeholder='e.g. {"level":"INFO","message":"Starting application..."}'
              size="small"
              sx={{ mb: 3 }}
              error={!!identifiedLogType && !identifiedLogType.success}
              helperText={
                (!!identifiedLogType && identifiedLogType.error) || ""
              }
            />
            <Alert severity="info" sx={{ mb: 3 }} variant="outlined">
              {t("autoDetectInfo")}
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
          {t("cancelButton")}
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          startIcon={<SaveIcon />}
          disableElevation
          size="small"
          disabled={
            parserType === "auto" && !(identifiedLogType?.success || false)
          }
        >
          {t("saveButton")}
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
          {t("logTypeIdentified", { type: parserType })}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CreateProjectPage;
