const _base = (import.meta.env.VITE_API_URL || 'http://localhost:4000').replace(/\/$/, '');
const API_URL = _base.endsWith('/api') ? _base : `${_base}/api`;

const STATUS_MESSAGES = {
  400: 'Os dados enviados são inválidos. Verifique os campos e tente novamente.',
  401: 'Sua sessão expirou. Faça login novamente.',
  403: 'Você não tem permissão para realizar esta ação.',
  404: 'O recurso solicitado não foi encontrado.',
  429: 'Muitas tentativas em pouco tempo. Aguarde alguns minutos.',
  500: 'Erro interno no servidor. Tente novamente em alguns instantes.',
  502: 'Servidor temporariamente indisponível. Tente em alguns instantes.',
  503: 'Serviço indisponível no momento. Tente novamente em breve.',
  504: 'O servidor demorou muito para responder. Tente novamente.',
};

async function request(path, options = {}) {
  let res;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    });
  } catch {
    throw new Error('Não foi possível conectar ao servidor. Verifique sua conexão ou se o servidor está rodando.');
  }

  const contentType = res.headers.get('content-type');
  if (!contentType?.includes('application/json')) {
    throw new Error('Backend não está respondendo corretamente. Verifique se o servidor está rodando.');
  }

  const data = await res.json();

  if (!res.ok) {
    const serverMsg = data?.error;
    const fallback  = STATUS_MESSAGES[res.status] || `Erro inesperado (código ${res.status}).`;
    const err = new Error(serverMsg || fallback);
throw err;
  }

  return data;
}

export const api = {
  get:  (path)        => request(path),
  post: (path, body)  => request(path, { method: 'POST', body: JSON.stringify(body) }),
  put:  (path, body)  => request(path, { method: 'PUT',  body: JSON.stringify(body) }),
  del:  (path)        => request(path, { method: 'DELETE' }),
};
