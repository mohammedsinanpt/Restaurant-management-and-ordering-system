import React, { useState, useEffect, useRef } from 'react';
import { Plus, Edit2, Trash, Image as ImageIcon, X, Save, Search, CheckCircle, AlertCircle, Loader2, Upload } from 'lucide-react';
import { fetchMenu, fetchCategories, createMenuItem, updateMenuItem, deleteMenuItem, uploadMenuImage } from '../api';

const emptyForm = {
  name: '',
  category: '',
  price: '',
  image_url: '',
  description: '',
  is_available: true,
  is_veg: true,
};

const extractErrorMessage = (err) => {
  const data = err?.response?.data;
  if (!data) return 'Something went wrong. Please try again.';
  if (typeof data === 'string') return data;
  const firstKey = Object.keys(data)[0];
  const val = data[firstKey];
  if (Array.isArray(val)) return `${firstKey}: ${val.join(' ')}`;
  if (typeof val === 'string') return val;
  return 'Something went wrong. Please try again.';
};

const MenuManagement = () => {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [imageUploading, setImageUploading] = useState(false);
  const fileInputRef = useRef(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentDish, setCurrentDish] = useState(null);
  const [search, setSearch] = useState("");

  const [formData, setFormData] = useState(emptyForm);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [menuRes, catRes] = await Promise.all([fetchMenu(), fetchCategories()]);
      setItems(menuRes.data);
      setCategories(catRes.data);
    } catch (e) {
      console.error('Failed to load menu management data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const selectedCategoryName = (categoryId) =>
    categories.find(c => c.id === Number(categoryId))?.name || '';

  const handleOpenAdd = () => {
    setIsEditing(false);
    setFormError('');
    setFormData({ ...emptyForm, category: categories[0]?.id || '' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setIsEditing(true);
    setFormError('');
    setCurrentDish(item);
    setFormData({
      name: item.name,
      category: item.category,
      price: item.price,
      image_url: item.image_url,
      description: item.description || '',
      is_available: item.is_available,
      is_veg: item.is_veg !== undefined ? item.is_veg : true,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this dish?")) return;
    const previous = items;
    setItems(prev => prev.filter(item => item.id !== id));
    try {
      await deleteMenuItem(id);
    } catch (e) {
      console.error('Failed to delete dish:', e);
      setItems(previous);
      alert('Could not delete this dish. Please try again.');
    }
  };

  const toggleAvailability = async (item) => {
    const previous = items;
    const nextValue = !item.is_available;
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, is_available: nextValue } : i));
    try {
      await updateMenuItem(item.id, { is_available: nextValue });
    } catch (e) {
      console.error('Failed to update availability:', e);
      setItems(previous);
    }
  };

  const handleImageFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFormError('');
    setImageUploading(true);
    try {
      const { data } = await uploadMenuImage(file);
      setFormData(prev => ({ ...prev, image_url: data.url }));
    } catch (err) {
      console.error('Image upload failed:', err);
      setFormError(extractErrorMessage(err));
    } finally {
      setImageUploading(false);
      e.target.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.category) {
      setFormError('Please select a category.');
      return;
    }

    const payload = {
      name: formData.name,
      category: Number(formData.category),
      price: formData.price,
      image_url: formData.image_url,
      description: formData.description,
      is_available: formData.is_available,
      is_veg: formData.is_veg,
    };

    setSaving(true);
    try {
      if (isEditing) {
        const { data } = await updateMenuItem(currentDish.id, payload);
        setItems(prev => prev.map(item => item.id === currentDish.id ? data : item));
      } else {
        const { data } = await createMenuItem(payload);
        setItems(prev => [data, ...prev]);
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error('Failed to save dish:', err);
      setFormError(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(search.toLowerCase()) ||
    (item.category_name || '').toLowerCase().includes(search.toLowerCase())
  );

  const showDietarySection = !['Drinks', 'Desserts'].includes(selectedCategoryName(formData.category));

  if (loading) {
    return <div className="text-center py-20 text-zinc-500">Loading menu...</div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
            <h2 className="text-3xl font-black text-white tracking-tight">Menu Management</h2>
            <p className="text-zinc-400">Manage your dishes, prices, and categories.</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                    type="text"
                    placeholder="Search dishes..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:border-orange-500 outline-none"
                />
            </div>
            <button
                onClick={handleOpenAdd}
                disabled={categories.length === 0}
                title={categories.length === 0 ? 'Create a category first (via /admin Django admin)' : ''}
                className="bg-white text-black px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-zinc-200 transition-all shadow-lg hover:shadow-white/10 active:scale-95 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <Plus className="w-5 h-5" /> Add Dish
            </button>
        </div>
      </div>

      {categories.length === 0 && (
        <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl flex items-center gap-3 text-yellow-500 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          No categories exist yet. Add at least one Category (via the Django admin at /admin) before creating dishes.
        </div>
      )}

      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
            <thead className="bg-zinc-950/50 text-zinc-500 uppercase text-xs tracking-wider font-bold">
                <tr>
                <th className="p-6">Dish Details</th>
                <th className="p-6">Category</th>
                <th className="p-6">Label</th>
                <th className="p-6">Price</th>
                <th className="p-6">Status</th>
                <th className="p-6 text-right">Actions</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800 text-zinc-300">
                {filteredItems.map(item => (
                <tr key={item.id} className="hover:bg-zinc-800/30 transition-colors group">
                    <td className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-zinc-800 rounded-xl overflow-hidden shrink-0 border border-zinc-700">
                                {item.image_url ? (
                                    <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-zinc-600"><ImageIcon className="w-5 h-5" /></div>
                                )}
                            </div>
                            <div>
                                <span className="font-bold text-white text-lg block">{item.name}</span>
                                <span className="text-zinc-500 text-xs line-clamp-1 max-w-[200px]">{item.description}</span>
                            </div>
                        </div>
                    </td>
                    <td className="p-6">
                        <span className="bg-zinc-800 px-3 py-1 rounded-lg text-xs font-medium border border-zinc-700">{item.category_name}</span>
                    </td>
                    <td className="p-6">
                        {/* Smart Label Logic for Admin View */}
                        {item.category_name === 'Drinks' ? (
                            <span className="px-2 py-1 rounded text-[10px] font-bold border bg-blue-500/10 text-blue-400 border-blue-500/20">DRINK</span>
                        ) : item.category_name === 'Desserts' ? (
                            <span className="px-2 py-1 rounded text-[10px] font-bold border bg-pink-500/10 text-pink-400 border-pink-500/20">DESSERT</span>
                        ) : (
                            <span className={`px-2 py-1 rounded text-[10px] font-bold border ${
                                item.is_veg
                                ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                            }`}>
                                {item.is_veg ? 'VEG' : 'NON-VEG'}
                            </span>
                        )}
                    </td>
                    <td className="p-6 font-mono text-orange-500 font-bold">₹{item.price}</td>
                    <td className="p-6">
                    <button
                        onClick={() => toggleAvailability(item)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                            item.is_available
                            ? 'bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500/20'
                            : 'bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20'
                        }`}
                    >
                        {item.is_available ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                        {item.is_available ? 'Available' : 'Sold Out'}
                    </button>
                    </td>
                    <td className="p-6 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleOpenEdit(item)} className="p-2 bg-zinc-800 hover:bg-white hover:text-black rounded-lg text-zinc-400 transition-all" title="Edit">
                                <Edit2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDelete(item.id)} className="p-2 bg-zinc-800 hover:bg-red-500 hover:text-white rounded-lg text-zinc-400 transition-all" title="Delete">
                                <Trash className="w-4 h-4" />
                            </button>
                        </div>
                    </td>
                </tr>
                ))}
            </tbody>
            </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-zinc-900 border border-zinc-800 w-full max-w-lg rounded-3xl p-8 shadow-2xl scale-100 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto custom-scrollbar">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-bold text-white">{isEditing ? 'Edit Dish' : 'Add New Dish'}</h3>
                    <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-zinc-800 rounded-full transition-colors"><X className="w-6 h-6 text-zinc-400" /></button>
                </div>

                {formError && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-500 text-sm">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        {formError}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Dish Name</label>
                        <input
                            required
                            type="text"
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-white focus:border-orange-500 outline-none transition-all"
                            placeholder="e.g. Butter Chicken"
                            value={formData.name}
                            onChange={e => setFormData({...formData, name: e.target.value})}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Description</label>
                        <textarea
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-white focus:border-orange-500 outline-none transition-all resize-none h-24"
                            placeholder="Describe the dish ingredients and taste..."
                            value={formData.description}
                            onChange={e => setFormData({...formData, description: e.target.value})}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Category</label>
                            <select
                                required
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-white focus:border-orange-500 outline-none"
                                value={formData.category}
                                onChange={e => setFormData({...formData, category: e.target.value})}
                            >
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Price (₹)</label>
                            <input
                                required
                                type="number"
                                step="0.01"
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-white focus:border-orange-500 outline-none"
                                placeholder="350"
                                value={formData.price}
                                onChange={e => setFormData({...formData, price: e.target.value})}
                            />
                        </div>
                    </div>

                    {/* DYNAMIC DIETARY SECTION: Only shows if NOT Drinks/Desserts */}
                    {showDietarySection && (
                        <div className="space-y-2 animate-in fade-in duration-300">
                            <label className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Dietary Type</label>
                            <div className="grid grid-cols-2 gap-4">
                                <div
                                    onClick={() => setFormData({...formData, is_veg: true})}
                                    className={`cursor-pointer rounded-xl p-3 border text-center transition-all ${
                                        formData.is_veg
                                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                                        : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-700'
                                    }`}
                                >
                                    <span className="font-bold">Vegetarian</span>
                                </div>
                                <div
                                    onClick={() => setFormData({...formData, is_veg: false})}
                                    className={`cursor-pointer rounded-xl p-3 border text-center transition-all ${
                                        !formData.is_veg
                                        ? 'bg-rose-500/20 border-rose-500 text-rose-400'
                                        : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-700'
                                    }`}
                                >
                                    <span className="font-bold">Non-Veg</span>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Dish Image</label>
                        <div className="flex items-center gap-4">
                            <div className="w-20 h-20 rounded-xl bg-zinc-950 border border-zinc-800 overflow-hidden shrink-0 flex items-center justify-center">
                                {imageUploading ? (
                                    <Loader2 className="w-6 h-6 text-orange-500 animate-spin" />
                                ) : formData.image_url ? (
                                    <img src={formData.image_url} alt="Preview" className="w-full h-full object-cover" />
                                ) : (
                                    <ImageIcon className="w-6 h-6 text-zinc-600" />
                                )}
                            </div>
                            <div className="flex-1 space-y-2">
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleImageFileChange}
                                />
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={imageUploading}
                                    className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    {imageUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                                    {imageUploading ? 'Uploading...' : 'Upload Image'}
                                </button>
                            </div>
                        </div>
                        <input
                            type="url"
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm text-zinc-400 focus:border-orange-500 outline-none"
                            placeholder="or paste an image URL directly"
                            value={formData.image_url}
                            onChange={e => setFormData({...formData, image_url: e.target.value})}
                        />
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                        <input
                            type="checkbox"
                            id="is_available"
                            className="w-5 h-5 rounded border-zinc-700 bg-zinc-950 text-orange-500 focus:ring-orange-500"
                            checked={formData.is_available}
                            onChange={e => setFormData({...formData, is_available: e.target.checked})}
                        />
                        <label htmlFor="is_available" className="text-white font-medium select-none">Available for ordering</label>
                    </div>

                    <button
                        disabled={saving}
                        className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-4 rounded-xl flex justify-center items-center gap-2 transition-all mt-4 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        {isEditing ? 'Save Changes' : 'Create Dish'}
                    </button>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};

export default MenuManagement;
