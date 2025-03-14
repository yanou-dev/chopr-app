import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Drawer,
  AppBar,
  Toolbar,
  IconButton,
  TextField,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  Checkbox,
  FormControlLabel,
  Button,
  CircularProgress,
  Tooltip,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Alert,
  Snackbar
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import {
  ArrowBack as ArrowBackIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  PlayArrow as PlayArrowIcon,
  Stop as StopIcon,
  Refresh as RefreshIcon,
  FilterList as FilterListIcon,
  MoreVert as MoreVertIcon,
  Download as DownloadIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon
} from '@mui/icons-material';
import { useTheme } from '../contexts/ThemeContext';

// Utility function to parse logs based on format
const parseLog = (log, parserType) => {
  try {
    if (parserType === 'json') {
      return JSON.parse(log);
    } else if (parserType === 'log4j') {
      // Simple Log4j parser (can be improved for more complex formats)
      const regex = /\[(INFO|WARN|ERROR|DEBUG)\]\s+(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})\s+-\s+([^-]+)\s+-\s+(.*)/;
      const match = log.match(regex);
      
      if (match) {
        return {
          level: match[1],
          timestamp: match[2],
          class: match[3].trim(),
          message: match[4]
        };
      }
      
      return { message: log };
    } else if (parserType === 'nodejs') {
      // Simple Node.js console.log parser
      const timestamp = new Date().toISOString();
      return {
        timestamp,
        message: log
      };
    }
    
    // Default fallback
    return { message: log };
  } catch (error) {
    console.warn('Error parsing log:', error);
    return { message: log, _raw: log };
  }
};

// Get log level color
const getLevelColor = (level) => {
  if (!level) return 'default';
  
  const levelLower = level.toLowerCase();
  if (levelLower.includes('error')) return 'error';
  if (levelLower.includes('warn')) return 'warning';
  if (levelLower.includes('info')) return 'info';
  if (levelLower.includes('debug')) return 'default';
  
  return 'default';
};

