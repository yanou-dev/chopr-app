import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Chip,
  FormControl,
  IconButton,
  InputLabel,
  Menu,
  MenuItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import HomeIcon from "@mui/icons-material/Home";
import SettingsIcon from "@mui/icons-material/Settings";
import DownloadIcon from "@mui/icons-material/Download";
import SearchIcon from "@mui/icons-material/Search";
import VerticalAlignBottomIcon from "@mui/icons-material/VerticalAlignBottom";
import TitleBar from "../components/TitleBar";
import LogParser from "../parsers/LogParser";
import JSONParser from "../parsers/JSONParser";

const ViewerPage = ({ project }) => {
  const navigate = useNavigate();
  const parser =
    project.parser.type === "json"
      ? new JSONParser()
      : new LogParser(project.parser.type);

  const [logs, setLogs] = useState([]);
  const [columns, setColumns] = useState(parser.getColumns());
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("");
  const [levelFilter, setLevelFilter] = useState("all");
  const [anchorEl, setAnchorEl] = useState(null);
  const [commandId, setCommandId] = useState(null);
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [autoScroll, setAutoScroll] = useState(true);
  const tableContainerRef = useRef(null);

  parser.on("columnsChanged", (columns) => {
    setColumns(columns);
  });

  const generateSearchSuggestions = (logs) => {
    const suggestions = new Set();

    columns.forEach((column) => {
      if (!["message", "rawLog", "id"].includes(column.id)) {
        suggestions.add(`${column.id}:`);
      }
    });

    if (logs.length > 0) {
      logs.forEach((log) => {
        columns.forEach((column) => {
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
    if (autoScroll && tableContainerRef.current) {
      const container = tableContainerRef.current;
      container.scrollTop = container.scrollHeight;
    }
  }, [logs, autoScroll]);

  const addLogEntry = (logEntry) => {
    console.log("Adding log entry:", logEntry);

    const logId = crypto.randomUUID();
    logEntry.id = logId;

    setLogs((prevLogs) => {
      const exists = prevLogs.some((log) => log.id === logId);
      if (exists) {
        console.log("Log entry already exists, skipping");
        return prevLogs;
      }

      console.log("Adding new log entry to logs array");
      return [...prevLogs, logEntry];
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

            console.log("parsedData :", parsedData);

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

  const handleExportLogs = () => {
    handleMenuClose();

    console.log("Export logs");
  };

  const handleGoHome = () => {
    if (commandId) {
      window.electron.stopCommand(commandId);
    }
    navigate("/");
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
      console.error("Erreur lors du parsing de la date:", e);
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

  const filteredLogs = logs.filter((log) => {
    if (
      columns.some((col) => col.id === "level") &&
      levelFilter !== "all" &&
      log.level &&
      log.level.toLowerCase() !== levelFilter.toLowerCase()
    ) {
      return false;
    }

    if (!filter) return true;

    const { filters, timeRangeFilters, textFilter } = parseSearchQuery(filter);

    for (const [key, values] of Object.entries(filters)) {
      if (columns.some((col) => col.id === key)) {
        if (!log[key]) return false;

        const logValue = log[key].toString().toLowerCase();

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
      if (columns.some((col) => col.id === key) && log[key]) {
        const logValue = log[key];
        let logTimestamp;

        try {
          logTimestamp = parseDate(logValue);

          if (isNaN(logTimestamp)) {
            logTimestamp = logValue;
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
          console.error(
            `Erreur lors du filtrage par intervalle pour ${key}:`,
            e
          );
        }
      }
    }

    if (
      textFilter &&
      log.message &&
      !log.message.toLowerCase().includes(textFilter.toLowerCase())
    ) {
      return false;
    }

    return true;
  });

  const getLevelColor = (level) => {
    if (!level) return "default";

    switch (level.toLowerCase()) {
      case "error":
        return "error";
      case "warn":
      case "warning":
        return "warning";
      case "info":
        return "info";
      case "debug":
        return "success";
      default:
        return "default";
    }
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

  const handleScroll = (e) => {
    const container = e.target;
    const isScrolledToBottom =
      Math.abs(
        container.scrollHeight - container.scrollTop - container.clientHeight
      ) < 10;

    if (!isScrolledToBottom && autoScroll) {
      setAutoScroll(false);
    }

    if (isScrolledToBottom && !autoScroll) {
      setAutoScroll(true);
    }
  };

  const renderLog = (column, log) => {
    return (
      <TableCell
        key={column.id}
        sx={{
          fontFamily: "monospace",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}
      >
        {log[column.id]}
      </TableCell>
    );
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

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          p: 1,
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <Tooltip title="Retour à l'accueil">
            <IconButton onClick={handleGoHome} size="small">
              <HomeIcon />
            </IconButton>
          </Tooltip>
          <Tooltip
            title={
              autoScroll
                ? "Désactiver le défilement automatique"
                : "Activer le défilement automatique"
            }
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

        <Box sx={{ display: "flex", alignItems: "center", flexGrow: 1, mx: 2 }}>
          <Box
            sx={{
              position: "relative",
              width: "100%",
              maxWidth: 600,
              mx: "auto",
            }}
          >
            <TextField
              placeholder="Rechercher dans les logs (ex: thread:main level:error)..."
              variant="outlined"
              size="small"
              fullWidth
              value={filter}
              onChange={handleFilterChange}
              InputProps={{
                startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />,
              }}
            />
            {filter && searchSuggestions.length > 0 && (
              <Box
                sx={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  right: 0,
                  zIndex: 10,
                  mt: 0.5,
                  bgcolor: "background.paper",
                  boxShadow: 3,
                  borderRadius: 1,
                  maxHeight: 200,
                  overflow: "auto",
                }}
              >
                {searchSuggestions
                  .filter((suggestion) =>
                    suggestion.toLowerCase().includes(filter.toLowerCase())
                  )
                  .slice(0, 5)
                  .map((suggestion, index) => (
                    <Box
                      key={index}
                      sx={{
                        p: 1,
                        cursor: "pointer",
                        "&:hover": { bgcolor: "action.hover" },
                      }}
                      onClick={() => setFilter(suggestion)}
                    >
                      {suggestion}
                    </Box>
                  ))}
              </Box>
            )}
          </Box>
        </Box>
      </Box>

      <Box sx={{ display: "flex", flexGrow: 1, overflow: "hidden" }}>
        {/* Volet de filtres à gauche */}
        <Box
          sx={{
            width: 250,
            borderRight: "1px solid",
            borderColor: "divider",
            p: 2,
            display: "flex",
            flexDirection: "column",
            overflow: "auto",
          }}
        >
          <Typography variant="subtitle2" gutterBottom>
            Filtres rapides
          </Typography>

          {logs.length > 0 && columns.length > 0 && (
            <>
              {/* Cas spécial pour le niveau (level) avec code couleur */}
              {columns.some((col) => col.id === "level") && (
                <>
                  <Typography
                    variant="body2"
                    sx={{ mt: 2, mb: 1, fontWeight: "bold" }}
                  >
                    Niveau de log
                  </Typography>
                  {["info", "debug", "warn", "error"].map((level) => (
                    <Box
                      key={level}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        mb: 0.5,
                        p: 0.5,
                        borderRadius: 1,
                        cursor: "pointer",
                        bgcolor: filter.toLowerCase().includes(`level:${level}`)
                          ? "action.selected"
                          : "transparent",
                        "&:hover": { bgcolor: "action.hover" },
                      }}
                      onClick={() => toggleFilter("level", level)}
                    >
                      <Chip
                        label={level}
                        size="small"
                        color={getLevelColor(level)}
                        sx={{ mr: 1, textTransform: "capitalize" }}
                      />
                      <Typography variant="body2">
                        {level.charAt(0).toUpperCase() + level.slice(1)}
                      </Typography>
                    </Box>
                  ))}
                </>
              )}

              {/* Génération dynamique des filtres pour toutes les autres colonnes */}
              {columns
                .filter(
                  (col) =>
                    col.id !== "level" &&
                    col.id !== "message" &&
                    col.id !== "rawLog" &&
                    col.id !== "id"
                )
                .map((column) => {
                  const isTimeColumn = [
                    "date",
                    "time",
                    "timestamp",
                    "datetime",
                  ].some((timeWord) =>
                    column.id.toLowerCase().includes(timeWord)
                  );

                  if (isTimeColumn) {
                    return (
                      <React.Fragment key={column.id}>
                        <Typography
                          variant="body2"
                          sx={{ mt: 2, mb: 1, fontWeight: "bold" }}
                        >
                          {column.label}
                        </Typography>
                        <Box sx={{ p: 1 }}>
                          <Typography
                            variant="caption"
                            display="block"
                            gutterBottom
                          >
                            Filtrer par intervalle
                          </Typography>
                          <Box
                            sx={{
                              display: "flex",
                              gap: 1,
                              alignItems: "center",
                            }}
                          >
                            <TextField
                              size="small"
                              placeholder="Début"
                              variant="outlined"
                              sx={{ flex: 1 }}
                              onChange={(e) => {
                                setRangeFilter(
                                  `${column.id}_from`,
                                  e.target.value
                                );
                              }}
                            />
                            <Typography variant="body2">à</Typography>
                            <TextField
                              size="small"
                              placeholder="Fin"
                              variant="outlined"
                              sx={{ flex: 1 }}
                              onChange={(e) => {
                                setRangeFilter(
                                  `${column.id}_to`,
                                  e.target.value
                                );
                              }}
                            />
                          </Box>
                        </Box>
                      </React.Fragment>
                    );
                  } else {
                    const values = Array.from(
                      new Set(logs.map((log) => log[column.id]).filter(Boolean))
                    );
                    if (values.length === 0) return null;

                    return (
                      <React.Fragment key={column.id}>
                        <Typography
                          variant="body2"
                          sx={{ mt: 2, mb: 1, fontWeight: "bold" }}
                        >
                          {column.label}
                        </Typography>
                        {values.slice(0, 10).map((value) => (
                          <Box
                            key={`${column.id}-${value}`}
                            sx={{
                              p: 0.5,
                              borderRadius: 1,
                              cursor: "pointer",
                              "&:hover": { bgcolor: "action.hover" },
                            }}
                            onClick={() => toggleFilter(column.id, value)}
                          >
                            <Typography variant="body2" noWrap>
                              {value}
                            </Typography>
                          </Box>
                        ))}
                      </React.Fragment>
                    );
                  }
                })}
            </>
          )}
        </Box>

        {/* Tableau des logs */}
        <TableContainer
          ref={tableContainerRef}
          sx={{ flexGrow: 1, overflow: "auto" }}
          onScroll={handleScroll}
        >
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                {columns.map((column) => (
                  <TableCell
                    key={column.id}
                    width={column.width}
                    sx={{
                      fontWeight: "bold",
                      whiteSpace: "nowrap",
                      backgroundColor: (theme) =>
                        theme.palette.background.paper,
                    }}
                  >
                    {column.label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={columns.length} align="center">
                    <Typography>Loading logs...</Typography>
                  </TableCell>
                </TableRow>
              ) : filteredLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length} align="center">
                    <Typography>No logs to display</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredLogs.map((log, index) => (
                  <TableRow
                    key={index}
                    hover
                    sx={{
                      "&:hover": {
                        backgroundColor: (theme) => theme.palette.action.hover,
                      },
                    }}
                  >
                    {columns.map((column) => renderLog(column, log))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Box>
  );
};

export default ViewerPage;
