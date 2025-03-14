# LogViewer

A modern desktop application for visualizing logs from various sources with an intuitive and aesthetic interface.

## Features

- **Multiple Log Sources**: Support for command output and log files
- **Modern UI**: Clean, responsive interface with light and dark mode
- **Real-time Monitoring**: Live log streaming with auto-scroll
- **Advanced Filtering**: Filter logs by field values or search text
- **Project Management**: Save and load log visualization configurations
- **Export Capabilities**: Export logs to JSON or CSV formats

## Screenshots

*Screenshots will be added once the application is running*

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- npm (v6 or later)

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/logviewer.git
   cd logviewer
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the application:
   ```
   npm run dev
   ```

## Usage

### Creating a New Project

1. Launch the application
2. Click "Create Project" on the home screen
3. Enter a project name
4. Select a log source:
   - **Command Output**: Enter a command that outputs logs (e.g., `kubectl logs pod-name -f`)
   - **Log File**: Select an existing log file to monitor
5. Choose a log format (JSON, Log4j, or Node.js)
6. Click "Save Project"

### Viewing Logs

- The main interface displays logs in a table format
- Use the left panel to filter logs by field values
- Use the search bar to find specific text in logs
- Toggle auto-scroll to follow new logs in real-time
- Export logs using the menu in the top-right

## Development

This application is built with:

- **Electron**: For cross-platform desktop capabilities
- **React**: For the user interface
- **Material-UI**: For modern UI components
- **Node.js**: For backend functionality

### Project Structure

```
logviewer/
├── main.js              # Electron main process
├── preload.js           # Secure bridge between renderer and main processes
├── public/              # Static assets
└── src/
    ├── components/      # Reusable UI components
    ├── contexts/        # React contexts (e.g., ThemeContext)
    ├── pages/           # Application pages
    │   ├── HomePage.js            # Welcome screen
    │   ├── CreateProjectPage.js   # Project creation wizard
    │   └── ViewerPage.js          # Main log viewer interface
    └── utils/           # Utility functions
```

## Future Enhancements

- Custom log format parsing with regex
- Process monitoring via PID
- Integration with cloud logging services
- Advanced visualization and analytics

## License

MIT
