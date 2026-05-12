export const activeSessions = new Map();

// Hizli benzersizlik (unique) kontrolu icin sadece isimleri tutar.
export const activeUsernames = new Set();

// Oda bilgileri RAM uzerinde tutulur.
export const rooms = new Map();
