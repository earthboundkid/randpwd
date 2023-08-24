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

function rando() {
  const lower = "abcdefghijklmnopqrstuvwxyz";
  const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const digits = "1234567890";

  return {
    requirements: [
      lower,
      upper,
      digits,
    ],

    alphabet: lower + upper + digits,

    length: 10,

    passwords: this.$persist([]),
    error: "",

    init() {
      if (!this.passwords.length) this.genPass();
    },

    genPass() {
      let password = "";

      const maxTime = 100; // 100ms
      let start = window.performance.now();

      while (!this.meetsRequirements(password)) {
        if (window.performance.now() - start > maxTime) {
          this.error = "Could not find a password meeting requirements";
          return;
        }

        let chars = [];
        for (let i = 0; i < this.length; i++) {
          let choiceIdx = secureRand(0, this.alphabet.length);
          chars.push(this.alphabet[choiceIdx]);
        }
        password = chars.join('');
      }

      this.passwords.unshift(password);
    },

    meetsRequirements(pwd) {
      return this.requirements.every(req => this.containsAny(pwd, req))
    },

    containsAny(str, chars) {
      return Array.from(str).some(c => chars.includes(c));
    },

    async copy(pwd) {
      await window.navigator.clipboard.writeText(pwd).catch(e => {
        this.error = e.message;
      });
    }
  }
}

function copier() {
  return {
    copied: false,

    init() {
      this.$watch("copied", val => {
        if (!val) return;
        window.setTimeout(() => {
          this.copied = false;
        }, 5000)
      })
    }
  }
}

document.addEventListener('alpine:init', () => {
  Alpine.data('rando', rando);
  Alpine.data('copier', copier);
});
