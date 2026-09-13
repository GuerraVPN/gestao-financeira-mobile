package br.com.guerravpn.crediflow;

import android.content.Context;
import android.content.SharedPreferences;
import android.util.Base64;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Locale;

final class Api {
    static final String BASE = "https://xvhbydoslqmnjjsnyvus.supabase.co";
    static final String KEY = "sb_publishable_uFIWm1dNBbbJqoxuy5aBLQ_QqtSJeya";

    private static final Object REFRESH_LOCK = new Object();
    private static volatile SharedPreferences prefs;
    private static volatile String sessionAccess;
    private static volatile String sessionRefresh;

    static void init(Context context) {
        prefs = context.getSharedPreferences("crediflow", Context.MODE_PRIVATE);
        sessionAccess = prefs.getString("access_token", null);
        sessionRefresh = prefs.getString("refresh_token", null);
    }

    static final class Resp {
        final int code;
        final String body;
        Resp(int code, String body) { this.code = code; this.body = body == null ? "" : body; }
        boolean ok() { return code >= 200 && code < 300; }
        JSONObject object() throws JSONException { return body.isEmpty() ? new JSONObject() : new JSONObject(body); }
        JSONArray array() throws JSONException { return body.isEmpty() ? new JSONArray() : new JSONArray(body); }
        String errorMessage() {
            try {
                JSONObject o = object();
                String s = o.optString("error_description", null);
                if (s == null || s.isEmpty()) s = o.optString("msg", null);
                if (s == null || s.isEmpty()) s = o.optString("message", null);
                if (s == null || s.isEmpty()) s = o.optString("error", null);
                if (s != null && !s.isEmpty()) return s;
            } catch (Exception ignored) {}
            return "HTTP " + code + (body.isEmpty() ? "" : " · " + body);
        }
    }

    private static Resp rawRequest(String method, String path, JSONObject json, String token) throws Exception {
        URL url = new URL(BASE + path);
        HttpURLConnection c = (HttpURLConnection) url.openConnection();
        c.setRequestMethod(method);
        c.setConnectTimeout(20000);
        c.setReadTimeout(30000);
        c.setRequestProperty("apikey", KEY);
        c.setRequestProperty("Accept", "application/json");
        if (token != null && !token.isEmpty()) c.setRequestProperty("Authorization", "Bearer " + token);
        if (json != null) {
            c.setDoOutput(true);
            c.setRequestProperty("Content-Type", "application/json; charset=utf-8");
            byte[] bytes = json.toString().getBytes(StandardCharsets.UTF_8);
            try (OutputStream os = c.getOutputStream()) { os.write(bytes); }
        }
        int code = c.getResponseCode();
        InputStream in = code >= 200 && code < 400 ? c.getInputStream() : c.getErrorStream();
        String body = readAll(in);
        c.disconnect();
        return new Resp(code, body);
    }

    private static Resp request(String method, String path, JSONObject json, String token) throws Exception {
        String effectiveToken = token;
        if (token != null && !token.isEmpty() && sessionAccess != null && !sessionAccess.isEmpty()) effectiveToken = sessionAccess;

        Resp response = rawRequest(method, path, json, effectiveToken);
        if (token != null && !token.isEmpty() && shouldRefresh(response)) {
            if (refreshSession()) {
                response = rawRequest(method, path, json, sessionAccess);
            } else {
                return new Resp(401, "{\"message\":\"Sua sessão expirou. Entre novamente.\"}");
            }
        }
        return response;
    }

    private static boolean shouldRefresh(Resp response) {
        if (response.code != 401) return false;
        String body = response.body == null ? "" : response.body.toLowerCase(Locale.ROOT);
        return body.contains("jwt") || body.contains("token") || body.contains("expired") || body.contains("unauthorized");
    }

    private static boolean refreshSession() {
        synchronized (REFRESH_LOCK) {
            if (sessionRefresh == null || sessionRefresh.isEmpty()) return false;
            try {
                JSONObject body = new JSONObject();
                body.put("refresh_token", sessionRefresh);
                Resp refreshed = rawRequest("POST", "/auth/v1/token?grant_type=refresh_token", body, null);
                if (!refreshed.ok()) return false;
                return captureSession(refreshed.object());
            } catch (Exception ignored) {
                return false;
            }
        }
    }

    private static boolean captureSession(JSONObject auth) {
        String access = auth.optString("access_token", null);
        String refresh = auth.optString("refresh_token", null);
        if (access == null || access.isEmpty()) return false;
        sessionAccess = access;
        if (refresh != null && !refresh.isEmpty()) sessionRefresh = refresh;
        SharedPreferences p = prefs;
        if (p != null) {
            SharedPreferences.Editor editor = p.edit().putString("access_token", sessionAccess);
            if (sessionRefresh != null && !sessionRefresh.isEmpty()) editor.putString("refresh_token", sessionRefresh);
            editor.apply();
        }
        return true;
    }

    static Resp get(String path, String token) throws Exception { return request("GET", path, null, token); }
    static Resp post(String path, JSONObject body, String token) throws Exception { return request("POST", path, body, token); }
    static Resp put(String path, JSONObject body, String token) throws Exception { return request("PUT", path, body, token); }

