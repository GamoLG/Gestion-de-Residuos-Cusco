// Calcula el recorrido real por las calles entre un conjunto de paradas
// (en vez de una línea recta que puede cruzar manzanas y edificios), usando
// el servidor público de OSRM (Open Source Routing Machine) sobre datos de
// OpenStreetMap. OSRM resuelve el camino más corto por la red vial real con
// Contraction Hierarchies (una evolución optimizada de Dijkstra).
//
// No requiere clave ni cuenta — es un servicio de demostración gratuito de
// OSRM, pensado para uso ocasional (como este seed), no para tráfico masivo.
const OSRM_URL = 'https://router.project-osrm.org/route/v1/driving/';

// paradas: [{ latitud, longitud }, ...] en el orden en que se visitan
// Devuelve: [{ latitud, longitud }, ...] trazando las calles reales, o null si falla
export async function calcularRutaReal(paradas) {
  const puntos = (paradas || []).filter((p) => typeof p.latitud === 'number' && typeof p.longitud === 'number');
  if (puntos.length < 2) return null;

  const coords = puntos.map((p) => `${p.longitud},${p.latitud}`).join(';');
  const url = `${OSRM_URL}${coords}?overview=full&geometries=geojson`;

  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!r.ok) return null;
    const j = await r.json();
    if (j.code !== 'Ok' || !j.routes?.[0]) return null;
    return j.routes[0].geometry.coordinates.map(([lng, lat]) => ({ latitud: lat, longitud: lng }));
  } catch (e) {
    console.error('calcularRutaReal', e.message);
    return null;
  }
}
