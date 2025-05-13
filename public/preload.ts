import { contextBridge, ipcRenderer, IpcRendererEvent } from "electron";

type CommandCallback = (data: CommandData) => void;

interface CommandData {
  id: string;
  data: string;
  type?: string;
  code?: number;
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

contextBridge.exposeInMainWorld("electron", {
  getRecentProjects: () => ipcRenderer.invoke("get-recent-projects"),
  saveProject: (projectData: ProjectData) => ipcRenderer.invoke("save-project", projectData),
  loadProject: (filePath: string) => ipcRenderer.invoke("load-project", filePath),
  openProject: () => ipcRenderer.invoke("open-project"),
  selectProjectFile: () => ipcRenderer.invoke("select-project-file"),
  selectLogFile: () => ipcRenderer.invoke("select-log-file"),
  deleteProject: (projectId: string) => ipcRenderer.invoke("delete-project", projectId),
  getVersion: () => ipcRenderer.invoke("get-version"),

  resizeWindow: (width: number | null, height: number | null, route: string) =>
    ipcRenderer.invoke("resize-window", { width, height, route }),
  minimizeWindow: () => ipcRenderer.invoke("window-minimize"),
  maximizeWindow: () => ipcRenderer.invoke("window-maximize"),
  closeWindow: () => ipcRenderer.invoke("window-close"),
  isWindowMaximized: () => ipcRenderer.invoke("window-is-maximized"),

  startCommand: (id: string, command: string) =>
    ipcRenderer.invoke("start-command", { id, command }),
  stopCommand: (id: string) => ipcRenderer.invoke("stop-command", { id }),
  watchFile: (id: string, filePath: string) =>
    ipcRenderer.invoke("watch-file", { id, filePath }),

  onCommandOutput: (callback: CommandCallback) => {
    const subscription = (event: IpcRendererEvent, data: CommandData) => callback(data);
    ipcRenderer.on("command-output", subscription);
    return () => {
      ipcRenderer.removeListener("command-output", subscription);
    };
  },

  onCommandClosed: (callback: CommandCallback) => {
    const subscription = (event: IpcRendererEvent, data: CommandData) => callback(data);
    ipcRenderer.on("command-closed", subscription);
    return () => {
      ipcRenderer.removeListener("command-closed", subscription);
    };
  },

  openExternalUrl: (url: string) => ipcRenderer.invoke("open-external-url", url),
});
