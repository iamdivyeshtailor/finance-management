import api from './api';

export const getExpenses = (month, year) =>
  api.get('/expenses', { params: { month, year } }).then(res => res.data);

export const addExpense = (data) =>
  api.post('/expenses', data).then(res => res.data);

export const updateExpense = (id, data) =>
  api.put(`/expenses/${id}`, data).then(res => res.data);

export const deleteExpense = (id) =>
  api.delete(`/expenses/${id}`).then(res => res.data);
