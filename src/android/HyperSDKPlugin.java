package in.juspay.hypersdk;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ApplicationInfo;
import android.net.Uri;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.view.View;
import android.webkit.WebView;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.RelativeLayout;

import androidx.appcompat.app.AppCompatActivity;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.FragmentActivity;

import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.CordovaWebView;
import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaInterface;
import org.apache.cordova.PluginResult;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.lang.ref.WeakReference;
import java.util.HashMap;
import java.util.Map;

import in.juspay.hypersdk.core.PaymentConstants;
import in.juspay.hypersdk.core.SdkTracker;
import in.juspay.hypersdk.data.JuspayResponseHandler;
import in.juspay.hypersdk.ui.HyperPaymentsCallbackAdapter;
import in.juspay.services.HyperServices;

/**
 * Module that exposes Hyper SDK to Cordova bridge JavaScript code.
 */
public class HyperSDKPlugin extends CordovaPlugin {

    private final static String LOG_TAG = "HYPERSDK_CORDOVA_PLUGIN";

    private static final String INITIATE = "initiate";
    private static final String PROCESS = "process";
    private static final String PREFETCH = "prefetch";
    private static final String isINITIALISED = "isInitialised";
    private static final String TERMINATE = "terminate";
    private static final String isNULL = "isNull";
    private static final String SDK_TRACKER_LABEL = "hyper_sdk_cordova";

    /**
     * All the React methods in here should be synchronized on this specific object because there
     * was no guarantee that all React methods will be called on the same thread, and can cause
     * concurrency issues.
     */
    private static final Object lock = new Object();
    private static final RequestPermissionsResultDelegate requestPermissionsResultDelegate = new RequestPermissionsResultDelegate();

    private final static int REQUEST_CODE = 88;
    public static CordovaInterface cordova = null;
    CallbackContext cordovaCallBack;
    @Nullable
    private HyperServices hyperServices;

