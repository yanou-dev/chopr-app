# Chopr

<p align="center">
  <!-- App Icon: Replace with your app icon -->
  <img src="public/chopr-icon.png" alt="Chopr Logo" width="150" />
</p>

<p align="center">
  A modern desktop application for visualizing and analyzing logs from various sources with an intuitive interface.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Platform-MacOS%20%7C%20Windows%20%7C%20Linux-blue" alt="Platform" />
  <img src="https://img.shields.io/badge/license-GPLv3-blue" alt="License" />
  <img src="https://img.shields.io/badge/Electron-25.3.0-brightgreen" alt="Electron" />
  <img src="https://img.shields.io/badge/React-18.2.0-blue" alt="React" />
</p>

## ✨ Features

- **Multiple Log Sources** - Support for command output, log files, and more to come !
- **Multi-Format Support** - Auto-detection for JSON, Log4j, Node.js, Nginx, and 10+ other formats
- **Modern UI** - Clean, responsive interface with light and dark mode
- **Real-time Monitoring** - Live log streaming with auto-scroll and filtering
- **Advanced Search** - Full-text search and field-based filtering

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or later)
- npm (v6 or later)

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/chopr.git
   cd chopr
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the app:

   ```bash
   npm run dev
   ```

   The `npm run dev` command runs concurrently the Electron and the React.

## 🔧 Usage

### Creating a New Project

1. Launch the application
2. Click "Create Project" on the home screen
3. Enter a project name
4. Select a log source:
   - **Command Output**: Enter a command that outputs logs
   - **Log File**: Select an existing log file to monitor
5. Choose a log format or use auto-detection by pasting a log example into the field.
6. Create project.

### Viewing Logs

The main viewer interface provides:

- Table view with parsed log fields
- Left panel for field-based filtering
- Auto-scroll toggle for real-time monitoring

## 🏗️ Architecture

Chopr is built using:

- **Electron** - Cross-platform desktop framework
- **React** - UI library
- **TypeScript** - Type-safe JavaScript
- **Material UI** - Modern UI components

For detailed architecture documentation, see [ARCHITECTURE.md](./ARCHITECTURE.md).

## 🧪 Development

### Project Structure

```
chopr/
├── public/            # Static assets
├── src/
│   ├── components/    # Reusable UI components
│   ├── contexts/      # React contexts
│   ├── pages/         # Application pages
│   ├── parsers/       # Log format parsers
│   │   └── RegexPatterns.ts # Core file with all regex patterns for log parsing
│   └── i18n/          # Internationalization
├── README.md          # This file
└── ARCHITECTURE.md    # Architecture documentation
```

## 📝 Contributing

Contributions are welcome! See [CONTRIBUTING.md](./CONTRIBUTING.md) for details.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE.md) file for details.
