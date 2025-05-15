import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Image, ScrollView, TouchableOpacity } from 'react-native';
import { Text } from '../components/CustomText';
import { api } from '../config/api';

const OtherProfileScreen = ({ route, navigation }: any) => {
  const { userId } = route.params;
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, [userId]);

  const loadUserData = async () => {
    try {
      const response = await api.get(`/api/users/${userId}`);
      setUserData(response.data.user);
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
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

      {userData && (
        <ScrollView>
          <View style={styles.profileInfo}>
            <Image 
              source={userData.profile_image ? 
                { uri: userData.profile_image } : 
                require('../assets/images/avatar.png')
              } 
              style={styles.avatar}
            />
            <Text style={styles.name}>
              {`${userData.first_name} ${userData.last_name}`}
            </Text>
            <Text style={styles.role}>{userData.post_name || 'Нет специальности'}</Text>
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
  role: {
    fontSize: 16,
    color: '#666',
  },
});

export default OtherProfileScreen;