    static Resp submitApplication(JSONObject form) throws Exception { return post("/rest/v1/rpc/submit_credit_application", form, null); }

    static Resp checkApplication(String appId, String secret) throws Exception {
        JSONObject b = new JSONObject();
        b.put("p_application_id", appId);
        b.put("p_status_secret", secret);
        return post("/rest/v1/rpc/check_credit_application_status", b, null);
    }

    static Resp uploadApplicationDocument(String appId, String secret, String kind, String mime, byte[] bytes) throws Exception {
        JSONObject b = new JSONObject();
        b.put("applicationId", appId);
        b.put("statusSecret", secret);
        b.put("kind", kind);
        b.put("mimeType", mime);
        b.put("base64", Base64.encodeToString(bytes, Base64.NO_WRAP));
        return post("/functions/v1/application-document-upload", b, null);
    }

    static Resp signIn(String email, String password) throws Exception {
        JSONObject b = new JSONObject();
        b.put("email", email);
        b.put("password", password);
        Resp response = rawRequest("POST", "/auth/v1/token?grant_type=password", b, null);
        if (response.ok()) captureSession(response.object());
        return response;
    }

    static Resp verifyEmailOtp(String email, String token) throws Exception {
        JSONObject b = new JSONObject();
        b.put("email", email);
        b.put("token", token);
        b.put("type", "email");
        Resp response = rawRequest("POST", "/auth/v1/verify", b, null);
        if (response.ok()) captureSession(response.object());
        return response;
    }

    static Resp updatePassword(String accessToken, String password) throws Exception {
        JSONObject b = new JSONObject();
        b.put("password", password);
        return put("/auth/v1/user", b, accessToken);
    }

    static Resp completeActivation(String accessToken) throws Exception { return post("/functions/v1/complete-activation", new JSONObject(), accessToken); }

    static Resp clientLoanPreview(String accessToken, double amount, int installments, String firstDueDate) throws Exception {
        JSONObject b = new JSONObject();
        b.put("amount", amount);
        b.put("installments", installments);
        b.put("firstDueDate", firstDueDate);
        return post("/functions/v1/client-loan-preview", b, accessToken);
    }

    static Resp clientLoanRequest(String accessToken, double amount, int installments, String firstDueDate, String pixType, String pixKey, String readingChoice) throws Exception {
        JSONObject b = new JSONObject();
        b.put("amount", amount);
        b.put("installments", installments);
        b.put("firstDueDate", firstDueDate);
        b.put("pixKeyType", pixType);
        b.put("pixKey", pixKey);
        b.put("repaymentMethod", "pix");
        b.put("readingChoice", readingChoice);
        return post("/functions/v1/client-loan-request", b, accessToken);
    }

    static Resp clientEarlyPayoffInfo(String accessToken, String loanId) throws Exception {
        return get("/functions/v1/client-early-payoff-info?loanId=" + URLEncoder.encode(loanId, "UTF-8"), accessToken);
    }

    static Resp clientEarlyPayoffSubmit(String accessToken, String loanId, String fileName, String mimeType, byte[] bytes) throws Exception {
        JSONObject b = new JSONObject();
        b.put("loanId", loanId);
        b.put("fileName", fileName);
        b.put("mimeType", mimeType);
        b.put("base64", Base64.encodeToString(bytes, Base64.NO_WRAP));
        return post("/functions/v1/client-early-payoff-submit", b, accessToken);
    }

    static Resp adminRecordReview(String accessToken, JSONObject body) throws Exception { return post("/functions/v1/admin-record-review", body, accessToken); }

    static Resp adminSendActivation(String accessToken, String applicationId) throws Exception {
        JSONObject b = new JSONObject();
        b.put("applicationId", applicationId);
        return post("/functions/v1/admin-send-activation", b, accessToken);
    }

    static Resp adminLoanRequests(String accessToken) throws Exception { return get("/functions/v1/admin-loan-requests", accessToken); }

    static Resp adminConfirmDisbursement(String accessToken, String loanId, String note) throws Exception {
        JSONObject b = new JSONObject();
        b.put("loanId", loanId);
        b.put("note", note);
        return post("/functions/v1/admin-confirm-disbursement", b, accessToken);
    }

    static Resp adminRejectLoan(String accessToken, String loanId, String note) throws Exception {
        JSONObject b = new JSONObject();
        b.put("loanId", loanId);
        b.put("note", note);
        return post("/functions/v1/admin-reject-loan-request", b, accessToken);
    }

    static Resp adminEarlyPayments(String accessToken) throws Exception { return get("/functions/v1/admin-early-payments", accessToken); }

    static Resp adminReviewEarlyPayment(String accessToken, String requestId, String decision, String note) throws Exception {
        JSONObject b = new JSONObject();
        b.put("requestId", requestId);
        b.put("decision", decision);
        b.put("note", note == null ? "" : note);
        return post("/functions/v1/admin-review-early-payment", b, accessToken);
    }

    private static String readAll(InputStream in) throws Exception {
        if (in == null) return "";
        try (BufferedReader br = new BufferedReader(new InputStreamReader(in, StandardCharsets.UTF_8))) {
            StringBuilder sb = new StringBuilder();
            String line;
            while ((line = br.readLine()) != null) sb.append(line);
            return sb.toString();
        }
    }
}
