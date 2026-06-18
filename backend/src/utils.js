// Envoltura de respuesta uniforme: { success, message, data }
export function ok(res, data, message = 'Operación exitosa', status = 200) {
  return res.status(status).json({ success: true, message, data });
}

export function fail(res, message = 'Error', status = 400) {
  return res.status(status).json({ success: false, message, data: null });
}
