/// <reference types="react-scripts" />

interface Project {
  id: string;
  name: string;
  path: string;
  type: string;
  lastOpened: string;
  source: {
    type: string;
    value: string;
  };
  parser: {
    type: string;
  };
  [key: string]: any;
}

interface ProjectResponse {
  success: boolean;
  data?: Project;
  error?: string;
  canceled?: boolean;
}

interface CommandData {
  id: string;
  data: string;
  type?: string;
  code?: number;
}

interface FileOutputData {
  id: string;
  lines: string[];
}

type CommandCallback = (data: CommandData) => void;
type FileOutputCallback = (data: FileOutputData) => void;

interface Window {
  electron: {
    // Navigation et fenêtre
    resizeWindow: (
      width: number | null,
      height: number | null,
      pathname: string
    ) => void;
    minimizeWindow: () => Promise<boolean>;
    maximizeWindow: () => Promise<boolean>;
    closeWindow: () => Promise<boolean>;
    isWindowMaximized: () => Promise<boolean>;

    // Opérations de fichier
    openFile: () => Promise<string | null>;
    readFile: (path: string) => Promise<string>;
    saveFile: (content: string, defaultPath?: string) => Promise<string | null>;
    showDialog: (options: any) => Promise<any>;
    selectLogFile: () => Promise<{ canceled: boolean; filePath?: string }>;
    selectProjectFile: () => Promise<{ canceled: boolean; filePath?: string }>;

    // Gestion de projet
    getRecentProjects: () => Promise<Project[]>;
    saveProject: (projectData: Project) => Promise<ProjectResponse>;
    loadProject: (filePath: string) => Promise<ProjectResponse>;
    openProject: () => Promise<ProjectResponse>;
    deleteProject: (projectId: string) => Promise<ProjectResponse>;
    getVersion: () => Promise<string>;

    // Gestion des commandes et logs
    startCommand: (
      id: string,
      command: string
    ) => Promise<{ success: boolean; error?: string }>;
    stopCommand: (id: string) => Promise<{ success: boolean; error?: string }>;
    watchFile: (
      id: string,
      filePath: string
    ) => Promise<{ success: boolean; error?: string }>;
    onCommandOutput: (callback: CommandCallback) => () => void;
    onFileOutput: (callback: FileOutputCallback) => () => void;
    onCommandClosed: (callback: CommandCallback) => () => void;
    notifyViewerReady: (id: string) => () => void;

    // Divers
    openExternalUrl: (
      url: string
    ) => Promise<{ success: boolean; error?: string }>;
  };
}
