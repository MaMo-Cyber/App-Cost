import React, { useState, useEffect, createContext, useContext } from "react";
import "./App.css";
import axios from "axios";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

// Language Context
const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

// Translations
const translations = {
  en: {
    // Navigation & General
    projects: "Projects",
    dashboard: "Dashboard",
    newProject: "New Project",
    createDemoProject: "Create Demo Project",
    createOngoingDemoProject: "Create Ongoing Demo Project",
    actions: "Actions",
    cancel: "Cancel",
    save: "Save",
    delete: "Delete",
    edit: "Edit",
    back: "Back",
    next: "Next",
    create: "Create",
    update: "Update",
    loading: "Loading...",
    backToDashboard: "Back to Dashboard",
    
    // Menu Items & Actions
    addCosts: "Add Costs",
    paymentStatus: "Payment Status",
    paymentTimeline: "Payment Timeline",
    manageCategories: "Manage Categories",
    managePhases: "Manage Phases",
    editCostEstimates: "Edit Cost Estimates",
    exportPdfReport: "Export PDF Report",
    projectActions: "Project Actions",
    management: "Management",
    export: "Export",
    
    // Modal & Overlay Headers
    costStatusManagement: "Cost Status Management",
    paymentTimelineHeader: "Payment Timeline",
    costBreakdownDetails: "Cost Details",
    editCostEstimatesHeader: "Edit Cost Estimates",
    
    // Form Labels & Inputs
    projectName: "Project Name",
    projectDescription: "Description",
    totalBudget: "Total Budget",
    startDate: "Start Date",
    endDate: "End Date",
    projectInfo: "Project Information",
    costEstimates: "Cost Estimates",
    review: "Review",
    createProject: "Create Project",
    editProject: "Edit Project",
    calculateContingency: "Calculate Contingency",
    
    // Status Messages & Buttons
    markAsPaid: "Mark as Paid",
    markPaid: "Mark Paid",
    markOutstanding: "Mark Outstanding",
    setDueDate: "Set due date",
    
    // Timeline Categories
    overduePayments: "OVERDUE PAYMENTS",
    dueThisWeek: "DUE THIS WEEK",
    dueThisMonth: "DUE THIS MONTH",
    futureUnscheduled: "FUTURE & UNSCHEDULED",
    allPaymentsUpToDate: "All Payments Up to Date!",
    noOutstandingPayments: "No outstanding payments to track.",
    
    // Cost Entry Form
    costCategory: "Cost Category",
    hours: "Hours",
    hourlyRate: "Hourly Rate",
    quantity: "Quantity",
    unitPrice: "Unit Price",
    totalAmount: "Total Amount",
    description: "Description",
    
    // Phase Management
    phaseName: "Phase Name",
    budgetAllocation: "Budget Allocation",
    phaseDescription: "Phase Description",
    
    // EVM & Financial Terms
    earnedValueManagement: "Earned Value Management (EVM)",
    plannedValue: "Planned Value (PV)",
    earnedValue: "Earned Value (EV)",
    actualCost: "Actual Cost (AC)",
    eacForecast: "EAC Forecast",
    costPerformanceIndex: "Cost Performance Index (CPI)",
    schedulePerformanceIndex: "Schedule Performance Index (SPI)",
    varianceAtCompletion: "Variance at Completion",
    budgetAnalysis: "Budget Analysis",
    totalEstimated: "Total Estimated",
    totalActual: "Total Actual",
    variance: "Variance",
    underBudget: "Under Budget",
    overBudget: "Over Budget",
    onBudget: "On Budget",
    behind: "Behind",
    ahead: "Ahead",
    onSchedule: "On Schedule",
    
    // Status & Indicators
    outstanding: "Outstanding",
    paid: "Paid",
    remaining: "Remaining",
    available: "Available",
    onTrack: "On Track",
    warning: "Warning",
    totalSpent: "Total Spent",
    totalBudget: "Total Budget",
    budgetUtilization: "Budget Utilization",
    entries: "entries",
    
    // Summary Labels
    costBreakdown: "Cost Breakdown",
    recentEntries: "Recent Entries",
    projectSummary: "Project Summary",
    
    // Cost Categories
    equipmentInstallation: "Equipment + Installation",
    installationTransport: "Installation + transport",
    equipment: "Equipment",
    steelwork: "Steelwork",
    pipingInstallation: "Piping + installation",
    planningInt: "Planning (INT)",
    planningExt: "Planning (EXT)",
    projectManagement: "Project management",
    processEngineering: "Process engineering",
    automationEngineering: "Automation engineering",
    civilEngineering: "Civil engineering",
    qualification: "Qualification",
    instrumentation: "Instrumentation",
    installationCabling: "Installation (incl. cabling)",
    automation: "Automation",
    hardware: "Hardware",
    software: "Software",
    civil: "Civil",
    support: "Support",
    scaffolding: "Scaffolding",
    siteFacilities: "Site facilities",
    hvac: "HVAC",
    contingency: "Contingency (10%)",
    
    // Chart Labels
    timeline: "Timeline (Months)",
    costEur: "Cost (€)",
    evmPerformanceOverTime: "EVM Performance Over Time",
    budgetAllocated: "Budget Allocated",
    amountSpent: "Amount Spent",
    remainingActual: "Remaining (Actual)",
    
    // Time & Date
    currentDateTime: "Current Date & Time",
    lastUpdated: "Last Updated",
    
    // Messages
    costOverrunPredicted: "Cost Overrun Predicted",
    budgetExceededBy: "Budget expected to be exceeded by",
    
    // Cost Baseline & Trend Analysis
    costBaseline: "Cost Baseline",
    costTrendLine: "Cost Trend Line",
    budgetAtCompletion: "Budget at Completion (BAC)",
    currentProgress: "Current Progress",
    projectedTotalCost: "Projected Total Cost",
    costEfficiency: "Cost Efficiency",
    projectedOverrun: "Projected Overrun",
    good: "Good",
    fair: "Fair",
    poor: "Poor",
    prediction: "Prediction",
    costVariance: "Cost Variance",
    scheduleVariance: "Schedule Variance"
  },
  de: {
    // Navigation & General
    projects: "Projekte",
    dashboard: "Dashboard",
    newProject: "Neues Projekt",
    createDemoProject: "Demo-Projekt erstellen",
    createOngoingDemoProject: "Laufendes Demo-Projekt erstellen",
    actions: "Aktionen",
    cancel: "Abbrechen",
    save: "Speichern",
    delete: "Löschen",
    edit: "Bearbeiten",
    back: "Zurück",
    next: "Weiter",
    create: "Erstellen",
    update: "Aktualisieren",
    loading: "Lädt...",
    backToDashboard: "Zurück zum Dashboard",
    
    // Menu Items & Actions
    addCosts: "Kosten hinzufügen",
    paymentStatus: "Zahlungsstatus",
    paymentTimeline: "Zahlungszeitplan",
    manageCategories: "Kategorien verwalten",
    managePhases: "Phasen verwalten",
    editCostEstimates: "Kostenschätzungen bearbeiten",
    exportPdfReport: "PDF-Bericht exportieren",
    projectActions: "Projektaktionen",
    management: "Verwaltung",
    export: "Export",
    
    // Modal & Overlay Headers
    costStatusManagement: "Kostenstatus-Verwaltung",
    paymentTimelineHeader: "Zahlungszeitplan",
    costBreakdownDetails: "Kostendetails",
    editCostEstimatesHeader: "Kostenschätzungen bearbeiten",
    
    // Form Labels & Inputs
    projectName: "Projektname",
    projectDescription: "Beschreibung",
    totalBudget: "Gesamtbudget",
    startDate: "Startdatum",
    endDate: "Enddatum",
    projectInfo: "Projektinformationen",
    costEstimates: "Kostenschätzungen",
    review: "Überprüfung",
    createProject: "Projekt erstellen",
    editProject: "Projekt bearbeiten",
    calculateContingency: "Contingency berechnen",
    
    // Status Messages & Buttons
    markAsPaid: "Als bezahlt markieren",
    markPaid: "Bezahlt markieren",
    markOutstanding: "Als ausstehend markieren",
    setDueDate: "Fälligkeitsdatum setzen",
    
    // Timeline Categories
    overduePayments: "ÜBERFÄLLIGE ZAHLUNGEN",
    dueThisWeek: "FÄLLIG DIESE WOCHE",
    dueThisMonth: "FÄLLIG DIESEN MONAT",
    futureUnscheduled: "ZUKÜNFTIG & UNGEPLANT",
    allPaymentsUpToDate: "Alle Zahlungen sind aktuell!",
    noOutstandingPayments: "Keine ausstehenden Zahlungen zu verfolgen.",
    
    // Cost Entry Form
    costCategory: "Kostenkategorie",
    hours: "Stunden",
    hourlyRate: "Stundensatz",
    quantity: "Menge",
    unitPrice: "Einzelpreis",
    totalAmount: "Gesamtbetrag",
    description: "Beschreibung",
    
    // Phase Management
    phaseName: "Phasenname",
    budgetAllocation: "Budgetzuteilung",
    phaseDescription: "Phasenbeschreibung",
    
    // EVM & Financial Terms
    earnedValueManagement: "Earned Value Management (EVM)",
    plannedValue: "Planwert (PV)",
    earnedValue: "Fertigstellungswert (EV)",
    actualCost: "Istkosten (AC)",
    eacForecast: "EAC Prognose",
    costPerformanceIndex: "Kostenleistungsindex (CPI)",
    schedulePerformanceIndex: "Terminleistungsindex (SPI)",
    varianceAtCompletion: "Abweichung bei Fertigstellung",
    budgetAnalysis: "Budgetanalyse",
    totalEstimated: "Geschätzte Gesamtkosten",
    totalActual: "Tatsächliche Gesamtkosten",
    variance: "Abweichung",
    underBudget: "Unter Budget",
    overBudget: "Über Budget",
    onBudget: "Im Budget",
    behind: "Verzögert",
    ahead: "Vor Plan",
    onSchedule: "Termingerecht",
    
    // Status & Indicators
    outstanding: "Ausstehend",
    paid: "Bezahlt",
    remaining: "Verbleibend",
    available: "Verfügbar",
    onTrack: "Im Zeitplan",
    warning: "Warnung",
    totalSpent: "Gesamt ausgegeben",
    totalBudget: "Gesamtbudget",
    budgetUtilization: "Budgetnutzung",
    entries: "Einträge",
    
    // Summary Labels
    costBreakdown: "Kostenaufschlüsselung",
    recentEntries: "Neueste Einträge",
    projectSummary: "Projektzusammenfassung",
    
    // Cost Categories
    equipmentInstallation: "Ausrüstung + Installation",
    installationTransport: "Installation + Transport",
    equipment: "Ausrüstung",
    steelwork: "Stahlbau",
    pipingInstallation: "Rohrleitungen + Installation",
    planningInt: "Planung (INT)",
    planningExt: "Planung (EXT)",
    projectManagement: "Projektmanagement",
    processEngineering: "Verfahrenstechnik",
    automationEngineering: "Automatisierungstechnik",
    civilEngineering: "Bauingenieurwesen",
    qualification: "Qualifizierung",
    instrumentation: "Instrumentierung",
    installationCabling: "Installation (inkl. Verkabelung)",
    automation: "Automatisierung",
    hardware: "Hardware",
    software: "Software",
    civil: "Bau",
    support: "Support",
    scaffolding: "Gerüstbau",
    siteFacilities: "Betriebseinrichtungen",
    hvac: "HLK",
    contingency: "Contingency (10%)",
    
    // Chart Labels
    timeline: "Zeitverlauf (Monate)",
    costEur: "Kosten (€)",
    evmPerformanceOverTime: "EVM-Leistung über Zeit",
    budgetAllocated: "Budget zugeteilt",
    amountSpent: "Ausgegeben",
    remainingActual: "Verbleibend (Aktuell)",
    
    // Time & Date
    currentDateTime: "Aktuelles Datum & Uhrzeit",
    lastUpdated: "Zuletzt aktualisiert",
    
    // Messages
    costOverrunPredicted: "Kostenüberschreitung vorhergesagt",
    budgetExceededBy: "Budget wird voraussichtlich überschritten um",
    
    // Cost Baseline & Trend Analysis
    costBaseline: "Kostengrundlage",
    costTrendLine: "Kostentrendlinie",
    budgetAtCompletion: "Budget bei Fertigstellung (BAC)",
    currentProgress: "Aktueller Fortschritt",
    projectedTotalCost: "Prognostizierte Gesamtkosten",
    costEfficiency: "Kosteneffizienz",
    projectedOverrun: "Prognostizierte Überschreitung",
    good: "Gut",
    fair: "Angemessen",
    poor: "Schlecht",
    prediction: "Prognose",
    costVariance: "Kostenabweichung",
    scheduleVariance: "Terminabweichung"
  }
};

