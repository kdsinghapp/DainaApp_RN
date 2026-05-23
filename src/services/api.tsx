const BASE_URL = 'https://aitechnotech.in/DAINA/api';

export const apiClient = async (url, options = {}) => {
  const response = await fetch(`${BASE_URL}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error('API Error');
  }

  return response.json();
};
