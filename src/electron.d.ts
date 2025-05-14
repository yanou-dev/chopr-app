interface CommandOutputData {
  id: string;
  data: string;
  type?: string;
  code?: number;
}

interface FileOutputData {
  id: string;
  lines: string[];
}

interface ProjectData {
  name: string;
  source: {
    type: string;
    value: string;
  };
  parser: {
    type: string;
  };
  [key: string]: any;
}

interface ElectronAPI {
  getRecentProjects: () => Promise<any[]>;
  saveProject: (
    projectData: ProjectData
  ) => Promise<{ success: boolean; path?: string; error?: string }>;
  loadProject: (
    filePath: string
  ) => Promise<{ success: boolean; data?: ProjectData; error?: string }>;
  openProject: () => Promise<{
    success: boolean;
    data?: ProjectData;
    error?: string;
    canceled?: boolean;
  }>;
  selectProjectFile: () => Promise<{ canceled: boolean; filePath?: string }>;
  selectLogFile: () => Promise<{ canceled: boolean; filePath?: string }>;
  deleteProject: (
    projectId: string
  ) => Promise<{ success: boolean; error?: string }>;
  getVersion: () => Promise<string>;

  resizeWindow: (
    width: number | null,
    height: number | null,
    route: string
  ) => Promise<{ width: number; height: number }>;
  minimizeWindow: () => Promise<boolean>;
  maximizeWindow: () => Promise<boolean>;
  closeWindow: () => Promise<boolean>;
  isWindowMaximized: () => Promise<boolean>;

  startCommand: (
    id: string,
    command: string
  ) => Promise<{ success: boolean; error?: string }>;
  stopCommand: (id: string) => Promise<{ success: boolean; error?: string }>;
  watchFile: (
    id: string,
    filePath: string
  ) => Promise<{ success: boolean; error?: string }>;
  notifyViewerReady: (id: string) => Promise<boolean>;

  onCommandOutput: (callback: (data: CommandOutputData) => void) => () => void;
  onFileOutput: (callback: (data: FileOutputData) => void) => () => void;
  onCommandClosed: (callback: (data: CommandOutputData) => void) => () => void;

  openExternalUrl: (
    url: string
  ) => Promise<{ success: boolean; error?: string }>;
}

declare global {
  interface Window {
    electron: ElectronAPI;
  }
}

export {};
