# HyperSDK Cordova plugin

.
Cordova plugin for HyperSDK which enables payment orchestration via different dynamic modules. More details available at Juspay Developer Docs for [Express Checkout SDK](https://docs.juspay.in/ec-headless/cordova/base-sdk-integration/getting-sdk) and [Payment Page SDK](https://docs.juspay.in/hyper-checkout/cordova/overview/integration-architecture/). Some part of module depends heavily on native functionalities are not updatable dynamically.

## Minimum Requirement

### Android

The minimum version of cordova-android supported with HyperSDK is [10.0.0](https://github.com/apache/cordova-android/blob/master/RELEASENOTES.md#1000-jul-17-2021) which uses `androidx` and `AppCompatActivity`.

### IOS
Latest versions of HyperSDK supports IOS Version 12 and Above.
Check [Release Notes](https://docs.juspay.in/resources/docs/sdk--release-notes/ios--release-notes) for more information.

## Getting the SDK

SDK is available as a node dependency via:

```sh
cordova plugin add hyper-sdk-plugin
```

## Integration

### Android

Update your clientId provided by Juspay Support Team in the ext block of the root(top) build.gradle file present under `platforms/android/build.gradle`.

```groovy
ext {
    clientId = "<clientId provided by Juspay Team>"
    hyperSDKVersion = "2.1.25"
}
```

Optionally, you can also provide an override for base SDK version present in plugin (the newer version among both would be considered).


### iOS

Update your clientId provided by Juspay Support Team in the `MerchantConfig.txt` file present under `platforms/ios/`

```txt
clientId = <clientId shared by Juspay Team>
```

Add the following post_install script in the Podfile (`ios/Podfile`)

```sh
post_install do |installer|
  fuse_path = "./Pods/HyperSDK/Fuse.rb"
  clean_assets = true
  if File.exist?(fuse_path)
    if system("ruby", fuse_path.to_s, clean_assets.to_s)
    end
  end
end
```

## SDK APIs

Create an instance for HyperSDK cordova plugin by using:

```javascript
hyperSDKRef = cordova.plugins.HyperSDKPlugin
```

### Initiate

This method should be called on the render of the host screen. This will boot up the SDK and start the Hyper engine. It takes a `stringified JSON` as its argument which will contain the base parameters for the entire session and remains static throughout one SDK instance lifetime.

To call initiate, use the following snippet:

```javascript
var completePayload = {
    "requestId": "8cbc3fad-8b3f-40c0-ae93-2d7e75a8624a",
    "service" : "in.juspay.service", // service will be different as per integration.
    "payload" : {
        "action": "initiate",
        "merchantKeyId": "<merchantKeyId shared by Juspay Team>",
        "merchantId": "<merchantId shared by Juspay Team>",
        "clientId": "<clientId shared by Juspay Team>",
        "customerId": "customer_id",
        "environment": "sandbox"
    }
}
hyperSDKRef.initiate(JSON.stringify(completePayload), hyperSDKCallback);


// Define callback to handle different events from the SDK.
var hyperSDKCallback = function (response) {
  try {
    var parsedData = JSON.parse(response);
    var event = parsedData["event"];
    switch (event) {
        case "show_loader": {
        // Show some loader here
        }
            break;
        case "hide_loader": {
            // Hide Loader
        }
        break;
        case "initiate_result": {
            // Get the payload
            console.log("initiate result: ", parsedData)
        }
        break;
        case "process_result": {
            // Get the payload
            console.log("process result: ", parsedData)
        }
        break;
        default:
            //Error handling
            break;
    }
  } catch (error) {
    //Error handling
    console.log(error);
  }
}

```

Payment Page - All payload ref is available at [HyperSDK Payment page doc](https://docs.juspay.in/hyper-checkout/cordova/overview/integration-architecture/).
EC Headless - All payload ref is available at [HyperSDK EC doc](https://docs.juspay.in/ec-headless/cordova/base-sdk-integration/getting-sdk).

### Process

Process api helps with all the required operation to be triggered via HyperSDK.
Responses and various events triggered are streamed back to callback passed in Initiate.

```javascript
// Please refer to the documentation links attached below for payload parameters
var completePayload = {
    "requestId": "8cbc3fad-8b3f-40c0-ae93-2d7e75a8624a",
    "service" : "in.juspay.service", // service will be different as per integration.
    "payload" : {
        "action": "paymentPage",
        "merchantKeyId": "<merchantKeyId shared by Juspay Team>",
        "merchantId": "<merchantId shared by Juspay Team>",
        "clientId": "<clientId shared by Juspay Team>",
        "customerId": "customer_id",
        "environment": "sandbox",
        "signaturePayload": "signaturePayloadString",
        "signature": "signature"
    }
}
hyperSDKRef.process(JSON.stringify(completePayload));
```

Process payload - All payload ref is available at [HyperSDK process](https://docs.juspay.in/hyper-checkout/cordova/base-sdk-integration/open-hypercheckout-screen).

### Optional: isInitialised

This is a helper / optional method to check whether SDK has been initialised after [step-2](#step-2-initiate). It returns a `boolean` value in the callback function.

```javascript
hyperSDKRef.isInitialised((response) => {
    // Make process call here if response is true
});
```

### Android Hardware Back-Press Handling

`Hyper SDK` internally uses an android fragment for opening the bank page and will need the control to hardware back press when the bank page is active. To make sure this works properly with this plugin, add eventListenr on `backbutton` event.

If the blocking asynchronous call `hyperSDKRef.onBackPress` returns true in callback response that means `Hyper SDK` will handle the back press, else merchant can handle it.

```sh
document.addEventListener("backbutton", onBackKeyDown)

function onBackKeyDown() {
    hyperSDKRef.onBackPress(function (response) {
        if(!response) {
            // Your implementation to hanlde hardware backpress.
        } else {
            // SDK handles the backpress.
        }
    });
}
```

### Terminate

This method shall be triggered when `HyperSDK` is no longer required.

```ts
hyperSDKRef.terminate();
```

## License

hyper-sdk-plugin (HyperSDK Cordova) is distributed under [AGPL-3.0-only](https://github.com/juspay/hyper-sdk-cordova/src/release/LICENSE.md) license.
