import React, {useState} from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import {Text} from '../components/CustomText';
import { api, checkServerConnection } from '../config/api';

const RegisterScreen = ({navigation}: any) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    patronymic: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const validateForm = () => {
    if (!formData.email || !formData.password || !formData.firstName || !formData.lastName) {
      setError('Пожалуйста, заполните все обязательные поля');
      return false;
    }
    return true;
  };

  const handleRegister = async () => {
    try {
      if (!validateForm()) return;
      
      setIsLoading(true);
      setError('');

      // Check server connection first
      const isConnected = await checkServerConnection();
      if (!isConnected) {
        throw new Error('Не удалось подключиться к серверу');
      }

      const response = await api.post('/api/auth/register', {
        email: formData.email.trim(),
        password: formData.password,
        first_name: formData.firstName.trim(),
        last_name: formData.lastName.trim(),
        patronymic: formData.patronymic.trim()
      });

      if (response.data.success) {
        navigation.navigate('Auth', { 
          email: formData.email,
          message: 'Регистрация успешна! Теперь вы можете войти.' 
        });
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      
      if (error.message === 'Не удалось подключиться к серверу') {
        setError('Сервер недоступен. Пожалуйста, проверьте подключение к интернету и попробуйте позже');
      } else if (error.response?.data?.error) {
        if (error.response.data.error.includes('Email already registered')) {
          setError('Этот email уже зарегистрирован');
        } else if (error.response.data.error.includes('Invalid email format')) {
          setError('Неверный формат email');
        } else {
          setError(error.response.data.error);
        }
      } else if (error.code === 'ECONNABORTED') {
        setError('Превышено время ожидания. Проверьте подключение к интернету');
      } else {
        setError('Произошла ошибка при регистрации. Пожалуйста, попробуйте позже');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Image
          source={require('../assets/icons/back_arrow54.png')}
          style={styles.backIcon}
        />
      </TouchableOpacity>

      <ScrollView style={styles.scrollView}>
        <View style={{alignItems: 'center', width: '100%', marginBottom: 60}}>
          <Image
            source={require('../assets/images/todo_app_splash.png')}
            style={{width: 120, height: 120, resizeMode: 'contain'}}
          />
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={formData.email}
              onChangeText={(text) => setFormData({...formData, email: text})}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder=""
            />
            <Text style={styles.label}>Email</Text>
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={formData.password}
              onChangeText={(text) => setFormData({...formData, password: text})}
              secureTextEntry
              placeholder=""
            />
            <Text style={styles.label}>Пароль</Text>
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={formData.firstName}
              onChangeText={(text) => setFormData({...formData, firstName: text})}
              placeholder=""
            />
            <Text style={styles.label}>Имя</Text>
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={formData.lastName}
              onChangeText={(text) => setFormData({...formData, lastName: text})}
              placeholder=""
            />
            <Text style={styles.label}>Фамилия</Text>
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={formData.patronymic}
              onChangeText={(text) => setFormData({...formData, patronymic: text})}
              placeholder=""
            />
            <Text style={styles.label}>Отчество (необязательно)</Text>
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={isLoading}>
            <Text semiBold style={styles.buttonText}>
              {isLoading ? 'Регистрация...' : 'Зарегистрироваться'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 20,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 25,
  },
  backButton: {
    position: 'absolute',
    top: 40,
    left: 20,
    zIndex: 1,
  },
  backIcon: {
    width: 30,
    height: 30,
    tintColor: '#2A2A2A',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#2A2A2A',
  },
  form: {
    gap: 15,
  },
  inputContainer: {
    height: 56,
    marginBottom: 16,
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
  button: {
    height: 56,
    backgroundColor: '#2A2A2A',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
  },
  errorText: {
    color: '#FF3B30',
    textAlign: 'center',
    marginTop: 8,
  },
});

export default RegisterScreen;