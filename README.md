# HyperSDK Cordova plugin

## Table of Contents

- [About](#about)
- [Getting Started](#getting_started)
- [SDK API](#sdk_api)

## About

Cordova plugin for HyperSDK.

## Getting the SDK

SDK is available as a node depdendecy via: 

```sh
cordova plugin add hyper-sdk-plugin
```

Also it can be added as direct branch reference: 

```sh
cordova plugin add git+ssh://git@bitbucket.org/juspay/hyper-sdk-cordova#master
```

## SDK API

Create an instance for HyperSDK cordova plugin by using:
```javascript
hyperSDKRef = cordova.plugins.HyperSDKPlugin
```

EC Headless - All payload ref is available at [HyperSDK EC doc](https://developer.juspay.in/v2.0/).
Payment Page - All payload ref is available at [HyperSDK Payment page doc](https://developer.juspay.in/v4.0/).

### PreFetch

To keep the sdk up to date with the latest changes, it is highly recommended to call preFetch as early as possible. To call preFetch, use the following snippet:

```javascript
var payload = {
    "service" : "in.juspay.hyperpay",
    "betaAssets" : true,
    "payload" : {
        "clientId" : "<client_id>"
    }
}
hyperSDKRef.preFetch(JSON.stringify({payload}))
```

### Initiate

To serve dynamically changing requirements for the payments ecosystem HyperSDK uses a JS engine to improve user experience and enable faster iterations.
Initiate API starts up the js engine and enables it to improve the performance and experience of the next SDK API calls.
To call initiate, use the following snippet:

```javascript
var payload = {
    "requestId": "8cbc3fad-8b3f-40c0-ae93-2d7e75a8624a",
    "service" : "in.juspay.hyperpay",
    "betaAssets" : true,
    "payload" : {
        "action": "initiate",
        "merchantKeyId": "2980",
        "merchantId": "merchant_id",
        "clientId": "merchant_id" + "_android",
        "customerId": "customer_id",
        "environment": "sandbox",
        "signaturePayload": "signaturePayloadString",
        "signature": "signature"
    }
}
hyperSDKRef.initiate(JSON.stringify(completePayload), hyperSDKCallback);
```

Initiate payload - All payload ref is available at [HyperSDK initiate](https://developer.juspay.in/v2.0/docs/initiate-payload).

### Process

Process api helps with all the required operation to be triggered via HyperSDK.
Responses and various events triggered are streamed back to callback passed in Initiate.

```javascript
var payload = {
    "requestId": "8cbc3fad-8b3f-40c0-ae93-2d7e75a8624a",
    "service" : "in.juspay.hyperpay",
    "betaAssets" : true,
    "payload" : {
        "action": "paymentPage",
        "merchantKeyId": "2980",
        "merchantId": "merchant_id",
        "clientId": "merchant_id" + "_android",
        "customerId": "customer_id",
        "environment": "sandbox",
        "signaturePayload": "signaturePayloadString",
        "signature": "signature"
    }
}
hyperSDKRef.process(JSON.stringify(completePayload));
```

Process payload - All payload ref is available at [HyperSDK process](https://developer.juspay.in/v2.0/docs/process-payload).

### Backpress Handling

For android and other cases where system backpress or hardware backpress needs to be handled. We need to override default backpress and call HyperSDK backpress handler. [Cordova doc ref](https://cordova.apache.org/docs/en/10.x/cordova/events/events.html#backbutton)

```javascript
document.addEventListener("backbutton", onBackKeyDown, false);
function onBackKeyDown() {
    hyperSDKRef.onBackPress(function (response) {
        // if response true HyperSDK will handle else app can handle backpress
    });
}
```