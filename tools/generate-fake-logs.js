const fs = require("fs");
const { program } = require("commander");

const logLevels = ["INFO", "WARN", "ERROR", "DEBUG"];
const components = [
  "UserService",
  "PaymentProcessor",
  "AuthModule",
  "DatabaseConnector",
  "ApiGateway",
];
const messages = [
  "Successfully processed user request",
  "Failed to connect to database",
  "Authentication token validated",
  "Payment transaction completed",
  "Invalid input received",
  "Retry attempt for external service",
  "Configuration loaded successfully",
  "Unexpected exception occurred",
];

function getRandomDate() {
  const now = new Date();
  const randomMs = Math.floor(Math.random() * 24 * 60 * 60 * 1000);
  const date = new Date(now.getTime() - randomMs);
  const isoString = date.toISOString().replace("T", " ").substring(0, 19);
  const milliseconds = String(date.getMilliseconds()).padStart(3, "0");
  return `${isoString},${milliseconds}`;
}

function generateLogLine() {
  const timestamp = getRandomDate();
  const level = logLevels[Math.floor(Math.random() * logLevels.length)];
  const component = components[Math.floor(Math.random() * components.length)];
  const message = messages[Math.floor(Math.random() * messages.length)];
  const thread = `Thread-${Math.floor(Math.random() * 100)}`;

  const logger = component;

  const paddedLevel = level.padEnd(5, " ");

  return `${timestamp} ${paddedLevel} [${thread}] ${logger} - ${message}\n`;
}

program
  .version("1.0.0")
  .description("Génère un fichier de faux logs Java Log4j")
  .requiredOption("-n, --lines <number>", "Nombre de lignes de log à générer")
  .option(
    "-o, --output <filename>",
    "Nom du fichier de sortie",
    "fake_logs.txt"
  )
  .parse(process.argv);

const options = program.opts();
const numLines = parseInt(options.lines);
const outputFile = options.output;

if (isNaN(numLines) || numLines <= 0) {
  console.error("Erreur : le nombre de lignes doit être un entier positif");
  process.exit(1);
}

let logContent = "";
for (let i = 0; i < numLines; i++) {
  logContent += generateLogLine();
}

fs.writeFileSync(outputFile, logContent, "utf8");
console.log(`Fichier ${outputFile} généré avec ${numLines} lignes de logs`);
