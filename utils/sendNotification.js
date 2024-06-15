const { GoogleAuth } = require("google-auth-library");
const path = require("path");
const axios = require("axios");

const serviceAccountPath = path.join(
  __dirname,
  "..",
  "threadsandshades-2023-firebase-adminsdk-j7aqy-d811e076a8.json"
);

async function sendNotification(fcmToken, notification, webpush, callBackFunc) {
  const auth = new GoogleAuth({
    keyFile: serviceAccountPath,
    scopes: ["https://www.googleapis.com/auth/firebase.messaging"],
  });
  const accessToken = await auth.getAccessToken();
  console.log("fcmToken: ", fcmToken);
  console.log("accessToken: ", accessToken);
  console.log("serviceAccountPath: ", serviceAccountPath);
  const message = {
    message: {
      token: fcmToken,
      notification,
      webpush,
    },
  };

  try {
    const response = await axios.post(
      "https://fcm.googleapis.com/v1/projects/threadsandshades-2023/messages:send",
      message,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );
    await callBackFunc && callBackFunc({response: response.data, ...message})
    console.log("Notification sent successfully:", response.data);
  } catch (error) {
    console.error("Error sending notification:", error.response.data);
  }
}

module.exports = {
  sendNotification,
};
