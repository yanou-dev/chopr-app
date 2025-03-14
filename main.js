const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const isDev = require('electron-is-dev');
const os = require('os');

// Create the user data directory if it doesn't exist
const userDataPath = path.join(os.homedir(), 'LogViewer', 'projects');
if (!fs.existsSync(userDataPath)) {
  fs.mkdirSync(userDataPath, { recursive: true });
}

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    show: false
  });

  // Load the React app or the local HTML file
  const startUrl = isDev
    ? 'http://localhost:3000'
    : `file://${path.join(__dirname, './build/index.html')}`;
  
  mainWindow.loadURL(startUrl);
  
  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Open DevTools in development mode
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC handlers for file operations
ipcMain.handle('get-recent-projects', async () => {
  try {
    const files = fs.readdirSync(userDataPath);
    const projects = [];
    
    for (const file of files) {
      if (file.endsWith('.json')) {
        const filePath = path.join(userDataPath, file);
        const stats = fs.statSync(filePath);
        const projectData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        
        projects.push({
          name: projectData.name,
          path: filePath,
          lastModified: stats.mtime
        });
      }
    }
    
    // Sort by last modified date (newest first)
    projects.sort((a, b) => b.lastModified - a.lastModified);
    
    // Return only the 5 most recent
    return projects.slice(0, 5);
  } catch (error) {
    console.error('Error getting recent projects:', error);
    return [];
  }
});

ipcMain.handle('save-project', async (event, projectData) => {
  try {
    const fileName = `${projectData.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
    const filePath = path.join(userDataPath, fileName);
    
    fs.writeFileSync(filePath, JSON.stringify(projectData, null, 2));
    
    return { success: true, path: filePath };
  } catch (error) {
    console.error('Error saving project:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('open-project', async (event, filePath) => {
  try {
    const projectData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return { success: true, data: projectData };
  } catch (error) {
    console.error('Error opening project:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('select-project-file', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [{ name: 'JSON', extensions: ['json'] }],
    defaultPath: userDataPath
  });
  
  if (result.canceled) {
    return { canceled: true };
  }
  
  return { canceled: false, filePath: result.filePaths[0] };
});

ipcMain.handle('select-log-file', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [{ name: 'Log Files', extensions: ['log', 'txt'] }],
  });
  
  if (result.canceled) {
    return { canceled: true };
  }
  
  return { canceled: false, filePath: result.filePaths[0] };
});

// Store active command processes
const activeCommands = new Map();

ipcMain.handle('start-command', async (event, { id, command }) => {
  try {
    // Kill any existing process with this ID
    if (activeCommands.has(id)) {
      const { process } = activeCommands.get(id);
      process.kill();
      activeCommands.delete(id);
    }
    
    // Split the command string into command and arguments
    const parts = command.split(' ');
    const cmd = parts[0];
    const args = parts.slice(1);
    
    // Spawn the process
    const process = spawn(cmd, args, {
      shell: true
    });
    
    // Set up event handlers
    process.stdout.on('data', (data) => {
      if (mainWindow) {
        mainWindow.webContents.send('command-output', {
          id,
          data: data.toString(),
          type: 'stdout'
        });
      }
    });
    
    process.stderr.on('data', (data) => {
      if (mainWindow) {
        mainWindow.webContents.send('command-output', {
          id,
          data: data.toString(),
          type: 'stderr'
        });
      }
    });
    
    process.on('close', (code) => {
      if (mainWindow) {
        mainWindow.webContents.send('command-closed', {
          id,
          code
        });
      }
      activeCommands.delete(id);
    });
    
    // Store the process
    activeCommands.set(id, { process });
    
    return { success: true };
  } catch (error) {
    console.error('Error starting command:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('stop-command', async (event, { id }) => {
  try {
    if (activeCommands.has(id)) {
      const { process } = activeCommands.get(id);
      process.kill();
      activeCommands.delete(id);
      return { success: true };
    }
    return { success: false, error: 'Command not found' };
  } catch (error) {
    console.error('Error stopping command:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('watch-file', async (event, { id, filePath }) => {
  try {
    // For simplicity, we'll use tail command to watch the file
    // This is more reliable across platforms than fs.watch
    const tailCommand = process.platform === 'win32'
      ? `powershell -Command "Get-Content -Path '${filePath}' -Wait"`
      : `tail -f "${filePath}"`;
    
    // Use the existing command handler to start the tail process
    return await ipcMain.handlers['start-command'](event, {
      id,
      command: tailCommand
    });
  } catch (error) {
    console.error('Error watching file:', error);
    return { success: false, error: error.message };
  }
});

// Clean up all processes on exit
app.on('before-quit', () => {
  for (const [id, { process }] of activeCommands.entries()) {
    process.kill();
  }
  activeCommands.clear();
});
