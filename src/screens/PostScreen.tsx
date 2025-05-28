import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity, Image, FlatList, StatusBar, Modal, Alert, ScrollView, RefreshControl } from 'react-native';
import { Text } from '../components/CustomText';
import { api } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PostScreen = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [participants, setParticipants] = useState<any[]>([]);
  const [positions, setPositions] = useState<any[]>([]);
  const [selectedPosition, setSelectedPosition] = useState<number | 'all'>('all');
  const [modalVisible, setModalVisible] = useState(false);
  const [newPositionName, setNewPositionName] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [organizationId, setOrganizationId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true); // Добавляем состояние loading
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadOrganizationData();
  }, []);

  const loadOrganizationData = async () => {
    const userDataStr = await AsyncStorage.getItem('userToken');
    const userData = userDataStr ? JSON.parse(userDataStr) : null;
    if (userData?.organization_id) {
      setOrganizationId(userData.organization_id);
      await Promise.all([
        loadParticipants(),
        loadPositions(userData.organization_id)
      ]);
    }
  };

  const loadParticipants = async (query = '') => {
    try {
      const userDataStr = await AsyncStorage.getItem('userToken');
      const userData = userDataStr ? JSON.parse(userDataStr) : null;

      if (!userData?.organization_id) {
        setParticipants([]);
        return;
      }

      const response = await api.get(`/api/organizations/${userData.organization_id}/participants`, {
        params: { 
          query,
          // Убедитесь, что organization_id является числом
          organization_id: parseInt(userData.organization_id)
        }
      });

      if (response.data.success) {
        setParticipants(response.data.participants);
      }
    } catch (error) {
      console.error('Error loading participants:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPositions = async (orgId: number) => {
    try {
      const response = await api.get(`/api/organizations/${orgId}/positions`);
      if (response.data.success) {
        setPositions(response.data.positions);
      }
    } catch (error) {
      console.error('Error loading positions:', error);
    }
  };

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    loadParticipants(text);
  };

  const handleCreatePosition = async () => {
    if (!newPositionName.trim()) {
      Alert.alert('Ошибка', 'Введите название должности');
      return;
    }

    try {
      const response = await api.post(`/api/organizations/${organizationId}/positions`, {
        name: newPositionName
      });
      if (response.data.success) {
        await loadPositions(organizationId!);
        setModalVisible(false);
        setNewPositionName('');
      }
    } catch (error) {
      console.error('Error creating position:', error);
      Alert.alert('Ошибка', 'Не удалось создать должность');
    }
  };

  const handleAssignPosition = async (userId: number, positionId: number) => {
    try {
      const response = await api.post(`/api/users/${userId}/position`, {
        positionId
      });
      if (response.data.success) {
        // Если это текущий пользователь, обновляем AsyncStorage
        const userDataStr = await AsyncStorage.getItem('userToken');
        const userData = userDataStr ? JSON.parse(userDataStr) : null;
        
        if (userData && userData.user_id === userId) {
          const updatedUserData = {
            ...userData,
            post_id: positionId,
            post_name: positions.find(p => p.post_id === positionId)?.post_name
          };
          await AsyncStorage.setItem('userToken', JSON.stringify(updatedUserData));
        }
        
        await loadParticipants(searchQuery);
        setSelectedUser(null);
      }
    } catch (error) {
      console.error('Error assigning position:', error);
      Alert.alert('Ошибка', 'Не удалось назначить должность');
    }
  };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await loadOrganizationData();
    } finally {
      setRefreshing(false);
    }
  }, []);

  // Изменяем функцию фильтрации, добавляя console.log для отладки
  const filteredParticipants = selectedPosition === 'all' 
    ? participants
    : participants.filter(p => {
        console.log('Filtering:', {
          participant_post_id: p.post_id,
          selectedPosition,
          match: p.post_id === selectedPosition
        });
        return Number(p.post_id) === Number(selectedPosition);
      });

  const renderParticipant = ({ item }: any) => (
    <TouchableOpacity 
      style={styles.participantItem}
      onPress={() => setSelectedUser(item)}
    >
      <Image
        source={item.profile_image ? { uri: item.profile_image } : require('../assets/images/avatar.png')}
        style={styles.avatar}
      />
      <View style={styles.participantInfo}>
        <Text semiBold style={styles.name}>
          {`${item.first_name} ${item.last_name}`}
        </Text>
        <Text style={styles.position}>
          {item.post_name || 'Нет должности'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="gray" />
      
      <View style={styles.header}>
        <Text semiBold style={styles.headerTitle}>Должности</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setModalVisible(true)}
        >
          <Image
            source={require('../assets/icons/plus.png')}
            style={styles.addIcon}
          />
        </TouchableOpacity>
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

      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              selectedPosition === 'all' && styles.filterButtonActive
            ]}
            onPress={() => setSelectedPosition('all')}
          >
            <Text style={[
              styles.filterText,
              selectedPosition === 'all' && styles.filterTextActive
            ]}>
              Все
            </Text>
          </TouchableOpacity>
          {positions.map(position => (
            <TouchableOpacity
              key={position.post_id}
              style={[
                styles.filterButton,
                selectedPosition === position.post_id && styles.filterButtonActive
              ]}
              onPress={() => setSelectedPosition(position.post_id)}
            >
              <Text style={[
                styles.filterText,
                selectedPosition === position.post_id && styles.filterTextActive
              ]}>
                {position.post_name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filteredParticipants}
        renderItem={renderParticipant}
        keyExtractor={item => item.user_id.toString()}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#2A2A2A']}
            tintColor="#2A2A2A"
          />
        }
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            {loading ? 'Загрузка...' : 'Участники не найдены'}
          </Text>
        }
      />

      {/* Modal for creating new position */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text semiBold style={styles.modalTitle}>
              Новая должность
            </Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Название должности"
              value={newPositionName}
              onChangeText={setNewPositionName}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setModalVisible(false);
                  setNewPositionName('');
                }}
              >
                <Text style={styles.cancelButtonText}>Отмена</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.createButton]}
                onPress={handleCreatePosition}
              >
                <Text style={styles.createButtonText}>Создать</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal for assigning position */}
      <Modal
        visible={!!selectedUser}
        transparent
        animationType="slide"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text semiBold style={styles.modalTitle}>
              Выберите должность
            </Text>
            <FlatList
              data={positions}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.positionItem}
                  onPress={() => handleAssignPosition(selectedUser.user_id, item.post_id)}
                >
                  <Text style={styles.positionItemText}>{item.post_name}</Text>
                </TouchableOpacity>
              )}
              keyExtractor={item => item.post_id.toString()}
            />
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setSelectedUser(null)}
            >
              <Text style={styles.cancelButtonText}>Отмена</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    justifyContent: 'space-between',
    padding: 24,
    marginTop: StatusBar.currentHeight,
  },
  headerTitle: {
    fontSize: 24,
    color: '#2A2A2A',
  },
  addButton: {
    width: 54,
    height: 54,
    backgroundColor: '#F3F6FB',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addIcon: {
    width: 24,
    height: 24,
    tintColor: '#2A2A2A',
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
  filterContainer: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#F3F6FB',
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: '#2A2A2A',
  },
  filterText: {
    color: '#666666',
  },
  filterTextActive: {
    color: '#FFFFFF',
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
    marginLeft: 12,
  },
  name: {
    fontSize: 16,
    color: '#2A2A2A',
  },
  position: {
    fontSize: 14,
    color: '#666666',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    color: '#2A2A2A',
    marginBottom: 16,
  },
  modalInput: {
    backgroundColor: '#F3F6FB',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  modalButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  cancelButton: {
    backgroundColor: '#F3F6FB',
  },
  createButton: {
    backgroundColor: '#2A2A2A',
  },
  cancelButtonText: {
    color: '#666666',
  },
  createButtonText: {
    color: '#FFFFFF',
  },
  positionItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F6FB',
  },
  positionItemText: {
    fontSize: 16,
    color: '#2A2A2A',
  },
  emptyText: {
    textAlign: 'center',
    color: '#666666',
    padding: 24,
  },
});

export default PostScreen;