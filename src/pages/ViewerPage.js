import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Chip,
  IconButton,
  Tooltip,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
} from "@mui/material";
import {
  DataGrid,
  GridToolbarContainer,
  GridToolbarColumnsButton,
  GridToolbarFilterButton,
  GridToolbarDensitySelector,
  GridToolbarQuickFilter,
} from "@mui/x-data-grid";
import VerticalAlignBottomIcon from "@mui/icons-material/VerticalAlignBottom";
import ClearAllIcon from "@mui/icons-material/ClearAll";
import TitleBar from "../components/TitleBar";
import LogParser from "../parsers/LogParser";
import JSONParser from "../parsers/JSONParser";

const CustomToolbar = (props) => {
  const {
    setFilter,
    filter,
    handleClearLogs,
    autoScroll,
    setAutoScroll,
    scrollToBottom,
  } = props;

  return (
    <GridToolbarContainer
      sx={{
        justifyContent: "space-between",
        px: 1,
        py: 1,
        borderBottom: "1px solid",
        borderColor: "divider",
        gap: 0.5,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
        <GridToolbarColumnsButton />
        <GridToolbarFilterButton />
        <GridToolbarDensitySelector />
        <Tooltip title="Clear Logs">
          <IconButton onClick={handleClearLogs} size="small">
            <ClearAllIcon />
          </IconButton>
        </Tooltip>
        <Tooltip
          title={autoScroll ? "Disable auto-scroll" : "Enable auto-scroll"}
        >
          <IconButton
            onClick={() => {
              const newAutoScrollState = !autoScroll;
              setAutoScroll(newAutoScrollState);
              if (newAutoScrollState) {
                setTimeout(scrollToBottom, 0);
              }
            }}
            size="small"
            sx={{
              color: autoScroll ? "primary.main" : "text.secondary",
            }}
          >
            <VerticalAlignBottomIcon />
          </IconButton>
        </Tooltip>
      </Box>
      <Box sx={{ display: "flex", alignItems: "center" }} />
    </GridToolbarContainer>
  );
};

const ViewerPage = ({ project }) => {
  const navigate = useNavigate();
  const parser =
    project?.parser?.type === "json"
      ? new JSONParser()
      : new LogParser(project?.parser?.type);

  // State variables
  const [logs, setLogs] = useState([]);
  const [columns, setColumns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("");
  const [levelFilter, setLevelFilter] = useState("all");
  const [commandId, setCommandId] = useState(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [columnVisibility, setColumnVisibility] = useState({});
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);
  const [pinnedColumns, setPinnedColumns] = useState({});
  const [fontSize, setFontSize] = useState(12);
  const [densityLevel, setDensityLevel] = useState("compact");

  const gridContainerRef = useRef(null);
  const lastAddedLogRef = useRef(null);
  const apiRef = useRef(null);

  useEffect(() => {
    parser.on("columnsChanged", (newColumns) => {
      const gridColumns = newColumns.map((col) => {
        // console.log(apiRef.current.state.columns.lookup[col.id]?.width);
        return {
          field: col.id,
          headerName: col.label,
          width: apiRef.current.state.columns.lookup[col.id]?.width || 150,
          sortable: true,
          filterable: true,
          resizable: true,
          expand: col.id === "message" ? true : false,
          renderCell: (params) => renderCell(col.id, params.value),
          hide: columnVisibility[col.field] === false,
        };
      });
      setColumns(gridColumns);
    });
  }, [parser]);

  const scrollToBottom = useCallback(() => {
    if (!autoScroll || !gridContainerRef.current) return;

    const scrollableDiv = gridContainerRef.current.querySelector(
      ".MuiDataGrid-virtualScroller"
    );

    if (scrollableDiv) {
      scrollableDiv.scrollTo({
        top: scrollableDiv.scrollHeight,
      });
    }
  }, [autoScroll]);

  useEffect(() => {
    if (autoScroll && logs.length > 0) {
      const currentLastRow = logs[logs.length - 1].id;

      if (currentLastRow !== lastAddedLogRef.current) {
        lastAddedLogRef.current = currentLastRow;
        setTimeout(scrollToBottom, 100);
      }
    }

    // Auto-size columns when we get the first log
    if (logs.length === 1 && apiRef.current) {
      setTimeout(() => {
        try {
          apiRef.current.autosizeColumns({
            expand: true,
          });
        } catch (e) {
          console.error("Error auto-sizing columns:", e);
        }
      }, 200); // Small delay to ensure the grid is properly rendered
    }
  }, [logs, autoScroll, scrollToBottom]);

  useEffect(() => {
    if (!project) {
      navigate("/");
      return;
    }

    startLogCollection();

    return () => {
      if (commandId) {
        window.electron.stopCommand(commandId);
      }
    };
  }, [project, navigate]);

  useEffect(() => {
    if (project?.id) {
      setLogs([]);
    }
  }, [project?.id]);

  const addLogEntry = (logEntry) => {
    const logId = crypto.randomUUID();
    logEntry.id = logId;

    setLogs((prevLogs) => {
      const exists = prevLogs.some((log) => log.id === logId);
      if (exists) {
        return prevLogs;
      }

      const newLogs = [...prevLogs, logEntry];
      if (newLogs.length > 10000) {
        return newLogs.slice(newLogs.length - 10000);
      }
      return newLogs;
    });
  };

  const startLogCollection = async () => {
    setLoading(true);

    try {
      const id = `${project.source.type}-${Date.now()}`;
      setCommandId(id);

      if (project.source.type === "command") {
        await window.electron.startCommand(id, project.source.value);
      } else if (project.source.type === "file") {
        await window.electron.watchFile(id, project.source.value);
      }

      const unsubscribe = window.electron.onCommandOutput((data) => {
        if (data.id === id) {
          if (!data.data || data.data.trim() === "") return;

          try {
            const parsedData = parser.parseLines(data.data);
            for (const log of parsedData) {
              addLogEntry(log);
            }
          } catch (e) {
            console.error(e);
            const logEntry = {
              level: "info",
              message: data.data.trim(),
              timestamp: new Date().toLocaleString(),
              rawTimestamp: new Date().toISOString(),
              rawLog: data.data,
            };
            addLogEntry(logEntry);
          }
        }
      });

      return unsubscribe;
    } catch (error) {
      console.error("Error starting log collection:", error);
      showSnackbar("Error starting log collection");
    } finally {
      setLoading(false);
    }
  };

  const handleClearLogs = () => {
    setClearConfirmOpen(true);
  };

  const confirmClearLogs = () => {
    setLogs([]);
    setClearConfirmOpen(false);
    showSnackbar("Logs cleared");
  };

  const handleGoHome = () => {
    if (commandId) {
      window.electron.stopCommand(commandId);
    }
    navigate("/");
  };

  const showSnackbar = (message) => {
    setSnackbarMessage(message);
    setSnackbarOpen(true);
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  const parseDate = (dateStr) => {
    if (!dateStr) return NaN;

    if (!isNaN(Number(dateStr))) {
      return Number(dateStr);
    }

    try {
      let timestamp = new Date(dateStr).getTime();
      if (!isNaN(timestamp)) return timestamp;

      const europeanMatch = dateStr.match(
        /(\d{1,2})[\/\.-](\d{1,2})[\/\.-](\d{4})\s*(\d{1,2})?:?(\d{1,2})?:?(\d{1,2})?/
      );
      if (europeanMatch) {
        const [_, day, month, year, hours = 0, minutes = 0, seconds = 0] =
          europeanMatch;
        timestamp = new Date(
          year,
          month - 1,
          day,
          hours,
          minutes,
          seconds
        ).getTime();
        if (!isNaN(timestamp)) return timestamp;
      }

      const americanMatch = dateStr.match(
        /(\d{1,2})[\/\.-](\d{1,2})[\/\.-](\d{4})\s*(\d{1,2})?:?(\d{1,2})?:?(\d{1,2})?/
      );
      if (americanMatch) {
        const [_, month, day, year, hours = 0, minutes = 0, seconds = 0] =
          americanMatch;
        timestamp = new Date(
          year,
          month - 1,
          day,
          hours,
          minutes,
          seconds
        ).getTime();
        if (!isNaN(timestamp)) return timestamp;
      }

      const timeMatch = dateStr.match(/^(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?$/);
      if (timeMatch) {
        const [_, hours, minutes, seconds = 0] = timeMatch;
        const today = new Date();
        timestamp = new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate(),
          hours,
          minutes,
          seconds
        ).getTime();
        if (!isNaN(timestamp)) return timestamp;
      }

      const log4jMatch = dateStr.match(
        /(\d{4}-\d{2}-\d{2})\s+(\d{1,2}:\d{2}:\d{2}(?:\.\d{1,3})?)/
      );
      if (log4jMatch) {
        const [_, datePart, timePart] = log4jMatch;
        timestamp = new Date(`${datePart}T${timePart}`).getTime();
        if (!isNaN(timestamp)) return timestamp;
      }

      return NaN;
    } catch (e) {
      console.error("Error parsing date:", e);
      return NaN;
    }
  };

  // Parse search query
  const parseSearchQuery = (query) => {
    const filters = {};
    const timeRangeFilters = {};
    const parts = query.split(" ");

    let textFilter = "";

    parts.forEach((part) => {
      if (part.includes(":")) {
        let [key, ...valueParts] = part.split(":");
        let value = valueParts.join(":");

        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.substring(1, value.length - 1);
        }

        const keyLower = key.toLowerCase();

        if (keyLower.endsWith("_from") || keyLower.endsWith("_to")) {
          const baseKey = keyLower.replace(/_from$|_to$/, "");
          if (!timeRangeFilters[baseKey]) {
            timeRangeFilters[baseKey] = {};
          }

          if (keyLower.endsWith("_from")) {
            timeRangeFilters[baseKey].from = value;
          } else {
            timeRangeFilters[baseKey].to = value;
          }
        } else {
          if (!filters[keyLower]) {
            filters[keyLower] = [];
          }
          filters[keyLower].push(value.toLowerCase());
        }
      } else {
        textFilter += (textFilter ? " " : "") + part;
      }
    });

    return { filters, timeRangeFilters, textFilter };
  };

  const getLevelColor = (level) => {
    if (!level) return "default";

    switch (level.toLowerCase()) {
      case "fatal":
      case "severe":
        return "error"; // Rouge vif pour les erreurs critiques
      case "error":
        return "error"; // Rouge pour les erreurs
      case "warn":
      case "warning":
        return "warning"; // Jaune/orange pour les avertissements
      case "info":
        return "info"; // Bleu pour les informations
      case "debug":
        return "primary"; // Bleu primaire pour le débogage (plus distinct)
      case "trace":
        return "secondary"; // Violet/gris pour les traces (moins prioritaire)
      default:
        return "default"; // Gris neutre pour les cas non définis
    }
  };

  const renderCell = (columnId, value) => {
    if (columnId === "level" && value) {
      return (
        <Chip
          label={value}
          size="small"
          color={getLevelColor(value)}
          sx={{
            textTransform: "capitalize",
            fontWeight: value.toLowerCase() === "error" ? "bold" : "normal",
            fontSize: `${fontSize}px`,
          }}
        />
      );
    }

    if (typeof value === "string" && columnId === "message") {
      return (
        <Typography
          variant="body2"
          sx={{
            fontFamily: "monospace",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            fontSize: `${fontSize}px`,
          }}
        >
          {value}
        </Typography>
      );
    }

    return (
      <Typography
        variant="body2"
        sx={{
          fontFamily: "monospace",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          fontSize: `${fontSize}px`,
        }}
      >
        {value}
      </Typography>
    );
  };

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (
        levelFilter !== "all" &&
        log.level &&
        log.level.toLowerCase() !== levelFilter.toLowerCase()
      ) {
        return false;
      }

      if (!filter) return true;

      const { filters, timeRangeFilters, textFilter } =
        parseSearchQuery(filter);

      for (const [key, values] of Object.entries(filters)) {
        if (log[key] !== undefined) {
          const logValue = String(log[key]).toLowerCase();

          const matchesAnyValue = values.some((value) => {
            if (value.includes("*")) {
              const regexPattern = value.replace(/\*/g, ".*");
              const regex = new RegExp(`^${regexPattern}$`);
              return regex.test(logValue);
            } else {
              return logValue === value;
            }
          });

          if (!matchesAnyValue) {
            return false;
          }
        }
      }

      for (const [key, range] of Object.entries(timeRangeFilters)) {
        if (log[key]) {
          const logValue = log[key];
          let logTimestamp;

          try {
            logTimestamp = parseDate(logValue);

            if (isNaN(logTimestamp)) {
              continue;
            }

            if (range.from) {
              const fromTimestamp = parseDate(range.from);
              if (!isNaN(fromTimestamp) && logTimestamp < fromTimestamp) {
                return false;
              }
            }

            if (range.to) {
              const toTimestamp = parseDate(range.to);
              if (!isNaN(toTimestamp) && logTimestamp > toTimestamp) {
                return false;
              }
            }
          } catch (e) {
            console.error(`Error filtering by time range for ${key}:`, e);
          }
        }
      }

      if (
        textFilter &&
        (!log.message ||
          !log.message.toLowerCase().includes(textFilter.toLowerCase()))
      ) {
        return false;
      }

      return true;
    });
  }, [logs, filter, levelFilter]);

  const getDataGridRows = () => {
    return filteredLogs.map((log, index) => ({
      ...log,
      id: log.id || index.toString(),
    }));
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
      <TitleBar title={project?.name || "Chopr"} />

      <Box sx={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <Box
          ref={gridContainerRef}
          sx={{ flexGrow: 1, overflow: "hidden", position: "relative" }}
        >
          <DataGrid
            showToolbar
            rows={getDataGridRows()}
            columns={columns}
            density={densityLevel}
            disableRowSelectionOnClick
            loading={loading}
            apiRef={apiRef}
            getRowClassName={(params) => {
              if (params.row.level) {
                const level = params.row.level.toLowerCase();
                if (
                  level === "error" ||
                  level === "fatal" ||
                  level === "severe"
                ) {
                  return "error-row";
                }
                if (level === "warn" || level === "warning") {
                  return "warning-row";
                }
              }
              return "";
            }}
            sx={{
              height: "100%",
              width: "100%",
              "& .error-row": {
                bgcolor: (theme) =>
                  theme.palette.mode === "dark"
                    ? "rgba(211, 47, 47, 0.15)"
                    : "rgba(211, 47, 47, 0.05)",
              },
              "& .warning-row": {
                bgcolor: (theme) =>
                  theme.palette.mode === "dark"
                    ? "rgba(237, 108, 2, 0.15)"
                    : "rgba(237, 108, 2, 0.05)",
              },
              "& .MuiDataGrid-cell": {
                fontSize: `${fontSize}px`,
                fontFamily: "monospace",
                display: "flex",
                alignItems: "center",
              },
              "& .MuiDataGrid-columnHeader": {
                fontSize: `${fontSize}px`,
              },
              "& .MuiDataGrid-footerContainer": {
                display: "none",
              },
            }}
            slots={{
              toolbar: CustomToolbar,
            }}
            slotProps={{
              toolbar: {
                setFilter,
                filter,
                handleClearLogs,
                autoScroll,
                setAutoScroll,
                scrollToBottom,
              },
            }}
            initialState={{
              sorting: {
                sortModel: [],
              },
              pagination: {
                paginationModel: { pageSize: Number.MAX_VALUE },
              },
            }}
            paginationMode="client"
            columnVisibilityModel={columnVisibility}
            onColumnVisibilityModelChange={(newModel) =>
              setColumnVisibility(newModel)
            }
          />
        </Box>
      </Box>

      {/* Clear Logs Confirmation Dialog */}
      <Dialog
        open={clearConfirmOpen}
        onClose={() => setClearConfirmOpen(false)}
      >
        <DialogTitle>Clear Logs</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to clear all logs? This action cannot be
            undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setClearConfirmOpen(false)}>Cancel</Button>
          <Button onClick={confirmClearLogs} color="error">
            Clear
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity="info"
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>

      <Box
        sx={{
          p: 1,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          bgcolor: "background.paper",
          zIndex: 2,
          borderTop: "1px solid",
          borderColor: "divider",
        }}
      >
        <Typography variant="caption" color="text.secondary">
          {filteredLogs.length} of {logs.length} logs displayed
        </Typography>
      </Box>
    </Box>
  );
};

export default ViewerPage;
