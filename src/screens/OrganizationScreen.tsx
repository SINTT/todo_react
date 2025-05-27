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
    <View style={styles.container}>
      <View style={styles.headerBackground} />
      <View style={styles.content}>
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
      </View>
    </View>
  );

  const renderOrganizationInfo = () => (
    <View style={styles.container}>
      <View style={styles.headerBackground} />
      <View style={styles.header}>
        {(isAdmin || userRole === 'Manager') && (
          <TouchableOpacity 
            style={styles.settingsButton}
            onPress={() => navigation.navigate('OrganizationSettings')}
          >
            <Image 
              source={require('../assets/icons/settings.png')}
              style={{height: 28, width: 28, tintColor: 'black'}}
            />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.content}>
        <View style={styles.profileInfo}>
          <TouchableOpacity style={styles.avatarContainer}>
            <Image
              source={
                organization.organization_image
                  ? { uri: organization.organization_image }
                  : require('../assets/images/avatar.png')
              }
              style={styles.avatarImage}
            />
          </TouchableOpacity>
          <Text semiBold style={styles.orgName}>
            {organization.organization_name}
          </Text>
          <Text style={styles.orgDescription}>
            {organization.description || 'Нет описания'}
          </Text>
        </View>

        {!isAdmin && userRole !== 'Manager' && (
          <View style={styles.socialActions}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.leaveButton]}
              onPress={handleLeaveOrganization}
            >
              <Text semiBold style={styles.leaveButtonText}>
                Покинуть организацию
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="gray" />
        <View style={styles.loadingContainer}>
          <Text>Загрузка...</Text>
        </View>
      </View>
    );
  }

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="gray" />
      {organization ? renderOrganizationInfo() : renderNoOrganization()}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  headerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 200,
    backgroundColor: '#00FF96',
  },
  header: {
    height: 175,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'flex-end',
    padding: 24,
    marginTop: StatusBar.currentHeight,
  },
  content: {
    flex: 1,
    backgroundColor: '#fff',
    marginTop: -25,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
  },
  profileInfo: {
    alignItems: 'center',
    marginTop: -50,
  },
  avatarContainer: {
    width: 124,
    height: 124,
    borderRadius: 68,
    borderWidth: 6,
    borderColor: '#2A2A2A',
    padding: 3,
    backgroundColor: 'white',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 68,
  },
  settingsButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 24,
  },
  noOrgContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  noOrgTitle: {
    fontSize: 24,
    color: '#2A2A2A',
    marginBottom: 8,
    textAlign: 'center',
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
  orgName: {
    fontSize: 24,
    color: '#2A2A2A',
    marginTop: 16,
  },
  orgDescription: {
    fontSize: 16,
    color: '#9C9C9C',
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  socialActions: {
    width: '100%',
    padding: 12,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButton: {
    borderRadius: 16,
    paddingHorizontal: 25,
    height: 64,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 200,
  },
  leaveButton: {
    backgroundColor: '#FFE5E5',
  },
  leaveButtonText: {
    fontSize: 16,
    color: '#FF3B30',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default OrganizationScreen;