const ViewerPage = ({ project }) => {
  const navigate = useNavigate();
  const { mode, toggleTheme } = useTheme();
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [fields, setFields] = useState([]);
  const [fieldFilters, setFieldFilters] = useState({});
  const [isRunning, setIsRunning] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const [drawerWidth, setDrawerWidth] = useState(280);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [exportDialog, setExportDialog] = useState(false);
  
  // Unique ID for this log source
  const logSourceId = useRef(`log-source-${Date.now()}`);
  
  // Reference to keep track of unsubscribe function
  const unsubscribeRef = useRef(null);
  
  // Initialize and start log collection
  useEffect(() => {
    if (!project) {
      navigate('/');
      return;
    }
    
    startLogCollection();
    
    // Set up event listeners for command output
    const unsubscribeOutput = window.electron.onCommandOutput((data) => {
      if (data.id === logSourceId.current) {
        handleLogData(data.data);
      }
    });
    
    const unsubscribeClosed = window.electron.onCommandClosed((data) => {
      if (data.id === logSourceId.current) {
        setIsRunning(false);
        showSnackbar(`Command exited with code ${data.code}`, data.code === 0 ? 'info' : 'warning');
      }
    });
    
    // Store unsubscribe function
    unsubscribeRef.current = () => {
      unsubscribeOutput();
      unsubscribeClosed();
    };
    
    return () => {
      // Clean up
      stopLogCollection();
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [project, navigate]);
  
  // Apply filters when logs, searchQuery, or fieldFilters change
  useEffect(() => {
    applyFilters();
  }, [logs, searchQuery, fieldFilters]);
  
  const startLogCollection = async () => {
    try {
      setLoading(true);
      setError('');
      
      if (project.source.type === 'command') {
        const result = await window.electron.startCommand(
          logSourceId.current,
          project.source.value
        );
        
        if (result.success) {
          setIsRunning(true);
          showSnackbar('Command started successfully', 'success');
        } else {
          setError(`Failed to start command: ${result.error}`);
          showSnackbar(`Failed to start command: ${result.error}`, 'error');
        }
      } else if (project.source.type === 'file') {
        const result = await window.electron.watchFile(
          logSourceId.current,
          project.source.value
        );
        
        if (result.success) {
          setIsRunning(true);
          showSnackbar('File watching started successfully', 'success');
        } else {
          setError(`Failed to watch file: ${result.error}`);
          showSnackbar(`Failed to watch file: ${result.error}`, 'error');
        }
      }
    } catch (error) {
      console.error('Error starting log collection:', error);
      setError('An error occurred while starting log collection');
      showSnackbar('An error occurred while starting log collection', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  const stopLogCollection = async () => {
    try {
      const result = await window.electron.stopCommand(logSourceId.current);
      
      if (result.success) {
        setIsRunning(false);
        showSnackbar('Log collection stopped', 'info');
      } else {
        console.error('Failed to stop command:', result.error);
      }
    } catch (error) {
      console.error('Error stopping log collection:', error);
    }
  };
  
  const handleLogData = (data) => {
    // Split data by newlines and process each line
    const lines = data.split('\n').filter(line => line.trim());
    
    if (lines.length === 0) return;
    
    const newLogs = lines.map((line, index) => {
      const parsedLog = parseLog(line, project.parser.type);
      return {
        id: `log-${Date.now()}-${index}`,
        timestamp: new Date().toISOString(),
        ...parsedLog,
        _raw: line
      };
    });
    
    setLogs(prevLogs => {
      // Limit to 10,000 logs to prevent memory issues
      const updatedLogs = [...newLogs, ...prevLogs].slice(0, 10000);
      
      // Update fields based on all log keys
      updateFields(updatedLogs);
      
      return updatedLogs;
    });
  };
  
  const updateFields = (logs) => {
    if (logs.length === 0) return;
    
    // Get all unique field names from logs
    const allFields = new Set();
    logs.forEach(log => {
      Object.keys(log).forEach(key => {
        if (!key.startsWith('_') && key !== 'id') {
          allFields.add(key);
        }
      });
    });
    
    // Convert to array and sort
    const fieldArray = Array.from(allFields).sort();
    
    // Only update if fields have changed
    if (JSON.stringify(fieldArray) !== JSON.stringify(fields)) {
      setFields(fieldArray);
    }
  };
  
  const applyFilters = () => {
    let filtered = [...logs];
    
    // Apply field filters
    Object.entries(fieldFilters).forEach(([field, values]) => {
      if (values && values.length > 0) {
        filtered = filtered.filter(log => 
          values.includes(String(log[field]))
        );
      }
    });
    
    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      
      // Check if it's a field-specific search (e.g., "level:ERROR")
      const fieldSearch = query.match(/^(\w+):(.+)$/);
      
      if (fieldSearch) {
        const [, field, value] = fieldSearch;
        filtered = filtered.filter(log => {
          const logValue = log[field];
          return logValue && String(logValue).toLowerCase().includes(value.trim());
        });
      } else {
        // Full text search across all fields
        filtered = filtered.filter(log => {
          return Object.entries(log).some(([key, value]) => {
            if (key.startsWith('_') || key === 'id') return false;
            return String(value).toLowerCase().includes(query);
          });
        });
      }
    }
    
    setFilteredLogs(filtered);
  };
  
  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };
  
  const clearSearch = () => {
    setSearchQuery('');
  };
  
  const toggleFieldFilter = (field, value) => {
    setFieldFilters(prev => {
      const current = prev[field] || [];
      const updated = current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value];
      
      return {
        ...prev,
        [field]: updated
      };
    });
  };
  
  const getUniqueFieldValues = (field) => {
    const values = new Set();
    logs.forEach(log => {
      if (log[field] !== undefined) {
        values.add(String(log[field]));
      }
    });
    return Array.from(values).sort();
  };
  
  const handleMenuOpen = (event) => {
    setMenuAnchorEl(event.currentTarget);
  };
  
  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };
  
  const handleExport = () => {
    setExportDialog(true);
    handleMenuClose();
  };
  
  const exportLogs = (format) => {
    try {
      const logsToExport = filteredLogs.length > 0 ? filteredLogs : logs;
      let content = '';
      
      if (format === 'json') {
        content = JSON.stringify(logsToExport, null, 2);
      } else if (format === 'csv') {
        // Get all unique fields
        const allFields = new Set();
        logsToExport.forEach(log => {
          Object.keys(log).forEach(key => {
            if (!key.startsWith('_') && key !== 'id') {
              allFields.add(key);
            }
          });
        });
        
        const headers = Array.from(allFields);
        content = headers.join(',') + '\n';
        
        logsToExport.forEach(log => {
          const row = headers.map(field => {
            const value = log[field] !== undefined ? log[field] : '';
            // Escape commas and quotes in CSV
            return `"${String(value).replace(/"/g, '""')}"`;
          });
          content += row.join(',') + '\n';
        });
      }
      
      // Create a blob and download
      const blob = new Blob([content], { type: format === 'json' ? 'application/json' : 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `logviewer-export-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      showSnackbar(`Logs exported successfully as ${format.toUpperCase()}`, 'success');
    } catch (error) {
      console.error('Error exporting logs:', error);
      showSnackbar('Error exporting logs', 'error');
    } finally {
      setExportDialog(false);
    }
  };
  
  const showSnackbar = (message, severity = 'info') => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };
  
  const handleSnackbarClose = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };
  
  const handleBack = () => {
    navigate('/');
  };
  
  // Prepare columns for DataGrid
  const columns = fields.map(field => ({
    field,
    headerName: field.charAt(0).toUpperCase() + field.slice(1),
    flex: field === 'message' ? 2 : 1,
    minWidth: 150,
    renderCell: (params) => {
      if (field === 'level') {
        return (
          <Chip 
            label={params.value || 'unknown'} 
            size="small" 
            color={getLevelColor(params.value)}
            variant={mode === 'dark' ? 'outlined' : 'filled'}
          />
        );
      }
      return params.value;
    }
  }));
  
  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      {/* App Bar */}
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleBack}
            sx={{ mr: 2 }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {project?.name || 'Log Viewer'}
          </Typography>
          
          {/* Search Bar */}
          <Box sx={{ display: 'flex', bgcolor: 'background.paper', borderRadius: 1, px: 1, width: '30%' }}>
            <IconButton sx={{ p: '10px' }} aria-label="search">
              <SearchIcon />
            </IconButton>
            <TextField
              sx={{ ml: 1, flex: 1 }}
              placeholder="Search logs or field:value"
              value={searchQuery}
              onChange={handleSearchChange}
              variant="standard"
              InputProps={{ disableUnderline: true }}
            />
            {searchQuery && (
              <IconButton sx={{ p: '10px' }} aria-label="clear" onClick={clearSearch}>
                <ClearIcon />
              </IconButton>
            )}
          </Box>
          
          {/* Control Buttons */}
          <Box sx={{ display: 'flex', ml: 2 }}>
            <Tooltip title={isRunning ? "Stop Log Collection" : "Start Log Collection"}>
              <IconButton
                color="inherit"
                onClick={isRunning ? stopLogCollection : startLogCollection}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 
                 isRunning ? <StopIcon /> : <PlayArrowIcon />}
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Toggle Theme">
              <IconButton color="inherit" onClick={toggleTheme}>
                {mode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
              </IconButton>
            </Tooltip>
            
            <Tooltip title="More Options">
              <IconButton
                color="inherit"
                onClick={handleMenuOpen}
              >
                <MoreVertIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>
      
      {/* Options Menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleExport}>
          <DownloadIcon fontSize="small" sx={{ mr: 1 }} />
          Export Logs
        </MenuItem>
        <MenuItem onClick={() => { setLogs([]); handleMenuClose(); }}>
          <ClearIcon fontSize="small" sx={{ mr: 1 }} />
          Clear Logs
        </MenuItem>
        <MenuItem onClick={() => { updateFields(logs); handleMenuClose(); }}>
          <RefreshIcon fontSize="small" sx={{ mr: 1 }} />
          Refresh Fields
        </MenuItem>
      </Menu>
      
      {/* Export Dialog */}
      <Dialog open={exportDialog} onClose={() => setExportDialog(false)}>
        <DialogTitle>Export Logs</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Choose a format to export {filteredLogs.length > 0 ? filteredLogs.length : logs.length} logs:
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExportDialog(false)}>Cancel</Button>
          <Button onClick={() => exportLogs('json')} variant="outlined">JSON</Button>
          <Button onClick={() => exportLogs('csv')} variant="contained">CSV</Button>
        </DialogActions>
      </Dialog>
      
      {/* Left Drawer - Field Filters */}
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto', p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" component="div">
              Fields
            </Typography>
            <Tooltip title="Refresh Fields">
              <IconButton size="small" onClick={() => updateFields(logs)}>
                <RefreshIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
          
          <Divider sx={{ mb: 2 }} />
          
          {fields.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No fields detected yet. Start log collection to see available fields.
            </Typography>
          ) : (
            <List>
              {fields.map((field) => {
                const values = getUniqueFieldValues(field);
                return (
                  <Box key={field} sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                      {field.charAt(0).toUpperCase() + field.slice(1)}
                    </Typography>
                    
                    {values.length > 0 ? (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {values.map((value) => (
                          <Chip
                            key={`${field}-${value}`}
                            label={value}
                            size="small"
                            color={fieldFilters[field]?.includes(value) ? 'primary' : 'default'}
                            onClick={() => toggleFieldFilter(field, value)}
                            variant={fieldFilters[field]?.includes(value) ? 'filled' : 'outlined'}
                            sx={{ mb: 1 }}
                          />
                        ))}
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No values for this field
                      </Typography>
                    )}
                  </Box>
                );
              })}
            </List>
          )}
        </Box>
      </Drawer>
      
      {/* Main Content */}
      <Box component="main" sx={{ flexGrow: 1, p: 3, pt: 0 }}>
        <Toolbar />
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {/* Log Table */}
        <Paper sx={{ height: 'calc(100vh - 140px)', width: '100%' }}>
          <DataGrid
            rows={filteredLogs}
            columns={columns}
            initialState={{
              pagination: {
                paginationModel: { page: 0, pageSize: 100 },
              },
              sorting: {
                sortModel: [{ field: 'timestamp', sort: 'desc' }],
              },
            }}
            pageSizeOptions={[25, 50, 100]}
            disableRowSelectionOnClick
            getRowClassName={(params) => {
              const level = params.row.level?.toLowerCase();
              if (level?.includes('error')) return 'error-row';
              if (level?.includes('warn')) return 'warning-row';
              return '';
            }}
            sx={{
              '& .error-row': {
                bgcolor: (theme) => 
                  theme.palette.mode === 'dark' ? 'rgba(255, 0, 0, 0.1)' : 'rgba(255, 0, 0, 0.05)',
              },
              '& .warning-row': {
                bgcolor: (theme) => 
                  theme.palette.mode === 'dark' ? 'rgba(255, 255, 0, 0.1)' : 'rgba(255, 255, 0, 0.05)',
              },
            }}
          />
        </Paper>
        
        {/* Auto-scroll Control */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={autoScroll}
                onChange={(e) => setAutoScroll(e.target.checked)}
              />
            }
            label="Auto-scroll to new logs"
          />
        </Box>
      </Box>
      
      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ViewerPage;
