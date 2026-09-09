package com.filesync.app.bridge;

import android.content.ClipData;
import android.content.Intent;
import android.content.SharedPreferences;
import android.database.Cursor;
import android.net.Uri;
import android.os.Build;
import android.provider.OpenableColumns;

import androidx.activity.result.ActivityResult;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONObject;

import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.security.SecureRandom;
import java.security.cert.X509Certificate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import javax.net.ssl.HostnameVerifier;
import javax.net.ssl.HttpsURLConnection;
import javax.net.ssl.SSLContext;
import javax.net.ssl.SSLSocketFactory;
import javax.net.ssl.TrustManager;
import javax.net.ssl.X509TrustManager;

// sender side of the localsend v2 flow (see PROTOCOL.md). two jobs:
//  - pickFiles(): SAF multi-select, returns {uri,name,size,mime} per file
//  - send(): prepare-upload then stream each file to the desktop receiver,
//    emitting "progress" events. the desktop uses a self-signed cert, so https
//    is trusted by fingerprint model here we trust-all on the lan (v0).
@CapacitorPlugin(name = "FileSync")
public class FileSyncPlugin extends Plugin {

    private static final String API = "/api/localsend/v2";
    private static final int BUF = 64 * 1024;

    // ---- identity (stable per install) ----

    @PluginMethod
    public void getIdentity(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("alias", deviceAlias());
        ret.put("fingerprint", fingerprint());
        call.resolve(ret);
    }

    private String deviceAlias() {
        String m = Build.MODEL;
        return (m == null || m.isEmpty()) ? "Android" : m;
    }

    private String fingerprint() {
        SharedPreferences sp = getContext().getSharedPreferences("filesync", 0);
        String fp = sp.getString("fingerprint", null);
        if (fp == null) {
            fp = UUID.randomUUID().toString().replace("-", "");
            sp.edit().putString("fingerprint", fp).apply();
        }
        return fp;
    }

    // ---- file picking ----

