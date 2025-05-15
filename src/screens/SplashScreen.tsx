import React, {useEffect} from 'react';
import {View, StyleSheet, Image} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Text} from '../components/CustomText';

const SplashScreen = ({navigation}: any) => {
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const isLoggedIn = await AsyncStorage.getItem('isLoggedIn');
      
      setTimeout(() => {
        if (isLoggedIn === 'true') {
          navigation.replace('Main');
        } else {
          navigation.replace('Welcome');
        }
      }, 2000);
    } catch (error) {
      console.error(error);
      navigation.replace('Welcome');
    }
  };

  return (
    <View style={styles.container}>
      <Image
        source={require('../assets/images/todo_app_splash.png')}
        style={{width: 200, height: 200, resizeMode: 'contain'}}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  text: {
    fontSize: 32,
    fontWeight: 'bold',
  },
});

export default SplashScreen;
