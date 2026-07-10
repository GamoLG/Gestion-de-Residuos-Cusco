import { Router } from 'express';
import { autenticar } from '../middleware/auth.js';
import { ok, fail } from '../utils.js';

const router = Router();

const GEMINI_URL = (model) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
// Se intentan en orden: si un modelo está saturado (503) o sin cupo (429), pasa al siguiente
const MODELOS = [
  process.env.GEMINI_MODEL || 'gemini-3.5-flash',
  'gemini-3.1-flash-lite',
  'gemini-flash-lite-latest',
];

const SISTEMA = `Eres el asistente de segregación de residuos de la Municipalidad del Cusco (Perú).
Categorías oficiales: ORGÁNICO (verde), RECICLABLE (azul), NO RECICLABLE (negro), PELIGROSO (rojo).
Responde en español, breve (máximo 4 líneas), claro y amable, indicando SIEMPRE:
1) La categoría donde va el residuo. 2) Un consejo práctico de segregación.
Si la pregunta no es sobre residuos/reciclaje/limpieza, redirige amablemente al tema.`;

// Fallback local (sin clave de Gemini): clasificación por palabras clave
const REGLAS = [
  { cat: 'ORGÁNICO 🟢', kw: ['cáscara', 'cascara', 'comida', 'fruta', 'verdura', 'restos', 'jardín', 'jardin', 'hueso', 'pan', 'sobras', 'hierba', 'hoja'] },
  { cat: 'RECICLABLE 🔵', kw: ['botella', 'plástico', 'plastico', 'papel', 'cartón', 'carton', 'vidrio', 'lata', 'periódico', 'periodico', 'caja', 'envase', 'tetrapack', 'metal'] },
  { cat: 'PELIGROSO 🔴', kw: ['pila', 'batería', 'bateria', 'foco', 'medicamento', 'jeringa', 'aceite', 'pintura', 'químico', 'quimico', 'celular', 'electrónico', 'electronico'] },
  { cat: 'NO RECICLABLE ⚫', kw: ['pañal', 'panal', 'papel higiénico', 'higienico', 'toalla', 'colilla', 'tecnopor', 'cerámica', 'ceramica'] },
];

function respuestaLocal(pregunta) {
  const q = String(pregunta || '').toLowerCase();
  for (const r of REGLAS) {
    if (r.kw.some((k) => q.includes(k))) {
      return `Ese residuo va en la categoría ${r.cat}. Recuerda entregarlo limpio y seco cuando corresponda, en el horario de recojo de tu zona.`;
    }
  }
  return 'No pude identificar el residuo. Prueba describiéndolo mejor (ej. "botella de plástico", "cáscara de fruta", "pilas usadas") o revisa la guía en la pestaña Segregar.';
}

async function llamarGemini(parts) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  for (const modelo of MODELOS) {
    const r = await fetch(`${GEMINI_URL(modelo)}?key=${key}`, {
      method: 'POST',
      signal: AbortSignal.timeout(12000), // si el modelo no responde, probar el siguiente
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SISTEMA }] },
        contents: [{ role: 'user', parts }],
        generationConfig: {
          maxOutputTokens: 2048,
          temperature: 0.4,
          // sin razonamiento interno: respuesta directa y rápida
          thinkingConfig: { thinkingBudget: 0 },
        },
      }),
    }).catch(() => null);
    if (!r) continue;
    if (!r.ok) {
      console.error('gemini', modelo, r.status, (await r.text().catch(() => '')).slice(0, 200));
      continue; // probar el siguiente modelo
    }
    const j = await r.json();
    const salida = j?.candidates?.[0]?.content?.parts || [];
    const texto = salida.filter((p) => typeof p.text === 'string' && !p.thought).map((p) => p.text).join('');
    if (texto) return texto;
  }
  return null;
}

// POST /api/ia/segregar  { pregunta?, fotoBase64?, mimeType? }
// Chatbot de segregación (texto) y clasificación de residuo por foto (Gemini multimodal).
router.post('/segregar', autenticar, async (req, res) => {
  try {
    const { pregunta, fotoBase64, mimeType } = req.body;
    if (!pregunta && !fotoBase64) return fail(res, 'Envía una pregunta o una foto');

    const parts = [];
    if (fotoBase64) {
      parts.push({ inlineData: { mimeType: mimeType || 'image/jpeg', data: fotoBase64 } });
      parts.push({ text: pregunta || '¿Qué residuo es este y en qué categoría debo botarlo?' });
    } else {
      parts.push({ text: pregunta });
    }

    const texto = await llamarGemini(parts);
    if (texto) return ok(res, { respuesta: texto.trim(), fuente: 'gemini' });

    if (fotoBase64) {
      const motivo = process.env.GEMINI_API_KEY
        ? 'El servicio de IA está saturado en este momento. Intenta de nuevo en unos segundos.'
        : 'La clasificación por foto requiere configurar GEMINI_API_KEY en el servidor';
      return fail(res, motivo, 503);
    }
    return ok(res, { respuesta: respuestaLocal(pregunta), fuente: 'reglas' });
  } catch (e) {
    console.error('ia/segregar', e);
    return fail(res, 'No se pudo procesar la consulta de IA', 500);
  }
});

export default router;
