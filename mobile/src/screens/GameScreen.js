import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  TextInput,
  Alert,
  RefreshControl,
} from 'react-native';
import { getPlayers, getActiveGames, createGame, finishGame } from '../api/client';
import { useFocusEffect } from '@react-navigation/native';

export default function GameScreen() {
  const [players, setPlayers] = useState([]);
  const [activeGames, setActiveGames] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Форма новой игры
  const [player1, setPlayer1] = useState(null);
  const [player2, setPlayer2] = useState(null);
  const [breaker, setBreaker] = useState(null);
  const [stake, setStake] = useState('');

  const loadData = useCallback(async () => {
    try {
      const [playersData, gamesData] = await Promise.all([
        getPlayers(),
        getActiveGames(),
      ]);
      setPlayers(playersData);
      setActiveGames(gamesData);
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось загрузить данные. Проверь подключение к серверу.');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleCreateGame = async () => {
    if (!player1 || !player2 || !breaker || !stake) {
      Alert.alert('Ошибка', 'Заполни все поля');
      return;
    }
    if (player1.id === player2.id) {
      Alert.alert('Ошибка', 'Выбери разных игроков');
      return;
    }

    try {
      await createGame(player1.id, player2.id, breaker.id, stake);
      setModalVisible(false);
      resetForm();
      loadData();
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось создать игру');
    }
  };

  const handleFinishGame = async (game, winnerId) => {
    try {
      await finishGame(game.id, winnerId);
      loadData();
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось завершить игру');
    }
  };

  const resetForm = () => {
    setPlayer1(null);
    setPlayer2(null);
    setBreaker(null);
    setStake('');
  };

  const renderPlayerSelector = (selected, onSelect, exclude = null) => (
    <View style={styles.playerSelector}>
      {players
        .filter((p) => !exclude || p.id !== exclude.id)
        .map((player) => (
          <TouchableOpacity
            key={player.id}
            style={[
              styles.playerChip,
              selected?.id === player.id && styles.playerChipSelected,
            ]}
            onPress={() => onSelect(player)}
          >
            <Text
              style={[
                styles.playerChipText,
                selected?.id === player.id && styles.playerChipTextSelected,
              ]}
            >
              {player.name}
            </Text>
          </TouchableOpacity>
        ))}
    </View>
  );

  const renderActiveGame = ({ item: game }) => (
    <View style={styles.gameCard}>
      <View style={styles.gameHeader}>
        <Text style={styles.gameStake}>{game.stake} ₽</Text>
        <Text style={styles.gameBreaker}>🎱 {game.breaker.name}</Text>
      </View>
      
      <View style={styles.gamePlayers}>
        <TouchableOpacity
          style={styles.playerButton}
          onPress={() => handleFinishGame(game, game.player1.id)}
        >
          <Text style={styles.playerName}>{game.player1.name}</Text>
          <Text style={styles.winText}>Победил</Text>
        </TouchableOpacity>
        
        <Text style={styles.vs}>VS</Text>
        
        <TouchableOpacity
          style={styles.playerButton}
          onPress={() => handleFinishGame(game, game.player2.id)}
        >
          <Text style={styles.playerName}>{game.player2.name}</Text>
          <Text style={styles.winText}>Победил</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={activeGames}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderActiveGame}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Нет активных игр</Text>
            <Text style={styles.emptySubtext}>Нажми + чтобы начать</Text>
          </View>
        }
        contentContainerStyle={activeGames.length === 0 && styles.emptyContainer}
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Новая игра</Text>

            <Text style={styles.label}>Игрок 1</Text>
            {renderPlayerSelector(player1, setPlayer1)}

            <Text style={styles.label}>Игрок 2</Text>
            {renderPlayerSelector(player2, setPlayer2, player1)}

            <Text style={styles.label}>Кто разбивает</Text>
            {player1 && player2 ? (
              <View style={styles.playerSelector}>
                {[player1, player2].map((player) => (
                  <TouchableOpacity
                    key={player.id}
                    style={[
                      styles.playerChip,
                      breaker?.id === player.id && styles.playerChipSelected,
                    ]}
                    onPress={() => setBreaker(player)}
                  >
                    <Text
                      style={[
                        styles.playerChipText,
                        breaker?.id === player.id && styles.playerChipTextSelected,
                      ]}
                    >
                      {player.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <Text style={styles.hint}>Сначала выбери игроков</Text>
            )}

            <Text style={styles.label}>Ставка (₽)</Text>
            <TextInput
              style={styles.input}
              value={stake}
              onChangeText={setStake}
              keyboardType="numeric"
              placeholder="500"
              placeholderTextColor="#666"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setModalVisible(false);
                  resetForm();
                }}
              >
                <Text style={styles.cancelButtonText}>Отмена</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.createButton}
                onPress={handleCreateGame}
              >
                <Text style={styles.createButtonText}>Начать</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    borderRadius: 16,
    padding: 16,
  },
  gameHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  gameStake: {
    color: '#4ecca3',
    fontSize: 24,
    fontWeight: 'bold',
  },
  gameBreaker: {
    color: '#888',
    fontSize: 14,
  },
  gamePlayers: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  playerButton: {
    flex: 1,
    backgroundColor: '#0f3460',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  playerName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  winText: {
    color: '#4ecca3',
    fontSize: 12,
  },
  vs: {
    color: '#666',
    fontSize: 16,
    marginHorizontal: 12,
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
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4ecca3',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#4ecca3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  fabText: {
    color: '#1a1a2e',
    fontSize: 32,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#16213e',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '80%',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    color: '#888',
    fontSize: 14,
    marginBottom: 8,
    marginTop: 16,
  },
  playerSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  playerChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#0f3460',
    marginRight: 8,
    marginBottom: 8,
  },
  playerChipSelected: {
    backgroundColor: '#4ecca3',
  },
  playerChipText: {
    color: '#fff',
    fontSize: 14,
  },
  playerChipTextSelected: {
    color: '#1a1a2e',
    fontWeight: '600',
  },
  hint: {
    color: '#666',
    fontStyle: 'italic',
  },
  input: {
    backgroundColor: '#0f3460',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 18,
  },
  modalButtons: {
    flexDirection: 'row',
    marginTop: 24,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#666',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
  },
  createButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#4ecca3',
    alignItems: 'center',
  },
  createButtonText: {
    color: '#1a1a2e',
    fontSize: 16,
    fontWeight: '600',
  },
});
