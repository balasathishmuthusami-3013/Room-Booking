/**
 * Database Seeder — INR prices
 */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const Room     = require('../models/Room');
const User     = require('../models/User');

const ROOMS = [
  {
    roomNumber: '101', name: 'Garden View Standard',
    type: 'standard', description: 'A cosy room with a lush garden view, perfect for solo travellers or couples seeking tranquility.',
    pricePerNight: 8000, discountPercent: 0,
    capacity: { adults: 2, children: 1 }, size: 32, floor: 1,
    bedType: 'queen', bedCount: 1,
    amenities: ['wifi', 'ac', 'tv', 'parking'],
    images: [
      'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800',
      'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800',
      'https://images.unsplash.com/photo-1595576508898-0ad5c879a061?w=800',
    ],
  },
  {
    roomNumber: '205', name: 'City View Deluxe',
    type: 'deluxe', description: 'Enjoy panoramic city skyline views from this elegantly furnished deluxe room.',
    pricePerNight: 15000, discountPercent: 10,
    capacity: { adults: 2, children: 2 }, size: 45, floor: 2,
    bedType: 'king', bedCount: 1,
    amenities: ['wifi', 'ac', 'tv', 'balcony', 'bar'],
    images: [
      'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800',
      'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=800',
      'https://images.unsplash.com/photo-1560347876-aeef00ee58a1?w=800',
    ],
  },
  {
    roomNumber: '310', name: 'Executive Suite',
    type: 'suite', description: 'A spacious suite with a separate living area, ideal for business travellers and extended stays.',
    pricePerNight: 35000, discountPercent: 0,
    capacity: { adults: 3, children: 2 }, size: 75, floor: 3,
    bedType: 'king', bedCount: 1,
    amenities: ['wifi', 'ac', 'tv', 'spa', 'gym', 'restaurant', 'balcony'],
    images: [
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800',
      'https://images.unsplash.com/photo-1631049552057-403cdb8f0658?w=800',
      'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800',
    ],
  },
  {
    roomNumber: '2001', name: 'Royal Penthouse',
    type: 'penthouse', description: 'The pinnacle of luxury — a full-floor penthouse with a private terrace and butler service.',
    pricePerNight: 125000, discountPercent: 0,
    capacity: { adults: 4, children: 3 }, size: 280, floor: 20,
    bedType: 'king', bedCount: 2,
    amenities: ['wifi', 'ac', 'tv', 'spa', 'gym', 'pool', 'restaurant', 'bar', 'balcony', 'kitchen', 'laundry', 'parking'],
    images: [
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
      'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800',
      'https://images.unsplash.com/photo-1631049552057-403cdb8f0658?w=800',
    ],
  },
  {
    roomNumber: '415', name: 'Family Suite',
    type: 'family', description: 'Thoughtfully designed for families with separate bedrooms, a kitchenette, and fun amenities for children.',
    pricePerNight: 22000, discountPercent: 5,
    capacity: { adults: 2, children: 4 }, size: 90, floor: 4,
    bedType: 'queen', bedCount: 2,
    amenities: ['wifi', 'ac', 'tv', 'kitchen', 'laundry', 'parking'],
    images: [
      'https://images.unsplash.com/photo-1591088398332-8a7791972843?w=800',
      'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=800',
      'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800',
    ],
  },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    await Room.deleteMany({});
    await Room.insertMany(ROOMS);
    console.log(`✅ ${ROOMS.length} rooms seeded (prices in INR)`);

    await User.deleteMany({ role: 'admin' });
    const hashed = await bcrypt.hash('Admin@123456', 12);
    await User.create({ name: 'Admin', email: 'admin@hotelapp.com', password: hashed, role: 'admin', phone: '+91 98765 00000' });
    console.log('✅ Admin user created: admin@hotelapp.com / Admin@123456');

    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err.message);
    process.exit(1);
  }
}

seed();
