import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Stepper,
  Step,
  StepLabel,
  FormControl,
  FormLabel,
  RadioGroup,
  Radio,
  FormControlLabel,
  MenuItem,
  Select,
  InputLabel,
  Container,
  IconButton,
  Tooltip,
  Alert
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  FolderOpen as FolderOpenIcon
} from '@mui/icons-material';
import { useTheme } from '../contexts/ThemeContext';

// Step components
const ProjectNameStep = ({ projectName, setProjectName }) => (
  <Box sx={{ mt: 2 }}>
    <Typography variant="h6" gutterBottom>
      Project Name
    </Typography>
    <Typography variant="body2" color="text.secondary" paragraph>
      Give your log visualization project a descriptive name.
    </Typography>
    <TextField
      fullWidth
      label="Project Name"
      variant="outlined"
      value={projectName}
      onChange={(e) => setProjectName(e.target.value)}
      placeholder="e.g. Kubernetes Logs, Java App Logs"
      required
      autoFocus
      sx={{ mt: 2 }}
    />
  </Box>
);

const LogSourceStep = ({ source, setSource, commandValue, setCommandValue, filePath, setFilePath }) => {
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
      console.error('Error selecting log file:', error);
    }
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="h6" gutterBottom>
        Log Source
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Select where your logs will come from.
      </Typography>
      
      <FormControl component="fieldset" sx={{ mb: 3 }}>
        <FormLabel component="legend">Source Type</FormLabel>
        <RadioGroup value={source} onChange={handleSourceChange}>
          <FormControlLabel 
            value="command" 
            control={<Radio />} 
            label="Command Output" 
          />
          <FormControlLabel 
            value="file" 
            control={<Radio />} 
            label="Log File" 
          />
          <FormControlLabel 
            value="process" 
            control={<Radio />} 
            label="Process (Coming in v2)" 
            disabled 
          />
        </RadioGroup>
      </FormControl>

      {source === 'command' && (
        <TextField
          fullWidth
          label="Command"
          variant="outlined"
          value={commandValue}
          onChange={(e) => setCommandValue(e.target.value)}
          placeholder="e.g. kubectl logs pod-name -f"
          helperText="Enter a command that outputs logs. The -f flag is recommended for continuous output."
          sx={{ mt: 2 }}
        />
      )}

      {source === 'file' && (
        <Box sx={{ mt: 2 }}>
          <TextField
            fullWidth
            label="File Path"
            variant="outlined"
            value={filePath}
            onChange={(e) => setFilePath(e.target.value)}
            placeholder="/path/to/your/logfile.log"
            InputProps={{
              endAdornment: (
                <Button 
                  variant="contained" 
                  onClick={handleSelectFile}
                  startIcon={<FolderOpenIcon />}
                  sx={{ ml: 1 }}
                >
                  Browse
                </Button>
              ),
            }}
          />
        </Box>
      )}
    </Box>
  );
};

const ParserConfigStep = ({ parserType, setParserType }) => (
  <Box sx={{ mt: 2 }}>
    <Typography variant="h6" gutterBottom>
      Log Format
    </Typography>
    <Typography variant="body2" color="text.secondary" paragraph>
      Select the format of your logs for proper parsing.
    </Typography>
    
    <FormControl fullWidth sx={{ mt: 2 }}>
      <InputLabel id="parser-type-label">Log Format</InputLabel>
      <Select
        labelId="parser-type-label"
        value={parserType}
        label="Log Format"
        onChange={(e) => setParserType(e.target.value)}
      >
        <MenuItem value="json">JSON</MenuItem>
        <MenuItem value="log4j">Java (Log4j)</MenuItem>
        <MenuItem value="nodejs">Node.js Console</MenuItem>
        <MenuItem value="custom" disabled>Custom Format (Coming in v2)</MenuItem>
      </Select>
    </FormControl>

    <Box sx={{ mt: 3 }}>
      <Alert severity="info">
        {parserType === 'json' && 'JSON logs will be parsed by extracting fields like level, message, and timestamp.'}
        {parserType === 'log4j' && 'Log4j format will extract level, timestamp, class, and message fields.'}
        {parserType === 'nodejs' && 'Node.js console logs will be parsed to extract timestamp and message.'}
      </Alert>
    </Box>
  </Box>
);

