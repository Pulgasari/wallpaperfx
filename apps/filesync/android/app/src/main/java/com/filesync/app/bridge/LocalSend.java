package com.filesync.app.bridge;

import android.content.Context;
import android.net.Uri;
import android.os.Build;

import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.security.SecureRandom;
import java.security.cert.X509Certificate;
import java.util.List;

import javax.net.ssl.HostnameVerifier;
import javax.net.ssl.HttpsURLConnection;
import javax.net.ssl.SSLContext;
import javax.net.ssl.SSLSocketFactory;
import javax.net.ssl.TrustManager;
import javax.net.ssl.X509TrustManager;

// shared localsend v2 sender client used by both the manual send (FileSyncPlugin)
// and the background auto-sync (SyncService). see PROTOCOL.md. all methods block
// on the network, so call them off the main thread.
public class LocalSend {

    private static final String API = "/api/localsend/v2";
    private static final int BUF = 64 * 1024;

    // a file to upload: the content uri plus the metadata prepare-upload needs.
    public static class FileSpec {
        public final String name, mime;
        public final long size; // -1 if unknown (streamed chunked)
        public final Uri uri;
        public FileSpec(String name, String mime, long size, Uri uri) {
            this.name = name; this.mime = mime; this.size = size; this.uri = uri;
        }
    }

    public interface Progress {
        void onProgress(int index, int count, String name, long fileSent, long fileTotal, long sent, long total);
    }

    // carries an http-ish code so callers can distinguish pin (401) / decline (403).
    public static class SendException extends Exception {
        public final int code;
        public SendException(int code, String message) { super(message); this.code = code; }
    }

    // prepare-upload then stream each file body. returns the number of files sent.
    public static int send(Context ctx, String protocol, String host, int port, String pin,
                           JSONObject info, List<FileSpec> files, Progress cb) throws Exception {
        String base = protocol + "://" + host + ":" + port;

        long total = 0;
        for (FileSpec f : files) if (f.size > 0) total += f.size;

        JSONObject filesObj = new JSONObject();
        for (int i = 0; i < files.size(); i++) {
            FileSpec f = files.get(i);
            JSONObject meta = new JSONObject();
            meta.put("id", String.valueOf(i));
            meta.put("fileName", f.name);
            meta.put("size", f.size < 0 ? 0 : f.size);
            meta.put("fileType", f.mime == null ? "application/octet-stream" : f.mime);
            filesObj.put(String.valueOf(i), meta);
        }
        JSONObject prepare = new JSONObject();
        prepare.put("info", info);
        prepare.put("files", filesObj);

        String prepareUrl = base + API + "/prepare-upload";
        if (pin != null && !pin.isEmpty()) prepareUrl += "?pin=" + enc(pin);
        HttpURLConnection pc = open(prepareUrl, "POST", "application/json");
        writeBytes(pc, prepare.toString().getBytes("UTF-8"));
        int pcode = pc.getResponseCode();
        String prespBody = readBody(pc);
        pc.disconnect();
        if (pcode == 401) throw new SendException(401, "pin");
        if (pcode == 403 || pcode == 204) throw new SendException(403, "declined");
        if (pcode != 200) throw new SendException(pcode, "prepare-upload failed (" + pcode + ")");

        JSONObject presp = new JSONObject(prespBody);
        String sessionId = presp.getString("sessionId");
        JSONObject tokens = presp.getJSONObject("files");

        long sentTotal = 0;
        for (int i = 0; i < files.size(); i++) {
            String id = String.valueOf(i);
            if (!tokens.has(id)) continue; // receiver skipped this file
            String token = tokens.getString(id);
            FileSpec f = files.get(i);

            String q = "?sessionId=" + enc(sessionId) + "&fileId=" + enc(id) + "&token=" + enc(token);
            HttpURLConnection uc = open(base + API + "/upload" + q, "POST", "application/octet-stream");
            if (f.size >= 0) uc.setFixedLengthStreamingMode(f.size);
            else uc.setChunkedStreamingMode(0);

            try (InputStream in = ctx.getContentResolver().openInputStream(f.uri);
                 OutputStream out = uc.getOutputStream()) {
                if (in == null) throw new SendException(0, "cannot read file: " + f.name);
                byte[] buf = new byte[BUF];
                long fileSent = 0;
                int n;
                while ((n = in.read(buf)) != -1) {
                    out.write(buf, 0, n);
                    fileSent += n;
                    sentTotal += n;
                    if (cb != null) cb.onProgress(i, files.size(), f.name, fileSent, f.size, sentTotal, total);
                }
                out.flush();
            }
            int ucode = uc.getResponseCode();
            uc.disconnect();
            if (ucode != 200) throw new SendException(ucode, "upload failed for " + f.name + " (" + ucode + ")");
        }
        return files.size();
    }

    // info dto for a mobile sender.
    public static JSONObject mobileInfo(String alias, String fingerprint, int port, String protocol) throws Exception {
        JSONObject info = new JSONObject();
        info.put("alias", alias);
        info.put("version", "2.1");
        info.put("deviceModel", Build.MODEL);
        info.put("deviceType", "mobile");
        info.put("fingerprint", fingerprint);
        info.put("port", port);
        info.put("protocol", protocol);
        return info;
    }

    // ---- http helpers ----

    private static HttpURLConnection open(String urlStr, String method, String contentType) throws Exception {
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

    private static void writeBytes(HttpURLConnection conn, byte[] body) throws Exception {
        conn.setFixedLengthStreamingMode(body.length);
        try (OutputStream os = conn.getOutputStream()) { os.write(body); }
    }

    private static String readBody(HttpURLConnection conn) throws Exception {
        InputStream is = conn.getResponseCode() >= 400 ? conn.getErrorStream() : conn.getInputStream();
        if (is == null) return "";
        ByteArrayOutputStream bos = new ByteArrayOutputStream();
        byte[] buf = new byte[4096];
        int n;
        while ((n = is.read(buf)) != -1) bos.write(buf, 0, n);
        is.close();
        return bos.toString("UTF-8");
    }

    static String enc(String s) throws Exception {
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
