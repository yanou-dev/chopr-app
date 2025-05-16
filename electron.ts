import {
  app,
  BrowserWindow,
  ipcMain,
  dialog,
  shell,
  IpcMainInvokeEvent,
} from "electron";
import * as path from "path";
import * as fs from "fs";
import { spawn, ChildProcess } from "child_process";
// @ts-ignore
import { shellPath } from "shell-path";

const isDev = process.env.NODE_ENV === "development";

const userDataPath = path.join(
  app.getPath("userData"),
  "dev.yanou.Chopr",
  "projects"
);
if (!fs.existsSync(userDataPath)) {
  fs.mkdirSync(userDataPath, { recursive: true });
}

let mainWindow: BrowserWindow | null;

interface CommandProcess {
  process: ChildProcess;
  cleanupResources?: () => void;
}

interface ProjectData {
  name: string;
  lastOpened?: string;
  parser: {
    type: string;
  };
  [key: string]: any;
}

interface Project {
  id: string;
  name: string;
  path: string;
  lastOpened: string;
  lastModified: string;
  type: string;
}

interface ProjectResponse {
  success: boolean;
  data?: ProjectData;
  error?: string;
  path?: string;
  canceled?: boolean;
}

interface FileSelectResponse {
  canceled: boolean;
  filePath?: string;
  sampleContent?: string;
}

function createWindow(): void {
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
    backgroundColor: "#1e1e1e",
    frame: false,
    titleBarStyle: "hidden",
    titleBarOverlay: {
      color: "#1e1e1e",
      symbolColor: "#f5f5f5",
    },
    trafficLightPosition: { x: 10, y: 10 },
  });

  const startUrl = isDev
    ? "http://localhost:3000"
    : `file://${path.join(__dirname, "./index.html")}`;

  mainWindow.loadURL(startUrl);

  mainWindow.once("ready-to-show", () => {
    const initialRoute = "/";
    let width = 800;
    let height = 600;

    switch (initialRoute) {
      case "/":
        width = 700;
        height = 500;
        break;
      case "/create" as string:
        width = 550;
        height = 650;
        break;
      case "/viewer" as string:
        width = 1200;
        height = 800;
        break;
    }

    if (mainWindow) {
      mainWindow.setSize(width, height);
      mainWindow.center();
      mainWindow.show();
    }
  });

  mainWindow.on("closed", () => {
    for (const [id, { process }] of activeCommands.entries()) {
      try {
        process.kill("SIGTERM");
      } catch (e) {
        console.error(`Error killing process for command ID: ${id}`, e);
      }
    }

    setTimeout(() => {
      if (activeCommands.size > 0) {
        for (const [id, { process }] of activeCommands.entries()) {
          try {
            process.kill("SIGKILL");
          } catch (e) {
            console.error(
              `Error force killing process for command ID: ${id}`,
              e
            );
          }
        }
        activeCommands.clear();
      }
    }, 500);

    mainWindow = null;
  });

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }
}

app.commandLine.appendSwitch("gtk-version", "3");

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
    const projects: Project[] = [];

    for (const file of files) {
      if (file.endsWith(".json")) {
        const filePath = path.join(userDataPath, file);
        const stats = fs.statSync(filePath);
        const projectData: ProjectData = JSON.parse(
          fs.readFileSync(filePath, "utf8")
        );

        projects.push({
          id: projectData.name.replace(/[^a-z0-9]/gi, "_").toLowerCase(),
          name: projectData.name,
          path: filePath,
          lastOpened: projectData.lastOpened || stats.mtime.toISOString(),
          lastModified: stats.mtime.toISOString(),
          type: projectData.parser.type,
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
      return dateB.getTime() - dateA.getTime();
    });

    return projects;
  } catch (error) {
    console.error("Error getting recent projects:", error);
    return [];
  }
});

