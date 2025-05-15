import React, { useState, useRef, useCallback, useEffect } from 'react';
import { View, StyleSheet, Image, TouchableOpacity, StatusBar, TextInput } from 'react-native';
import { Text } from '../components/CustomText';
import { Step1 } from './CreateTaskSteps/Step1';
import { Step2 } from './CreateTaskSteps/Step2';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {api} from '../config/api'; // Adjust the import based on your project structure


const MAX_SUBTASKS = 10;
const DOTS_COUNT = 2;


const CreateTaskScreen = ({ navigation }: any) => {
    const [description, setDescription] = useState('');
    const [title, setTitle] = useState('');
    const [subtasks, setSubtasks] = useState([{ title: '', description: '' }]);
    const [currentStep, setCurrentStep] = useState(0);
    const [reward, setReward] = useState('250');
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);
    const [selectedUsers, setSelectedUsers] = useState<any[]>([]);
    const [images, setImages] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [userData, setUserData] = useState<any>(null);

    const bottomSheetRef = useRef<BottomSheet>(null);


    useEffect(() => {
        loadUserData();
    }, []);

    const loadUserData = async () => {
        const data = await AsyncStorage.getItem('userToken');
        if (data) {
            setUserData(JSON.parse(data));
        }
    };

    const handleSubtaskChange = (idx: number, field: 'title' | 'description', value: string) => {
        setSubtasks(prev => {
            const updated = [...prev];
            updated[idx] = { ...updated[idx], [field]: value };
            return updated;
        });
    };

    const addSubtask = () => {
        if (subtasks.length < MAX_SUBTASKS) {
            setSubtasks(prev => [...prev, { title: '', description: '' }]);
        }
    };

    const removeSubtask = (idx: number) => {
        setSubtasks(prev => prev.filter((_, i) => i !== idx));
    };

    const handleEditReward = () => {
        bottomSheetRef.current?.expand();
    };

    const handleRewardChange = (text: string) => {
        // Only allow numbers and limit to 500
        const numberOnly = text.replace(/[^0-9]/g, '');
        const number = parseInt(numberOnly) || 0;
        if (number <= 500) {
            setReward(numberOnly);
        }
    };

    const handleSubmit = async () => {
        if (!userData?.organization_id) {
            // Show error about missing org
            return;
        }

        if (!title || !description || selectedUsers.length === 0 || !startDate || !endDate) {
            // Show error about missing fields
            return;
        }

        setIsSubmitting(true);

        try {
            // Upload images first if any
            const uploadedImageUrls = await Promise.all(
                images.map(async (image) => {
                    const response = await api.put(`/api/upload-image`, { image });
                    return response.data.secure_url;
                })
            );

            const taskData = {
                title,
                description,
                organization_id: userData.organization_id,
                creator_id: userData.user_id,
                performers: selectedUsers.map(user => user.user_id),
                subtasks,
                start_date: startDate,
                finish_date: endDate,
                reward_points: parseInt(reward),
                images: uploadedImageUrls
            };

            const response = await api.post('/api/tasks', taskData);

            if (response.data.success) {
                navigation.goBack();
            }
        } catch (error) {
            console.error('Error creating task:', error);
            // Show error message
        } finally {
            setIsSubmitting(false);
        }
    };


    // Navigation functions
    const goNext = () => {
        if (currentStep < DOTS_COUNT - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            handleSubmit();
        }
    };

    const goBack = () => {
        if (currentStep > 0) setCurrentStep(currentStep - 1);
    };


    // Render functions
    const renderStepContent = () => {
        if (currentStep === 0) {
            return (
                <Step1
                    title={title}
                    setTitle={setTitle}
                    description={description}
                    setDescription={setDescription}
                    subtasks={subtasks}
                    onSubtaskChange={handleSubtaskChange}
                    onAddSubtask={addSubtask}
                    onRemoveSubtask={removeSubtask}
                    styles={styles}
                    images={images}
                    setImages={setImages}
                />
            );
        }
        return <Step2 
            styles={styles} 
            onEditReward={handleEditReward} 
            startDate={startDate}
            endDate={endDate}
            setStartDate={setStartDate}
            setEndDate={setEndDate}
            selectedUsers={selectedUsers}
            setSelectedUsers={setSelectedUsers}
        />;
    };

    const renderDots = () => (
        <View style={styles.dotsContainer}>
            <View style={[
                styles.dotBar,
                currentStep === 0 && { width: 28, justifyContent: 'flex-start' },
                currentStep === 1 && { width: 52, justifyContent: 'flex-start' },
            ]}>
                {Array.from({ length: DOTS_COUNT }).map((_, idx) => (
                    <View
                        key={idx}
                        style={[
                            styles.dotBarDot,
                            idx <= currentStep ? styles.dotBarDotActive : styles.dotBarDotInactive,
                            idx > 0 && { marginLeft: 16 }
                        ]}
                    />
                ))}
            </View>
        </View>
    );

    const renderBottomButtons = () => (
        <View style={styles.bottomNavContainer}>
            {currentStep > 0 ? (
                <View style={{ flex: 1, flexDirection: 'row', gap: 10 }}>
                    <TouchableOpacity style={[styles.navButton, {paddingHorizontal: 30 }]} onPress={goBack}>
                        <Text style={styles.navButtonText}>Назад</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.navButton, styles.navButtonPrimary, { flex: 1 }]} onPress={goNext}>
                        <Text style={[styles.navButtonText, { color: '#fff' }]}>
                            {currentStep === DOTS_COUNT - 1 ? 'Создать' : 'Далее'}
                        </Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <TouchableOpacity style={[styles.navButton, styles.navButtonPrimary, { flex: 1 }]} onPress={goNext}>
                    <Text style={[styles.navButtonText, { color: '#fff' }]}>Далее</Text>
                </TouchableOpacity>
            )}
        </View>
    );


    return (
        <GestureHandlerRootView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="gray" />
            
            {/* Header */}
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
                <Text semiBold style={styles.headerTitle}>Новое задание</Text>
            </View>

            {/* Main Content */}
            <View style={styles.contentWrapper}>
                {renderStepContent()}
            </View>

            {/* Bottom Navigation */}
            <View style={styles.bottomContainer}>
                {renderDots()}
                {renderBottomButtons()}
            </View>

            {/* Bottom Sheet */}
            <BottomSheet
                ref={bottomSheetRef}
                snapPoints={['50%']}
                enablePanDownToClose={true}
                index={-1}
            >
                <BottomSheetView style={styles.contentContainer}>
                    <View style={[styles.inputBlock, {padding: 20, gap: 10}]}>
                        <Text semiBold style={{fontSize: 16}}>Зачем нужна награда?</Text>
                        <Text style={{fontSize: 12, lineHeight: 17}}>
                            Используя систему награждения сотрудников за досрочное выполнение заданий, 
                            вы позволите сотрудникам накапливать баллы. Эти баллы могут быть впоследствии 
                            использованы для конвертации в премию и повышения уровня.
                        </Text>
                    </View>

                    <View style={styles.inputBlock}>
                        <View style={styles.inputRow}>
                            <View style={styles.inputIconRow}>
                                <Image source={require('../assets/icons/medal.png')} style={styles.inputIcon} />
                                <Text semiBold style={{fontSize: 16}}>Награда за выполнение</Text>
                            </View>
                        </View>
        
                        <View style={[styles.inputRow, {
                            borderBottomWidth: 0,
                            flexDirection: 'row',
                            padding: 0,
                        }]}>
                            <View style={{ flex: 1, alignItems: 'center', padding: 20 }}>
                                <TextInput
                                    style={{
                                        fontSize: 44,
                                        color: '#2A2A2A',
                                        textAlign: 'center',
                                        padding: 0,
                                        width: '100%',
                                    }}
                                    value={reward}
                                    onChangeText={handleRewardChange}
                                    keyboardType="numeric"
                                    maxLength={3}
                                />
                            </View>
                            <View style={{ flex: 1, alignItems: 'center', padding: 20 }}>
                                <Text semiBold style={{ fontSize: 44, color: '#2A2A2A' }}>🏆</Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.bottomSheetButtons}>
                        <TouchableOpacity 
                            style={[styles.navButton, {paddingHorizontal: 30}]} 
                            onPress={() => bottomSheetRef.current?.close()}
                        >
                            <Text style={styles.navButtonText}>Отмена</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                            style={[styles.navButton, styles.navButtonPrimary, { flex: 1 }]} 
                            onPress={() => bottomSheetRef.current?.close()}
                        >
                            <Text style={[styles.navButtonText, { color: '#fff' }]}>Применить</Text>
                        </TouchableOpacity>
                    </View>
                </BottomSheetView>
            </BottomSheet>
        </GestureHandlerRootView>
    );
};


