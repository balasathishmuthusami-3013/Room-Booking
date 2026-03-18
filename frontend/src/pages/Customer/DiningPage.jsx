import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const RESTAURANTS = [
  {
    name: 'SAFFRON',
    cuisine: 'Modern Indian Fusion',
    stars: 2,
    image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800',
    gallery: [
      'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600',
      'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=600',
      'https://images.unsplash.com/photo-1544025162-d76694265947?w=600',
    ],
    hours: '7:00 PM – 11:00 PM',
    desc: 'A symphony of bold Indian spices reimagined through a contemporary lens. Chef Arjun Kapoor\'s signature restaurant.',
    price: '₹4,500 per cover',
    dress: 'Smart Casual',
    menu: [
      { cat: '🥗 Starters', items: ['Amuse-Bouche Trio', 'Burrata with Mango Chutney', 'Tandoori Octopus', 'Dal Shorba with Truffle Oil'] },
      { cat: '🍛 Mains', items: ['Raan-e-Dum (48hr Slow-Cooked Lamb)', 'Black Cod in Banana Leaf', 'Lobster Moilee', 'Truffle Paneer Makhani'] },
      { cat: '🍰 Desserts', items: ['24K Gold Gulab Jamun', 'Mango Mousse with Paan Sorbet', 'Saffron Panna Cotta', 'Chocolate Tart with Cardamom Ice Cream'] },
    ],
  },
  {
    name: 'SKY LOUNGE',
    cuisine: 'International Tapas & Cocktails',
    stars: 0,
    image: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800',
    gallery: [
      'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=600',
      'https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=600',
      'https://images.unsplash.com/photo-1566417713940-fe7c737a9ef2?w=600',
    ],
    hours: '5:00 PM – 2:00 AM',
    desc: 'Rooftop bar on the 20th floor with 360° city views, handcrafted cocktails, and curated small plates.',
    price: '₹1,200 minimum spend',
    dress: 'Smart Casual',
    menu: [
      { cat: '🍸 Signature Cocktails', items: ['Hoto.tours Gold Gimlet', 'Delhi Mule', 'Saffron Sour', 'Rooftop Negroni'] },
      { cat: '🧆 Bites', items: ['Crispy Calamari', 'Wagyu Sliders', 'Truffle Fries', 'Cheese & Charcuterie Board'] },
    ],
  },
  {
    name: 'THE GRAND TABLE',
    cuisine: 'Breakfast & All-Day Dining',
    stars: 0,
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800',
    gallery: [
      'https://images.unsplash.com/photo-1544025162-d76694265947?w=600',
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600',
      'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600',
    ],
    hours: '6:00 AM – 11:00 PM',
    desc: 'An expansive all-day restaurant with live cooking stations, global cuisine, and an unmatched breakfast spread.',
    price: '₹2,200 per cover (buffet)',
    dress: 'Casual',
    menu: [
      { cat: '🍳 Breakfast', items: ['Live Egg Station', 'Indian Breakfast Corner', 'Fresh Juice Bar', 'Artisan Breads & Pastries'] },
      { cat: '🍽️ Lunch & Dinner', items: ['Carvery Station', 'Asian Wok Counter', 'Mediterranean Mezze', 'Dessert Extravaganza'] },
    ],
  },
];

export default function DiningPage() {
  const [selected, setSelected] = useState(null);
  const [activeImg, setActiveImg] = useState(0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="relative h-72 bg-gray-900 overflow-hidden">
        <img src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1600" alt="Fine Dining" className="w-full h-full object-cover opacity-50" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center">
          <p className="text-amber-400 text-xs font-bold tracking-widest uppercase mb-2">Culinary Excellence</p>
          <h1 className="text-5xl font-light mb-2" style={{fontFamily:'Georgia,serif'}}>Fine <em className="text-amber-400">Dining</em></h1>
          <p className="text-gray-300 text-sm">7 award-winning restaurants · 3 Michelin Stars combined</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {RESTAURANTS.map((r, i) => (
            <div key={r.name} className="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-xl transition group cursor-pointer" onClick={() => { setSelected(r); setActiveImg(0); }}>
              <div className="relative h-52 overflow-hidden">
                <img src={r.image} alt={r.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                {r.stars > 0 && (
                  <div className="absolute top-3 right-3 bg-amber-400 text-gray-900 text-xs font-bold px-2 py-1 rounded-full">
                    {'⭐'.repeat(r.stars)} Michelin
                  </div>
                )}
                <div className="absolute bottom-4 left-4 text-white">
                  <h3 className="text-xl font-bold">{r.name}</h3>
                  <p className="text-amber-300 text-xs">{r.cuisine}</p>
                </div>
              </div>
              <div className="p-4">
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">{r.desc}</p>
                <div className="flex justify-between text-xs text-gray-400">
                  <span>🕐 {r.hours}</span>
                  <span className="text-amber-600 font-semibold">View Menu →</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Restaurant Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
            {/* Gallery */}
            <div className="relative h-56 overflow-hidden rounded-t-3xl">
              <img src={selected.gallery[activeImg]} alt={selected.name} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"/>
              <button onClick={() => setSelected(null)} className="absolute top-4 right-4 w-9 h-9 bg-white/20 backdrop-blur rounded-full flex items-center justify-center text-white text-lg hover:bg-white/40 transition">✕</button>
              <div className="absolute bottom-4 left-6 text-white">
                <h2 className="text-2xl font-bold">{selected.name}</h2>
                <p className="text-amber-300 text-sm">{selected.cuisine}</p>
              </div>
              <div className="absolute bottom-4 right-4 flex gap-1">
                {selected.gallery.map((_,i) => (
                  <button key={i} onClick={() => setActiveImg(i)} className={`w-2 h-2 rounded-full transition ${activeImg===i?'bg-amber-400 w-4':'bg-white/50'}`}/>
                ))}
              </div>
            </div>
            {/* Thumbnails */}
            <div className="grid grid-cols-3 gap-2 p-4">
              {selected.gallery.map((img,i) => (
                <div key={i} onClick={() => setActiveImg(i)} className={`h-16 rounded-lg overflow-hidden cursor-pointer border-2 transition ${activeImg===i?'border-amber-400':'border-transparent'}`}>
                  <img src={img} alt="" className="w-full h-full object-cover"/>
                </div>
              ))}
            </div>
            <div className="px-6 pb-6 space-y-4">
              <p className="text-gray-600 text-sm">{selected.desc}</p>
              <div className="grid grid-cols-3 gap-3 text-center text-sm">
                <div className="bg-amber-50 rounded-xl p-3"><p className="text-xs text-gray-400 mb-1">Hours</p><p className="font-semibold text-gray-700 text-xs">{selected.hours}</p></div>
                <div className="bg-amber-50 rounded-xl p-3"><p className="text-xs text-gray-400 mb-1">Price</p><p className="font-semibold text-gray-700 text-xs">{selected.price}</p></div>
                <div className="bg-amber-50 rounded-xl p-3"><p className="text-xs text-gray-400 mb-1">Dress</p><p className="font-semibold text-gray-700 text-xs">{selected.dress}</p></div>
              </div>
              {selected.menu.map(section => (
                <div key={section.cat} className="bg-gray-50 rounded-xl p-4">
                  <p className="font-bold text-gray-700 mb-2 text-sm">{section.cat}</p>
                  <ul className="space-y-1">
                    {section.items.map(item => (
                      <li key={item} className="text-sm text-gray-600 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0"></span>{item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
              <button onClick={() => setSelected(null)} className="w-full bg-amber-400 hover:bg-amber-500 text-gray-900 font-bold py-3 rounded-xl transition">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
