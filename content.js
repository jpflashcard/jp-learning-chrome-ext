const kuromoji = window.kuromoji;
let dictUrl = chrome.runtime.getURL(
  "dict/",
);

// Add yellow highlight on hover
const highlight = (event) => {
  event.target.style.backgroundColor = "yellow";
};

// Remove yellow highlight on hover out
const unhighlight = (event) => {
  event.target.style.backgroundColor = "";
};

let original = true;


// Retrieve the Azure Cognitive Services key from chrome.storage
let getAzureCognitiveServicesKey = async () =>  {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get('azureCognitiveServicesKey', function (result) {
      const key = result.azureCognitiveServicesKey;
      if (!key) {
        return;
      }
      resolve(key);
    });
  });
}

// Retrieve the Azure Cognitive Services location from chrome.storage
let getAzureCognitiveServicesLocation = async () =>  {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get('azureCognitiveServicesLocation', function (result) {
      const location = result.azureCognitiveServicesLocation;
      if (!location) {
        return;
      }
      resolve(location);
    });
  });
}

const toHiragana = (text) => {
  return text.replace(/[\u30A0-\u30FF]/g, function(match) {
    return String.fromCharCode(match.charCodeAt(0) - 0x60);
  });
};

const handleTokenizationAndStyling = async (text) => {
  let styledText = "";
  let beforeText = "";
  let afterText = text;
  return new Promise((resolve, reject) => {
    kuromoji.builder({ dicPath: dictUrl }).build(async function (err, tokenizer) {
      if (err) {
        console.error(err);
        return;
      }
  
      const tokens = tokenizer.tokenize(text);

      for (const token of tokens) {
        if (token.reading && !/^[\u3040-\u309F]+$/.test(token.surface_form) && !/^[\u30A0-\u30FF]+$/.test(token.surface_form)) {
          let index = afterText.indexOf(token.surface_form);
          beforeText = afterText.substring(0, index);
          afterText = afterText.substring(index + token.surface_form.length);
          switch (token.pos) {
            case '名詞':
            case '動詞':
              styledText += `${beforeText}<u>${token.surface_form}<span style='color:grey'>(${toHiragana(token.reading)})</span></u>`;
              await saveToStorage(token.surface_form, toHiragana(token.reading));
              break;
          }
        }
      }
      styledText += afterText;
      resolve(styledText);
    });
  });
}


const translate = async (text) => {
  const key = await getAzureCognitiveServicesKey();
  if (!key) {
    alert("Azure Cognitive Services key is missing. Please enter your key in the options page.");
    return;
  }
  const location = await getAzureCognitiveServicesLocation();
  if (!location) {
    alert("Azure Cognitive Services location is missing. Please enter your key in the options page.");
    return;
  }
  const endpoint = 'https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&to=zh-Hant&textType=html';
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Ocp-Apim-Subscription-Key": key,
        "Ocp-Apim-Subscription-Region": location,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([{ Text: text.replace(/<\/?span.*?>/g, "") }]),
    });
    const resJson = await response.json();
    const translations = resJson[0].translations;
    const chinese = translations.map((t) => t.text);
    return chinese;
  } catch (error) {
    console.log(error);
    alert("An error occurred while trying to translate the text. Please check the console for more information.");
  }
};

// Add Hiragana
const addHiragana = async (event) => {
  if (original) {
    event.target.innerHTML = await handleTokenizationAndStyling(event.target.dataset.original);
    event.target.innerHTML = await setTextColor(event.target.innerHTML);
    event.target.innerHTML += '<br/>'
    event.target.innerHTML += await translate(event.target.dataset.original);
    original = false;
  }
  else {
    event.target.innerHTML = event.target.dataset.original;
    event.target.innerHTML = await setTextColor(event.target.innerHTML);
    original = true;
  }
};

const setTextColor = async (text) => {
  return new Promise((resolve) => {
    let coloredText = text;

    chrome.storage.local.get(null, function(result) {
      let keys = Object.keys(result);
      keys.sort((a, b) => b.length - a.length);
      let foundKeys = [];
    
      for (let i = 0; i < keys.length; i++) {
        let key = keys[i];
        let index = coloredText.indexOf(key);
        if (key === "") {
          continue;
        }
        
        let skip = false;
        foundKeys.forEach(fKey => {
          if (fKey.includes(key)) {
            skip = true;
          }
        });
        
        if (skip) {
          continue;
        }
    
        if (index !== -1) {
          foundKeys.push(key);
          let data = JSON.parse(result[key]);
          if (data.status !== 'archived') {
            let color = data.mastered ? "green" : "orange";
            let beforeText = coloredText.substring(0, index);
            let afterText = coloredText.substring(index + key.length);
            coloredText = beforeText + "<span style='color:" + color + "'>" + key + "</span>" + afterText;
          }
        }
      }
    
      resolve(coloredText);
    });
    
  });
}

async function updateElements() {
  const elements = document.querySelectorAll("p, li, h1, h2, h3");
  for (const element of elements) {
    if (!element.dataset.original) {
      element.dataset.original = element.innerHTML;
    }
    element.innerHTML = await setTextColor(element.innerHTML);
    element.addEventListener("mouseover", highlight);
    element.addEventListener("mouseout", unhighlight);
    element.addEventListener("click", addHiragana);
  }
}

const saveToStorage = async (kanji, hiragana) => {
  if (kanji === "") return;
  // store data if it doesn't exist
  chrome.storage.local.get(kanji, function (result) {
    if (result[kanji]) {
      //check if hiragana is the same
      const storedData = JSON.parse(result[kanji]);
      if (!storedData.hiragana.includes(hiragana)) {
        storedData.hiragana.push(hiragana);
        chrome.storage.local.set({ [kanji]: JSON.stringify(storedData) }, function () {
          console.log("Data is added for " + kanji + " as " + hiragana);
        });
      }
      return;
    }
    else {
      chrome.storage.local.set({ [kanji]: JSON.stringify({ hiragana: [hiragana], mastered: false, status: 'new', tags: ['chrome-ext'] }) }, function () {
        console.log("Data is stored for " + kanji + " as " + hiragana);
      });
    }
  });
};

// updateElements();

chrome.storage.local.get('serviceEnabled', function(result) {
  if (result.serviceEnabled) {
    updateElements();
  }
});

chrome.storage.onChanged.addListener(function(changes, namespace) {
  for (const key in changes) {
    const storageChange = changes[key];
    if (key === 'serviceEnabled') {
      if (storageChange.newValue) {
        updateElements();
      }
      else {
        const elements = document.querySelectorAll("p, li, h1, h2, h3");
        for (const element of elements) {
          element.innerHTML = element.dataset.original;
          element.removeEventListener("mouseover", highlight);
          element.removeEventListener("mouseout", unhighlight);
          element.removeEventListener("click", addHiragana);
        }
      }
    }
  }
});

