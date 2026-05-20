// src/data/store.js

// Aktif oyuncu oturumlarını (token -> kullanıcı bilgileri) tutar
export const activeSessions = new Map();

// Aktif kullanıcı adlarını (aynı isimle birden fazla girişi önlemek için) tutar
export const activeUsernames = new Set();

// Aktif oyun odalarını (roomId -> oda detayları ve game state) tutar
export const rooms = new Map();