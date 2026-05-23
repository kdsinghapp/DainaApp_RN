import React, { useMemo, useRef, useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Easing,
  FlatList,
  ScrollView,
  RefreshControl,
  Animated,
} from "react-native";
import ReAnimated, { FadeInDown, FadeIn, Layout } from "react-native-reanimated";
import { SafeAreaView, } from "react-native-safe-area-context";
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
import { successToast } from "../../../../utils/customToast";
import font from "../../../../theme/font";
import NetworkStatusModal from "../../../../compoent/NetworkStatusModal";

const DeliveryHome = () => {
  const ctx = useDeliveryContext();
  if (!ctx) return null;
  const { isLoading, requests, coords, newOrderNotification, fetchAvailableRequests, isOnline, setIsOnline, isConnected } = ctx;
  // console.log("newOrderNotification",newOrderNotification?.data?.user?.name)

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
  const navigation = useNavigation();
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
  const { locationRef, address, currentlocation } = useDashboard()
  return (
    <SafeAreaView style={styles.container}>
      <StatusBarComponent />
      <NewOrderNotificationModal />
      <OfferAcceptedModal />
      {/* <LoadingModal visible={isLoading} /> */}

      <CurrentLocation ref={locationRef} />
      <HomeHeaderBar
        location={currentlocation || address}
        onNotificationPress={() => navigation.navigate(ScreenNameEnum.NotificationsScreen)}
        hasNotification={false}
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
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={{
          marginBottom: 70,

        }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >

        <OnlineSlideRight
          coords={coords}
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
                fontFamily: font.MonolithRegular
                ,
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
                fontFamily: font.MonolithRegular
                ,
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

                fontSize: 18, fontFamily: font.MonolithRegular
                ,
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
                fontFamily: font.MonolithRegular
                ,
                marginTop: 5,
              }}
            >
              {counts?.weeklyRides || "0"}
            </Text>
          </ReAnimated.View>
        </View>

        <View style={styles.ordersHeader}>
          <Text style={styles.sectionTitle1}> Nearby {strings.Order}</Text>

        </View>





        <Animated.View
          style={{
            flex: 1, transform: [{ translateX }], opacity: fade,
          }}
        >
          <FlatList
            data={filteredRequests}


            style={{
              marginTop: 12,
            }}
            keyExtractor={(item: any) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
            renderItem={({ item, index }) => {
              return (
                <ReAnimated.View entering={FadeInDown.delay(index * 100)}>
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
                        #{item?.trackingId}
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
        </Animated.View>

      </ScrollView>
    </SafeAreaView>
  );
};

export default DeliveryHome;
