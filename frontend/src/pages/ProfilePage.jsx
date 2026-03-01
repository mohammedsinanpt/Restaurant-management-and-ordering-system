import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Save, Edit2, MapPin, Mail, Phone, LogOut, LogIn } from 'lucide-react';
import { useUser } from '../context/UserContext'; // <--- IMPORT CONTEXT

const ProfilePage = () => {
  const navigate = useNavigate();
  const { currentUser, updateUser, logout } = useUser(); // <--- USE CONTEXT HOOK
  
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  });

  // Sync state with Context Data when page loads
  useEffect(() => {
    if (currentUser) {
      setFormData({
        name: currentUser.name || '',
        email: currentUser.email || '',
        phone: currentUser.phone || '',
        address: currentUser.address || ''
      });
    }
  }, [currentUser]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    // Call Context Update Function
    updateUser(formData);
    setIsEditing(false);
  };

  const handleLogout = () => {
    if(window.confirm("Are you sure you want to log out?")) {
        logout(); // Call Context Logout
        navigate('/');
    }
  };

  // 1. GUEST VIEW (If not logged in)
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white font-sans p-6 flex flex-col items-center justify-center">
        <div className="max-w-md w-full bg-zinc-900 border border-white/5 rounded-2xl shadow-xl overflow-hidden p-8 text-center space-y-6">
            <div className="mx-auto bg-zinc-800 p-4 rounded-full border border-zinc-700 w-20 h-20 flex items-center justify-center">
                <User size={40} className="text-zinc-500" />
            </div>
            
            <div>
                <h2 className="text-2xl font-bold text-white mb-2">Guest Access</h2>
                <p className="text-zinc-400">Please sign in to view and manage your profile details.</p>
            </div>

            <button 
                onClick={() => navigate('/auth')}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-orange-600 text-white font-bold hover:bg-orange-500 transition-all shadow-lg shadow-orange-900/20"
            >
                <LogIn size={20} />
                Login / Register
            </button>
            
            <button 
                onClick={() => navigate(-1)}
                className="text-zinc-500 hover:text-white text-sm transition-colors"
            >
                Go Back
            </button>
        </div>
      </div>
    );
  }

  // 2. LOGGED IN VIEW
  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans p-6 pb-24">
      
      {/* Header */}
      <div className="max-w-2xl mx-auto mb-8 flex items-center gap-4">
        <button 
          onClick={() => navigate('/menu')} 
          className="p-2 bg-zinc-900 rounded-full border border-zinc-800 hover:bg-zinc-800 hover:text-orange-500 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold tracking-tight">My Profile</h1>
      </div>

      {/* Main Card */}
      <div className="max-w-2xl mx-auto bg-zinc-900 border border-white/5 rounded-2xl shadow-xl overflow-hidden">
        <div className="p-8">
          
          {/* User Header Section */}
          <div className="flex justify-between items-start mb-8">
            <div className="flex items-center gap-4">
              <div className="bg-zinc-800 p-4 rounded-full border border-zinc-700 shadow-inner">
                <span className="text-2xl font-bold text-zinc-400">
                    {currentUser.name ? currentUser.name[0].toUpperCase() : 'U'}
                </span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{currentUser.name || 'User'}</h2>
                <p className="text-zinc-500 text-sm">Personal Details</p>
                <p className="text-zinc-600 text-xs font-mono mt-1">ID: {currentUser.uid}</p>
              </div>
            </div>
            
            <button
              onClick={() => isEditing ? handleSave() : setIsEditing(true)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                isEditing 
                  ? 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-lg shadow-emerald-900/20' 
                  : 'bg-orange-600 text-white hover:bg-orange-500 shadow-lg shadow-orange-900/20'
              }`}
            >
              {isEditing ? <><Save size={18}/> Save</> : <><Edit2 size={18}/> Edit</>}
            </button>
          </div>

          <div className="h-px bg-zinc-800 w-full mb-8" />

          {/* Form Fields */}
          <div className="space-y-6 mb-10">
            
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2 ml-1">Full Name</label>
              <div className="relative">
                <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" />
                <input
                  type="text"
                  name="name" // Matches context structure
                  disabled={!isEditing}
                  value={formData.name}
                  onChange={handleChange}
                  className={`w-full pl-12 pr-4 py-3 rounded-xl border outline-none transition-all ${
                    isEditing 
                      ? 'bg-zinc-950 border-orange-500/50 text-white focus:ring-2 focus:ring-orange-500/20' 
                      : 'bg-zinc-950/50 border-zinc-800 text-zinc-300'
                  }`}
                />
              </div>
            </div>

            {/* Email & Phone Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2 ml-1">Email</label>
                <div className="relative">
                  <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" />
                  <input
                    type="email"
                    name="email"
                    disabled={true} // Email should usually be read-only (identifier)
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full pl-12 pr-4 py-3 rounded-xl border bg-zinc-950/30 border-zinc-800 text-zinc-500 cursor-not-allowed"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2 ml-1">Phone Number</label>
                <div className="relative">
                  <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" />
                  <input
                    type="text"
                    name="phone"
                    disabled={!isEditing}
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Add phone number"
                    className={`w-full pl-12 pr-4 py-3 rounded-xl border outline-none transition-all ${
                      isEditing 
                        ? 'bg-zinc-950 border-orange-500/50 text-white focus:ring-2 focus:ring-orange-500/20' 
                        : 'bg-zinc-950/50 border-zinc-800 text-zinc-300'
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2 ml-1">Delivery Address</label>
              <div className="relative">
                <MapPin size={18} className="absolute left-4 top-4 text-zinc-600" />
                <textarea
                  name="address"
                  rows="3"
                  disabled={!isEditing}
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Add delivery address"
                  className={`w-full pl-12 pr-4 py-3 rounded-xl border outline-none transition-all resize-none ${
                    isEditing 
                      ? 'bg-zinc-950 border-orange-500/50 text-white focus:ring-2 focus:ring-orange-500/20' 
                      : 'bg-zinc-950/50 border-zinc-800 text-zinc-300'
                  }`}
                />
              </div>
            </div>

          </div>

          <div className="h-px bg-zinc-800 w-full mb-8" />

          {/* Logout Section */}
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-xl border border-red-900/30 bg-red-900/10 text-red-500 hover:bg-red-900/20 hover:text-red-400 transition-all font-bold"
          >
            <LogOut size={20} />
            Log Out
          </button>

        </div>
      </div>
    </div>
  );
};

export default ProfilePage;