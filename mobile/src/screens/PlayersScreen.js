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
import { getPlayers, createPlayer, deletePlayer, getPlayerStats } from '../api/client';
import { useFocusEffect } from '@react-navigation/native';

export default function PlayersScreen() {
  const [players, setPlayers] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [statsModalVisible, setStatsModalVisible] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPlayerStats, setSelectedPlayerStats] = useState(null);

  const loadPlayers = useCallback(async () => {
    try {
      const data = await getPlayers();
      setPlayers(data);
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось загрузить игроков');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadPlayers();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPlayers();
    setRefreshing(false);
  };

  const handleCreatePlayer = async () => {
    if (!newPlayerName.trim()) {
      Alert.alert('Ошибка', 'Введи имя игрока');
      return;
    }

    try {
      await createPlayer(newPlayerName.trim());
      setModalVisible(false);
      setNewPlayerName('');
      loadPlayers();
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось создать игрока');
    }
  };

  const handleDeletePlayer = (player) => {
    Alert.alert(
      'Удалить игрока?',
      `Удалить ${player.name}? Это действие нельзя отменить.`,
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePlayer(player.id);
              loadPlayers();
            } catch (error) {
              Alert.alert('Ошибка', 'Не удалось удалить игрока');
            }
          },
        },
      ]
    );
  };

  const handleShowStats = async (player) => {
    try {
      const stats = await getPlayerStats(player.id);
      setSelectedPlayerStats(stats);
      setStatsModalVisible(true);
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось загрузить статистику');
    }
  };

  const renderPlayer = ({ item: player }) => (
    <TouchableOpacity
      style={styles.playerCard}
      onPress={() => handleShowStats(player)}
      onLongPress={() => handleDeletePlayer(player)}
    >
      <View style={styles.playerAvatar}>
        <Text style={styles.playerInitial}>
          {player.name.charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={styles.playerInfo}>
        <Text style={styles.playerName}>{player.name}</Text>
        <Text style={styles.playerHint}>Нажми для статистики</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={players}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderPlayer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Нет игроков</Text>
            <Text style={styles.emptySubtext}>Добавь первого игрока</Text>
          </View>
        }
        contentContainerStyle={players.length === 0 && styles.emptyContainer}
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* Модалка добавления игрока */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Новый игрок</Text>

            <TextInput
              style={styles.input}
              value={newPlayerName}
              onChangeText={setNewPlayerName}
              placeholder="Имя игрока"
              placeholderTextColor="#666"
              autoFocus
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setModalVisible(false);
                  setNewPlayerName('');
                }}
              >
                <Text style={styles.cancelButtonText}>Отмена</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.createButton}
                onPress={handleCreatePlayer}
              >
                <Text style={styles.createButtonText}>Добавить</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Модалка статистики */}
      <Modal
        visible={statsModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setStatsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedPlayerStats && (
              <>
                <Text style={styles.modalTitle}>{selectedPlayerStats.name}</Text>

                <View style={styles.statsGrid}>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{selectedPlayerStats.total_games}</Text>
                    <Text style={styles.statLabel}>Игр</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{selectedPlayerStats.wins}</Text>
                    <Text style={styles.statLabel}>Побед</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{selectedPlayerStats.losses}</Text>
                    <Text style={styles.statLabel}>Поражений</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{selectedPlayerStats.win_rate}%</Text>
                    <Text style={styles.statLabel}>Винрейт</Text>
                  </View>
                </View>

                <View style={styles.balanceSection}>
                  <Text style={styles.balanceLabel}>Баланс</Text>
                  <Text
                    style={[
                      styles.balanceValue,
                      parseFloat(selectedPlayerStats.balance) >= 0
                        ? styles.balancePositive
                        : styles.balanceNegative,
                    ]}
                  >
                    {parseFloat(selectedPlayerStats.balance) >= 0 ? '+' : ''}
                    {selectedPlayerStats.balance} ₽
                  </Text>
                </View>

                <View style={styles.moneyDetails}>
                  <Text style={styles.moneyWon}>
                    Выиграно: +{selectedPlayerStats.total_won} ₽
                  </Text>
                  <Text style={styles.moneyLost}>
                    Проиграно: -{selectedPlayerStats.total_lost} ₽
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setStatsModalVisible(false)}
                >
                  <Text style={styles.closeButtonText}>Закрыть</Text>
                </TouchableOpacity>
              </>
            )}
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
  playerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16213e',
    margin: 12,
    marginBottom: 0,
    borderRadius: 16,
    padding: 16,
  },
  playerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#4ecca3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerInitial: {
    color: '#1a1a2e',
    fontSize: 24,
    fontWeight: 'bold',
  },
  playerInfo: {
    marginLeft: 16,
  },
  playerName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  playerHint: {
    color: '#666',
    fontSize: 12,
    marginTop: 4,
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
  },
  modalTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statItem: {
    width: '48%',
    backgroundColor: '#0f3460',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#888',
    fontSize: 14,
    marginTop: 4,
  },
  balanceSection: {
    alignItems: 'center',
    marginVertical: 20,
  },
  balanceLabel: {
    color: '#888',
    fontSize: 14,
    marginBottom: 8,
  },
  balanceValue: {
    fontSize: 36,
    fontWeight: 'bold',
  },
  balancePositive: {
    color: '#4ecca3',
  },
  balanceNegative: {
    color: '#e94560',
  },
  moneyDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  moneyWon: {
    color: '#4ecca3',
    fontSize: 14,
  },
  moneyLost: {
    color: '#e94560',
    fontSize: 14,
  },
  closeButton: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#0f3460',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
  },
});
