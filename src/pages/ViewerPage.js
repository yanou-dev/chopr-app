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
  DataGridPro,
  GridToolbarContainer,
  GridToolbarColumnsButton,
  GridToolbarFilterButton,
  GridToolbarDensitySelector,
} from "@mui/x-data-grid-pro";
import { frFR } from "@mui/x-data-grid-pro/locales";
import VerticalAlignBottomIcon from "@mui/icons-material/VerticalAlignBottom";
import ClearAllIcon from "@mui/icons-material/ClearAll";
import TitleBar from "../components/TitleBar";
import LogParser from "../parsers/LogParser";
import JSONParser from "../parsers/JSONParser";
import { useTranslation } from "../i18n/i18n";
import { useTheme } from "../contexts/ThemeContext";

const CustomToolbar = (props) => {
  const {
    handleClearLogs,
    autoScroll,
    setAutoScroll,
    scrollToBottom,
    setUserScrolled,
    densityLevel,
    setDensityLevel,
    apiRef,
  } = props;

  const { t } = useTranslation();

  // Gérer le changement de densité
  const handleDensityChange = (newDensity) => {
    setDensityLevel(newDensity);

    // Forcer la mise à jour du composant DataGrid
    if (apiRef.current) {
      apiRef.current.setDensity(newDensity);
    }
  };

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
        <GridToolbarDensitySelector onChange={handleDensityChange} />
      </Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Button
          variant="text"
          size="small"
          startIcon={<ClearAllIcon />}
          onClick={handleClearLogs}
        >
          {t("clearLogsButton")}
        </Button>
        <Button
          variant={autoScroll ? "contained" : "text"}
          size="small"
          startIcon={<VerticalAlignBottomIcon />}
          onClick={() => {
            const newAutoScrollState = !autoScroll;
            setAutoScroll(newAutoScrollState);
            if (newAutoScrollState) {
              setUserScrolled(false);
              setTimeout(scrollToBottom, 0);
            }
          }}
          disableElevation
        >
          {autoScroll ? t("autoScrollEnabled") : t("autoScrollDisabled")}
        </Button>
      </Box>
    </GridToolbarContainer>
  );
};

