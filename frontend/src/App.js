import React, { useState, useEffect } from "react";
import "./App.css";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Components
const Dashboard = ({ project, onNavigate }) => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;

  if (!dashboardData) return <div>No data available</div>;

  const { summary, monthly_trend, recent_entries } = dashboardData;
  const statusColors = {
    on_track: 'bg-green-100 text-green-800 border-green-200',
    warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    over_budget: 'bg-red-100 text-red-800 border-red-200'
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
                onClick={() => onNavigate('costs')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add Costs
              </button>
              <button
                onClick={() => onNavigate('phases')}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
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
                <p className="text-2xl font-semibold text-gray-900">${summary.project.total_budget.toLocaleString()}</p>
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
                <p className="text-2xl font-semibold text-gray-900">${summary.total_spent.toLocaleString()}</p>
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
                <p className="text-2xl font-semibold text-gray-900">${summary.budget_remaining.toLocaleString()}</p>
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

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Budget vs Actual Chart */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Budget vs Actual</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Total Budget</span>
                  <span>${summary.project.total_budget.toLocaleString()}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-blue-600 h-3 rounded-full"
                    style={{ width: '100%' }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Amount Spent</span>
                  <span>${summary.total_spent.toLocaleString()}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className={`h-3 rounded-full ${summary.budget_utilization > 100 ? 'bg-red-500' : summary.budget_utilization > 75 ? 'bg-yellow-500' : 'bg-green-500'}`}
                    style={{ width: `${Math.min(summary.budget_utilization, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Cost Breakdown */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Cost Breakdown</h3>
            <div className="space-y-3">
              {Object.entries(summary.cost_breakdown).map(([category, amount]) => (
                <div key={category} className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">{category}</span>
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-900">${amount.toLocaleString()}</span>
                    <div className="w-20 bg-gray-200 rounded-full h-2 ml-3">
                      <div 
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${(amount / summary.total_spent) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Phases Status */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Phases Progress</h3>
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
                    <p className="font-medium">${phase.budget_allocated.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Spent</p>
                    <p className="font-medium">${phase.amount_spent.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Remaining</p>
                    <p className="font-medium">${phase.budget_remaining.toLocaleString()}</p>
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
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Cost Entries</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recent_entries.slice(0, 5).map((entry) => (
                  <tr key={entry.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(entry.entry_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {entry.category_name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {entry.description || 'No description'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      ${entry.total_amount.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

const ProjectSetup = ({ onProjectCreated }) => {
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
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New Project</h2>
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
          
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Create Project
          </button>
        </form>
      </div>
    </div>
  );
};

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
      await axios.put(`${API}/phases/${phaseId}/status?status=${status}`);
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
  const [currentView, setCurrentView] = useState('setup'); // setup, dashboard, costs, phases

  useEffect(() => {
    // Try to load existing projects
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const response = await axios.get(`${API}/projects`);
      if (response.data.length > 0) {
        setCurrentProject(response.data[0]); // Use the first project for now
        setCurrentView('dashboard');
      }
    } catch (error) {
      console.error('Error loading projects:', error);
    }
  };

  const handleProjectCreated = (project) => {
    setCurrentProject(project);
    setCurrentView('dashboard');
  };

  const handleNavigation = (view) => {
    setCurrentView(view);
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'setup':
        return <ProjectSetup onProjectCreated={handleProjectCreated} />;
      case 'dashboard':
        return <Dashboard project={currentProject} onNavigate={handleNavigation} />;
      case 'costs':
        return <CostEntry project={currentProject} onBack={() => setCurrentView('dashboard')} />;
      case 'phases':
        return <PhaseManagement project={currentProject} onBack={() => setCurrentView('dashboard')} />;
      default:
        return <ProjectSetup onProjectCreated={handleProjectCreated} />;
    }
  };

  return (
    <div className="App">
      {renderCurrentView()}
    </div>
  );
}

export default App;