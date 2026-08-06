import { validarRegistro, validarLogin, normalizarEmail, validarDni } from '../src/validaciones.js';

describe('validarRegistro (POST /api/auth/register)', () => {
  test('acepta un registro completo y válido', () => {
    const r = validarRegistro({ nombre: 'Juan Pérez', email: 'juan@gmail.com', password: 'secreto123' });
    expect(r.valido).toBe(true);
    expect(r.error).toBeNull();
  });

  test('rechaza si falta el nombre', () => {
    const r = validarRegistro({ email: 'juan@gmail.com', password: 'secreto123' });
    expect(r.valido).toBe(false);
    expect(r.error).toBe('Nombre, email y contraseña son obligatorios');
  });

  test('rechaza si falta el email', () => {
    const r = validarRegistro({ nombre: 'Juan', password: 'secreto123' });
    expect(r.valido).toBe(false);
    expect(r.error).toBe('Nombre, email y contraseña son obligatorios');
  });

  test('rechaza si falta la contraseña', () => {
    const r = validarRegistro({ nombre: 'Juan', email: 'juan@gmail.com' });
    expect(r.valido).toBe(false);
  });

  test('rechaza contraseña de menos de 6 caracteres', () => {
    const r = validarRegistro({ nombre: 'Juan', email: 'juan@gmail.com', password: '12345' });
    expect(r.valido).toBe(false);
    expect(r.error).toBe('La contraseña debe tener al menos 6 caracteres');
  });

  test('acepta contraseña de exactamente 6 caracteres (límite)', () => {
    const r = validarRegistro({ nombre: 'Juan', email: 'juan@gmail.com', password: '123456' });
    expect(r.valido).toBe(true);
  });

  test('rechaza un body vacío', () => {
    expect(validarRegistro({}).valido).toBe(false);
    expect(validarRegistro().valido).toBe(false);
  });
});

describe('validarLogin (POST /api/auth/login)', () => {
  test('acepta email y contraseña presentes', () => {
    const r = validarLogin({ email: 'admin@residuos.cusco.gob.pe', password: 'admin123' });
    expect(r.valido).toBe(true);
    expect(r.error).toBeNull();
  });

  test('rechaza si falta el email', () => {
    const r = validarLogin({ password: 'admin123' });
    expect(r.valido).toBe(false);
    expect(r.error).toBe('Email y contraseña requeridos');
  });

  test('rechaza si falta la contraseña', () => {
    const r = validarLogin({ email: 'admin@residuos.cusco.gob.pe' });
    expect(r.valido).toBe(false);
    expect(r.error).toBe('Email y contraseña requeridos');
  });

  test('rechaza un body vacío', () => {
    expect(validarLogin({}).valido).toBe(false);
    expect(validarLogin().valido).toBe(false);
  });
});

describe('normalizarEmail', () => {
  test('convierte a minúsculas', () => {
    expect(normalizarEmail('Juan.Perez@GMAIL.COM')).toBe('juan.perez@gmail.com');
  });

  test('deja igual un email ya en minúsculas', () => {
    expect(normalizarEmail('ciudadano1@gmail.com')).toBe('ciudadano1@gmail.com');
  });
});

describe('validarDni (GET /api/dni/:dni)', () => {
  test('acepta un DNI de 8 dígitos', () => {
    expect(validarDni('12345678')).toBe(true);
    expect(validarDni('00000001')).toBe(true);
  });

  test('rechaza menos de 8 dígitos', () => {
    expect(validarDni('1234567')).toBe(false);
  });

  test('rechaza más de 8 dígitos', () => {
    expect(validarDni('123456789')).toBe(false);
  });

  test('rechaza letras y caracteres no numéricos', () => {
    expect(validarDni('1234567a')).toBe(false);
    expect(validarDni('12.45678')).toBe(false);
  });

  test('rechaza cadena vacía', () => {
    expect(validarDni('')).toBe(false);
  });
});
