let loaded = false;
let loading = false;

export function loadLeaflet(): Promise<void> {
  if (loaded) return Promise.resolve();
  if (loading) {
    return new Promise((resolve) => {
      const interval = setInterval(() => {
        if (loaded) { clearInterval(interval); resolve(); }
      }, 100);
    });
  }
  loading = true;
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => { loaded = true; loading = false; resolve(); };
    script.onerror = () => { loading = false; reject(new Error('Leaflet load failed')); };
    document.head.appendChild(script);
  });
}