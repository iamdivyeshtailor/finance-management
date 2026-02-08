import api from './api';

export const getCurrentReport = () =>
  api.get('/reports/current').then(res => res.data);

export const getMonthlyReport = (month, year) =>
  api.get('/reports/monthly', { params: { month, year } }).then(res => res.data);

export const getReportHistory = () =>
  api.get('/reports/history').then(res => res.data);
