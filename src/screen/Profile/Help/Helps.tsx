import React, { useRef, useState } from 'react';
import {
    View,
    Text,
    TextInput,
    FlatList,

    Animated,
    TouchableWithoutFeedback,
    Keyboard
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CustomHeader from '../../../compoent/CustomHeader';
import { styles } from './style';
import useHelp from './useHelp';
import { color } from '../../../constant';
import SvgIndex from '../../../assets/svgIndex';
import CustomLoader from '../../../compoent/CustomLoader';
import svgIndex from '../../../assets/svgIndex';

const HelpScreen = () => {
    const { navigation, Loading, search, setSearch, filteredData } = useHelp();

    const [isFocused, setIsFocused] = useState(false);
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const handleFocus = () => {
        setIsFocused(true);
        Animated.spring(scaleAnim, {
            toValue: 1.05,
            useNativeDriver: true,
        }).start();
    };

    const handleBlur = () => {
        setIsFocused(false);
        Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
        }).start();
    };

    return (
        <SafeAreaView style={styles.safeContainer}>

            <CustomHeader
                navigation={navigation}
                menuType="svg"
                MenuIcon={svgIndex.BackSvg}
                label={'Helps'}

            />

            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View style={styles.container}>

                    {/* Search Bar with Animation */}
                    <Animated.View
                        style={[
                            styles.searchContainer,
                            { transform: [{ scale: scaleAnim }] },
                            { borderColor: color.borderColor, borderWidth: 1 }
                            // { borderColor: isFocused ? '#4CBCA6' : '#7D9A9B', borderWidth: 1 }
                        ]}
                    >
                        {/* <Image
                            source={imageIndex.search}
                            style={{ height: 20, width: 20, marginRight: 10 }}
                            tintColor={'grey'}
                        /> */}
                        <SvgIndex.Search
                            style={{ marginRight: 10 }}
                        />
                        <TextInput
                            allowFontScaling={false}
                            placeholder="Tap here to search"
                            value={search}
                            placeholderTextColor={"#696969"}
                            onChangeText={setSearch}
                            onFocus={handleFocus}
                            onBlur={handleBlur}
                            style={styles.searchInput}
                        />
                    </Animated.View>
                    {Loading ? (
                        <CustomLoader message="" />
                    ) : (
                        <>
                            <Text allowFontScaling={false} style={styles.headerText}>
                                Frequently asked questions
                            </Text>
                        </>
                    )}

                </View>
            </TouchableWithoutFeedback>
        </SafeAreaView>
    );
};

export default HelpScreen;
