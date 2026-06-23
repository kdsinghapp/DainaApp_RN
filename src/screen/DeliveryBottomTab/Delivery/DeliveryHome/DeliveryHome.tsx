import React, {
  useMemo,
  useRef,
  useState,
  useEffect,
  useCallback,
} from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Easing,
  FlatList,
  RefreshControl,
  Animated,
  Platform,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import ReAnimated, {
  FadeInDown,
  FadeIn,
  Layout,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import StatusBarComponent from "../../../../compoent/StatusBarCompoent";
import HomeHeaderBar from "../../../../compoent/HomeHeaderBar";
import imageIndex from "../../../../assets/imageIndex";
import { useDeliveryContext } from "../../../../context/DeliveryContext";
import { styles } from "./style";
import CurrentLocation from "../../../../CurrentLocation";
import ScreenNameEnum from "../../../../routes/screenName.enum";
import useDashboard from "../../../BottomTab/DashBoard/useDashboard";
import NewOrderNotificationModal from "../../../../compoent/NewOrderNotificationModal";
import OfferAcceptedModal from "../../../../compoent/OfferAcceptedModal";
import { GetDashboardCounts, GetProfileApi } from "../../../../Api/apiRequest";
import strings from "../../../../localization/Localization";
import OnlineSlideRight from "../../../../compoent/OnlineSlideRight";
import font from "../../../../theme/font";
import { slice } from "@tensorflow/tfjs";
import useNotificationCount from "../../../../hooks/useNotificationCount";

const DeliveryHome = () => {
  const ctx = useDeliveryContext();
  if (!ctx) return null;
  const {
    isLoading,
    requests,
    coords,
    newOrderNotification,
    fetchAvailableRequests,
    isOnline,
    setIsOnline,
    isConnected,
  } = ctx;

  const [counts, setCounts] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const { notificationCount, markAllNotificationsRead } =
    useNotificationCount();

  const fetchCounts = async () => {
    const res = await GetDashboardCounts(() => { });
    if (res && (res.status === 1 || res.status === "1")) {
      setCounts(res);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchCounts(), fetchAvailableRequests()]);
    setRefreshing(false);
  };

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
      (item: any) => item.deliveryStatus?.toLowerCase() === "pending"
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
  const { locationRef, address, currentlocation } = useDashboard();
  return (
    <SafeAreaView style={styles.container}>
      <StatusBarComponent />
      <NewOrderNotificationModal />
      <OfferAcceptedModal />
      {/* <LoadingModal visible={isLoading} /> */}

      <CurrentLocation ref={locationRef} />
      <HomeHeaderBar
        location={currentlocation || address}
        onNotificationPress={() => {
          markAllNotificationsRead();
          navigation.navigate(ScreenNameEnum.NotificationsScreen);
        }}
        hasNotification={notificationCount > 0}
        notificationCount={notificationCount}
      />

      {/* 
      <HomeHeaderBar
        location={ "Wallace, Australia"}
        onLocationPress={() => console.log("Change location")}
        onNotificationPress={() => console.log("Notifications clicked")}
        hasNotification={true}
        style1={{
        
        }}
      /> */}
      <View
        style={{
          flex: 1,
          marginBottom: Platform.OS === "ios" ? 20 : 65,
        }}
      >
        <Animated.View
          style={{
            flex: 1,
            transform: [{ translateX }],
            opacity: fade,
          }}
        >
          <FlatList
            showsHorizontalScrollIndicator={false}
            ListHeaderComponent={
              <>
                <OnlineSlideRight
                  coords={coords || undefined}
                  onSlideSuccess={(newStatus: boolean) => {
                    // successToast(newStatus ? "You are now Online" : "You are now Offline");
                  }}
                  isOnline={isOnline}
                  setIsOnline={setIsOnline}
                />

                <View style={styles.container1}>
                  {/* Earnings */}
                  <ReAnimated.View
                    entering={FadeInDown.delay(100).duration(500)}
                    style={styles.card1}
                  >
                    <Image
                      source={imageIndex.cars}
                      style={{
                        height: 35,
                        tintColor: "#7B3F00",
                        // tintColor: "#D2B48C",
                        width: 35,
                      }}
                      resizeMode="contain"
                    />
                    <Text style={styles.title}>{strings.PendingRides}</Text>
                    <Text
                      style={{
                        color: "black",
                        fontSize: 18,
                        fontFamily: font.MonolithRegular,
                        marginTop: 5,
                      }}
                    >
                      {counts?.pendingRides || "0"}
                    </Text>
                  </ReAnimated.View>

                  {/* Rides */}
                  <ReAnimated.View
                    entering={FadeInDown.delay(200).duration(500)}
                    style={styles.card1}
                  >
                    <Image
                      source={imageIndex.cars}
                      style={{
                        height: 35,
                        width: 35,
                        tintColor: "#7B3F00",
                      }}
                      resizeMode="contain"
                    />
                    <Text style={styles.title}>{strings.TodaysRides}</Text>
                    <Text
                      style={{
                        color: "black",
                        fontSize: 18,
                        fontFamily: font.MonolithRegular,
                        marginTop: 5,
                      }}
                    >
                      {counts?.todayRides || "0"}
                    </Text>
                  </ReAnimated.View>
                </View>
                <View style={styles.container1}>
                  {/* Earnings */}
                  <ReAnimated.View
                    entering={FadeInDown.delay(300).duration(500)}
                    style={styles.card1}
                  >
                    <Image
                      source={imageIndex.earing}
                      style={{
                        height: 35,
                        width: 35,
                        tintColor: "#7B3F00",
                      }}
                      resizeMode="contain"
                    />
                    <Text style={styles.title}>{strings.TotalEarnings}</Text>
                    <Text
                      style={{
                        color: "black",

                        fontSize: 18,
                        fontFamily: font.MonolithRegular,
                        marginTop: 5,
                      }}
                    >
                      {counts?.totalEarnings || "0.00"} ₮
                    </Text>
                  </ReAnimated.View>

                  {/* Rides */}
                  <ReAnimated.View
                    entering={FadeInDown.delay(400).duration(500)}
                    style={styles.card1}
                  >
                    <Image
                      source={imageIndex.cars}
                      style={{
                        height: 35,
                        tintColor: "#7B3F00",

                        width: 35,
                      }}
                      resizeMode="contain"
                    />
                    <Text style={styles.title}>{strings.WeeklyRides}</Text>
                    <Text
                      style={{
                        color: "black",

                        fontSize: 18,
                        fontFamily: font.MonolithRegular,
                        marginTop: 5,
                      }}
                    >
                      {counts?.weeklyRides || "0"}
                    </Text>
                  </ReAnimated.View>
                </View>

                <View style={styles.ordersHeader}>
                  <Text style={styles.sectionTitle1}>
                    {" "}
                    Nearby {strings.Order}
                  </Text>
                  <Text
                    onPress={() => {
                      navigation.navigate(ScreenNameEnum.AllOrder);
                    }}
                    style={[styles.sectionTitle1, { textAlign: "right" }]}
                  >
                    {strings?.ViewAll}
                  </Text>
                </View>
              </>
            }
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            data={filteredRequests.slice(0, 10)}
            style={{
              marginTop: 12,
            }}
            keyExtractor={(item: any) =>
              String(item.id ?? item.parcelId ?? item.trackingId)
            }
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
            initialNumToRender={8}
            maxToRenderPerBatch={8}
            windowSize={7}
            renderItem={({ item, index }) => {
              const pickupAddress =
                item?.pickupLocation ||
                item?.pickup?.location ||
                strings.Unknown;
              const dropAddress =
                item?.dropLocation || item?.drop?.location || strings.Unknown;
              const orderCode = item?.trackingId || item?.id;
              return (
                <ReAnimated.View
                  entering={FadeInDown.delay(Math.min(index, 8) * 60)}
                >
                  <TouchableOpacity
                    style={styles.card}
                    activeOpacity={0.85}
                    onPress={() => {
                      navigation.navigate(ScreenNameEnum.ParcelDetails, {
                        item: item,
                      });
                    }}
                  >
                    <View style={styles.cardAccent} />
                    <View style={styles.cardTop}>
                      <View style={styles.iconBox}>
                        <Image
                          source={imageIndex?.icons || { uri: "" }}
                          style={{ height: 20, width: 20 }}
                          resizeMode="contain"
                        />
                      </View>

                      <View style={styles.cardHeaderText}>
                        <Text style={styles.cardMetaLabel}>
                          {strings.Order || "Order"}
                        </Text>
                        <View style={styles.cardIdRow}>
                          <Text
                            style={[styles.cardId, styles.bold]}
                            numberOfLines={1}
                          >
                            #{orderCode}
                          </Text>
                          {item?.date ? (
                            <>
                              <Text style={styles.bulletSeparator}>•</Text>
                              <Text style={styles.cardDate} numberOfLines={1}>
                                {item?.date}
                              </Text>
                            </>
                          ) : null}
                        </View>
                      </View>

                      <View style={styles.cardChevron}>
                        <Icon
                          name="chevron-forward"
                          size={16}
                          color="#64748B"
                        />
                      </View>
                    </View>

                    <View style={styles.routeRow}>
                      <View style={styles.routeHeader}>
                        <Text style={styles.routeTitle}>
                          {strings.PickupAndDrop || "Pickup & Drop"}
                        </Text>
                        <View style={styles.routeBadge}>
                          <Icon
                            name="navigate-outline"
                            size={13}
                            color="#64748B"
                          />
                        </View>
                      </View>
                      <View style={styles.timelineContainer}>
                        <View style={styles.timelineDotStart} />
                        <View style={styles.timelineLine} />
                        <View style={styles.timelineDotEnd} />
                      </View>
                      <View style={styles.routeContent}>
                        <View style={styles.labelRow}>
                          <Icon
                            name="radio-button-on"
                            size={10}
                            color="#FFCC00"
                          />
                          <Text style={styles.label}>{strings?.From}</Text>
                        </View>
                        <Text style={styles.value} numberOfLines={2}>
                          {pickupAddress}
                        </Text>

                        <View style={[styles.labelRow, styles.dropLabelRow]}>
                          <Icon name="location" size={11} color="#10B981" />
                          <Text style={styles.label}>{strings?.To}</Text>
                        </View>
                        <Text style={styles.value} numberOfLines={2}>
                          {dropAddress}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.cardFooter}>
                      <Text style={styles.footerText} numberOfLines={1}>
                        {strings.ViewDetails || "View Details"}
                      </Text>
                      <Icon name="arrow-forward" size={15} color="#111827" />
                    </View>
                  </TouchableOpacity>
                </ReAnimated.View>
              );
            }}
            ListEmptyComponent={
              <View style={styles.emptyWrap}>
                <View style={styles.illustrationWrap}>
                  <View style={styles.illustrationBg} />
                  <Image
                    source={imageIndex.ordePracle}
                    style={styles.emptyIcon}
                  />
                </View>
                <Text style={styles.emptyTitle}>{strings.NoOrder}</Text>
              </View>
            }
          />
        </Animated.View>
      </View>
    </SafeAreaView>
  );
};

export default DeliveryHome;
