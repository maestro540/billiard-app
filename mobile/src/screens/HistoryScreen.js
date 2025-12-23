import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
} from 'react-native';
import { getGames } from '../api/client';
import { useFocusEffect } from '@react-navigation/native';

export default function HistoryScreen() {
  const [games, setGames] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadGames = useCallback(async () => {
    try {
      const data = await getGames(100);
      // Фильтруем только завершённые игры
      setGames(data.filter(game => game.winner !== null));
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось загрузить историю');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadGames();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadGames();
    setRefreshing(false);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return `Сегодня, ${date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Вчера, ${date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
  };

  const renderGame = ({ item: game }) => {
    const isPlayer1Winner = game.winner?.id === game.player1.id;

    return (
      <View style={styles.gameCard}>
        <View style={styles.gameHeader}>
          <Text style={styles.gameDate}>{formatDate(game.finished_at || game.created_at)}</Text>
          <Text style={styles.gameStake}>{game.stake} ₽</Text>
        </View>

        <View style={styles.gamePlayers}>
          <View style={[styles.playerBlock, isPlayer1Winner && styles.winnerBlock]}>
            <Text style={[styles.playerName, isPlayer1Winner && styles.winnerName]}>
              {game.player1.name}
            </Text>
            {isPlayer1Winner && <Text style={styles.winnerBadge}>🏆</Text>}
          </View>

          <Text style={styles.vs}>vs</Text>

          <View style={[styles.playerBlock, !isPlayer1Winner && styles.winnerBlock]}>
            <Text style={[styles.playerName, !isPlayer1Winner && styles.winnerName]}>
              {game.player2.name}
            </Text>
            {!isPlayer1Winner && <Text style={styles.winnerBadge}>🏆</Text>}
          </View>
        </View>

        <Text style={styles.breakerInfo}>
          🎱 Разбивал: {game.breaker.name}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={games}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderGame}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>История пуста</Text>
            <Text style={styles.emptySubtext}>Сыграйте первую партию</Text>
          </View>
        }
        contentContainerStyle={games.length === 0 && styles.emptyContainer}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  gameCard: {
    backgroundColor: '#16213e',
    margin: 12,
    marginBottom: 0,
    borderRadius: 16,
    padding: 16,
  },
  gameHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  gameDate: {
    color: '#888',
    fontSize: 12,
  },
  gameStake: {
    color: '#4ecca3',
    fontSize: 16,
    fontWeight: 'bold',
  },
  gamePlayers: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  playerBlock: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#0f3460',
  },
  winnerBlock: {
    backgroundColor: '#1a4d3e',
  },
  playerName: {
    color: '#aaa',
    fontSize: 14,
  },
  winnerName: {
    color: '#4ecca3',
    fontWeight: '600',
  },
  winnerBadge: {
    marginLeft: 8,
  },
  vs: {
    color: '#444',
    fontSize: 12,
    marginHorizontal: 8,
  },
  breakerInfo: {
    color: '#666',
    fontSize: 12,
    textAlign: 'center',
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  emptyText: {
    color: '#666',
    fontSize: 20,
  },
  emptySubtext: {
    color: '#444',
    fontSize: 14,
    marginTop: 8,
  },
});
