import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { api, checkServerConnection } from '../config/api';

const AuthScreen = ({navigation, route}: any) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  React.useEffect(() => {
    if (route.params?.email) {
      setEmail(route.params.email);
    }
  }, [route.params]);

  const validateForm = () => {
    if (!email || !password) {
      setError('Пожалуйста, заполните все поля');
      return false;
    }
    return true;
  };

  const handleLogin = async () => {
    try {
      if (!validateForm()) return;
      
      setIsLoading(true);
      setError('');

      const isConnected = await checkServerConnection();
      if (!isConnected) {
        throw new Error('Не удалось подключиться к серверу');
      }

      const response = await api.post('/api/auth/login', {
        email: email.trim(),
        password
      });

      if (response.data.success) {
        const userData = response.data.user;
        
        // Если пользователь состоит в организации, получаем данные организации
        if (userData.organization_id) {
          const orgResponse = await api.get(`/api/organizations/${userData.organization_id}`);
          if (orgResponse.data.success) {
            userData.organization = orgResponse.data.organization;
          }
        }

        await AsyncStorage.setItem('userToken', JSON.stringify(userData));
        await AsyncStorage.setItem('isLoggedIn', 'true');
        navigation.replace('Main');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      
      if (error.message === 'Не удалось подключиться к серверу') {
        setError('Сервер недоступен. Проверьте подключение к интернету');
      } else if (error.response?.status === 401) {
        setError('Неверный email или пароль');
      } else if (error.response?.data?.error) {
        setError(error.response.data.error);
      } else if (error.code === 'ECONNABORTED') {
        setError('Превышено время ожидания. Проверьте подключение');
      } else {
        setError('Ошибка входа. Попробуйте позже');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>

      <View style={{alignItems: 'center', width: '100%', marginBottom: 60}}>
        <Image
          source={require('../assets/images/todo_app_splash.png')}
          style={{width: 120, height: 120, resizeMode: 'contain'}}
        />
      </View>
      
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder=""
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <Text style={styles.label}>Почта</Text>
      </View>
      
      <View style={styles.inputContainer}>
        <View style={styles.passwordContainer}>
          <TextInput
            style={[styles.input, styles.passwordInput]}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            placeholder=""
          />
          <Text style={styles.label}>Пароль</Text>
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setShowPassword(!showPassword)}>
            <Image
              source={
                showPassword
                  ? require('../assets/icons/eye-open.png')
                  : require('../assets/icons/eye-closed.png')
              }
              style={styles.eyeIcon}
            />
          </TouchableOpacity>
        </View>
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.registerButton]}
          onPress={() => navigation.navigate('Register')}>
          <Text style={[styles.buttonText, styles.registerButtonText]}>Регистрация</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={isLoading}>
          <Text style={styles.buttonText}>{isLoading ? 'Загрузка...' : 'Войти'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 25,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    paddingBottom: 160,

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
  },
  passwordContainer: {
    width: '100%',
  },
  passwordInput: {
    width: '100%',
  },
  eyeButton: {
    position: 'absolute',
    right: 16,
    top: 16,
    height: 24,
    width: 24,
    justifyContent: 'center',
  },
  eyeIcon: {
    width: 24,
    height: 24,
    tintColor: '#999999',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  button: {
    height: 56,
    backgroundColor: '#2A2A2A',
    paddingHorizontal: 25,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  registerButton: {
    backgroundColor: '#E1E9F0',
  },
  registerButtonText: {
    color: '#2A2A2A',
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
  }
});

export default AuthScreen;
