

$(document).ready(function() {
  $('.ui.accordion').accordion();
  const form = $("#azure-cognitive-services-form");
  const keyInput = $("#azure-cognitive-services-key");
  const locationInput = $("#azure-cognitive-services-location");
  // const enabled = $("#service-enabled");

  chrome.storage.local.get('serviceEnabled', function(result) {
    console.log(result.serviceEnabled)
    result.serviceEnabled ? $('#service-enabled').checkbox('check') : $('#service-enabled').checkbox('uncheck');
  });

  $('#service-enabled').checkbox({
    onUnchecked: function() {
      console.log('Service enabled status has been changed to: false')
      chrome.storage.local.set({ serviceEnabled: false }, function() {
        console.log('Service enabled status has been stored successfully!');
      });
    },
    onChecked: function() {
      console.log('Service enabled status has been changed to: true')
      chrome.storage.local.set({ serviceEnabled: true }, function() {
        console.log('Service enabled status has been stored successfully!');
      });
    }
  });

  // chrome.storage.local.get('serviceEnabled', function(result) {
  //   $('#service-enabled').checkbox(result.serviceEnabled ? 'check' : 'uncheck');
  // });

  // add eventlistener for enabled checkbox
  // enabled.change(function() {
  //   chrome.storage.local.set({ serviceEnabled: $(this).prop("checked") }, () => {
  //     // alert("Service enabled has been stored successfully!");
  //     // window.close();
  //   });
  // });

  form.submit(function(event) {
    event.preventDefault();

    const key = keyInput.val();
    const location = locationInput.val();

    chrome.storage.local.set({ azureCognitiveServicesKey: key }, () => {
      alert("Azure Cognitive Services key has been stored successfully!");
      window.close();
    });
    chrome.storage.local.set({ azureCognitiveServicesLocation: location }, () => {
      alert("Azure Cognitive Services location has been stored successfully!");
      window.close();
    });
  });

  const showStoredKey = () => {
    chrome.storage.local.get('azureCognitiveServicesKey', function (result) {
      const key = result.azureCognitiveServicesKey;
      if (key) {
        keyInput.val(key);
      }
    });
  }

  const showStoredLocation = () => {
    chrome.storage.local.get('azureCognitiveServicesLocation', function (result) {
      const location = result.azureCognitiveServicesLocation;
      if (location) {
        locationInput.val(location);
      }
    });
  }

  $(document).ready(showStoredKey);
  $(document).ready(showStoredLocation);
});
