import React from 'react';
import {View, StyleSheet, TouchableOpacity, Image} from 'react-native';
import {Text} from '../components/CustomText';

const WelcomeScreen = ({navigation}: any) => {
  return (
    <View style={styles.container}>
      <Image
        source={require('../assets/images/logo_3d1.png')}
        style={{width: '100%', height: 300, resizeMode: 'contain'}}
      />
        <View>
          <Text bold style={styles.title}>
            С todo app управление задачами удобнее!
          </Text>
          <Text style={styles.description}>
            Планируйте, организуйте и выполняйте задачи с легкостью — все в одном месте!
          </Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate('Auth')}>
            <Text semiBold style={styles.buttonText}>Начать</Text>
          </TouchableOpacity>
        </View>   
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 25,
    paddingBottom: 40,
    gap: 120,
    backgroundColor: '#ffffff',
    justifyContent: 'flex-end',
  },
  title: {
    fontSize: 28,
    color: '#2A2A2A',
  },
  description: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 40,
  },
  button: {
    height: 64,
    backgroundColor: '#2A2A2A',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
  },
});

export default WelcomeScreen;