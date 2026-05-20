import React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';

const CustomLoader = ({ message = 'Loading...' }) => {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color="#4CAF50" />
      <Text style={{ marginTop: 10, fontSize: 16, color: '#555' }}>
        {message}
      </Text>
    </View>
  );
};

export default CustomLoader;