    @PluginMethod
    public void pickFiles(PluginCall call) {
        Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT);
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        intent.setType("*/*");
        intent.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, true);
        intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION);
        startActivityForResult(call, intent, "pickFilesResult");
    }

    @ActivityCallback
    private void pickFilesResult(PluginCall call, ActivityResult result) {
        if (call == null) return;
        Intent data = result.getData();
        if (result.getResultCode() != android.app.Activity.RESULT_OK || data == null) {
            call.resolve(new JSObject().put("files", new JSArray()));
            return;
        }
        List<Uri> uris = new ArrayList<>();
        ClipData clip = data.getClipData();
        if (clip != null) {
            for (int i = 0; i < clip.getItemCount(); i++) uris.add(clip.getItemAt(i).getUri());
        } else if (data.getData() != null) {
            uris.add(data.getData());
        }
        JSArray files = new JSArray();
        for (Uri uri : uris) {
            try {
                getContext().getContentResolver().takePersistableUriPermission(uri, Intent.FLAG_GRANT_READ_URI_PERMISSION);
            } catch (Exception ignored) { /* not all providers grant persistable */ }
            files.put(describe(uri));
        }
        call.resolve(new JSObject().put("files", files));
    }

    private JSObject describe(Uri uri) {
        String name = null;
        long size = -1;
        try (Cursor c = getContext().getContentResolver().query(uri, null, null, null, null)) {
            if (c != null && c.moveToFirst()) {
                int ni = c.getColumnIndex(OpenableColumns.DISPLAY_NAME);
                int si = c.getColumnIndex(OpenableColumns.SIZE);
                if (ni >= 0) name = c.getString(ni);
                if (si >= 0 && !c.isNull(si)) size = c.getLong(si);
            }
        } catch (Exception ignored) {}
        String mime = getContext().getContentResolver().getType(uri);
        JSObject o = new JSObject();
        o.put("uri", uri.toString());
        o.put("name", name == null ? "file" : name);
        o.put("size", size);
        o.put("mime", mime == null ? "application/octet-stream" : mime);
        return o;
    }

    // ---- sending ----

    @PluginMethod
    public void send(final PluginCall call) {
        final String host = call.getString("host");
        final int port = call.getInt("port", 53317);
        final String protocol = call.getString("protocol", "http");
        final JSArray files = call.getArray("files");
        if (host == null || host.isEmpty() || files == null || files.length() == 0) {
            call.reject("host and files are required");
            return;
        }
        // network must not run on the main thread
        new Thread(() -> {
            try {
                doSend(call, protocol, host, port, files);
            } catch (Exception e) {
                call.reject(e.getMessage() == null ? "send failed" : e.getMessage());
            }
        }, "filesync-send").start();
    }

    private void doSend(PluginCall call, String protocol, String host, int port, JSArray files) throws Exception {
        String base = protocol + "://" + host + ":" + port;

        // parse the file list the ui gave us; measure the total for progress
        List<JSObject> items = new ArrayList<>();
        long total = 0;
        for (int i = 0; i < files.length(); i++) {
            JSObject f = JSObject.fromJSONObject(files.getJSONObject(i));
            items.add(f);
            long s = f.getLong("size");
            if (s > 0) total += s;
        }

        // 1) prepare-upload: announce the files, receive a session + per-file tokens
        JSONObject info = new JSONObject();
        info.put("alias", deviceAlias());
        info.put("version", "2.1");
        info.put("deviceModel", Build.MODEL);
        info.put("deviceType", "mobile");
        info.put("fingerprint", fingerprint());
        info.put("port", port);
        info.put("protocol", protocol);

        JSONObject filesObj = new JSONObject();
        for (int i = 0; i < items.size(); i++) {
            JSObject f = items.get(i);
            String id = String.valueOf(i);
            long size = f.getLong("size");
            JSONObject meta = new JSONObject();
            meta.put("id", id);
            meta.put("fileName", f.getString("name", "file"));
            meta.put("size", size < 0 ? 0 : size);
            meta.put("fileType", f.getString("mime", "application/octet-stream"));
            filesObj.put(id, meta);
        }
        JSONObject prepare = new JSONObject();
        prepare.put("info", info);
        prepare.put("files", filesObj);

        HttpURLConnection pc = open(base + API + "/prepare-upload", "POST", "application/json");
        writeBytes(pc, prepare.toString().getBytes("UTF-8"));
        int pcode = pc.getResponseCode();
        if (pcode == 403 || pcode == 204) { pc.disconnect(); call.reject("empfaenger hat abgelehnt"); return; }
        if (pcode != 200) { pc.disconnect(); call.reject("prepare-upload fehlgeschlagen (" + pcode + ")"); return; }
        JSONObject presp = new JSONObject(readBody(pc));
        pc.disconnect();
        String sessionId = presp.getString("sessionId");
        JSONObject tokens = presp.getJSONObject("files");

        // 2) upload each file body to /upload?sessionId&fileId&token, streaming
        long sentTotal = 0;
        for (int i = 0; i < items.size(); i++) {
            JSObject f = items.get(i);
            String id = String.valueOf(i);
            if (!tokens.has(id)) continue; // receiver skipped this file
            String token = tokens.getString(id);
            String name = f.getString("name", "file");
            long size = f.getLong("size");
            Uri uri = Uri.parse(f.getString("uri"));

            String q = "?sessionId=" + enc(sessionId) + "&fileId=" + enc(id) + "&token=" + enc(token);
            HttpURLConnection uc = open(base + API + "/upload" + q, "POST", "application/octet-stream");
            if (size >= 0) uc.setFixedLengthStreamingMode(size);
            else uc.setChunkedStreamingMode(0);

            try (InputStream in = getContext().getContentResolver().openInputStream(uri);
                 OutputStream out = uc.getOutputStream()) {
                if (in == null) throw new Exception("konnte datei nicht lesen: " + name);
                byte[] buf = new byte[BUF];
                long fileSent = 0;
                int n;
                while ((n = in.read(buf)) != -1) {
                    out.write(buf, 0, n);
                    fileSent += n;
                    sentTotal += n;
                    emitProgress(i, items.size(), name, fileSent, size, sentTotal, total);
                }
                out.flush();
            }
            int ucode = uc.getResponseCode();
            uc.disconnect();
            if (ucode != 200) { call.reject("upload fehlgeschlagen bei " + name + " (" + ucode + ")"); return; }
        }

        JSObject ret = new JSObject();
        ret.put("sent", items.size());
        call.resolve(ret);
    }

    private void emitProgress(int index, int count, String name, long fileSent, long fileTotal, long sent, long total) {
        JSObject p = new JSObject();
        p.put("index", index);
        p.put("count", count);
        p.put("name", name);
        p.put("fileSent", fileSent);
        p.put("fileTotal", fileTotal);
        p.put("sent", sent);
        p.put("total", total);
        notifyListeners("progress", p);
    }

    // ---- http helpers ----

    private HttpURLConnection open(String urlStr, String method, String contentType) throws Exception {
        URL url = new URL(urlStr);
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        if (conn instanceof HttpsURLConnection) {
            // desktop uses a self-signed cert; on the trusted lan we accept it (v0).
            HttpsURLConnection https = (HttpsURLConnection) conn;
            https.setSSLSocketFactory(trustAllFactory());
            https.setHostnameVerifier(ALLOW_ALL);
        }
        conn.setRequestMethod(method);
        conn.setConnectTimeout(10000);
        conn.setReadTimeout(60000);
        conn.setDoOutput(true);
        conn.setRequestProperty("Content-Type", contentType);
        return conn;
    }

    private void writeBytes(HttpURLConnection conn, byte[] body) throws Exception {
        conn.setFixedLengthStreamingMode(body.length);
        try (OutputStream os = conn.getOutputStream()) { os.write(body); }
    }

    private String readBody(HttpURLConnection conn) throws Exception {
        InputStream is = conn.getResponseCode() >= 400 ? conn.getErrorStream() : conn.getInputStream();
        if (is == null) return "";
        java.io.ByteArrayOutputStream bos = new java.io.ByteArrayOutputStream();
        byte[] buf = new byte[4096];
        int n;
        while ((n = is.read(buf)) != -1) bos.write(buf, 0, n);
        is.close();
        return bos.toString("UTF-8");
    }

    private static String enc(String s) throws Exception {
        return URLEncoder.encode(s, "UTF-8");
    }

    private static final HostnameVerifier ALLOW_ALL = (hostname, session) -> true;

    private static SSLSocketFactory trustAllFactory() throws Exception {
        TrustManager[] trustAll = new TrustManager[]{
            new X509TrustManager() {
                public void checkClientTrusted(X509Certificate[] c, String a) {}
                public void checkServerTrusted(X509Certificate[] c, String a) {}
                public X509Certificate[] getAcceptedIssuers() { return new X509Certificate[0]; }
            }
        };
        SSLContext ctx = SSLContext.getInstance("TLS");
        ctx.init(null, trustAll, new SecureRandom());
        return ctx.getSocketFactory();
    }
}
