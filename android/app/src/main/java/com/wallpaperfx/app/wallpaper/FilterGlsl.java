package com.wallpaperfx.app.wallpaper;

// shared gl es 2.0 fragment source (everything after the precision + sampler
// declaration, which the 2d and oes prefixes supply). this exact filter logic is
// mirrored in www/preview.js so the ui preview matches the wallpaper. when you
// change a filter here, change it there too.
//
// filter index mapping (see SceneRenderer.filterIndex):
//   0 none      1 duotone    2 scanlines  3 grayscale  4 sepia
//   5 gradientmap 6 posterize 7 pixelate  8 halftone   9 vignette
//   10 chromatic 11 crt       12 invert
final class FilterGlsl {

    private FilterGlsl() {}

    static final String SOURCE =
            "varying vec2 vTexCoord;\n" +
            "varying vec2 vScreenCoord;\n" +
            "uniform int uFilter;\n" +
            "uniform vec3 uColorA;\n" +      // duotone/gradient dark, halftone ink
            "uniform vec3 uColorB;\n" +      // duotone/gradient light, halftone paper
            "uniform vec3 uColorC;\n" +      // gradientmap midtone
            "uniform float uScanCount;\n" +
            "uniform float uScanStrength;\n" +
            "uniform float uCrtMask;\n" +
            "uniform float uAmount;\n" +     // grayscale/sepia blend
            "uniform float uLevels;\n" +     // posterize
            "uniform float uPixelSize;\n" +
            "uniform float uHalftone;\n" +
            "uniform float uVignette;\n" +
            "uniform float uVignetteRadius;\n" +
            "uniform float uChromatic;\n" +
            "uniform vec2 uResolution;\n" +
            "uniform float uAlpha;\n" +
            "float luma(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }\n" +
            "void main() {\n" +
            "  vec2 uv = vTexCoord;\n" +
            "  if (uFilter == 7) {\n" + // pixelate: snap to a grid before sampling
            "    vec2 grid = uResolution / max(1.0, uPixelSize);\n" +
            "    uv = (floor(uv * grid) + 0.5) / grid;\n" +
            "  }\n" +
            "  vec4 c = texture2D(uTexture, uv);\n" +
            "  if (uFilter == 1) {\n" + // duotone
            "    c.rgb = mix(uColorA, uColorB, luma(c.rgb));\n" +
            "  } else if (uFilter == 3) {\n" + // grayscale
            "    c.rgb = mix(c.rgb, vec3(luma(c.rgb)), uAmount);\n" +
            "  } else if (uFilter == 4) {\n" + // sepia
            "    float l = luma(c.rgb);\n" +
            "    vec3 sep = clamp(vec3(l) * vec3(1.07, 0.74, 0.43), 0.0, 1.0);\n" +
            "    c.rgb = mix(c.rgb, sep, uAmount);\n" +
            "  } else if (uFilter == 5) {\n" + // gradient map (dark -> mid -> light)
            "    float l = luma(c.rgb);\n" +
            "    vec3 low = mix(uColorA, uColorC, smoothstep(0.0, 0.5, l));\n" +
            "    c.rgb = mix(low, uColorB, smoothstep(0.5, 1.0, l));\n" +
            "  } else if (uFilter == 6) {\n" + // posterize
            "    float n = max(2.0, uLevels);\n" +
            "    c.rgb = floor(c.rgb * n) / (n - 1.0);\n" +
            "  } else if (uFilter == 12) {\n" + // invert
            "    c.rgb = 1.0 - c.rgb;\n" +
            "  } else if (uFilter == 8) {\n" + // halftone
            "    float aspect = uResolution.x / max(1.0, uResolution.y);\n" +
            "    vec2 cell = vScreenCoord * vec2(uHalftone * aspect, uHalftone);\n" +
            "    vec2 center = floor(cell) + 0.5;\n" +
            "    float d = length(cell - center) * 2.0;\n" +
            "    float radius = sqrt(max(0.0, 1.0 - luma(c.rgb)));\n" +
            "    float cov = 1.0 - smoothstep(radius - 0.1, radius + 0.1, d);\n" +
            "    c.rgb = mix(uColorB, uColorA, cov);\n" +
            "  } else if (uFilter == 2) {\n" + // scanlines
            "    float s = 0.5 + 0.5 * cos(vScreenCoord.y * uScanCount * 6.2831853);\n" +
            "    c.rgb *= (1.0 - uScanStrength * s);\n" +
            "  } else if (uFilter == 11) {\n" + // crt: scanlines + aperture mask + vignette
            "    float s = 0.5 + 0.5 * cos(vScreenCoord.y * uScanCount * 6.2831853);\n" +
            "    c.rgb *= (1.0 - uScanStrength * s);\n" +
            "    float m = mod(floor(vScreenCoord.x * uResolution.x), 3.0);\n" +
            "    vec3 mask = vec3(1.0 - uCrtMask);\n" +
            "    if (m < 1.0) mask.r = 1.0; else if (m < 2.0) mask.g = 1.0; else mask.b = 1.0;\n" +
            "    c.rgb *= mask;\n" +
            "    float dv = length(vScreenCoord - 0.5) * 1.4142136;\n" +
            "    c.rgb *= 1.0 - 0.4 * smoothstep(0.6, 1.0, dv);\n" +
            "  } else if (uFilter == 9) {\n" + // vignette
            "    float dv = length(vScreenCoord - 0.5) * 1.4142136;\n" +
            "    c.rgb *= 1.0 - uVignette * smoothstep(uVignetteRadius, 1.0, dv);\n" +
            "  } else if (uFilter == 10) {\n" + // chromatic aberration
            "    vec2 off = (vScreenCoord - 0.5) * uChromatic;\n" +
            "    c.r = texture2D(uTexture, uv + off).r;\n" +
            "    c.b = texture2D(uTexture, uv - off).b;\n" +
            "  }\n" +
            "  c.a *= uAlpha;\n" +
            "  gl_FragColor = c;\n" +
            "}\n";
}
