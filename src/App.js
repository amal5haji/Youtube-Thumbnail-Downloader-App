import { registerRootComponent } from "expo";
import { View, StatusBar } from "react-native";
import InputScreen from "./screens/InputScreen";

function App() {
  return (
    <View>
      <StatusBar />
      <InputScreen />
    </View>
  );
}

export default registerRootComponent(App);
