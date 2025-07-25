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
import { motion, AnimatePresence } from 'framer-motion';

// Language Context
// Comprehensive Gantt Chart Component
const GanttChart = ({ project, onBack }) => {
  const [phases, setPhases] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [ganttData, setGanttData] = useState({});
  const { t, language } = useLanguage();
  const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

  useEffect(() => {
    fetchGanttData();
  }, []);

  const fetchGanttData = async () => {
    try {
      const [phasesResponse, costsResponse] = await Promise.all([
        axios.get(`${API}/projects/${project.id}/phases`),
        axios.get(`${API}/projects/${project.id}/cost-entries`)
      ]);
      
      setPhases(phasesResponse.data);
      
      // Convert cost entries to tasks grouped by phase
      const tasksByPhase = {};
      costsResponse.data.forEach(cost => {
        const phaseId = cost.phase_id || 'no-phase';
        if (!tasksByPhase[phaseId]) {
          tasksByPhase[phaseId] = [];
        }
        tasksByPhase[phaseId].push({
          id: cost.id,
          name: cost.description || cost.category_name,
          phaseId: phaseId,
          startDate: cost.entry_date,
          endDate: cost.due_date || cost.entry_date,
          progress: cost.status === 'paid' ? 100 : 0,
          amount: cost.total_amount,
          status: cost.status,
          category: cost.category_name
        });
      });
      
      setTasks(tasksByPhase);
      calculateGanttLayout(phasesResponse.data, tasksByPhase);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching Gantt data:', error);
      setLoading(false);
    }
  };

  const calculateGanttLayout = (phasesData, tasksData) => {
    const projectStart = new Date(project.start_date);
    const projectEnd = new Date(project.end_date);
    const totalDays = Math.ceil((projectEnd - projectStart) / (1000 * 60 * 60 * 24));
    
    const ganttLayout = {
      projectStart,
      projectEnd,
      totalDays,
      phases: phasesData.map(phase => {
        const phaseStart = new Date(phase.start_date);
        const phaseEnd = new Date(phase.end_date);
        const startOffset = Math.ceil((phaseStart - projectStart) / (1000 * 60 * 60 * 24));
        const duration = Math.ceil((phaseEnd - phaseStart) / (1000 * 60 * 60 * 24));
        
        return {
          ...phase,
          startOffset,
          duration,
          widthPercent: (duration / totalDays) * 100,
          leftPercent: (startOffset / totalDays) * 100,
          tasks: tasksData[phase.id] || []
        };
      })
    };
    
    setGanttData(ganttLayout);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'in_progress': return 'bg-blue-500';
      case 'delayed': return 'bg-red-500';
      case 'not_started': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  };

  const getTaskStatusColor = (progress) => {
    if (progress === 100) return 'bg-green-400';
    if (progress > 0) return 'bg-yellow-400';
    return 'bg-gray-300';
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString(language === 'de' ? 'de-DE' : 'en-US');
  };

  const generateTimelineLabels = () => {
    if (!ganttData.projectStart || !ganttData.totalDays) return [];
    
    const labels = [];
    const current = new Date(ganttData.projectStart);
    const step = Math.max(1, Math.floor(ganttData.totalDays / 12)); // Show ~12 labels max
    
    for (let i = 0; i <= ganttData.totalDays; i += step) {
      const labelDate = new Date(current);
      labelDate.setDate(labelDate.getDate() + i);
      labels.push({
        date: labelDate,
        label: labelDate.toLocaleDateString(language === 'de' ? 'de-DE' : 'en-US', { 
          month: 'short', 
          day: 'numeric' 
        }),
        position: (i / ganttData.totalDays) * 100
      });
    }
    
    return labels;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <button
                onClick={onBack}
                className="flex items-center text-blue-600 hover:text-blue-800 mb-4"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
                {t('backToDashboard')}
              </button>
              <h1 className="text-3xl font-bold text-gray-900">
                📊 {t('ganttChart')} - {project.name}
              </h1>
              <p className="text-gray-600 mt-2">
                {t('projectDuration')}: {formatDate(project.start_date)} - {formatDate(project.end_date)}
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500 mb-1">{t('totalBudget')}</div>
              <div className="text-2xl font-bold text-blue-600">€{project.total_budget?.toLocaleString()}</div>
            </div>
          </div>

          {/* Legend */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-3">📋 {t('legend')}</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="flex items-center">
                <div className="w-4 h-3 bg-green-500 rounded mr-2"></div>
                <span>{t('completed')}</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-3 bg-blue-500 rounded mr-2"></div>
                <span>{t('inProgress')}</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-3 bg-red-500 rounded mr-2"></div>
                <span>{t('delayed')}</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-3 bg-gray-400 rounded mr-2"></div>
                <span>{t('notStarted')}</span>
              </div>
            </div>
          </div>

          {/* Timeline Header */}
          <div className="mb-4">
            <div className="relative h-12 bg-gray-100 rounded-t-lg border-b-2 border-gray-300">
              {generateTimelineLabels().map((label, index) => (
                <div
                  key={index}
                  className="absolute top-0 h-full flex items-center px-2 text-xs font-medium text-gray-700 border-l border-gray-300"
                  style={{ left: `${label.position}%` }}
                >
                  {label.label}
                </div>
              ))}
            </div>
          </div>

          {/* Gantt Chart */}
          <div className="space-y-4">
            {ganttData.phases?.map((phase) => (
              <motion.div
                key={phase.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="border rounded-lg p-4 bg-white shadow-sm"
              >
                {/* Phase Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className={`w-4 h-4 rounded ${getStatusColor(phase.status)} mr-3`}></div>
                    <div>
                      <h3 className="font-semibold text-lg">{phase.name}</h3>
                      <p className="text-sm text-gray-600">
                        {formatDate(phase.start_date)} - {formatDate(phase.end_date)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">€{phase.budget_allocation?.toLocaleString()}</div>
                    <div className="text-xs text-gray-500 capitalize">{phase.status.replace('_', ' ')}</div>
                  </div>
                </div>

                {/* Phase Timeline Bar */}
                <div className="relative h-8 bg-gray-200 rounded-lg mb-4">
                  <div
                    className={`absolute top-0 h-full rounded-lg ${getStatusColor(phase.status)} opacity-80`}
                    style={{
                      left: `${phase.leftPercent}%`,
                      width: `${phase.widthPercent}%`
                    }}
                  ></div>
                  <div
                    className="absolute top-1/2 transform -translate-y-1/2 text-white text-xs font-medium px-2"
                    style={{ left: `${phase.leftPercent + 1}%` }}
                  >
                    {phase.name}
                  </div>
                </div>

                {/* Phase Tasks */}
                {phase.tasks && phase.tasks.length > 0 && (
                  <div className="mt-4 pl-6">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">📋 {t('tasks')} ({phase.tasks.length})</h4>
                    <div className="space-y-2">
                      {phase.tasks.map((task) => (
                        <motion.div
                          key={task.id}
                          whileHover={{ scale: 1.02 }}
                          className="flex items-center justify-between p-2 bg-gray-50 rounded cursor-pointer hover:bg-gray-100"
                          onClick={() => {
                            setSelectedTask(task);
                            setShowTaskModal(true);
                          }}
                        >
                          <div className="flex items-center">
                            <div className={`w-3 h-3 rounded-full ${getTaskStatusColor(task.progress)} mr-3`}></div>
                            <div>
                              <div className="text-sm font-medium">{task.name}</div>
                              <div className="text-xs text-gray-500">{task.category}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-semibold">€{task.amount?.toLocaleString()}</div>
                            <div className="text-xs text-gray-500">{task.progress}% {t('complete')}</div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          {/* Current Date Indicator */}
          {ganttData.projectStart && (
            <div className="relative mt-4">
              <div
                className="absolute top-0 w-0.5 h-full bg-red-500 z-10"
                style={{
                  left: `${((new Date() - ganttData.projectStart) / (1000 * 60 * 60 * 24)) / ganttData.totalDays * 100}%`
                }}
              >
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-red-500 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                  📍 {t('today')}
                </div>
              </div>
            </div>
          )}

          {/* Summary Stats */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{ganttData.phases?.length || 0}</div>
              <div className="text-sm text-gray-600">{t('totalPhases')}</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {ganttData.phases?.filter(p => p.status === 'completed').length || 0}
              </div>
              <div className="text-sm text-gray-600">{t('completedPhases')}</div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                {ganttData.phases?.filter(p => p.status === 'in_progress').length || 0}
              </div>
              <div className="text-sm text-gray-600">{t('inProgressPhases')}</div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {ganttData.phases?.filter(p => p.status === 'delayed').length || 0}
              </div>
              <div className="text-sm text-gray-600">{t('delayedPhases')}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Task Detail Modal */}
      <AnimatePresence>
        {showTaskModal && selectedTask && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setShowTaskModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">📋 {t('taskDetails')}</h3>
                <button
                  onClick={() => setShowTaskModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">{t('taskName')}</label>
                  <div className="mt-1 text-gray-900">{selectedTask.name}</div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700">{t('category')}</label>
                  <div className="mt-1 text-gray-900">{selectedTask.category}</div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700">{t('amount')}</label>
                  <div className="mt-1 text-lg font-semibold text-green-600">€{selectedTask.amount?.toLocaleString()}</div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700">{t('status')}</label>
                  <div className="mt-1 flex items-center">
                    <div className={`w-3 h-3 rounded-full ${getTaskStatusColor(selectedTask.progress)} mr-2`}></div>
                    <span className="capitalize">{selectedTask.status}</span>
                    <span className="ml-2 text-gray-500">({selectedTask.progress}%)</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">{t('startDate')}</label>
                    <div className="mt-1 text-gray-900">{formatDate(selectedTask.startDate)}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">{t('endDate')}</label>
                    <div className="mt-1 text-gray-900">{formatDate(selectedTask.endDate)}</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

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
    ganttChart: "Gantt Chart",
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
    
    // Enhanced EVM Terms
    obligations: "Obligations",
    committed: "Committed",
    adjustedCPI: "Adjusted CPI",
    adjustedEAC: "Adjusted EAC",
    standardMetrics: "Standard Metrics",
    adjustedMetrics: "Adjusted Metrics (with Obligations)",
    includeObligations: "Include Obligations in Calculations",
    obligationsTooltip: "Committed costs (POs, contracts) not yet incurred",
    budgetBreachRisk: "Budget Breach Risk",
    breachSeverity: "Breach Severity",
    addObligation: "Add Obligation",
    manageObligations: "Manage Obligations",
    obligationAmount: "Obligation Amount",
    expectedIncurDate: "Expected Incur Date",
    commitmentDate: "Commitment Date",
    obligationDescription: "Obligation Description",
    
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
    outstandingCosts: "Outstanding Costs",
    paidCosts: "Paid Costs",
    totalCosts: "Total Costs",
    noOutstandingCosts: "No outstanding costs! 🎉",
    noPaidCosts: "No paid costs yet.",
    
    // Summary Labels
    costBreakdown: "Cost Breakdown",
    recentEntries: "Recent Entries",
    projectSummary: "Project Summary",
    totalBudget: "Total Budget",
    totalSpent: "Total Spent",
    paidOnly: "Paid Only",
    availableIfPaid: "Available (If Paid)",
    
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
    currentDate: "Current Date",
    monthlySpendingTrend: "Monthly Spending Trend",
    costBreakdownByCategory: "Cost Breakdown by Category",
    
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
    ganttChart: "Gantt-Diagramm",
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
    
    // Enhanced EVM Terms
    obligations: "Verpflichtungen",
    committed: "Verpflichtet",
    adjustedCPI: "Angepasster CPI",
    adjustedEAC: "Angepasste EAC",
    standardMetrics: "Standard-Metriken",
    adjustedMetrics: "Angepasste Metriken (mit Verpflichtungen)",
    includeObligations: "Verpflichtungen in Berechnungen einbeziehen",
    obligationsTooltip: "Verpflichtete Kosten (Bestellungen, Verträge) noch nicht angefallen",
    budgetBreachRisk: "Budgetüberschreitungsrisiko",
    breachSeverity: "Überschreitungsschwere",
    addObligation: "Verpflichtung hinzufügen",
    manageObligations: "Verpflichtungen verwalten",
    obligationAmount: "Verpflichtungsbetrag",
    expectedIncurDate: "Erwartetes Anfallsdatum",
    commitmentDate: "Verpflichtungsdatum",
    obligationDescription: "Verpflichtungsbeschreibung",
    
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
    outstandingCosts: "Ausstehende Kosten",
    paidCosts: "Bezahlte Kosten",
    totalCosts: "Gesamtkosten",
    noOutstandingCosts: "Keine ausstehenden Kosten! 🎉",
    noPaidCosts: "Noch keine bezahlten Kosten.",
    
    // Summary Labels
    costBreakdown: "Kostenaufschlüsselung",
    recentEntries: "Neueste Einträge",
    projectSummary: "Projektzusammenfassung",
    totalBudget: "Gesamtbudget",
    totalSpent: "Gesamt ausgegeben",
    paidOnly: "Nur Bezahlt",
    availableIfPaid: "Verfügbar (falls bezahlt)",
    
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
    currentDate: "Aktuelles Datum",
    monthlySpendingTrend: "Monatlicher Ausgabentrend",
    costBreakdownByCategory: "Kostenaufschlüsselung nach Kategorie",
    
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
  const [showDemoMenu, setShowDemoMenu] = useState(false);
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
            <div className="flex justify-center items-center space-x-4">
              {/* Main New Project Button */}
              <button
                onClick={onCreateNew}
                className="px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold text-lg shadow-lg"
              >
                + {t('newProject')}
              </button>
              
              {/* Demo Projects Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowDemoMenu(!showDemoMenu)}
                  className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors border border-gray-300 flex items-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                  </svg>
                  <span>Demo Projects</span>
                  <svg className={`w-4 h-4 transition-transform ${showDemoMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </button>
                
                {showDemoMenu && (
                  <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[280px]">
                    <div className="py-1">
                      <div className="px-4 py-2 text-xs font-medium text-gray-500 border-b">Create Sample Projects</div>
                      
                      <button
                        onClick={() => {
                          createOngoingDemoProject();
                          setShowDemoMenu(false);
                        }}
                        className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-orange-50 flex items-center space-x-3"
                      >
                        <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        <div>
                          <div className="font-medium">{t('createOngoingDemoProject')}</div>
                          <div className="text-xs text-gray-500">Smart Manufacturing (50% complete, €1.2M)</div>
                        </div>
                      </button>
                      
                      <button
                        onClick={() => {
                          createDemoProject();
                          setShowDemoMenu(false);
                        }}
                        className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-purple-50 flex items-center space-x-3"
                      >
                        <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                        </svg>
                        <div>
                          <div className="font-medium">{t('createDemoProject')}</div>
                          <div className="text-xs text-gray-500">Basic project with sample data</div>
                        </div>
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Utility Buttons */}
              <div className="flex space-x-2">
                <button
                  onClick={exportAllData}
                  className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                  title="Export all data as backup"
                >
                  📥
                </button>
                <label className="px-3 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors cursor-pointer text-sm" title="Import backup data">
                  📤
                  <input
                    type="file"
                    accept=".json"
                    onChange={importData}
                    disabled={importing}
                    className="hidden"
                  />
                </label>
              </div>
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
  const { t } = useLanguage();

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
              <h2 className="text-2xl font-bold text-gray-900">{t('paymentTimelineHeader')}</h2>
              <p className="text-gray-600">Outstanding payment schedule for {project.name}</p>
            </div>
            <button
              onClick={onBack}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              ← {t('backToDashboard')}
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
                <h3 className="text-xl font-bold text-red-700 mb-4">🚨 {t('overduePayments')}</h3>
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
                              {t('markPaid')} ✓
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
                <h3 className="text-xl font-bold text-orange-700 mb-4">⚡ {t('dueThisWeek')}</h3>
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
                              {t('markPaid')} ✓
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
                <h3 className="text-xl font-bold text-yellow-700 mb-4">📅 {t('dueThisMonth')}</h3>
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
                              {t('markPaid')} ✓
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
                <h3 className="text-xl font-bold text-blue-700 mb-4">🔮 {t('futureUnscheduled')}</h3>
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
                              {t('markPaid')} ✓
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
              <h3 className="text-xl font-bold text-green-600 mb-2">{t('allPaymentsUpToDate')}</h3>
              <p className="text-gray-600">{t('noOutstandingPayments')}</p>
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
  const [editingCost, setEditingCost] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const { t } = useLanguage();

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

  const processManualPayment = async (entryId, originalAmount) => {
    try {
      const payment = parseFloat(paymentAmount);
      const original = parseFloat(originalAmount);
      
      if (payment <= 0) {
        alert('Payment amount must be greater than 0');
        return;
      }

      if (payment >= original) {
        // Payment covers the full amount or more - mark as paid
        await axios.put(`${API}/cost-entries/${entryId}/status`, 'paid', {
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (payment > original) {
          // Overpayment - excess goes to remaining budget
          const excess = payment - original;
          alert(`✅ Payment processed!\n€${original.toLocaleString()} cost marked as paid.\n€${excess.toLocaleString()} excess added to remaining budget.`);
        } else {
          alert(`✅ Payment processed! Cost entry fully paid: €${payment.toLocaleString()}`);
        }
      } else {
        // Partial payment - need to split the cost entry
        const remainingAmount = original - payment;
        
        // Mark original as paid with payment amount
        await axios.put(`${API}/cost-entries/${entryId}/status`, 'paid', {
          headers: { 'Content-Type': 'application/json' }
        });
        
        // Update the amount to the payment amount
        await axios.put(`${API}/cost-entries/${entryId}/amount`, { total_amount: payment }, {
          headers: { 'Content-Type': 'application/json' }
        });
        
        // Create new outstanding entry for remaining amount
        const costData = outstandingCosts.find(c => c.id === entryId);
        if (costData) {
          const newOutstandingEntry = {
            project_id: project.id,
            category_id: costData.category_id,
            phase_id: costData.phase_id || null,
            description: `${costData.description} - Remaining Balance`,
            total_amount: remainingAmount,
            status: 'outstanding',
            entry_date: costData.entry_date,
            due_date: costData.due_date || null
          };
          
          await axios.post(`${API}/cost-entries`, newOutstandingEntry);
        }
        
        alert(`✅ Partial payment processed!\n€${payment.toLocaleString()} paid.\n€${remainingAmount.toLocaleString()} remains outstanding.`);
      }
      
      fetchCostsByStatus(); // Refresh the lists
      setEditingCost(null);
      setPaymentAmount('');
    } catch (error) {
      console.error('Error processing payment:', error);
      alert('Error processing payment');
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
              <h2 className="text-2xl font-bold text-gray-900">{t('costStatusManagement')}</h2>
              <p className="text-gray-600">Track outstanding and paid costs for {project.name}</p>
            </div>
            <button
              onClick={onBack}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              ← {t('backToDashboard')}
            </button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-red-50 p-6 rounded-lg border border-red-200">
              <h3 className="text-lg font-semibold text-red-800 mb-2">{t('outstandingCosts')}</h3>
              <p className="text-3xl font-bold text-red-600">€{outstandingTotal.toLocaleString()}</p>
              <p className="text-sm text-red-600">{outstandingCosts.length} entries</p>
            </div>
            
            <div className="bg-green-50 p-6 rounded-lg border border-green-200">
              <h3 className="text-lg font-semibold text-green-800 mb-2">{t('paidCosts')}</h3>
              <p className="text-3xl font-bold text-green-600">€{paidTotal.toLocaleString()}</p>
              <p className="text-sm text-green-600">{paidCosts.length} entries</p>
            </div>
            
            <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
              <h3 className="text-lg font-semibold text-blue-800 mb-2">{t('totalCosts')}</h3>
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
                    <p className="text-gray-500">{t('noOutstandingCosts')}</p>
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
                          
                          {editingCost === cost.id ? (
                            <div className="space-y-2">
                              <input
                                type="number"
                                step="0.01"
                                value={paymentAmount}
                                onChange={(e) => setPaymentAmount(e.target.value)}
                                placeholder="Payment amount"
                                className="w-full p-2 border rounded text-sm"
                                autoFocus
                              />
                              <div className="flex space-x-1">
                                <button
                                  onClick={() => processManualPayment(cost.id, cost.total_amount)}
                                  className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors"
                                >
                                  Process Payment
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingCost(null);
                                    setPaymentAmount('');
                                  }}
                                  className="px-2 py-1 bg-gray-400 text-white rounded text-xs hover:bg-gray-500 transition-colors"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-1">
                              <button
                                onClick={() => updateCostStatus(cost.id, 'paid')}
                                className="w-full px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
                              >
                                {t('markAsPaid')} ✓
                              </button>
                              <button
                                onClick={() => {
                                  setEditingCost(cost.id);
                                  setPaymentAmount(cost.total_amount.toString());
                                }}
                                className="w-full px-3 py-1 bg-orange-500 text-white rounded text-sm hover:bg-orange-600 transition-colors"
                              >
                                Manual Payment 💰
                              </button>
                            </div>
                          )}
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
                    <p className="text-gray-500">{t('noPaidCosts')}</p>
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
                            {t('markOutstanding')} ⚠️
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
    labels: [t('budgetAllocated'), t('amountSpent'), t('remainingActual')],
    datasets: [
      {
        label: t('budgetAnalysis'),
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
                      
                      <button
                        onClick={() => {
                          setShowActionsMenu(false);
                          onNavigate('obligations');
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-3"
                      >
                        <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
                        </svg>
                        <span>{t('manageObligations')}</span>
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
            <h3 className="text-lg font-semibold text-gray-900 mb-4">📈 {t('monthlySpendingTrend')}</h3>
            <div className="h-64">
              <Line data={trendLineData} options={chartOptions} />
            </div>
          </div>

          {/* Budget Analysis */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">💰 {t('budgetAnalysis')}</h3>
            <div className="h-64">
              <Bar data={budgetComparisonData} options={chartOptions} />
            </div>
          </div>
        </div>

          {/* Cost Breakdown & Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Cost Breakdown Pie Chart */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">🎯 {t('costBreakdownByCategory')}</h3>
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

        {/* Enhanced EVM Metrics Section with Dual Standard vs Adjusted Display */}
        {summary.evm_metrics && (
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">{t('earnedValueManagement')}</h2>
              <div className="flex items-center space-x-4">
                <button
                  onClick={async () => {
                    setLoading(true);
                    await fetchDashboardData();
                    alert('✅ EVM metrics refreshed!');
                  }}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                  </svg>
                  <span>Refresh EVM</span>
                </button>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="includeObligations"
                    defaultChecked
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="includeObligations" className="text-sm text-gray-700">
                    {t('includeObligations')}
                  </label>
                  <div className="relative group">
                    <svg className="w-4 h-4 text-gray-400 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                      {t('obligationsTooltip')}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Early Warning Alerts */}
            {summary.evm_metrics.early_warnings && summary.evm_metrics.early_warnings.length > 0 && (
              <div className="mb-6 space-y-2">
                {summary.evm_metrics.early_warnings.map((warning, index) => (
                  <div key={index} className={`p-4 rounded-lg border-l-4 ${
                    warning === 'STAKEHOLDER_NOTIFICATION' ? 'bg-red-50 border-red-400' :
                    warning === 'FORMAL_CHANGE_REVIEW' ? 'bg-orange-50 border-orange-400' :
                    'bg-yellow-50 border-yellow-400'
                  }`}>
                    <div className="flex items-center">
                      <svg className={`w-5 h-5 mr-3 ${
                        warning === 'STAKEHOLDER_NOTIFICATION' ? 'text-red-600' :
                        warning === 'FORMAL_CHANGE_REVIEW' ? 'text-orange-600' :
                        'text-yellow-600'
                      }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.232 15.5c-.77.833.192 2.5 1.732 2.5z"></path>
                      </svg>
                      <div>
                        <h4 className={`font-semibold ${
                          warning === 'STAKEHOLDER_NOTIFICATION' ? 'text-red-800' :
                          warning === 'FORMAL_CHANGE_REVIEW' ? 'text-orange-800' :
                          'text-yellow-800'
                        }`}>
                          {warning === 'COST_CONTROL_ALERT' && 'Cost Control Alert'}
                          {warning === 'FORMAL_CHANGE_REVIEW' && 'Formal Change Review Required'}
                          {warning === 'STAKEHOLDER_NOTIFICATION' && 'Stakeholder Notification Required'}
                        </h4>
                        <p className={`text-sm ${
                          warning === 'STAKEHOLDER_NOTIFICATION' ? 'text-red-700' :
                          warning === 'FORMAL_CHANGE_REVIEW' ? 'text-orange-700' :
                          'text-yellow-700'
                        }`}>
                          {warning === 'COST_CONTROL_ALERT' && 'Adjusted CPI has fallen below 0.90 - immediate cost control measures recommended'}
                          {warning === 'FORMAL_CHANGE_REVIEW' && 'Adjusted EAC exceeds 110% of budget - formal change control process should be initiated'}
                          {warning === 'STAKEHOLDER_NOTIFICATION' && 'High budget breach risk detected - stakeholders should be notified immediately'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Key Metrics Cards - Enhanced with Standard vs Adjusted */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg text-center">
                <div className="text-blue-600 mb-2">
                  <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-600">{t('plannedValue')} (PV)</p>
                <p className="text-xl font-bold text-blue-600">€{summary.evm_metrics.planned_value?.toLocaleString()}</p>
              </div>

              <div className="bg-green-50 p-4 rounded-lg text-center">
                <div className="text-green-600 mb-2">
                  <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-600">{t('earnedValue')} (EV)</p>
                <p className="text-xl font-bold text-green-600">€{summary.evm_metrics.earned_value?.toLocaleString()}</p>
              </div>

              <div className="bg-red-50 p-4 rounded-lg text-center">
                <div className="text-red-600 mb-2">
                  <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-600">{t('actualCost')} (AC)</p>
                <p className="text-xl font-bold text-red-600">€{summary.evm_metrics.actual_cost?.toLocaleString()}</p>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg text-center">
                <div className="text-purple-600 mb-2">
                  <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-600">{t('obligations')} (Weighted)</p>
                <p className="text-xl font-bold text-purple-600">€{(summary.evm_metrics.total_obligations || 0).toLocaleString()}</p>
              </div>
            </div>

            {/* Dual Metrics Comparison - Standard vs Adjusted */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Standard Metrics */}
              <div className="bg-gray-50 p-6 rounded-lg border">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                  </svg>
                  {t('standardMetrics')}
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">{t('costPerformanceIndex')} (CPI)</span>
                    <div className="flex items-center space-x-2">
                      <span className={`font-bold text-lg ${
                        summary.evm_metrics.cost_performance_index > 1 ? 'text-green-600' : 
                        summary.evm_metrics.cost_performance_index < 0.95 ? 'text-red-600' : 'text-yellow-600'
                      }`}>
                        {summary.evm_metrics.cost_performance_index?.toFixed(3)}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                        summary.evm_metrics.cost_status === 'Over Budget' ? 'bg-red-100 text-red-800' :
                        summary.evm_metrics.cost_status === 'Under Budget' ? 'bg-green-100 text-green-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {t(summary.evm_metrics.cost_status?.toLowerCase().replace(' ', ''))}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">{t('eacForecast')}</span>
                    <span className="font-bold text-gray-900">€{summary.evm_metrics.estimate_at_completion?.toLocaleString()}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Variance at Completion</span>
                    <span className={`font-bold ${
                      summary.evm_metrics.variance_at_completion >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      €{summary.evm_metrics.variance_at_completion?.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Adjusted Metrics */}
              <div className="bg-blue-50 p-6 rounded-lg border-2 border-blue-200">
                <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
                  </svg>
                  {t('adjustedMetrics')}
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-blue-600">{t('adjustedCPI')}</span>
                    <div className="flex items-center space-x-2">
                      <span className={`font-bold text-lg ${
                        (summary.evm_metrics.cost_performance_index_adj || 0) > 1 ? 'text-green-600' : 
                        (summary.evm_metrics.cost_performance_index_adj || 0) < 0.90 ? 'text-red-600' : 'text-yellow-600'
                      }`}>
                        {(summary.evm_metrics.cost_performance_index_adj || 0).toFixed(3)}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                        (summary.evm_metrics.cost_status_adj || 'On Budget') === 'Over Budget' ? 'bg-red-100 text-red-800' :
                        (summary.evm_metrics.cost_status_adj || 'On Budget') === 'Under Budget' ? 'bg-green-100 text-green-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {t((summary.evm_metrics.cost_status_adj || 'onBudget').toLowerCase().replace(' ', ''))}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-blue-600">{t('adjustedEAC')}</span>
                    <span className="font-bold text-blue-900">€{(summary.evm_metrics.estimate_at_completion_adj || 0).toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-blue-600">Adjusted Variance</span>
                    <span className={`font-bold ${
                      (summary.evm_metrics.variance_at_completion_adj || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      €{(summary.evm_metrics.variance_at_completion_adj || 0).toLocaleString()}
                    </span>
                  </div>

                  {/* Performance Divergence Indicator */}
                  {Math.abs((summary.evm_metrics.cost_performance_index_adj || 0) - summary.evm_metrics.cost_performance_index) > 0.1 && (
                    <div className="bg-yellow-100 border border-yellow-200 rounded-lg p-3 mt-3">
                      <div className="flex items-center space-x-2">
                        <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.232 15.5c-.77.833.192 2.5 1.732 2.5z"></path>
                        </svg>
                        <span className="text-sm font-medium text-yellow-800">
                          Significant Divergence: {Math.abs(((summary.evm_metrics.cost_performance_index_adj || 0) - summary.evm_metrics.cost_performance_index) * 100).toFixed(1)}% difference
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Budget Breach Risk Indicator */}
                  {summary.evm_metrics.budget_breach_risk && (
                    <div className="bg-red-100 border border-red-200 rounded-lg p-3 mt-3">
                      <div className="flex items-center space-x-2">
                        <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.232 15.5c-.77.833.192 2.5 1.732 2.5z"></path>
                        </svg>
                        <div>
                          <span className="text-sm font-medium text-red-800">{t('budgetBreachRisk')}</span>
                          <span className={`ml-2 px-2 py-1 text-xs rounded-full font-medium ${
                            summary.evm_metrics.breach_severity === 'High' ? 'bg-red-200 text-red-800' :
                            summary.evm_metrics.breach_severity === 'Medium' ? 'bg-orange-200 text-orange-800' :
                            'bg-yellow-200 text-yellow-800'
                          }`}>
                            {summary.evm_metrics.breach_severity} Risk
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Schedule Performance Indicator */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">{t('schedulePerformanceIndex')} (SPI)</span>
                <div className="flex items-center space-x-2">
                  <span className={`font-bold ${
                    summary.evm_metrics.schedule_performance_index > 1 ? 'text-green-600' : 
                    summary.evm_metrics.schedule_performance_index < 0.95 ? 'text-red-600' : 'text-yellow-600'
                  }`}>
                    {summary.evm_metrics.schedule_performance_index?.toFixed(3)}
                  </span>
                  <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                    summary.evm_metrics.schedule_status === 'Behind' ? 'bg-red-100 text-red-800' :
                    summary.evm_metrics.schedule_status === 'Ahead' ? 'bg-green-100 text-green-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {t(summary.evm_metrics.schedule_status?.toLowerCase())}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
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
                    annotation: {
                      annotations: {
                        // Current date marker
                        currentDate: {
                          type: 'line',
                          xMin: (() => {
                            const now = new Date();
                            const projectStart = new Date(project.start_date);
                            const monthsFromStart = (now.getFullYear() - projectStart.getFullYear()) * 12 + (now.getMonth() - projectStart.getMonth());
                            return Math.max(0, monthsFromStart);
                          })(),
                          xMax: (() => {
                            const now = new Date();
                            const projectStart = new Date(project.start_date);
                            const monthsFromStart = (now.getFullYear() - projectStart.getFullYear()) * 12 + (now.getMonth() - projectStart.getMonth());
                            return Math.max(0, monthsFromStart);
                          })(),
                          borderColor: 'rgb(34, 197, 94)',
                          borderWidth: 3,
                          borderDash: [5, 5],
                          label: {
                            content: `📍 ${t('currentDate')} (${new Date().toLocaleDateString(language === 'de' ? 'de-DE' : 'en-US')})`,
                            enabled: true,
                            position: 'start',
                            backgroundColor: 'rgba(34, 197, 94, 0.8)',
                            color: 'white',
                            font: {
                              weight: 'bold',
                              size: 11
                            },
                            padding: 6,
                            yAdjust: -20
                          }
                        },
                        // Cost overrun prediction (if exists)
                        ...(dashboardData.evm_timeline?.overrun_point ? {
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
                        } : {})
                      }
                    }
                  }}}
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
      const response = await axios.get(`${API}/api/cost-categories`);
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
  const { t } = useLanguage();
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
              <h2 className="text-2xl font-bold text-gray-900">{t('editCostEstimatesHeader')}</h2>
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
                {t('calculateContingency')}
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
  const { t } = useLanguage();
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
                    {t('calculateContingency')}
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

// Enhanced Obligation Management Component
const ObligationManager = ({ project, onBack }) => {
  const [obligations, setObligations] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [activeTab, setActiveTab] = useState('active');
  const { t } = useLanguage();
  const API = process.env.REACT_APP_BACKEND_URL;
  
  const [formData, setFormData] = useState({
    category_id: '',
    description: '',
    amount: '',
    expected_incur_date: '',
    confidence_level: 'medium',
    priority: 'normal',
    contract_reference: '',
    vendor_supplier: ''
  });

  useEffect(() => {
    fetchObligations();
    fetchCategories();
  }, [activeTab]);

  const fetchObligations = async () => {
    try {
      const response = await axios.get(`${API}/api/projects/${project.id}/obligations?status=${activeTab}`);
      setObligations(response.data);
    } catch (error) {
      console.error('Error fetching obligations:', error);
    }
  };
  
  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API}/api/cost-categories`);
      setCategories(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/api/obligations`, {
        project_id: project.id,
        ...formData,
        amount: parseFloat(formData.amount)
      });
      
      setFormData({
        category_id: '',
        description: '',
        amount: '',
        expected_incur_date: '',
        confidence_level: 'medium',
        priority: 'normal',
        contract_reference: '',
        vendor_supplier: ''
      });
      setShowAddForm(false);
      fetchObligations();
      alert('Obligation added successfully!');
    } catch (error) {
      console.error('Error adding obligation:', error);
      alert('Error adding obligation');
    }
  };

  const updateObligationStatus = async (obligationId, newStatus) => {
    try {
      await axios.put(`${API}/api/obligations/${obligationId}/status`, {status: newStatus});
      fetchObligations();
      alert(`Obligation marked as ${newStatus}!`);
    } catch (error) {
      console.error('Error updating obligation:', error);
      alert('Error updating obligation');
    }
  };

  const deleteObligation = async (obligationId) => {
    if (window.confirm('Are you sure you want to delete this obligation?')) {
      try {
        await axios.delete(`${API}/api/obligations/${obligationId}`);
        fetchObligations();
        alert('Obligation deleted successfully!');
      } catch (error) {
        console.error('Error deleting obligation:', error);
        alert('Error deleting obligation');
      }
    }
  };

  const getConfidenceColor = (level) => {
    switch(level) {
      case 'high': return 'bg-green-100 text-green-800 border-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityIcon = (priority) => {
    switch(priority) {
      case 'high': return '🔴';
      case 'normal': return '🟡';
      case 'low': return '🟢';
      default: return '⚪';
    }
  };

  const getWeightedAmount = (amount, confidence) => {
    const weights = { high: 0.95, medium: 0.80, low: 0.60 };
    return amount * (weights[confidence] || 0.80);
  };

  const totalObligations = obligations.reduce((sum, obj) => sum + obj.amount, 0);
  const weightedTotal = obligations.reduce((sum, obj) => sum + getWeightedAmount(obj.amount, obj.confidence_level), 0);

  if (loading) return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{t('manageObligations')}</h2>
              <p className="text-gray-600">Enhanced obligation management with confidence weighting for {project.name}</p>
            </div>
            <button
              onClick={onBack}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              ← {t('backToDashboard')}
            </button>
          </div>

          {/* Enhanced Summary with Weighted Calculations */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
              <h3 className="text-lg font-semibold text-blue-800 mb-2">Total {t('obligations')}</h3>
              <p className="text-3xl font-bold text-blue-600">€{totalObligations.toLocaleString()}</p>
              <p className="text-sm text-blue-600">{obligations.length} active items</p>
            </div>
            
            <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
              <h3 className="text-lg font-semibold text-purple-800 mb-2">Weighted Total</h3>
              <p className="text-3xl font-bold text-purple-600">€{weightedTotal.toLocaleString()}</p>
              <p className="text-sm text-purple-600">Risk-adjusted amount</p>
            </div>

            <div className="bg-green-50 p-6 rounded-lg border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-green-800 mb-2">Actions</h3>
                  <button
                    onClick={() => setShowAddForm(true)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    + {t('addObligation')}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Status Tabs */}
          <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
            {['active', 'cancelled', 'converted_to_actual'].map((status) => (
              <button
                key={status}
                onClick={() => setActiveTab(status)}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${
                  activeTab === status
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
              </button>
            ))}
          </div>

          {/* Enhanced Add Form */}
          {showAddForm && (
            <div className="bg-gray-50 p-6 rounded-lg border mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('addObligation')}</h3>
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('costCategory')}</label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => setFormData({...formData, category_id: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Select category...</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('obligationAmount')}</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0.00"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('obligationDescription')}</label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="PO #12345, Equipment procurement..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('expectedIncurDate')}</label>
                  <input
                    type="date"
                    value={formData.expected_incur_date}
                    onChange={(e) => setFormData({...formData, expected_incur_date: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Confidence Level</label>
                  <select
                    value={formData.confidence_level}
                    onChange={(e) => setFormData({...formData, confidence_level: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="high">High (95% - Signed contracts, confirmed POs)</option>
                    <option value="medium">Medium (80% - Approved quotes, pending orders)</option>
                    <option value="low">Low (60% - Planned items, soft commitments)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({...formData, priority: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="high">High Priority</option>
                    <option value="normal">Normal Priority</option>
                    <option value="low">Low Priority</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Contract/PO Reference</label>
                  <input
                    type="text"
                    value={formData.contract_reference}
                    onChange={(e) => setFormData({...formData, contract_reference: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="PO-2024-156, Contract #ABC-123"
                  />
                </div>

                <div className="flex items-end">
                  <div className="flex space-x-3">
                    <button
                      type="submit"
                      className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      {t('save')} Obligation
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="px-4 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                    >
                      {t('cancel')}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* Enhanced Obligations List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">{activeTab.charAt(0).toUpperCase() + activeTab.slice(1).replace('_', ' ')} {t('obligations')}</h3>
              <div className="text-sm text-gray-500">
                {obligations.length} items • €{totalObligations.toLocaleString()} total • €{weightedTotal.toLocaleString()} weighted
              </div>
            </div>
            
            {obligations.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No {activeTab} obligations found. {activeTab === 'active' ? 'Click "Add Obligation" to create one.' : ''}</p>
              </div>
            ) : (
              obligations.map((obligation) => (
                <div key={obligation.id} className="border border-blue-200 rounded-lg p-4 bg-blue-50 hover:bg-blue-100 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-lg">{getPriorityIcon(obligation.priority)}</span>
                        <h3 className="font-semibold text-gray-900">{obligation.category_name}</h3>
                        <span className={`px-2 py-1 text-xs rounded-full font-medium border ${getConfidenceColor(obligation.confidence_level)}`}>
                          {obligation.confidence_level?.toUpperCase()} ({obligation.confidence_level === 'high' ? '95%' : obligation.confidence_level === 'medium' ? '80%' : '60%'})
                        </span>
                        {obligation.status !== 'active' && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full font-medium">
                            {obligation.status.replace('_', ' ').toUpperCase()}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-700 mb-2">{obligation.description}</p>
                      {obligation.contract_reference && (
                        <p className="text-sm text-gray-600 mb-1">📋 Reference: {obligation.contract_reference}</p>
                      )}
                      {obligation.vendor_supplier && (
                        <p className="text-sm text-gray-600 mb-1">🏢 Vendor: {obligation.vendor_supplier}</p>
                      )}
                      <div className="text-sm text-gray-500 mt-1">
                        <p>Commitment: {new Date(obligation.commitment_date).toLocaleDateString()}</p>
                        {obligation.expected_incur_date && (
                          <p>Expected Incur: {new Date(obligation.expected_incur_date).toLocaleDateString()}</p>
                        )}
                        <p>Weighted: €{getWeightedAmount(obligation.amount, obligation.confidence_level).toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-2xl font-bold text-blue-600 mb-2">€{obligation.amount.toLocaleString()}</p>
                      <div className="flex flex-col space-y-1">
                        {activeTab === 'active' && (
                          <>
                            <button
                              onClick={() => updateObligationStatus(obligation.id, 'converted_to_actual')}
                              className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
                            >
                              ✓ Convert to Actual
                            </button>
                            <button
                              onClick={() => updateObligationStatus(obligation.id, 'cancelled')}
                              className="px-3 py-1 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700 transition-colors"
                            >
                              ⚠ Cancel
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => deleteObligation(obligation.id)}
                          className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
                        >
                          🗑 {t('delete')}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Enhanced Cost Entry Component with Payment Splitting and Automatic Obligation Creation
const CostEntry = ({ project, onBack }) => {
  const [categories, setCategories] = useState([]);
  const [phases, setPhases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPaymentSplit, setShowPaymentSplit] = useState(false);
  const { t } = useLanguage();
  const API = process.env.REACT_APP_BACKEND_URL;
  
  const [formData, setFormData] = useState({
    category_id: '',
    phase_id: '',
    description: '',
    hours: '',
    hourly_rate: '',
    quantity: '',
    unit_price: '',
    total_amount: '',
    entry_date: new Date().toISOString().split('T')[0],
    status: 'outstanding',
    due_date: '',
    cost_type: 'hourly' // hourly, material, fixed
  });

  // Payment splitting state
  const [paymentSplits, setPaymentSplits] = useState([
    { percentage: 100, amount: 0, payment_date: new Date().toISOString().split('T')[0], status: 'outstanding', description: 'Full payment' }
  ]);

  useEffect(() => {
    fetchCategories();
    fetchPhases();
  }, []);

  // Update payment splits when total amount changes
  useEffect(() => {
    if (formData.total_amount) {
      const totalAmount = parseFloat(formData.total_amount) || 0;
      setPaymentSplits(splits => 
        splits.map(split => ({
          ...split,
          amount: (totalAmount * split.percentage / 100)
        }))
      );
    }
  }, [formData.total_amount]);

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API}/api/cost-categories`);
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchPhases = async () => {
    try {
      const response = await axios.get(`${API}/api/projects/${project.id}/phases`);
      setPhases(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching phases:', error);
      setLoading(false);
    }
  };

  const calculateTotal = () => {
    if (formData.cost_type === 'hourly') {
      const hours = parseFloat(formData.hours) || 0;
      const rate = parseFloat(formData.hourly_rate) || 0;
      return hours * rate;
    } else if (formData.cost_type === 'material') {
      const quantity = parseFloat(formData.quantity) || 0;
      const price = parseFloat(formData.unit_price) || 0;
      return quantity * price;
    } else {
      return parseFloat(formData.total_amount) || 0;
    }
  };

  // Update total when relevant fields change
  useEffect(() => {
    const newTotal = calculateTotal();
    if (newTotal !== parseFloat(formData.total_amount)) {
      setFormData(prev => ({ ...prev, total_amount: newTotal.toString() }));
    }
  }, [formData.hours, formData.hourly_rate, formData.quantity, formData.unit_price, formData.cost_type]);

  const addPaymentSplit = () => {
    setPaymentSplits([...paymentSplits, {
      percentage: 0,
      amount: 0,
      payment_date: new Date().toISOString().split('T')[0],
      status: 'outstanding',
      description: 'Additional payment'
    }]);
  };

  const updatePaymentSplit = (index, field, value) => {
    const newSplits = [...paymentSplits];
    newSplits[index][field] = value;
    
    // Update amount when percentage changes
    if (field === 'percentage') {
      const totalAmount = parseFloat(formData.total_amount) || 0;
      newSplits[index].amount = (totalAmount * value / 100);
    }
    
    setPaymentSplits(newSplits);
  };

  const removePaymentSplit = (index) => {
    if (paymentSplits.length > 1) {
      setPaymentSplits(paymentSplits.filter((_, i) => i !== index));
    }
  };

  const getTotalPercentage = () => {
    return paymentSplits.reduce((sum, split) => sum + (parseFloat(split.percentage) || 0), 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate payment splits
    const totalPercentage = getTotalPercentage();
    if (Math.abs(totalPercentage - 100) > 0.01) {
      alert(`Payment splits must total 100%. Current total: ${totalPercentage.toFixed(1)}%`);
      return;
    }

    try {
      const selectedCategory = categories.find(cat => cat.id === formData.category_id);
      const selectedPhase = phases.find(phase => phase.id === formData.phase_id);
      
      if (showPaymentSplit && paymentSplits.length > 1) {
        // Create multiple cost entries for payment splits
        for (let i = 0; i < paymentSplits.length; i++) {
          const split = paymentSplits[i];
          
          const splitEntry = {
            project_id: project.id,
            category_id: formData.category_id,
            phase_id: formData.phase_id || null,
            description: `${formData.description} - ${split.description} (${split.percentage}%)`,
            hours: formData.cost_type === 'hourly' ? (parseFloat(formData.hours) * split.percentage / 100) : null,
            hourly_rate: formData.cost_type === 'hourly' ? parseFloat(formData.hourly_rate) || 0 : null,
            quantity: formData.cost_type === 'material' ? (parseFloat(formData.quantity) * split.percentage / 100) : null,
            unit_price: formData.cost_type === 'material' ? parseFloat(formData.unit_price) || 0 : null,
            total_amount: split.amount,
            entry_date: formData.entry_date,
            status: split.status,
            due_date: split.payment_date || null
          };

          await axios.post(`${API}/api/cost-entries`, splitEntry);

          // Create obligation for outstanding payments
          if (split.status === 'outstanding' && split.amount > 0) {
            const obligationData = {
              project_id: project.id,
              category_id: formData.category_id,
              description: `Cost obligation: ${formData.description} - ${split.description}`,
              amount: split.amount,
              expected_incur_date: split.payment_date,
              confidence_level: 'high', // High confidence as it's a confirmed cost
              priority: 'normal',
              contract_reference: `COST-${Date.now()}-${i}`,
              vendor_supplier: ''
            };

            await axios.post(`${API}/api/obligations`, obligationData);
          }
        }
      } else {
        // Single cost entry
        const costEntry = {
          project_id: project.id,
          category_id: formData.category_id,
          phase_id: formData.phase_id || null,
          description: formData.description,
          hours: formData.cost_type === 'hourly' ? parseFloat(formData.hours) || 0 : null,
          hourly_rate: formData.cost_type === 'hourly' ? parseFloat(formData.hourly_rate) || 0 : null,
          quantity: formData.cost_type === 'material' ? parseFloat(formData.quantity) || 0 : null,
          unit_price: formData.cost_type === 'material' ? parseFloat(formData.unit_price) || 0 : null,
          total_amount: parseFloat(formData.total_amount) || 0,
          entry_date: formData.entry_date,
          status: formData.status,
          due_date: formData.due_date || null
        };

        await axios.post(`${API}/api/cost-entries`, costEntry);

        // Create obligation for outstanding costs
        if (formData.status === 'outstanding' && parseFloat(formData.total_amount) > 0) {
          const obligationData = {
            project_id: project.id,
            category_id: formData.category_id,
            description: `Cost obligation: ${formData.description}`,
            amount: parseFloat(formData.total_amount),
            expected_incur_date: formData.due_date || new Date().toISOString().split('T')[0],
            confidence_level: 'high', // High confidence as it's a confirmed cost
            priority: 'normal',
            contract_reference: `COST-${Date.now()}`,
            vendor_supplier: ''
          };

          await axios.post(`${API}/api/obligations`, obligationData);
        }
      }

      alert('✅ Cost entry created successfully! Outstanding costs automatically added to obligations.');
      onBack();
    } catch (error) {
      console.error('Error creating cost entry:', error);
      alert('❌ Error creating cost entry. Please try again.');
    }
  };

  if (loading) return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{t('addCosts')}</h2>
              <p className="text-gray-600">Add new cost entry for {project.name}</p>
            </div>
            <button
              onClick={onBack}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              ← {t('backToDashboard')}
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Cost Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('costCategory')}</label>
                <select
                  value={formData.category_id}
                  onChange={(e) => setFormData({...formData, category_id: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Select category...</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phase</label>
                <select
                  value={formData.phase_id}
                  onChange={(e) => setFormData({...formData, phase_id: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">No specific phase</option>
                  {phases.map(phase => (
                    <option key={phase.id} value={phase.id}>{phase.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('description')}</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Cost description..."
                required
              />
            </div>

            {/* Cost Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Cost Type</label>
              <div className="flex space-x-4">
                {['hourly', 'material', 'fixed'].map(type => (
                  <label key={type} className="flex items-center">
                    <input
                      type="radio"
                      value={type}
                      checked={formData.cost_type === type}
                      onChange={(e) => setFormData({...formData, cost_type: e.target.value})}
                      className="mr-2"
                    />
                    <span className="capitalize">{type}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Dynamic Cost Fields */}
            {formData.cost_type === 'hourly' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('hours')}</label>
                  <input
                    type="number"
                    step="0.25"
                    value={formData.hours}
                    onChange={(e) => setFormData({...formData, hours: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('hourlyRate')}</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.hourly_rate}
                    onChange={(e) => setFormData({...formData, hourly_rate: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('totalAmount')}</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.total_amount}
                    readOnly
                    className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50"
                    placeholder="0.00"
                  />
                </div>
              </div>
            )}

            {formData.cost_type === 'material' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('quantity')}</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.quantity}
                    onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('unitPrice')}</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.unit_price}
                    onChange={(e) => setFormData({...formData, unit_price: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('totalAmount')}</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.total_amount}
                    readOnly
                    className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50"
                    placeholder="0.00"
                  />
                </div>
              </div>
            )}

            {formData.cost_type === 'fixed' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('totalAmount')}</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.total_amount}
                  onChange={(e) => setFormData({...formData, total_amount: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.00"
                  required
                />
              </div>
            )}

            {/* Payment Splitting Option */}
            <div className="border-t pt-6">
              <div className="flex items-center justify-between mb-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={showPaymentSplit}
                    onChange={(e) => setShowPaymentSplit(e.target.checked)}
                    className="mr-2"
                  />
                  <span className="font-medium text-gray-700">Split Payment Schedule</span>
                </label>
                <span className="text-sm text-gray-500">Split costs into multiple payments with different dates</span>
              </div>

              {showPaymentSplit && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-blue-900">Payment Schedule</h4>
                    <button
                      type="button"
                      onClick={addPaymentSplit}
                      className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                    >
                      + Add Payment
                    </button>
                  </div>

                  <div className="space-y-3">
                    {paymentSplits.map((split, index) => (
                      <div key={index} className="grid grid-cols-12 gap-2 items-center bg-white p-3 rounded border">
                        <div className="col-span-3">
                          <input
                            type="text"
                            value={split.description}
                            onChange={(e) => updatePaymentSplit(index, 'description', e.target.value)}
                            className="w-full p-2 border rounded text-sm"
                            placeholder="Payment description"
                          />
                        </div>
                        <div className="col-span-2">
                          <input
                            type="number"
                            step="0.1"
                            value={split.percentage}
                            onChange={(e) => updatePaymentSplit(index, 'percentage', parseFloat(e.target.value) || 0)}
                            className="w-full p-2 border rounded text-sm"
                            placeholder="%"
                          />
                        </div>
                        <div className="col-span-2">
                          <input
                            type="text"
                            value={`€${split.amount.toFixed(2)}`}
                            readOnly
                            className="w-full p-2 border rounded text-sm bg-gray-50"
                          />
                        </div>
                        <div className="col-span-2">
                          <input
                            type="date"
                            value={split.payment_date}
                            onChange={(e) => updatePaymentSplit(index, 'payment_date', e.target.value)}
                            className="w-full p-2 border rounded text-sm"
                          />
                        </div>
                        <div className="col-span-2">
                          <select
                            value={split.status}
                            onChange={(e) => updatePaymentSplit(index, 'status', e.target.value)}
                            className="w-full p-2 border rounded text-sm"
                          >
                            <option value="outstanding">Outstanding</option>
                            <option value="paid">Paid</option>
                          </select>
                        </div>
                        <div className="col-span-1">
                          {paymentSplits.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removePaymentSplit(index)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 p-2 bg-gray-100 rounded">
                    <div className="flex justify-between text-sm">
                      <span>Total Percentage:</span>
                      <span className={`font-bold ${Math.abs(getTotalPercentage() - 100) < 0.01 ? 'text-green-600' : 'text-red-600'}`}>
                        {getTotalPercentage().toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Standard Payment Fields (when not using splits) */}
            {!showPaymentSplit && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Entry Date</label>
                  <input
                    type="date"
                    value={formData.entry_date}
                    onChange={(e) => setFormData({...formData, entry_date: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Payment Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="outstanding">Outstanding</option>
                    <option value="paid">Paid</option>
                  </select>
                </div>

                {formData.status === 'outstanding' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Due Date</label>
                    <input
                      type="date"
                      value={formData.due_date}
                      onChange={(e) => setFormData({...formData, due_date: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Submit Buttons */}
            <div className="flex justify-end space-x-4 pt-6 border-t">
              <button
                type="button"
                onClick={onBack}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {t('cancel')}
              </button>
              <button
                type="submit"
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
              >
                {t('save')} Cost Entry
              </button>
            </div>
          </form>

          {/* Information Box */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start space-x-2">
              <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-1">Automatic Obligation Management</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Outstanding costs are automatically added to "Manage Obligations" with high confidence level</li>
                  <li>Payment splits create separate cost entries and obligations for each outstanding payment</li>
                  <li>Obligations help track committed costs for better EVM forecasting</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


// Phase Management Component (unchanged)
const PhaseManagement = ({ project, onBack }) => {
  const { t } = useLanguage();
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
                ← {t('backToDashboard')}
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
      case 'obligations':
        return <ObligationManager project={currentProject} onBack={() => setCurrentView('dashboard')} />;
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