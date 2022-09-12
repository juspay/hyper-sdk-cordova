package ${mypackage};

import android.content.Intent;
import android.os.Bundle;

import org.apache.cordova.CordovaActivity;

import in.juspay.hypersdk.HyperSDKPlugin;

public class HyperActivity extends CordovaActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        if (!isTaskRoot()) {
            final Intent intent = getIntent();
            final String intentAction = intent.getAction();
            if (intent.hasCategory(Intent.CATEGORY_LAUNCHER) && intentAction != null && intentAction.equals(Intent.ACTION_MAIN)) {
                HyperSDKPlugin.notifyMerchantOnActivityRecreate(false);
            }
        }
    }

    @Override
    public void onBackPressed() {
        boolean backPressHandled = HyperSDKPlugin.onBackPressed();
        if (!backPressHandled) {
            super.onBackPressed();
        }
    }

    @Override
    public void onDestroy() {
        HyperSDKPlugin.resetActivity(this);
        super.onDestroy();
    }
}
