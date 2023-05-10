/*
 * Copyright (c) Juspay Technologies.
 *
 * This source code is licensed under the AGPL 3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

package in.juspay.signer;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.util.Base64;
import android.util.Log;

import java.io.IOException;
import java.security.KeyFactory;
import java.security.NoSuchAlgorithmException;
import java.security.PrivateKey;
import java.security.Signature;
import java.security.spec.InvalidKeySpecException;
import java.security.spec.PKCS8EncodedKeySpec;

import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.CordovaWebView;
import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaInterface;
import org.apache.cordova.PluginResult;


import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import okhttp3.MediaType;
import okhttp3.MultipartBody;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;
import okhttp3.Call;
import okhttp3.Callback;

/**
 * This class echoes a string called from JavaScript.
 */
public class SignerPlugin extends CordovaPlugin {
    
    private final static String LOG_TAG = "SIGNER_CORDOVA_PLUGIN";
    private OkHttpClient nwClient;
    private static final String SIGN = "sign";
    private static final String GET_CLIENT_AUTH_TOKEN = "getClientAuthToken";
    private static final String CREATE_ORDER = "createOrder";
    
    private final static int REQUEST_CODE = 88;
    public static CordovaInterface cordova = null;
    CallbackContext cordovaCallBack;
    
    @Override
    public void initialize(CordovaInterface cordova, CordovaWebView webView) {
        super.initialize(cordova, webView);
        Log.i(LOG_TAG, "Initializing Signer cordova plugin.");
        this.cordova = cordova;
        // TODO: Create hyper sdk object
    }
    
    @Override
    public boolean execute(final String action, final JSONArray args, final CallbackContext callbackContext){

        if (SIGN.equalsIgnoreCase(action)) {
            cordova.getActivity().runOnUiThread(new Runnable() {
                public void run() {
                    sign(args, callbackContext);
                }
            });
            return true;
        }

        if (GET_CLIENT_AUTH_TOKEN.equalsIgnoreCase(action)) {
            getClientAuthToken(args, callbackContext);
            return true;
        }
        if (CREATE_ORDER.equalsIgnoreCase(action)) {
            createOrder(args, callbackContext);
            return true;
        }
        
        return false;
    }

    private void sign(JSONArray args, final CallbackContext callbackContext) {
        try{
            JSONObject params = new JSONObject(String.valueOf(args.get(0)));
            this.cordovaCallBack = callbackContext;
            Log.d(LOG_TAG,params.toString());
            callbackContext.success(getSignedData(params.getString("data"), getPrivateKeyFromString(params.getString("key"))));
        } catch (Exception e){
            callbackContext.error(e.getMessage());
        }
    }
    
    public static String getSignedData(String plainText, PrivateKey privateKey) throws Exception {
        Signature privateSignature = Signature.getInstance("SHA256withRSA");
        privateSignature.initSign(privateKey);
        privateSignature.update(plainText.getBytes("UTF-8"));
        byte[] signature = privateSignature.sign();
        return Base64.encodeToString(signature, Base64.DEFAULT);
    }

    public static PrivateKey getPrivateKeyFromString(String keyString) {
        PrivateKey privateKey = null;
        KeyFactory kf = null;
        try {
            kf = KeyFactory.getInstance("RSA");
        } catch (NoSuchAlgorithmException e) {
            e.printStackTrace();
        }

        PKCS8EncodedKeySpec keySpecPKCS8 = new PKCS8EncodedKeySpec(Base64.decode(keyString.replace("\n",""), Base64.DEFAULT));
        try {
            privateKey = kf.generatePrivate(keySpecPKCS8);
        } catch (InvalidKeySpecException e) {
            e.printStackTrace();
        }
        return privateKey;
    }

    public OkHttpClient getNetWorkClient() {
		if (nwClient == null) {
			nwClient = new OkHttpClient();
		}
		return nwClient;
	}

    private void getClientAuthToken(JSONArray args, final CallbackContext callbackContext) {
        try{
            JSONObject params = new JSONObject(String.valueOf(args.get(0)));
            this.cordovaCallBack = callbackContext;
            Log.d(LOG_TAG,params.toString());
            String customerId = params.getString("customerId");
            String encodedApiKey = params.getString("encodedApiKey");
            String authToken = "Basic " + encodedApiKey;
            String url = "https://sandbox.juspay.in/customers/" + customerId + "?options.get_client_auth_token=true";

            Request request= new Request.Builder()
                    .url(url)
                    .header("Authorization", authToken)
                    .header("Content-Type", "application/x-www-form-urlencoded")
                    .build();
            
            OkHttpClient nwClient = getNetWorkClient();
            nwClient.newCall(request).enqueue(new Callback() {
                @Override
                public void onFailure(Call call, IOException e) {
                    callbackContext.error("Error occurred");
                    call.cancel();
                }
                @Override
                public void onResponse(Call call, Response response) throws IOException {
                    final String nwResponse = response.body().string();
                    try {
                        JSONObject resp = new JSONObject(nwResponse);
                        if (resp.has("status") && resp.getString("status").equals("invalid_request_error")){
							    // In case customer is not created,
                                callbackContext.error("No Client Found");
                        } else {
                            callbackContext.success(resp.getJSONObject("juspay").getString("client_auth_token"));
                        }
                    } catch (JSONException e) {
                        callbackContext.error("JSON parsing error in client auth token.");
                    }
                }
            });
            
        } catch (Exception e){
            callbackContext.error(e.getMessage());
        }
    }

    private void createOrder(JSONArray args, final CallbackContext callbackContext) {
        try{
            JSONObject params = new JSONObject(String.valueOf(args.get(0)));
            this.cordovaCallBack = callbackContext;
            Log.d(LOG_TAG,params.toString());
             
            String customerId = params.getString("customerId");
            String encodedApiKey = params.getString("encodedApiKey");
            String amount =  params.getString("amount");
            String returnUrl = params.getString("returnUrl");
            String orderId = params.getString("orderId");
            String customerEmail = params.getString("customerEmail");
            String customerPhone = params.getString("customerPhone");
            String currency = "INR";
            String url = "https://sandbox.juspay.in/orders";
            String authToken = "Basic " + encodedApiKey;

            JSONObject postData = new JSONObject();
            postData.put("amount",  amount);
            postData.put("customer_email", customerEmail);
            postData.put("customer_id", customerId);
            postData.put("customer_phone", customerPhone);
            postData.put("order_id", orderId);
            postData.put("return_url", returnUrl);
            postData.put("currency", currency);

            RequestBody formBody = RequestBody.create(MediaType.parse("application/json"), String.valueOf(postData));

            Request request= new Request.Builder()
                    .url(url)
                    .header("Authorization", authToken)
                    .header("Content-Type", "application/x-www-form-urlencoded")
                    .header("version", "2018-10-25")
                    .post(formBody)
                    .build();

            OkHttpClient nwClient = getNetWorkClient();
            nwClient.newCall(request).enqueue(new Callback() {
                @Override
                public void onFailure(Call call, IOException e) {
                    callbackContext.error("Error occurred");
                    call.cancel();
                }
                @Override
                public void onResponse(Call call, Response response) throws IOException {
                    final String nwResponse = response.body().string();
                    try {
                        callbackContext.success(new JSONObject(nwResponse));
                    } catch (JSONException e) {
                        callbackContext.error("JSON parsing error in client auth token.");
                    }
                }
            });

        } catch (Exception e){
            callbackContext.error(e.getMessage());
        }
    }
}
