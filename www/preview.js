// webgl live preview. mirrors the native gl es 2.0 shaders (cover/fit scaling +
// pan + duotone/scanlines) so the config screen shows the real framing and filter
// on the selected media. reads the shared `state` object each frame.
// parallax is not swipe-animated here; the preview shows the centered framing.

const Preview = (function () {
    const VERTEX_SRC = `
        attribute vec2 aPosition;
        attribute vec2 aTexCoord;
        uniform vec2 uUvScale;
        uniform vec2 uUvOffset;
        uniform vec2 uPosScale;
        varying vec2 vTexCoord;
        varying vec2 vScreenCoord;
        void main() {
            vTexCoord = (aTexCoord - 0.5) * uUvScale + 0.5 + uUvOffset;
            vScreenCoord = aTexCoord;
            gl_Position = vec4(aPosition * uPosScale, 0.0, 1.0);
        }`;

    // mirrors android/app/.../wallpaper/FilterGlsl.java; keep the two in sync
    const FRAGMENT_SRC = `
        precision mediump float;
        varying vec2 vTexCoord;
        varying vec2 vScreenCoord;
        uniform sampler2D uTexture;
        uniform int uFilter;
        uniform vec3 uColorA;
        uniform vec3 uColorB;
        uniform vec3 uColorC;
        uniform float uScanCount;
        uniform float uScanStrength;
        uniform float uCrtMask;
        uniform float uAmount;
        uniform float uLevels;
        uniform float uPixelSize;
        uniform float uHalftone;
        uniform float uVignette;
        uniform float uVignetteRadius;
        uniform float uChromatic;
        uniform vec2 uResolution;
        float luma(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }
        void main() {
            vec2 uv = vTexCoord;
            if (uFilter == 7) {
                vec2 grid = uResolution / max(1.0, uPixelSize);
                uv = (floor(uv * grid) + 0.5) / grid;
            }
            vec4 c = texture2D(uTexture, uv);
            if (uFilter == 1) {
                c.rgb = mix(uColorA, uColorB, luma(c.rgb));
            } else if (uFilter == 3) {
                c.rgb = mix(c.rgb, vec3(luma(c.rgb)), uAmount);
            } else if (uFilter == 4) {
                float l = luma(c.rgb);
                vec3 sep = clamp(vec3(l) * vec3(1.07, 0.74, 0.43), 0.0, 1.0);
                c.rgb = mix(c.rgb, sep, uAmount);
            } else if (uFilter == 5) {
                float l = luma(c.rgb);
                vec3 low = mix(uColorA, uColorC, smoothstep(0.0, 0.5, l));
                c.rgb = mix(low, uColorB, smoothstep(0.5, 1.0, l));
            } else if (uFilter == 6) {
                float n = max(2.0, uLevels);
                c.rgb = floor(c.rgb * n) / (n - 1.0);
            } else if (uFilter == 12) {
                c.rgb = 1.0 - c.rgb;
            } else if (uFilter == 8) {
                float aspect = uResolution.x / max(1.0, uResolution.y);
                vec2 cell = vScreenCoord * vec2(uHalftone * aspect, uHalftone);
                vec2 center = floor(cell) + 0.5;
                float d = length(cell - center) * 2.0;
                float radius = sqrt(max(0.0, 1.0 - luma(c.rgb)));
                float cov = 1.0 - smoothstep(radius - 0.1, radius + 0.1, d);
                c.rgb = mix(uColorB, uColorA, cov);
            } else if (uFilter == 2) {
                float s = 0.5 + 0.5 * cos(vScreenCoord.y * uScanCount * 6.2831853);
                c.rgb *= (1.0 - uScanStrength * s);
            } else if (uFilter == 11) {
                float s = 0.5 + 0.5 * cos(vScreenCoord.y * uScanCount * 6.2831853);
                c.rgb *= (1.0 - uScanStrength * s);
                float m = mod(floor(vScreenCoord.x * uResolution.x), 3.0);
                vec3 mask = vec3(1.0 - uCrtMask);
                if (m < 1.0) mask.r = 1.0; else if (m < 2.0) mask.g = 1.0; else mask.b = 1.0;
                c.rgb *= mask;
                float dv = length(vScreenCoord - 0.5) * 1.4142136;
                c.rgb *= 1.0 - 0.4 * smoothstep(0.6, 1.0, dv);
            } else if (uFilter == 9) {
                float dv = length(vScreenCoord - 0.5) * 1.4142136;
                c.rgb *= 1.0 - uVignette * smoothstep(uVignetteRadius, 1.0, dv);
            } else if (uFilter == 10) {
                vec2 off = (vScreenCoord - 0.5) * uChromatic;
                c.r = texture2D(uTexture, uv + off).r;
                c.b = texture2D(uTexture, uv - off).b;
            }
            gl_FragColor = c;
        }`;

    let gl, canvas, program, loc, quad;
    let state = null;

    // media source
    let sourceType = null; // 'image' | 'video' | null
    let sourceEl = null;
    let sourceUrl = null;
    let texture = null;
    let texReady = false;
    let contentW = 1, contentH = 1;

    function toSrc(path) {
        if (window.Capacitor && typeof window.Capacitor.convertFileSrc === 'function') {
            return window.Capacitor.convertFileSrc(path);
        }
        return path;
    }

    function compile(type, src) {
        const sh = gl.createShader(type);
        gl.shaderSource(sh, src);
        gl.compileShader(sh);
        if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
            console.error('preview shader error:', gl.getShaderInfoLog(sh));
        }
        return sh;
    }

    function init() {
        canvas = document.getElementById('preview');
        if (!canvas) return false;
        gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (!gl) {
            canvas.parentElement.classList.add('no-gl');
            return false;
        }

        program = gl.createProgram();
        gl.attachShader(program, compile(gl.VERTEX_SHADER, VERTEX_SRC));
        gl.attachShader(program, compile(gl.FRAGMENT_SHADER, FRAGMENT_SRC));
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error('preview link error:', gl.getProgramInfoLog(program));
            return false;
        }

        loc = {
            aPosition: gl.getAttribLocation(program, 'aPosition'),
            aTexCoord: gl.getAttribLocation(program, 'aTexCoord')
        };
        [
            'uUvScale', 'uUvOffset', 'uPosScale', 'uFilter', 'uColorA', 'uColorB', 'uColorC',
            'uScanCount', 'uScanStrength', 'uCrtMask', 'uAmount', 'uLevels', 'uPixelSize',
            'uHalftone', 'uVignette', 'uVignetteRadius', 'uChromatic', 'uResolution', 'uTexture'
        ].forEach((n) => (loc[n] = gl.getUniformLocation(program, n)));

        // positions (-1..1) and texcoords (0..1), triangle strip
        quad = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, quad);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
            -1, -1, 0, 0,
            1, -1, 1, 0,
            -1, 1, 0, 1,
            1, 1, 1, 1
        ]), gl.STATIC_DRAW);

        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.clearColor(0, 0, 0, 1);

        resize();
        window.addEventListener('resize', resize);
        requestAnimationFrame(loop);
        return true;
    }

    function resize() {
        if (!canvas) return;
        // draw at the device's screen aspect (portrait) so the framing matches
        const sw = window.screen && screen.width ? screen.width : 9;
        const sh = window.screen && screen.height ? screen.height : 19.5;
        const ratio = sw / sh;
        const cssH = Math.min(340, Math.round(window.innerHeight * 0.4));
        const cssW = Math.round(cssH * ratio);
        const dpr = window.devicePixelRatio || 1;
        canvas.style.width = cssW + 'px';
        canvas.style.height = cssH + 'px';
        canvas.width = Math.round(cssW * dpr);
        canvas.height = Math.round(cssH * dpr);
    }

    function attach(sharedState) {
        state = sharedState;
    }

    // (re)derive the media source from the current state
    function refreshMedia() {
        if (!gl || !state) return;
        let url = null;
        let type = null;
        if (state.mode === 'video' && state.videoPath) {
            url = toSrc(state.videoPath);
            type = 'video';
        } else if (state.mode === 'images' && state.imagePaths.length) {
            url = toSrc(state.imagePaths[0]);
            type = 'image';
        }

        if (url === sourceUrl && type === sourceType) return; // unchanged
        teardownSource();
        sourceUrl = url;
        sourceType = type;
        if (!url) return;

        if (type === 'image') {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
                contentW = img.naturalWidth || 1;
                contentH = img.naturalHeight || 1;
                uploadTexture(img);
                texReady = true;
            };
            img.onerror = () => console.warn('preview: image load failed', url);
            img.src = url;
            sourceEl = img;
        } else {
            const v = document.createElement('video');
            v.src = url;
            v.muted = true;
            v.loop = true;
            v.playsInline = true;
            v.setAttribute('playsinline', '');
            v.addEventListener('loadeddata', () => {
                contentW = v.videoWidth || 1;
                contentH = v.videoHeight || 1;
            });
            v.play().catch(() => {});
            sourceEl = v;
        }
    }

    function teardownSource() {
        if (sourceType === 'video' && sourceEl) {
            try { sourceEl.pause(); } catch (e) {}
            sourceEl.src = '';
        }
        sourceEl = null;
        texReady = false;
        if (texture) {
            gl.deleteTexture(texture);
            texture = null;
        }
    }

    function uploadTexture(source) {
        if (!texture) {
            texture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        }
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
    }

    // mirrors SceneRenderer.computeScale (centered parallax)
    function computeScale() {
        const screenAspect = canvas.width / canvas.height;
        const r = (contentW / contentH) / screenAspect;
        const scaleMode = state.mode === 'video' ? state.videoScale : state.imageScale;
        const offX = state.mode === 'video' ? state.videoOffsetX : state.imageOffsetX;
        const offY = state.mode === 'video' ? state.videoOffsetY : state.imageOffsetY;

        let uvScaleX = 1, uvScaleY = 1, uvOffX = 0, uvOffY = 0, posScaleX = 1, posScaleY = 1;
        if (scaleMode === 'fit') {
            posScaleX = Math.min(1, r);
            posScaleY = Math.min(1, 1 / r);
        } else {
            uvScaleX = Math.min(1, 1 / r);
            uvScaleY = Math.min(1, r);
            if (state.parallaxEnabled) {
                const room = Math.max(0, Math.min(0.9, state.parallaxAmount));
                uvScaleX *= 1 - room;
                uvScaleY *= 1 - room;
            }
            uvOffX = clamp(offX, -1, 1) * (1 - uvScaleX) * 0.5;
            uvOffY = clamp(offY, -1, 1) * (1 - uvScaleY) * 0.5;
        }
        return [uvScaleX, uvScaleY, uvOffX, uvOffY, posScaleX, posScaleY];
    }

    function clamp(v, lo, hi) {
        return Math.max(lo, Math.min(hi, v));
    }

    function rgb(arr, i) {
        return (arr && arr[i] != null ? arr[i] : 0) / 255;
    }

    // must match SceneRenderer.filterIndex / FilterGlsl
    const FILTER_INDEX = {
        none: 0, duotone: 1, scanlines: 2, grayscale: 3, sepia: 4, gradientmap: 5,
        posterize: 6, pixelate: 7, halftone: 8, vignette: 9, chromatic: 10, crt: 11, invert: 12
    };
    function filterIndex(type) {
        return FILTER_INDEX[type] || 0;
    }

    function loop() {
        render();
        requestAnimationFrame(loop);
    }

    function render() {
        if (!gl) return;
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.clear(gl.COLOR_BUFFER_BIT);

        if (!state || !sourceEl) return;
        if (sourceType === 'video') {
            if (sourceEl.readyState >= 2) {
                contentW = sourceEl.videoWidth || contentW;
                contentH = sourceEl.videoHeight || contentH;
                uploadTexture(sourceEl);
                texReady = true;
            }
        }
        if (!texReady || !texture) return;

        const s = computeScale();
        gl.useProgram(program);
        gl.bindBuffer(gl.ARRAY_BUFFER, quad);
        gl.enableVertexAttribArray(loc.aPosition);
        gl.vertexAttribPointer(loc.aPosition, 2, gl.FLOAT, false, 16, 0);
        gl.enableVertexAttribArray(loc.aTexCoord);
        gl.vertexAttribPointer(loc.aTexCoord, 2, gl.FLOAT, false, 16, 8);

        gl.uniform2f(loc.uUvScale, s[0], s[1]);
        gl.uniform2f(loc.uUvOffset, s[2], s[3]);
        gl.uniform2f(loc.uPosScale, s[4], s[5]);

        gl.uniform1i(loc.uFilter, filterIndex(state.filterType));
        gl.uniform3f(loc.uColorA, rgb(state.duotoneShadow, 0), rgb(state.duotoneShadow, 1), rgb(state.duotoneShadow, 2));
        gl.uniform3f(loc.uColorB, rgb(state.duotoneHighlight, 0), rgb(state.duotoneHighlight, 1), rgb(state.duotoneHighlight, 2));
        gl.uniform3f(loc.uColorC, rgb(state.gradientMid, 0), rgb(state.gradientMid, 1), rgb(state.gradientMid, 2));
        gl.uniform1f(loc.uScanCount, state.scanCount);
        gl.uniform1f(loc.uScanStrength, state.scanStrength);
        gl.uniform1f(loc.uCrtMask, state.crtMask);
        gl.uniform1f(loc.uAmount, state.filterType === 'grayscale' ? state.grayAmount : state.sepiaAmount);
        gl.uniform1f(loc.uLevels, state.posterizeLevels);
        gl.uniform1f(loc.uPixelSize, state.pixelSize);
        gl.uniform1f(loc.uHalftone, state.halftoneScale);
        gl.uniform1f(loc.uVignette, state.vignetteStrength);
        gl.uniform1f(loc.uVignetteRadius, state.vignetteRadius);
        gl.uniform1f(loc.uChromatic, state.chromaticAmount);
        gl.uniform2f(loc.uResolution, canvas.width, canvas.height);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.uniform1i(loc.uTexture, 0);

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    return { init, attach, refreshMedia };
})();