// Main component
const CreateProjectPage = ({ setCurrentProject }) => {
  const navigate = useNavigate();
  const { mode } = useTheme();
  const [activeStep, setActiveStep] = useState(0);
  const [projectName, setProjectName] = useState('');
  const [source, setSource] = useState('command');
  const [commandValue, setCommandValue] = useState('');
  const [filePath, setFilePath] = useState('');
  const [parserType, setParserType] = useState('json');
  const [error, setError] = useState('');

  const steps = ['Project Name', 'Log Source', 'Parser Configuration'];

  const handleNext = () => {
    if (activeStep === 0 && !projectName.trim()) {
      setError('Please enter a project name');
      return;
    }

    if (activeStep === 1) {
      if (source === 'command' && !commandValue.trim()) {
        setError('Please enter a command');
        return;
      }
      if (source === 'file' && !filePath.trim()) {
        setError('Please select or enter a file path');
        return;
      }
    }

    setError('');
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleCancel = () => {
    navigate('/');
  };

  const handleSave = async () => {
    try {
      // Create project data
      const projectData = {
        name: projectName,
        source: {
          type: source,
          value: source === 'command' ? commandValue : filePath
        },
        parser: {
          type: parserType,
          fields: getDefaultFields(parserType)
        }
      };

      // Save project
      const result = await window.electron.saveProject(projectData);
      
      if (result.success) {
        setCurrentProject(projectData);
        navigate('/viewer');
      } else {
        setError(`Failed to save project: ${result.error}`);
      }
    } catch (error) {
      console.error('Error saving project:', error);
      setError('An error occurred while saving the project');
    }
  };

  const getDefaultFields = (type) => {
    switch (type) {
      case 'json':
        return ['level', 'message', 'timestamp'];
      case 'log4j':
        return ['level', 'timestamp', 'class', 'message'];
      case 'nodejs':
        return ['timestamp', 'message'];
      default:
        return ['message'];
    }
  };

  return (
    <Container maxWidth="md">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          py: 4
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            borderRadius: 2,
            background: mode === 'light' 
              ? 'linear-gradient(145deg, #ffffff 0%, #f0f7ff 100%)' 
              : 'linear-gradient(145deg, #1e1e1e 0%, #2d3748 100%)'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
            <Tooltip title="Back to Home">
              <IconButton onClick={handleCancel} sx={{ mr: 2 }}>
                <ArrowBackIcon />
              </IconButton>
            </Tooltip>
            <Typography variant="h4" component="h1">
              Create New Project
            </Typography>
          </Box>

          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {activeStep === 0 && (
            <ProjectNameStep 
              projectName={projectName} 
              setProjectName={setProjectName} 
            />
          )}

          {activeStep === 1 && (
            <LogSourceStep 
              source={source} 
              setSource={setSource}
              commandValue={commandValue}
              setCommandValue={setCommandValue}
              filePath={filePath}
              setFilePath={setFilePath}
            />
          )}

          {activeStep === 2 && (
            <ParserConfigStep 
              parserType={parserType} 
              setParserType={setParserType} 
            />
          )}

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
            <Button
              variant="outlined"
              onClick={handleCancel}
            >
              Cancel
            </Button>
            <Box>
              {activeStep > 0 && (
                <Button
                  onClick={handleBack}
                  sx={{ mr: 1 }}
                >
                  Back
                </Button>
              )}
              {activeStep < steps.length - 1 ? (
                <Button
                  variant="contained"
                  onClick={handleNext}
                >
                  Next
                </Button>
              ) : (
                <Button
                  variant="contained"
                  onClick={handleSave}
                  startIcon={<SaveIcon />}
                >
                  Save Project
                </Button>
              )}
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default CreateProjectPage;
