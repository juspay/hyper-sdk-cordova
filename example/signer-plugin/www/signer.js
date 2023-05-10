/*
 * Copyright (c) Juspay Technologies.
 *
 * This source code is licensed under the AGPL 3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

var cordova = require("cordova"),
    exec = require("cordova/exec");

var successCallback;
var errorCallback;
	
	
// Helper method to call into the native plugin
function callNative(name, args) {
	args = args || []
	exec(successCallback, errorCallback, "SignerPlugin", name, [args])
}
	
/**
 * @module Signer
 */
module.exports = {
	sign:function(payload, callback, errCallback){
		successCallback = callback;
		errorCallback = errCallback;
		callNative("sign", payload);
	},
	getClientAuthToken:function(payload, callback, errCallback){
		successCallback = callback;
		errorCallback = errCallback;
		callNative("getClientAuthToken", payload);
	},
	createOrder:function(payload, callback, errCallback){
		successCallback = callback;
		errorCallback = errCallback;
		callNative("createOrder", payload);
	}
}