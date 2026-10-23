import React from 'react';
import { StyleSheet, View, Platform, Image, Text } from 'react-native';

// Ad Unit ID from AdMob dashboard
// Replace with your own Ad Unit ID when ready for production
const adUnitId = 'ca-app-pub-9296385850897986/2344845861';

const adSize = {
  width: 320,
  height: 50,
}; // 320x50 dp, standard banner size

// Check if running on web - AdMob doesn't support web
const isWeb = Platform.OS === 'web';

export default function FeedsScreen() {
  if (isWeb) {
    // On web, render a placeholder since AdMob doesn't work in browser
    return (
      <View style={styles.container}>
        <Image
          source={{
            uri:
              'https://developers.google.com/admob/android/testads',
          }}
          style={styles.webPlaceholder}
          alt="AdMob banner placeholder"
        />
        <Text style={styles.webText}>
          AdMob banner ads are not supported in web view. View this app on iOS or Android
        </Text>
      </View>
    );
  }

  // Native platforms (iOS/Android) - render AdMob banner
  return (
    <View style={styles.container}>
      <Image
        source={{
          uri:
            'https://developers.google.com/admob/android/testads',
        }}
        style={styles.placeholder}
        alt="Ad loading..."
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#BBDEFB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholder: {
    width: adSize.width,
    height: adSize.height,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginBottom: 16,
  },
  webPlaceholder: {
    width: adSize.width,
    height: adSize.height,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginBottom: 16,
  },
  webText: {
    marginTop: 16,
    fontSize: 14,
    color: '#555555',
  },
});