// Language Provider Component
export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('en');
  
  const t = (key) => {
    return translations[language][key] || key;
  };
  
  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'de' : 'en');
  };
  
  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, toggleLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

// Real-time Clock Component
const CurrentDateTime = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const { t, language } = useLanguage();
  
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);
  
  const formatDateTime = (date) => {
    const options = {
      year: 'numeric',
      month: '2-digit', 
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    };
    
    return date.toLocaleString(language === 'de' ? 'de-DE' : 'en-US', options);
  };
  
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
      <div className="flex items-center space-x-2">
        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <div>
          <p className="text-xs text-gray-500">{t('currentDateTime')}</p>
          <p className="text-sm font-medium text-gray-900">{formatDateTime(currentTime)}</p>
        </div>
      </div>
    </div>
  );
};

// Language Toggle Component
const LanguageToggle = () => {
  const { language, toggleLanguage } = useLanguage();
  
  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center space-x-2 px-3 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
    >
      <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5h18M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"></path>
      </svg>
      <span className="text-sm font-medium text-gray-700">
        {language === 'en' ? 'DE' : 'EN'}
      </span>
    </button>
  );
};

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Project List Component (with backup functionality)
const ProjectList = ({ onProjectSelected, onCreateNew }) => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await axios.get(`${API}/projects`);
      setProjects(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching projects:', error);
      setLoading(false);
    }
  };

  const exportAllData = async () => {
    try {
      const response = await axios.get(`${API}/export-all-data`);
      
      // Create downloadable file
      const dataStr = JSON.stringify(response.data, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      // Create download link
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `project-cost-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      alert('✅ Backup exported successfully! Check your downloads folder.');
    } catch (error) {
      console.error('Export error:', error);
      alert('❌ Error exporting data. Please try again.');
    }
  };

  const importData = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    setImporting(true);
    try {
      const fileText = await file.text();
      const backupData = JSON.parse(fileText);
      
      const confirmImport = window.confirm(
        'This will replace ALL current data with the backup data.\n\nAre you sure you want to continue?'
      );
      
      if (!confirmImport) {
        setImporting(false);
        return;
      }
      
      await axios.post(`${API}/import-all-data`, backupData);
      alert('✅ Data imported successfully!');
      fetchProjects(); // Refresh the list
    } catch (error) {
      console.error('Import error:', error);
      alert('❌ Error importing data. Please check the file format.');
    } finally {
      setImporting(false);
      event.target.value = ''; // Reset file input
    }
  };

  const deleteProject = async (projectId, projectName) => {
    console.log('deleteProject called with:', projectId, projectName);
    
    const confirmDelete = window.confirm(`Are you sure you want to delete "${projectName}"?\n\nThis will permanently remove the project and ALL its cost entries and phases.\n\nThis action cannot be undone.`);
    console.log('User confirmation:', confirmDelete);
    
    if (!confirmDelete) {
      return;
    }
    
    try {
      console.log('Attempting to delete project:', projectId, projectName);
      console.log('Delete URL:', `${API}/projects/${projectId}`);
      
      const response = await axios.delete(`${API}/projects/${projectId}`);
      console.log('Delete response:', response);
      
      alert(`Project "${projectName}" and all its data deleted successfully!`);
      console.log('Refreshing projects list...');
      fetchProjects(); // Refresh the list
    } catch (error) {
      console.error('Delete error:', error);
      alert(`Error deleting project "${projectName}". Please try again.\n\nError: ${error.message}`);
    }
  };

  const createOngoingDemoProject = async () => {
    try {
      const response = await axios.post(`${API}/create-ongoing-demo-project`);
      alert(`✅ ${response.data.message}\nProject: ${response.data.project_name}\nBudget: €${response.data.total_budget.toLocaleString()}\nStatus: ${response.data.project_status}`);
      fetchProjects(); // Refresh the list
    } catch (error) {
      console.error('Error creating ongoing demo project:', error);
      alert('❌ Error creating ongoing demo project. Please try again.');
    }
  };

  const createDemoProject = async () => {
    try {
      const response = await axios.post(`${API}/create-demo-project`);
      alert(`✅ ${response.data.message}\nProject: ${response.data.project_name}\nBudget: €${response.data.total_budget.toLocaleString()}`);
      fetchProjects(); // Refresh the list
    } catch (error) {
      console.error('Error creating demo project:', error);
      alert('❌ Error creating demo project. Please try again.');
    }
  };

  if (loading) return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header with Language Toggle and DateTime */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t('projects')}</h1>
            <p className="text-gray-600 mt-1">Manage your project portfolio and track costs</p>
          </div>
          <div className="flex items-center space-x-4">
            <CurrentDateTime />
            <LanguageToggle />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border p-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{t('projects')}</h2>
              <p className="text-gray-600 mt-2">Select a project to manage or create a new one</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={exportAllData}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                title="Export all data as backup"
              >
                📥 Export Backup
              </button>
              <label className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors font-medium cursor-pointer">
                📤 Import Backup
                <input
                  type="file"
                  accept=".json"
                  onChange={importData}
                  disabled={importing}
                  className="hidden"
                />
              </label>
              <button
                onClick={createOngoingDemoProject}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <span>{t('createOngoingDemoProject')}</span>
              </button>
              <button
                onClick={createDemoProject}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                </svg>
                <span>{t('createDemoProject')}</span>
              </button>
              <button
                onClick={onCreateNew}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                {t('newProject')}
              </button>
            </div>
          </div>

          {projects.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No projects yet</h3>
              <p className="text-gray-500 mb-6">Create your first project to start tracking costs</p>
              <button
                onClick={onCreateNew}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create First Project
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {projects.map((project) => (
                <div key={project.id} className="bg-gray-50 rounded-lg p-6 hover:shadow-md transition-shadow border">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1 mr-4">
                      <h3 className="text-lg font-semibold text-gray-900">{project.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">{project.description}</p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        deleteProject(project.id, project.name);
                      }}
                      className="text-gray-500 hover:text-red-600 transition-colors p-2 rounded-lg hover:bg-red-50"
                      title={`Delete ${project.name}`}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                      </svg>
                    </button>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Budget:</span>
                      <span className="font-medium">€{project.total_budget.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Timeline:</span>
                      <span className="text-xs">{new Date(project.start_date).toLocaleDateString()} - {new Date(project.end_date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between text-sm items-center">
                      <span className="text-gray-600">Status:</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        project.status === 'active' ? 'bg-green-100 text-green-800' :
                        project.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                        project.status === 'on_hold' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {project.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => onProjectSelected(project)}
                      className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      Open Project
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        deleteProject(project.id, project.name);
                      }}
                      className="px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors font-medium text-sm"
                      title={`Delete ${project.name}`}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Payment Timeline Component
const PaymentTimeline = ({ project, onBack }) => {
  const [timelineData, setTimelineData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTimelineData();
  }, []);

  const fetchTimelineData = async () => {
    try {
      const response = await axios.get(`${API}/projects/${project.id}/payment-timeline`);
      setTimelineData(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching timeline data:', error);
      setLoading(false);
    }
  };

  const updateDueDate = async (entryId, newDueDate) => {
    try {
      await axios.put(`${API}/cost-entries/${entryId}/due-date`, newDueDate, {
        headers: { 'Content-Type': 'application/json' }
      });
      fetchTimelineData(); // Refresh timeline
      alert('Due date updated successfully!');
    } catch (error) {
      console.error('Error updating due date:', error);
      alert('Error updating due date');
    }
  };

  const markAsPaid = async (entryId) => {
    try {
      await axios.put(`${API}/cost-entries/${entryId}/status`, 'paid', {
        headers: { 'Content-Type': 'application/json' }
      });
      fetchTimelineData(); // Refresh timeline
      alert('Cost marked as paid!');
    } catch (error) {
      console.error('Error marking as paid:', error);
      alert('Error updating status');
    }
  };

  if (loading) return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;

  if (!timelineData) return <div>No timeline data available</div>;

  const { timeline_data, summary, today } = timelineData;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Payment Timeline</h2>
              <p className="text-gray-600">Outstanding payment schedule for {project.name}</p>
            </div>
            <button
              onClick={onBack}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              ← Back to Dashboard
            </button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
            <div className="bg-red-100 border border-red-300 rounded-lg p-4">
              <h3 className="font-semibold text-red-800 mb-1">🚨 Overdue</h3>
              <p className="text-2xl font-bold text-red-600">€{summary.overdue_total.toLocaleString()}</p>
              <p className="text-sm text-red-600">{timeline_data.overdue.length} items</p>
            </div>
            
            <div className="bg-orange-100 border border-orange-300 rounded-lg p-4">
              <h3 className="font-semibold text-orange-800 mb-1">⚡ This Week</h3>
              <p className="text-2xl font-bold text-orange-600">€{summary.due_this_week_total.toLocaleString()}</p>
              <p className="text-sm text-orange-600">{timeline_data.due_this_week.length} items</p>
            </div>
            
            <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-4">
              <h3 className="font-semibold text-yellow-800 mb-1">📅 This Month</h3>
              <p className="text-2xl font-bold text-yellow-600">€{summary.due_this_month_total.toLocaleString()}</p>
              <p className="text-sm text-yellow-600">{timeline_data.due_this_month.length} items</p>
            </div>
            
            <div className="bg-blue-100 border border-blue-300 rounded-lg p-4">
              <h3 className="font-semibold text-blue-800 mb-1">🔮 Later</h3>
              <p className="text-2xl font-bold text-blue-600">€{summary.due_later_total.toLocaleString()}</p>
              <p className="text-sm text-blue-600">{timeline_data.due_later.length} items</p>
            </div>
            
            <div className="bg-gray-100 border border-gray-300 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-1">❓ No Date</h3>
              <p className="text-2xl font-bold text-gray-600">€{summary.no_due_date_total.toLocaleString()}</p>
              <p className="text-sm text-gray-600">{timeline_data.no_due_date.length} items</p>
            </div>
          </div>

          {/* Timeline Sections */}
          <div className="space-y-8">
            {/* Overdue Section */}
            {timeline_data.overdue.length > 0 && (
              <div className="border-l-4 border-red-500 pl-6">
                <h3 className="text-xl font-bold text-red-700 mb-4">🚨 OVERDUE PAYMENTS</h3>
                <div className="space-y-3">
                  {timeline_data.overdue.map((entry) => (
                    <div key={entry.id} className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h4 className="font-semibold text-gray-900">{entry.category_name}</h4>
                            <span className="px-2 py-1 bg-red-600 text-white text-xs rounded-full font-medium">
                              {Math.abs(entry.days_until_due)} DAYS OVERDUE
                            </span>
                          </div>
                          <p className="text-gray-700">{entry.description}</p>
                          <p className="text-sm text-red-600 font-medium">
                            Due: {new Date(entry.due_date).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right ml-4">
                          <p className="text-2xl font-bold text-red-600 mb-2">€{entry.total_amount.toLocaleString()}</p>
                          <div className="space-x-2">
                            <button
                              onClick={() => markAsPaid(entry.id)}
                              className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
                            >
                              Mark Paid ✓
                            </button>
                            <input
                              type="date"
                              onChange={(e) => updateDueDate(entry.id, e.target.value)}
                              className="px-2 py-1 border rounded text-xs"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Due This Week */}
            {timeline_data.due_this_week.length > 0 && (
              <div className="border-l-4 border-orange-500 pl-6">
                <h3 className="text-xl font-bold text-orange-700 mb-4">⚡ DUE THIS WEEK</h3>
                <div className="space-y-3">
                  {timeline_data.due_this_week.map((entry) => (
                    <div key={entry.id} className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h4 className="font-semibold text-gray-900">{entry.category_name}</h4>
                            <span className="px-2 py-1 bg-orange-600 text-white text-xs rounded-full font-medium">
                              IN {entry.days_until_due} DAYS
                            </span>
                          </div>
                          <p className="text-gray-700">{entry.description}</p>
                          <p className="text-sm text-orange-600 font-medium">
                            Due: {new Date(entry.due_date).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right ml-4">
                          <p className="text-2xl font-bold text-orange-600 mb-2">€{entry.total_amount.toLocaleString()}</p>
                          <div className="space-x-2">
                            <button
                              onClick={() => markAsPaid(entry.id)}
                              className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
                            >
                              Mark Paid ✓
                            </button>
                            <input
                              type="date"
                              onChange={(e) => updateDueDate(entry.id, e.target.value)}
                              className="px-2 py-1 border rounded text-xs"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Due This Month */}
            {timeline_data.due_this_month.length > 0 && (
              <div className="border-l-4 border-yellow-500 pl-6">
                <h3 className="text-xl font-bold text-yellow-700 mb-4">📅 DUE THIS MONTH</h3>
                <div className="space-y-3">
                  {timeline_data.due_this_month.map((entry) => (
                    <div key={entry.id} className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h4 className="font-semibold text-gray-900">{entry.category_name}</h4>
                            <span className="px-2 py-1 bg-yellow-600 text-white text-xs rounded-full font-medium">
                              IN {entry.days_until_due} DAYS
                            </span>
                          </div>
                          <p className="text-gray-700">{entry.description}</p>
                          <p className="text-sm text-yellow-600 font-medium">
                            Due: {new Date(entry.due_date).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right ml-4">
                          <p className="text-2xl font-bold text-yellow-600 mb-2">€{entry.total_amount.toLocaleString()}</p>
                          <div className="space-x-2">
                            <button
                              onClick={() => markAsPaid(entry.id)}
                              className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
                            >
                              Mark Paid ✓
                            </button>
                            <input
                              type="date"
                              onChange={(e) => updateDueDate(entry.id, e.target.value)}
                              className="px-2 py-1 border rounded text-xs"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Due Later & No Due Date - Combined for brevity */}
            {(timeline_data.due_later.length > 0 || timeline_data.no_due_date.length > 0) && (
              <div className="border-l-4 border-blue-500 pl-6">
                <h3 className="text-xl font-bold text-blue-700 mb-4">🔮 FUTURE & UNSCHEDULED</h3>
                <div className="space-y-3">
                  {[...timeline_data.due_later, ...timeline_data.no_due_date].map((entry) => (
                    <div key={entry.id} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 mb-1">{entry.category_name}</h4>
                          <p className="text-gray-700">{entry.description}</p>
                          {entry.due_date ? (
                            <p className="text-sm text-blue-600 font-medium">
                              Due: {new Date(entry.due_date).toLocaleDateString()} ({entry.days_until_due} days)
                            </p>
                          ) : (
                            <p className="text-sm text-gray-500">No due date set</p>
                          )}
                        </div>
                        <div className="text-right ml-4">
                          <p className="text-2xl font-bold text-blue-600 mb-2">€{entry.total_amount.toLocaleString()}</p>
                          <div className="space-x-2">
                            <button
                              onClick={() => markAsPaid(entry.id)}
                              className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
                            >
                              Mark Paid ✓
                            </button>
                            <input
                              type="date"
                              onChange={(e) => updateDueDate(entry.id, e.target.value)}
                              className="px-2 py-1 border rounded text-xs"
                              placeholder="Set due date"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {summary.total_outstanding === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🎉</div>
              <h3 className="text-xl font-bold text-green-600 mb-2">All Payments Up to Date!</h3>
              <p className="text-gray-600">No outstanding payments to track.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
const CostStatusManager = ({ project, onBack }) => {
  const [outstandingCosts, setOutstandingCosts] = useState([]);
  const [paidCosts, setPaidCosts] = useState([]);
  const [activeTab, setActiveTab] = useState('outstanding');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCostsByStatus();
  }, []);

  const fetchCostsByStatus = async () => {
    try {
      const [outstandingResponse, paidResponse] = await Promise.all([
        axios.get(`${API}/projects/${project.id}/cost-entries/outstanding`),
        axios.get(`${API}/projects/${project.id}/cost-entries/paid`)
      ]);
      
      setOutstandingCosts(outstandingResponse.data);
      setPaidCosts(paidResponse.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching costs by status:', error);
      setLoading(false);
    }
  };

  const updateCostStatus = async (entryId, newStatus) => {
    try {
      await axios.put(`${API}/cost-entries/${entryId}/status`, newStatus, {
        headers: { 'Content-Type': 'application/json' }
      });
      fetchCostsByStatus(); // Refresh the lists
      alert(`Cost entry marked as ${newStatus}!`);
    } catch (error) {
      console.error('Error updating cost status:', error);
      alert('Error updating cost status');
    }
  };

  const outstandingTotal = outstandingCosts.reduce((sum, cost) => sum + cost.total_amount, 0);
  const paidTotal = paidCosts.reduce((sum, cost) => sum + cost.total_amount, 0);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Cost Status Management</h2>
              <p className="text-gray-600">Track outstanding and paid costs for {project.name}</p>
            </div>
            <button
              onClick={onBack}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              ← Back to Dashboard
            </button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-red-50 p-6 rounded-lg border border-red-200">
              <h3 className="text-lg font-semibold text-red-800 mb-2">Outstanding Costs</h3>
              <p className="text-3xl font-bold text-red-600">€{outstandingTotal.toLocaleString()}</p>
              <p className="text-sm text-red-600">{outstandingCosts.length} entries</p>
            </div>
            
            <div className="bg-green-50 p-6 rounded-lg border border-green-200">
              <h3 className="text-lg font-semibold text-green-800 mb-2">Paid Costs</h3>
              <p className="text-3xl font-bold text-green-600">€{paidTotal.toLocaleString()}</p>
              <p className="text-sm text-green-600">{paidCosts.length} entries</p>
            </div>
            
            <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
              <h3 className="text-lg font-semibold text-blue-800 mb-2">Total Costs</h3>
              <p className="text-3xl font-bold text-blue-600">€{(outstandingTotal + paidTotal).toLocaleString()}</p>
              <p className="text-sm text-blue-600">{(outstandingCosts.length + paidCosts.length)} entries</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('outstanding')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'outstanding'
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Outstanding ({outstandingCosts.length})
              </button>
              <button
                onClick={() => setActiveTab('paid')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'paid'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Paid ({paidCosts.length})
              </button>
            </nav>
          </div>

          {/* Cost Lists */}
          <div className="space-y-4">
            {activeTab === 'outstanding' && (
              <div>
                {outstandingCosts.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No outstanding costs! 🎉</p>
                  </div>
                ) : (
                  outstandingCosts.map((cost) => (
                    <div key={cost.id} className="border border-red-200 rounded-lg p-4 bg-red-50">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="font-semibold text-gray-900">{cost.category_name}</h3>
                            <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full font-medium">
                              OUTSTANDING
                            </span>
                          </div>
                          <p className="text-gray-700">{cost.description || 'No description'}</p>
                          <p className="text-sm text-gray-500 mt-1">
                            Entry Date: {new Date(cost.entry_date).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right ml-4">
                          <p className="text-2xl font-bold text-red-600 mb-2">€{cost.total_amount.toLocaleString()}</p>
                          <button
                            onClick={() => updateCostStatus(cost.id, 'paid')}
                            className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
                          >
                            Mark as Paid ✓
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'paid' && (
              <div>
                {paidCosts.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No paid costs yet.</p>
                  </div>
                ) : (
                  paidCosts.map((cost) => (
                    <div key={cost.id} className="border border-green-200 rounded-lg p-4 bg-green-50">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="font-semibold text-gray-900">{cost.category_name}</h3>
                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">
                              PAID
                            </span>
                          </div>
                          <p className="text-gray-700">{cost.description || 'No description'}</p>
                          <p className="text-sm text-gray-500 mt-1">
                            Entry Date: {new Date(cost.entry_date).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right ml-4">
                          <p className="text-2xl font-bold text-green-600 mb-2">€{cost.total_amount.toLocaleString()}</p>
                          <button
                            onClick={() => updateCostStatus(cost.id, 'outstanding')}
                            className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
                          >
                            Mark Outstanding ⚠️
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
const CostBreakdownModal = ({ isOpen, onClose, project, categoryName }) => {
  const [categoryData, setCategoryData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && categoryName && project) {
      fetchCategoryDetails();
    }
  }, [isOpen, categoryName, project]);

  const fetchCategoryDetails = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/projects/${project.id}/cost-entries/by-category/${encodeURIComponent(categoryName)}`);
      setCategoryData(response.data);
    } catch (error) {
      console.error('Error fetching category details:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{categoryName} - Cost Details</h2>
            <p className="text-gray-600">Project: {project?.name}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : categoryData ? (
            <div>
              {/* Summary */}
              <div className="bg-blue-50 rounded-lg p-4 mb-6">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-blue-600">{categoryData.total_entries}</p>
                    <p className="text-sm text-gray-600">Total Entries</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-blue-600">€{categoryData.total_amount.toLocaleString()}</p>
                    <p className="text-sm text-gray-600">Total Amount</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-blue-600">€{(categoryData.total_amount / categoryData.total_entries).toFixed(2)}</p>
                    <p className="text-sm text-gray-600">Average per Entry</p>
                  </div>
                </div>
              </div>

              {/* Detailed List */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">All {categoryName} Entries</h3>
                {categoryData.entries.map((entry, index) => (
                  <div key={entry.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-sm font-medium text-gray-900">#{index + 1}</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            entry.type === 'hourly' ? 'bg-blue-100 text-blue-800' :
                            entry.type === 'material' ? 'bg-green-100 text-green-800' :
                            'bg-purple-100 text-purple-800'
                          }`}>
                            {entry.type.toUpperCase()}
                          </span>
                          {entry.phase_name && (
                            <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
                              {entry.phase_name}
                            </span>
                          )}
                        </div>
                        <p className="text-gray-900 font-medium">{entry.description}</p>
                        <p className="text-sm text-gray-600">{entry.details}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Entry Date: {new Date(entry.entry_date).toLocaleDateString()} • 
                          Created: {new Date(entry.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-xl font-bold text-gray-900">€{entry.total_amount.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {categoryData.entries.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500">No cost entries found for this category.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">Failed to load category details.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Enhanced Dashboard with Drill-down functionality
const Dashboard = ({ project, onNavigate, onSwitchProject }) => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const { t, language } = useLanguage();

  useEffect(() => {
    if (project) {
      fetchDashboardData();
    }
  }, [project]);

  const fetchDashboardData = async () => {
    try {
      const [dashboardResponse, timelineResponse] = await Promise.all([
        axios.get(`${API}/projects/${project.id}/dashboard-data`),
        axios.get(`${API}/projects/${project.id}/evm-timeline`)
      ]);
      
      setDashboardData({
        ...dashboardResponse.data,
        evm_timeline: timelineResponse.data
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryClick = (categoryName) => {
    setSelectedCategory(categoryName);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedCategory(null);
  };

  const exportToPDF = async () => {
    try {
      const response = await axios.get(`${API}/projects/${project.id}/export-pdf`, {
        responseType: 'blob'
      });
      
      // Create downloadable file
      const pdfBlob = new Blob([response.data], { type: 'application/pdf' });
      
      // Create download link
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${project.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_report_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      alert('✅ PDF report exported successfully! Check your downloads folder.');
    } catch (error) {
      console.error('PDF export error:', error);
      alert('❌ Error exporting PDF report. Please try again.');
    }
  };

  // Edit cost estimates function
  const editCostEstimates = () => {
    onNavigate('editEstimates');
  };

  if (loading) return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;

  if (!dashboardData) return <div>No data available</div>;

  const { summary, monthly_trend, recent_entries } = dashboardData;
  const statusColors = {
    on_track: 'bg-green-100 text-green-800 border-green-200',
    warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    over_budget: 'bg-red-100 text-red-800 border-red-200'
  };

  // Chart configurations
  const trendLineData = {
    labels: monthly_trend.map(item => {
      const [year, month] = item.month.split('-');
      return new Date(year, month - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    }),
    datasets: [
      {
        label: 'Monthly Spending',
        data: monthly_trend.map(item => item.amount),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: 'rgb(59, 130, 246)',
        pointBorderColor: 'white',
        pointBorderWidth: 2,
        pointRadius: 6,
      }
    ]
  };

  const costBreakdownData = {
    labels: Object.keys(summary.cost_breakdown),
    datasets: [
      {
        label: 'Cost by Category',
        data: Object.values(summary.cost_breakdown),
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 101, 101, 0.8)',
          'rgba(251, 191, 36, 0.8)',
          'rgba(139, 92, 246, 0.8)',
          'rgba(236, 72, 153, 0.8)',
        ],
        borderColor: [
          'rgb(59, 130, 246)',
          'rgb(16, 185, 129)',
          'rgb(245, 101, 101)',
          'rgb(251, 191, 36)',
          'rgb(139, 92, 246)',
          'rgb(236, 72, 153)',
        ],
        borderWidth: 2,
      }
    ]
  };

  const budgetComparisonData = {
    labels: ['Budget Allocated', 'Amount Spent', 'Remaining (Actual)'],
    datasets: [
      {
        label: 'Budget Analysis',
        data: [
          summary.project.total_budget,
          summary.total_spent,
          summary.budget_remaining_actual
        ],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          summary.budget_utilization > 90 ? 'rgba(245, 101, 101, 0.8)' : 'rgba(16, 185, 129, 0.8)',
          'rgba(156, 163, 175, 0.8)'
        ],
        borderColor: [
          'rgb(59, 130, 246)',
          summary.budget_utilization > 90 ? 'rgb(245, 101, 101)' : 'rgb(16, 185, 129)',
          'rgb(156, 163, 175)'
        ],
        borderWidth: 2,
      }
    ]
  };

  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return '€' + value.toLocaleString();
          }
        }
      }
    }
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        callbacks: {
          label: function(context) {
            const value = context.parsed;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${context.label}: €${value.toLocaleString()} (${percentage}%)`;
          }
        }
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Project Header with Actions Menu */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center space-x-4 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
                <CurrentDateTime />
              </div>
              <p className="text-gray-600 mt-1">{project.description}</p>
            </div>
            <div className="flex items-center space-x-3">
              <LanguageToggle />
              <button
                onClick={onSwitchProject}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                ← {t('projects')}
              </button>
              
              {/* Actions Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowActionsMenu(!showActionsMenu)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"></path>
                  </svg>
                  <span>{t('actions')}</span>
                  <svg className={`w-4 h-4 transition-transform ${showActionsMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </button>
                
                {showActionsMenu && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border z-50">
                    <div className="py-2">
                      <div className="px-4 py-2 text-sm font-medium text-gray-500 border-b">{t('projectActions')}</div>
                      
                      <button
                        onClick={() => {
                          setShowActionsMenu(false);
                          onNavigate('costs');
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-3"
                      >
                        <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                        </svg>
                        <span>{t('addCosts')}</span>
                      </button>
                      
                      <button
                        onClick={() => {
                          setShowActionsMenu(false);
                          onNavigate('cost-status');
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-3"
                      >
                        <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        <span>{t('paymentStatus')}</span>
                      </button>
                      
                      <button
                        onClick={() => {
                          setShowActionsMenu(false);
                          onNavigate('payment-timeline');
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-3"
                      >
                        <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        <span>{t('paymentTimeline')}</span>
                      </button>
                      
                      <div className="border-t my-1"></div>
                      <div className="px-4 py-2 text-sm font-medium text-gray-500">{t('management')}</div>
                      
                      <button
                        onClick={() => {
                          setShowActionsMenu(false);
                          editCostEstimates();
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-3"
                      >
                        <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                        </svg>
                        <span>{t('editCostEstimates')}</span>
                      </button>
                      
                      <button
                        onClick={() => {
                          setShowActionsMenu(false);
                          onNavigate('categories');
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-3"
                      >
                        <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path>
                        </svg>
                        <span>{t('manageCategories')}</span>
                      </button>
                      
                      <button
                        onClick={() => {
                          setShowActionsMenu(false);
                          onNavigate('phases');
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-3"
                      >
                        <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                        </svg>
                        <span>{t('managePhases')}</span>
                      </button>
                      
                      <div className="border-t my-1"></div>
                      <div className="px-4 py-2 text-sm font-medium text-gray-500">{t('export')}</div>
                      
                      <button
                        onClick={() => {
                          setShowActionsMenu(false);
                          exportToPDF();
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-3"
                      >
                        <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                        </svg>
                        <span>{t('exportPdfReport')}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="text-center">
              <div className="mx-auto p-2 bg-blue-100 rounded-lg w-fit mb-3">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-600">Total Budget</p>
              <p className="text-2xl font-semibold text-gray-900">€{summary.project.total_budget.toLocaleString()}</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="text-center">
              <div className="mx-auto p-2 bg-gray-100 rounded-lg w-fit mb-3">
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"></path>
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-600">Total Spent</p>
              <p className="text-2xl font-semibold text-gray-900">€{summary.total_spent.toLocaleString()}</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-red-200 bg-red-50">
            <div className="text-center">
              <div className="mx-auto p-2 bg-red-100 rounded-lg w-fit mb-3">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 18.5c-.77.833.192 2.5 1.732 2.5z"></path>
                </svg>
              </div>
              <p className="text-sm font-medium text-red-700">Outstanding</p>
              <p className="text-2xl font-semibold text-red-800">€{summary.total_outstanding.toLocaleString()}</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-green-200 bg-green-50">
            <div className="text-center">
              <div className="mx-auto p-2 bg-green-100 rounded-lg w-fit mb-3">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4"></path>
                </svg>
              </div>
              <p className="text-sm font-medium text-green-700">Paid Only</p>
              <p className="text-2xl font-semibold text-green-800">€{summary.total_paid.toLocaleString()}</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="text-center">
              <div className="mx-auto p-2 bg-purple-100 rounded-lg w-fit mb-3">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4"></path>
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-600">Remaining (Actual)</p>
              <p className="text-2xl font-semibold text-gray-900">€{summary.budget_remaining_actual.toLocaleString()}</p>
              <p className="text-xs text-gray-500">After all commitments</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-yellow-200 bg-yellow-50">
            <div className="text-center">
              <div className="mx-auto p-2 bg-yellow-100 rounded-lg w-fit mb-3">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                </svg>
              </div>
              <p className="text-sm font-medium text-yellow-700">Available (If Paid)</p>
              <p className="text-2xl font-semibold text-yellow-800">€{summary.budget_remaining_committed.toLocaleString()}</p>
              <p className="text-xs text-yellow-600">Excluding outstanding</p>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Monthly Spending Trend */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">📈 Monthly Spending Trend</h3>
            <div className="h-64">
              <Line data={trendLineData} options={chartOptions} />
            </div>
          </div>

          {/* Budget Analysis */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">💰 Budget Analysis</h3>
            <div className="h-64">
              <Bar data={budgetComparisonData} options={chartOptions} />
            </div>
          </div>
        </div>

          {/* Cost Breakdown & Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Cost Breakdown Pie Chart */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">🎯 Cost Breakdown by Category</h3>
              <div className="h-80">
                <Doughnut data={costBreakdownData} options={doughnutOptions} />
              </div>
              <div className="mt-4 space-y-2">
                <p className="text-sm font-medium text-gray-700 mb-2">Click on a category to see detailed cost entries:</p>
                {Object.entries(summary.cost_breakdown).map(([category, amount]) => (
                  <button
                    key={category}
                    onClick={() => handleCategoryClick(category)}
                    className="w-full flex justify-between items-center p-3 bg-gray-50 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer border"
                    title={`Click to see all ${category} cost entries`}
                  >
                    <span className="font-medium text-gray-900">{category}</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-lg font-bold text-blue-600">€{amount.toLocaleString()}</span>
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                      </svg>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">📋 Recent Cost Entries</h3>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {recent_entries.slice(0, 8).map((entry) => (
                  <div key={entry.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{entry.category_name}</p>
                      <p className="text-sm text-gray-600">{entry.description || 'No description'}</p>
                      <p className="text-xs text-gray-500">{new Date(entry.entry_date).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">€{entry.total_amount.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Cost Breakdown Modal */}
          <CostBreakdownModal
            isOpen={modalOpen}
            onClose={closeModal}
            project={project}
            categoryName={selectedCategory}
          />

        {/* Comprehensive EVM Analysis & Explanations */}
        {summary.evm_metrics && (
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">📊 {t('earnedValueManagement')} - Detailed Analysis</h3>
            
            {/* EVM Fundamentals Explanation */}
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-3">🎯 EVM Key Concepts</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="bg-white p-3 rounded border-l-4 border-blue-500">
                  <p className="font-medium text-blue-800">{t('plannedValue')} (PV)</p>
                  <p className="text-blue-700">Budget for work scheduled to be completed by a specific date</p>
                  <p className="text-xs text-blue-600 mt-1">Formula: Cumulative planned cost up to time t</p>
                </div>
                <div className="bg-white p-3 rounded border-l-4 border-green-500">
                  <p className="font-medium text-green-800">{t('earnedValue')} (EV)</p>
                  <p className="text-green-700">Budget for work actually completed by a specific date</p>
                  <p className="text-xs text-green-600 mt-1">Formula: % Complete × Total Budget (BAC)</p>
                </div>
                <div className="bg-white p-3 rounded border-l-4 border-red-500">
                  <p className="font-medium text-red-800">{t('actualCost')} (AC)</p>
                  <p className="text-red-700">Actual cost incurred for work completed by a specific date</p>
                  <p className="text-xs text-red-600 mt-1">Formula: Sum of all actual expenditures</p>
                </div>
              </div>
            </div>

            {/* Current Performance Analysis */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-white p-4 rounded-lg shadow-sm border">
                <div className="flex items-center justify-between mb-3">
                  <h5 className="font-semibold text-gray-800">Cost Performance</h5>
                  <div className={`p-2 rounded-lg ${summary.evm_metrics.cost_performance_index >= 1 ? 'bg-green-100' : 'bg-red-100'}`}>
                    <svg className={`w-6 h-6 ${summary.evm_metrics.cost_performance_index >= 1 ? 'text-green-600' : 'text-red-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
                    </svg>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">CPI:</span>
                    <span className={`font-bold ${summary.evm_metrics.cost_performance_index >= 1 ? 'text-green-600' : 'text-red-600'}`}>
                      {summary.evm_metrics.cost_performance_index.toFixed(3)}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {summary.evm_metrics.cost_performance_index >= 1 
                      ? `✅ Getting €${summary.evm_metrics.cost_performance_index.toFixed(2)} of value for every €1 spent`
                      : `⚠️ Getting €${summary.evm_metrics.cost_performance_index.toFixed(2)} of value for every €1 spent`
                    }
                  </div>
                  <div className="text-xs font-medium">
                    Interpretation: {summary.evm_metrics.cost_performance_index >= 1.05 ? 'Excellent cost efficiency' :
                                  summary.evm_metrics.cost_performance_index >= 0.95 ? 'Good cost control' :
                                  summary.evm_metrics.cost_performance_index >= 0.85 ? 'Cost concerns - monitor closely' :
                                  'Serious cost overruns - immediate action required'}
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg shadow-sm border">
                <div className="flex items-center justify-between mb-3">
                  <h5 className="font-semibold text-gray-800">Schedule Performance</h5>
                  <div className={`p-2 rounded-lg ${summary.evm_metrics.schedule_performance_index >= 1 ? 'bg-green-100' : 'bg-yellow-100'}`}>
                    <svg className={`w-6 h-6 ${summary.evm_metrics.schedule_performance_index >= 1 ? 'text-green-600' : 'text-yellow-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">SPI:</span>
                    <span className={`font-bold ${summary.evm_metrics.schedule_performance_index >= 1 ? 'text-green-600' : 'text-yellow-600'}`}>
                      {summary.evm_metrics.schedule_performance_index.toFixed(3)}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    Schedule variance: €{summary.evm_metrics.schedule_variance.toLocaleString()}
                  </div>
                  <div className="text-xs font-medium">
                    Status: {summary.evm_metrics.schedule_performance_index >= 1.05 ? 'Ahead of schedule' :
                            summary.evm_metrics.schedule_performance_index >= 0.95 ? 'On schedule' :
                            summary.evm_metrics.schedule_performance_index >= 0.85 ? 'Slightly behind schedule' :
                            'Significantly behind schedule'}
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg shadow-sm border">
                <div className="flex items-center justify-between mb-3">
                  <h5 className="font-semibold text-gray-800">Cost Forecast</h5>
                  <div className={`p-2 rounded-lg ${summary.evm_metrics.variance_at_completion >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                    <svg className={`w-6 h-6 ${summary.evm_metrics.variance_at_completion >= 0 ? 'text-green-600' : 'text-red-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                    </svg>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">EAC:</span>
                    <span className="font-bold text-purple-600">
                      €{summary.evm_metrics.estimate_at_completion.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">VAC:</span>
                    <span className={`font-bold ${summary.evm_metrics.variance_at_completion >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      €{summary.evm_metrics.variance_at_completion.toLocaleString()}
                    </span>
                  </div>
                  <div className="text-xs font-medium">
                    Projection: {summary.evm_metrics.variance_at_completion >= 0 ? 'Under budget' : 'Over budget'} by{' '}
                    {Math.abs((summary.evm_metrics.variance_at_completion / project.total_budget) * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>

            {/* Formula Explanations */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-3">📐 EVM Formulas & Calculations</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="bg-white p-3 rounded border">
                    <p className="font-medium text-gray-800">Cost Performance Index (CPI)</p>
                    <p className="text-gray-600 font-mono">CPI = EV ÷ AC</p>
                    <p className="text-xs text-gray-500">
                      Current: €{summary.evm_metrics.earned_value.toLocaleString()} ÷ €{summary.evm_metrics.actual_cost.toLocaleString()} = {summary.evm_metrics.cost_performance_index.toFixed(3)}
                    </p>
                  </div>
                  <div className="bg-white p-3 rounded border">
                    <p className="font-medium text-gray-800">Schedule Performance Index (SPI)</p>
                    <p className="text-gray-600 font-mono">SPI = EV ÷ PV</p>
                    <p className="text-xs text-gray-500">
                      Current: €{summary.evm_metrics.earned_value.toLocaleString()} ÷ €{summary.evm_metrics.planned_value.toLocaleString()} = {summary.evm_metrics.schedule_performance_index.toFixed(3)}
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="bg-white p-3 rounded border">
                    <p className="font-medium text-gray-800">Estimate at Completion (EAC)</p>
                    <p className="text-gray-600 font-mono">EAC = BAC ÷ CPI</p>
                    <p className="text-xs text-gray-500">
                      Current: €{project.total_budget.toLocaleString()} ÷ {summary.evm_metrics.cost_performance_index.toFixed(3)} = €{summary.evm_metrics.estimate_at_completion.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-white p-3 rounded border">
                    <p className="font-medium text-gray-800">Variance at Completion (VAC)</p>
                    <p className="text-gray-600 font-mono">VAC = BAC - EAC</p>
                    <p className="text-xs text-gray-500">
                      Current: €{project.total_budget.toLocaleString()} - €{summary.evm_metrics.estimate_at_completion.toLocaleString()} = €{summary.evm_metrics.variance_at_completion.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Future Phase Analysis */}
            {dashboardData.evm_timeline?.completion_prediction?.months_remaining > 0 && (
              <div className="mb-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <h4 className="font-semibold text-yellow-900 mb-3">🔮 Future Phase Analysis & Predictions</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded border">
                    <h5 className="font-medium text-gray-800 mb-2">Remaining Work Analysis</h5>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Work Completed:</span>
                        <span className="font-medium">{dashboardData.evm_timeline.completion_prediction.current_progress_pct}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Work Remaining:</span>
                        <span className="font-medium">{(100 - dashboardData.evm_timeline.completion_prediction.current_progress_pct).toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Estimated Months Left:</span>
                        <span className="font-medium">{dashboardData.evm_timeline.completion_prediction.months_remaining}</span>
                      </div>
                      <div className="flex justify-between border-t pt-2">
                        <span>Remaining Budget:</span>
                        <span className="font-medium">€{(project.total_budget - summary.total_spent).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white p-4 rounded border">
                    <h5 className="font-medium text-gray-800 mb-2">Cost Trend Predictions</h5>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Current Cost Efficiency:</span>
                        <span className={`font-medium ${
                          dashboardData.evm_timeline.completion_prediction.cost_efficiency === 'good' ? 'text-green-600' :
                          dashboardData.evm_timeline.completion_prediction.cost_efficiency === 'poor' ? 'text-red-600' : 'text-yellow-600'
                        }`}>
                          {dashboardData.evm_timeline.completion_prediction.cost_efficiency.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Projected Final Cost:</span>
                        <span className="font-medium">€{dashboardData.evm_timeline.completion_prediction.projected_completion_cost.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Expected Overrun:</span>
                        <span className={`font-medium ${
                          dashboardData.evm_timeline.completion_prediction.projected_overrun_pct > 0 ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {dashboardData.evm_timeline.completion_prediction.projected_overrun_pct > 0 ? '+' : ''}
                          {dashboardData.evm_timeline.completion_prediction.projected_overrun_pct}%
                        </span>
                      </div>
                      <div className="border-t pt-2">
                        <p className="text-xs text-gray-600">
                          💡 <strong>Recommendation:</strong>{' '}
                          {dashboardData.evm_timeline.completion_prediction.cost_efficiency === 'poor' 
                            ? 'Immediate cost control measures needed. Review upcoming phases for savings opportunities.'
                            : dashboardData.evm_timeline.completion_prediction.projected_overrun_pct > 5
                            ? 'Monitor costs closely and consider scope adjustments for remaining phases.'
                            : 'Project on track. Continue current cost management practices.'
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* EVM Timeline Chart with Cost Baseline and Trend Line */}
        {summary.evm_metrics && (
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">📈 {t('evmPerformanceOverTime')}</h3>
              <div className="text-xs text-gray-500">
                {t('lastUpdated')}: {new Date().toLocaleString(language === 'de' ? 'de-DE' : 'en-US')}
              </div>
            </div>
            
            {/* Project Status and Predictions */}
            {dashboardData.evm_timeline?.completion_prediction && (
              <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                  <div className="text-center">
                    <p className="text-blue-700 font-medium">Current Progress</p>
                    <p className="text-xl font-bold text-blue-900">
                      {dashboardData.evm_timeline.completion_prediction.current_progress_pct}%
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-blue-700 font-medium">Projected Total Cost</p>
                    <p className="text-xl font-bold text-blue-900">
                      €{dashboardData.evm_timeline.completion_prediction.projected_completion_cost.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-blue-700 font-medium">Cost Efficiency</p>
                    <p className={`text-xl font-bold ${
                      dashboardData.evm_timeline.completion_prediction.cost_efficiency === 'good' ? 'text-green-600' :
                      dashboardData.evm_timeline.completion_prediction.cost_efficiency === 'poor' ? 'text-red-600' : 'text-yellow-600'
                    }`}>
                      {dashboardData.evm_timeline.completion_prediction.cost_efficiency.toUpperCase()}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-blue-700 font-medium">Projected Overrun</p>
                    <p className={`text-xl font-bold ${
                      dashboardData.evm_timeline.completion_prediction.projected_overrun_pct > 0 ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {dashboardData.evm_timeline.completion_prediction.projected_overrun_pct > 0 ? '+' : ''}
                      {dashboardData.evm_timeline.completion_prediction.projected_overrun_pct}%
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="h-96 mb-4">
              <Line 
                data={{
                  labels: dashboardData.evm_timeline?.timeline_data?.map(point => point.month) || [],
                  datasets: [
                    {
                      label: `${t('plannedValue')} (Cost Baseline)`,
                      data: dashboardData.evm_timeline?.timeline_data?.map(point => point.planned_value) || [],
                      borderColor: 'rgb(59, 130, 246)',
                      backgroundColor: 'rgba(59, 130, 246, 0.1)',
                      borderWidth: 3,
                      fill: false,
                      tension: 0.2,
                      pointStyle: 'circle',
                      pointRadius: 4
                    },
                    {
                      label: t('earnedValue'),
                      data: dashboardData.evm_timeline?.timeline_data?.map(point => point.earned_value) || [],
                      borderColor: 'rgb(16, 185, 129)',
                      backgroundColor: 'rgba(16, 185, 129, 0.1)',
                      borderWidth: 2,
                      fill: false,
                      tension: 0.1,
                      pointStyle: 'triangle',
                      pointRadius: 3
                    },
                    {
                      label: t('actualCost'),
                      data: dashboardData.evm_timeline?.timeline_data?.map(point => point.actual_cost) || [],
                      borderColor: 'rgb(239, 68, 68)',
                      backgroundColor: 'rgba(239, 68, 68, 0.1)',
                      borderWidth: 2,
                      fill: false,
                      tension: 0.1,
                      pointStyle: 'rect',
                      pointRadius: 3
                    },
                    {
                      label: `${t('eacForecast')} (Cost Trend Line)`,
                      data: dashboardData.evm_timeline?.timeline_data?.map(point => point.eac) || [],
                      borderColor: 'rgb(147, 51, 234)',
                      backgroundColor: 'rgba(147, 51, 234, 0.1)',
                      borderWidth: 3,
                      borderDash: [10, 5],
                      fill: false,
                      tension: 0.2,
                      pointStyle: 'rectRot',
                      pointRadius: 4
                    },
                    {
                      label: 'Budget at Completion (BAC)',
                      data: dashboardData.evm_timeline?.timeline_data?.map(() => project.total_budget) || [],
                      borderColor: 'rgb(107, 114, 128)',
                      backgroundColor: 'rgba(107, 114, 128, 0.1)',
                      borderWidth: 2,
                      borderDash: [2, 2],
                      fill: false,
                      pointRadius: 0,
                      pointHoverRadius: 0
                    }
                  ]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  interaction: {
                    mode: 'index',
                    intersect: false,
                  },
                  scales: {
                    x: {
                      display: true,
                      title: {
                        display: true,
                        text: t('timeline'),
                        font: {
                          size: 14,
                          weight: 'bold'
                        }
                      },
                      grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                      }
                    },
                    y: {
                      display: true,
                      title: {
                        display: true,
                        text: t('costEur'),
                        font: {
                          size: 14,
                          weight: 'bold'
                        }
                      },
                      grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                      },
                      ticks: {
                        callback: function(value) {
                          return '€' + value.toLocaleString(language === 'de' ? 'de-DE' : 'en-US');
                        }
                      }
                    }
                  },
                  plugins: {
                    title: {
                      display: true,
                      text: `${t('evmPerformanceOverTime')} - ${t('costOverrunPredicted')}`,
                      font: {
                        size: 16,
                        weight: 'bold'
                      }
                    },
                    legend: {
                      position: 'top',
                      labels: {
                        usePointStyle: true,
                        font: {
                          size: 12
                        }
                      }
                    },
                    tooltip: {
                      callbacks: {
                        title: function(context) {
                          const dataPoint = dashboardData.evm_timeline?.timeline_data?.[context[0].dataIndex];
                          const futureLabel = dataPoint?.is_future ? ' (Prediction)' : '';
                          return context[0].label + futureLabel;
                        },
                        label: function(context) {
                          return context.dataset.label + ': €' + context.parsed.y.toLocaleString(language === 'de' ? 'de-DE' : 'en-US');
                        },
                        afterBody: function(context) {
                          const dataIndex = context[0].dataIndex;
                          const dataPoint = dashboardData.evm_timeline?.timeline_data?.[dataIndex];
                          if (dataPoint) {
                            return [
                              `CPI: ${dataPoint.cpi}`,
                              `SPI: ${dataPoint.spi}`,
                              `Cost Variance: €${dataPoint.cost_variance.toLocaleString()}`,
                              `Schedule Variance: €${dataPoint.schedule_variance.toLocaleString()}`
                            ];
                          }
                          return [];
                        }
                      }
                    },
                    annotation: dashboardData.evm_timeline?.overrun_point ? {
                      annotations: {
                        overrunLine: {
                          type: 'line',
                          xMin: dashboardData.evm_timeline.overrun_point.month_number - 1,
                          xMax: dashboardData.evm_timeline.overrun_point.month_number - 1,
                          borderColor: 'rgb(239, 68, 68)',
                          borderWidth: 4,
                          borderDash: [10, 5],
                          label: {
                            content: `⚠️ ${t('costOverrunPredicted')} (${language === 'de' ? 'Monat' : 'Month'} ${dashboardData.evm_timeline.overrun_point.month_number})`,
                            enabled: true,
                            position: 'start',
                            backgroundColor: 'rgba(239, 68, 68, 0.8)',
                            color: 'white'
                          }
                        }
                      }
                    } : {}
                  }
                }}
              />
            </div>

            {/* EVM Timeline Summary */}
            {dashboardData.evm_timeline && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="text-center">
                    <p className="text-xs font-medium text-blue-700">Current CPI</p>
                    <p className={`text-lg font-bold ${
                      dashboardData.evm_timeline.current_performance.current_cpi >= 1 
                      ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {dashboardData.evm_timeline.current_performance.current_cpi.toFixed(3)}
                    </p>
                  </div>
                </div>
                
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="text-center">
                    <p className="text-xs font-medium text-green-700">Current SPI</p>
                    <p className={`text-lg font-bold ${
                      dashboardData.evm_timeline.current_performance.current_spi >= 1 
                      ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {dashboardData.evm_timeline.current_performance.current_spi.toFixed(3)}
                    </p>
                  </div>
                </div>
                
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                  <div className="text-center">
                    <p className="text-xs font-medium text-purple-700">Final EAC</p>
                    <p className="text-lg font-bold text-purple-700">
                      €{dashboardData.evm_timeline.current_performance.final_eac.toLocaleString()}
                    </p>
                  </div>
                </div>
                
                <div className={`border rounded-lg p-3 ${
                  dashboardData.evm_timeline.current_performance.projected_overrun > 0 
                  ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'
                }`}>
                  <div className="text-center">
                    <p className={`text-xs font-medium ${
                      dashboardData.evm_timeline.current_performance.projected_overrun > 0 
                      ? 'text-red-700' : 'text-green-700'
                    }`}>
                      {dashboardData.evm_timeline.current_performance.projected_overrun > 0 ? 'Projected Overrun' : 'Under Budget'}
                    </p>
                    <p className={`text-lg font-bold ${
                      dashboardData.evm_timeline.current_performance.projected_overrun > 0 
                      ? 'text-red-700' : 'text-green-700'
                    }`}>
                      €{Math.abs(dashboardData.evm_timeline.current_performance.projected_overrun).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Cost Trend Analysis */}
            {dashboardData.evm_timeline?.cost_trend_deterioration && (
              <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-yellow-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 18.5c-.77.833.192 2.5 1.732 2.5z"></path>
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-yellow-800">
                      📉 Cost Performance Deteriorating
                    </p>
                    <p className="text-xs text-yellow-600">
                      CPI has decreased by {Math.abs(dashboardData.evm_timeline.cost_trend_deterioration.cpi_change)} in recent months (
                      {dashboardData.evm_timeline.cost_trend_deterioration.severity} severity)
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Overrun Warning */}
            {dashboardData.evm_timeline?.overrun_point && (
              <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 18.5c-.77.833.192 2.5 1.732 2.5z"></path>
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-red-800">
                      ⚠️ {t('costOverrunPredicted')} in {dashboardData.evm_timeline.overrun_point.month}
                      {dashboardData.evm_timeline.overrun_point.is_prediction && ' (Based on Current Trend)'}
                    </p>
                    <p className="text-xs text-red-600">
                      {t('budgetExceededBy')} €{dashboardData.evm_timeline.overrun_point.budget_exceeded_by.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Planned vs Actual Comparison */}
        {summary.project.cost_estimates && Object.keys(summary.project.cost_estimates).length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Planned vs Actual Cost Comparison</h3>
            
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="text-center">
                  <p className="text-sm font-medium text-blue-700">Total Estimated</p>
                  <p className="text-2xl font-bold text-blue-900">€{summary.project.estimated_total?.toLocaleString() || 0}</p>
                </div>
              </div>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="text-center">
                  <p className="text-sm font-medium text-red-700">Total Actual</p>
                  <p className="text-2xl font-bold text-red-900">€{summary.total_spent.toLocaleString()}</p>
                </div>
              </div>
              
              <div className={`border rounded-lg p-4 ${
                (summary.project.estimated_total || 0) >= summary.total_spent 
                ? 'bg-green-50 border-green-200' 
                : 'bg-yellow-50 border-yellow-200'
              }`}>
                <div className="text-center">
                  <p className={`text-sm font-medium ${
                    (summary.project.estimated_total || 0) >= summary.total_spent 
                    ? 'text-green-700' 
                    : 'text-yellow-700'
                  }`}>
                    Variance
                  </p>
                  <p className={`text-2xl font-bold ${
                    (summary.project.estimated_total || 0) >= summary.total_spent 
                    ? 'text-green-900' 
                    : 'text-yellow-900'
                  }`}>
                    €{((summary.project.estimated_total || 0) - summary.total_spent).toLocaleString()}
                  </p>
                  <p className={`text-xs ${
                    (summary.project.estimated_total || 0) >= summary.total_spent 
                    ? 'text-green-600' 
                    : 'text-yellow-600'
                  }`}>
                    {(summary.project.estimated_total || 0) >= summary.total_spent ? 'Under Estimate' : 'Over Estimate'}
                  </p>
                </div>
              </div>
            </div>

            {/* Category-wise comparison */}
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Category</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-900">Estimated</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-900">Actual</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-900">Variance</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-900">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(summary.project.cost_estimates)
                    .filter(([, estimate]) => estimate > 0)
                    .map(([category, estimate]) => {
                      const actual = summary.cost_breakdown[category] || 0;
                      const variance = estimate - actual;
                      const isUnder = variance >= 0;
                      
                      return (
                        <tr key={category} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4 text-sm">{category}</td>
                          <td className="py-3 px-4 text-sm text-right">€{estimate.toLocaleString()}</td>
                          <td className="py-3 px-4 text-sm text-right">€{actual.toLocaleString()}</td>
                          <td className={`py-3 px-4 text-sm text-right font-medium ${
                            isUnder ? 'text-green-600' : 'text-red-600'
                          }`}>
                            €{Math.abs(variance).toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              isUnder 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {isUnder ? '✓ Under' : '⚠ Over'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Phases Progress */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">🚀 Phases Progress</h3>
          <div className="space-y-4">
            {summary.phases_summary.map((phase) => (
              <div key={phase.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium text-gray-900">{phase.name}</h4>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    phase.status === 'completed' ? 'bg-green-100 text-green-800' :
                    phase.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                    phase.status === 'delayed' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {phase.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Allocated</p>
                    <p className="font-medium">€{phase.budget_allocated.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Spent</p>
                    <p className="font-medium">€{phase.amount_spent.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Remaining</p>
                    <p className="font-medium">€{phase.budget_remaining.toLocaleString()}</p>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>Budget Utilization</span>
                    <span>{phase.utilization_percentage.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${phase.utilization_percentage > 100 ? 'bg-red-500' : phase.utilization_percentage > 80 ? 'bg-yellow-500' : 'bg-green-500'}`}
                      style={{ width: `${Math.min(phase.utilization_percentage, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
            
            {summary.phases_summary.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">No phases created yet. Click "Manage Phases" to add project phases!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Category Management Component (unchanged)
const CategoryManagement = ({ onBack }) => {
  const [categories, setCategories] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'hourly',
    description: '',
    default_rate: ''
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API}/cost-categories`);
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/cost-categories`, {
        ...formData,
        default_rate: formData.default_rate ? parseFloat(formData.default_rate) : null
      });
      
      setFormData({
        name: '',
        type: 'hourly',
        description: '',
        default_rate: ''
      });
      setShowForm(false);
      fetchCategories();
    } catch (error) {
      console.error('Error creating category:', error);
      alert('Error creating category');
    }
  };

  const deleteCategory = async (categoryId) => {
    if (!window.confirm('Are you sure you want to delete this category?')) {
      return;
    }
    
    try {
      await axios.delete(`${API}/cost-categories/${categoryId}`);
      fetchCategories();
    } catch (error) {
      if (error.response?.status === 400) {
        alert('Cannot delete category that is used in cost entries. Remove all cost entries with this category first.');
      } else {
        alert('Error deleting category');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Cost Categories</h2>
            <div className="space-x-3">
              <button
                onClick={() => setShowForm(!showForm)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                {showForm ? 'Cancel' : '+ Add Category'}
              </button>
              <button
                onClick={onBack}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                ← Back
              </button>
            </div>
          </div>

          {showForm && (
            <div className="mb-8 p-6 border rounded-lg bg-gray-50">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Category</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category Name</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., Consulting, Equipment"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category Type</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({...formData, type: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="hourly">Hourly (Hours × Rate)</option>
                      <option value="material">Material (Quantity × Price)</option>
                      <option value="fixed">Fixed Amount</option>
                      <option value="custom">Custom</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows="2"
                    placeholder="Brief description of this category"
                  />
                </div>
                
                {formData.type === 'hourly' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Default Hourly Rate (Optional)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.default_rate}
                      onChange={(e) => setFormData({...formData, default_rate: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0.00"
                    />
                  </div>
                )}
                
                <button
                  type="submit"
                  className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create Category
                </button>
              </form>
            </div>
          )}

          <div className="space-y-4">
            {categories.map((category) => (
              <div key={category.id} className="border rounded-lg p-4 flex justify-between items-center">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <h3 className="font-medium text-gray-900">{category.name}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      category.type === 'hourly' ? 'bg-blue-100 text-blue-800' :
                      category.type === 'material' ? 'bg-green-100 text-green-800' :
                      category.type === 'fixed' ? 'bg-purple-100 text-purple-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {category.type.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{category.description}</p>
                  {category.default_rate && (
                    <p className="text-sm text-gray-500 mt-1">Default rate: €{category.default_rate}/hr</p>
                  )}
                </div>
                <button
                  onClick={() => deleteCategory(category.id)}
                  className="text-gray-400 hover:text-red-600 transition-colors ml-4"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                  </svg>
                </button>
              </div>
            ))}
            
            {categories.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">No cost categories yet. Add your first category to get started!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Edit Cost Estimates Component
const EditCostEstimates = ({ project, onBack }) => {
  const [costEstimates, setCostEstimates] = useState({
    'Equipment + Installation': 0,
    'Installation + transport': 0,
    'Equipment': 0,
    'Steelwork': 0,
    'Piping + installation': 0,
    'Planning (INT)': 0,
    'Planning (EXT)': 0,
    'Project management': 0,
    'Process engineering': 0,
    'Automation engineering': 0,
    'Civil engineering': 0,
    'Qualification': 0,
    'Instrumentation': 0,
    'Installation (incl. cabling)': 0,
    'Automation': 0,
    'Hardware': 0,
    'Software': 0,
    'Civil': 0,
    'Support': 0,
    'Scaffolding': 0,
    'Site facilities': 0,
    'HVAC': 0,
    'Contingency (10%)': 0
  });
  
  const [loading, setLoading] = useState(false);
  const API = process.env.REACT_APP_BACKEND_URL;

  // Load existing estimates on component mount
  useEffect(() => {
    if (project.cost_estimates) {
      setCostEstimates(prev => ({
        ...prev,
        ...project.cost_estimates
      }));
    }
  }, [project]);

  // Calculate total estimated cost
  const getTotalEstimate = () => {
    return Object.values(costEstimates).reduce((sum, value) => sum + parseFloat(value || 0), 0);
  };

  // Handle cost estimate changes
  const handleCostEstimateChange = (category, value) => {
    setCostEstimates(prev => ({
      ...prev,
      [category]: parseFloat(value) || 0
    }));
  };

  // Auto-calculate contingency
  const calculateContingency = () => {
    const totalWithoutContingency = Object.entries(costEstimates)
      .filter(([key]) => key !== 'Contingency (10%)')
      .reduce((sum, [, value]) => sum + parseFloat(value || 0), 0);
    
    setCostEstimates(prev => ({
      ...prev,
      'Contingency (10%)': totalWithoutContingency * 0.1
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await axios.put(`${API}/projects/${project.id}/cost-estimates`, costEstimates);
      alert('Cost estimates updated successfully!');
      onBack();
    } catch (error) {
      console.error('Error updating cost estimates:', error);
      alert('Error updating cost estimates');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Edit Cost Estimates</h2>
              <button
                onClick={onBack}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
            <p className="text-gray-600 mt-2">Project: {project.name}</p>
          </div>

          <form onSubmit={handleSubmit} className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Cost Categories</h3>
              <button
                type="button"
                onClick={calculateContingency}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Calculate Contingency
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {Object.entries(costEstimates).map(([category, value]) => (
                <div key={category}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {category}
                    {category === 'Contingency (10%)' && (
                      <span className="text-blue-600 text-xs ml-1">(Auto-calculated)</span>
                    )}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={value || ''}
                    onChange={(e) => handleCostEstimateChange(category, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.00"
                    disabled={category === 'Contingency (10%)'}
                  />
                </div>
              ))}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-blue-900">Total Estimated Cost:</span>
                <span className="text-2xl font-bold text-blue-900">€{getTotalEstimate().toLocaleString()}</span>
              </div>
              {project.total_budget && (
                <div className="flex justify-between items-center mt-2 text-sm">
                  <span className="text-blue-700">Original Budget:</span>
                  <span className="text-blue-700">€{project.total_budget.toLocaleString()}</span>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onBack}
                className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                disabled={loading}
              >
                {loading ? 'Updating...' : 'Update Estimates'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Project Setup Component (unchanged)
const ProjectSetup = ({ onProjectCreated, onCancel }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    total_budget: '',
    start_date: '',
    end_date: ''
  });
  
  // Cost estimate categories
  const [costEstimates, setCostEstimates] = useState({
    'Equipment + Installation': 0,
    'Installation + transport': 0,
    'Equipment': 0,
    'Steelwork': 0,
    'Piping + installation': 0,
    'Planning (INT)': 0,
    'Planning (EXT)': 0,
    'Project management': 0,
    'Process engineering': 0,
    'Automation engineering': 0,
    'Civil engineering': 0,
    'Qualification': 0,
    'Instrumentation': 0,
    'Installation (incl. cabling)': 0,
    'Automation': 0,
    'Hardware': 0,
    'Software': 0,
    'Civil': 0,
    'Support': 0,
    'Scaffolding': 0,
    'Site facilities': 0,
    'HVAC': 0,
    'Contingency (10%)': 0
  });

  // Calculate total estimated cost
  const getTotalEstimate = () => {
    return Object.values(costEstimates).reduce((sum, value) => sum + parseFloat(value || 0), 0);
  };

  // Handle cost estimate changes
  const handleCostEstimateChange = (category, value) => {
    setCostEstimates(prev => ({
      ...prev,
      [category]: parseFloat(value) || 0
    }));
  };

  // Auto-calculate contingency when other values change
  const calculateContingency = () => {
    const totalWithoutContingency = Object.entries(costEstimates)
      .filter(([key]) => key !== 'Contingency (10%)')
      .reduce((sum, [, value]) => sum + parseFloat(value || 0), 0);
    
    setCostEstimates(prev => ({
      ...prev,
      'Contingency (10%)': totalWithoutContingency * 0.1
    }));
  };

  const handleNext = () => {
    if (step === 1) {
      // Validate basic project info
      if (!formData.name || !formData.total_budget || !formData.start_date || !formData.end_date) {
        alert('Please fill in all required project information');
        return;
      }
    }
    setStep(step + 1);
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Create project with cost estimates
      const projectData = {
        ...formData,
        total_budget: parseFloat(formData.total_budget),
        cost_estimates: costEstimates,
        estimated_total: getTotalEstimate()
      };

      const response = await axios.post(`${API}/projects`, projectData);
      onProjectCreated(response.data);
    } catch (error) {
      console.error('Error creating project:', error);
      alert('Error creating project');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border">
          {/* Progress Steps */}
          <div className="px-6 py-4 border-b">
            <div className="flex items-center space-x-4">
              <div className={`flex items-center ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                  1
                </div>
                <span className="ml-2 font-medium">Project Info</span>
              </div>
              <div className={`flex-1 h-0.5 ${step > 1 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
              <div className={`flex items-center ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                  2
                </div>
                <span className="ml-2 font-medium">Cost Estimates</span>
              </div>
              <div className={`flex-1 h-0.5 ${step > 2 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
              <div className={`flex items-center ${step >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                  3
                </div>
                <span className="ml-2 font-medium">Review</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6">
            {/* Step 1: Project Information */}
            {step === 1 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Project Information</h2>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Project Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter project name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows="3"
                    placeholder="Enter project description"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Total Budget (€) *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.total_budget}
                      onChange={(e) => setFormData({...formData, total_budget: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0.00"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Start Date *</label>
                    <input
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">End Date *</label>
                    <input
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Cost Estimates */}
            {step === 2 && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-900">Cost Estimates</h2>
                  <button
                    type="button"
                    onClick={calculateContingency}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Calculate Contingency
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(costEstimates).map(([category, value]) => (
                    <div key={category}>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {category}
                        {category === 'Contingency (10%)' && (
                          <span className="text-blue-600 text-xs ml-1">(Auto-calculated)</span>
                        )}
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={value || ''}
                        onChange={(e) => handleCostEstimateChange(category, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="0.00"
                        disabled={category === 'Contingency (10%)'}
                      />
                    </div>
                  ))}
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-blue-900">Total Estimated Cost:</span>
                    <span className="text-2xl font-bold text-blue-900">€{getTotalEstimate().toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Review */}
            {step === 3 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Review Project Setup</h2>
                
                {/* Project Info Summary */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Project Information</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><strong>Name:</strong> {formData.name}</div>
                    <div><strong>Budget:</strong> €{parseFloat(formData.total_budget || 0).toLocaleString()}</div>
                    <div><strong>Start Date:</strong> {formData.start_date}</div>
                    <div><strong>End Date:</strong> {formData.end_date}</div>
                  </div>
                  {formData.description && (
                    <div className="mt-3">
                      <strong>Description:</strong> {formData.description}
                    </div>
                  )}
                </div>

                {/* Cost Estimates Summary */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Cost Estimates Summary</h3>
                  <div className="grid grid-cols-1 gap-2 text-sm">
                    {Object.entries(costEstimates)
                      .filter(([, value]) => value > 0)
                      .map(([category, value]) => (
                        <div key={category} className="flex justify-between">
                          <span>{category}:</span>
                          <span>€{value.toLocaleString()}</span>
                        </div>
                      ))}
                  </div>
                  <div className="border-t mt-3 pt-3 flex justify-between font-semibold">
                    <span>Total Estimated Cost:</span>
                    <span>€{getTotalEstimate().toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8">
              <div>
                {step > 1 && (
                  <button
                    type="button"
                    onClick={handleBack}
                    className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    ← Back
                  </button>
                )}
              </div>
              
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={onCancel}
                  className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                
                {step < 3 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Next →
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Create Project
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Cost Entry Component (unchanged)
const CostEntry = ({ project, onBack }) => {
  const [categories, setCategories] = useState([]);
  const [phases, setPhases] = useState([]);
  const [formData, setFormData] = useState({
    category_id: '',
    phase_id: '',
    description: '',
    hours: '',
    hourly_rate: '',
    quantity: '',
    unit_price: '',
    total_amount: '',
    status: 'outstanding',
    due_date: '',
    entry_date: new Date().toISOString().split('T')[0]
  });
  const [isHourly, setIsHourly] = useState(false);

  useEffect(() => {
    fetchCategories();
    fetchPhases();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API}/cost-categories`);
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchPhases = async () => {
    try {
      const response = await axios.get(`${API}/projects/${project.id}/phases`);
      setPhases(response.data);
    } catch (error) {
      console.error('Error fetching phases:', error);
    }
  };

  const handleCategoryChange = (categoryId) => {
    const category = categories.find(c => c.id === categoryId);
    setIsHourly(category?.type === 'hourly');
    setFormData({
      ...formData, 
      category_id: categoryId,
      hourly_rate: category?.default_rate || '',
      hours: '',
      quantity: '',
      unit_price: '',
      total_amount: ''
    });
  };

  const calculateTotal = () => {
    if (isHourly && formData.hours && formData.hourly_rate) {
      return parseFloat(formData.hours) * parseFloat(formData.hourly_rate);
    } else if (!isHourly && formData.quantity && formData.unit_price) {
      return parseFloat(formData.quantity) * parseFloat(formData.unit_price);
    }
    return 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Validate required fields
      if (!formData.category_id) {
        alert('Please select a cost category');
        return;
      }
      
      // Calculate total amount
      let totalAmount = 0;
      if (isHourly) {
        const hours = parseFloat(formData.hours) || 0;
        const rate = parseFloat(formData.hourly_rate) || 0;
        if (hours <= 0 || rate <= 0) {
          alert('Please enter valid hours and hourly rate');
          return;
        }
        totalAmount = hours * rate;
      } else {
        const quantity = parseFloat(formData.quantity) || 0;
        const unitPrice = parseFloat(formData.unit_price) || 0;
        if (quantity <= 0 || unitPrice <= 0) {
          alert('Please enter valid quantity and unit price');
          return;
        }
        totalAmount = quantity * unitPrice;
      }
      
      // If manual total amount is provided, use that instead
      if (formData.total_amount && parseFloat(formData.total_amount) > 0) {
        totalAmount = parseFloat(formData.total_amount);
      }
      
      if (totalAmount <= 0) {
        alert('Total amount must be greater than 0');
        return;
      }
      
      // Prepare submission data
      const submissionData = {
        project_id: project.id,
        category_id: formData.category_id,
        phase_id: formData.phase_id || null,
        description: formData.description || '',
        status: formData.status,
        entry_date: formData.entry_date,
        due_date: formData.status === 'outstanding' && formData.due_date ? formData.due_date : null,
        total_amount: totalAmount
      };
      
      // Add hourly-specific fields
      if (isHourly) {
        submissionData.hours = parseFloat(formData.hours);
        submissionData.hourly_rate = parseFloat(formData.hourly_rate);
      } else {
        submissionData.quantity = parseFloat(formData.quantity);
        submissionData.unit_price = parseFloat(formData.unit_price);
      }
      
      console.log('Submitting cost entry data:', submissionData);
      
      await axios.post(`${API}/cost-entries`, submissionData);
      
      // Reset form
      setFormData({
        category_id: '',
        phase_id: '',
        description: '',
        hours: '',
        hourly_rate: '',
        quantity: '',
        unit_price: '',
        total_amount: '',
        status: 'outstanding',
        due_date: '',
        entry_date: new Date().toISOString().split('T')[0]
      });
      
      alert('Cost entry added successfully!');
    } catch (error) {
      console.error('Error adding cost entry:', error);
      const errorMessage = error.response?.data?.detail || 'Error adding cost entry';
      alert(errorMessage);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Add Cost Entry</h2>
            <button
              onClick={onBack}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              ← Back to Dashboard
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cost Category</label>
                <select
                  required
                  value={formData.category_id}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name} ({category.type})
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phase (Optional)</label>
                <select
                  value={formData.phase_id}
                  onChange={(e) => setFormData({...formData, phase_id: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select phase</option>
                  {phases.map((phase) => (
                    <option key={phase.id} value={phase.id}>
                      {phase.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Brief description of the cost"
              />
            </div>

            {isHourly ? (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Hours</label>
                  <input
                    type="number"
                    step="0.25"
                    value={formData.hours}
                    onChange={(e) => setFormData({...formData, hours: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Hourly Rate</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.hourly_rate}
                    onChange={(e) => setFormData({...formData, hourly_rate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.quantity}
                    onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="1"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Unit Price</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.unit_price}
                    onChange={(e) => setFormData({...formData, unit_price: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Total Amount</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.total_amount || calculateTotal()}
                  onChange={(e) => setFormData({...formData, total_amount: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {calculateTotal() > 0 && `Calculated: €${calculateTotal().toFixed(2)}`}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Entry Date</label>
                <input
                  type="date"
                  value={formData.entry_date}
                  onChange={(e) => setFormData({...formData, entry_date: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Payment Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="outstanding">Outstanding (Not Yet Paid)</option>
                <option value="paid">Paid (Already Settled)</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Select "Outstanding" for costs that need to be paid, "Paid" for already settled costs
              </p>
            </div>

            {formData.status === 'outstanding' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Due Date (Optional)</label>
                <input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({...formData, due_date: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  When does this payment need to be made? Leave empty if no specific due date.
                </p>
              </div>
            )}
            
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Add Cost Entry
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

// Phase Management Component (unchanged)
const PhaseManagement = ({ project, onBack }) => {
  const [phases, setPhases] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    budget_allocation: '',
    start_date: '',
    end_date: ''
  });
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchPhases();
  }, []);

  const fetchPhases = async () => {
    try {
      const response = await axios.get(`${API}/projects/${project.id}/phases`);
      setPhases(response.data);
    } catch (error) {
      console.error('Error fetching phases:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/phases`, {
        project_id: project.id,
        ...formData,
        budget_allocation: parseFloat(formData.budget_allocation)
      });
      
      setFormData({
        name: '',
        description: '',
        budget_allocation: '',
        start_date: '',
        end_date: ''
      });
      setShowForm(false);
      fetchPhases();
    } catch (error) {
      console.error('Error creating phase:', error);
    }
  };

  const updatePhaseStatus = async (phaseId, status) => {
    try {
      await axios.put(`${API}/phases/${phaseId}/status`, { status });
      fetchPhases();
    } catch (error) {
      console.error('Error updating phase status:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Phase Management</h2>
            <div className="space-x-3">
              <button
                onClick={() => setShowForm(!showForm)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                {showForm ? 'Cancel' : 'Add Phase'}
              </button>
              <button
                onClick={onBack}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                ← Back to Dashboard
              </button>
            </div>
          </div>

          {showForm && (
            <div className="mb-8 p-6 border rounded-lg bg-gray-50">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Phase</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phase Name</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Phase name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Budget Allocation</label>
                    <input
                      type="number"
                      required
                      step="0.01"
                      value={formData.budget_allocation}
                      onChange={(e) => setFormData({...formData, budget_allocation: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows="2"
                    placeholder="Phase description"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                    <input
                      type="date"
                      required
                      value={formData.start_date}
                      onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                    <input
                      type="date"
                      required
                      value={formData.end_date}
                      onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                
                <button
                  type="submit"
                  className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create Phase
                </button>
              </form>
            </div>
          )}

          <div className="space-y-4">
            {phases.map((phase) => (
              <div key={phase.id} className="border rounded-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{phase.name}</h3>
                    <p className="text-gray-600">{phase.description}</p>
                  </div>
                  <div className="flex space-x-2">
                    <select
                      value={phase.status}
                      onChange={(e) => updatePhaseStatus(phase.id, e.target.value)}
                      className="px-3 py-1 border border-gray-300 rounded text-sm"
                    >
                      <option value="not_started">Not Started</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="delayed">Delayed</option>
                    </select>
                  </div>
                </div>
                
                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Budget Allocated</p>
                    <p className="font-medium text-lg">€{phase.budget_allocation.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Start Date</p>
                    <p className="font-medium">{new Date(phase.start_date).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">End Date</p>
                    <p className="font-medium">{new Date(phase.end_date).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Status</p>
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                      phase.status === 'completed' ? 'bg-green-100 text-green-800' :
                      phase.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                      phase.status === 'delayed' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {phase.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            
            {phases.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">No phases created yet. Add your first phase to get started!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Main App Component
function App() {
  const [currentProject, setCurrentProject] = useState(null);
  const [currentView, setCurrentView] = useState('projectList'); // projectList, setup, dashboard, costs, phases, categories, cost-status, payment-timeline

  useEffect(() => {
    // Check if there are existing projects, but default to project list
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const response = await axios.get(`${API}/projects`);
      // Don't auto-select project, let user choose from list
      if (response.data.length === 0) {
        setCurrentView('setup');
      } else {
        setCurrentView('projectList');
      }
    } catch (error) {
      console.error('Error loading projects:', error);
      setCurrentView('setup');
    }
  };

  const handleProjectSelected = (project) => {
    setCurrentProject(project);
    setCurrentView('dashboard');
  };

  const handleProjectCreated = (project) => {
    setCurrentProject(project);
    setCurrentView('dashboard');
  };

  const handleNavigation = (view) => {
    setCurrentView(view);
  };

  const handleSwitchProject = () => {
    setCurrentProject(null);
    setCurrentView('projectList');
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'projectList':
        return (
          <ProjectList 
            onProjectSelected={handleProjectSelected}
            onCreateNew={() => setCurrentView('setup')}
          />
        );
      case 'setup':
        return (
          <ProjectSetup 
            onProjectCreated={handleProjectCreated}
            onCancel={() => setCurrentView('projectList')}
          />
        );
      case 'dashboard':
        return (
          <Dashboard 
            project={currentProject} 
            onNavigate={handleNavigation}
            onSwitchProject={handleSwitchProject}
          />
        );
      case 'costs':
        return (
          <CostEntry 
            project={currentProject} 
            onBack={() => setCurrentView('dashboard')} 
          />
        );
      case 'phases':
        return (
          <PhaseManagement 
            project={currentProject} 
            onBack={() => setCurrentView('dashboard')} 
          />
        );
      case 'categories':
        return (
          <CategoryManagement 
            onBack={() => setCurrentView('dashboard')} 
          />
        );
      case 'cost-status':
        return (
          <CostStatusManager 
            project={currentProject} 
            onBack={() => setCurrentView('dashboard')} 
          />
        );
      case 'payment-timeline':
        return (
          <PaymentTimeline 
            project={currentProject} 
            onBack={() => setCurrentView('dashboard')} 
          />
        );
      case 'editEstimates':
        return (
          <EditCostEstimates 
            project={currentProject} 
            onBack={() => setCurrentView('dashboard')} 
          />
        );
      default:
        return (
          <ProjectList 
            onProjectSelected={handleProjectSelected}
            onCreateNew={() => setCurrentView('setup')}
          />
        );
    }
  };

  return (
    <LanguageProvider>
      <div className="App">
        {renderCurrentView()}
      </div>
    </LanguageProvider>
  );
}

export default App;