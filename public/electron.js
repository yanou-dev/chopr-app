const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const fs = require("fs");
const { spawn } = require("child_process");
const isDev = require("electron-is-dev");
const os = require("os");

const userDataPath = path.join(
  app.getPath("userData"),
  "dev.yanou.Chopr",
  "projects"
);
if (!fs.existsSync(userDataPath)) {
  fs.mkdirSync(userDataPath, { recursive: true });
}

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
    show: false,
    minWidth: 600,
    minHeight: 500,
    center: true,
    backgroundColor: "#f5f5f5",
    frame: false,
    titleBarStyle: "hidden",
    trafficLightPosition: { x: 10, y: 10 },
  });

  const startUrl = isDev
    ? "http://localhost:3000"
    : `file://${path.join(__dirname, "./build/index.html")}`;

  mainWindow.loadURL(startUrl);

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

ipcMain.handle("get-recent-projects", async () => {
  try {
    const files = fs.readdirSync(userDataPath);
    const projects = [];

    for (const file of files) {
      if (file.endsWith(".json")) {
        const filePath = path.join(userDataPath, file);
        const stats = fs.statSync(filePath);
        const projectData = JSON.parse(fs.readFileSync(filePath, "utf8"));

        projects.push({
          id: projectData.name.replace(/[^a-z0-9]/gi, "_").toLowerCase(),
          name: projectData.name,
          path: filePath,
          lastOpened: projectData.lastOpened || stats.mtime.toISOString(),
          lastModified: stats.mtime.toISOString(),
        });
      }
    }

    projects.sort((a, b) => {
      const dateA = a.lastOpened
        ? new Date(a.lastOpened)
        : new Date(a.lastModified);
      const dateB = b.lastOpened
        ? new Date(b.lastOpened)
        : new Date(b.lastModified);
      return dateB - dateA;
    });

    return projects;
  } catch (error) {
    console.error("Error getting recent projects:", error);
    return [];
  }
});

ipcMain.handle("save-project", async (event, projectData) => {
  try {
    const fileName = `${projectData.name
      .replace(/[^a-z0-9]/gi, "_")
      .toLowerCase()}.json`;
    const filePath = path.join(userDataPath, fileName);

    fs.writeFileSync(filePath, JSON.stringify(projectData, null, 2));

    return { success: true, path: filePath };
  } catch (error) {
    console.error("Error saving project:", error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle("load-project", async (event, filePath) => {
  try {
    const projectData = JSON.parse(fs.readFileSync(filePath, "utf8"));
    projectData.lastOpened = new Date().toISOString();
    fs.writeFileSync(filePath, JSON.stringify(projectData, null, 2));
    return { success: true, data: projectData };
  } catch (error) {
    console.error("Error loading project:", error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle("open-project", async (event, filePath) => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ["openFile"],
      filters: [{ name: "JSON", extensions: ["json"] }],
      defaultPath: userDataPath,
    });
    if (result.canceled) {
      return { canceled: true };
    }
    const projectData = JSON.parse(
      fs.readFileSync(result.filePaths[0], "utf8")
    );
    projectData.lastOpened = new Date().toISOString();
    fs.writeFileSync(result.filePaths[0], JSON.stringify(projectData, null, 2));
    return { success: true, data: projectData };
  } catch (error) {
    console.error("Error opening project:", error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle("select-project-file", async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ["openFile"],
    filters: [{ name: "JSON", extensions: ["json"] }],
    defaultPath: userDataPath,
  });

  if (result.canceled) {
    return { canceled: true };
  }

  return { canceled: false, filePath: result.filePaths[0] };
});

ipcMain.handle("select-log-file", async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ["openFile"],
    filters: [{ name: "Log Files", extensions: ["log", "txt"] }],
  });

  if (result.canceled) {
    return { canceled: true };
  }

  return { canceled: false, filePath: result.filePaths[0] };
});

ipcMain.handle("resize-window", (event, { width, height, route }) => {
  if (!mainWindow) return;

  let newWidth, newHeight;

  switch (route) {
    case "/":
      newWidth = 700;
      newHeight = 500;
      break;
    case "/create":
      newWidth = 550;
      newHeight = 650;
      break;
    case "/viewer":
      newWidth = 1200;
      newHeight = 800;
      break;
    default:
      newWidth = width || 800;
      newHeight = height || 600;
  }

  mainWindow.setSize(newWidth, newHeight);
  mainWindow.center();

  return { width: newWidth, height: newHeight };
});

ipcMain.handle("window-minimize", () => {
  if (mainWindow) mainWindow.minimize();
  return true;
});

ipcMain.handle("window-maximize", () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
      return false;
    } else {
      mainWindow.maximize();
      return true;
    }
  }
  return false;
});

