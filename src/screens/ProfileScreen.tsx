import React, { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, StyleSheet, Image, TouchableOpacity, StatusBar } from 'react-native';
import { Text } from '../components/CustomText';

const ProfileScreen = ({ navigation }: any) => {
  const [userData, setUserData] = useState<any>(null);
  const [imageError, setImageError] = useState(false);

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
                  : require('../assets/images/avatar.png')
              }
              style={styles.avatarImage}
              onError={() => setImageError(true)}
            />
          </TouchableOpacity>
          <Text semiBold style={styles.userName}>
            {userData ? `${userData.first_name} ${userData.last_name}` : 'Загрузка...'}
          </Text>
          <Text style={styles.userRole}>
            {userData?.post_id ? 'Специальность' : 'Нет специальности'}
          </Text>
        </View>

        <View style={styles.socialActions}>
          <TouchableOpacity style={styles.addFriend}>
            <Image
              source={require('../assets/icons/add_friend_ico.png')}
              style={{ width: 24, height: 24 }}
            />  
            <Text medium style={{fontSize: 16}}>Добавить</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.addFriend, {backgroundColor: '#2A2A2A',}]}>
            <Image
              source={require('../assets/tab_icons/messages_ico.png')}
              style={{ width: 24, height: 24, tintColor: '#fff' }}
            />
            <Text style={styles.messageText}>Сообщение</Text>
          </TouchableOpacity>
        </View>
      </View>
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
  userName: {
    fontSize: 24,
    color: '#2A2A2A',
    marginTop: 16,
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

});

export default ProfileScreen;
