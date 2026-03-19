/**
 * SmartSearch.jsx
 * Fixes:
 * 1. Hotel names now show — loads from Amadeus API per city as fallback
 * 2. Dropdown stays INSIDE the hero — uses fixed maxHeight + overflow scroll
 * 3. Alignment fixed — wrapper is position:relative, dropdown is left:0 right:0
 * 4. Single search icon — removed duplicate emoji in placeholder
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const TN_CITIES = [
  { code:'MAA', name:'Chennai',    tagline:'Gateway of South India',    emoji:'🌆' },
  { code:'CJB', name:'Coimbatore', tagline:'Manchester of South India', emoji:'🏙️' },
  { code:'IXM', name:'Madurai',    tagline:'City of Temples',           emoji:'🕌' },
  { code:'TRZ', name:'Trichy',     tagline:'Rock Fort City',            emoji:'🏛️' },
  { code:'SXV', name:'Salem',      tagline:'City of Mango & Steel',     emoji:'🌃' },
];

const CSS = `
  @keyframes ssIn{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}
  @keyframes ssSpin{from{transform:translateY(-50%) rotate(0deg)}to{transform:translateY(-50%) rotate(360deg)}}
  .ss-drop{animation:ssIn .18s ease both}
  .ss-row{transition:background .1s;cursor:pointer;border:none;text-align:left;width:100%}
  .ss-row:hover,.ss-row:focus{background:#FEF3C7!important;outline:none}
`;

export default function SmartSearch({
  placeholder = 'Search hotels or cities...',
  onSelect,
  className = '',
  dark = false,
}) {
  const navigate = useNavigate();
  const wrapRef  = useRef(null);
  const inputRef = useRef(null);

  const [q,       setQ]       = useState('');
  const [sugg,    setSugg]    = useState([]);
  const [open,    setOpen]    = useState(false);
  const [busy,    setBusy]    = useState(false);
  const [hotels,  setHotels]  = useState([]);
  const [idx,     setIdx]     = useState(-1);

  // ── Load hotels on mount ─────────────────────────────────────
  // Try DB first, then load each Amadeus city individually as fallback
  useEffect(() => {
    (async () => {
      // 1. Try the local DB public endpoint
      try {
        const r = await axios.get(`${BASE_URL}/cities/hotels/all`);
        const list = r.data?.data?.hotels || [];
        if (list.length > 0) { setHotels(list); return; }
      } catch {}

      // 2. Fallback: pull hotels from Amadeus for each city
      try {
        const today    = new Date().toISOString().split('T')[0];
        const tomorrow = new Date(Date.now()+86400000).toISOString().split('T')[0];
        const results = await Promise.allSettled(
          TN_CITIES.map(c =>
            axios.get(`${BASE_URL}/hotels`, { params:{ city:c.code } })
              .then(r => (r.data?.data?.hotels || []).map(h => ({
                ...h,
                cityName: c.name,
                cityCode: c.code,
              })))
              .catch(() => [])
          )
        );
        const all = results.flatMap(r => r.status==='fulfilled' ? r.value : []);
        setHotels(all);
      } catch {}
    })();
  }, []);

  // ── Search ───────────────────────────────────────────────────
  const doSearch = useCallback((val) => {
    const t = val.trim().toLowerCase();
    if (!t) { setSugg([]); setOpen(false); return; }
    setBusy(true);

    // Cities — partial match on name or code
    const matchCities = TN_CITIES
      .filter(c =>
        c.name.toLowerCase().includes(t) ||
        c.code.toLowerCase() === t ||
        c.tagline.toLowerCase().includes(t)
      )
      .map(c => ({ type:'city', label:c.name, sub:c.tagline, emoji:c.emoji, data:c }));

    // Hotels — match on hotel name or city name
    const matchHotels = hotels
      .filter(h =>
        (h.name || '').toLowerCase().includes(t) ||
        (h.cityName || h.location || '').toLowerCase().includes(t)
      )
      .slice(0, 6)
      .map(h => ({
        type:'hotel',
        label: h.name || 'Hotel',
        sub:   h.cityName || h.location || '',
        data:  h,
        exact: (h.name || '').toLowerCase() === t,
      }));

    // Exact matches first, then partial hotels, then cities
    const results = [
      ...matchHotels.filter(x => x.exact),
      ...matchHotels.filter(x => !x.exact),
      ...matchCities,
    ].slice(0, 8);

    setSugg(results);
    setOpen(results.length > 0);
    setBusy(false);
  }, [hotels]);

  useEffect(() => {
    const t = setTimeout(() => doSearch(q), 200);
    return () => clearTimeout(t);
  }, [q, doSearch]);

  // Close on outside click
  useEffect(() => {
    const fn = e => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false); setIdx(-1);
      }
    };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  const pick = item => {
    setQ(''); setSugg([]); setOpen(false); setIdx(-1);
    if (onSelect) { onSelect(item); return; }
    if (item.type === 'city') {
      navigate(`/hotels?city=${item.data.code}&cityName=${encodeURIComponent(item.data.name)}`);
    } else {
      const code = item.data.cityCode || item.data.cityId || 'MAA';
      navigate(`/hotels?city=${code}&hotel=${encodeURIComponent(item.label)}`);
    }
  };

  const onKey = e => {
    if (!open) return;
    if (e.key === 'ArrowDown')  { e.preventDefault(); setIdx(i => Math.min(i+1, sugg.length-1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setIdx(i => Math.max(i-1, -1)); }
    else if (e.key === 'Enter') {
      e.preventDefault();
      if (idx >= 0 && sugg[idx]) pick(sugg[idx]);
      else if (q.trim()) { navigate(`/hotels?search=${encodeURIComponent(q.trim())}`); setQ(''); setOpen(false); }
    }
    else if (e.key === 'Escape') { setOpen(false); setIdx(-1); }
  };

  // Highlight matched portion of text
  const hl = (text, query) => {
    if (!query.trim() || !text) return text;
    const i = text.toLowerCase().indexOf(query.trim().toLowerCase());
    if (i === -1) return text;
    return (
      <>
        {text.slice(0, i)}
        <mark style={{ background:'rgba(245,158,11,0.4)', color:'inherit', borderRadius:2, padding:'0 1px' }}>
          {text.slice(i, i + query.trim().length)}
        </mark>
        {text.slice(i + query.trim().length)}
      </>
    );
  };

  const hotelCount = sugg.filter(s => s.type === 'hotel').length;
  const cityCount  = sugg.filter(s => s.type === 'city').length;

  // Input style
  const inputStyle = {
    width: '100%',
    padding: '11px 38px 11px 40px',
    fontSize: 14,
    outline: 'none',
    borderRadius: 12,
    transition: 'border-color .2s, box-shadow .2s',
    fontFamily: "'DM Sans','Segoe UI',sans-serif",
    ...(dark ? {
      background: 'rgba(255,255,255,0.08)',
      border: '1px solid rgba(255,255,255,0.18)',
      color: '#fff',
    } : {
      background: '#fff',
      border: '2px solid #e5e7eb',
      color: '#1f2937',
    }),
  };

  return (
    /*
     * CRITICAL: position:relative here so the dropdown's
     * position:absolute + left:0 + right:0 aligns to THIS element.
     * width:100% ensures dropdown matches input width exactly.
     */
    <div
      ref={wrapRef}
      className={className}
      style={{ position:'relative', width:'100%', fontFamily:"'DM Sans',sans-serif" }}
    >
      <style>{CSS}</style>

      {/* Search icon — left */}
      <span style={{
        position:'absolute', left:12, top:'50%', transform:'translateY(-50%)',
        fontSize:15, pointerEvents:'none', zIndex:2,
        color: dark ? 'rgba(255,255,255,0.4)' : '#9ca3af',
      }}>🔍</span>

      {/* Input */}
      <input
        ref={inputRef}
        type="text"
        value={q}
        onChange={e => { setQ(e.target.value); setIdx(-1); }}
        onKeyDown={onKey}
        placeholder={placeholder}
        style={inputStyle}
        autoComplete="off"
        spellCheck="false"
        onFocus={e => {
          e.target.style.borderColor  = dark ? '#C9A96E' : '#F59E0B';
          e.target.style.boxShadow    = dark
            ? '0 0 0 3px rgba(201,169,110,0.18)'
            : '0 0 0 3px rgba(245,158,11,0.18)';
          if (q.trim() && sugg.length > 0) setOpen(true);
        }}
        onBlur={e => {
          e.target.style.borderColor = dark ? 'rgba(255,255,255,0.18)' : '#e5e7eb';
          e.target.style.boxShadow   = 'none';
        }}
      />

      {/* Clear button — right */}
      {q && !busy && (
        <button
          onClick={() => { setQ(''); setSugg([]); setOpen(false); inputRef.current?.focus(); }}
          style={{
            position:'absolute', right:10, top:'50%', transform:'translateY(-50%)',
            background:'none', border:'none', cursor:'pointer', padding:'2px 5px',
            fontSize:14, lineHeight:1,
            color: dark ? 'rgba(255,255,255,0.45)' : '#9ca3af',
          }}
        >✕</button>
      )}

      {/* Spinner */}
      {busy && (
        <span style={{
          position:'absolute', right:12, top:'50%',
          width:12, height:12, borderRadius:'50%',
          border:'2px solid transparent',
          borderTopColor: dark ? '#C9A96E' : '#F59E0B',
          animation:'ssSpin .7s linear infinite',
          display:'inline-block',
        }}/>
      )}

      {/* ── Dropdown ─────────────────────────────────────────── */}
      {open && sugg.length > 0 && (
        <div
          className="ss-drop"
          style={{
            position: 'absolute',
            top: 'calc(100% + 5px)',
            left: 0,
            right: 0,        /* same width as input — no overflow */
            zIndex: 99999,
            background: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: 12,
            boxShadow: '0 12px 40px rgba(0,0,0,0.18)',
            overflow: 'hidden',
            maxHeight: 320,   /* stays within hero — scrolls if needed */
            overflowY: 'auto',
          }}
        >
          {/* Hotels section */}
          {hotelCount > 0 && (
            <>
              <div style={{ padding:'7px 12px 4px', background:'#f9fafb', borderBottom:'1px solid #f3f4f6' }}>
                <span style={{ fontSize:10, color:'#6b7280', fontWeight:700, textTransform:'uppercase', letterSpacing:'.1em' }}>
                  🏨 Hotels ({hotelCount})
                </span>
              </div>
              {sugg.filter(s => s.type==='hotel').map((item, i) => (
                <button
                  key={`h${i}`}
                  onClick={() => pick(item)}
                  className="ss-row"
                  style={{
                    display:'flex', alignItems:'center', gap:10,
                    padding:'9px 12px',
                    background: idx === sugg.indexOf(item) ? '#FEF3C7' : 'transparent',
                  }}
                >
                  {/* Icon */}
                  <div style={{
                    width:32, height:32, borderRadius:8, flexShrink:0,
                    background:'linear-gradient(135deg,#F59E0B,#D97706)',
                    display:'flex', alignItems:'center', justifyContent:'center', fontSize:14,
                  }}>🏨</div>
                  {/* Text */}
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13, fontWeight:600, color:'#111827', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      {hl(item.label, q)}
                    </div>
                    <div style={{ fontSize:11, color:'#6b7280', marginTop:1 }}>
                      📍 {item.sub || 'Hotel'}
                    </div>
                  </div>
                  {item.exact && (
                    <span style={{ fontSize:9, fontWeight:700, color:'#059669', background:'#d1fae5', padding:'2px 6px', borderRadius:100, flexShrink:0 }}>
                      Exact
                    </span>
                  )}
                </button>
              ))}
            </>
          )}

          {/* Cities section */}
          {cityCount > 0 && (
            <>
              <div style={{ padding:'7px 12px 4px', background:'#f9fafb', borderTop: hotelCount > 0 ? '1px solid #f3f4f6' : 'none' }}>
                <span style={{ fontSize:10, color:'#6b7280', fontWeight:700, textTransform:'uppercase', letterSpacing:'.1em' }}>
                  📍 Locations ({cityCount})
                </span>
              </div>
              {sugg.filter(s => s.type==='city').map((item, i) => (
                <button
                  key={`c${i}`}
                  onClick={() => pick(item)}
                  className="ss-row"
                  style={{
                    display:'flex', alignItems:'center', gap:10,
                    padding:'9px 12px',
                    background: idx === sugg.indexOf(item) ? '#FEF3C7' : 'transparent',
                  }}
                >
                  {/* City emoji in circle */}
                  <div style={{
                    width:32, height:32, borderRadius:'50%', flexShrink:0,
                    background:'rgba(245,158,11,0.1)', border:'1px solid rgba(245,158,11,0.2)',
                    display:'flex', alignItems:'center', justifyContent:'center', fontSize:16,
                  }}>{item.emoji}</div>
                  {/* Text */}
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13, fontWeight:600, color:'#111827' }}>
                      {hl(item.label, q)}
                    </div>
                    <div style={{ fontSize:11, color:'#6b7280', marginTop:1 }}>{item.sub}</div>
                  </div>
                  <span style={{ fontSize:11, color:'#F59E0B', fontWeight:600, flexShrink:0 }}>
                    All Hotels →
                  </span>
                </button>
              ))}
            </>
          )}

          {/* Footer hint */}
          <div style={{ padding:'5px 12px', borderTop:'1px solid #f3f4f6', background:'#fafafa' }}>
            <span style={{ fontSize:9, color:'#d1d5db' }}>↑↓ navigate · ↵ select · Esc close</span>
          </div>
        </div>
      )}

      {/* No results */}
      {open && q.trim() && sugg.length === 0 && !busy && (
        <div
          className="ss-drop"
          style={{
            position:'absolute', top:'calc(100% + 5px)', left:0, right:0,
            zIndex:99999, background:'#fff', border:'1px solid #e5e7eb',
            borderRadius:12, boxShadow:'0 12px 40px rgba(0,0,0,0.15)',
            padding:'16px 12px', textAlign:'center',
          }}
        >
          <p style={{ fontSize:13, color:'#6b7280', fontWeight:600, margin:'0 0 4px' }}>
            No results for "{q}"
          </p>
          <p style={{ fontSize:11, color:'#9ca3af', margin:'0 0 10px' }}>
            Try: Chennai, Madurai, or a hotel name
          </p>
          <div style={{ display:'flex', gap:6, justifyContent:'center', flexWrap:'wrap' }}>
            {TN_CITIES.slice(0, 4).map(c => (
              <button key={c.code}
                onClick={() => { setQ(c.name); doSearch(c.name); }}
                style={{ fontSize:11, padding:'3px 9px', borderRadius:100, background:'#FEF3C7', border:'1px solid #FDE68A', color:'#92400E', cursor:'pointer' }}>
                {c.emoji} {c.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
