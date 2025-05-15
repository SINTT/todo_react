import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity, Image, FlatList, StatusBar } from 'react-native';
import { Text } from '../components/CustomText';
import { api } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ParticipantsOrganizationScreen = ({ navigation }: any) => {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [participants, setParticipants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCurrentUser();
    loadParticipants();
  }, []);

  const loadCurrentUser = async () => {
    const userDataStr = await AsyncStorage.getItem('userToken');
    const userData = userDataStr ? JSON.parse(userDataStr) : null;
    setCurrentUser(userData);
  };

  const loadParticipants = async (query = '') => {
    try {
      const userDataStr = await AsyncStorage.getItem('userToken');
      const userData = userDataStr ? JSON.parse(userDataStr) : null;

      if (userData?.organization_id) {
        const response = await api.get(`/api/organizations/${userData.organization_id}/participants`, {
          params: { query }
        });
        if (response.data.success) {
          setParticipants(response.data.participants);
        }
      }
    } catch (error) {
      console.error('Error loading participants:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    loadParticipants(text);
  };

  const handlePromoteToAdmin = async (userId: number) => {
    try {
      const response = await api.post(`/api/organizations/${currentUser.organization_id}/promote`, {
        userId
      });
      if (response.data.success) {
        loadParticipants(searchQuery);
      }
    } catch (error) {
      console.error('Error promoting user:', error);
    }
  };

  const handleRemoveUser = async (userId: number) => {
    try {
      const response = await api.post(`/api/organizations/${currentUser.organization_id}/remove-user`, {
        userId
      });
      if (response.data.success) {
        loadParticipants(searchQuery);
      }
    } catch (error) {
      console.error('Error removing user:', error);
    }
  };

  const handleToggleManager = async (userId: number, isManager: boolean) => {
    try {
      const response = await api.post(`/api/organizations/${currentUser.organization_id}/toggle-manager`, {
        userId,
        isManager: !isManager
      });
      if (response.data.success) {
        loadParticipants(searchQuery);
      }
    } catch (error) {
      console.error('Error toggling manager role:', error);
    }
  };

  const renderParticipant = ({ item }: any) => (
    <View style={styles.participantItem}>
      <Image
        source={item.profile_image ? { uri: item.profile_image } : require('../assets/images/avatar.png')}
        style={styles.avatar}
      />
      <View style={styles.participantInfo}>
        <Text semiBold style={styles.name}>
          {`${item.first_name} ${item.last_name}`}
        </Text>
        <Text style={styles.role}>
          {item.post_name || 'Нет специальности'}
        </Text>
      </View>
      <View style={styles.badge}>
        <Text style={[
          styles.badgeText, 
          item.role === 'Admin' && styles.adminBadgeText,
          item.role === 'Manager' && styles.managerBadgeText
        ]}>
          {item.role}
        </Text>
      </View>
      {/* Показываем кнопки управления для админа и менеджера */}
      {(currentUser?.role === 'Admin' || (currentUser?.role === 'Manager' && item.role === 'User')) && 
       currentUser?.user_id !== item.user_id && (
        <View style={styles.actions}>
          {/* Только админ может управлять ролью менеджера */}
          {currentUser?.role === 'Admin' && item.role !== 'Admin' && (
            <TouchableOpacity
              style={[styles.actionButton, item.role === 'Manager' ? styles.demoteButton : styles.promoteButton]}
              onPress={() => handleToggleManager(item.user_id, item.role === 'Manager')}
            >
              <Image
                source={require('../assets/icons/crown.png')}
                style={[styles.actionIcon, item.role === 'Manager' && styles.demoteIcon]}
              />
            </TouchableOpacity>
          )}
          {/* Кнопка удаления доступна админу для всех (кроме себя) и менеджеру только для обычных пользователей */}
          <TouchableOpacity
            style={[styles.actionButton, styles.removeButton]}
            onPress={() => handleRemoveUser(item.user_id)}
          >
            <Image
              source={require('../assets/icons/trash.png')}
              style={styles.actionIcon}
            />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="gray" />
      
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
        <Text semiBold style={styles.headerTitle}>Участники</Text>
      </View>

      <View style={styles.searchContainer}>
        <Image
          source={require('../assets/icons/user_search.png')}
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Поиск по имени"
          value={searchQuery}
          onChangeText={handleSearch}
        />
      </View>

      <FlatList
        data={participants}
        renderItem={renderParticipant}
        keyExtractor={(item) => item.user_id.toString()}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            {loading ? 'Загрузка...' : 'Участники не найдены'}
          </Text>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
    padding: 24,
    marginTop: StatusBar.currentHeight,
  },
  backButton: {
    width: 54,
    height: 54,
    backgroundColor: '#F3F6FB',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    width: 24,
    height: 24,
    tintColor: '#2A2A2A',
  },
  headerTitle: {
    fontSize: 24,
    color: '#2A2A2A',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F6FB',
    margin: 24,
    marginTop: 0,
    padding: 16,
    borderRadius: 16,
  },
  searchIcon: {
    width: 24,
    height: 24,
    tintColor: '#666666',
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#2A2A2A',
    padding: 0,
  },
  list: {
    padding: 24,
  },
  participantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F3F6FB',
    borderRadius: 16,
    marginBottom: 8,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  participantInfo: {
    flex: 1,
    marginLeft: 12,
  },
  name: {
    fontSize: 16,
    color: '#2A2A2A',
  },
  role: {
    fontSize: 14,
    color: '#666666',
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: '#E1E9F0',
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    color: '#2A2A2A',
  },
  adminBadgeText: {
    color: '#00D87F',
  },
  managerBadgeText: {
    color: '#007AFF',
  },
  emptyText: {
    textAlign: 'center',
    color: '#666666',
    marginTop: 24,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginLeft: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  promoteButton: {
    backgroundColor: '#E1F5FF',
  },
  demoteButton: {
    backgroundColor: '#FFE5E5',
  },
  demoteIcon: {
    opacity: 0.5,
  },
  removeButton: {
    backgroundColor: '#FFE5E5',
  },
  actionIcon: {
    width: 20,
    height: 20,
    tintColor: '#2A2A2A',
  },
});

export default ParticipantsOrganizationScreen;