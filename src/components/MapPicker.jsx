import { useEffect, useRef, useState } from 'react';
import { X, MapPin, Loader } from 'lucide-react';

// Leaflet needs its CSS loaded
import 'leaflet/dist/leaflet.css';

export default function MapPicker({ onConfirm, onClose }) {
  const mapRef    = useRef(null);
  const leafletRef = useRef(null);   // L instance
  const mapObjRef  = useRef(null);   // map instance
  const markerRef  = useRef(null);

  const [address, setAddress]     = useState('');
  const [loading, setLoading]     = useState(false);
  const [coords, setCoords]       = useState(null);

  useEffect(() => {
    let map;

    import('leaflet').then(L => {
      L = L.default ?? L;
      leafletRef.current = L;

      // Fix default icon paths broken by bundlers
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      if (mapObjRef.current) return; // already initialized

      map = L.map(mapRef.current).setView([40.4168, -3.7038], 13); // Madrid por defecto
      mapObjRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
      }).addTo(map);

      // Try to use user's geolocation to center the map
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          pos => map.setView([pos.coords.latitude, pos.coords.longitude], 15),
          () => {}
        );
      }

      map.on('click', async (e) => {
        const { lat, lng } = e.latlng;
        setCoords({ lat, lng });

        if (markerRef.current) markerRef.current.remove();
        markerRef.current = L.marker([lat, lng]).addTo(map);

        setLoading(true);
        setAddress('');
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=es`,
            { headers: { 'Accept-Language': 'es' } }
          );
          const data = await res.json();
          setAddress(data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`);
        } catch {
          setAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
        } finally {
          setLoading(false);
        }
      });
    });

    return () => {
      if (mapObjRef.current) {
        mapObjRef.current.remove();
        mapObjRef.current = null;
      }
    };
  }, []);

  const handleConfirm = () => {
    if (!coords) return;
    onConfirm(address, coords);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 2000,
      background: 'rgba(0,0,0,0.55)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#fff', borderRadius: 14, width: '90vw', maxWidth: 700,
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          boxShadow: '0 8px 40px rgba(0,0,0,0.22)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '14px 18px', borderBottom: '1px solid #e2e8f0',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span style={{ fontWeight: 700, fontSize: 15 }}>Select location on map</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
            <X size={20} />
          </button>
        </div>

        {/* Hint */}
        <div style={{ padding: '8px 18px', background: '#f8fafc', fontSize: 13, color: '#64748b' }}>
          Click anywhere on the map to pin the delivery address.
        </div>

        {/* Map */}
        <div ref={mapRef} style={{ height: 380, width: '100%' }} />

        {/* Address result */}
        <div style={{ padding: '12px 18px', borderTop: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 10 }}>
          {loading && <Loader size={16} style={{ color: '#059669', flexShrink: 0, animation: 'spin 1s linear infinite' }} />}
          {!loading && <MapPin size={16} style={{ color: coords ? '#059669' : '#cbd5e1', flexShrink: 0 }} />}
          <span style={{ flex: 1, fontSize: 13, color: address ? '#0f172a' : '#94a3b8', wordBreak: 'break-word' }}>
            {loading ? 'Getting address...' : address || 'No location selected yet'}
          </span>
        </div>

        {/* Footer */}
        <div style={{
          padding: '12px 18px', borderTop: '1px solid #e2e8f0',
          display: 'flex', justifyContent: 'flex-end', gap: 10,
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '7px 18px', borderRadius: 8, border: '1px solid #e2e8f0',
              background: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: 13, color: '#374151',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!coords || loading}
            style={{
              padding: '7px 18px', borderRadius: 8, border: 'none',
              background: coords && !loading ? '#059669' : '#d1fae5',
              color: '#fff', cursor: coords && !loading ? 'pointer' : 'not-allowed',
              fontWeight: 700, fontSize: 13,
            }}
          >
            Use this address
          </button>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
