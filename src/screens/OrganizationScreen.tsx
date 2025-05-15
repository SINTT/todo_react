import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Image, TouchableOpacity, StatusBar, ScrollView } from 'react-native';
import { Text } from '../components/CustomText';
import { api } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const OrganizationScreen = ({navigation}: any) => {
  const [organization, setOrganization] = useState<any>(null);
  const [userRole, setUserRole] = useState<string>('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    checkOrganization();
  }, []);

  const checkOrganization = async () => {
    try {
      const userDataStr = await AsyncStorage.getItem('userToken');
      const userData = userDataStr ? JSON.parse(userDataStr) : null;

      setCurrentUser(userData); // Set current user data

      if (!userData?.organization_id) {
        setOrganization(null);
        setLoading(false);
        return;
      }

      const response = await api.get(`/api/organizations/${userData.organization_id}`);
      
      if (response.data.success) {
        setOrganization(response.data.organization);
        setUserRole(userData.role);
        setIsAdmin(userData.role === 'Admin');
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error checking organization:', error);
      setLoading(false);
    }
  };

  const handleLeaveOrganization = async () => {
    try {
      const response = await api.post(`/api/organizations/${organization.organization_id}/leave`, {
        userId: currentUser.user_id
      });
      
      if (response.data.success) {
        const userData = { ...currentUser, organization_id: null, role: 'User' };
        await AsyncStorage.setItem('userToken', JSON.stringify(userData));
        navigation.replace('Main');
      }
    } catch (error) {
      console.error('Error leaving organization:', error);
    }
  };

  const renderNoOrganization = () => (
    <View style={styles.noOrgContainer}>
      
      <Text semiBold style={styles.noOrgTitle}>
        Вы пока не состоите в организации
      </Text>
      <Text style={styles.noOrgDescription}>
        Присоединитесь к существующей организации или создайте свою
      </Text>
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.button}
          onPress={() => navigation.navigate('Поиск')}
        >
          <Text semiBold style={styles.buttonText}>
            Найти организацию
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.button, styles.buttonPrimary]}
          onPress={() => navigation.navigate('CreateOrganization')}
        >
          <Text semiBold style={[styles.buttonText, styles.buttonTextPrimary]}>
            Создать организацию
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderOrganizationInfo = () => (
    <View style={styles.orgContainer}>
      <View style={styles.orgHeader}>
        <Image
          source={
            organization.organization_image
              ? { uri: organization.organization_image }
              : require('../assets/images/avatar.png')
          }
          style={styles.orgImage}
        />
        <Text semiBold style={styles.orgName}>
          {organization.organization_name}
        </Text>
        <Text style={styles.orgDescription}>
          {organization.description || 'Нет описания'}
        </Text>
      </View>

      {(isAdmin || userRole === 'Manager') ? (
        <TouchableOpacity 
          style={styles.settingsButton}
          onPress={() => navigation.navigate('OrganizationSettings')}
        >
          <Image
            source={require('../assets/icons/settings.png')}
            style={styles.settingsIcon}
          />
          <Text semiBold style={styles.settingsText}>
            Настройки организации
          </Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity 
          style={styles.leaveButton}
          onPress={handleLeaveOrganization}
        >
          <Text semiBold style={styles.leaveButtonText}>
            Покинуть организацию
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="gray" />
        <View style={styles.header}>
          <Text semiBold style={styles.headerTitle}>Организация</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text>Загрузка...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="gray" />
      <View style={styles.header}>
        <Text semiBold style={styles.headerTitle}>Организация</Text>
      </View>
      {organization ? renderOrganizationInfo() : renderNoOrganization()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    backgroundColor: '#F3F6FB',
    height: 74,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginTop: StatusBar.currentHeight,
  },
  headerTitle: {
    fontSize: 24,
    color: '#2A2A2A',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noOrgContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  noOrgImage: {
    width: 200,
    height: 200,
    marginBottom: 24,
  },
  noOrgTitle: {
    fontSize: 20,
    color: '#2A2A2A',
    marginBottom: 8,
  },
  noOrgDescription: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 32,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  button: {
    width: '100%',
    height: 56,
    borderRadius: 16,
    backgroundColor: '#F3F6FB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonPrimary: {
    backgroundColor: '#2A2A2A',
  },
  buttonText: {
    fontSize: 16,
    color: '#2A2A2A',
  },
  buttonTextPrimary: {
    color: '#FFFFFF',
  },
  orgContainer: {
    flex: 1,
    padding: 24,
  },
  orgHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  orgImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
  },
  orgName: {
    fontSize: 24,
    color: '#2A2A2A',
    marginBottom: 8,
  },
  orgDescription: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
  },
  settingsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F3F6FB',
    borderRadius: 16,
    gap: 12,
  },
  settingsIcon: {
    width: 24,
    height: 24,
    tintColor: '#2A2A2A',
  },
  settingsText: {
    fontSize: 16,
    color: '#2A2A2A',
  },
  leaveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFE5E5',
    borderRadius: 16,
    justifyContent: 'center',
  },
  leaveButtonText: {
    fontSize: 16,
    color: '#FF3B30',
  },
});

export default OrganizationScreen;
