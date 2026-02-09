import api from './api';

export const parseStatement = (file) => {
  const formData = new FormData();
  formData.append('statement', file);
  return api
    .post('/expenses/import/parse', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then((res) => res.data);
};

export const saveBulkExpenses = (transactions) =>
  api.post('/expenses/import/save', { transactions }).then((res) => res.data);
