import { nombreDia, validarHorario, filtrarHorariosPorZona } from '../src/validaciones.js';

describe('nombreDia', () => {
  test('0 es Domingo y 6 es Sábado', () => {
    expect(nombreDia(0)).toBe('Domingo');
    expect(nombreDia(6)).toBe('Sábado');
  });

  test('devuelve los días intermedios correctos', () => {
    expect(nombreDia(1)).toBe('Lunes');
    expect(nombreDia(3)).toBe('Miércoles');
    expect(nombreDia(5)).toBe('Viernes');
  });

  test('devuelve null para valores fuera de rango', () => {
    expect(nombreDia(7)).toBeNull();
    expect(nombreDia(-1)).toBeNull();
  });
});

describe('validarHorario (POST /api/horarios)', () => {
  test('acepta un horario completo', () => {
    const r = validarHorario({ zona: 'zona-1', diaSemana: 2, hora: '07:00' });
    expect(r.valido).toBe(true);
    expect(r.error).toBeNull();
  });

  test('acepta diaSemana 0 (Domingo) — no debe tratarse como faltante', () => {
    const r = validarHorario({ zona: 'zona-1', diaSemana: 0, hora: '07:00' });
    expect(r.valido).toBe(true);
  });

  test('rechaza si falta la zona', () => {
    const r = validarHorario({ diaSemana: 2, hora: '07:00' });
    expect(r.valido).toBe(false);
    expect(r.error).toBe('zona, diaSemana y hora son requeridos');
  });

  test('rechaza si diaSemana es null o undefined', () => {
    expect(validarHorario({ zona: 'zona-1', diaSemana: null, hora: '07:00' }).valido).toBe(false);
    expect(validarHorario({ zona: 'zona-1', hora: '07:00' }).valido).toBe(false);
  });

  test('rechaza si falta la hora', () => {
    const r = validarHorario({ zona: 'zona-1', diaSemana: 2 });
    expect(r.valido).toBe(false);
    expect(r.error).toBe('zona, diaSemana y hora son requeridos');
  });

  test('rechaza un body vacío', () => {
    expect(validarHorario({}).valido).toBe(false);
    expect(validarHorario().valido).toBe(false);
  });
});

describe('filtrarHorariosPorZona (GET /api/horarios?zona=)', () => {
  const horarios = [
    { zona: 'zona-1', diaSemana: 1, hora: '07:00', activo: true },
    { zona: 'zona-1', diaSemana: 4, hora: '07:00', activo: false },
    { zona: 'zona-2', diaSemana: 2, hora: '08:30', activo: true },
    { zona: 'zona-2', diaSemana: 5, hora: '08:30', activo: true },
  ];

  test('sin zona devuelve todos los activos', () => {
    const r = filtrarHorariosPorZona(horarios);
    expect(r).toHaveLength(3);
    expect(r.every((h) => h.activo)).toBe(true);
  });

  test('con zona devuelve solo los activos de esa zona', () => {
    const r = filtrarHorariosPorZona(horarios, 'zona-2');
    expect(r).toHaveLength(2);
    expect(r.every((h) => h.zona === 'zona-2')).toBe(true);
  });

  test('excluye los horarios inactivos aunque coincida la zona', () => {
    const r = filtrarHorariosPorZona(horarios, 'zona-1');
    expect(r).toHaveLength(1);
    expect(r[0].diaSemana).toBe(1);
  });

  test('devuelve lista vacía si la zona no tiene horarios', () => {
    expect(filtrarHorariosPorZona(horarios, 'zona-99')).toHaveLength(0);
  });

  test('devuelve lista vacía con entrada vacía', () => {
    expect(filtrarHorariosPorZona([], 'zona-1')).toEqual([]);
  });
});
