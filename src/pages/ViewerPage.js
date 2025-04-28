import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Chip,
  FormControl,
  IconButton,
  MenuItem,
  Select,
  Tooltip,
  Typography,
  Divider,
  Switch,
  FormControlLabel,
  Drawer,
  useTheme,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  Slider,
} from "@mui/material";
import {
  DataGrid,
  GridToolbarContainer,
  GridToolbarColumnsButton,
  GridToolbarFilterButton,
  GridToolbarDensitySelector,
  GridToolbarQuickFilter,
} from "@mui/x-data-grid";
import HomeIcon from "@mui/icons-material/Home";
import VerticalAlignBottomIcon from "@mui/icons-material/VerticalAlignBottom";
import RefreshIcon from "@mui/icons-material/Refresh";
import ClearAllIcon from "@mui/icons-material/ClearAll";
import TitleBar from "../components/TitleBar";
import LogParser from "../parsers/LogParser";
import JSONParser from "../parsers/JSONParser";

const CustomToolbar = (props) => {
  const {
    setFilter,
    filter,
    handleClearLogs,
    refreshPaused,
    setRefreshPaused,
    autoScroll,
    setAutoScroll,
    handleGoHome,
  } = props;

  return (
    <GridToolbarContainer
      sx={{
        justifyContent: "space-between",
        px: 1,
        borderBottom: "1px solid",
        borderColor: "divider",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center" }}>
        <Tooltip title="Back to Home">
          <IconButton onClick={handleGoHome} size="small">
            <HomeIcon />
          </IconButton>
        </Tooltip>
        <GridToolbarColumnsButton />
        <GridToolbarFilterButton />
        <GridToolbarDensitySelector />
        <Tooltip title="Clear Logs">
          <IconButton onClick={handleClearLogs} size="small" sx={{ ml: 1 }}>
            <ClearAllIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title={refreshPaused ? "Resume Updates" : "Pause Updates"}>
          <IconButton
            onClick={() => setRefreshPaused(!refreshPaused)}
            size="small"
            sx={{
              ml: 1,
              color: refreshPaused ? "error.main" : "text.secondary",
            }}
          >
            <RefreshIcon />
          </IconButton>
        </Tooltip>
        <Tooltip
          title={autoScroll ? "Disable auto-scroll" : "Enable auto-scroll"}
        >
          <IconButton
            onClick={() => setAutoScroll(!autoScroll)}
            size="small"
            sx={{
              ml: 1,
              color: autoScroll ? "primary.main" : "text.secondary",
            }}
          >
            <VerticalAlignBottomIcon />
          </IconButton>
        </Tooltip>
      </Box>

      <Box sx={{ display: "flex", alignItems: "center", width: "40%" }}>
        <GridToolbarQuickFilter
          quickFilterParser={(searchInput) => {
            // Sync the GridToolbar's quick filter with our custom filter state
            setFilter(searchInput);
            return searchInput.split(" ");
          }}
          value={filter}
          sx={{ width: "100%", m: 0 }}
        />
      </Box>

      <Box sx={{ display: "flex", alignItems: "center" }}>
        {/* Espace réservé pour équilibrer la barre d'outils */}
      </Box>
    </GridToolbarContainer>
  );
};

const ViewerPage = ({ project }) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const parser =
    project.parser.type === "json"
      ? new JSONParser()
      : new LogParser(project.parser.type);

  const [logs, setLogs] = useState([]);
  const [columns, setColumns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("");
  const [levelFilter, setLevelFilter] = useState("all");
  const [anchorEl, setAnchorEl] = useState(null);
  const [commandId, setCommandId] = useState(null);
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [autoScroll, setAutoScroll] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [columnVisibility, setColumnVisibility] = useState({});
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);
  const [pageSize, setPageSize] = useState(100);
  const [pinnedColumns, setPinnedColumns] = useState({});
  const [fontSize, setFontSize] = useState(12);
  const [densityLevel, setDensityLevel] = useState("standard");
  const [refreshPaused, setRefreshPaused] = useState(false);
  const dataGridRef = useRef(null);

  useEffect(() => {
    parser.on("columnsChanged", (newColumns) => {
      const gridColumns = newColumns.map((col) => ({
        field: col.id,
        headerName: col.label,
        width: col.width === "auto" ? 150 : col.width,
        flex: col.id === "message" ? 1 : 0,
        sortable: true,
        filterable: true,
        resizable: true,
        renderCell: (params) => renderCell(col.id, params.value),
        pinned: pinnedColumns[col.id] || null,
      }));
      setColumns(gridColumns);
    });
  }, [pinnedColumns]);

  const generateSearchSuggestions = (logs) => {
    const suggestions = new Set();
    const origColumns = parser.getColumns();

    origColumns.forEach((column) => {
      if (!["message", "rawLog", "id"].includes(column.id)) {
        suggestions.add(`${column.id}:`);
      }
    });

    if (logs.length > 0) {
      logs.forEach((log) => {
        origColumns.forEach((column) => {
          const value = log[column.id];
          if (
            value &&
            typeof value === "string" &&
            !["message", "rawLog", "id"].includes(column.id)
          ) {
            suggestions.add(`${column.id}:"${value}"`);
          }
        });
      });
    }

    return Array.from(suggestions);
  };

  useEffect(() => {
    setSearchSuggestions(generateSearchSuggestions(logs));
  }, [logs]);

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
    setLogs([]);
  }, [project?.id]);

  useEffect(() => {
    if (autoScroll && logs.length > 0) {
      // Scroll to the bottom when new logs are added
      const gridApi = dataGridRef.current?.apiRef;
      if (gridApi) {
        setTimeout(() => {
          gridApi.scrollToIndexes({
            rowIndex: logs.length - 1,
          });
        }, 100);
      }
    }
  }, [logs, autoScroll]);

  const addLogEntry = (logEntry) => {
    if (!refreshPaused) {
      const logId = crypto.randomUUID();
      logEntry.id = logId;

      setLogs((prevLogs) => {
        const exists = prevLogs.some((log) => log.id === logId);
        if (exists) {
          return prevLogs;
        }

        // Keep a maximum of 10,000 logs to prevent performance issues
        const newLogs = [...prevLogs, logEntry];
        if (newLogs.length > 10000) {
          return newLogs.slice(newLogs.length - 10000);
        }
        return newLogs;
      });
    }
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
            addLogEntry({
              level: "info",
              message: data.data.trim(),
              timestamp: new Date().toLocaleString(),
              rawTimestamp: new Date().toISOString(),
              rawLog: data.data,
            });
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

  const handleFilterChange = (e) => {
    setFilter(e.target.value);
  };

  const handleLevelFilterChange = (e) => {
    setLevelFilter(e.target.value);
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
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

  const handleToggleColumn = (columnId) => {
    setColumnVisibility((prev) => ({
      ...prev,
      [columnId]: !prev[columnId],
    }));
  };

  const handlePinColumn = (columnId, pinned) => {
    setPinnedColumns((prev) => ({
      ...prev,
      [columnId]: pinned,
    }));
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

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "";

    if (/^\d{2}:\d{2}:\d{2}/.test(timestamp)) {
      return timestamp;
    }

    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) {
        return timestamp;
      }

      return date.toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      });
    } catch (e) {
      return timestamp;
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

  // Check if a specific filter is active
  const isFilterActive = (filterType, filterValue) => {
    const { filters } = parseSearchQuery(filter);
    return (
      filters[filterType.toLowerCase()] &&
      filters[filterType.toLowerCase()].some(
        (value) => value.toLowerCase() === filterValue.toLowerCase()
      )
    );
  };

  // Check if a time range filter is active
  const isRangeFilterActive = (filterType) => {
    const { timeRangeFilters } = parseSearchQuery(filter);
    const baseKey = filterType.toLowerCase().replace(/_from$|_to$/, "");
    return timeRangeFilters[baseKey] !== undefined;
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

  const getLevelColor = (level) => {
    if (!level) return "default";

    switch (level.toLowerCase()) {
      case "error":
      case "fatal":
      case "severe":
        return "error";
      case "warn":
      case "warning":
        return "warning";
      case "info":
        return "info";
      case "debug":
      case "trace":
        return "success";
      default:
        return "default";
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

  const toggleFilter = (filterType, filterValue) => {
    const filterString = `${filterType}:"${filterValue}"`;

    const currentFilters = filter.split(" ").filter((f) => f.trim() !== "");

    const filterIndex = currentFilters.findIndex(
      (f) => f.toLowerCase() === filterString.toLowerCase()
    );

    if (filterIndex >= 0) {
      currentFilters.splice(filterIndex, 1);
    } else {
      currentFilters.push(filterString);
    }

    setFilter(currentFilters.join(" "));
  };

  const setRangeFilter = (filterType, value) => {
    const currentFilters = filter.split(" ").filter((f) => f.trim() !== "");

    const filterIndex = currentFilters.findIndex((f) =>
      f.toLowerCase().startsWith(`${filterType.toLowerCase()}:`)
    );

    const filterString = value ? `${filterType}:${value}` : "";

    if (filterIndex >= 0) {
      if (value) {
        currentFilters[filterIndex] = filterString;
      } else {
        currentFilters.splice(filterIndex, 1);
      }
    } else if (value) {
      currentFilters.push(filterString);
    }

    setFilter(currentFilters.join(" "));
  };

  const getDataGridRows = () => {
    return filteredLogs.map((log, index) => ({
      ...log,
      id: log.id || index.toString(),
    }));
  };

  const getDataGridColumns = () => {
    return columns.map((col) => ({
      ...col,
      hide: columnVisibility[col.field] === false,
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

      <Box sx={{ display: "flex", flexGrow: 1, overflow: "hidden" }}>
        {/* DataGrid - Main log display */}
        <Box sx={{ flexGrow: 1, overflow: "hidden", position: "relative" }}>
          <DataGrid
            ref={dataGridRef}
            rows={getDataGridRows()}
            columns={getDataGridColumns()}
            pageSize={pageSize}
            rowsPerPageOptions={[25, 50, 100, 250, 500]}
            onPageSizeChange={(newPageSize) => setPageSize(newPageSize)}
            density={densityLevel}
            disableSelectionOnClick
            loading={loading}
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
              },
              "& .MuiDataGrid-columnHeader": {
                fontSize: `${fontSize}px`,
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
                refreshPaused,
                setRefreshPaused,
                autoScroll,
                setAutoScroll,
                handleGoHome,
                showQuickFilter: true,
                quickFilterProps: { debounceMs: 300 },
              },
            }}
            initialState={{
              sorting: {
                sortModel: [],
              },
            }}
          />
        </Box>
      </Box>

      {/* Settings Drawer */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{
          sx: { width: 300 },
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Display Settings
          </Typography>
          <Divider sx={{ mb: 2 }} />

          <Typography variant="subtitle2" gutterBottom>
            Font Size
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
            <Typography variant="body2" sx={{ mr: 1 }}>
              Small
            </Typography>
            <Slider
              value={fontSize}
              min={10}
              max={18}
              step={1}
              onChange={(_, newValue) => setFontSize(newValue)}
              sx={{ mx: 2 }}
            />
            <Typography variant="body2" sx={{ ml: 1 }}>
              Large
            </Typography>
          </Box>

          <Typography variant="subtitle2" gutterBottom>
            Density
          </Typography>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <Select
              value={densityLevel}
              onChange={(e) => setDensityLevel(e.target.value)}
              size="small"
            >
              <MenuItem value="compact">Compact</MenuItem>
              <MenuItem value="standard">Standard</MenuItem>
              <MenuItem value="comfortable">Comfortable</MenuItem>
            </Select>
          </FormControl>

          <Typography variant="subtitle2" gutterBottom>
            Visible Columns
          </Typography>
          <Box sx={{ mb: 2, maxHeight: 300, overflow: "auto" }}>
            {columns.map((column) => (
              <FormControlLabel
                key={column.field}
                control={
                  <Switch
                    checked={columnVisibility[column.field] !== false}
                    onChange={() => handleToggleColumn(column.field)}
                    size="small"
                  />
                }
                label={
                  <Typography variant="body2">{column.headerName}</Typography>
                }
              />
            ))}
          </Box>

          <Typography variant="subtitle2" gutterBottom>
            Pinned Columns
          </Typography>
          <Box sx={{ mb: 2 }}>
            {columns.map((column) => (
              <Box
                key={`pin-${column.field}`}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  mb: 1,
                }}
              >
                <Typography variant="body2">{column.headerName}</Typography>
                <FormControl size="small" sx={{ minWidth: 100 }}>
                  <Select
                    value={pinnedColumns[column.field] || "none"}
                    onChange={(e) =>
                      handlePinColumn(
                        column.field,
                        e.target.value === "none" ? null : e.target.value
                      )
                    }
                    size="small"
                  >
                    <MenuItem value="none">None</MenuItem>
                    <MenuItem value="left">Left</MenuItem>
                    <MenuItem value="right">Right</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            ))}
          </Box>

          <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end" }}>
            <Button variant="contained" onClick={() => setDrawerOpen(false)}>
              Close
            </Button>
          </Box>
        </Box>
      </Drawer>

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
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          p: 1,
          borderTop: "1px solid",
          borderColor: "divider",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          bgcolor: "background.paper",
          zIndex: 2,
        }}
      >
        <Typography variant="caption" color="text.secondary">
          {filteredLogs.length} of {logs.length} logs displayed
          {refreshPaused && " (Updates paused)"}
        </Typography>
      </Box>
    </Box>
  );
};

export default ViewerPage;
