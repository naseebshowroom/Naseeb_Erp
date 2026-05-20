import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, Phone, Bike, Tv, Refrigerator, Wind, WashingMachine, Package, Search, Filter } from 'lucide-react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Category config for display
const CATEGORIES = [
  { value: '',               label: 'Tamam Samaan',       emoji: '🏪' },
  { value: 'motorcycle',    label: 'Motorcycle',          emoji: '🏍️' },
  { value: 'mobile',        label: 'Mobile Phone',        emoji: '📱' },
  { value: 'ac',            label: 'AC',                  emoji: '❄️' },
  { value: 'lcd',           label: 'LCD / TV',            emoji: '📺' },
  { value: 'fridge',        label: 'Fridge',              emoji: '🧊' },
  { value: 'washing_machine', label: 'Washing Machine',   emoji: '🫧' },
  { value: 'other',         label: 'Aur Samaan',          emoji: '📦' },
];

const CATEGORY_LABEL = Object.fromEntries(CATEGORIES.slice(1).map(c => [c.value, `${c.emoji} ${c.label}`]));

function ItemCard({ item }) {
  return (
    <div style={{
      background: 'white',
      borderRadius: '16px',
      overflow: 'hidden',
      border: '1px solid #e2e8f0',
      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      transition: 'transform 0.2s, box-shadow 0.2s',
      display: 'flex',
      flexDirection: 'column',
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'; }}
    >
      {/* Image placeholder */}
      <div style={{
        height: 120,
        background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 48,
      }}>
        {CATEGORIES.find(c => c.value === item.category)?.emoji || '📦'}
      </div>

      <div style={{ padding: '14px 16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{
          display: 'inline-block', marginBottom: 8,
          fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase',
          padding: '3px 8px', borderRadius: 20,
          background: '#f1f5f9', color: '#64748b',
        }}>
          {CATEGORY_LABEL[item.category] || item.category}
        </div>
        <div style={{ fontWeight: 800, fontSize: 16, color: '#0f172a', marginBottom: 2 }}>{item.brand}</div>
        <div style={{ fontWeight: 600, fontSize: 13, color: '#475569' }}>{item.model}</div>
        {item.color && (
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>Rang: {item.color}</div>
        )}
        {item.subType && (
          <div style={{ fontSize: 12, color: '#94a3b8' }}>Type: {item.subType}</div>
        )}

        <div style={{
          marginTop: 'auto', paddingTop: 12, borderTop: '1px solid #f1f5f9',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span style={{
            fontSize: 11, fontWeight: 800, color: '#16a34a',
            background: '#dcfce7', padding: '3px 10px', borderRadius: 20,
          }}>
            ✅ Available
          </span>
          <a
            href="https://wa.me/923337971303"
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              fontSize: 12, fontWeight: 700, color: '#2563eb', textDecoration: 'none',
            }}
          >
            <Phone size={12} /> Rabta Karein
          </a>
        </div>
      </div>
    </div>
  );
}

export default function PublicCatalog() {
  const [items, setItems]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [activeCategory, setActiveCategory] = useState('');
  const [search, setSearch]         = useState('');
  const [error, setError]           = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(false);
      try {
        const params = {};
        if (activeCategory) params.category = activeCategory;
        const res = await axios.get(`${API_BASE}/global/public-stock`, { params });
        setItems(res.data.data || []);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [activeCategory]);

  const filtered = items.filter(item => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      item.brand?.toLowerCase().includes(q) ||
      item.model?.toLowerCase().includes(q) ||
      item.color?.toLowerCase().includes(q)
    );
  });

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: "'Segoe UI', sans-serif" }}>

      {/* ── Sticky Header ── */}
      <header style={{
        background: 'white', borderBottom: '1px solid #e2e8f0',
        position: 'sticky', top: 0, zIndex: 50,
        padding: '14px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: '0 1px 8px rgba(0,0,0,0.07)',
      }}>
        <div>
          <div style={{ fontWeight: 900, fontSize: 20, color: '#0f172a', letterSpacing: '-0.5px' }}>
            🏍️ Naseeb Autos & Electronics
          </div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
            Khuzdar • Hamari dukan par maujood samaan ki list
          </div>
        </div>
        <button
          onClick={() => navigate('/login')}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: '#0f172a', color: 'white',
            border: 'none', borderRadius: 10, padding: '9px 16px',
            fontSize: 12, fontWeight: 700, cursor: 'pointer',
          }}
        >
          <LogIn size={13} />
          Dukan Malik Login
        </button>
      </header>

      {/* ── Hero Banner ── */}
      <div style={{
        background: 'linear-gradient(135deg, #1e40af 0%, #7c3aed 100%)',
        padding: '36px 24px',
        textAlign: 'center', color: 'white',
      }}>
        <div style={{ fontSize: 28, fontWeight: 900, marginBottom: 8 }}>
          Asaan Qist Plan Maujood Hai! 🎉
        </div>
        <div style={{ fontSize: 14, opacity: 0.85, maxWidth: 480, margin: '0 auto 20px' }}>
          Motorcycle, AC, Fridge, Mobile — Sab kuch asaan mahana qiston par ghar le jayen.
          Koi bhi samaan pasand karen aur humse rabta karen.
        </div>
        <a
          href="https://wa.me/923337971303"
          target="_blank" rel="noreferrer"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: '#22c55e', color: 'white', textDecoration: 'none',
            padding: '10px 22px', borderRadius: 12, fontWeight: 800, fontSize: 14,
          }}
        >
          <Phone size={15} /> WhatsApp par Rabta Karein
        </a>
      </div>

      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '28px 16px' }}>

        {/* ── Category Filter Tabs ── */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat.value}
              onClick={() => setActiveCategory(cat.value)}
              style={{
                padding: '7px 14px', borderRadius: 20, border: 'none', cursor: 'pointer',
                fontSize: 12, fontWeight: 700,
                background: activeCategory === cat.value ? '#1e40af' : 'white',
                color: activeCategory === cat.value ? 'white' : '#475569',
                border: activeCategory === cat.value ? '2px solid #1e40af' : '1.5px solid #e2e8f0',
                transition: 'all 0.15s',
              }}
            >
              {cat.emoji} {cat.label}
            </button>
          ))}
        </div>

        {/* ── Search Bar ── */}
        <div style={{
          position: 'relative', marginBottom: 24,
        }}>
          <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            type="text"
            placeholder="Brand, model ya rang se dhundhein..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', paddingLeft: 42, paddingRight: 16,
              paddingTop: 10, paddingBottom: 10,
              border: '1.5px solid #e2e8f0', borderRadius: 12,
              fontSize: 14, outline: 'none', background: 'white',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* ── Results Count ── */}
        {!loading && (
          <div style={{ fontSize: 13, color: '#64748b', marginBottom: 16, fontWeight: 600 }}>
            {filtered.length === 0 ? 'Koi samaan nahi mila' : `${filtered.length} item(s) available hain`}
          </div>
        )}

        {/* ── Items Grid ── */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8', fontSize: 15, fontWeight: 600 }}>
            ⏳ Samaan ki list load ho rahi hai...
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#ef4444', fontSize: 14 }}>
            Server se connection nahi hua. Baad mein dobara try karein.
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8', fontSize: 15 }}>
            😔 Is waqt koi samaan available nahi hai.
            <br />
            <a href="https://wa.me/923337971303" style={{ color: '#2563eb', fontWeight: 700, marginTop: 8, display: 'inline-block' }}>
              WhatsApp par poochhein →
            </a>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: 16,
          }}>
            {filtered.map((item, i) => (
              <ItemCard key={`${item.brand}-${item.model}-${i}`} item={item} />
            ))}
          </div>
        )}
      </main>

      {/* ── Footer ── */}
      <footer style={{
        background: '#0f172a', color: '#94a3b8',
        textAlign: 'center', padding: '20px 16px',
        fontSize: 12, marginTop: 40,
      }}>
        <div style={{ fontWeight: 700, color: 'white', marginBottom: 4 }}>Naseeb Autos & Electronics — Khuzdar</div>
        <div>Installment System powered by Naseeb ERP</div>
      </footer>
    </div>
  );
}