    @Override
    public void initialize(CordovaInterface cordova, CordovaWebView webView) {
        super.initialize(cordova, webView);
        Log.i(LOG_TAG, "Initializing HyperSDK cordova plugin.");
        this.cordova = cordova;
        synchronized (lock) {
            cordova.getActivity().runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    FragmentActivity activity = (FragmentActivity) cordova.getActivity();

                    if (activity == null) {
                        SdkTracker.trackBootLifecycle(
                            PaymentConstants.SubCategory.LifeCycle.HYPER_SDK,
                            PaymentConstants.LogLevel.ERROR,
                            SDK_TRACKER_LABEL,
                            "createHyperServices",
                            "activity is null");
                        return;
                    }
                    Context context = activity.getApplicationContext();
                    LinearLayout parent = new LinearLayout(context);
                    parent.setLayoutParams(new LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT));
                    hyperServices = new HyperServices((FragmentActivity) cordova.getActivity());
                    requestPermissionsResultDelegate.set(hyperServices);
                }
            });

        }
    }

    @Override
    public boolean execute(final String action, final JSONArray args, final CallbackContext callbackContext){
        this.cordovaCallBack = callbackContext;

        if (PREFETCH.equalsIgnoreCase(action)) {
            cordova.getActivity().runOnUiThread(new Runnable() {
                public void run() {
                    preFetch(args);
                }
            });
            return true;
        }

        if (INITIATE.equalsIgnoreCase(action)) {
            cordova.getActivity().runOnUiThread(new Runnable() {
                public void run() {
                    initiate(args);
                }
            });
            return true;
        }

        if (PROCESS.equalsIgnoreCase(action)) {
            cordova.getActivity().runOnUiThread(new Runnable() {
                public void run() {
                    process(args);
                }
            });
            return true;
        }

        if (isINITIALISED.equalsIgnoreCase(action)) {
            cordova.getActivity().runOnUiThread(new Runnable() {
                public void run() {
                    isInitialised();
                }
            });
            return true;
        }

        if (TERMINATE.equalsIgnoreCase(action)) {
            cordova.getActivity().runOnUiThread(new Runnable() {
                public void run() {
                    terminate();
                }
            });
            return true;
        }

        if (isNULL.equalsIgnoreCase(action)) {
            cordova.getActivity().runOnUiThread(new Runnable() {
                public void run() {
                    isNull();
                }
            });
            return true;
        }

        return false;
    }

    public void preFetch(JSONArray args) {
        try{
            JSONObject params = new JSONObject(String.valueOf(args.get(0)));
            Log.d(LOG_TAG,params.toString());
            HyperServices.preFetch(cordova.getActivity().getApplicationContext(), params);
            this.cordovaCallBack.success("success");
        } catch (Exception e){
            this.cordovaCallBack.success(e.getMessage());
        }
    }

    private void initiate(JSONArray args) {
        synchronized (lock) {
            try{
                FragmentActivity activity = (FragmentActivity) cordova.getActivity();
                JSONObject params = new JSONObject(String.valueOf(args.get(0)));
                Log.d(LOG_TAG,params.toString());
                if (activity == null) {
                    SdkTracker.trackBootLifecycle(
                        PaymentConstants.SubCategory.LifeCycle.HYPER_SDK,
                        PaymentConstants.LogLevel.ERROR,
                        SDK_TRACKER_LABEL,
                        "initiate",
                        "activity is null");
                    return;
                }
                if (this.hyperServices == null) {
                    SdkTracker.trackBootLifecycle(
                        PaymentConstants.SubCategory.LifeCycle.HYPER_SDK,
                        PaymentConstants.LogLevel.ERROR,
                        SDK_TRACKER_LABEL,
                        "initiate",
                        "hyperServices is null");
                    return;
                }
                this.hyperServices.initiate(params, new HyperPaymentsCallbackAdapter() {
                    @Override
                    public void onEvent(JSONObject data, JuspayResponseHandler handler) {
                        try {
                            cordovaCallBack.success(data.toString());
                        } catch (Exception e) {
                            cordovaCallBack.success(e.getMessage());
                        }
                    }
                });
            } catch (Exception e){
                this.cordovaCallBack.success(e.getMessage());
            }
        }
    }

    private void process(JSONArray args) {
        synchronized (lock) {
            try{
                FragmentActivity activity = (FragmentActivity) cordova.getActivity();
                JSONObject params = new JSONObject(String.valueOf(args.get(0)));
                Log.d(LOG_TAG,params.toString());
                if (activity == null) {
                    SdkTracker.trackBootLifecycle(
                        PaymentConstants.SubCategory.LifeCycle.HYPER_SDK,
                        PaymentConstants.LogLevel.ERROR,
                        SDK_TRACKER_LABEL,
                        "process",
                        "activity is null");
                    return;
                }

                if (hyperServices == null) {
                    SdkTracker.trackBootLifecycle(
                        PaymentConstants.SubCategory.LifeCycle.HYPER_SDK,
                        PaymentConstants.LogLevel.ERROR,
                        SDK_TRACKER_LABEL,
                        "process",
                        "hyperServices is null");
                    return;
                }

                this.hyperServices.process(params);
            } catch (Exception e){
                this.cordovaCallBack.success(e.getMessage());
            }
        }
    }

    public void terminate() {
        synchronized (lock) {
            if (hyperServices != null) {
                hyperServices.terminate();
            }

            hyperServices = null;
        }
    }

    public void isNull() {
        boolean nullStatus = hyperServices == null?true:false;
        this.cordovaCallBack.success(nullStatus?"true":"false");
    }

    public void isInitialised() {
        boolean isInitialized = false;

        synchronized (lock) {
            if (hyperServices != null) {
                try {
                    isInitialized = hyperServices.isInitialised();
                    this.cordovaCallBack.success(isInitialized?"true":"false");
                } catch (Exception e) {
                    this.cordovaCallBack.success(e.getMessage());
                }
            }
        }
    }

    /**
     * Notifies HyperSDK that a response for permissions is here. Merchants are required to call
     * this method from their activity as by default activity will
     * not forward any results to the fragments running inside it.
     *
     * @param requestCode  The requestCode that was received in your activity's
     *                     {@code onRequestPermissionsResult} method.
     * @param permissions  The set of permissions received in your activity's
     *                     {@code onRequestPermissionsResult} method.
     * @param grantResults The results of each permission received in your activity's
     *                     {@code onRequestPermissionsResult} method.
     */
    public static void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        synchronized (lock) {
            requestPermissionsResultDelegate.onRequestPermissionsResult(requestCode, permissions, grantResults);
        }
    }

    @Override
    public void onNewIntent(Intent intent) {
    }


    @Override
    public void onActivityResult(int requestCode, int resultCode, Intent data) {
        synchronized (lock) {
            if (hyperServices == null) {
                SdkTracker.trackBootLifecycle(
                    PaymentConstants.SubCategory.LifeCycle.HYPER_SDK,
                    PaymentConstants.LogLevel.ERROR,
                    SDK_TRACKER_LABEL,
                    "onActivityResult",
                    "hyperServices is null");
                return;
            }

            hyperServices.onActivityResult(requestCode, resultCode, data);
        }
    }

    /**
     * A holder class that allows us to maintain HyperServices instance statically without causing a
     * memory leak. This was required because HyperServices class maintains a reference to the
     * activity internally.
     */
    private static class RequestPermissionsResultDelegate {
        @NonNull private WeakReference<HyperServices> hyperServicesHolder = new WeakReference<>(null);

        synchronized void set(@NonNull HyperServices hyperServices) {
            this.hyperServicesHolder = new WeakReference<>(hyperServices);
        }

        void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
            HyperServices hyperServices = hyperServicesHolder.get();

            if (hyperServices == null) {
                SdkTracker.trackBootLifecycle(
                    PaymentConstants.SubCategory.LifeCycle.HYPER_SDK,
                    PaymentConstants.LogLevel.ERROR,
                    SDK_TRACKER_LABEL,
                    "onRequestPermissionsResult",
                    "hyperServices is null");
                return;
            }

            hyperServices.onRequestPermissionsResult(requestCode, permissions, grantResults);
        }
    }
}