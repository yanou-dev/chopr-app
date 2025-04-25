const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electron", {
  getRecentProjects: () => ipcRenderer.invoke("get-recent-projects"),
  saveProject: (projectData) => ipcRenderer.invoke("save-project", projectData),
  loadProject: (filePath) => ipcRenderer.invoke("load-project", filePath),
  openProject: (filePath) => ipcRenderer.invoke("open-project", filePath),
  selectProjectFile: () => ipcRenderer.invoke("select-project-file"),
  selectLogFile: () => ipcRenderer.invoke("select-log-file"),
  deleteProject: (projectId) => ipcRenderer.invoke("delete-project", projectId),

  resizeWindow: (width, height, route) =>
    ipcRenderer.invoke("resize-window", { width, height, route }),
  minimizeWindow: () => ipcRenderer.invoke("window-minimize"),
  maximizeWindow: () => ipcRenderer.invoke("window-maximize"),
  closeWindow: () => ipcRenderer.invoke("window-close"),
  isWindowMaximized: () => ipcRenderer.invoke("window-is-maximized"),

  startCommand: (id, command) =>
    ipcRenderer.invoke("start-command", { id, command }),
  stopCommand: (id) => ipcRenderer.invoke("stop-command", { id }),
  watchFile: (id, filePath) =>
    ipcRenderer.invoke("watch-file", { id, filePath }),

  onCommandOutput: (callback) => {
    const subscription = (event, data) => callback(data);
    ipcRenderer.on("command-output", subscription);
    return () => {
      ipcRenderer.removeListener("command-output", subscription);
    };
  },

  onCommandClosed: (callback) => {
    const subscription = (event, data) => callback(data);
    ipcRenderer.on("command-closed", subscription);
    return () => {
      ipcRenderer.removeListener("command-closed", subscription);
    };
  },
});
