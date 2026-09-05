package com.wallpaperfx.app.wallpaper;

import android.opengl.GLES20;
import android.util.Log;

// small helpers for compiling/linking gl es 2.0 shaders.
final class GLUtil {

    static final String TAG = "WallpaperFX";

    private GLUtil() {}

    static int compileProgram(String vertexSrc, String fragmentSrc) {
        int vs = compileShader(GLES20.GL_VERTEX_SHADER, vertexSrc);
        int fs = compileShader(GLES20.GL_FRAGMENT_SHADER, fragmentSrc);
        if (vs == 0 || fs == 0) return 0;

        int program = GLES20.glCreateProgram();
        GLES20.glAttachShader(program, vs);
        GLES20.glAttachShader(program, fs);
        GLES20.glLinkProgram(program);

        int[] status = new int[1];
        GLES20.glGetProgramiv(program, GLES20.GL_LINK_STATUS, status, 0);
        if (status[0] == 0) {
            Log.e(TAG, "program link failed: " + GLES20.glGetProgramInfoLog(program));
            GLES20.glDeleteProgram(program);
            program = 0;
        }
        // shaders are no longer needed once linked
        GLES20.glDeleteShader(vs);
        GLES20.glDeleteShader(fs);
        return program;
    }

    private static int compileShader(int type, String src) {
        int shader = GLES20.glCreateShader(type);
        GLES20.glShaderSource(shader, src);
        GLES20.glCompileShader(shader);
        int[] status = new int[1];
        GLES20.glGetShaderiv(shader, GLES20.GL_COMPILE_STATUS, status, 0);
        if (status[0] == 0) {
            Log.e(TAG, "shader compile failed: " + GLES20.glGetShaderInfoLog(shader) + "\n--- src ---\n" + src);
            GLES20.glDeleteShader(shader);
            return 0;
        }
        return shader;
    }

    static void checkGlError(String op) {
        int err;
        while ((err = GLES20.glGetError()) != GLES20.GL_NO_ERROR) {
            Log.e(TAG, op + " glError " + err);
        }
    }
}
