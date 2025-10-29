import { useState, useEffect } from "react";
import Header from "../components/layout/Header";
import { BarChart3, Users, DollarSign, TrendingUp, Loader } from "lucide-react";

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading
    setTimeout(() => setLoading(false), 1000);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">Admin Dashboard</h1>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Users</p>
                <p className="text-3xl font-bold mt-2">1,234</p>
              </div>
              <Users className="w-12 h-12 text-blue-600" />
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Revenue</p>
                <p className="text-3xl font-bold mt-2">$45,678</p>
              </div>
              <DollarSign className="w-12 h-12 text-green-600" />
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Active Plans</p>
                <p className="text-3xl font-bold mt-2">856</p>
              </div>
              <BarChart3 className="w-12 h-12 text-purple-600" />
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Growth</p>
                <p className="text-3xl font-bold mt-2">+23%</p>
              </div>
              <TrendingUp className="w-12 h-12 text-orange-600" />
            </div>
          </div>
        </div>

        {/* Admin Features Coming Soon */}
        <div className="card">
          <h2 className="text-2xl font-bold mb-4">Admin Features</h2>
          <p className="text-gray-600">
            Full admin dashboard with analytics, user management, and revenue
            tracking coming soon!
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
