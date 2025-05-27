import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import SplashScreen from './src/screens/SplashScreen';
import WelcomeScreen from './src/screens/WelcomeScreen';
import AuthScreen from './src/screens/AuthScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import MainNavigator from './src/navigation/MainNavigator';
import SettingsScreen from './src/screens/SettingsScreen';
import CreateTaskScreen from './src/screens/CreateTaskScreen';
import CreateOrganizationScreen from './src/screens/CreateOrganizationScreen';
import OrganizationSettingsScreen from './src/screens/OrganizationSettingsScreen';
import RequestionsOrganizationScreen from './src/screens/RequestionsOrganizationScreen';
import ParticipantsOrganizationScreen from './src/screens/ParticipantsOrganizationScreen';
import TaskScreen from './src/screens/TaskScreen';
import ChatScreen from './src/screens/ChatScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';

const Stack = createNativeStackNavigator();

function App(): React.JSX.Element {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{headerShown: false}}>
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="Auth" component={AuthScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Main" component={MainNavigator} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="CreateTask" component={CreateTaskScreen} />
        <Stack.Screen name="CreateOrganization" component={CreateOrganizationScreen} />
        <Stack.Screen name="OrganizationSettings" component={OrganizationSettingsScreen} />
        <Stack.Screen name="RequestionsOrganization" component={RequestionsOrganizationScreen} />
        <Stack.Screen name="ParticipantsOrganization" component={ParticipantsOrganizationScreen} />
        <Stack.Screen name="Task" component={TaskScreen} />
        <Stack.Screen name="ChatScreen" component={ChatScreen} />
        <Stack.Screen name="NotificationsScreen" component={NotificationsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default App;
