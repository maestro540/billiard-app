import axios from 'axios';

// ВАЖНО: замени на свой IP адрес!
// Узнать IP: в терминале набери "ifconfig" и найди en0 -> inet
const API_URL = 'https://billiard-app-production.up.railway.app';

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ============== Players ==============

export const getPlayers = async () => {
  const response = await api.get('/players');
  return response.data;
};

export const createPlayer = async (name) => {
  const response = await api.post('/players', { name });
  return response.data;
};

export const getPlayerStats = async (playerId) => {
  const response = await api.get(`/players/${playerId}/stats`);
  return response.data;
};

export const deletePlayer = async (playerId) => {
  const response = await api.delete(`/players/${playerId}`);
  return response.data;
};

// ============== Games ==============

export const getGames = async (limit = 50) => {
  const response = await api.get(`/games?limit=${limit}`);
  return response.data;
};

export const getActiveGames = async () => {
  const response = await api.get('/games/active');
  return response.data;
};

export const createGame = async (player1Id, player2Id, breakerId, stake) => {
  const response = await api.post('/games', {
    player1_id: player1Id,
    player2_id: player2Id,
    breaker_id: breakerId,
    stake: parseFloat(stake),
  });
  return response.data;
};

export const finishGame = async (gameId, winnerId) => {
  const response = await api.post(`/games/${gameId}/finish`, {
    winner_id: winnerId,
  });
  return response.data;
};

export const deleteGame = async (gameId) => {
  const response = await api.delete(`/games/${gameId}`);
  return response.data;
};

// ============== Statistics ==============

export const getDebts = async () => {
  const response = await api.get('/debts');
  return response.data;
};

export const getHeadToHead = async (player1Id, player2Id) => {
  const response = await api.get(`/head-to-head/${player1Id}/${player2Id}`);
  return response.data;
};

export default api;
