import React from "react";
import { Modal, Text, View, TouchableOpacity } from "react-native";
import tw from "twrnc";

const Alert = ({ title, message, visible, onDismiss }) => {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={tw`flex-1  p-8 items-center justify-center bg-gray-900/50`}>
        <View style={tw`bg-white p-6 rounded-lg shadow-lg`}>
          <Text style={tw`text-xl font-bold mb-3`}>{title}</Text>
          <Text style={tw`text-gray-700`}>{message}</Text>
          <TouchableOpacity
            onPress={onDismiss}
            style={tw` mt-4 px-5 py-3 rounded-full`}
          >
            <Text style={tw`text-blue-500 text-right font-medium`}>OK</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default Alert;
