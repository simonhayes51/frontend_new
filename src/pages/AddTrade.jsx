// Updated AddTrade component with settings integration
import React, { useState, useEffect } from "react";
import { useDashboard } from "../context/DashboardContext";
import { useSettings } from "../context/SettingsContext";

const AddTrade = () => {
  const { addTrade } = useDashboard();
  const { default_platform, custom_tags, isLoading: settingsLoading } = useSettings();
  
  const [form, setForm] = useState({
    player: "",
    version: "",
    buy: "",
    sell: "",
    quantity: 1,
    platform: "Console",
    tag: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  // Update form when settings load
  useEffect(() => {
    if (!settingsLoading && default_platform) {
      setForm(prev => ({ ...prev, platform: default_platform }));
    }
  }, [default_platform, settingsLoading]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const result = await addTrade(form);
      
      if (result.success) {
        setMessage("Trade logged successfully!");
        setForm({
          player: "",
          version: "",
          buy: "",
          sell: "",
          quantity: 1,
          platform: default_platform || "Console",
          tag: "",
        });
      } else {
        setMessage("Failed to log trade: " + result.message);
      }
    } catch (err) {
      console.error(err);
      setMessage("Failed to log trade.");
    } finally {
      setLoading(false);
    }
  };

  // Get all available tags (custom + common ones)
  const getAllTags = () => {
    const commonTags = ["Snipe", "Investment", "Flip", "Pack Pull", "SBC", "Risky"];
    return [...custom_tags, ...commonTags].filter((tag, index, self) => 
      self.indexOf(tag) === index
    );
  };

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Add Trade</h1>
      
      {message && (
        <div className={`mb-4 p-3 rounded ${
          message.includes('success') ? 'bg-green-800' : 'bg-red-800'
        }`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block mb-2 font-medium">Player Name</label>
            <input 
              name="player" 
              placeholder="e.g. Cristiano Ronaldo" 
              value={form.player} 
              onChange={handleChange} 
              className="w-full p-3 bg-gray-800 rounded-lg" 
              required 
            />
          </div>

          <div>
            <label className="block mb-2 font-medium">Version</label>
            <input 
              name="version" 
              placeholder="e.g. Gold Rare, TOTW" 
              value={form.version} 
              onChange={handleChange} 
              className="w-full p-3 bg-gray-800 rounded-lg" 
              required 
            />
          </div>

          <div>
            <label className="block mb-2 font-medium">Buy Price</label>
            <input 
              name="buy" 
              type="number" 
              placeholder="Purchase price" 
              value={form.buy} 
              onChange={handleChange} 
              className="w-full p-3 bg-gray-800 rounded-lg" 
              required 
            />
          </div>

          <div>
            <label className="block mb-2 font-medium">Sell Price</label>
            <input 
              name="sell" 
              type="number" 
              placeholder="Sale price" 
              value={form.sell} 
              onChange={handleChange} 
              className="w-full p-3 bg-gray-800 rounded-lg" 
              required 
            />
          </div>

          <div>
            <label className="block mb-2 font-medium">Quantity</label>
            <input 
              name="quantity" 
              type="number" 
              placeholder="Number of cards" 
              value={form.quantity} 
              onChange={handleChange} 
              className="w-full p-3 bg-gray-800 rounded-lg" 
              required 
              min="1"
            />
          </div>

          <div>
            <label className="block mb-2 font-medium">Platform</label>
            <select 
              name="platform" 
              value={form.platform} 
              onChange={handleChange} 
              className="w-full p-3 bg-gray-800 rounded-lg"
            >
              <option value="Console">Console</option>
              <option value="PC">PC</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block mb-2 font-medium">Tag</label>
          <div className="flex gap-2">
            <input 
              name="tag" 
              placeholder="Custom tag or select from dropdown" 
              value={form.tag} 
              onChange={handleChange} 
              className="flex-1 p-3 bg-gray-800 rounded-lg" 
            />
            <select 
              onChange={(e) => setForm({...form, tag: e.target.value})} 
              className="p-3 bg-gray-800 rounded-lg"
              value=""
            >
              <option value="">Quick Tags</option>
              {getAllTags().map(tag => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Trade Preview */}
        {form.buy && form.sell && form.quantity && (
          <div className="bg-gray-800 p-4 rounded-lg">
            <h3 className="font-medium mb-2">Trade Preview</h3>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Gross Profit:</span>
                <p className="font-mono">
                  {((form.sell - form.buy) * form.quantity).toLocaleString()} coins
                </p>
              </div>
              <div>
                <span className="text-gray-400">EA Tax (5%):</span>
                <p className="font-mono text-red-400">
                  -{Math.floor(form.sell * form.quantity * 0.05).toLocaleString()} coins
                </p>
              </div>
              <div>
                <span className="text-gray-400">Net Profit:</span>
                <p className={`font-mono ${
                  ((form.sell - form.buy) * form.quantity - Math.floor(form.sell * form.quantity * 0.05)) >= 0 
                    ? 'text-green-400' : 'text-red-400'
                }`}>
                  {(((form.sell - form.buy) * form.quantity) - Math.floor(form.sell * form.quantity * 0.05)).toLocaleString()} coins
                </p>
              </div>
            </div>
          </div>
        )}

        <button 
          disabled={loading} 
          type="submit" 
          className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-6 rounded-lg font-medium transition-colors disabled:opacity-50"
        >
          {loading ? "Logging Trade..." : "Log Trade"}
        </button>
      </form>
    </div>
  );
};

export default AddTrade;
