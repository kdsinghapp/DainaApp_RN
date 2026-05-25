import React, { useState } from 'react';
import { View, Text, Switch, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import StatusBarComponent from '../../../compoent/StatusBarCompoent';
import CustomHeader from '../../../compoent/CustomHeader';
import { color } from '../../../constant';
import font from '../../../theme/font';
import strings from '../../../localization/Localization';
const NotificationsSetting = () => {
  // State for toggles
  const [generalNotification, setGeneralNotification] = useState(true);
  const [sound, setSound] = useState(false);
  const [vibrate, setVibrate] = useState(false);
  const [appUpdates, setAppUpdates] = useState(true);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBarComponent />
      <View   >
        <CustomHeader

          label={strings.Notifications || "Notifications"} />

        {/* Body */}
        <View style={{ marginTop: 40, marginHorizontal: 15 }}>

          <View style={styles.notificationOption}>
            <Text style={styles.optionText}>{strings.GeneralNotification || "General Notification"}</Text>
            <Switch
              value={generalNotification}
              onValueChange={val => setGeneralNotification(val)}
              trackColor={{ false: '#767577', true: color.primary }}
              thumbColor={generalNotification ? '#fff' : '#fff'}
            />
          </View>
          <View style={styles.notificationOption}>
            <Text style={styles.optionText}>{strings.Sound || "Sound"}</Text>
            <Switch
              value={sound}
              onValueChange={val => setSound(val)}
              trackColor={{ false: '#767577', true: color.primary }}
              thumbColor={sound ? '#fff' : '#fff'}
            />
          </View>

          <View style={styles.notificationOption}>
            <Text style={styles.optionText}>{strings.Vibrate || "Vibrate"}</Text>
            <Switch
              value={vibrate}
              onValueChange={val => setVibrate(val)}
              trackColor={{ false: '#767577', true: color.primary }}
              thumbColor={vibrate ? '#fff' : '#fff'}
            />
          </View>

          <View style={styles.notificationOption}>
            <Text style={styles.optionText}>{strings.NewTipsAvailable || "New Tips Available"}</Text>
            <Switch
              value={appUpdates}
              onValueChange={val => setAppUpdates(val)}
              trackColor={{ false: '#767577', true: color.primary }}
              thumbColor={appUpdates ? '#fff' : '#fff'}
            />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default NotificationsSetting;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
    justifyContent: 'space-between',
  },
  hamburger: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: font.MonolithRegular
  },
  notificationOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 10,
  },
  optionText: {
    fontSize: 16,
    color: "#1D3A70",
    fontFamily: font.MonolithRegular,
    lineHeight: 15
  },
});
