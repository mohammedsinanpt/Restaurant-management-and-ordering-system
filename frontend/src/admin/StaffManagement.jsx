import React, { useState, useEffect } from 'react';
import { UserPlus, X, Save, AlertCircle, Loader2, Eye, EyeOff, ShieldCheck, ShieldOff, Ban, CheckCircle } from 'lucide-react';
import { fetchStaff, createStaff, promoteStaff, updateStaff } from '../api';
import { useUser } from '../context/UserContext';

const emptyForm = { name: '', email: '', password: '' };

const extractErrorMessage = (err) => {
  const data = err?.response?.data;
  if (!data) return 'Something went wrong. Please try again.';
  if (typeof data === 'string') return data;
  if (Array.isArray(data.error)) return data.error.join(' ');
  if (typeof data.error === 'string') return data.error;
  return 'Something went wrong. Please try again.';
};

const formatDate = (value) => {
  if (!value) return 'Never';
  return new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

const StaffManagement = () => {
  const { currentUser } = useUser();
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [canPromote, setCanPromote] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState(emptyForm);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await fetchStaff();
      setStaff(data);
    } catch (e) {
      console.error('Failed to load staff:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleOpenAdd = () => {
    setFormData(emptyForm);
    setFormError('');
    setCanPromote(false);
    setShowPassword(false);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setCanPromote(false);
    setSaving(true);
    try {
      const { data } = await createStaff(formData);
      setStaff(prev => [...prev, data]);
      setIsModalOpen(false);
    } catch (err) {
      console.error('Failed to create staff account:', err);
      setFormError(extractErrorMessage(err));
      // The email belongs to an existing customer - offer to upgrade it in place
      // instead of making them invent a second email for the same person.
      setCanPromote(Boolean(err?.response?.data?.can_promote));
    } finally {
      setSaving(false);
    }
  };

  const handlePromote = async () => {
    setSaving(true);
    setFormError('');
    try {
      const { data } = await promoteStaff(formData.email);
      setStaff(prev => [...prev, data]);
      setIsModalOpen(false);
    } catch (err) {
      console.error('Failed to promote account:', err);
      setFormError(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (member) => {
    const nextValue = !member.is_active;
    if (!nextValue && !window.confirm(`Disable ${member.email}? They will be signed out immediately.`)) return;

    const previous = staff;
    setStaff(prev => prev.map(m => m.id === member.id ? { ...m, is_active: nextValue } : m));
    try {
      await updateStaff(member.id, { is_active: nextValue });
    } catch (err) {
      console.error('Failed to update staff status:', err);
      setStaff(previous);
      alert(extractErrorMessage(err));
    }
  };

  const handleRevokeStaff = async (member) => {
    if (!window.confirm(
      `Remove staff access for ${member.email}?\n\nTheir customer account and past orders are kept - they just lose the admin panel.`
    )) return;

    const previous = staff;
    setStaff(prev => prev.filter(m => m.id !== member.id));
    try {
      await updateStaff(member.id, { is_staff: false });
    } catch (err) {
      console.error('Failed to revoke staff access:', err);
      setStaff(previous);
      alert(extractErrorMessage(err));
    }
  };

  if (loading) {
    return <div className="text-center py-20 text-zinc-500">Loading staff...</div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight">Staff Management</h2>
          <p className="text-zinc-400">Control who can sign in to the admin panel.</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="bg-white text-black px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-zinc-200 transition-all shadow-lg hover:shadow-white/10 active:scale-95 whitespace-nowrap"
        >
          <UserPlus className="w-5 h-5" /> Add Staff
        </button>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-zinc-950/50 text-zinc-500 uppercase text-xs tracking-wider font-bold">
              <tr>
                <th className="p-6">Member</th>
                <th className="p-6">Role</th>
                <th className="p-6">Status</th>
                <th className="p-6">Last Login</th>
                <th className="p-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800 text-zinc-300">
              {staff.map(member => {
                const isSelf = member.id === currentUser?.id;
                const locked = member.is_superuser || isSelf;
                return (
                  <tr key={member.id} className="hover:bg-zinc-800/30 transition-colors group">
                    <td className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-orange-500 shrink-0">
                          {(member.name || member.email).charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span className="font-bold text-white block">
                            {member.name || '—'}
                            {isSelf && <span className="text-zinc-500 font-normal text-xs ml-2">(you)</span>}
                          </span>
                          <span className="text-zinc-500 text-xs">{member.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-6">
                      <span className={`px-3 py-1 rounded-lg text-[10px] font-bold border ${
                        member.is_superuser
                          ? 'bg-orange-500/10 text-orange-500 border-orange-500/20'
                          : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                      }`}>
                        {member.is_superuser ? 'OWNER' : 'STAFF'}
                      </span>
                    </td>
                    <td className="p-6">
                      <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border ${
                        member.is_active
                          ? 'bg-green-500/10 text-green-500 border-green-500/20'
                          : 'bg-red-500/10 text-red-500 border-red-500/20'
                      }`}>
                        {member.is_active ? <CheckCircle className="w-3 h-3" /> : <Ban className="w-3 h-3" />}
                        {member.is_active ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td className="p-6 text-sm text-zinc-500">{formatDate(member.last_login)}</td>
                    <td className="p-6 text-right">
                      {locked ? (
                        <span className="text-xs text-zinc-600">Protected</span>
                      ) : (
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleToggleActive(member)}
                            title={member.is_active ? 'Disable account' : 'Enable account'}
                            className="p-2 bg-zinc-800 hover:bg-white hover:text-black rounded-lg text-zinc-400 transition-all"
                          >
                            {member.is_active ? <Ban className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => handleRevokeStaff(member)}
                            title="Remove staff access"
                            className="p-2 bg-zinc-800 hover:bg-red-500 hover:text-white rounded-lg text-zinc-400 transition-all"
                          >
                            <ShieldOff className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-start gap-3 text-sm text-zinc-500">
        <ShieldCheck className="w-5 h-5 shrink-0 text-zinc-600" />
        <p>
          Owner accounts and your own account are protected here — they can only be changed from the
          Django admin, so nobody can accidentally lock the restaurant out of its own panel.
        </p>
      </div>

      {/* Add Staff Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-lg rounded-3xl p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-white">Add Staff Member</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-zinc-800 rounded-full transition-colors">
                <X className="w-6 h-6 text-zinc-400" />
              </button>
            </div>

            {formError && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm space-y-3">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  {formError}
                </div>
                {canPromote && (
                  <button
                    type="button"
                    onClick={handlePromote}
                    disabled={saving}
                    className="w-full bg-red-500/20 hover:bg-red-500/30 text-red-400 font-bold py-2.5 rounded-lg text-xs transition-all disabled:opacity-60"
                  >
                    Grant staff access to that existing account instead
                  </button>
                )}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Full Name</label>
                <input
                  type="text"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-white focus:border-orange-500 outline-none transition-all"
                  placeholder="e.g. Priya Nair"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Email</label>
                <input
                  required
                  type="email"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-white focus:border-orange-500 outline-none transition-all"
                  placeholder="chef@spiceroute.com"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                />
                <p className="text-xs text-zinc-600">This is the email they will sign in with.</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Temporary Password</label>
                <div className="relative">
                  <input
                    required
                    type={showPassword ? 'text' : 'password'}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 pr-12 text-white focus:border-orange-500 outline-none transition-all"
                    placeholder="At least 8 characters"
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors focus:outline-none p-1"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <p className="text-xs text-zinc-600">
                  Share it with them directly — they can change it later via Forgot Password.
                </p>
              </div>

              <button
                disabled={saving}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-4 rounded-xl flex justify-center items-center gap-2 transition-all mt-4 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                Create Staff Account
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffManagement;
