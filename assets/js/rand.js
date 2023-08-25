const effLongList = document
  .querySelector("#eff-long")
  .textContent.split("\n")
  .filter(Boolean);

const effShortList = document
  .querySelector("#eff-short")
  .textContent.split("\n")
  .filter(Boolean);

const effPrefixList = document
  .querySelector("#eff-prefix")
  .textContent.split("\n")
  .filter(Boolean);

const voaList = document
  .querySelector("#voa")
  .textContent.split("\n")
  .filter(Boolean);

function secureRand(min, max) {
  let range = max - min;
  if (range < 2) {
    return min;
  }

  let bits_needed = Math.ceil(Math.log2(range));
  if (bits_needed > 31) {
    throw new Error("cannot generate numbers larger than 31 bits.");
  }

  let mask = (1 << bits_needed) - 1;

  let start = window.performance.now();
  const maxTime = 100; // 100ms

  // Create byte array
  let byteArray = new Uint32Array(1);
  while (true) {
    // fill it with random numbers
    window.crypto.getRandomValues(byteArray);

    let rval = bigEndian(byteArray);

    // Use & to apply the mask and reduce the number of lookups
    rval = rval & mask;

    if (rval < range) {
      // Return an integer that falls within the range
      return min + rval;
    }
    // Integer out of acceptable range
    if (window.performance.now() - start > maxTime) {
      throw new Error("took too long generating random number");
    }
  }
}

function bigEndian(byteArray) {
  return new DataView(byteArray.buffer).getUint32();
}

function choose(a) {
  return a[secureRand(0, a.length)];
}

function rando() {
  const lower = "abcdefghijklmnopqrstuvwxyz";
  const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const digits = "1234567890";

  return {
    reqUpper: this.$persist(true),
    reqLower: this.$persist(true),
    reqDigits: this.$persist(true),
    reqSymbols: this.$persist(""),

    wordCount: this.$persist(4),
    wordList: this.$persist("long"),

    get requirements() {
      let reqs = [];
      if (this.reqUpper) {
        reqs.push(upper);
      }
      if (this.reqLower) {
        reqs.push(lower);
      }
      if (this.reqDigits) {
        reqs.push(digits);
      }
      if (this.reqSymbols) {
        reqs.push(this.reqSymbols);
      }
      return reqs;
    },

    get alphabet() {
      return Array.from(new Set(this.requirements.join(""))).join("");
    },

    pwLength: this.$persist(10),

    passwords: this.$persist([]),
    error: "",

    init() {
      if (!this.passwords.length) this.genPass();
    },

    genSimple() {
      let password = "";
      if (!this.alphabet.length) {
        this.error = "No password requirements set.";
        return;
      }

      this.error = "";
      const maxTime = 100; // 100ms
      let start = window.performance.now();

      while (!this.meetsRequirements(password)) {
        if (window.performance.now() - start > maxTime) {
          this.error = "Could not find a password meeting requirements";
          return;
        }

        let chars = [];
        for (let i = 0; i < this.pwLength; i++) {
          chars.push(choose(this.alphabet));
        }
        password = chars.join("");
      }

      this.passwords.unshift(password);
      this.$refs.passwords.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    },

    meetsRequirements(pwd) {
      return this.requirements.every((req) => this.containsAny(pwd, req));
    },

    get simpleEntropy() {
      if (!this.alphabet.length) {
        return 0;
      }
      return Math.floor(Math.log2(this.alphabet.length) * this.pwLength);
    },

    containsAny(str, chars) {
      return Array.from(str).some((c) => chars.includes(c));
    },

    async copy(pwd) {
      await window.navigator.clipboard.writeText(pwd).catch((e) => {
        this.error = e.message;
      });
    },

    get dict() {
      return {
        long: effLongList,
        short: effShortList,
        prefix: effPrefixList,
        voa: voaList,
      }[this.wordList];
    },

    genWord() {
      let words = [];
      for (let i = 0; i < this.wordCount; i++) {
        words.push(choose(this.dict));
      }
      this.passwords.unshift(words.join("-"));
      this.$refs.passwords.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    },

    get wordEntropy() {
      return Math.floor(Math.log2(this.dict.length) * this.wordCount);
    },
  };
}

function copier() {
  return {
    copied: false,

    init() {
      this.$watch("copied", (val) => {
        if (!val) return;
        window.setTimeout(() => {
          this.copied = false;
        }, 5000);
      });
    },
  };
}

document.addEventListener("alpine:init", () => {
  Alpine.data("rando", rando);
  Alpine.data("copier", copier);
});
