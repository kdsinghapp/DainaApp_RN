import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SectionList, ActivityIndicator, TouchableOpacity, RefreshControl, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CustomHeader from '../../compoent/CustomHeader';
import { useNavigation } from '@react-navigation/native';
import strings from '../../localization/Localization';
import { GetNotifications } from '../../Api/apiRequest';
import { color } from '../../constant';
import moment from 'moment';
import font from '../../theme/font';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const NotificationItem = ({ item }: any) => {
    const getIconDetails = (type: string) => {
        // Strict App Theme (Yellow & Black)
        switch (type?.toLowerCase()) {
            case 'chat':
                return { name: 'chat-processing-outline', bgColor: color.primaryLight || '#FFF9E6', iconColor: color.secondary || '#0F172A' };
            case 'order':
                return { name: 'package-variant-closed', bgColor: color.primaryLight || '#FFF9E6', iconColor: color.secondary || '#0F172A' };
            case 'offer':
                return { name: 'tag-outline', bgColor: color.primaryLight || '#FFF9E6', iconColor: color.secondary || '#0F172A' };
            case 'system':
                return { name: 'cog-outline', bgColor: color.borderLight || '#F1F5F9', iconColor: color.textMuted || '#64748B' };
            default:
                return { name: 'bell-outline', bgColor: color.primaryLight || '#FFF9E6', iconColor: color.secondary || '#0F172A' };
        }
    };

    const formatDate = (date: string) => {
        const m = moment(date);
        if (moment().isSame(m, 'day')) {
            return m.format('hh:mm A');
        }
        if (moment().subtract(1, 'days').isSame(m, 'day')) {
            return 'Yesterday';
        }
        return m.format('DD MMM');
    };

    const iconDetails = getIconDetails(item.type || 'default');
    const isUnread = item.isRead === false || item.isRead === 0;

    return (
        <TouchableOpacity
            activeOpacity={0.7}
            style={[
                styles.itemContainer,
            ]}
        >
            <View style={[styles.iconWrapper,]}>
                <Icon name={iconDetails.name} size={26} color={iconDetails.iconColor} />
            </View>

            <View style={styles.textContainer}>
                <View style={styles.headerRow}>
                    <Text numberOfLines={1} style={[styles.title, isUnread && styles.unreadTitle]}>
                        {item.title}
                    </Text>
                    {item.createdAt && (
                        <Text style={[styles.date, isUnread && styles.unreadDate]}>
                            {formatDate(item.createdAt)}
                        </Text>
                    )}
                </View>
                <Text numberOfLines={2} style={styles.body}>{item.body}</Text>
            </View>

        </TouchableOpacity>
    );
};

const NotificationsScreen = () => {
    const navigation = useNavigation();
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [sections, setSections] = useState([]);

    useEffect(() => {
        fetchNotifications();
    }, []);

    const groupNotifications = (data: any[]) => {
        const groups: { [key: string]: any[] } = {
            [strings.Today || 'Today']: [],
            [strings.Yesterday || 'Yesterday']: [],
            [strings.Earlier || 'Earlier']: [],
        };

        data.forEach(item => {
            const date = moment(item.createdAt);
            if (date.isSame(moment(), 'day')) {
                groups[strings.Today || 'Today'].push(item);
            } else if (date.isSame(moment().subtract(1, 'days'), 'day')) {
                groups[strings.Yesterday || 'Yesterday'].push(item);
            } else {
                groups[strings.Earlier || 'Earlier'].push(item);
            }
        });

        return Object.keys(groups)
            .map(title => ({ title, data: groups[title] }))
            .filter(section => section.data.length > 0);
    };

    const fetchNotifications = async (isRefreshing = false) => {
        if (isRefreshing) setRefreshing(true);
        else setLoading(true);

        try {
            const res = await GetNotifications(setLoading);
            if (res && (res.status === 1 || res.status === "1")) {
                const groupedData = groupNotifications(res.notifications || []);
                setSections(groupedData);
            }
        } catch (error) {
            console.error("Fetch Notifications Error:", error);
        } finally {
            setRefreshing(false);
            setLoading(false);
        }
    };

    const onRefresh = () => {
        fetchNotifications(true);
    };

    return (
        <SafeAreaView style={styles.container}>
            <CustomHeader label={strings.Notifications || "Notifications"} />
            {loading && !refreshing ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={color.primary} />
                </View>
            ) : (
                <SectionList
                    sections={sections}
                    keyExtractor={(item, index) => item.id?.toString() || index.toString()}
                    renderItem={({ item }) => <NotificationItem item={item} />}
                    renderSectionHeader={({ section: { title } }) => (
                        <View style={styles.sectionHeaderContainer}>
                            <Text style={styles.sectionHeader}>{title}</Text>
                        </View>
                    )}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <View style={styles.emptyIconCircle}>
                                <Icon name="bell-off-outline" size={40} color={color.textMuted} />
                            </View>
                            <Text style={styles.emptyText}>{strings.NoNotifications || "No notifications found"}</Text>
                            <Text style={styles.emptySubText}>We'll notify you when something arrives!</Text>
                        </View>
                    }
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[color.primary]} />
                    }
                />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: color.background || '#F8FAFC',
    },
    listContent: {
        paddingHorizontal: 16,
        paddingBottom: 40,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 100,
    },
    emptyIconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    emptyText: {
        fontSize: 18,
        color: color.textMain || '#0F172A',
        fontFamily: font.MonolithRegular,
    },
    emptySubText: {
        fontSize: 14,
        color: color.textMuted || '#64748B',
        fontFamily: font.MonolithRegular,
        marginTop: 4,
    },
    sectionHeaderContainer: {
        backgroundColor: color.background || '#F8FAFC',
        paddingVertical: 12,
        paddingTop: 20,
    },
    sectionHeader: {
        fontSize: 14,
        fontFamily: font.MonolithRegular,
        color: color.textMuted || '#64748B',
        letterSpacing: 1,
    },
    itemContainer: {
        flexDirection: "row",
        padding: 16,
        borderRadius: 14,
        marginBottom: 14,
        backgroundColor: "#fff",

        ...Platform.select({
            android: {
                borderWidth: 1,
                borderColor: "#E5E7EB",
            },

            ios: {
                shadowColor: "#000",
                shadowOffset: {
                    width: 0,
                    height: 2,
                },
                shadowOpacity: 0.08,
                shadowRadius: 4,


            },
        }),
    },
    readBackground: {
        backgroundColor: '#FFFFFF',
    },
    unreadBackground: {
        borderWidth: 1,
    },
    iconWrapper: {
        width: 52,
        height: 52,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    textContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 4,
    },
    title: {
        flex: 1,
        fontSize: 16,
        color: color.textMain || '#0F172A',
        fontFamily: font.MonolithRegular,
        lineHeight: 20,
        marginRight: 8,
    },
    unreadTitle: {
        color: "black",
    },
    body: {
        fontSize: 13,
        color: color.textMuted || '#64748B',
        lineHeight: 19,
        fontFamily: font.MonolithRegular,
        marginTop: 2,
    },
    date: {
        fontSize: 11,
        color: color.textMuted || '#94A3B8',
        fontFamily: font.MonolithRegular,
        marginTop: 2,
        marginLeft: 8,
    },
    unreadDate: {
        color: color.secondary || '#0F172A',
        fontFamily: font.MonolithRegular,
    },
    unreadDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: color.primary || '#FFCC00',
        position: 'absolute',
        top: 12,
        right: 12,
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    chevronIcon: {
        marginLeft: 8,
        alignSelf: 'center',
        opacity: 0.3,
    },
});

export default NotificationsScreen;
