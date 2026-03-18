/**
 * controllers/cityHotel.controller.js
 * Admin CRUD for cities and hotels
 */
const { City, Hotel } = require('../models/CityHotel');
const AppError = require('../utils/AppError');

// ── Cities ─────────────────────────────────────────────
exports.getCities = async (req, res, next) => {
  try {
    const cities = await City.find({ isActive: true }).sort('name');
    res.json({ status: 'success', data: { cities } });
  } catch (e) { next(e); }
};

exports.createCity = async (req, res, next) => {
  try {
    const { name, code, tagline, image } = req.body;
    if (!name || !code) throw new AppError('name and code are required', 400);
    const city = await City.create({ name, code: code.toUpperCase(), tagline: tagline || '', image: image || '' });
    res.status(201).json({ status: 'success', data: { city } });
  } catch (e) { next(e); }
};

exports.updateCity = async (req, res, next) => {
  try {
    const city = await City.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!city) throw new AppError('City not found', 404);
    res.json({ status: 'success', data: { city } });
  } catch (e) { next(e); }
};

exports.deleteCity = async (req, res, next) => {
  try {
    await City.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ status: 'success', message: 'City deactivated' });
  } catch (e) { next(e); }
};

// ── Hotels ─────────────────────────────────────────────
exports.getHotelsByCity = async (req, res, next) => {
  try {
    const { cityId } = req.params;
    const hotels = await Hotel.find({ city: cityId, isActive: true }).sort('name');
    res.json({ status: 'success', data: { hotels } });
  } catch (e) { next(e); }
};

exports.getAllHotels = async (req, res, next) => {
  try {
    const hotels = await Hotel.find({ isActive: true }).populate('city', 'name code').sort('name');
    res.json({ status: 'success', data: { hotels } });
  } catch (e) { next(e); }
};

exports.createHotel = async (req, res, next) => {
  try {
    const { cityId, name, description, location, website, images, starRating } = req.body;
    if (!cityId || !name) throw new AppError('cityId and name are required', 400);
    const city = await City.findById(cityId);
    if (!city) throw new AppError('City not found', 404);
    const hotel = await Hotel.create({ city: cityId, cityCode: city.code, name, description: description || '', location: location || '', website: website || '', images: images || [], starRating: starRating || 4 });
    res.status(201).json({ status: 'success', data: { hotel } });
  } catch (e) { next(e); }
};

exports.updateHotel = async (req, res, next) => {
  try {
    const hotel = await Hotel.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!hotel) throw new AppError('Hotel not found', 404);
    res.json({ status: 'success', data: { hotel } });
  } catch (e) { next(e); }
};

exports.deleteHotel = async (req, res, next) => {
  try {
    await Hotel.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ status: 'success', message: 'Hotel deactivated' });
  } catch (e) { next(e); }
};
