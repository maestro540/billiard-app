import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
} from 'react-native';
import { getDebts } from '../api/client';
import { useFocusEffect } from '@react-navigation/native';

export default function DebtsScreen() {
  const [debts, setDebts] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadDebts = useCallback(async () => {
    try {
      const data = await getDebts();
      setDebts(data);
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось загрузить долги');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadDebts();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDebts();
    setRefreshing(false);
  };

  const renderDebt = ({ item: debt }) => (
    <View style={styles.debtCard}>
      <View style={styles.debtInfo}>
        <Text style={styles.debtorName}>{debt.from_player.name}</Text>
        <Text style={styles.debtArrow}>→</Text>
        <Text style={styles.creditorName}>{debt.to_player.name}</Text>
      </View>
      <Text style={styles.debtAmount}>{debt.amount} ₽</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={debts}
        keyExtractor={(item, index) => `${item.from_player.id}-${item.to_player.id}-${index}`}
        renderItem={renderDebt}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListHeaderComponent={
          debts.length > 0 && (
            <View style={styles.header}>
              <Text style={styles.headerText}>Кто кому должен</Text>
            </View>
          )
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🎉</Text>
            <Text style={styles.emptyText}>Долгов нет!</Text>
            <Text style={styles.emptySubtext}>Все расчёты закрыты</Text>
          </View>
        }
        contentContainerStyle={debts.length === 0 && styles.emptyContainer}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  header: {
    padding: 16,
  },
  headerText: {
    color: '#888',
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  debtCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#16213e',
    marginHorizontal: 12,
    marginBottom: 12,
    borderRadius: 16,
    padding: 16,
  },
  debtInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  debtorName: {
    color: '#e94560',
    fontSize: 16,
    fontWeight: '600',
  },
  debtArrow: {
    color: '#666',
    fontSize: 20,
    marginHorizontal: 12,
  },
  creditorName: {
    color: '#4ecca3',
    fontSize: 16,
    fontWeight: '600',
  },
  debtAmount: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  emptyEmoji: {
    fontSize: 60,
    marginBottom: 16,
  },
  emptyText: {
    color: '#4ecca3',
    fontSize: 24,
    fontWeight: 'bold',
  },
  emptySubtext: {
    color: '#666',
    fontSize: 14,
    marginTop: 8,
  },
});