ipcMain.handle(
  "save-project",
  async (
    event: IpcMainInvokeEvent,
    projectData: ProjectData
  ): Promise<ProjectResponse> => {
    try {
      const fileName = `${projectData.name
        .replace(/[^a-z0-9]/gi, "_")
        .toLowerCase()}.json`;
      const filePath = path.join(userDataPath, fileName);

      fs.writeFileSync(filePath, JSON.stringify(projectData, null, 2));

      return { success: true, path: filePath };
    } catch (error) {
      console.error("Error saving project:", error);
      const err = error as Error;
      return { success: false, error: err.message };
    }
  }
);

ipcMain.handle(
  "load-project",
  async (
    event: IpcMainInvokeEvent,
    filePath: string
  ): Promise<ProjectResponse> => {
    try {
      const projectData: ProjectData = JSON.parse(
        fs.readFileSync(filePath, "utf8")
      );
      projectData.lastOpened = new Date().toISOString();
      fs.writeFileSync(filePath, JSON.stringify(projectData, null, 2));
      return { success: true, data: projectData };
    } catch (error) {
      console.error("Error loading project:", error);
      const err = error as Error;
      return { success: false, error: err.message };
    }
  }
);

ipcMain.handle(
  "open-project",
  async (event: IpcMainInvokeEvent): Promise<ProjectResponse> => {
    try {
      const result = await dialog.showOpenDialog(mainWindow!, {
        properties: ["openFile"],
        filters: [{ name: "JSON", extensions: ["json"] }],
        defaultPath: userDataPath,
      });

      if (result.canceled) {
        return { canceled: true, success: false };
      }

      const projectData: ProjectData = JSON.parse(
        fs.readFileSync(result.filePaths[0], "utf8")
      );

      projectData.lastOpened = new Date().toISOString();
      fs.writeFileSync(
        result.filePaths[0],
        JSON.stringify(projectData, null, 2)
      );
      return { success: true, data: projectData };
    } catch (error) {
      console.error("Error opening project:", error);
      const err = error as Error;
      return { success: false, error: err.message };
    }
  }
);

ipcMain.handle("select-project-file", async (): Promise<FileSelectResponse> => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ["openFile"],
    filters: [{ name: "JSON", extensions: ["json"] }],
    defaultPath: userDataPath,
  });

  if (result.canceled) {
    return { canceled: true };
  }

  return { canceled: false, filePath: result.filePaths[0] };
});

ipcMain.handle("select-log-file", async (): Promise<FileSelectResponse> => {
  let filePath = "";
  try {
    const result = await dialog.showOpenDialog(mainWindow!, {
      properties: ["openFile"],
      filters: [{ name: "Log Files", extensions: ["log", "txt"] }],
    });

    if (result.canceled) {
      return { canceled: true };
    }

    filePath = result.filePaths[0];

    if (fs.existsSync(filePath)) {
      try {
        const stats = fs.statSync(filePath);
        const maxSize = 1024 * 1024;

        if (stats.size > maxSize) {
          const fd = fs.openSync(filePath, "r");
          const buffer = Buffer.alloc(10000);
          fs.readSync(fd, buffer, 0, 10000, 0);
          fs.closeSync(fd);

          const sampleContent = buffer
            .toString("utf-8")
            .split(/\r?\n/)
            .filter((line) => line.trim() !== "")
            .slice(0, 5)
            .join("\n");

          return {
            canceled: false,
            filePath: filePath,
            sampleContent: sampleContent,
          };
        } else {
          const fileContent = fs.readFileSync(filePath, "utf-8");
          const lines = fileContent
            .split(/\r?\n/)
            .filter((line) => line.trim() !== "")
            .slice(0, 5);
          const sampleContent = lines.join("\n");

          return {
            canceled: false,
            filePath: filePath,
            sampleContent: sampleContent,
          };
        }
      } catch (fileError) {
        console.error("Error processing file content:", fileError);
        return { canceled: false, filePath: filePath };
      }
    }
  } catch (error) {
    console.error("Error in select-log-file:", error);
    if (filePath) {
      return { canceled: false, filePath: filePath };
    }
  }

  return filePath
    ? { canceled: false, filePath: filePath }
    : { canceled: true };
});

