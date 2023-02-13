const databaseURL = "https://jp-learning-chrome-extension-default-rtdb.asia-southeast1.firebasedatabase.app/";
const apiKey = "AIzaSyBDlgNqvxPdP__ikTXGY8SDyYmK-xnEur8";

const getProfileUserInfo = () => {
  return new Promise((resolve, reject) => {
      chrome.identity.getProfileUserInfo({accountStatus: 'ANY'}, (userInfo) => {
      resolve(userInfo);
      });
  });
}

const getDataFromFirebase = async () => {
  console.log('getDataFromFirebase');
  try {
    const userInfo = await getProfileUserInfo();
    if (!userInfo.email || userInfo.email === '') {
      return;
    }
    const path = `${userInfo.email.replace(/\./g, ',')}.json`;
    
    try {
      const response = await fetch(databaseURL + path, {
        method: "GET"
      });
    
      if (response.status >= 200 && response.status < 300) {

        const res = await response.json();
        if (!res) {
          return;
        }
        for (const key in res.words) {
          chrome.storage.local.set({ [key]: JSON.stringify(res.words[key]) }, function () {
            console.log("Data is set for " + key + " as " + JSON.stringify(res.words[key]));
          });
        }
      } else {
        console.log(response);
        console.log("An error occurred while getting data to Firebase");
      }
    } catch (error) {
      console.log("An error occurred while getting data to Firebase", error);
    }
  } catch (error) {
    console.log(error);
  }
}

getDataFromFirebase();


chrome.tabs.onUpdated.addListener(function(tab) {
    getDataFromFirebase();
});

