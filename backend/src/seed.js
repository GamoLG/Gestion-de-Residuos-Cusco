import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { connectDB } from './db.js';
import Usuario from './models/Usuario.js';
import Zona from './models/Zona.js';
import Ruta from './models/Ruta.js';
import Residuo from './models/Residuo.js';
import mongoose from 'mongoose';

function caja(lngMin, latMin, lngMax, latMax) {
  return {
    type: 'Polygon',
    coordinates: [[
      [lngMin, latMin], [lngMax, latMin], [lngMax, latMax], [lngMin, latMax], [lngMin, latMin],
    ]],
  };
}

async function main() {
  await connectDB();

  // ── Zonas (cubren el Cusco metropolitano) ─────────────────────────────────
  const zonasDef = [
    { nombre: 'Centro Histórico', distrito: 'Cusco', color: '#58a6ff', geometry: caja(-71.9950, -13.5300, -71.9650, -13.4950) },
    { nombre: 'San Blas', distrito: 'Cusco', color: '#3fb950', geometry: caja(-71.9650, -13.5250, -71.9400, -13.4950) },
    { nombre: 'Wanchaq', distrito: 'Wanchaq', color: '#d29922', geometry: caja(-71.9700, -13.5550, -71.9400, -13.5250) },
    { nombre: 'Santiago', distrito: 'Santiago', color: '#a371f7', geometry: caja(-72.0250, -13.5550, -71.9850, -13.5150) },
    { nombre: 'San Sebastián', distrito: 'San Sebastián', color: '#f85149', geometry: caja(-71.9400, -13.5550, -71.8800, -13.5000) },
  ];
  const zonas = {};
  for (const z of zonasDef) {
    const doc = await Zona.findOneAndUpdate({ nombre: z.nombre }, { ...z, activo: true }, { upsert: true, new: true });
    zonas[z.nombre] = doc;
  }
  console.log('✓ zonas:', Object.keys(zonas).length);

  // ── Usuarios ──────────────────────────────────────────────────────────────
  const mk = async (data, pass) => {
    const password = await bcrypt.hash(pass, 10);
    return Usuario.findOneAndUpdate({ email: data.email }, { ...data, password, activo: true }, { upsert: true, new: true });
  };

  await mk({ nombre: 'Administrador General', email: 'admin@residuos.cusco.gob.pe', rol: 'SUPER_ADMIN', dni: '70000001' }, 'admin123');
  await mk({ nombre: 'Lucía Vargas', email: 'municipal@residuos.cusco.gob.pe', rol: 'ADMIN_MUNICIPAL', dni: '70000002' }, 'admin123');

  const operadores = [];
  const opDef = [
    { nombre: 'Miguel Huamán', dni: '70010001' },
    { nombre: 'José Mamani', dni: '70010002' },
    { nombre: 'Pedro Ccahuana', dni: '70010003' },
    { nombre: 'Luis Quispe', dni: '70010004' },
  ];
  let i = 0;
  for (const o of opDef) {
    i++;
    const u = await mk({ nombre: o.nombre, email: `operador${i}@residuos.cusco.gob.pe`, rol: 'OPERADOR_CAMION', dni: o.dni, telefono: `98400000${i}` }, 'operador123');
    operadores.push(u);
  }
  console.log('✓ operadores:', operadores.length);

  const citDef = [
    { nombre: 'María Condori', dni: '70020001', zona: 'Centro Histórico', latitud: -13.5160, longitud: -71.9770 },
    { nombre: 'Rosa Huamán', dni: '70020002', zona: 'Wanchaq', latitud: -13.5400, longitud: -71.9500 },
    { nombre: 'Juan Choque', dni: '70020003', zona: 'Santiago', latitud: -13.5350, longitud: -72.0050 },
    { nombre: 'Ana Ttito', dni: '70020004', zona: 'San Sebastián', latitud: -13.5300, longitud: -71.9100 },
  ];
  i = 0;
  for (const c of citDef) {
    i++;
    await mk({
      nombre: c.nombre, email: `ciudadano${i}@gmail.com`, rol: 'CIUDADANO', dni: c.dni,
      zona: zonas[c.zona]._id, latitud: c.latitud, longitud: c.longitud, direccion: `${c.zona}, Cusco`,
    }, 'ciudadano123');
  }
  console.log('✓ ciudadanos:', citDef.length);

  // ── Catálogo de residuos ──────────────────────────────────────────────────
  const residuos = [
    { nombre: 'Restos de comida', categoria: 'ORGANICO', color: '#3fb950', ejemplos: ['cáscaras', 'sobras', 'restos de jardín'], descripcion: 'Residuos biodegradables.' },
    { nombre: 'Plástico', categoria: 'RECICLABLE', color: '#58a6ff', ejemplos: ['botellas', 'envases', 'bolsas'], descripcion: 'Plásticos limpios y secos.' },
    { nombre: 'Papel y cartón', categoria: 'RECICLABLE', color: '#58a6ff', ejemplos: ['periódicos', 'cajas', 'cuadernos'], descripcion: 'Papel limpio sin grasa.' },
    { nombre: 'Vidrio', categoria: 'RECICLABLE', color: '#58a6ff', ejemplos: ['botellas', 'frascos'], descripcion: 'Vidrio sin tapas.' },
    { nombre: 'Residuos comunes', categoria: 'NO_RECICLABLE', color: '#8b949e', ejemplos: ['papel higiénico', 'pañales'], descripcion: 'No reciclables.' },
    { nombre: 'Pilas y baterías', categoria: 'PELIGROSO', color: '#f85149', ejemplos: ['pilas', 'baterías', 'focos'], descripcion: 'Llevar a puntos especiales.' },
  ];
  for (const r of residuos) {
    await Residuo.findOneAndUpdate({ nombre: r.nombre, pesoKg: 0 }, { ...r, activo: true }, { upsert: true });
  }
  console.log('✓ tipos de residuo:', residuos.length);

  // ── Rutas ─────────────────────────────────────────────────────────────────
  await Ruta.findOneAndUpdate(
    { nombre: 'Ruta Centro AM' },
    {
      nombre: 'Ruta Centro AM', camionPlaca: 'X1A-123', operador: operadores[0]._id, zona: zonas['Centro Histórico']._id,
      estado: 'PENDIENTE',
      paradas: [
        { nombre: 'Plaza de Armas', latitud: -13.5163, longitud: -71.9781, horaEstimada: '06:00' },
        { nombre: 'Mercado San Pedro', latitud: -13.5197, longitud: -71.9815, horaEstimada: '07:00' },
        { nombre: 'Av. El Sol', latitud: -13.5210, longitud: -71.9770, horaEstimada: '07:30' },
      ],
    },
    { upsert: true }
  );
  await Ruta.findOneAndUpdate(
    { nombre: 'Ruta Wanchaq PM' },
    {
      nombre: 'Ruta Wanchaq PM', camionPlaca: 'X2B-456', operador: operadores[1]._id, zona: zonas['Wanchaq']._id,
      estado: 'PENDIENTE',
      paradas: [
        { nombre: 'Óvalo Pachacútec', latitud: -13.5310, longitud: -71.9575, horaEstimada: '14:00' },
        { nombre: 'Av. La Cultura', latitud: -13.5260, longitud: -71.9480, horaEstimada: '15:00' },
      ],
    },
    { upsert: true }
  );
  console.log('✓ rutas: 2');

  console.log('\n══════════════════════════════════');
  console.log(' Seed completado. Credenciales:');
  console.log('══════════════════════════════════');
  console.log(' admin      : admin@residuos.cusco.gob.pe / admin123');
  console.log(' municipal  : municipal@residuos.cusco.gob.pe / admin123');
  console.log(' operador   : operador1@residuos.cusco.gob.pe / operador123');
  console.log(' ciudadano  : ciudadano1@gmail.com / ciudadano123');
  console.log('══════════════════════════════════');

  await mongoose.disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