interface ResizeWindowParams {
  width?: number;
  height?: number;
  route?: string;
}

ipcMain.handle(
  "resize-window",
  (event: IpcMainInvokeEvent, { width, height, route }: ResizeWindowParams) => {
    if (!mainWindow) return;

    let newWidth: number, newHeight: number;

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
  }
);

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

const activeCommands: Map<string, CommandProcess> = new Map();

interface CommandStartParams {
  id: string;
  command: string;
}

interface CommandStopParams {
  id: string;
}

interface WatchFileParams {
  id: string;
  filePath: string;
}

const startCommand = async (
  id: string,
  command: string
): Promise<ProjectResponse> => {
  try {
    if (activeCommands.has(id)) {
      const { process } = activeCommands.get(id)!;
      process.kill();
      activeCommands.delete(id);
    }

    let childProcess;

    if (process.platform === "win32") {
      childProcess = spawn("powershell.exe", ["-Command", command], {
        detached: false,
      });
    } else {
      const parts = command.split(" ");
      const cmd = parts[0];
      const args = parts.slice(1);

      childProcess = spawn(cmd, args, {
        shell: true,
        detached: false,
        env: {
          ...process.env,
          PATH: `${await shellPath()}:${process.env.PATH || ""}`,
        },
      });
    }

    childProcess.stdout.on("data", (data) => {
      if (mainWindow) {
        mainWindow.webContents.send("command-output", {
          id,
          data: data.toString(),
          type: "stdout",
        });
      }
    });

    childProcess.stderr.on("data", (data) => {
      if (mainWindow) {
        mainWindow.webContents.send("command-output", {
          id,
          data: data.toString(),
          type: "stderr",
        });
        console.error(
          `Command ${id} stderr: ${data.toString().substring(0, 100)}${
            data.toString().length > 100 ? "..." : ""
          }`
        );
      }
    });

    childProcess.on("close", (code) => {
      if (mainWindow) {
        mainWindow.webContents.send("command-closed", {
          id,
          code,
        });
      }
      activeCommands.delete(id);
    });

    childProcess.on("error", (err) => {
      console.error(`Command error for ID: ${id}`, err);
      if (mainWindow) {
        mainWindow.webContents.send("command-closed", {
          id,
          code: -1,
          error: err.message,
        });
      }
      activeCommands.delete(id);
    });

    activeCommands.set(id, { process: childProcess });

    return { success: true };
  } catch (error) {
    console.error("Error starting command:", error);
    const err = error as Error;
    return { success: false, error: err.message };
  }
};

ipcMain.handle(
  "start-command",
  async (event: IpcMainInvokeEvent, { id, command }: CommandStartParams) => {
    return startCommand(id, command);
  }
);

ipcMain.handle(
  "stop-command",
  async (event: IpcMainInvokeEvent, { id }: CommandStopParams) => {
    try {
      if (activeCommands.has(id)) {
        const { process, cleanupResources } = activeCommands.get(id)!;

        if (cleanupResources) {
          try {
            cleanupResources();
          } catch (e) {
            console.error(
              `Error cleaning up resources for command ID: ${id}`,
              e
            );
          }
        }

        process.kill("SIGTERM");

        setTimeout(() => {
          if (activeCommands.has(id)) {
            try {
              process.kill("SIGKILL");
            } catch (e) {
              console.error(
                `Error force killing process for command ID: ${id}`,
                e
              );
            }
            activeCommands.delete(id);
          }
        }, 500);

        return { success: true };
      }
      return { success: false, error: "Command not found" };
    } catch (error) {
      console.error("Error stopping command:", error);
      const err = error as Error;
      return { success: false, error: err.message };
    }
  }
);

