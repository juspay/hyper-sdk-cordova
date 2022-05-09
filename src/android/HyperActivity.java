package in.juspay.hypersdk;

import androidx.fragment.app.FragmentActivity;

public class HyperActivity extends FragmentActivity {
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