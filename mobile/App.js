import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';

import GameScreen from './src/screens/GameScreen';
import PlayersScreen from './src/screens/PlayersScreen';
import DebtsScreen from './src/screens/DebtsScreen';
import HistoryScreen from './src/screens/HistoryScreen';

const Tab = createBottomTabNavigator();

// Простые иконки текстом (можно заменить на react-native-vector-icons)
const TabIcon = ({ label, focused }) => (
  <View style={styles.tabIcon}>
    <Text style={[styles.tabEmoji, focused && styles.tabEmojiActive]}>
      {label === 'Игра' && '🎱'}
      {label === 'Игроки' && '👥'}
      {label === 'Долги' && '💰'}
      {label === 'История' && '📜'}
    </Text>
  </View>
);

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused }) => (
            <TabIcon label={route.name} focused={focused} />
          ),
          tabBarActiveTintColor: '#4ecca3',
          tabBarInactiveTintColor: '#666',
          tabBarStyle: {
            backgroundColor: '#16213e',
            borderTopColor: '#0f3460',
            paddingBottom: 35,
            paddingTop: 0,
            height: 85,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            marginTop: 4,
          },
          headerStyle: {
            backgroundColor: '#16213e',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        })}
      >
        <Tab.Screen
          name="Игра"
          component={GameScreen}
          options={{ title: 'Текущая игра' }}
        />
        <Tab.Screen
          name="Игроки"
          component={PlayersScreen}
          options={{ title: 'Игроки' }}
        />
        <Tab.Screen
          name="Долги"
          component={DebtsScreen}
          options={{ title: 'Долги' }}
        />
        <Tab.Screen
          name="История"
          component={HistoryScreen}
          options={{ title: 'История игр' }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabEmoji: {
    fontSize: 24,
    opacity: 0.5,
  },
  tabEmojiActive: {
    opacity: 1,
  },
});
