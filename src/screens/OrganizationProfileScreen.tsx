import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Image, ScrollView, TouchableOpacity } from 'react-native';
import { Text } from '../components/CustomText';
import { api } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const OrganizationProfileScreen = ({ route, navigation }: any) => {
  const { orgId } = route.params;
  const [orgData, setOrgData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [hasPendingRequest, setHasPendingRequest] = useState(false);

  useEffect(() => {
    loadData();
  }, [orgId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const userDataStr = await AsyncStorage.getItem('userToken');
      const userData = userDataStr ? JSON.parse(userDataStr) : null;
      setCurrentUser(userData);

      const [orgResponse, requestResponse] = await Promise.all([
        api.get(`/api/organizations/${orgId}`),
        userData ? api.get(`/api/organizations/${orgId}/check-request/${userData.user_id}`) : null
      ]);

      setOrgData(orgResponse.data.organization);
      if (requestResponse) {
        setHasPendingRequest(requestResponse.data.hasPendingRequest);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRequest = async () => {
    try {
      await api.post(`/api/organizations/${orgId}/request`, {
        userId: currentUser.user_id
      });
      setHasPendingRequest(true);
    } catch (error) {
      console.error('Error submitting request:', error);
    }
  };

  const handleLeaveOrganization = async () => {
    try {
      const response = await api.post(`/api/organizations/${orgId}/leave`, {
        userId: currentUser.user_id
      });
      
      if (response.data.success) {
        // Update local user data
        const userData = { ...currentUser, organization_id: null, role: 'User' };
        await AsyncStorage.setItem('userToken', JSON.stringify(userData));
        navigation.replace('Main');
      }
    } catch (error) {
      console.error('Error leaving organization:', error);
    }
  };

  const renderActionButton = () => {
    if (!currentUser) return null;

    // Если пользователь уже состоит в какой-либо организации
    if (currentUser.organization_id) {
      if (currentUser.organization_id === orgId) {
        // Если это текущая организация пользователя
        if (currentUser.role === 'Admin' || currentUser.role === 'Manager') {
          return (
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate('OrganizationSettings')}
            >
              <Text style={styles.actionButtonText}>Настройки</Text>
            </TouchableOpacity>
          );
        } else {
          return (
            <TouchableOpacity 
              style={[styles.actionButton, styles.leaveButton]}
              onPress={handleLeaveOrganization}
            >
              <Text style={[styles.actionButtonText, styles.leaveButtonText]}>
                Покинуть организацию
              </Text>
            </TouchableOpacity>
          );
        }
      } else {
        // Если пользователь состоит в другой организации
        return (
          <View style={[styles.actionButton, styles.disabledButton]}>
            <Text style={[styles.actionButtonText, styles.disabledButtonText]}>
              Вы уже состоите в организации
            </Text>
          </View>
        );
      }
    } else if (!hasPendingRequest) {
      return (
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={handleJoinRequest}
        >
          <Text style={styles.actionButtonText}>Подать заявку</Text>
        </TouchableOpacity>
      );
    } else {
      return (
        <View style={[styles.actionButton, styles.pendingButton]}>
          <Text style={[styles.actionButtonText, styles.pendingButtonText]}>
            Заявка отправлена
          </Text>
        </View>
      );
    }
  };

  if (loading) {
    return <View style={styles.container}><Text>Loading...</Text></View>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Image 
            source={require('../assets/icons/back_arrow54.png')} 
            style={styles.backIcon}
          />
        </TouchableOpacity>
      </View>

      {orgData && (
        <ScrollView>
          <View style={styles.profileInfo}>
            <Image 
              source={orgData.organization_image ? 
                { uri: orgData.organization_image } : 
                require('../assets/images/avatar.png')
              } 
              style={styles.avatar}
            />
            <Text style={styles.name}>{orgData.organization_name}</Text>
            <Text style={styles.description}>{orgData.description}</Text>
            {renderActionButton()}
          </View>
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
  },
  backIcon: {
    width: 24,
    height: 24,
  },
  profileInfo: {
    alignItems: 'center',
    padding: 20,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  actionButton: {
    marginTop: 20,
    backgroundColor: '#2A2A2A',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 16,
    minWidth: 200,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  leaveButton: {
    backgroundColor: '#FFE5E5',
  },
  leaveButtonText: {
    color: '#FF3B30',
  },
  pendingButton: {
    backgroundColor: '#E1E9F0',
  },
  pendingButtonText: {
    color: '#666666',
  },
  disabledButton: {
    backgroundColor: '#E1E9F0',
  },
  disabledButtonText: {
    color: '#666666',
  },
});

export default OrganizationProfileScreen;
