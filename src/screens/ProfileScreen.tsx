import React, { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, StyleSheet, Image, TouchableOpacity, StatusBar, ScrollView, TextInput, Modal, ViewStyle } from 'react-native';
import { Text } from '../components/CustomText';
import { api } from '../config/api';

const CUPS_PER_LEVEL = 500;

interface UserData {
  user_id: number;
  first_name: string;
  last_name: string;
  patronymic?: string;
  profile_image?: string;
  post_id?: number;
  full_cup_count: number;
  now_cup_count: number;
  purpose_cup_count: number;
  role: string;
  email: string;
}

const ProfileScreen = ({ navigation }: any) => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [imageError, setImageError] = useState(false);
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [newGoal, setNewGoal] = useState('');

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const userToken = await AsyncStorage.getItem('userToken');
        if (userToken) {
          setUserData(JSON.parse(userToken));
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };

    loadUserData();
  }, []);

  const calculateLevel = (cups: number) => {
    return Math.floor(cups / CUPS_PER_LEVEL);
  };

  const handleUpdateGoal = async () => {
    try {
      if (!userData) return;  // Add early return if no userData
      
      const goal = parseInt(newGoal);
      if (isNaN(goal) || goal <= 0) return;

      const response = await api.put(`/api/users/${userData.user_id}/cups-goal`, {
        purpose_cup_count: goal
      });

      if (response.data.success) {
        const updatedUserData = { ...userData, purpose_cup_count: goal };
        await AsyncStorage.setItem('userToken', JSON.stringify(updatedUserData));
        setUserData(updatedUserData);
        setIsEditingGoal(false);
      }
    } catch (error) {
      console.error('Error updating goal:', error);
    }
  };

  const renderGoalEditModal = () => (
    <Modal
      visible={isEditingGoal}
      transparent
      animationType="fade"
      onRequestClose={() => setIsEditingGoal(false)}
    >
      <TouchableOpacity 
        style={styles.modalOverlay}
        activeOpacity={1} 
        onPress={() => setIsEditingGoal(false)}
      >
        <View style={styles.modalContent}>
          <Text semiBold style={styles.modalTitle}>Изменить цель</Text>
          <TextInput
            style={styles.goalInput}
            keyboardType="numeric"
            value={newGoal}
            onChangeText={setNewGoal}
            placeholder="Введите новую цель"
          />
          <View style={styles.modalButtons}>
            <TouchableOpacity 
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setIsEditingGoal(false)}
            >
              <Text style={styles.buttonText}>Отмена</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.modalButton, styles.saveButton]}
              onPress={handleUpdateGoal}
            >
              <Text style={styles.buttonText}>Сохранить</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  const getProgressWidth = (): ViewStyle => {
    if (!userData?.purpose_cup_count) return { width: '0%' };
    const percentage = Math.min(
      (userData.now_cup_count / userData.purpose_cup_count * 100), 
      100
    );
    return { width: `${percentage}%` } as ViewStyle;
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="gray" />
      <View style={styles.headerBackground} />
      
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.settingsButton}
          onPress={() => navigation.navigate('Settings')}
        >
          <Image 
            source={require('../assets/icons/settings.png')}
            style={{height: 28, width: 28, tintColor: 'black'}}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.profileInfo}>
          <TouchableOpacity style={styles.avatarContainer}>
            <Image 
              source={
                userData?.profile_image && !imageError
                  ? { uri: userData.profile_image }
                  : require('../assets/images/avatar.jpg')
              }
              style={styles.avatarImage}
              onError={() => setImageError(true)}
            />
          </TouchableOpacity>
          <View style={styles.nameContainer}>
            <Text semiBold style={styles.userName}>
              {userData ? `${userData.first_name} ${userData.last_name}` : 'Загрузка...'}
            </Text>
            {userData && (
              <Text style={styles.level}>{calculateLevel(userData.full_cup_count)}lvl</Text>
            )}
          </View>
          <Text style={styles.userRole}>
            {userData?.post_id ? 'Специальность' : 'Нет специальности'}
          </Text>
        </View>

        <ScrollView style={styles.widgets}>
          <View style={styles.goalWidget}>
            <View style={styles.goalHeader}>
              <Text semiBold style={styles.goalTitle}>Цель кубков</Text>
              <TouchableOpacity onPress={() => setIsEditingGoal(true)}>
                <Image 
                  source={require('../assets/icons/writing.png')}
                  style={styles.editIcon}
                />
              </TouchableOpacity>
            </View>
            
            <View style={styles.goalInfo}>
              <Text style={styles.cupsCount}>
                {userData?.now_cup_count || 0} / {userData?.purpose_cup_count || 0}
              </Text>
            </View>
            
            <View style={styles.progressBarContainer}>
              <View 
                style={[
                  styles.progressBar,
                  getProgressWidth()
                ]} 
              />
            </View>
          </View>
        </ScrollView>
      </View>

      {renderGoalEditModal()}
    </View>
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
  settingsButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 24,
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
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
  },
  userName: {
    fontSize: 24,
    color: '#2A2A2A',
  },
  level: {
    fontSize: 16,
    color: '#00D87F',
    fontWeight: 'bold',
  },
  userRole: {
    fontSize: 16,
    color: '#9C9C9C',
    marginTop: 4,
  },

  socialActions: {
    width: '100%',
    flexDirection: 'row',
    padding: 12,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  addFriend: {
    borderRadius: 16,
    paddingRight: 25,
    paddingLeft: 20,
    height: 64,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F6F5FD',
  },
  message: {
    flex: 1,
    height: 40,
    flexDirection: 'row',
    padding: 8,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5,
    borderRadius: 21,
    backgroundColor: '#2A2A2A',
  },
  messageText: {
    color: '#FFF',
    textAlign: 'center',
    fontFamily: 'Inter',
    fontSize: 15,
    fontWeight: '600',
  },
  widgets: {
    flex: 1,
    padding: 16,
  },
  goalWidget: {
    backgroundColor: '#f8f8f8',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  goalTitle: {
    fontSize: 18,
  },
  editIcon: {
    width: 20,
    height: 20,
    tintColor: '#666',
  },
  goalInfo: {
    marginBottom: 8,
  },
  cupsCount: {
    fontSize: 24,
    color: '#2A2A2A',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#00D87F',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '80%',
  },
  modalTitle: {
    fontSize: 18,
    marginBottom: 16,
    textAlign: 'center',
  },
  goalInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  saveButton: {
    backgroundColor: '#00D87F',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default ProfileScreen;
