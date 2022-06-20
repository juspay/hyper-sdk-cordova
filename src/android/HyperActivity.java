package in.juspay.hypersdk;

import org.apache.cordova.*;

public class HyperActivity extends CordovaActivity {
    @Override
    public void onBackPressed() {
        boolean backPressHandled = HyperSDKPlugin.onBackPressed();
        if (!backPressHandled) {
            super.onBackPressed();
        }
    }

    @Override
    public void onDestroy() {
        HyperSDKPlugin.resetActivity();
        super.onDestroy();
    }
}
