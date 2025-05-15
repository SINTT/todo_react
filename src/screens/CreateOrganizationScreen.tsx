import React, { useState } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity, StatusBar, Image } from 'react-native';
import { Text } from '../components/CustomText';
import { api } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CreateOrganizationScreen = ({ navigation }: any) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async () => {
    try {
      if (!name.trim()) {
        setError('Введите название организации');
        return;
      }

      setIsLoading(true);
      setError('');

      const userDataStr = await AsyncStorage.getItem('userToken');
      const userData = userDataStr ? JSON.parse(userDataStr) : null;

      const response = await api.post('/api/organizations', {
        name: name.trim(),
        description: description.trim(),
        adminId: userData?.user_id
      });

      if (response.data.success) {
        // Обновляем данные пользователя в AsyncStorage
        if (userData) {
          userData.organization_id = response.data.organizationId;
          userData.role = 'Admin';
          await AsyncStorage.setItem('userToken', JSON.stringify(userData));
        }
        
        navigation.replace('Main'); // Используем replace вместо goBack
      }
    } catch (error: any) {
      console.error('Create organization error:', error);
      setError(error.response?.data?.error || 'Ошибка при создании организации');
    } finally {
      setIsLoading(false);
    }
  };

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
        <Text semiBold style={styles.headerTitle}>Создание организации</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder=""
            value={name}
            onChangeText={setName}
          />
          <Text style={styles.label}>Название организации</Text>
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.input, { height: 120, textAlignVertical: 'top', paddingTop: 32 }]}
            placeholder=""
            multiline
            value={description}
            onChangeText={setDescription}
          />
          <Text style={styles.label}>Описание организации</Text>
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.createButton, isLoading && styles.createButtonDisabled]}
          onPress={handleCreate}
          disabled={isLoading}
        >
          <Text semiBold style={styles.createButtonText}>
            {isLoading ? 'Создание...' : 'Создать организацию'}
          </Text>
        </TouchableOpacity>
      </View>
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
  content: {
    flex: 1,
    padding: 24,
    gap: 24,
  },
  inputContainer: {
    height: 56,
    marginBottom: 10,
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
  errorText: {
    color: '#FF3B30',
    textAlign: 'center',
  },
  createButton: {
    height: 56,
    backgroundColor: '#2A2A2A',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  createButtonDisabled: {
    opacity: 0.7,
  },
  createButtonText: {
    color: '#ffffff',
    fontSize: 16,
  },
});

export default CreateOrganizationScreen;