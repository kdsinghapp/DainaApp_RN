import React, { useState } from "react";
import { View, Text, Image, TouchableOpacity, FlatList, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import StatusBarComponent from "../../../compoent/StatusBarCompoent";
import CustomHeader from "../../../compoent/CustomHeader";
import font from "../../../theme/font";
import CounterOfferModal from "../../../compoent/MakeCounterModal";
import TrackCourierModal from "../../../compoent/TrackCourierModal";
import { useNavigation } from "@react-navigation/native";
import ScreenNameEnum from "../../../routes/screenName.enum";
import { useOfferOR } from "./useOfferOR";
import LoadingModal from "../../../utils/Loader";
import { styles } from "./style";
import imageIndex from "../../../assets/imageIndex";
import { openDialer } from "../../../utils/Constant";
import Icon from "react-native-vector-icons/MaterialIcons";
import { color } from "../../../constant";




import Animated, { FadeInDown } from "react-native-reanimated";
import strings from "../../../localization/Localization";

export default function OfferOR() {
  const [Open, setOpen] = useState(false)
  const [trackerModal, settrackerModal] = useState(false)
  const {
    isLoading,
    offerData,
    location,
    setLocation,
    onAccept,
    navgation,
    CounterOffer,
    selectedOfferId, setSelectedOfferId

  } = useOfferOR()

  const OfferCard = ({ item, onCounterPress }: any) => {
    return (
      <View style={styles.card}>
        <View style={{
          flexDirection: "row",
          justifyContent: "space-between"
        }}>
          <Text style={styles.carrierText}>{strings?.Carrier} : <Text style={[styles.bold, {
            color: "#878787",
            fontFamily: font.MonolithRegular


          }]}>{item?.deliveryUser?.name}</Text></Text>
          <TouchableOpacity onPress={() => openDialer(item?.deliveryUser?.phone)}>

            <Image source={imageIndex.Calls}

              style={{
                height: 36,
                width: 36,

              }}
            />
          </TouchableOpacity>

        </View>
        <Text style={styles.offerText}> {strings?.OfferPrice} : <Text style={[styles.bold, {
          color: "#878787",
          fontFamily: font.MonolithRegular

        }]}>{item?.offerAmount}</Text>

        </Text>
        <Text style={styles.offerText}>{strings?.MessageLabel} : <Text style={[styles.bold, {
          color: "#878787",
          fontFamily: font.MonolithRegular,

        }]}>{item?.message}</Text></Text>
        <Text style={styles.offerText}>{strings?.PhoneLabel} : <Text style={[styles.bold, {
          color: "#878787",
          fontFamily: font.MonolithRegular,

        }]}>{item?.deliveryUser?.phone}</Text></Text>


        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
          <Text style={[styles.offerText, { marginBottom: 0 }]}>{strings?.RatingLabel} : </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 4 }}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Icon
                key={star}
                name={Number(item?.deliveryUser?.rating || 0) >= star ? "star" : (Number(item?.deliveryUser?.rating || 0) >= star - 0.5 ? "star-half" : "star-border")}
                size={20}
                color={Number(item?.deliveryUser?.rating || 0) >= star - 0.5 ? color.primary : "#CBD5E1"}
              />
            ))}
            <Text style={[styles.bold, { color: "#878787", fontFamily: font.MonolithRegular, marginLeft: 8 }]}>
              {item?.deliveryUser?.rating || 0}
              {item?.deliveryUser?.totalReviews !== undefined && (
                <Text style={{ fontWeight: 'normal', color: '#64748B' }}> ({item?.deliveryUser?.totalReviews} {strings?.ReviewsLabel})</Text>
              )}
            </Text>
          </View>
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity style={[styles.button, styles.acceptBtn]}
            onPress={() => onAccept(item?.id || item?.offerId)}
          >
            <Text style={styles.acceptText}>{strings?.Accept}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => {
            setSelectedOfferId(item?.id || item?.offerId);
            setOpen(true);
          }}
            style={[styles.button, styles.counterBtn]}>
            <Text style={styles.counterText}>{strings?.CounterOfferLabel}</Text>
          </TouchableOpacity>


          <TouchableOpacity
            onPress={() => {
              navgation.navigate(ScreenNameEnum.ChatScreen, {
                item: item,
              })
            }}

            style={[styles.button, styles.chatBtn]}>
            <Text style={styles.chatText}>{strings?.Chat}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };
  const nav = useNavigation()
  return (
    <SafeAreaView style={styles.container}>
      <StatusBarComponent />
      <LoadingModal visible={isLoading} />
      <CustomHeader label={strings?.Back} />
      <ScrollView showsVerticalScrollIndicator={false}
        style={{
          marginBottom: 45
        }}
        showsHorizontalScrollIndicator={false}
      >
        <View style={{
          marginHorizontal: 15
        }}>
          <Text style={styles.header}>{strings.OffersForYourAd}</Text>

          <FlatList
            style={{
              marginTop: 20,
              marginBottom: 45
            }}
            ListEmptyComponent={() => (
              <Text style={styles.emptyText}>
                {strings?.NoOffersAvailable}
              </Text>
            )}

            data={offerData?.offers}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index }) => {
              return (
                <Animated.View entering={FadeInDown.delay(index * 100).duration(600)}>
                  <OfferCard item={item} onCounterPress={

                    () => setOpen(true)} />
                </Animated.View>
              )
            }}
            showsVerticalScrollIndicator={false}
          />
        </View>
        <CounterOfferModal
          visible={Open}
          defaultValue={1}
          currency="₮"
          max={50000}
          onCancel={() => setOpen(false)}
          onSubmit={(amount: any) => {
            if (selectedOfferId) {
              CounterOffer(selectedOfferId, amount); // 👈 ID + amount
            }
            setOpen(false);
          }}

        />



        <TrackCourierModal visible={trackerModal}

          onClose={() => {
            settrackerModal(false)

            setOpen(false)
          }}
          onpress={() => {
            setOpen(false)
            settrackerModal(false)

            navgation.navigate(ScreenNameEnum.CourierTrackingScreen)

          }}
        //  onLocationGranted
        />
      </ScrollView>
    </SafeAreaView>
  );
}
