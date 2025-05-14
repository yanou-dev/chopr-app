interface Translations {
  [key: string]: {
    [key: string]: string;
  };
}

const translations: Translations = {
  en: {
    columnsButton: "Columns",
    filterButton: "Filter",
    densityButton: "Density",
    clearLogsButton: "Clear",
    autoScrollEnabled: "Auto-scroll enabled",
    autoScrollDisabled: "Auto-scroll disabled",

    all: "All",
    error: "Error",
    warning: "Warning",
    info: "Info",
    debug: "Debug",
    trace: "Trace",

    clearLogsTitle: "Clear Logs",
    clearLogsConfirmation:
      "Are you sure you want to clear all logs? This action cannot be undone.",
    cancelButton: "Cancel",
    clearButton: "Clear",
    deleteButton: "Delete",

    logsCleared: "Logs cleared",
    errorStartingLogCollection: "Error starting log collection",

    logsDisplayed: "{filtered} of {total} logs displayed",

    welcomeTitle: "Welcome to Chopr",
    createProject: "Create Project",
    projectsList: "Your Projects",
    noProjects: "Create a new project or open an existing one to get started.",
    deleteProject: "Delete Project",
    confirmDeleteProject: "Are you sure you want to delete this project?",
    openProject: "Open Project",
    loadingProjects: "Loading recent projects...",
    noRecentProjects:
      "No recent projects found. Create a new project to get started.",
    feedbackButton: "About",

    createProjectTitle: "Create a New Project",
    projectName: "Project Name",
    projectDescription: "Description",
    sourceType: "Source Type",
    command: "Command",
    file: "File",
    parserType: "Parser Type",
    autoDetect: "Auto-detect",
    jsonFormat: "JSON",
    logFormat: "Log4j/Logback",
    exampleLog: "Example Log",
    autoDetectInfo:
      "Chopr will automatically identify the log format from the example log you provide.",
    saveButton: "Create Project",
    logTypeIdentified: "Log type identified! ({type})",

    nameRequired: "Project name is required",
    sourceRequired: "Source is required",
    parserRequired: "Parser type is required",
  },
  fr: {
    columnsButton: "Colonnes",
    filterButton: "Filtrer",
    densityButton: "Densité",
    clearLogsButton: "Effacer",
    autoScrollEnabled: "Auto-scroll activé",
    autoScrollDisabled: "Auto-scroll désactivé",

    all: "Tous",
    error: "Erreur",
    warning: "Avertissement",
    info: "Info",
    debug: "Débogage",
    trace: "Trace",

    clearLogsTitle: "Effacer les logs",
    clearLogsConfirmation:
      "Êtes-vous sûr de vouloir effacer tous les logs ? Cette action est irréversible.",
    cancelButton: "Annuler",
    clearButton: "Effacer",
    deleteButton: "Supprimer",

    logsCleared: "Logs effacés",
    errorStartingLogCollection:
      "Erreur lors du démarrage de la collecte de logs",

    logsDisplayed: "{filtered} sur {total} logs affichés",

    welcomeTitle: "Bienvenue sur Chopr",
    createProject: "Créer un projet",
    projectsList: "Vos projets",
    noProjects:
      "Créez un nouveau projet ou ouvrez un projet existant pour commencer.",
    deleteProject: "Supprimer le projet",
    confirmDeleteProject: "Êtes-vous sûr de vouloir supprimer ce projet ?",
    openProject: "Ouvrir un projet",
    loadingProjects: "Chargement des projets récents...",
    noRecentProjects:
      "Aucun projet récent trouvé. Créez un nouveau projet pour commencer.",
    feedbackButton: "À propos",

    createProjectTitle: "Créer un nouveau projet",
    projectName: "Nom du projet",
    projectDescription: "Description",
    sourceType: "Type de source",
    command: "Commande",
    file: "Fichier",
    parserType: "Type d'analyseur",
    autoDetect: "Détection automatique",
    jsonFormat: "JSON",
    logFormat: "Log4j/Logback",
    exampleLog: "Exemple de log",
    autoDetectInfo:
      "Chopr identifiera automatiquement le format de log à partir de l'exemple fourni.",
    saveButton: "Créer le projet",
    logTypeIdentified: "Type de log identifié ! ({type})",

    nameRequired: "Le nom du projet est requis",
    sourceRequired: "La source est requise",
    parserRequired: "Le type d'analyseur est requis",
  },
};

export default translations;
