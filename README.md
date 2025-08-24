# Smart Helmet App

A React Native application for monitoring smart helmets with real-time MQTT communication, GPS tracking, and SOS alerts.

## 🚀 Quick Start

### Prerequisites

- Node.js >= 16.0.0
- npm >= 7.0.0
- Expo CLI (`npm install -g @expo/cli`)
- Android Studio (for Android development)
- Xcode (for iOS development on macOS)

### Installation

Clone the repository and install dependencies:

```bash
git clone <repository-url>
cd SmartHelmetApp
npm install
```

## 📦 NPM Commands

### Essential Commands for Other Users

```bash
# Install all dependencies
npm install

# Start the development server
npm start

# Start with cleared cache (if you encounter issues)
npm run start:clear

# Run on Android
npm run android

# Run on iOS
npm run ios

# Run on web
npm run web
```

### Development Commands

```bash
# Code quality
npm run lint          # Check code quality with ESLint
npm run format        # Format code with Prettier

# Build commands
npm run build:android # Build Android APK
npm run build:ios     # Build iOS app

# Other
npm run eject         # Eject from Expo (advanced users only)
```

## 🎯 Key Features

- **Real-time MQTT Communication**: Optimized connection management with automatic reconnection
- **GPS Tracking**: Live location tracking of workers with distance calculations
- **SOS Alert System**: Emergency alert broadcasting and handling
- **Worker Management**: Import/export worker data via CSV/Excel files
- **Performance Optimized**: React.memo, useCallback, useMemo implementations
- **Error Handling**: Comprehensive error boundaries and user feedback
- **Caching**: Smart caching for distance calculations and data optimization

## 🏗️ Project Structure

```
SmartHelmetApp/
├── components/           # Reusable components
│   └── ErrorBoundary.js # Error boundary component
├── screens/             # Application screens
│   ├── HomeScreen.js    # Main dashboard with map
│   ├── WorkerListScreen.js # Worker management
│   ├── LoginScreen.js   # Authentication
│   └── ...
├── utils/              # Utility functions
│   └── index.js        # Optimized helper functions
├── mqttClient.js       # MQTT connection management
├── App.js              # Main application component
└── package.json        # Dependencies and scripts
```

## 📱 Optimization Features

### Performance Optimizations

1. **React Optimizations**:
   - `React.memo` for component memoization
   - `useCallback` for stable function references
   - `useMemo` for expensive calculations
   - Optimized FlatList with `getItemLayout`

2. **MQTT Optimizations**:
   - Single connection instance
   - Automatic reconnection with backoff
   - Proper cleanup functions
   - Error handling and recovery

3. **Caching System**:
   - Distance calculation caching (30-second expiry)
   - Smart cache cleanup (max 100 entries)
   - Memory-efficient data storage

4. **State Management**:
   - Minimal re-renders
   - Shallow equality checks
   - Optimized data flow patterns

### Code Quality Features

- **Error Boundaries**: Graceful error handling with user-friendly messages
- **Loading States**: Comprehensive loading indicators and user feedback
- **Input Validation**: Data sanitization and validation
- **Memory Management**: Proper cleanup and garbage collection

## 🔧 Configuration

### MQTT Settings

The app connects to an MQTT broker for real-time communication:

```javascript
const MQTT_BROKER = 'ws://ionlypfw.thddns.net:2025';
const MQTT_USERNAME = 'smarthelmet';
const MQTT_PASSWORD = 'smarthelmet';
```

### Topics

- `data`: Helmet sensor data (location, status, vitals)
- `soschannel`: Emergency SOS messages

## 📊 Dependencies

### Core Dependencies

- **React Native**: 0.79.5 - Mobile app framework
- **Expo**: ~53.0.20 - Development platform
- **React Navigation**: ^6.1.0 - Navigation library
- **MQTT**: ^5.0.0 - Real-time messaging
- **React Native Maps**: 1.18.0 - Map integration
- **AsyncStorage**: 2.1.0 - Local data storage
- **PapaParse**: ^5.4.1 - CSV parsing
- **XLSX**: ^0.18.5 - Excel file handling

### Development Dependencies

- **ESLint**: ^8.57.0 - Code linting
- **Prettier**: ^3.1.0 - Code formatting
- **Babel**: ^7.20.0 - JavaScript compilation

## 🚀 Getting Started for New Users

1. **Install Node.js** (version 16 or higher) from [nodejs.org](https://nodejs.org/)

2. **Install Expo CLI globally**:
   ```bash
   npm install -g @expo/cli
   ```

3. **Clone and setup the project**:
   ```bash
   git clone <your-repository-url>
   cd SmartHelmetApp
   npm install
   ```

4. **Start the development server**:
   ```bash
   npm start
   ```

5. **Run on your device**:
   - Install Expo Go app on your mobile device
   - Scan the QR code from the terminal
   - Or use `npm run android` / `npm run ios` for emulators

## 🔍 Troubleshooting

### Common Issues

1. **Metro bundler issues**:
   ```bash
   npm run start:clear
   ```

2. **Node modules issues**:
   ```bash
   rm -rf node_modules
   npm install
   ```

3. **Cache issues**:
   ```bash
   expo start --clear
   ```

### Performance Tips

- Use `npm run start:clear` if you experience caching issues
- Monitor memory usage with React DevTools
- Use the built-in performance monitoring utilities

## 📈 Performance Metrics

The app includes built-in performance monitoring:

- **MQTT Connection Status**: Real-time connection monitoring
- **Cache Statistics**: Memory usage and cache hit rates
- **Error Tracking**: Comprehensive error logging and reporting

## 🤝 Contributing

1. Follow the existing code style (ESLint + Prettier configured)
2. Use the provided utility functions for consistency
3. Add proper error handling for new features
4. Test on both Android and iOS platforms

## 📄 License

This project is private and proprietary.

---

**For support or questions, please contact the development team.**
