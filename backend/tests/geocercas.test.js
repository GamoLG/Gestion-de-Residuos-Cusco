import { distanciaMetros } from '../src/validaciones.js';

// Puntos de referencia en Cusco
const PLAZA_ARMAS = { lat: -13.51636, lng: -71.978771 };
const SAN_PEDRO = { lat: -13.520743, lng: -71.983135 };

describe('distanciaMetros (Haversine, src/geocercas.js)', () => {
  test('la distancia de un punto a sí mismo es 0', () => {
    expect(distanciaMetros(PLAZA_ARMAS.lat, PLAZA_ARMAS.lng, PLAZA_ARMAS.lat, PLAZA_ARMAS.lng)).toBe(0);
    expect(distanciaMetros(0, 0, 0, 0)).toBe(0);
  });

  test('la distancia entre dos puntos distintos es positiva', () => {
    const d = distanciaMetros(PLAZA_ARMAS.lat, PLAZA_ARMAS.lng, SAN_PEDRO.lat, SAN_PEDRO.lng);
    expect(d).toBeGreaterThan(0);
  });

  test('Plaza de Armas → Mercado San Pedro está entre 600 y 800 m', () => {
    const d = distanciaMetros(PLAZA_ARMAS.lat, PLAZA_ARMAS.lng, SAN_PEDRO.lat, SAN_PEDRO.lng);
    expect(d).toBeGreaterThan(600);
    expect(d).toBeLessThan(800);
  });

  test('es simétrica: d(A,B) === d(B,A)', () => {
    const ida = distanciaMetros(PLAZA_ARMAS.lat, PLAZA_ARMAS.lng, SAN_PEDRO.lat, SAN_PEDRO.lng);
    const vuelta = distanciaMetros(SAN_PEDRO.lat, SAN_PEDRO.lng, PLAZA_ARMAS.lat, PLAZA_ARMAS.lng);
    expect(ida).toBeCloseTo(vuelta, 6);
  });

  test('1 grado de latitud ≈ 111 195 m (πR/180 con R = 6371 km)', () => {
    const d = distanciaMetros(0, 0, 1, 0);
    expect(d).toBeCloseTo(111194.93, 0);
  });

  test('valores límite: media vuelta al planeta (antípodas) ≈ πR', () => {
    const d = distanciaMetros(0, 0, 0, 180);
    expect(d).toBeCloseTo(Math.PI * 6371000, 0);
  });

  test('valores límite: polo norte a polo sur ≈ πR', () => {
    const d = distanciaMetros(90, 0, -90, 0);
    expect(d).toBeCloseTo(Math.PI * 6371000, 0);
  });

  test('distingue los umbrales de geocerca (LLEGADA 200 m vs PROXIMIDAD 800 m)', () => {
    // ~0.0015° de latitud ≈ 167 m: debe caer bajo el umbral de LLEGADA (200 m)
    const cerca = distanciaMetros(PLAZA_ARMAS.lat, PLAZA_ARMAS.lng, PLAZA_ARMAS.lat + 0.0015, PLAZA_ARMAS.lng);
    expect(cerca).toBeLessThan(200);
    // ~0.006° ≈ 667 m: dentro de PROXIMIDAD (800 m) pero fuera de LLEGADA
    const proximo = distanciaMetros(PLAZA_ARMAS.lat, PLAZA_ARMAS.lng, PLAZA_ARMAS.lat + 0.006, PLAZA_ARMAS.lng);
    expect(proximo).toBeGreaterThan(200);
    expect(proximo).toBeLessThan(800);
  });
});
