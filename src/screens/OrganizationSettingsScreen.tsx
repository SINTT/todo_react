import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity, StatusBar, ScrollView, Image, Alert } from 'react-native';
import { Text } from '../components/CustomText';
import { api } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type RootStackParamList = {
  Main: undefined;
  OrganizationSettings: undefined;
  RequestionsOrganization: undefined;
  ParticipantsOrganization: undefined;
};

type OrganizationSettingsScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'OrganizationSettings'>;
};

const OrganizationSettingsScreen = ({ navigation }: OrganizationSettingsScreenProps) => {
  const [organization, setOrganization] = useState<any>(null);
  const [adminUser, setAdminUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    website: '',
  });
  const [userRole, setUserRole] = useState<string>('');

  useEffect(() => {
    loadOrganizationData();
  }, []);

  const loadOrganizationData = async () => {
    try {
      const userDataStr = await AsyncStorage.getItem('userToken');
      const userData = userDataStr ? JSON.parse(userDataStr) : null;
      setUserRole(userData?.role || '');
      
      if (userData?.organization_id) {
        const response = await api.get(`/api/organizations/${userData.organization_id}`);
        if (response.data.success) {
          const org = response.data.organization;
          setOrganization(org);
          setFormData({
            name: org.organization_name || '',
            description: org.description || '',
            website: org.website || '',
          });

          // Загрузка данных админа
          const adminResponse = await api.get(`/api/users/${org.admin_id}`);
          if (adminResponse.data.success) {
            setAdminUser(adminResponse.data.user);
          }
        }
      }
    } catch (error) {
      console.error('Error loading organization:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const response = await api.put(`/api/organizations/${organization.organization_id}`, formData);
      if (response.data.success) {
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error updating organization:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Удаление организации',
      'Вы уверены, что хотите удалить организацию? Это действие нельзя отменить.',
      [
        { text: 'Отмена', style: 'cancel' },
        { 
          text: 'Удалить', 
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await api.delete(`/api/organizations/${organization.organization_id}`);
              if (response.data.success) {
                // Обновляем данные пользователя в AsyncStorage
                const userDataStr = await AsyncStorage.getItem('userToken');
                if (userDataStr) {
                  const userData = JSON.parse(userDataStr);
                  userData.organization_id = null;
                  userData.role = 'User';
                  await AsyncStorage.setItem('userToken', JSON.stringify(userData));
                }
                navigation.replace('Main');
              }
            } catch (error) {
              console.error('Error deleting organization:', error);
            }
          }
        }
      ]
    );
  };

  const handleLeave = async () => {
    Alert.alert(
      'Покинуть организацию',
      'Вы уверены, что хотите покинуть организацию?',
      [
        { text: 'Отмена', style: 'cancel' },
        { 
          text: 'Покинуть', 
          style: 'destructive',
          onPress: async () => {
            try {
              const userDataStr = await AsyncStorage.getItem('userToken');
              const userData = userDataStr ? JSON.parse(userDataStr) : null;
              
              if (userData?.organization_id) {
                const response = await api.post(`/api/organizations/${userData.organization_id}/leave`);
                if (response.data.success) {
                  // Обновляем данные пользователя в AsyncStorage
                  userData.organization_id = null;
                  userData.role = 'User';
                  await AsyncStorage.setItem('userToken', JSON.stringify(userData));
                  
                  navigation.replace('Main');
                }
              }
            } catch (error) {
              console.error('Error leaving organization:', error);
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Загрузка...</Text>
      </View>
    );
  }

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
        <Text bold style={styles.headerTitle}>Организация</Text>
        <View style={styles.backButton}/>
      </View>

      <ScrollView style={styles.content}>
        <View style={[styles.inputContainer, { marginBottom: 10 }]}>
          <TextInput
            style={styles.input}
            placeholder=""
            value={formData.name}
            onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
          />
          <Text style={styles.label}>Название организации</Text>
        </View>

        <View style={[styles.inputContainer, { marginBottom: 10 }]}>
          <TextInput
            style={[styles.input, { paddingTop: 32 }]}
            placeholder=""
            multiline
            value={formData.description}
            onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
            textAlignVertical="top"
          />
          <Text style={styles.label}>Описание организации</Text>
        </View>

        <View style={[styles.inputContainer, { marginBottom: 10 }]}>
          <TextInput
            style={styles.input}
            placeholder=""
            value={formData.website}
            onChangeText={(text) => setFormData(prev => ({ ...prev, website: text }))}
          />
          <Text style={styles.label}>Веб-сайт</Text>
        </View>

        {adminUser && (
          <View style={[styles.adminBlock, { marginBottom: 10 }]}>
            <Text style={styles.adminLabel}>Администратор:</Text>
            <View style={styles.adminInfo}>
              <Image
                source={adminUser.profile_image ? { uri: adminUser.profile_image } : require('../assets/images/avatar.png')}
                style={styles.adminAvatar}
              />
              <Text semiBold style={styles.adminName}>
                {`${adminUser.first_name} ${adminUser.last_name}`}
              </Text>
            </View>
          </View>
        )}

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <TouchableOpacity
            style={[styles.actionButton, { marginBottom: 10 }]}
            onPress={() => navigation.navigate('RequestionsOrganization')}
          >
            <Image
              source={require('../assets/icons/request.png')}
              style={styles.actionIcon}
            />
            <Text semiBold style={styles.actionButtonText}>
              Заявки
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { marginBottom: 10 }]}
            onPress={() => navigation.navigate('ParticipantsOrganization')}
          >
            <Image
              source={require('../assets/tab_icons/organization_ico.png')}
              style={styles.actionIcon}
            />
            <Text semiBold style={styles.actionButtonText}>
              Участники
            </Text>
          </TouchableOpacity>
        </View>
   

        <TouchableOpacity
          style={[styles.saveButton, { marginBottom: 10 }]}
          onPress={handleSave}
          disabled={loading}
        >
          <Text semiBold style={styles.saveButtonText}>
            {loading ? 'Сохранение...' : 'Сохранить изменения'}
          </Text>
        </TouchableOpacity>

        {userRole === 'Manager' ? (
          <TouchableOpacity
            style={[styles.deleteButton, styles.leaveButton, { marginBottom: 10 }]}
            onPress={() => handleLeave()}
          >
            <Text semiBold style={styles.deleteButtonText}>
              Покинуть организацию
            </Text>
          </TouchableOpacity>
        ) : userRole === 'Admin' && (
          <TouchableOpacity
            style={[styles.deleteButton, { marginBottom: 10 }]}
            onPress={handleDelete}
          >
            <Text semiBold style={styles.deleteButtonText}>
              Удалить организацию
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
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
    gap: 24,
    height: 78,
    paddingHorizontal: 10,
    backgroundColor: '#FFFFFF',
    marginTop: StatusBar.currentHeight,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  backButton: {
    width: 54,
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    width: 54,
    height: 54,
    tintColor: '#2A2A2A',
  },
  headerTitle: {
    fontSize: 24,
    color: '#2A2A2A',
  },  content: {
    flex: 1,
    padding: 20,
    gap: 10, // Добавляем gap для ScrollView
  },
  inputContainer: {
    height: 56,
    position: 'relative',
  },
  label: {
    position: 'absolute',
    left: 16,
    top: 8,
    fontSize: 12,
    color: '#666666',
  },
  input: {
    height: 56,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 16,
    paddingTop: 24,
    paddingBottom: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  adminBlock: {
    padding: 20,
    backgroundColor: '#F3F6FB',
    borderRadius: 25,
  },
  adminLabel: {
    fontSize: 14,
    color: '#666666',
  },
  adminInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  adminAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  adminName: {
    fontSize: 16,
    color: '#2A2A2A',
  },

  actionButton: {
    flex: 1,
    height: 56,
    backgroundColor: '#F3F6FB',
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  actionIcon: {
    width: 24,
    height: 24,
    tintColor: '#2A2A2A',
  },
  actionButtonText: {
    color: '#2A2A2A',
    fontSize: 16,
  },
  saveButton: {
    height: 56,
    backgroundColor: '#2A2A2A',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
  },
  deleteButton: {
    height: 56,
    backgroundColor: '#FFE5E5',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10, // Изменено с 40 на 10
  },
  deleteButtonText: {
    color: '#FF3B30',
    fontSize: 16,
  },
  leaveButton: {
    backgroundColor: '#E1E9F0',
  },
});

export default OrganizationSettingsScreen;