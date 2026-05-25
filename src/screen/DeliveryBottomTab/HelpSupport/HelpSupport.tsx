import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    Image,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Dimensions
} from 'react-native';
import { useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CustomHeader from '../../../compoent/CustomHeader';
import StatusBarComponent from '../../../compoent/StatusBarCompoent';
import LoadingModal from '../../../utils/Loader';
import CustomButton from '../../../compoent/CustomButton';
import imageIndex from '../../../assets/imageIndex';
import strings from '../../../localization/Localization';
import font from '../../../theme/font';
import { color } from '../../../constant';

const { width } = Dimensions.get('window');

const HelpSupport = () => {
    const navigation = useNavigation()
    const [SupportHelp, setSupportHelp] = useState('')
    const [isLoading, setLoading] = useState(false)
    const handleSubmit = async () => {
        if (!SupportHelp) {
            navigation.goBack();
        }
        else {
            try {
                // const response = await Support_Api(SupportHelp, setLoading,isLogin?.userData?.id,navigation);
            } catch (error) {
            }
        }
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBarComponent />
            {isLoading ? <LoadingModal visible={isLoading} /> : null}

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                >
                    <CustomHeader label={strings.Support} />

                    <View style={styles.content}>
                        <View style={styles.illustrationWrap}>
                            <Image
                                source={imageIndex.helpPrva}
                                style={styles.illustration}
                                resizeMode="contain"
                            />
                        </View>

                        <View style={styles.card}>
                            <Text style={styles.cardHeaderTitle}>{strings.HowCanWeHelp}</Text>
                            <View style={styles.inputWrapper}>
                                <TextInput
                                    value={SupportHelp}
                                    onChangeText={setSupportHelp}
                                    style={styles.textInput}
                                    placeholder={strings.TypeHere}
                                    placeholderTextColor="#94A3B8"
                                    multiline
                                    textAlignVertical="top"
                                />
                            </View>
                        </View>

                        <View style={styles.buttonWrap}>
                            <CustomButton
                                title={strings.Submit}
                                onPress={handleSubmit}
                            />
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default HelpSupport;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC'
    },
    scrollContent: {
        flexGrow: 1,
    },
    content: {
        paddingHorizontal: 24,
        paddingBottom: 40,
    },
    illustrationWrap: {
        height: 300,
        justifyContent: 'center',
        alignItems: 'center',
        marginVertical: 20,
        position: 'relative',
    },
    illustrationBg: {
        position: 'absolute',
        width: width * 0.7,
        height: width * 0.7,
        borderRadius: width * 0.35,
        backgroundColor: color.primary,
        opacity: 0.05,
    },
    illustration: {
        width: '100%',
        height: '100%',
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 28,
        padding: 24,
        borderWidth: 1,
        borderColor: "#d6e1f9ff",
        ...Platform.select({
            ios: {
                shadowColor: '#0F172A',
                shadowOffset: { width: 0, height: 12 },
                shadowOpacity: 0.06,
                shadowRadius: 16,
            },
            android: {
                elevation: 0,
            },
        }),
    },
    cardHeaderTitle: {
        fontSize: 18,
        fontFamily: font.MonolithRegular,
        color: '#0F172A',
        marginBottom: 16,
    },
    inputWrapper: {
        backgroundColor: '#F8FAFC',
        borderRadius: 16,
        padding: 16,
        minHeight: 160,
        borderWidth: 1,
        borderColor: '#EEF2F6',
    },
    textInput: {
        fontSize: 15,
        fontFamily: font.MonolithRegular,
        color: '#0F172A',
        flex: 1,
    },
    buttonWrap: {
        marginTop: 32,
    }
});