ipcMain.handle("window-close", () => {
  if (mainWindow) mainWindow.close();
  return true;
});

ipcMain.handle("window-is-maximized", () => {
  return mainWindow ? mainWindow.isMaximized() : false;
});

const activeCommands = new Map();

const startCommand = async (id, command) => {
  try {
    if (activeCommands.has(id)) {
      const { process } = activeCommands.get(id);
      process.kill();
      activeCommands.delete(id);
    }

    const parts = command.split(" ");
    const cmd = parts[0];
    const args = parts.slice(1);

    const process = spawn(cmd, args, {
      shell: true,
    });

    process.stdout.on("data", (data) => {
      if (mainWindow) {
        mainWindow.webContents.send("command-output", {
          id,
          data: data.toString(),
          type: "stdout",
        });
      }
    });

    process.stderr.on("data", (data) => {
      if (mainWindow) {
        mainWindow.webContents.send("command-output", {
          id,
          data: data.toString(),
          type: "stderr",
        });
      }
    });

    process.on("close", (code) => {
      if (mainWindow) {
        mainWindow.webContents.send("command-closed", {
          id,
          code,
        });
      }
      activeCommands.delete(id);
    });

    activeCommands.set(id, { process });

    return { success: true };
  } catch (error) {
    console.error("Error starting command:", error);
    return { success: false, error: error.message };
  }
};

ipcMain.handle("start-command", async (event, { id, command }) => {
  startCommand(id, command);
});

ipcMain.handle("stop-command", async (event, { id }) => {
  try {
    if (activeCommands.has(id)) {
      const { process } = activeCommands.get(id);
      process.kill();
      activeCommands.delete(id);
      return { success: true };
    }
    return { success: false, error: "Command not found" };
  } catch (error) {
    console.error("Error stopping command:", error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle("watch-file", async (event, { id, filePath }) => {
  try {
    const tailCommand =
      process.platform === "win32"
        ? `powershell -Command "Get-Content -Path '${filePath}' -Wait"`
        : `tail +1f "${filePath}"`;

    return startCommand(id, tailCommand);
  } catch (error) {
    console.error("Error watching file:", error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle("delete-project", async (event, projectId) => {
  try {
    const files = fs.readdirSync(userDataPath);
    let projectFile = null;

    for (const file of files) {
      if (file.endsWith(".json")) {
        const filePath = path.join(userDataPath, file);
        try {
          const projectData = JSON.parse(fs.readFileSync(filePath, "utf8"));
          if (
            projectData.name.replace(/[^a-z0-9]/gi, "_").toLowerCase() ===
            projectId
          ) {
            projectFile = filePath;
            break;
          }
        } catch (e) {
          console.error(`Error reading project file ${file}:`, e);
        }
      }
    }

    if (!projectFile) {
      return { success: false, error: "Project not found" };
    }

    fs.unlinkSync(projectFile);

    return { success: true };
  } catch (error) {
    console.error("Error deleting project:", error);
    return { success: false, error: error.message };
  }
});

app.on("before-quit", () => {
  for (const [id, { process }] of activeCommands.entries()) {
    process.kill();
  }
  activeCommands.clear();
});
