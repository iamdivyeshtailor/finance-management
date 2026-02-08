import api from './api';

export const getSettings = () => api.get('/settings').then(res => res.data);

export const updateSettings = (data) => api.put('/settings', data).then(res => res.data);
