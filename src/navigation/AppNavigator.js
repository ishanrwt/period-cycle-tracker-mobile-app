import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';

import DeveloperDashboard from '../screens/DeveloperDashboard';
import CycleCalendar from '../screens/CycleCalendar';
import CycleInsights from '../screens/CycleInsights';
import UserProfile from '../screens/UserProfile';

const Tab = createBottomTabNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;
            if (route.name === 'Today') {
              iconName = 'event';
            } else if (route.name === 'Cycle') {
              iconName = 'calendar-month';
            } else if (route.name === 'Insights') {
              iconName = 'bar-chart';
            } else if (route.name === 'Profile') {
              iconName = 'person';
            }
            return <MaterialIcons name={iconName} size={28} color={color} />;
          },
          tabBarActiveTintColor: '#7c5357',
          tabBarInactiveTintColor: '#888888',
          tabBarStyle: {
            backgroundColor: '#FFFFFF',
            borderTopWidth: 0,
            elevation: 10,
            shadowColor: '#000',
            shadowOpacity: 0.05,
            shadowOffset: { width: 0, height: -2 },
            height: 80,
            paddingBottom: 20,
            paddingTop: 10,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontFamily: 'Inter',
            fontWeight: '600',
          }
        })}
      >
        <Tab.Screen name="Today" component={DeveloperDashboard} />
        <Tab.Screen name="Cycle" component={CycleCalendar} />
        <Tab.Screen name="Insights" component={CycleInsights} />
        <Tab.Screen name="Profile" component={UserProfile} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
