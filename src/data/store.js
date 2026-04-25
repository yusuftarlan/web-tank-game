const activeSessions = new Map();

// Hızlı benzersizlik (unique) kontrolü için sadece isimleri tutar
const activeUsernames = new Set();

// İleride odaları tutacağımız Map
const rooms = new Map();
