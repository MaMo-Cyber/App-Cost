import React, { useState, useEffect } from "react";
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

// Project List Component (Fixed deletion)
const ProjectList = ({ onProjectSelected, onCreateNew }) => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border p-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Project Cost Tracker</h1>
              <p className="text-gray-600 mt-2">Select a project to manage or create a new one</p>
            </div>
            <button
              onClick={onCreateNew}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              + New Project
            </button>
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

// Cost Breakdown Modal Component
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

  useEffect(() => {
    if (project) {
      fetchDashboardData();
    }
  }, [project]);

  const fetchDashboardData = async () => {
    try {
      const response = await axios.get(`${API}/projects/${project.id}/dashboard-data`);
      setDashboardData(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
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
    labels: ['Budget Allocated', 'Amount Spent', 'Remaining'],
    datasets: [
      {
        label: 'Budget Analysis',
        data: [
          summary.project.total_budget,
          summary.total_spent,
          summary.budget_remaining
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
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
              <p className="text-gray-600 mt-1">{project.description}</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={onSwitchProject}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                ← All Projects
              </button>
              <button
                onClick={() => onNavigate('categories')}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Manage Categories
              </button>
              <button
                onClick={() => onNavigate('costs')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add Costs
              </button>
              <button
                onClick={() => onNavigate('phases')}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Manage Phases
              </button>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Budget</p>
                <p className="text-2xl font-semibold text-gray-900">€{summary.project.total_budget.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"></path>
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Spent</p>
                <p className="text-2xl font-semibold text-gray-900">€{summary.total_spent.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"></path>
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Remaining</p>
                <p className="text-2xl font-semibold text-gray-900">€{summary.budget_remaining.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className={`p-3 rounded-lg border ${statusColors[summary.status_indicator]}`}>
                <span className="text-sm font-semibold">
                  {summary.status_indicator === 'on_track' && 'On Track'}
                  {summary.status_indicator === 'warning' && 'Warning'}
                  {summary.status_indicator === 'over_budget' && 'Over Budget'}
                </span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Budget Used</p>
                <p className="text-2xl font-semibold text-gray-900">{summary.budget_utilization.toFixed(1)}%</p>
              </div>
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

// Project Setup Component (unchanged)
const ProjectSetup = ({ onProjectCreated, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    total_budget: '',
    start_date: '',
    end_date: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API}/projects`, {
        ...formData,
        total_budget: parseFloat(formData.total_budget)
      });
      
      // Initialize default categories
      await axios.post(`${API}/initialize-default-categories`);
      
      onProjectCreated(response.data);
    } catch (error) {
      console.error('Error creating project:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-lg shadow-sm border p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Create New Project</h2>
          {onCancel && (
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          )}
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Project Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter project name"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Brief project description"
              rows="3"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Total Budget</label>
            <input
              type="number"
              required
              step="0.01"
              value={formData.total_budget}
              onChange={(e) => setFormData({...formData, total_budget: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0.00"
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
          
          <div className="flex space-x-3">
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Create Project
            </button>
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
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
      await axios.post(`${API}/cost-entries`, {
        project_id: project.id,
        ...formData,
        hours: formData.hours ? parseFloat(formData.hours) : null,
        hourly_rate: formData.hourly_rate ? parseFloat(formData.hourly_rate) : null,
        quantity: formData.quantity ? parseFloat(formData.quantity) : null,
        unit_price: formData.unit_price ? parseFloat(formData.unit_price) : null,
        total_amount: formData.total_amount ? parseFloat(formData.total_amount) : calculateTotal()
      });
      
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
        entry_date: new Date().toISOString().split('T')[0]
      });
      
      alert('Cost entry added successfully!');
    } catch (error) {
      console.error('Error adding cost entry:', error);
      alert('Error adding cost entry');
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
                  {calculateTotal() > 0 && `Calculated: $${calculateTotal().toFixed(2)}`}
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
                    <p className="font-medium text-lg">${phase.budget_allocation.toLocaleString()}</p>
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
  const [currentView, setCurrentView] = useState('projectList'); // projectList, setup, dashboard, costs, phases, categories

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
    <div className="App">
      {renderCurrentView()}
    </div>
  );
}

export default App;