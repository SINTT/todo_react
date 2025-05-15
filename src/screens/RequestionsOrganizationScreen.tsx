import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity, Image, FlatList, StatusBar } from 'react-native';
import { Text } from '../components/CustomText';
import { api } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const RequestionsOrganizationScreen = ({ navigation }: any) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async (query = '') => {
    try {
      const userDataStr = await AsyncStorage.getItem('userToken');
      const userData = userDataStr ? JSON.parse(userDataStr) : null;

      if (userData?.organization_id) {
        const response = await api.get(`/api/organizations/${userData.organization_id}/requests`, {
          params: { query }
        });
        if (response.data.success) {
          setRequests(response.data.requests);
        }
      }
    } catch (error) {
      console.error('Error loading requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    loadRequests(text);
  };

  const handleAccept = async (requestId: number) => {
    try {
      await api.post(`/api/organizations/requests/${requestId}/accept`);
      loadRequests(searchQuery);
    } catch (error) {
      console.error('Error accepting request:', error);
    }
  };

  const handleReject = async (requestId: number) => {
    try {
      await api.post(`/api/organizations/requests/${requestId}/reject`);
      loadRequests(searchQuery);
    } catch (error) {
      console.error('Error rejecting request:', error);
    }
  };

  const renderRequest = ({ item }: any) => (
    <View style={styles.requestItem}>
      <Image
        source={item.profile_image ? { uri: item.profile_image } : require('../assets/images/avatar.png')}
        style={styles.avatar}
      />
      <View style={styles.requestInfo}>
        <Text semiBold style={styles.name}>
          {`${item.first_name} ${item.last_name}`}
        </Text>
        <Text style={styles.email}>{item.email}</Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.acceptButton]}
          onPress={() => handleAccept(item.request_id)}
        >
          <Text semiBold style={styles.acceptButtonText}>Принять</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.rejectButton]}
          onPress={() => handleReject(item.request_id)}
        >
          <Text semiBold style={styles.rejectButtonText}>Отклонить</Text>
        </TouchableOpacity>
      </View>
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
        <Text semiBold style={styles.headerTitle}>Заявки</Text>
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
        data={requests}
        renderItem={renderRequest}
        keyExtractor={(item) => item.request_id.toString()}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            {loading ? 'Загрузка...' : 'Нет заявок'}
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
  requestItem: {
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
  requestInfo: {
    flex: 1,
    marginLeft: 12,
  },
  name: {
    fontSize: 16,
    color: '#2A2A2A',
  },
  email: {
    fontSize: 14,
    color: '#666666',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  acceptButton: {
    backgroundColor: '#2A2A2A',
  },
  rejectButton: {
    backgroundColor: '#FFE5E5',
  },
  acceptButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  rejectButtonText: {
    color: '#FF3B30',
    fontSize: 14,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666666',
    marginTop: 24,
  },
});

export default RequestionsOrganizationScreen;