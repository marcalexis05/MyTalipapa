import { useState, useEffect } from 'react';
import { Search, X, MapPin, Tag } from 'lucide-react';
import './StallSearch.css';

export default function StallSearch({ onStallFound }) {
  const [query, setQuery] = useState('');
  const [stalls, setStalls] = useState([]);
  const [filteredStalls, setFilteredStalls] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedZone, setSelectedZone] = useState('all');

  // Load all stalls on mount to provide fast client-side filtering/autocompletion
  useEffect(() => {
    fetch('/api/renter/stalls')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setStalls(data);
          setFilteredStalls(data);
        }
      })
      .catch(err => console.error('Failed to fetch stalls in StallSearch:', err));
  }, []);

  // Filter stalls instantly when query, category, or zone changes
  useEffect(() => {
    let result = stalls;

    // Filter by text search
    if (query.trim()) {
      const q = query.toLowerCase().trim();
      result = result.filter(s => {
        const num = String(s.stallNumber || '').toLowerCase();
        const zoneLetter = String(s.zone || '').toLowerCase();
        const sec = String(s.section || s.category || '').toLowerCase();
        const vendor = String(s.vendorName || '').toLowerCase();
        return num.includes(q) || zoneLetter.includes(q) || sec.includes(q) || vendor.includes(q);
      });
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      result = result.filter(s => {
        const sec = String(s.section || s.category || '').toLowerCase();
        if (selectedCategory === 'meat') return sec.includes('meat');
        if (selectedCategory === 'fish') return sec.includes('fish') || sec.includes('sea');
        if (selectedCategory === 'veggies') return sec.includes('veg') || sec.includes('produce');
        return true;
      });
    }

    // Filter by zone
    if (selectedZone !== 'all') {
      result = result.filter(s => String(s.zone || '').toUpperCase() === selectedZone.toUpperCase());
    }

    setFilteredStalls(result);
  }, [query, selectedCategory, selectedZone, stalls]);

  const handleSelectStall = async (stall) => {
    try {
      const num = String(stall.stallNumber || '').trim().replace(/^0+(?=\d)/, '');
      const zoneLetter = String(stall.zone || '').replace('Zone ', '').toUpperCase();
      const response = await fetch(`/api/stalls/search?zone=${zoneLetter}&stallNumber=${num}`);
      const data = await response.json();

      if (data.success && data.stall) {
        onStallFound(data.stall);
      }
    } catch (err) {
      console.error('Failed to select stall from search:', err);
    }
  };

  const handleSearchSubmit = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    try {
      const response = await fetch(`/api/stalls/search?query=${encodeURIComponent(query)}`);
      const data = await response.json();
      if (data.success && data.stall) {
        onStallFound(data.stall);
      }
    } catch (err) {
      console.error('Search query failed:', err);
    }
  };

  const zones = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

  return (
    <div className="stall-search-container">
      <form onSubmit={handleSearchSubmit} className="search-input-wrapper">
        <span className="search-icon-span"><Search size={16} /></span>
        <input
          type="text"
          placeholder="Search stall (e.g. 'Stall 11', 'Zone E')..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="search-text-input"
        />
        {query && (
          <button type="button" onClick={() => setQuery('')} className="clear-search-btn">
            <X size={15} />
          </button>
        )}
      </form>

      {/* Select filters */}
      <div className="filters-row">
        <div className="filter-select-wrapper">
          <label>Category</label>
          <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}>
            <option value="all">All Categories</option>
            <option value="meat">🥩 Meat</option>
            <option value="fish">🐟 Fishes</option>
            <option value="veggies">🥬 Vegetables</option>
          </select>
        </div>

        <div className="filter-select-wrapper">
          <label>Zone</label>
          <select value={selectedZone} onChange={e => setSelectedZone(e.target.value)}>
            <option value="all">All Zones</option>
            {zones.map(z => <option key={z} value={z}>Zone {z}</option>)}
          </select>
        </div>
      </div>

      {/* Live search results */}
      <div className="search-results-list">
        <div className="results-header">
          <span>Stalls found ({filteredStalls.length})</span>
        </div>

        {filteredStalls.length > 0 ? (
          <div className="scrollable-results">
            {filteredStalls.map(s => (
              <div
                key={s.id || s._id}
                onClick={() => handleSelectStall(s)}
                className={`stall-result-item ${s.status === 'occupied' ? 'occupied' : 'available'}`}
              >
                <div className="result-item-left">
                  <div className="result-avatar">
                    <span>{s.stallNumber}</span>
                  </div>
                  <div className="result-info">
                    <p className="result-title">Stall #{s.stallNumber}</p>
                    <p className="result-subtitle">
                      <MapPin size={10} className="inline-icon" /> Zone {s.zone} · <Tag size={10} className="inline-icon" /> {s.section}
                    </p>
                  </div>
                </div>

                <div className="result-item-right">
                  <span className={`status-pill ${s.status}`}>
                    {s.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-results">
            <p>No matching stalls found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
