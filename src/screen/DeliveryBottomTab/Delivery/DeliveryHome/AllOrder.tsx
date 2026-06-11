import React, { useMemo, useRef, useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Easing,
  FlatList,
  RefreshControl,
  Animated,
  ActivityIndicator,
} from "react-native";
import ReAnimated, { FadeInDown, } from "react-native-reanimated";
import { SafeAreaView, } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import StatusBarComponent from "../../../../compoent/StatusBarCompoent";
import imageIndex from "../../../../assets/imageIndex";
import { useDeliveryContext } from "../../../../context/DeliveryContext";
import { styles } from "./style";
import ScreenNameEnum from "../../../../routes/screenName.enum";
import useDashboard from "../../../BottomTab/DashBoard/useDashboard";
import { GetDashboardCounts, GetProfileApi } from "../../../../Api/apiRequest";
import strings from "../../../../localization/Localization";
import CustomHeader from "../../../../compoent/CustomHeader";
import { color } from "../../../../constant";
import NewOrderNotificationModal from "../../../../compoent/NewOrderNotificationModal";
import OfferAcceptedModal from "../../../../compoent/OfferAcceptedModal";

const AllOrder = () => {
  const ctx = useDeliveryContext();
  if (!ctx) return null;
  const { isLoading, requests, coords, newOrderNotification, fetchAvailableRequests, isOnline, setIsOnline, isConnected } = ctx;

  const [counts, setCounts] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);


  const fetchCounts = async () => {
    const res = await GetDashboardCounts(() => { });
    if (res && (res.status === 1 || res.status === "1")) {
      setCounts(res);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchCounts(),
      fetchAvailableRequests()
    ]);
    setRefreshing(false);
  };

  // useEffect(() => {
  //   Animated.timing(pillX, {
  //     toValue: isOnline ? 1 : 0,
  //     duration: 260,
  //     easing: Easing.out(Easing.quad),
  //     useNativeDriver: true,
  //   }).start();
  // }, [isOnline]);

  const listSlide = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    listSlide.setValue(0);
    Animated.timing(listSlide, {
      toValue: 1,
      duration: 220,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, []);

  const translateX = listSlide.interpolate({
    inputRange: [0, 1],
    outputRange: [30, 0],
  });
  const fade = listSlide.interpolate({
    inputRange: [0, 1],
    outputRange: [0.2, 1],
  });
  const navigation = useNavigation<any>();
  const filteredRequests = useMemo(() => {
    if (!requests || requests?.length === 0) return [];
    return requests.filter(
      (item: any) => item.deliveryStatus?.toLowerCase() === "pending",
    );
  }, [requests]);
  useFocusEffect(
    useCallback(() => {
      const fetchCounts = async () => {
        const res = await GetDashboardCounts(() => { });
        if (res && (res?.status === 1 || res.status === "1")) {
          setCounts(res);
        }
      };

      fetchCounts();

      return () => {
        // optional cleanup if needed
      };
    }, [])
  );
  return (
    <SafeAreaView style={styles.container}>
      <StatusBarComponent />
      <NewOrderNotificationModal />
      <OfferAcceptedModal />
      <Animated.View
        style={{
          flex: 1,
          transform: [{ translateX }],
          opacity: fade,
        }}
      >

        {isLoading ? <ActivityIndicator
          color={color.primary}
          size="large"
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
          }}
        /> : (
          <FlatList
            data={filteredRequests}
            style={{
              marginTop: 12,
            }}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            keyExtractor={(item: any) => String(item.id ?? item.parcelId ?? item.trackingId)}
            showsVerticalScrollIndicator={false}
            initialNumToRender={8}
            maxToRenderPerBatch={8}
            windowSize={7}
            ListHeaderComponent={
              <>
                <CustomHeader label={strings.Order} />
                <View style={styles.ordersHeader}>
                  <Text style={styles.sectionTitle1}> Nearby {strings.Order}</Text>
                </View>
              </>
            }
            renderItem={({ item, index }) => {
              return (
                <ReAnimated.View entering={FadeInDown.delay(Math.min(index, 8) * 60)}>
                  <TouchableOpacity
                    style={styles.card}
                    activeOpacity={0.85}
                    onPress={() => {
                      navigation.navigate(ScreenNameEnum.ParcelDetails, {
                        item: item,
                      });
                    }}
                  >
                    <View style={styles.cardTop}>
                      <View style={styles.iconBox}>
                        <Image
                          source={imageIndex?.icons || { uri: "" }}
                          style={{ height: 20, width: 20 }}
                          resizeMode="contain"
                        />
                      </View>

                      <Text style={[styles.cardId, styles.bold]}>
                        #{item?.trackingId || item?.id}
                      </Text>
                      <Text style={styles.bulletSeparator}>•</Text>
                      <Text style={styles.cardDate}>
                        {item?.date}
                      </Text>
                      <View style={{ flex: 1 }} />
                    </View>
                    <View style={styles.routeRow}>
                      <View style={styles.timelineContainer}>
                        <View style={styles.timelineDotStart} />
                        <View style={styles.timelineLine} />
                        <View style={styles.timelineDotEnd} />
                      </View>
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={styles.label}>{strings?.From}</Text>
                        <Text style={styles.value}  >
                          {item?.pickupLocation || item?.pickup?.location}
                        </Text>
                        <Text style={[styles.label, { marginTop: 12 }]}>{strings?.To}</Text>
                        <Text style={styles.value} >
                          {item?.dropLocation || item?.drop?.location}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                </ReAnimated.View>
              );
            }}
            ListEmptyComponent={
              <View style={styles.emptyWrap}>
                <View style={styles.illustrationWrap}>
                  <View style={styles.illustrationBg} />
                  <Image source={imageIndex.ordePracle} style={styles.emptyIcon} />
                </View>
                <Text style={styles.emptyTitle}>{strings.NoOrder}</Text>
              </View>
            }
          />
        )}

      </Animated.View>
    </SafeAreaView>
  );
};

export default AllOrder;
