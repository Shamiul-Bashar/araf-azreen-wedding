/* Edit wedding information here. null means unconfirmed. Never add secrets. */
window.weddingConfig = {
  couple: { groom: 'ARAF', bride: 'AZREEN', displayName: 'ARAF & AZREEN' },
  wedding: { date: '2026-12-16', time: null, endTime: null, timezone: 'Asia/Dhaka' },
  story: 'With grateful hearts, we begin a new chapter together—guided by faith, strengthened by kindness, and surrounded by the prayers and blessings of those we love.',
  events: [
    { id: 'mehendi', name: 'Mehendi', date: '2026-12-15', time: '20:00', displayTime: null, endTime: null, venue: 'Family Residence', location: 'Kalishankorpur, Kushtia', mapsUrl: null, description: 'An evening of henna, laughter, and cherished traditions.' },
    { id: 'holud', name: 'Holud', date: '2026-12-16', time: '01:00', displayTime: null, endTime: null, venue: 'Family Residence', location: 'Kalishankorpur, Kushtia', mapsUrl: null, description: 'A joyful celebration filled with color, warmth, and blessings.' },
    { id: 'reception', name: 'Reception', date: '2026-12-18', time: null, displayTime: "After Jumu'ah Prayer", endTime: null, venue: 'Kushtia Rifle Club', location: 'Kushtia, Bangladesh', mapsUrl: 'https://www.google.com/search?kgmid=%2Fg%2F1vwlmk45', description: 'A gathering of loved ones to celebrate our beautiful new beginning.' }
  ],
  venue: { name: 'Kushtia Rifle Club', address: null, city: 'Kushtia, Bangladesh', time: null, mapsUrl: 'https://share.google/Tx2eDZIVjYS5RHv35' },
  photos: { hero: 'assets/bride.jpeg', story: 'assets/story-bg.png', saveDate: 'assets/save-date.png', closing: 'assets/closing.jpeg', venue: 'assets/venue-bg.jpg',
    gallery: ['assets/gallery-1.jpeg','assets/gallery-2.jpeg','assets/gallery-3.jpeg','assets/gallery-4.jpeg'] },
  music: { src: 'assets/music.mp3', autoplay: false, volume: 0.35 },
  rsvp: { demoMode: true, closeAfterWedding: true, isOpen: null },
  guestbook: { demoMode: true },
  // Asset inventory prevents requests for files that have not been supplied.
  // After adding files, run: python scripts/update-assets.py
  availableAssets: ["assets/bride.jpeg", "assets/celebrations-bg.png", "assets/gallery-1.jpeg", "assets/gallery-2.jpeg", "assets/save-date.png", "assets/story-bg.png", "assets/venue-bg.jpg", "assets/wishes-bg.jpeg"]
};
