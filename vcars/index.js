import { AppRegistry } from 'react-native'
import Ionicons from 'react-native-vector-icons/Ionicons'
import App from './App'
import { name as appName } from './app.json'

Ionicons.loadFont()

AppRegistry.registerComponent(appName, () => App)