const ViewerPage = ({ project }) => {
  const navigate = useNavigate();
  const { t, language } = useTranslation();
  const { mode } = useTheme();
  const parser =
    project?.parser?.type === "json"
      ? new JSONParser()
      : new LogParser(project?.parser?.type);

  // State variables
  const [logs, setLogs] = useState([]);
  const [columns, setColumns] = useState([]);
  const [loading, setLoading] = useState(false);
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
  const [filterModel, setFilterModel] = useState({
    items: [],
  });
  const [userScrolled, setUserScrolled] = useState(false);

  const gridContainerRef = useRef(null);
  const lastAddedLogRef = useRef(null);
  const apiRef = useRef(null);

  useEffect(() => {
    parser.on("columnsChanged", (newColumns) => {
      const gridColumns = newColumns.map((col) => {
        return {
          field: col.id,
          headerName: col.label,
          width: apiRef.current?.state?.columns?.lookup?.[col.id]?.width || 150,
          sortable: true,
          filterable: true,
          resizable: true,
          flex: col.id === "message" ? 1 : 0,
          renderCell: (params) => renderCell(col.id, params.value),
          hide: columnVisibility[col.field] === false,
        };
      });
      setColumns(gridColumns);
    });
  }, [parser, columnVisibility]);

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

  // Nouveau gestionnaire d'événements de défilement
  const handleScroll = useCallback(() => {
    if (!gridContainerRef.current) return;

    const scrollableDiv = gridContainerRef.current.querySelector(
      ".MuiDataGrid-virtualScroller"
    );

    if (scrollableDiv) {
      const isAtBottom =
        Math.abs(
          scrollableDiv.scrollHeight -
            scrollableDiv.clientHeight -
            scrollableDiv.scrollTop
        ) < 10;

      // Si l'utilisateur n'est pas au bas de la page, désactiver l'auto-scroll
      if (!isAtBottom && autoScroll && !userScrolled) {
        setUserScrolled(true);
        setAutoScroll(false);
      }
    }
  }, [autoScroll, userScrolled]);

  // Attacher et détacher l'écouteur d'événements de défilement
  useEffect(() => {
    const scrollableDiv = gridContainerRef.current?.querySelector(
      ".MuiDataGrid-virtualScroller"
    );

    if (scrollableDiv) {
      scrollableDiv.addEventListener("scroll", handleScroll);

      return () => {
        scrollableDiv.removeEventListener("scroll", handleScroll);
      };
    }
  }, [handleScroll]);

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
      showSnackbar(t("errorStartingLogCollection"));
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
    showSnackbar(t("logsCleared"));
  };

  const showSnackbar = (message) => {
    setSnackbarMessage(message);
    setSnackbarOpen(true);
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  const getLevelColor = (level) => {
    if (!level) return "default";

    const levelLower = level.toLowerCase();

    // Pour conserver la cohérence avec les liserets, on utilise des couleurs personnalisées
    switch (levelLower) {
      case "fatal":
      case "severe":
      case "error":
        return "error"; // Utilise la couleur d'erreur de Material UI
      case "warn":
      case "warning":
        return "warning"; // Utilise la couleur d'avertissement de Material UI
      case "info":
        return "info"; // La couleur info de Material UI est proche de celle qu'on utilise
      case "debug":
        return "secondary"; // Pour la couleur violette
      case "trace":
        return "success"; // Pour la couleur verte/teal, success est la plus proche
      default:
        return "default"; // Gris neutre pour les cas non définis
    }
  };

  const renderCell = (columnId, value) => {
    if (columnId === "level" && value) {
      const levelLower = value.toLowerCase();
      let chipColor = getLevelColor(levelLower);
      let customColor = null;

      // Pour les types spécifiques qui nécessitent des couleurs personnalisées
      if (levelLower === "debug") {
        customColor = mode === "dark" ? "#8e24aa" : "#7b1fa2"; // Violet
      } else if (levelLower === "trace") {
        customColor = mode === "dark" ? "#00897b" : "#00796b"; // Vert/Teal
      }

      return (
        <Chip
          label={value}
          size="small"
          color={chipColor}
          sx={{
            textTransform: "capitalize",
            fontWeight:
              levelLower === "error" ||
              levelLower === "fatal" ||
              levelLower === "severe"
                ? "bold"
                : "normal",
            fontSize: `${fontSize}px`,
            ...(customColor && {
              bgcolor: customColor,
              color: "#fff",
              "& .MuiChip-label": { color: "#fff" },
            }),
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
            wordBreak: "break-word",
            fontSize: `${fontSize}px`,
            textOverflow: "ellipsis",
            overflow: "hidden",
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
    // If no filters are active, return all logs
    if (filterModel.items.length === 0 && levelFilter === "all") {
      return logs;
    }

    return logs.filter((log) => {
      // Apply level filter
      if (
        levelFilter !== "all" &&
        log.level &&
        log.level.toLowerCase() !== levelFilter.toLowerCase()
      ) {
        return false;
      }

      // S'il n'y a pas de filtres, ou si le log correspond au levelFilter uniquement, retourner true
      if (filterModel.items.length === 0) {
        return true;
      }

      // Appliquer les filtres de colonne selon le logicOperator
      const logicOperator = filterModel.logicOperator || "or";

      if (logicOperator === "or") {
        // Si l'opérateur est OR, au moins un filtre doit correspondre
        return filterModel.items.some((filterItem) => {
          const { field, operator, value } = filterItem;

          // Si le log n'a pas ce champ ou que la valeur est indéfinie, ce filtre ne correspond pas
          if (log[field] === undefined) {
            return false;
          }

          const logValue = String(log[field]).toLowerCase();
          const filterValue = value?.toLowerCase() || "";

          switch (operator) {
            case "contains":
              return logValue.includes(filterValue);
            case "equals":
              return logValue === filterValue;
            case "startsWith":
              return logValue.startsWith(filterValue);
            case "endsWith":
              return logValue.endsWith(filterValue);
            case "isEmpty":
              return logValue === "";
            case "isNotEmpty":
              return logValue !== "";
            default:
              return true; // Opérateur inconnu - passer
          }
        });
      } else {
        // Si l'opérateur est AND, tous les filtres doivent correspondre
        return filterModel.items.every((filterItem) => {
          const { field, operator, value } = filterItem;

          // Si le log n'a pas ce champ ou que la valeur est indéfinie, ce filtre ne correspond pas
          if (log[field] === undefined) {
            return false;
          }

          const logValue = String(log[field]).toLowerCase();
          const filterValue = value?.toLowerCase() || "";

          switch (operator) {
            case "contains":
              return logValue.includes(filterValue);
            case "equals":
              return logValue === filterValue;
            case "startsWith":
              return logValue.startsWith(filterValue);
            case "endsWith":
              return logValue.endsWith(filterValue);
            case "isEmpty":
              return logValue === "";
            case "isNotEmpty":
              return logValue !== "";
            default:
              return true; // Opérateur inconnu - passer
          }
        });
      }
    });
  }, [logs, filterModel, levelFilter]);

  const getDataGridRows = () => {
    return filteredLogs.map((log, index) => ({
      ...log,
      id: log.id || index.toString(),
    }));
  };

  const handleFilterModelChange = (newFilterModel) => {
    setFilterModel(newFilterModel);
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
          <DataGridPro
            showToolbar
            rows={getDataGridRows()}
            columns={columns}
            density={densityLevel}
            onDensityChange={(newDensity) => setDensityLevel(newDensity)}
            disableRowSelectionOnClick
            loading={loading}
            apiRef={apiRef}
            filterMode="server"
            onFilterModelChange={handleFilterModelChange}
            filterModel={filterModel}
            localeText={
              language === "fr"
                ? frFR.components.MuiDataGrid.defaultProps.localeText
                : undefined
            }
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
                if (level === "info") {
                  return "info-row";
                }
                if (level === "debug") {
                  return "debug-row";
                }
                if (level === "trace") {
                  return "trace-row";
                }
              }
              return "default-row"; // Surbrillance par défaut pour les logs sans niveau
            }}
            sx={{
              height: "100%",
              width: "100%",
              "& .MuiDataGrid-row": {
                borderBottom: "none",
                "&:nth-of-type(odd)": {
                  bgcolor: (theme) =>
                    theme.palette.mode === "dark"
                      ? "rgba(255, 255, 255, 0.02)"
                      : "rgba(0, 0, 0, 0.01)",
                },
                "&:hover": {
                  bgcolor: (theme) =>
                    theme.palette.mode === "dark"
                      ? "rgba(255, 255, 255, 0.05)"
                      : "rgba(0, 0, 0, 0.03)",
                },
              },
              "& .error-row": {
                borderLeft: (theme) => `3px solid ${theme.palette.error.main}`,
              },
              "& .warning-row": {
                borderLeft: (theme) =>
                  `3px solid ${theme.palette.warning.main}`,
              },
              "& .info-row": {
                borderLeft: (theme) =>
                  `3px solid ${
                    theme.palette.mode === "dark" ? "#0288d1" : "#0277bd"
                  }`,
              },
              "& .debug-row": {
                borderLeft: (theme) =>
                  `3px solid ${
                    theme.palette.mode === "dark" ? "#8e24aa" : "#7b1fa2"
                  }`,
              },
              "& .trace-row": {
                borderLeft: (theme) =>
                  `3px solid ${
                    theme.palette.mode === "dark" ? "#00897b" : "#00796b"
                  }`,
              },
              "& .default-row": {
                borderLeft: (theme) => `3px solid ${theme.palette.divider}`,
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
                handleClearLogs,
                autoScroll,
                setAutoScroll,
                scrollToBottom,
                setUserScrolled,
                densityLevel,
                setDensityLevel,
                apiRef,
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
        <DialogTitle>{t("clearLogsTitle")}</DialogTitle>
        <DialogContent>
          <Typography>{t("clearLogsConfirmation")}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setClearConfirmOpen(false)}>
            {t("cancelButton")}
          </Button>
          <Button onClick={confirmClearLogs} color="error">
            {t("clearButton")}
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
          {t("logsDisplayed", {
            filtered: filteredLogs.length,
            total: logs.length,
          })}
        </Typography>
      </Box>
    </Box>
  );
};

export default ViewerPage;
