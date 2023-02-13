const databaseURL = "https://jp-learning-chrome-extension-default-rtdb.asia-southeast1.firebasedatabase.app/";
const apiKey = "AIzaSyBDlgNqvxPdP__ikTXGY8SDyYmK-xnEur8";
  

  const setChromeStorage = async (key, value) => {
    return new Promise((resolve, reject) => {
        chrome.storage.local.set({ [key]: JSON.stringify(value) }, function () {
            console.log("Data is set for " + key + " as " + JSON.stringify(value));
            resolve();
            });
    });
  }

  const getDataFromFirebase = async (email) => {
    console.log('getDataFromFirebase');
    try {
        console.log(email)
      const path = `${email.replace(/\./g, ',')}.json`;
      
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
            console.log(key);
            console.log(res.words[key]);
            await setChromeStorage(key, res.words[key]);
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

const pushDataToFirebase = async (idToken, email, value) => {
    console.log('pushDataToFirebase');
    try {
      const path = `${email.replace(/\./g, ',')}.json`;
  
      try {
        const response = await fetch(databaseURL + path + "?auth=" + idToken, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ words: value })
        });
  
        if (response.status >= 200 && response.status < 300) {
          alert("Data successfully uploaded");
        } else {
          console.log(response);
          alert("An error occurred while sending data to Firebase");
        }
      } catch (error) {
        alert("An error occurred while sending data to Firebase", error);
      }
    } catch (error) {
        alert(error);
    }
}

const getDataFromChromeStorage = async () => {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get(null, function(items) {
        const filteredItems = {};
        for (const key in items) {
            if (key !== 'azureCognitiveServicesKey' 
            && key !== 'azureCognitiveServicesLocation' 
            && key != 'serviceEnabled') {
            filteredItems[key] = JSON.parse(items[key]);
            }
        }
        resolve(filteredItems);
        });
    });
}

const idToken = document.querySelector("#id-token");
const email = document.querySelector("#email");

const observer = new MutationObserver(function (mutations) {
  mutations.forEach(async function (mutation) {
    if (idToken.textContent.length > 0) {
      await getDataFromFirebase(email.textContent);
      const chromeData = await getDataFromChromeStorage();
      await pushDataToFirebase(idToken.textContent, email.textContent, chromeData);
    }
  });
});

observer.observe(idToken, {
  characterData: true,
  childList: true,
  subtree: true
});

