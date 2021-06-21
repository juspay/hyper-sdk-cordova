var cordova = require("cordova"),
    exec = require("cordova/exec");

// Using one callback as HyperSDK is more event based
// than callback based
var pluginCallback;
	
// Helper method to call the native plugin
function callNative(name, args) {
    args = args || []
    exec(pluginCallback, pluginCallback, "HyperSDKPlugin", name, [args])
}
    
/**
 * @module HyperSDK
 */
module.exports = {
	preFetch:function(payload, callback){
		pluginCallback = callback;
		callNative("preFetch", payload);
	},
	initiate:function(payload, callback){
		pluginCallback = callback;
		callNative("initiate", payload);
	},
	process:function(payload){
        callNative("process", payload);
	}
}