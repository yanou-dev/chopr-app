# Chopr Architecture

This document provides an overview of the Chopr application architecture, explaining the main components and how they interact.

## Overview

Chopr is a desktop application built with Electron and React that allows users to visualize and analyze logs from various sources. The application follows a modular architecture with clear separation of concerns.

## Technology Stack

- **Electron**: Powers the desktop application framework
- **React**: Handles the UI rendering and component management
- **TypeScript**: Provides type safety throughout the codebase
- **Material UI**: Supplies the component library for the user interface
- **Node.js**: Manages file system operations and command execution

## Application Structure

```
chopr/
├── public/                # Static assets
├── src/                   # Source code
│   ├── components/        # Reusable UI components
│   ├── contexts/          # React contexts for state management
│   ├── pages/             # Main application pages/screens
│   ├── parsers/           # Log format parsers
│   ├── i18n/              # Internationalization
│   └── index.tsx          # Entry point for React
├── build/                 # Compiled output
└── tools/                 # Build and development tools
```

## Core Architecture Components

### 1. Electron Layer

The Electron layer consists of:

- **Main Process (Electron)**: Handles system-level operations like file access, window management, and executing commands.
- **Preload Script**: Provides secure communication between the main process and renderer process.
- **IPC Communication**: Enables message passing between main and renderer processes.

### 2. React Application

The React application has several key areas:

- **Page Components**: Main screens of the application (Home, CreateProject, Viewer)
- **Context Providers**: Application-wide state management (ThemeContext, etc.)
- **Reusable Components**: UI elements used across multiple pages

### 3. Log Processing Pipeline

The log processing pipeline is one of the core features:

```
Log Source → Parser → Data Store → UI Renderer
```

- **Log Source**: Can be a file, command output, or other source
- **Parser**: Identifies log format and extracts structured data
  - **RegexPatterns.ts**: Contains all the regular expressions used to identify and parse different log formats. This file is the core component for log parsing and is essential for adding support for new log formats.
- **Data Store**: Manages the in-memory representation of logs
- **UI Renderer**: Displays logs in a filterable, searchable interface

### 4. Project Management

The project management system:

- Saves project configurations to disk
- Loads existing projects
- Manages user preferences
- Handles project metadata

### 5. State Management

Application state is managed through:

- React Context API for application-wide state
- Component-level state for UI-specific state
- Electron's IPC for communicating with the main process

## Parser Implementation

The parser system relies heavily on the `RegexPatterns.ts` file which contains all the regular expressions needed to detect and parse different log formats:

- Each log format (Logrus, Log4j, Nginx, etc.) has specific regex patterns
- The patterns are organized by format type
- Adding support for a new log format primarily involves updating the RegexPatterns file
- This centralized approach allows for easy maintenance and extension of supported formats

---

This architecture document will evolve as the application develops. Contributors should update it when making significant architectural changes.