const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#00FF96',
    },

    contentContainer: {
        flex: 1,
        padding: 20,
        gap: 20,
        alignItems: 'center',
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
        backgroundColor: 'white',
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    backIcon: {
        width: 54,
        height: 54,
        tintColor: '#2A2A2A',
    },
    headerTitle: {
        fontSize: 24,
        color: '#2A2A2A',
    },
    contentWrapper: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderTopRightRadius: 45,
        borderTopLeftRadius: 45,
        padding: 20,
        gap: 20,
    },
    inputBlock: {
        width: '100%',
        backgroundColor: '#F4F4F4',
        borderRadius: 25,
    },
    inputRow: {
        width: '100%',
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        borderBottomWidth: 1,
        borderColor: '#DCDCDC',
    },
    inputIconRow: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    inputIcon: {
        width: 24,
        height: 24,
        tintColor: '#2A2A2A',
    },
    textInput: {
        flex: 1,
        fontSize: 16,
        color: '#2A2A2A',
        padding: 0,
    },
    stepStub: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    bottomContainer: {
        width: '100%',
        paddingHorizontal: 20,
        paddingBottom: 24,
        backgroundColor: '#fff',
    },
    dotsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        marginTop: 8,
    },
    dotBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#00D87F',
        borderRadius: 16,
        width: 120,
        height: 28,
        justifyContent: 'flex-start', // изменено с center на flex-start
        paddingHorizontal: 10,
    },
    dotBarDot: {
        width: 8,
        height: 8,
        borderRadius: 8,
        backgroundColor: '#E0E0E0',
    },
    dotBarDotActive: {
        backgroundColor: '#fff',
    },
    dotBarDotInactive: {
        backgroundColor: '#E0E0E0',
    },
    bottomNavContainer: {
        flexDirection: 'row',
        width: '100%',
    },
    navButton: {
        height: 64,
        borderRadius: 25,
        backgroundColor: '#F4F4F4',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    navButtonPrimary: {
        backgroundColor: '#232323',
    },
    navButtonText: {
        fontSize: 18,
        color: '#232323',
    },
    bottomSheetButtons: {
        flexDirection: 'row',
        width: '100%',
        gap: 10,
        marginBottom: 20,
    },
});


export default CreateTaskScreen;
