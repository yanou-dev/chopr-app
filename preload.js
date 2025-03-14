const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
  'electron',
  {
    // Project management
    getRecentProjects: () => ipcRenderer.invoke('get-recent-projects'),
    saveProject: (projectData) => ipcRenderer.invoke('save-project', projectData),
    openProject: (filePath) => ipcRenderer.invoke('open-project', filePath),
    selectProjectFile: () => ipcRenderer.invoke('select-project-file'),
    selectLogFile: () => ipcRenderer.invoke('select-log-file'),
    
    // Command execution
    startCommand: (id, command) => ipcRenderer.invoke('start-command', { id, command }),
    stopCommand: (id) => ipcRenderer.invoke('stop-command', { id }),
    watchFile: (id, filePath) => ipcRenderer.invoke('watch-file', { id, filePath }),
    
    // Event listeners
    onCommandOutput: (callback) => {
      const subscription = (event, data) => callback(data);
      ipcRenderer.on('command-output', subscription);
      return () => {
        ipcRenderer.removeListener('command-output', subscription);
      };
    },
    
    onCommandClosed: (callback) => {
      const subscription = (event, data) => callback(data);
      ipcRenderer.on('command-closed', subscription);
      return () => {
        ipcRenderer.removeListener('command-closed', subscription);
      };
    }
  }
);
