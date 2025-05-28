import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Image, TouchableOpacity, StatusBar, ScrollView, RefreshControl } from 'react-native';
import { Text } from '../components/CustomText';
import { api } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const OrganizationScreen = ({navigation}: any) => {
  const [organization, setOrganization] = useState<any>(null);
  const [userRole, setUserRole] = useState<string>('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    checkOrganization();
  }, []);

  // Add focus listener
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      checkOrganization();
    });

    return unsubscribe;
  }, [navigation]);

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

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await checkOrganization();
    } finally {
      setRefreshing(false);
    }
  }, []);

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
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#00FF96"
          colors={['#00FF96']}
        />
      }
    >
      <View style={styles.headerBackground} />
      <View style={styles.content}>
        <View style={styles.noOrgContainer}>
          <Image 
            source={require('../assets/images/todo_simple.png')}
            style={{ width: 90, height: 90, marginBottom: 24 }}/>
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
    </ScrollView>
  );

  const renderOrganizationInfo = () => (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#00FF96"
          colors={['#00FF96']}
        />
      }
    >
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
          
          <View style={styles.infoContainer}>
            <Text semiBold style={styles.orgName}>
              {organization.organization_name}
            </Text>
            
            <View style={styles.descriptionContainer}>
              <Text style={styles.orgDescription}>
                {organization.description || 'Нет описания'}
              </Text>
            </View>
            
            {organization.website && (
              <View style={styles.websiteContainer}>
                <Image
                  source={require('../assets/icons/globe.png')}
                  style={styles.websiteIcon}
                />
                <Text style={styles.website}>
                  {organization.website}
                </Text>
              </View>
            )}
          </View>
        </View>

        {!isAdmin && userRole !== 'Manager' && (
          <View style={styles.socialActions}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.leaveButton]}
              onPress={handleLeaveOrganization}
            >
              <Image
                source={require('../assets/icons/exit.png')}
                style={styles.leaveIcon}
              />
              <Text semiBold style={styles.leaveButtonText}>
                Покинуть организацию
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
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
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  
  infoContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
    width: '100%',
  },

  orgName: {
    fontSize: 28,
    color: '#2A2A2A',
    marginTop: 24,
    marginBottom: 12,
    textAlign: 'center',
  },

  descriptionContainer: {
    backgroundColor: '#F3F6FB',
    borderRadius: 16,
    padding: 16,
    marginVertical: 12,
    width: '100%',
  },

  orgDescription: {
    fontSize: 16,
    color: '#666666',
    lineHeight: 24,
    textAlign: 'center',
  },

  websiteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F7FF',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginTop: 8,
  },

  websiteIcon: {
    width: 18,
    height: 18,
    marginRight: 8,
    tintColor: '#007AFF',
  },

  website: {
    fontSize: 14,
    color: '#007AFF',
    textDecorationLine: 'underline',
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  leaveIcon: {
    width: 20,
    height: 20,
    marginRight: 8,
    tintColor: '#FF3B30',
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
    avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 68,
  },
});

export default OrganizationScreen;
