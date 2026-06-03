class ApiClient {
  private async _request<T>(method: string, url: string, body?: unknown, isForm = false): Promise<T> {
    const opts: RequestInit = {
      method,
      credentials: 'include',
    };

    if (body) {
      if (isForm) {
        opts.body = body as FormData;
      } else {
        opts.headers = { 'Content-Type': 'application/json' };
        opts.body    = JSON.stringify(body);
      }
    }

    const res  = await fetch(url, opts);
    const data = await res.json() as T & { error?: string };

    if (res.status === 401) {
      // Oturum bitti — login'e yönlendir
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
      throw new Error((data as { error?: string }).error || 'Oturum süresi doldu');
    }

    if (!res.ok) {
      throw new Error((data as { error?: string }).error || 'Sunucu hatası');
    }

    return data;
  }

  get<T = unknown>(url: string)                       { return this._request<T>('GET',    url); }
  post<T = unknown>(url: string, body?: unknown)       { return this._request<T>('POST',   url, body); }
  put<T = unknown>(url: string, body?: unknown)        { return this._request<T>('PUT',    url, body); }
  patch<T = unknown>(url: string, body?: unknown)      { return this._request<T>('PATCH',  url, body); }
  delete<T = unknown>(url: string)                     { return this._request<T>('DELETE', url); }
  upload<T = unknown>(url: string, formData: FormData) { return this._request<T>('POST',   url, formData, true); }
}

export const api = new ApiClient();
