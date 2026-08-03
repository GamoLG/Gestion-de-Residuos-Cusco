import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { connectDB } from './db.js';
import Usuario from './models/Usuario.js';
import Zona from './models/Zona.js';
import Ruta from './models/Ruta.js';
import Residuo from './models/Residuo.js';
import Horario from './models/Horario.js';
import Incidente from './models/Incidente.js';
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

  // ── Zonas — los 8 distritos de la provincia del Cusco ─────────────────────
  const zonasDef = [
    { nombre: 'Centro Histórico', distrito: 'Cusco', color: '#58a6ff', geometry: caja(-71.9950, -13.5300, -71.9650, -13.4950) },
    { nombre: 'San Blas', distrito: 'Cusco', color: '#3fb950', geometry: caja(-71.9650, -13.5250, -71.9400, -13.4950) },
    { nombre: 'Wanchaq', distrito: 'Wanchaq', color: '#d29922', geometry: caja(-71.9700, -13.5550, -71.9400, -13.5250) },
    { nombre: 'Santiago', distrito: 'Santiago', color: '#a371f7', geometry: caja(-72.0250, -13.5550, -71.9850, -13.5150) },
    // Ampliada para cubrir la Plaza de San Sebastián y el corredor de la Av. de la Cultura (UNSAAC)
    { nombre: 'San Sebastián', distrito: 'San Sebastián', color: '#f85149', geometry: caja(-71.9400, -13.5550, -71.8700, -13.4950) },
    { nombre: 'San Jerónimo', distrito: 'San Jerónimo', color: '#39c5cf', geometry: caja(-71.8700, -13.5600, -71.8300, -13.5100) },
    // Poroy — pueblo camino a la estación de tren (Machu Picchu), noroeste de Santiago
    { nombre: 'Poroy', distrito: 'Poroy', color: '#e3b341', geometry: caja(-72.0700, -13.5150, -72.0250, -13.4600) },
    // Saylla — pueblo de las chicharronerías, en la carretera a Urcos, sureste de San Jerónimo
    { nombre: 'Saylla', distrito: 'Saylla', color: '#ec6cb9', geometry: caja(-71.8900, -13.6200, -71.8400, -13.5600) },
    // Ccorca — el distrito más rural y alejado, al suroeste de Santiago
    { nombre: 'Ccorca', distrito: 'Ccorca', color: '#6e40c9', geometry: caja(-72.1300, -13.6600, -72.0250, -13.5550) },
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
    { nombre: 'Rosa Mamani', dni: '70010005' },
    { nombre: 'Teodoro Quispe', dni: '70010006' },
    { nombre: 'Martina Ccahuana', dni: '70010007' },
    { nombre: 'Rocío Farfán', dni: '70010008' },
    { nombre: 'Alberto Cusi', dni: '70010009' },
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
    // Vive junto a la Av. de la Cultura, cerca de la UNSAAC
    { nombre: 'Ana Ttito', dni: '70020004', zona: 'San Sebastián', latitud: -13.5498, longitud: -71.9285 },
    // Vive cerca de la Plaza de San Sebastián
    { nombre: 'Willy Apaza', dni: '70020005', zona: 'San Sebastián', latitud: -13.5345, longitud: -71.8797 },
    // Vive junto a la Av. de los Incas, San Jerónimo
    { nombre: 'Elena Quispe', dni: '70020006', zona: 'San Jerónimo', latitud: -13.5420, longitud: -71.8575 },
    // Vive cerca de la Plaza y estación de tren de Poroy
    { nombre: 'Percy Fernández', dni: '70020007', zona: 'Poroy', latitud: -13.4886, longitud: -72.0347 },
    // Vive en la carretera a Urcos, Saylla
    { nombre: 'Katty Sallo', dni: '70020008', zona: 'Saylla', latitud: -13.5883, longitud: -71.8637 },
    // Vive en el centro de Ccorca
    { nombre: 'Wilber Sutta', dni: '70020009', zona: 'Ccorca', latitud: -13.6167, longitud: -72.0667 },
    // Vive en la Cuesta San Blas
    { nombre: 'Nayra Puma', dni: '70020010', zona: 'San Blas', latitud: -13.5140, longitud: -71.9530 },
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
        { nombre: 'Av. La Cultura (Wanchaq)', latitud: -13.5260, longitud: -71.9480, horaEstimada: '15:00' },
      ],
    },
    { upsert: true }
  );
  await Ruta.findOneAndUpdate(
    { nombre: 'Ruta San Sebastián - Av. Cultura' },
    {
      nombre: 'Ruta San Sebastián - Av. Cultura', camionPlaca: 'X3C-789', operador: operadores[2]._id, zona: zonas['San Sebastián']._id,
      estado: 'PENDIENTE',
      paradas: [
        { nombre: 'Av. de la Cultura - UNSAAC', latitud: -13.5498, longitud: -71.9285, horaEstimada: '15:00' },
        { nombre: 'Puente Angostura', latitud: -13.5420, longitud: -71.9080, horaEstimada: '15:20' },
        { nombre: 'Plaza de San Sebastián', latitud: -13.5345, longitud: -71.8797, horaEstimada: '15:45' },
      ],
    },
    { upsert: true }
  );
  await Ruta.findOneAndUpdate(
    { nombre: 'Ruta San Jerónimo Mañana' },
    {
      nombre: 'Ruta San Jerónimo Mañana', camionPlaca: 'X4D-012', operador: operadores[3]._id, zona: zonas['San Jerónimo']._id,
      estado: 'PENDIENTE',
      paradas: [
        { nombre: 'Av. de los Incas', latitud: -13.5420, longitud: -71.8575, horaEstimada: '07:00' },
        { nombre: 'Plaza de San Jerónimo', latitud: -13.5432, longitud: -71.8590, horaEstimada: '07:30' },
      ],
    },
    { upsert: true }
  );
  await Ruta.findOneAndUpdate(
    { nombre: 'Ruta Poroy' },
    {
      nombre: 'Ruta Poroy', camionPlaca: 'X5E-345', operador: operadores[4]._id, zona: zonas['Poroy']._id,
      estado: 'PENDIENTE',
      paradas: [
        { nombre: 'Estación de tren de Poroy', latitud: -13.4886, longitud: -72.0347, horaEstimada: '08:00' },
        { nombre: 'Plaza de Poroy', latitud: -13.4870, longitud: -72.0330, horaEstimada: '08:20' },
      ],
    },
    { upsert: true }
  );
  await Ruta.findOneAndUpdate(
    { nombre: 'Ruta Saylla' },
    {
      nombre: 'Ruta Saylla', camionPlaca: 'X6F-678', operador: operadores[5]._id, zona: zonas['Saylla']._id,
      estado: 'PENDIENTE',
      paradas: [
        { nombre: 'Carretera a Urcos - Saylla', latitud: -13.5883, longitud: -71.8637, horaEstimada: '09:00' },
        { nombre: 'Plaza de Saylla', latitud: -13.5870, longitud: -71.8620, horaEstimada: '09:20' },
      ],
    },
    { upsert: true }
  );
  await Ruta.findOneAndUpdate(
    { nombre: 'Ruta Ccorca' },
    {
      nombre: 'Ruta Ccorca', camionPlaca: 'X7G-901', operador: operadores[6]._id, zona: zonas['Ccorca']._id,
      estado: 'PENDIENTE',
      paradas: [
        { nombre: 'Plaza de Ccorca', latitud: -13.6167, longitud: -72.0667, horaEstimada: '08:00' },
      ],
    },
    { upsert: true }
  );
  await Ruta.findOneAndUpdate(
    { nombre: 'Ruta San Blas' },
    {
      nombre: 'Ruta San Blas', camionPlaca: 'X8H-234', operador: operadores[7]._id, zona: zonas['San Blas']._id,
      estado: 'PENDIENTE',
      paradas: [
        { nombre: 'Cuesta San Blas', latitud: -13.5140, longitud: -71.9530, horaEstimada: '07:00' },
        { nombre: 'Calle Tandapata', latitud: -13.5120, longitud: -71.9560, horaEstimada: '07:20' },
      ],
    },
    { upsert: true }
  );
  await Ruta.findOneAndUpdate(
    { nombre: 'Ruta Santiago' },
    {
      nombre: 'Ruta Santiago', camionPlaca: 'X9I-567', operador: operadores[8]._id, zona: zonas['Santiago']._id,
      estado: 'PENDIENTE',
      paradas: [
        { nombre: 'Mercado de Santiago', latitud: -13.5350, longitud: -72.0050, horaEstimada: '06:30' },
        { nombre: 'Av. Belén', latitud: -13.5300, longitud: -71.9980, horaEstimada: '07:00' },
      ],
    },
    { upsert: true }
  );
  console.log('✓ rutas: 9');

  // ── Horarios de recojo por zona (realistas, con ventana horaria y sector) ─
  // diaSemana: 0=Domingo … 6=Sábado. Cada "sector" es una avenida/tramo del
  // distrito; una misma zona puede tener varios sectores con días distintos.
  // Se limpia la colección primero: el esquema de horarios de la demo cambió
  // (se agregó sector/horaFin) y dejaba duplicados obsoletos con upsert.
  await Horario.deleteMany({});
  const horariosDef = [
    // Centro Histórico — recojo temprano en el casco antiguo
    { zona: 'Centro Histórico', sector: 'Plaza de Armas y alrededores', diaSemana: 1, hora: '06:00', horaFin: '08:00', tipoResiduo: 'NO_RECICLABLE' },
    { zona: 'Centro Histórico', sector: 'Plaza de Armas y alrededores', diaSemana: 3, hora: '06:00', horaFin: '08:00', tipoResiduo: 'ORGANICO' },
    { zona: 'Centro Histórico', sector: 'Plaza de Armas y alrededores', diaSemana: 5, hora: '06:00', horaFin: '08:00', tipoResiduo: 'RECICLABLE' },

    // San Blas — barrio artesanal
    { zona: 'San Blas', sector: 'San Blas', diaSemana: 2, hora: '07:00', horaFin: '10:00', tipoResiduo: 'NO_RECICLABLE' },
    { zona: 'San Blas', sector: 'San Blas', diaSemana: 4, hora: '07:00', horaFin: '10:00', tipoResiduo: 'RECICLABLE' },

    // Wanchaq — sector central en la tarde + Av. de la Cultura (tramo Wanchaq)
    { zona: 'Wanchaq', sector: 'Wanchaq centro', diaSemana: 1, hora: '14:00', horaFin: '17:00', tipoResiduo: 'NO_RECICLABLE' },
    { zona: 'Wanchaq', sector: 'Wanchaq centro', diaSemana: 3, hora: '14:00', horaFin: '17:00', tipoResiduo: 'ORGANICO' },
    { zona: 'Wanchaq', sector: 'Av. de la Cultura (tramo Wanchaq)', diaSemana: 6, hora: '08:00', horaFin: '11:00', tipoResiduo: 'RECICLABLE' },

    // Santiago
    { zona: 'Santiago', sector: 'Santiago', diaSemana: 2, hora: '06:30', horaFin: '09:30', tipoResiduo: 'NO_RECICLABLE' },
    { zona: 'Santiago', sector: 'Santiago', diaSemana: 5, hora: '06:30', horaFin: '09:30', tipoResiduo: 'ORGANICO' },

    // San Sebastián — dos sectores con días distintos:
    //  · Av. de la Cultura / UNSAAC: lunes, miércoles y viernes a las 3pm
    //  · Centro de San Sebastián: martes y jueves, de 7am a 11am
    { zona: 'San Sebastián', sector: 'Av. de la Cultura (UNSAAC)', diaSemana: 1, hora: '15:00', horaFin: '16:00', tipoResiduo: 'NO_RECICLABLE' },
    { zona: 'San Sebastián', sector: 'Av. de la Cultura (UNSAAC)', diaSemana: 3, hora: '15:00', horaFin: '16:00', tipoResiduo: 'ORGANICO' },
    { zona: 'San Sebastián', sector: 'Av. de la Cultura (UNSAAC)', diaSemana: 5, hora: '15:00', horaFin: '16:00', tipoResiduo: 'RECICLABLE' },
    { zona: 'San Sebastián', sector: 'Centro de San Sebastián', diaSemana: 2, hora: '07:00', horaFin: '11:00', tipoResiduo: 'NO_RECICLABLE' },
    { zona: 'San Sebastián', sector: 'Centro de San Sebastián', diaSemana: 4, hora: '07:00', horaFin: '11:00', tipoResiduo: 'RECICLABLE' },

    // San Jerónimo — lunes y martes en la mañana (Av. de los Incas)
    { zona: 'San Jerónimo', sector: 'Av. de los Incas', diaSemana: 1, hora: '07:00', horaFin: '10:00', tipoResiduo: 'NO_RECICLABLE' },
    { zona: 'San Jerónimo', sector: 'Av. de los Incas', diaSemana: 2, hora: '07:00', horaFin: '10:00', tipoResiduo: 'ORGANICO' },

    // Poroy — pueblo pequeño, recojo 2 veces por semana
    { zona: 'Poroy', sector: 'Poroy centro / Estación de tren', diaSemana: 3, hora: '08:00', horaFin: '10:00', tipoResiduo: 'NO_RECICLABLE' },
    { zona: 'Poroy', sector: 'Poroy centro / Estación de tren', diaSemana: 6, hora: '08:00', horaFin: '10:00', tipoResiduo: 'RECICLABLE' },

    // Saylla — pueblo de chicharronerías; mucho orgánico por los restaurantes, fin de semana con más turismo
    { zona: 'Saylla', sector: 'Carretera a Urcos', diaSemana: 4, hora: '09:00', horaFin: '11:00', tipoResiduo: 'ORGANICO' },
    { zona: 'Saylla', sector: 'Carretera a Urcos', diaSemana: 0, hora: '09:00', horaFin: '11:00', tipoResiduo: 'NO_RECICLABLE' },

    // Ccorca — el más rural y alejado: una sola vez por semana, ventana amplia
    { zona: 'Ccorca', sector: 'Ccorca centro', diaSemana: 5, hora: '08:00', horaFin: '11:00', tipoResiduo: 'NO_RECICLABLE' },
  ];
  for (const h of horariosDef) {
    const zonaId = zonas[h.zona]._id;
    await Horario.findOneAndUpdate(
      { zona: zonaId, diaSemana: h.diaSemana, hora: h.hora, sector: h.sector },
      { ...h, zona: zonaId, activo: true },
      { upsert: true }
    );
  }
  console.log('✓ horarios:', horariosDef.length);

  // ── Registros de recolección (para reportes/estadísticas) ────────────────
  const hoy = new Date();
  const mes = hoy.getMonth() + 1, anio = hoy.getFullYear();
  const recolecciones = [
    ['Centro Histórico', 'ORGANICO', 1250], ['Centro Histórico', 'RECICLABLE', 640], ['Centro Histórico', 'NO_RECICLABLE', 2100],
    ['San Blas', 'ORGANICO', 480], ['San Blas', 'RECICLABLE', 310],
    ['Wanchaq', 'ORGANICO', 980], ['Wanchaq', 'NO_RECICLABLE', 1500], ['Wanchaq', 'PELIGROSO', 45],
    ['Santiago', 'NO_RECICLABLE', 1750], ['Santiago', 'RECICLABLE', 220],
    ['San Sebastián', 'ORGANICO', 860], ['San Sebastián', 'NO_RECICLABLE', 1320],
    ['San Jerónimo', 'ORGANICO', 540], ['San Jerónimo', 'NO_RECICLABLE', 690],
    ['Poroy', 'NO_RECICLABLE', 210], ['Poroy', 'RECICLABLE', 90],
    ['Saylla', 'ORGANICO', 380], ['Saylla', 'NO_RECICLABLE', 160],
    ['Ccorca', 'NO_RECICLABLE', 120],
  ];
  for (const [z, cat, kg] of recolecciones) {
    await Residuo.findOneAndUpdate(
      { nombre: `Recolección ${cat} ${z}`, mes, anio },
      { nombre: `Recolección ${cat} ${z}`, categoria: cat, zona: zonas[z]._id, pesoKg: kg, mes, anio, activo: false },
      { upsert: true }
    );
  }
  console.log('✓ recolecciones:', recolecciones.length);

  // ── Incidencias de ejemplo (para el ranking y reportes) ───────────────────
  const ciud1 = await Usuario.findOne({ email: 'ciudadano1@gmail.com' });
  if (ciud1 && (await Incidente.countDocuments()) === 0) {
    await Incidente.insertMany([
      { tipo: 'BASURA_ACUMULADA', descripcion: 'Basura acumulada en la esquina de la plaza', latitud: -13.5170, longitud: -71.9790, usuario: ciud1._id, zona: zonas['Centro Histórico']._id, estado: 'RESUELTO' },
      { tipo: 'RECOLECCION_NO_REALIZADA', descripcion: 'El camión no pasó este lunes', latitud: -13.5410, longitud: -71.9510, usuario: ciud1._id, zona: zonas['Wanchaq']._id, estado: 'PENDIENTE' },
      { tipo: 'CONTENEDOR_DANADO', descripcion: 'Contenedor con la tapa rota', latitud: -13.5340, longitud: -72.0040, usuario: ciud1._id, zona: zonas['Santiago']._id, estado: 'EN_PROCESO' },
    ]);
    console.log('✓ incidencias de ejemplo: 3');
  }

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
