package br.com.guerravpn.crediflow;

import android.app.Application;

public final class CrediFlowApp extends Application {
    @Override public void onCreate() {
        super.onCreate();
        Api.init(this);
    }
}
