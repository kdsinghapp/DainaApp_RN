import React, { useEffect, useState } from 'react';
import { Image, ScrollView, View, StyleSheet, useWindowDimensions, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import HTML from 'react-native-render-html';
import Loading from '../../utils/Loader';
import imageIndex from '../../assets/imageIndex';
import StatusBarComponent from '../../compoent/StatusBarCompoent';
import CustomHeader from '../../compoent/CustomHeader';
import { hp } from '../../utils/Constant';
import font from '../../theme/font';
import { Termsconditions } from '../../Api/apiRequest';
import LoadingModal from '../../utils/Loader';
import strings from '../../localization/Localization';
const LegalPoliciesScreen = () => {
    const [isLoading, setLoading] = useState(false);
    const [content, setContent] = useState<string>('');
    const { width } = useWindowDimensions();

    useEffect(() => {
        getPrivacyPolicy();
    }, []);

    const getPrivacyPolicy = async () => {
        try {
            const response = await Termsconditions(setLoading);
            if (response && response?.content) {
                setContent(response.content); // ✅ content is now set correctly
            } else {
                setContent(`<p>${strings.NoContentAvailable}</p>`);
            }
        } catch (error) {
            setContent(`<p>${strings.NoContentAvailable}</p>`);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            {isLoading && <Loading />}
            <StatusBarComponent />
            <LoadingModal visible={isLoading} />

            <CustomHeader label={strings.TermsConditions} />
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.contentContainer}
            >
                <View style={styles.illustrationWrapper}>
                    <Image
                        source={imageIndex.aboutus}
                        style={styles.illustration}
                        resizeMode="contain"
                    />
                </View>

                {content ? (
                    <HTML
                        source={{ html: content }}
                        contentWidth={width}
                        tagsStyles={styles.htmlStyles}
                    />
                ) : (
                    <Text style={styles.bodyText}>{strings.NoContentAvailable}</Text>
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    contentContainer: {
        padding: 12,
    },
    illustrationWrapper: {
        alignItems: 'center',
        marginBottom: 16,
    },
    illustration: {
        width: '80%',
        height: hp(30),
    },
    htmlStyles: {
        p: {
            fontSize: 14,
            color: '#333',
            lineHeight: 24,
            marginTop: 8,
            fontFamily: font.MonolithRegular,
        },
        h1: {
            fontSize: 22,
            color: '#000',
            marginBottom: 10,
            fontFamily: font.MonolithRegular,
        },
        h2: {
            fontSize: 18,
            color: '#222',
            marginBottom: 8,
            fontFamily: font.MonolithRegular,
        },
        a: {
            color: '#007bff',
        },
    },
    bodyText: {
        fontSize: 14,
        lineHeight: 20,
        color: '#666',
        fontFamily: font.MonolithRegular,


    },
});

export default LegalPoliciesScreen;
