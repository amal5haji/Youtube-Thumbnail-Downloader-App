import React, { useState, useRef, useEffect } from "react";
import {
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  Image,
  Text,
  View,
  ActivityIndicator,
  Modal,
} from "react-native";
import * as FileSystem from "expo-file-system";
import * as MediaLibrary from "expo-media-library";
import { useShareIntent } from "expo-share-intent";
import {
  InterstitialAd,
  AdEventType,
  BannerAd,
  BannerAdSize,
} from "react-native-google-mobile-ads";

import tw from "twrnc";
import Alert from "../components/Alert";

const adUnitId = "ca-app-pub-9424770168803651/9132487000";

const interstitial = InterstitialAd.createForAdRequest(adUnitId, {
  requestNonPersonalizedAdsOnly: true,
  keywords: ["fashion", "clothing"],
});

const InputScreen = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [videoId, setVideoId] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showAlertVisible, setShowAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [showImage, setShowImage] = useState(true);

  // for Interstitial  ad
  const [loaded, setLoaded] = useState(false);

  const textInputRef = useRef(null);
  const { hasShareIntent, shareIntent } = useShareIntent();

  const showAlert = (title, message) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setShowAlertVisible(true);
  };

  const getThumbnailUrl = (videoId) => {
    return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
  };

  const handleGetThumbnail = async (videoUrl) => {
    setIsLoading(true);

    if (loaded) interstitial.show();

    if (textInputRef.current) {
      textInputRef.current.blur();
    }
    try {
      if (videoUrl.includes("youtube.com") || videoUrl.includes("youtu.be")) {
        let extractedVideoId = videoUrl;

        if (videoUrl.includes("youtube.com")) {
          const queryParams = videoUrl.split("?v=")[1];
          extractedVideoId = queryParams || extractedVideoId;
        } else if (videoUrl.includes("youtu.be")) {
          extractedVideoId = videoUrl.split("/").pop();
        }

        const finalVideoId = extractedVideoId.split("&")[0];

        const imageUrl = getThumbnailUrl(finalVideoId);
        setThumbnailUrl(imageUrl);
      } else {
        showAlert("Please enter a valid YouTube video URL");
      }
    } catch (error) {
      showAlert("Error", "Thumbnail loading failed");
    }

    setIsLoading(false);
  };

  const downloadImage = async () => {
    if (!thumbnailUrl) return;
    setIsSaving(true);

    try {
      const response = await fetch(thumbnailUrl);
      const blob = await response.blob();
      const imageExtension = thumbnailUrl.split("/").pop().split(".").pop();
      const fileName = "Youtube Thumbnail" + "." + imageExtension;
      const downloadDest = FileSystem.documentDirectory + fileName;
      const base64 = await blobToBase64(blob);
      await FileSystem.writeAsStringAsync(downloadDest, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const asset = await MediaLibrary.createAssetAsync(downloadDest);
      await MediaLibrary.createAlbumAsync("Download", asset);
      showAlert("Success", "Thumbnail saved to Gallery!");
      return downloadDest;
    } catch (error) {
      showAlert("Error", "Download failed.");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };
  const blobToBase64 = async (blob) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => {
        // Convert blob to base64 string
        const base64String = reader.result.split(",")[1];
        resolve(base64String);
      };
      reader.readAsDataURL(blob);
    });
  };

  useEffect(() => {
    if (hasShareIntent) {
      setVideoId(shareIntent?.text);
      handleGetThumbnail(shareIntent?.text);
    }
  }, [hasShareIntent]);

  useEffect(() => {
    const unsubscribe = interstitial.addAdEventListener(
      AdEventType.LOADED,
      () => {
        setLoaded(true);
      }
    );

    // Start loading the interstitial straight away
    interstitial.load();

    // Unsubscribe from events on unmount
    return unsubscribe;
  }, []);

  return (
    <SafeAreaView style={tw`p-4 flex flex-col bg-[#131314] w-full h-full`}>
      <View style={tw`p-4 flex flex-row items-center justify-end mb-4`}>
        <TouchableOpacity
          onPress={() => {
            showAlert(
              "Disclaimer",
              "This app is designed to help fans promote their favorite YouTube creators by sharing video thumbnails.  Remember, it's important to respect creators' content and use the app responsibly. We are not responsible for any actions taken by users that may violate copyright or YouTube's Terms of Service."
            );
          }}
        >
          <Image
            source={require("../assets/svg/info.png")}
            style={tw`h-6 w-6 tint-white`}
          />
        </TouchableOpacity>
      </View>

      <View style={tw`flex-1 h-[75%]`}>
        {thumbnailUrl ? (
          <View style={tw`flex items-center justify-center shadow-md`}>
            <Image
              source={{ uri: thumbnailUrl }}
              style={tw`w-full h-3/4 rounded-lg`}
              resizeMode="contain"
              onError={() => {
                setThumbnailUrl("");
                showAlert("Error", "Thumbnail loading failed!");
              }}
            />
            <TouchableOpacity
              onPress={downloadImage}
              style={tw`absolute flex flex-row items-center gap-1 bottom-4 right-4 bg-gray-800 p-2 rounded-full`}
            >
              <Text style={tw`text-white p-1`}>Save</Text>
              <Image
                source={require("../assets/svg/download.png")}
                style={tw`h-6 w-6 tint-white`}
              />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={tw`flex items-center justify-center shadow-md`}>
            {showImage && (
              <Image
                source={require("../assets/svg/image.png")}
                style={tw`w-full h-3/4 tint-[#444746]`}
                resizeMode="contain"
              />
            )}
            <BannerAd
              size={BannerAdSize.BANNER}
              unitId="ca-app-pub-9424770168803651/6279200757"
              onAdLoaded={() => {
                setShowImage(false);
              }}
              onAdFailedToLoad={(error) => {
                setShowImage(true);
              }}
            />

            <Text style={tw`text-[#444746] text-center`}>
              Share the thumbnail, support the creator!
            </Text>
          </View>
        )}
      </View>
      <View style={tw`w-full h-[25%] flex justify-start items-center`}>
        <View style={{ position: "relative", width: "100%" }}>
          <TextInput
            style={{
              backgroundColor: "#1E1F20",
              color: "#AFAFB0",
              ...tw`p-4 w-full border border-gray-600 pl-6 pr-12 rounded-full mb-4 shadow-sm`,
            }}
            placeholderTextColor="#AFAFB0"
            selectionColor="#AFAFB0"
            placeholder="Enter YouTube Video URL"
            onChangeText={setVideoId}
            value={videoId}
            ref={textInputRef}
          />
          {videoId && (
            <TouchableOpacity
              style={tw`absolute top-4 right-3 w-8 h-8 items-center justify-center`} // Example Adjustment
              onPress={() => {
                setThumbnailUrl("");
                setVideoId("");
              }}
            >
              <Image
                source={require("../assets/svg/close.png")}
                style={tw`w-7 h-7 tint-[#444746]`}
                resizeMode="contain"
              />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={tw`bg-[#FF0000] w-full p-3 rounded-full shadow-md`}
          onPress={() => handleGetThumbnail(videoId)}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={tw`text-white font-bold text-center text-lg`}>
              Get Thumbnail
            </Text>
          )}
        </TouchableOpacity>
        <Text style={tw`text-[#444746] mt-3 text-center`}>
          This app helps you find and share YouTube video thumbnails to promote
          your favorite creators!
        </Text>
      </View>

      <SavingModal visible={isSaving} />
      <Alert
        title={alertTitle}
        message={alertMessage}
        visible={showAlertVisible}
        onDismiss={() => setShowAlertVisible(false)}
      />
      <BannerAd
        size={BannerAdSize.INLINE_ADAPTIVE_BANNER}
        unitId="ca-app-pub-9424770168803651/6506323662"
      />
    </SafeAreaView>
  );
};

const SavingModal = ({ visible }) => {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={tw`flex-1 bg-gray-900/50 items-center justify-center`}>
        <View style={tw`bg-white p-5 rounded-lg shadow-md`}>
          <ActivityIndicator size="large" color="blue" style={tw`mb-3`} />
          <Text style={tw`text-gray-800 text-lg`}>Saving...</Text>
        </View>
      </View>
    </Modal>
  );
};

export default InputScreen;