const initialFileContents = new Map<string, { id: string; lines: string[] }>();

ipcMain.handle(
  "watch-file",
  async (event: IpcMainInvokeEvent, { id, filePath }: WatchFileParams) => {
    try {
      if (fs.existsSync(filePath)) {
        const fileContent = fs.readFileSync(filePath, "utf-8");
        const lines = fileContent.split(/\r?\n/);

        const initialFileContent = {
          id,
          lines,
        };

        const sendInitialContent = () => {
          if (mainWindow) {
            mainWindow.webContents.send("file-output", initialFileContent);
          }
        };

        ipcMain.handleOnce(`viewer-ready-${id}`, () => {
          sendInitialContent();
          return true;
        });

        initialFileContents.set(id, initialFileContent);
      } else {
        console.log(`File does not exist: ${filePath}`);
      }

      let currentSize = fs.existsSync(filePath)
        ? fs.statSync(filePath).size
        : 0;

      const watcher = fs.watch(filePath, (eventType) => {
        if (eventType === "change") {
          try {
            const stats = fs.statSync(filePath);

            if (stats.size < currentSize) {
              currentSize = 0;
            }

            if (stats.size > currentSize) {
              const fd = fs.openSync(filePath, "r");
              const buffer = Buffer.alloc(stats.size - currentSize);
              fs.readSync(fd, buffer, 0, stats.size - currentSize, currentSize);
              fs.closeSync(fd);

              const newContent = buffer.toString();

              if (newContent && mainWindow) {
                mainWindow.webContents.send("file-output", {
                  id,
                  lines: newContent.split(/\r?\n/),
                });
              }

              currentSize = stats.size;
            }
          } catch (error) {
            console.error(`Error reading file changes: ${error}`);
          }
        }
      });

      const cleanupWatcher = () => {
        watcher.close();
      };

      const dummyProcess = {
        kill: () => {
          cleanupWatcher();
        },
        on: () => {},
      } as unknown as ChildProcess;

      activeCommands.set(id, {
        process: dummyProcess,
        cleanupResources: cleanupWatcher,
      });

      return { success: true };
    } catch (error) {
      console.error("Error watching file:", error);
      const err = error as Error;
      return { success: false, error: err.message };
    }
  }
);

ipcMain.handle(
  "delete-project",
  async (
    event: IpcMainInvokeEvent,
    projectId: string
  ): Promise<ProjectResponse> => {
    try {
      const files = fs.readdirSync(userDataPath);
      let projectFile: string | null = null;

      for (const file of files) {
        if (file.endsWith(".json")) {
          const filePath = path.join(userDataPath, file);
          try {
            const projectData: ProjectData = JSON.parse(
              fs.readFileSync(filePath, "utf8")
            );
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
      const err = error as Error;
      return { success: false, error: err.message };
    }
  }
);

ipcMain.handle("get-version", () => {
  return app.getVersion();
});

app.on("before-quit", () => {
  for (const [id, { process }] of activeCommands.entries()) {
    try {
      process.kill("SIGTERM");
    } catch (e) {
      console.error(`Error killing process for command ID: ${id}`, e);
    }
  }

  setTimeout(() => {
    if (activeCommands.size > 0) {
      for (const [id, { process }] of activeCommands.entries()) {
        try {
          process.kill("SIGKILL");
        } catch (e) {
          console.error(`Error force killing process for command ID: ${id}`, e);
        }
      }
      activeCommands.clear();
    }
  }, 100);
});

ipcMain.handle(
  "open-external-url",
  async (event: IpcMainInvokeEvent, url: string) => {
    try {
      await shell.openExternal(url);
      return { success: true };
    } catch (error) {
      console.error("Error opening external URL:", error);
      const err = error as Error;
      return { success: false, error: err.message };
    }
  }
);
