import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Image, View } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';

import HomeScreen from '../screens/HomeScreen';
import SearchScreen from '../screens/SearchScreen';
import OrganizationScreen from '../screens/OrganizationScreen';
import MessagesScreen from '../screens/MessagesScreen';
import ProfileScreen from '../screens/ProfileScreen';
import OtherProfileScreen from '../screens/OtherProfileScreen';
import OrganizationProfileScreen from '../screens/OrganizationProfileScreen';
import CreateOrganizationScreen from '../screens/CreateOrganizationScreen';
import OrganizationSettingsScreen from '../screens/OrganizationSettingsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import ChatScreen from '../screens/ChatScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const MainStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen name="OtherProfile" component={OtherProfileScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="ChatScreen" component={ChatScreen} />
      <Stack.Screen name="OrganizationProfile" component={OrganizationProfileScreen} />
      <Stack.Screen name="CreateOrganization" component={CreateOrganizationScreen} />
      <Stack.Screen name="OrganizationSettings" component={OrganizationSettingsScreen} />
    </Stack.Navigator>
  );
};

const MainTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: '#EBEBEB',
        },
        tabBarItemStyle: {
          flex: 1,
        },
        tabBarIconStyle: { marginTop: 10, marginBottom: 0 },
        tabBarActiveTintColor: '#2A2A2A',
      }}
    >
      <Tab.Screen
        name="Дом"
        component={HomeScreen}
        options={{
          headerShown: false,
          tabBarLabel: () => null,
          tabBarIcon: ({ color }) => (
            <Image
              source={require('../assets/tab_icons/home_ico.png')}
              style={{ width: 34, height: 34, tintColor: color }}
              resizeMode="contain"
            />
          ),
        }}
      />
      <Tab.Screen
        name="Поиск"
        component={SearchScreen}
        options={{
          headerShown: false,
          tabBarLabel: () => null,
          tabBarIcon: ({ color }) => (
            <Image
              source={require('../assets/tab_icons/search_ico.png')}
              style={{ width: 34, height: 34, tintColor: color }}
              resizeMode="contain"
            />
          ),
        }}
      />
      <Tab.Screen
        name="Организация"
        component={OrganizationScreen}
        options={{
          headerShown: false,
          tabBarLabel: () => null,
          tabBarIcon: ({ color }) => (
            <Image
              source={require('../assets/tab_icons/organization_ico.png')}
              style={{ width: 34, height: 34, tintColor: color }}
              resizeMode="contain"
            />
          ),
        }}
      />
      <Tab.Screen
        name="Сообщения"
        component={MessagesScreen}
        options={{
          headerShown: false,
          tabBarLabel: () => null,
          tabBarIcon: ({ color }) => (
            <Image
              source={require('../assets/tab_icons/messages_ico.png')}
              style={{ width: 34, height: 34, tintColor: color }}
              resizeMode="contain"
            />
          ),
        }}
      />
      <Tab.Screen
        name="Профиль"
        component={ProfileScreen}
        options={{
          headerShown: false,
          tabBarLabel: () => null,
          tabBarIcon: ({ color }) => (
            <Image
              source={require('../assets/tab_icons/profile_ico.png')}
              style={{ width: 34, height: 34, tintColor: color }}
              resizeMode="contain"
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default MainStack;