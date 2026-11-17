import axios from 'axios';

interface FastApiErrorPayload {
  detail?: string | Array<{ msg: string; loc?: Array<string | number> }>;
}

/**
 * Centralizo el tratamiento de errores HTTP y de red para cumplir con el principio DRY
 * y garantizar trazabilidad mediante logging estructurado en toda la aplicación cliente.
 */
export function extractApiError(
  err: unknown,
  contextAction: string,
  fallbackMessage: string
): string {
  if (axios.isAxiosError<FastApiErrorPayload>(err)) {
    const status = err.response?.status;
    const detail = err.response?.data?.detail;

    console.error(`[Buscapromo Client Error] Contexto: ${contextAction}`, {
      status,
      code: err.code,
      url: err.config?.url,
      detail,
    });

    if (err.code === 'ECONNABORTED') {
      return 'La operación superó el tiempo límite de espera (10s). Verifica la conexión con el servidor.';
    }

    if (!err.response) {
      return 'Error de red: no se pudo contactar con la API en el puerto 8000. Verifica que Uvicorn esté activo.';
    }

    if (typeof detail === 'string') {
      return detail;
    }

    if (Array.isArray(detail) && detail.length > 0) {
      return detail[0].msg;
    }

    return `${fallbackMessage} (Código HTTP ${status}).`;
  }

  console.error(`[Buscapromo Runtime Error] Contexto: ${contextAction}`, err);
  return fallbackMessage;
}