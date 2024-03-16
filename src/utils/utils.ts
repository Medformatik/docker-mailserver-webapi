export const utils = {
  isEmpty: (obj: any): boolean =>
    [Object, Array].includes((obj || {}).constructor) &&
    !Object.entries(obj || {}).length,

  // This function from https://github.com/validatorjs/validator.js/blob/master/src/lib/isFQDN.js
  isFQDN: (
    str: string,
    options: {
      require_tld?: boolean;
      allow_underscores?: boolean;
      allow_trailing_dot?: boolean;
      allow_numeric_tld?: boolean;
      allow_wildcard?: boolean;
      ignore_max_length?: boolean;
    } = {}
  ) => {
    /* Remove the optional trailing dot before checking validity */
    if (options.allow_trailing_dot && str[str.length - 1] === ".") {
      str = str.substring(0, str.length - 1);
    }

    /* Remove the optional wildcard before checking validity */
    if (options.allow_wildcard === true && str.indexOf("*.") === 0) {
      str = str.substring(2);
    }

    const parts = str.split(".");
    const tld = parts[parts.length - 1];

    if (options.require_tld) {
      // disallow fqdns without tld
      if (parts.length < 2) {
        return false;
      }

      if (
        !options.allow_numeric_tld &&
        !/^([a-z\u00A1-\u00A8\u00AA-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]{2,}|xn[a-z0-9-]{2,})$/i.test(
          tld
        )
      ) {
        return false;
      }

      // disallow spaces
      if (/\s/.test(tld)) {
        return false;
      }
    }

    // reject numeric TLDs
    if (!options.allow_numeric_tld && /^\d+$/.test(tld)) {
      return false;
    }

    return parts.every((part) => {
      if (part.length > 63 && !options.ignore_max_length) {
        return false;
      }

      if (!/^[a-z_\u00a1-\uffff0-9-]+$/i.test(part)) {
        return false;
      }

      // disallow full-width chars
      if (/[\uff01-\uff5e]/.test(part)) {
        return false;
      }

      // disallow parts starting or ending with hyphen
      if (/^-|-$/.test(part)) {
        return false;
      }

      if (!options.allow_underscores && /_/.test(part)) {
        return false;
      }

      return true;
    });
  },

  isWithLineBreak: (str: string): boolean => {
    return str && str.match(new RegExp(/\r?\n$/))?.length > 0;
  },

  // This function is similar to the 'numfmt' command
  // with the option '--from=iec'
  // (ex: numfmt --from=iec 100M)
  iecToNum(input: string): number {
    const mapping: { [key: string]: number } = {
      K: 1024,
      M: 1024 ** 2,
      G: 1024 ** 3,
      T: 1024 ** 4,
      P: 1024 ** 5,
      E: 1024 ** 6,
      Z: 1024 ** 7,
      Y: 1024 ** 8,
      R: 1024 ** 9,
      Q: 1024 ** 10,
    };

    const regex = /([0-9\.]+)([KMGTPEZYRQ]?)([i]?)/i;
    const match = input.match(regex);
    if (!match) {
      return 0;
    }

    const value = parseFloat(match[1]);
    const factor = mapping[match[2].toUpperCase()] || 1;
    return value * factor;
  },

  textEncode(text: string): Uint8Array {
    return new TextEncoder().encode(text);
  },

  textDecode(buffer: Uint8Array): string {
    return new TextDecoder("utf-8").decode(buffer);
  },

  arrayDifference<A, B extends A>(array1: A[], array2: B[]): A[] {
    return array2.filter((x) => !array1.includes(x));
  },

  arrayMerge<A, B extends A>(array1: A[], array2: B[]): A[] {
    return [...new Set([...array1, ...array2])];
  },

  // This function from https://github.com/pbojinov/request-ip/blob/master/src/index.js
  getClientIp: (request: Request, handler: Deno.ServeHandlerInfo): string => {
    // Standard headers used by Amazon EC2, Heroku, and others.
    if (request.headers.has("x-client-ip")) {
      return request.headers.get("x-client-ip");
    }

    // Cloudflare.
    // @see https://support.cloudflare.com/hc/en-us/articles/200170986-How-does-Cloudflare-handle-HTTP-Request-headers-
    // CF-Connecting-IP - applied to every request to the origin.
    if (request.headers.has("cf-connecting-ip")) {
      return request.headers.get("cf-connecting-ip");
    }

    // DigitalOcean.
    // @see https://www.digitalocean.com/community/questions/app-platform-client-ip
    // DO-Connecting-IP - applied to app platform servers behind a proxy.
    if (request.headers.has("do-connecting-ip")) {
      return request.headers.get("do-connecting-ip");
    }

    // Fastly and Firebase hosting header (When forwared to cloud function)
    if (request.headers.has("fastly-client-ip")) {
      return request.headers.get("fastly-client-ip");
    }

    // Akamai and Cloudflare: True-Client-IP.
    if (request.headers.has("true-client-ip")) {
      return request.headers.get("true-client-ip");
    }

    // Default nginx proxy/fcgi; alternative to x-forwarded-for, used by some proxies.
    if (request.headers.has("x-real-ip")) {
      return request.headers.get("x-real-ip");
    }

    if (request.headers.has("x-forwarded")) {
      return request.headers.get("x-forwarded");
    }

    if (request.headers.has("forwarded-for")) {
      return request.headers.get("forwarded-for");
    }

    // Remote address checks.
    return handler.remoteAddr.hostname;
  },
};
