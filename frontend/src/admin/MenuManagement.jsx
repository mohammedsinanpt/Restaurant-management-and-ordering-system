import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash, Image as ImageIcon, X, Save, Search, CheckCircle, AlertCircle } from 'lucide-react';
import { fetchMenu } from '../api'; 

const INITIAL_DATA = [
    { 
        id: 1, 
        name: "Butter Chicken Royale", 
        price: 380, 
        category: "Main Course", 
        available: true, 
        is_veg: false,
        image_url: "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=800&q=80",
        description: "Tender succulent chicken chunks cooked in a rich, creamy tomato gravy with premium saffron."
    },
    { 
        id: 2, 
        name: "Garlic Naan Basket", 
        price: 120, 
        category: "Starters", 
        available: true, 
        is_veg: true,
        image_url: "https://images.unsplash.com/photo-1626074353765-517a681e40be?auto=format&fit=crop&w=800&q=80",
        description: "Assortment of soft, fluffy flatbreads topped with minced garlic and artisanal butter."
    },
    { 
        id: 3, 
        name: "Paneer Tikka", 
        price: 320, 
        category: "Starters", 
        available: false, 
        is_veg: true,
        image_url: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=800&q=80",
        description: "Char-grilled paneer cubes simmered in a spicy, aromatic gravy with bell peppers."
    },
];

const MenuManagement = () => {
  const [items, setItems] = useState(() => {
    const savedItems = localStorage.getItem('menuItems');
    return savedItems ? JSON.parse(savedItems) : INITIAL_DATA;
  });
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentDish, setCurrentDish] = useState(null);
  const [search, setSearch] = useState("");

  const [formData, setFormData] = useState({
    name: '',
    category: 'Main Course',
    price: '',
    image_url: '',
    description: '', 
    available: true,
    is_veg: true 
  });

  useEffect(() => {
    const loadData = async () => {
      if (!localStorage.getItem('menuItems')) {
        try {
            const { data } = await fetchMenu();
            if (data && data.length > 0) {
                setItems(data);
                localStorage.setItem('menuItems', JSON.stringify(data));
            }
        } catch (e) {
            console.warn("Backend unavailable, using mock data");
        }
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    localStorage.setItem('menuItems', JSON.stringify(items));
  }, [items]);

  const handleOpenAdd = () => {
    setIsEditing(false);
    setFormData({ 
        name: '', category: 'Main Course', price: '', image_url: '', 
        description: '', available: true, is_veg: true 
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setIsEditing(true);
    setCurrentDish(item);
    setFormData({ 
        ...item, 
        description: item.description || '',
        is_veg: item.is_veg !== undefined ? item.is_veg : true 
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this dish?")) {
      setItems(prevItems => prevItems.filter(item => item.id !== id));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (isEditing) {
      setItems(prevItems => prevItems.map(item => 
        item.id === currentDish.id ? { ...formData, id: item.id } : item
      ));
    } else {
      const newItem = { ...formData, id: Date.now() }; 
      setItems(prevItems => [newItem, ...prevItems]);
    }
    
    setIsModalOpen(false);
  };

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(search.toLowerCase()) || 
    item.category.toLowerCase().includes(search.toLowerCase())
  );

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
                className="bg-white text-black px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-zinc-200 transition-all shadow-lg hover:shadow-white/10 active:scale-95 whitespace-nowrap"
            >
                <Plus className="w-5 h-5" /> Add Dish
            </button>
        </div>
      </div>

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
                        <span className="bg-zinc-800 px-3 py-1 rounded-lg text-xs font-medium border border-zinc-700">{item.category}</span>
                    </td>
                    <td className="p-6">
                        {/* Smart Label Logic for Admin View */}
                        {item.category === 'Drinks' ? (
                            <span className="px-2 py-1 rounded text-[10px] font-bold border bg-blue-500/10 text-blue-400 border-blue-500/20">DRINK</span>
                        ) : item.category === 'Desserts' ? (
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
                        onClick={() => setItems(items.map(i => i.id === item.id ? {...i, available: !i.available} : i))}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                            item.available 
                            ? 'bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500/20' 
                            : 'bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20'
                        }`}
                    >
                        {item.available ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                        {item.available ? 'Available' : 'Sold Out'}
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
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-white focus:border-orange-500 outline-none"
                                value={formData.category}
                                onChange={e => setFormData({...formData, category: e.target.value})}
                            >
                                <option>Main Course</option>
                                <option>Starters</option>
                                <option>Drinks</option>
                                <option>Desserts</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Price (₹)</label>
                            <input 
                                required
                                type="number" 
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-white focus:border-orange-500 outline-none"
                                placeholder="350"
                                value={formData.price}
                                onChange={e => setFormData({...formData, price: e.target.value})}
                            />
                        </div>
                    </div>

                    {/* DYNAMIC DIETARY SECTION: Only shows if NOT Drinks/Desserts */}
                    {formData.category !== 'Drinks' && formData.category !== 'Desserts' && (
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
                        <label className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Image URL</label>
                        <input 
                            type="url" 
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-white focus:border-orange-500 outline-none"
                            placeholder="https://..."
                            value={formData.image_url}
                            onChange={e => setFormData({...formData, image_url: e.target.value})}
                        />
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                        <input 
                            type="checkbox" 
                            id="available"
                            className="w-5 h-5 rounded border-zinc-700 bg-zinc-950 text-orange-500 focus:ring-orange-500"
                            checked={formData.available}
                            onChange={e => setFormData({...formData, available: e.target.checked})}
                        />
                        <label htmlFor="available" className="text-white font-medium select-none">Available for ordering</label>
                    </div>

                    <button className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-4 rounded-xl flex justify-center items-center gap-2 transition-all mt-4">
                        <Save className="w-5 h-5" />
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