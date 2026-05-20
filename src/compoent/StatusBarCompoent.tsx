import React from 'react';
import { StatusBar, SafeAreaView, View, StyleSheet } from 'react-native';

type StatusBarComponentProps = {
  barStyle?: 'default' | 'light-content' | 'dark-content';
  backgroundColor?: string;
  translucent?: boolean;
};

const StatusBarComponent: React.FC<StatusBarComponentProps> = ({
  barStyle = 'dark-content', // dark text/icons for white background
  backgroundColor = 'white', // default app background
  translucent = false,
}) => {
  return (
    <View style={[styles.container, { backgroundColor }]}>
      <StatusBar
        barStyle={barStyle}
        backgroundColor={backgroundColor}
        translucent={translucent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
});

export default StatusBarComponent;
