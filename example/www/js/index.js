/*
 * Copyright (c) Juspay Technologies.
 *
 * This source code is licensed under the AGPL 3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import merchantConfig from "./MerchantConfig.json" assert { type: "json" };
import customerConfig from "./CustomerConfig.json" assert { type: "json" };

var hyperSDKRef;
var order_id = "R" + ((Math.floor( Math.random() * 10000000000 ) ).toString());


var app = {
  // Application varructor
  initialize: function () {
    document.addEventListener('deviceready', this.onDeviceReady.bind(this), false);
    document.addEventListener("backbutton", onBackKeyDown, false);
  },
  // deviceready Event Handler
  //
  // Bind any cordova events here. Common events are:
  // 'pause', 'resume', etc.
  onDeviceReady: function () {
    this.receivedEvent('deviceready');
  },
  // Update DOM on a Received Event
  receivedEvent: function (id) {
    var parentElement = document.getElementById(id);
    console.log("initiate hyperSDKRef");
    if (id == "deviceready") {
      hyperSDKRef = cordova.plugins.HyperSDKPlugin
    }
    console.log('Received Event: ' + id);
  }
};

app.initialize();
document.addEventListener("deviceready", onDeviceReady, false);

function onDeviceReady() {
    // Now safe to use device APIs
    hyperSDKRef = cordova.plugins.HyperSDKPlugin
}

console.log("Starting the APPP!", app);
function getValue(id) {
  return document.getElementById(id).value;
}


function setValue(id, value) {
  document.getElementById(id).value = value;
}

function onBackKeyDown() {
    hyperSDKRef.onBackPress(function (response) {
        // if response true SDK will handle else app can handle
        if(!response) {
            console.log("Backpressed => ", response);
            window.history.back();
        }
    });
}

var hyperSDKCallback = function (response) {
  try {
    var parsedData = JSON.parse(response);
    updateData(JSON.stringify(parsedData, null, 2))
    console.log("response hypersdkcallback func: ", parsedData)
    var event = parsedData["event"];
    switch (event) {
      case "show_loader": {
        // Show some loader here
        toggleLoader(true);
      }
      break;
    case "hide_loader": {
      // Hide Loader
      toggleLoader(false);
    }
    break;
    case "initiate_result": {
      // Get the payload
      toggleLoader(false);
      let payload = parsedData["payload"];
      console.log("initiate result: ", parsedData)
    }
    break;
    case "process_result": {
      // Get the payload
      toggleLoader(false);
      let payload = parsedData["payload"];
      console.log("process result: ", parsedData)
    }
    break;
    default:
      //Error handling
      toggleLoader(false);
      let payload = parsedData;
      break;
    }
  } catch (error) {
    //Error handling
    console.log(error);
  }
}


function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    var r = Math.random() * 16 | 0,
      v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

const newOrderId = () => {
  var result           = '';
  var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var charactersLength = characters.length;
  for ( var i = 0; i < 10; i++ ) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}


function getOuterPayload() {
  return {
    "requestId": uuidv4(),
    "service": "in.juspay.hyperpay",
    "payload": {}
  }
}

document.getElementById("preFetch").addEventListener("click", function () {
  var completePayload = {
    service: merchantConfig.service,
    payload: {
      clientId: merchantConfig.clientId
    }
  };
  cordova.plugins.HyperSDKPlugin.preFetch(JSON.stringify(completePayload));
})

document.getElementById("initiate").addEventListener("click", function () {
  if (hyperSDKRef == null) {
      hyperSDKRef = cordova.plugins.HyperSDKPlugin
  }
  console.log("reached initiate");
  var completePayload = getOuterPayload();
  var payload = {
    "action": "initiate",
    "merchantId": merchantConfig.merchantId,
    "clientId": merchantConfig.clientId,
    "customerId": customerConfig.customerId,
    "environment": merchantConfig.environment
  };
  completePayload["payload"] = payload;
  toggleLoader(true);
  console.log("completePayload :", completePayload);
  hyperSDKRef.initiate(JSON.stringify(completePayload), hyperSDKCallback);
});


document.getElementById("isInitialised").addEventListener("click", function () {
  if (hyperSDKRef != undefined) {
    hyperSDKRef.isInitialised((response) => {
          console.log("sdkInitialised =>> ", response);
          if(response == true) {
              console.log("SDK is Initiatlised", typeof response, response);
          }
      });
  } else {
    updateData("SDK is not initialized");
  }
})

document.getElementById("process").addEventListener("click", function () {
    const orderDetailsPayload = {
        order_id : "DW-" + newOrderId(),
        merchant_id: merchantConfig.merchantId,
        amount: customerConfig.amount,
        timestamp: Date.now().toString(),
        customer_id: customerConfig.customerId,
        customer_phone: customerConfig.mobile,
        customer_email: customerConfig.email,
        return_url: merchantConfig.returnUrl
    }

    cordova.plugins.SignerPlugin.sign(
      JSON.stringify({"data":JSON.stringify(orderDetailsPayload), "key":merchantConfig.privateKey }),
      function (response) {
        console.log("Debug response ", response);
        const processPayload = {
              "action": "paymentPage",
              "clientId": merchantConfig.clientId,
              "language": "english",
              "merchantId": merchantConfig.clientId,
              "environment": merchantConfig.environment,
              "customerId": customerConfig.customerId,
              "amount": customerConfig.customerId,
              "endUrls": [merchantConfig.returnUrl],
              "customerEmail": customerConfig.email,
              "merchantKeyId": merchantConfig.merchantKeyId,
              "orderDetails": JSON.stringify(orderDetailsPayload),
              "signature": response
            };
            makePayment(processPayload);
      },
      function (err) {
        console.log("Debug Signer plugin error ", err);
      }
    );
});

document.getElementById("terminate_sdk").addEventListener("click", function() {
   hyperSDKRef.terminate();
   hyperSDKRef = null;
});


async function getClientAuthToken(succ, fail) {
  try {
    console.log("Entered getCAT function");
    var encodedApiKey = window.btoa(unescape(encodeURIComponent( apiKey )));
    console.log("Encoded API Key: ", encodedApiKey);

    cordova.plugins.SignerPlugin.getClientAuthToken({
      customerId: customerConfig.customerId,
      encodedApiKey: encodedApiKey
    }, function (token) {
      console.log("Token received: ", token);
      succ(token);
    }, function (err) {
      console.error("getClientAuthToken failed: ", err);
      fail(err);
    });

  }
  catch(err) {
    fail(err);
  }
}

async function orderCreate() {
  try {
    console.log("Entered orderCreate function");
    var encodedApiKey = window.btoa(unescape(encodeURIComponent( apiKey )));
    console.log("Encoded API Key: ", encodedApiKey);

    cordova.plugins.SignerPlugin.createOrder({
      customerId: customerConfig.customerId,
      encodedApiKey: encodedApiKey,
      amount: customerConfig.amount,
      returnUrl: merchantConfig.returnUrl,
      orderId: order_id,
      customerEmail: customerConfig.email,
      customerPhone: customerConfig.mobile,
      currency: "INR"
    }, function (orderResp) {
      console.log("Order Create Done: ", orderResp);
      updateData("Order Create Done")
    }, function (err) {
      console.log("Order Create failed: ", err);
      updateData("Order Create failed: ", err)
    });

  }
  catch(err) {
    console.log("Order Create failed: ", err);
    updateData("Order Create failed: ", err)
  }
}


//Calling orderCreate
document.getElementById("orderCreate").addEventListener("click", function () {
  orderCreate();
});


// Process sample #copy-code-marker
function makePayment (payloadJson) {
  console.log("reached process");
  var completePayload = getOuterPayload();
  completePayload["payload"] = payloadJson;
  console.log("makePayment payloadJson = ", payloadJson);
  toggleLoader(true);
  hyperSDKRef.process(JSON.stringify(completePayload), hyperSDKCallback);
}


document.getElementById("refreshWalletBalances").addEventListener("click", function () {
  const success = function (token) {
    console.log("getCat success")
    var payloadJson = {
      action: "refreshWalletBalances",
      clientAuthToken: token
    }
    makePayment(payloadJson);
  }

  const failure = function (err) {
    console.log("getCat FAILED: ", err);
  }

  getClientAuthToken(success, failure);
});


document.getElementById("nbTxn").addEventListener("click", function () { //Add endUrls
  const success = function (token) {
    console.log("getCat success")
    var payloadJson = {
      action: "nbTxn",
      orderId: order_id,
      clientAuthToken: token,
      paymentMethodType: "NB",
      paymentMethod: getValue("bankCode"),
      redirectAfterPayment: true,
      format: "json",
      endUrls: ["https:\/\/sandbox.juspay.in\/end"]
    }
    makePayment(payloadJson);
  }

  const failure = function (err) {
    console.log("getCat FAILED: ", err);
  }

  getClientAuthToken(success, failure);
});


document.getElementById("createWallet").addEventListener("click", function () { //Add endUrls
  const success = function (token) {
    console.log("getCat success")
    var payloadJson = {
      action: "createWallet",
      orderId: order_id,
      clientAuthToken: token,
      walletName: getValue("cwWalletName"),
      command: "authenticate",
      showLoader: true,
      endUrls: ["https:\/\/sandbox.juspay.in\/end"]
    }
    makePayment(payloadJson);
  }

  const failure = function (err) {
    console.log("getCat FAILED: ", err);
  }

  getClientAuthToken(success, failure);
});


document.getElementById("cardList").addEventListener("click", function () { //Add endUrls
  const success = function (token) {
    console.log("getCat success")
    var payloadJson = {
      action: "cardList",
      orderId: order_id,
      clientAuthToken: token,
      endUrls: ["https:\/\/sandbox.juspay.in\/end"]
    }
    makePayment(payloadJson);
  }

  const failure = function (err) {
    console.log("getCat FAILED: ", err);
  }

  getClientAuthToken(success, failure);
});


document.getElementById("listWallets").addEventListener("click", function () { //Add endUrls
  const success = function (token) {
    console.log("getCat success")
    var payloadJson = {
      action: "listWallets",
      clientAuthToken: token
    }
    makePayment(payloadJson);
  }

  const failure = function (err) {
    console.log("getCat FAILED: ", err);
  }

  getClientAuthToken(success, failure);
});


document.getElementById("linkWallet").addEventListener("click", function () { //Add endUrls
  const success = function (token) {
    console.log("getCat success")
    var payloadJson = {
      action: "linkWallet",
      orderId: order_id,
      clientAuthToken: token,
      walletId: getValue("lwWalletId"),
      walletName: getValue("lwWalletName"),
      otp: getValue("lwOtp"),
      endUrls: ["https:\/\/sandbox.juspay.in\/end"]
    }
    makePayment(payloadJson);
  }

  const failure = function (err) {
    console.log("getCat FAILED: ", err);
  }

  getClientAuthToken(success, failure);
});


document.getElementById("walletDirectDebit").addEventListener("click", function () { //Add endUrls
  const success = function (token) {
    console.log("getCat success")
    var payloadJson = {
      action: "walletTxn",
      orderId: order_id,
      clientAuthToken: token,
      paymentMethodType: "Wallet",
      paymentMethod: getValue("wdDirectWalletName"),
      directWalletToken: getValue("wdWalletDirectToken"),
      redirectAfterPayment: true,
      format: "json",
      endUrls: ["https:\/\/sandbox.juspay.in\/end"]
    }
    makePayment(payloadJson);
  }

  const failure = function (err) {
    console.log("getCat FAILED: ", err);
  }

  getClientAuthToken(success, failure);
});


document.getElementById("walletRedirect").addEventListener("click", function () { //Add endUrls
  const success = function (token) {
    console.log("getCat success")
    var payloadJson = {
      action: "walletTxn",
      orderId: order_id,
      clientAuthToken: token,
      paymentMethodType: "Wallet",
      paymentMethod: getValue("wdWalletName"),
      redirectAfterPayment: true,
      format: "json",
      endUrls: ["https:\/\/sandbox.juspay.in\/end"]
    }
    makePayment(payloadJson);
  }

  const failure = function (err) {
    console.log("getCat FAILED: ", err);
  }

  getClientAuthToken(success, failure);
});


document.getElementById("walletSDKDebit").addEventListener("click", function () { //Add endUrls
  const success = function (token) {
    console.log("getCat success")
    var payloadJson = {
      action: "walletTxn",
      orderId: order_id,
      clientAuthToken: token,
      paymentMethodType: "Wallet",
      paymentMethod: getValue("wdSdkWalletName"),
      sdkPresent: getValue("wdSdkPresent"),
      redirectAfterPayment: true,
      format: "json",
      endUrls: ["https:\/\/sandbox.juspay.in\/end"]
    }
    makePayment(payloadJson);
  }

  const failure = function (err) {
    console.log("getCat FAILED: ", err);
  }

  getClientAuthToken(success, failure);
});


document.getElementById("upiCollect").addEventListener("click", function () { //Add endUrls
  const success = function (token) {
    console.log("getCat success")
    var payloadJson = {
      action: "upiTxn",
      orderId: order_id,
      clientAuthToken: token,
      paymentMethodType: "UPI",
      paymentMethod: "UPI",
      displayNote: "",
      currency: "INR",
      custVpa: getValue("upCustVpa"),
      endUrls: ["https:\/\/sandbox.juspay.in\/end"]
    }
    makePayment(payloadJson);
  }

  const failure = function (err) {
    console.log("getCat FAILED: ", err);
  }

  getClientAuthToken(success, failure);
});

document.getElementById("upiIntent").addEventListener("click", function () { //Add endUrls
  const success = function (token) {
    console.log("getCat success")
    var payloadJson = {
      action: "upiTxn",
      orderId: order_id,
      clientAuthToken: token,
      paymentMethodType: "UPI",
      paymentMethod: "UPI",
      displayNote: "",
      currency: "INR",
      upiSdkPresent: true,
      payWithApp: getValue("upPayWithApp"),
      endUrls: ["https:\/\/sandbox.juspay.in\/end"]
    }
    makePayment(payloadJson);
  }

  const failure = function (err) {
    console.log("getCat FAILED: ", err);
  }

  getClientAuthToken(success, failure);
});


document.getElementById("genericUpiIntent").addEventListener("click", function () { //Add endUrls
  const success = function (token) {
    console.log("getCat success")
    var payloadJson = {
      action: "upiTxn",
      orderId: order_id,
      clientAuthToken: token,
      paymentMethodType: "UPI",
      paymentMethod: "UPI",
      displayNote: "",
      currency: "INR",
      upiSdkPresent: true,
      endUrls: ["https:\/\/sandbox.juspay.in\/end"]
    }
    makePayment(payloadJson);
  }

  const failure = function (err) {
    console.log("getCat FAILED: ", err);
  }

  getClientAuthToken(success, failure);
});


document.getElementById("getPaymentMethods").addEventListener("click", function () {
  const success = function (token) {
    console.log("getCat success")
    var payloadJson = {
      action: "getPaymentMethods",
      orderId: order_id,
      clientAuthToken: token,
      endUrls: ["https:\/\/sandbox.juspay.in\/end"]
    }
    makePayment(payloadJson);
  }

  const failure = function (err) {
    console.log("getCat FAILED: ", err);
  }

  getClientAuthToken(success, failure);
});


document.getElementById("getPaymentSource").addEventListener("click", function () {
  const success = function (token) {
    console.log("getCat success")
    var payloadJson = {
      action: "getPaymentSource",
      orderId: order_id,
      clientAuthToken: token,
      endUrls: ["https:\/\/sandbox.juspay.in\/end"]
    }
    makePayment(payloadJson);
  }

  const failure = function (err) {
    console.log("getCat FAILED: ", err);
  }

  getClientAuthToken(success, failure);
});


document.getElementById("getUpiApps").addEventListener("click", function () { //Add endUrls
  const success = function (token) {
    console.log("getCat success")
    var payloadJson = {
      action: "upiTxn",
      orderId: order_id,
      clientAuthToken: token,
      paymentMethodType: "UPI",
      paymentMethod: "UPI",
      displayNote: "",
      currency: "INR",
      getAvailableApps: true,
      endUrls: ["https:\/\/sandbox.juspay.in\/end"]
    }
    makePayment(payloadJson);
  }

  const failure = function (err) {
    console.log("getCat FAILED: ", err);
  }

  getClientAuthToken(success, failure);
 });


document.getElementById("isDeviceReady").addEventListener("click", function () { //Add endUrls
  const success = function (token) {
    console.log("getCat success")
    var payloadJson = {
      action: "isDeviceReady",
      clientAuthToken: token,
      sdkPresent: getValue("idrSdkPresent")
    }
    makePayment(payloadJson);
  }

  const failure = function (err) {
    console.log("getCat FAILED: ", err);
  }

  getClientAuthToken(success, failure);
});


document.getElementById("delinkWallet").addEventListener("click", function () { //Add endUrls
  const success = function (token) {
    console.log("getCat success")
    var payloadJson = {
      action: "delinkWallet",
      orderId: order_id,
      clientAuthToken: token,
      walletId: getValue("dwWalletId"),
      walletName: getValue("dwWalletName"),
      endUrls: ["https:\/\/sandbox.juspay.in\/end"]
    }
    makePayment(payloadJson);
  }

  const failure = function (err) {
    console.log("getCat FAILED: ", err);
  }

  getClientAuthToken(success, failure);
});


document.getElementById("refreshWallet").addEventListener("click", function () { //Add endUrls
  const success = function (token) {
    console.log("getCat success")
    var payloadJson = {
      action: "refreshWallet",
      orderId: order_id,
      clientAuthToken: token,
      walletId: getValue("rwWalletId"),
      walletName: getValue("rwWalletName"),
      endUrls: ["https:\/\/sandbox.juspay.in\/end"]
    }
    makePayment(payloadJson);
  }

  const failure = function (err) {
    console.log("getCat FAILED: ", err);
  }

  getClientAuthToken(success, failure);
});


document.getElementById("deleteCard").addEventListener("click", function () { //Add endUrls
  const success = function (token) {
    console.log("getCat success")
    var payloadJson = {
      action: "deleteCard",
      orderId: order_id,
      clientAuthToken: token,
      cardToken: getValue("dcCardToken"),
      endUrls: ["https:\/\/sandbox.juspay.in\/end"]
    }
    makePayment(payloadJson);
  }

  const failure = function (err) {
    console.log("getCat FAILED: ", err);
  }

  getClientAuthToken(success, failure);
});


document.getElementById("newCardTxn").addEventListener("click", function () { //Add endUrls
  const success = function (token) {
    console.log("getCat success")
    var save = getValue("ctSaveForFuture") === 'true'
    var payloadJson = {
      action: "cardTxn",
      orderId: order_id,
      clientAuthToken: token,
      paymentMethodType: "CARD",
      cardNumber: getValue("ctCardNumber"),
      cardExpMonth: getValue("ctExpiryMonth"),
      cardExpYear: getValue("ctExpiryYear"),
      cardSecurityCode: getValue("ctCvv"),
      saveToLocker: save,
      redirectAfterPayment: true,
      format: "json",
      endUrls: ["https:\/\/sandbox.juspay.in\/end"]
    }
    makePayment(payloadJson);
  }

  const failure = function (err) {
    console.log("getCat FAILED: ", err);
  }

  getClientAuthToken(success, failure);
});


document.getElementById("savedCardTxn").addEventListener("click", function () { //Add endUrls
  const success = function (token) {
    console.log("getCat success")
    var payloadJson = {
      action: "cardTxn",
      orderId: order_id,
      clientAuthToken: token,
      paymentMethodType: "CARD",
      cardToken: getValue("ctCardToken"),
      cardSecurityCode: getValue("ctSavedCvv"),
      redirectAfterPayment: true,
      format: "json",
      endUrls: ["https:\/\/sandbox.juspay.in\/end"]
    }
    makePayment(payloadJson);
  }

  const failure = function (err) {
    console.log("getCat FAILED: ", err);
  }

  getClientAuthToken(success, failure);
});


function toggleLoader(status) {
  var loader = document.getElementById("loaderDIV");
  if (status) {
    if (loader.style.display === "none" || loader.style.display === "") {
      loader.style.display = "block";
    }
  } else {
    if (loader.style.display === "block") {
      loader.style.display = "none";
    }
  }
}

//Updating output on the screen
function updateData(data) {
  var div = document.getElementById('outputField');
  div.innerHTML = data;
}
