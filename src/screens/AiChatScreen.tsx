import { StyleSheet, Text, View, StatusBar, SafeAreaView, TextInput, TouchableOpacity, Platform, Image, FlatList, ActivityIndicator } from 'react-native'
import React, { useState } from 'react'

const AIML_API_KEY = '6d659c500c134b33a0c9139282838a40'

const AiChatScreen = ({ navigation }: any) => {
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Привет! Я ваш AI ассистент. Задайте мне любой вопрос, и я постараюсь помочь вам.',
    },
  ])
  const [loading, setLoading] = useState(false)

  // Добавьте сюда ваше руководство
  const APP_GUIDE = `
Ты — интеллектуальный помощник пользователей мобильного TODO-приложения для управления задачами в рамках предприятия. Отвечай строго только по теме приложения. Ниже перечислены все возможности, которые ты должен учитывать при консультировании:

Пользователь может зарегистрироваться и авторизоваться.

В экране "Настройки" можно изменить аватар и другие данные профиля.

Пользователь может создать организацию или присоединиться к существующей.

Можно общаться с другими пользователями и добавлять их в друзья.

В рамках организации можно создавать задачи, указывая: заголовок, описание, прикреплённые файлы, подзадачи с описанием, исполнителей из сотрудников организации, сроки выполнения, награды (кубки).

Задачи выполняются поэтапно через закрытие подзадач.

Каждая задача сопровождается групповым чатом, который завершается после выполнения задачи.

В профиле отображаются: цель кубков, уровень пользователя (на основе общего количества заработанных кубков).

Кубки зарабатываются за выполнение задач и тратятся на премии.

После достижения цели кубков можно отправить запрос руководителю на премию.

Экран задач позволяет сортировать задачи по срокам: вчера, сегодня, неделя, произвольный период (с выбором на календаре).

Уведомления отображаются по кнопке с колокольчиком в верхней части экрана рядом с аватаром.

Отвечай кратко, ясно и только в рамках функционала приложения.
`;

  const handleSend = async () => {
    if (!message.trim()) return
    const userMsg = { role: 'user', content: message }
    setMessages(prev => [...prev, userMsg])
    setMessage('')
    setLoading(true)
    try {
      const response = await fetch('https://api.aimlapi.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${AIML_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: APP_GUIDE }, // system prompt с руководством
            ...messages.map(m => ({ role: m.role, content: m.content })),
            userMsg,
          ],
          temperature: 0.7,
          top_p: 0.7,
          frequency_penalty: 1,
          max_output_tokens: undefined,
          top_k: 50,
        }),
      })
      const data = await response.json()
      const answer = data?.choices?.[0]?.message?.content || 'Ошибка получения ответа'
      setMessages(prev => [...prev, { role: 'assistant', content: answer }])
    } catch (e: any) {
      setMessages(prev => [...prev, { role: 'assistant', content: `Ошибка соединения с AI: ${e?.message || e}` }])
    }
    setLoading(false)
  }

  const renderMessage = ({ item }: any) => (
    <View style={[
      styles.messageBubble,
      item.role === 'user' ? styles.userBubble : styles.assistantBubble
    ]}>
      <Text style={[
        styles.messageText,
        item.role === 'user' && styles.userMessageText
      ]}>{item.content}</Text>
    </View>
  )

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
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

          <Text style={styles.headerTitle}>TODO Assistant</Text>
          
          <Image source={require('../assets/images/todo_simple.png')} style={{height: 44, width: 44}} />
        </View>

        <View style={styles.chatContainer}>
          <FlatList
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(_, idx) => idx.toString()}
            contentContainerStyle={{ paddingBottom: 16 }}
          />
          {loading && <ActivityIndicator size="small" color="#007AFF" style={{ marginTop: 8 }} />}
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Type your message..."
            value={message}
            onChangeText={setMessage}
            multiline
            editable={!loading}
          />
          <TouchableOpacity
            style={[styles.sendButton, { opacity: message.trim() && !loading ? 1 : 0.5 }]}
            onPress={handleSend}
            disabled={!message.trim() || loading}
          >
            <Image
              source={require('../assets/icons/send.png')}
              style={{ width: 24, height: 24, tintColor: 'white' }}/>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  )
}

export default AiChatScreen

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingBottom: Platform.OS === 'android' ? 16 : 0,
  },
  header: {
    padding: 20, paddingLeft: 0,
    gap: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#ffffff',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000000',
  },
  backButton: {
    width: 54,
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    width: 44,
    height: 44,
    tintColor: '#2A2A2A',
  },
  chatContainer: {
    flex: 1,
    padding: 16,
  },
  messageBubble: {
    marginVertical: 4,
    padding: 12,
    borderRadius: 16,
    maxWidth: '80%',
    alignSelf: 'flex-start',
  },
  userBubble: {
    backgroundColor: '#2B2B2B',
    alignSelf: 'flex-end',
  },
  assistantBubble: {
    backgroundColor: '#F0F0F0',
    alignSelf: 'flex-start',
  },
  messageText: {
    fontSize: 16,
    color: '#1a1a1a',
  },
  userMessageText: {
    color: '#ffffff',
  },
  welcomeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  welcomeImage: {
    width: 120,
    height: 120,
    marginBottom: 24,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 12,
    textAlign: 'center',
  },
  welcomeText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    paddingHorizontal: 32,
    lineHeight: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    gap: 10,
    padding: 20
  },
  input: {
    flex: 1,
    height: 56,
    backgroundColor: '#f0f0f0',
    borderRadius: 50,
    paddingHorizontal: 20,
    paddingVertical: 10,
    maxHeight: 100,
  },
  sendButton: {
    width: 56,
    height: 56,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2B2B2B'
  },
})