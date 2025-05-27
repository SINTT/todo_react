import React, {useState, useEffect} from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Image,
  StatusBar,
} from 'react-native';
import {Text} from '../components/CustomText';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {api} from '../config/api';
import * as ImagePicker from 'react-native-image-picker';

const SettingsScreen = ({navigation}: any) => {
  const [userData, setUserData] = useState<any>(null);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    patronymic: '',
    email: '',
    current_password: '',
    new_password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    const userDataStr = await AsyncStorage.getItem('userToken');
    if (userDataStr) {
      const data = JSON.parse(userDataStr);
      setUserData(data);
      setFormData({
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        patronymic: data.patronymic || '',
        email: data.email || '',
        current_password: '',
        new_password: '',
      });
      setProfileImage(data.profile_image);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await api.put(
        `/api/users/${userData.user_id}`,
        formData,
      );

      if (response.data.success) {
        const updatedUserData = {...userData, ...response.data.user};
        await AsyncStorage.setItem('userToken', JSON.stringify(updatedUserData));
        Alert.alert('Успех', 'Данные успешно обновлены');

        // Clear password fields
        setFormData(prev => ({
          ...prev,
          current_password: '',
          new_password: '',
        }));
      }
    } catch (error: any) {
      setError(error.response?.data?.error || 'Ошибка при обновлении данных');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Выход из профиля',
      'Вы уверены, что хотите выйти?',
      [
        {
          text: 'Отмена',
          style: 'cancel',
        },
        {
          text: 'Выйти',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('userToken');
              await AsyncStorage.removeItem('isLoggedIn');
              navigation.reset({
                index: 0,
                routes: [{name: 'Auth'}],
              });
            } catch (error) {
              console.error(error);
            }
          },
        },
      ],
    );
  };

  const handleImagePick = () => {
    ImagePicker.launchImageLibrary(
      {
        mediaType: 'photo',
        includeBase64: true,
        quality: 0.8,
        maxWidth: 1000,
        maxHeight: 1000,
      },
      async response => {
        if (response.didCancel || !response.assets?.[0].base64) {
          return;
        }

        try {
          setLoading(true);
          setImageLoading(true);
          setImageError(false);
          const base64Image = `data:${response.assets[0].type};base64,${response.assets[0].base64}`;

          const uploadResponse = await api.put(
            `/api/users/${userData.user_id}/profile-image`,
            {image: base64Image},
          );

          if (uploadResponse.data.success) {
            const updatedUserData = {
              ...userData,
              profile_image: uploadResponse.data.profile_image,
            };
            setUserData(updatedUserData);
            await AsyncStorage.setItem('userToken', JSON.stringify(updatedUserData));
            setProfileImage(uploadResponse.data.profile_image);
            Alert.alert('Успех', 'Фото профиля обновлено');
          }
        } catch (error: any) {
          setImageError(true);
          setError(error.response?.data?.error || 'Ошибка при обновлении фото. Пожалуйста, попробуйте ещё раз');
        } finally {
          setLoading(false);
          setImageLoading(false);
        }
      },
    );
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
        <Text bold style={styles.headerTitle}>Настройки</Text>
        <View style={styles.backButton}/>
      </View>

      <ScrollView 
        style={styles.scrollContent}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.profileImageContainer}>
          <TouchableOpacity onPress={handleImagePick} disabled={imageLoading}>
            {profileImage && !imageError ? (
              <Image
                source={{uri: profileImage}}
                style={styles.profileImage}
                onError={() => setImageError(true)}
                loadingIndicatorSource={require('../assets/icons/add_friend_ico.png')}
              />
            ) : (
              <View style={styles.profileImagePlaceholder}>
                <Text style={styles.profileImagePlaceholderText}>
                  {imageLoading ? 'Загрузка...' : 'Добавить фото'}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
        
        <View style={{padding: 20, borderRadius: 16, backgroundColor: '#FFFFFF'}}>
          <Text semiBold style={styles.sectionTitle}>
            Личные данные
          </Text>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={formData.first_name}
              onChangeText={text =>
                setFormData(prev => ({...prev, first_name: text}))
              }
              placeholder=""
            />
            <Text style={styles.label}>Имя</Text>
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={formData.last_name}
              onChangeText={text =>
                setFormData(prev => ({...prev, last_name: text}))
              }
              placeholder=""
            />
            <Text style={styles.label}>Фамилия</Text>
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={formData.patronymic}
              onChangeText={text =>
                setFormData(prev => ({...prev, patronymic: text}))
              }
              placeholder=""
            />
            <Text style={styles.label}>Отчество</Text>
          </View>

          <View style={[styles.inputContainer, {marginBottom: 0}]}>
            <TextInput
              style={styles.input}
              value={formData.email}
              onChangeText={text => setFormData(prev => ({...prev, email: text}))}
              placeholder=""
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Text style={styles.label}>Почта</Text>
          </View>
        </View>
        
        <View style={{padding: 20, borderRadius: 16, backgroundColor: '#FFFFFF'}}>
          <Text semiBold style={styles.sectionTitle}>
            Изменить пароль
          </Text>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={formData.current_password}
              onChangeText={text =>
                setFormData(prev => ({...prev, current_password: text}))
              }
              placeholder=""
              secureTextEntry
            />
            <Text style={styles.label}>Текущий пароль</Text>
          </View>

          <View style={[styles.inputContainer, {marginBottom: 0}]}>
            <TextInput
              style={styles.input}
              value={formData.new_password}
              onChangeText={text =>
                setFormData(prev => ({...prev, new_password: text}))
              }
              placeholder=""
              secureTextEntry
            />
            <Text style={styles.label}>Новый пароль</Text>
          </View>
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
          disabled={loading}>
          <Text semiBold style={styles.saveButtonText}>
            {loading ? 'Сохранение...' : 'Сохранить изменения'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text semiBold style={styles.logoutText}>Выйти</Text>
        </TouchableOpacity>
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
  scrollContent: {
    flex: 1,
    backgroundColor: '#EDEDED',
  },
  contentContainer: {
    padding: 16,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 18,
    color: '#2A2A2A',
    marginBottom: 15,
  },
  inputContainer: {
    height: 56,
    marginBottom: 16,
    position: 'relative',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
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
    borderRadius: 12,
    paddingTop: 24,
    paddingBottom: 8,
    paddingHorizontal: 16,
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
  logoutButton: {
    height: 56,
    backgroundColor: '#FFE5E5',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
   headerTitle: {
    fontSize: 24,
    color: '#2A2A2A',
  },
  logoutText: {
    color: '#FF3B30',
    fontSize: 16,
  },
  errorText: {
    color: '#FF3B30',
    marginBottom: 16,
    textAlign: 'center',
  },
  profileImageContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  profileImagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E5E5E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImagePlaceholderText: {
    color: '#666666',
    fontSize: 14,
    textAlign: 'center',
  },
});

export default SettingsScreen;
