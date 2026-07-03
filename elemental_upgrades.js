// ============================================================
// ELEMENTAL UPGRADES MOD for N-Gon
// ============================================================
// Drop in js/ and add <script src="js/elemental_upgrades.js"></script>
// to index.html AFTER all other game scripts.
//
// How it works:
//   - When no element is chosen, ALL 4 elements show as the entire
//     draft (4 cards, one per element). This is done by temporarily
//     setting tech.extraChoices = 1 and making only the 4 element
//     techs available (frequency > 0) during that draft.
//   - Once an element is chosen, the other 3 lock (frequency = 0,
//     allowed returns false), and the element path techs unlock.
//   - The 4-slot only happens for the FIRST tech pick; after that,
//     normal 3-slot drafts resume with path techs in the pool.
// ============================================================

(function () {
  "use strict";

  // Wait until the game has initialised its globals
  function waitForGame(cb) {
    if (
      typeof tech !== "undefined" && Array.isArray(tech.tech) &&
      typeof powerUps !== "undefined" && typeof powerUps.tech !== "undefined" &&
      typeof m !== "undefined"
    ) {
      cb();
    } else {
      setTimeout(function () { waitForGame(cb); }, 100);
    }
  }

  waitForGame(init);

  function init() {

    // ── helpers ──────────────────────────────────────────────
    var ELEMENT_NAMES = ["earth", "water", "fire", "air"];

    function getTech(name) {
      for (var i = 0; i < tech.tech.length; i++) {
        if (tech.tech[i].name === name) return tech.tech[i];
      }
      return null;
    }

    function hasElement(name) {
      var t = getTech(name);
      return t !== null && t.count > 0;
    }

    function anyElementChosen() {
      for (var i = 0; i < ELEMENT_NAMES.length; i++) {
        if (hasElement(ELEMENT_NAMES[i])) return true;
      }
      return false;
    }

    // ── SVG icons ─────────────────────────────────────────────
    var icons = {
      earth: "<svg width='75' height='75' viewBox='0 0 75 75' xmlns='http://www.w3.org/2000/svg'><polygon points='37,8 67,62 7,62' fill='none' stroke='#6b4' stroke-width='3'/><polygon points='37,22 55,55 19,55' fill='#6b4' opacity='0.35'/></svg>",
      water: "<svg width='75' height='75' viewBox='0 0 75 75' xmlns='http://www.w3.org/2000/svg'><path d='M37 10 Q55 38 37 62 Q19 38 37 10Z' fill='none' stroke='#4af' stroke-width='3'/><path d='M37 24 Q48 42 37 57 Q26 42 37 24Z' fill='#4af' opacity='0.35'/></svg>",
      fire:  "<svg width='75' height='75' viewBox='0 0 75 75' xmlns='http://www.w3.org/2000/svg'><path d='M37 10 C50 28 62 36 52 55 C44 68 30 68 23 55 C13 36 24 28 37 10Z' fill='none' stroke='#f64' stroke-width='3'/><path d='M37 26 C44 36 50 42 44 52 C40 59 34 59 30 52 C24 42 30 36 37 26Z' fill='#f64' opacity='0.35'/></svg>",
      air:   "<svg width='75' height='75' viewBox='0 0 75 75' xmlns='http://www.w3.org/2000/svg'><circle cx='37' cy='37' r='26' fill='none' stroke='#adf' stroke-width='3'/><path d='M20 37 Q37 20 54 37 Q37 54 20 37Z' fill='#adf' opacity='0.35'/></svg>",
    };

    // ── helper to register techs (avoids name collision with game's addTech) ──
    function registerTech(obj) {
      tech.tech.push(Object.assign({
        count: 0, maxCount: 1,
        frequency: 0, frequencyDefault: 0, // hidden by default
        isRecentlyShown: false,
        isBanished: false, isLost: false,
        allowed: function () { return true; },
        requires: "",
        effect: function () {}, remove: function () {},
      }, obj));
    }

    // ── helper to set frequency on a list of tech names ──────
    function setFrequency(names, freq) {
      for (var i = 0; i < names.length; i++) {
        var t = getTech(names[i]);
        if (t) {
          t.frequency = freq;
          t.frequencyDefault = freq;
        }
      }
    }

    // ── path unlock helper, called from gate effect() ─────────
    function updatePaths() {
      setFrequency(_EARTH_PATH, hasElement("earth") ? 1 : 0);
      setFrequency(_WATER_PATH, hasElement("water") ? 1 : 0);
      setFrequency(_FIRE_PATH,  hasElement("fire")  ? 1 : 0);
      setFrequency(_AIR_PATH,   hasElement("air")   ? 1 : 0);
    }

    // ── GATE TECHS — start hidden (freq=0), shown via the intercept ──

    registerTech({
      name: "earth",
      description: icons.earth + "<strong class='color-h'>Earth</strong><br>Attune to the element of <strong>earth</strong>. Grants <strong>+5 max health</strong> and unlocks the <em>earth weapon path</em>.<br><em style='color:#888'>Incompatible with other elements.</em>",
      isSkin: true,
      frequency: 0, frequencyDefault: 0,
      allowed: function () { return !anyElementChosen(); },
      effect: function () {
        m.maxHealth += 5;
        m.health = Math.min(m.health + 5, m.maxHealth);
        updatePaths();
      },
      remove: function () {
        m.maxHealth -= 5;
        m.health = Math.min(m.health, m.maxHealth);
      },
    });

    registerTech({
      name: "water",
      description: icons.water + "<strong class='color-h'>Water</strong><br>Attune to the element of <strong>water</strong>. Grants <strong>+5 max energy</strong> and unlocks the <em>water weapon path</em>.<br><em style='color:#888'>Incompatible with other elements.</em>",
      isSkin: true,
      frequency: 0, frequencyDefault: 0,
      allowed: function () { return !anyElementChosen(); },
      effect: function () {
        m.maxEnergy += 5;
        m.energy = Math.min(m.energy + 5, m.maxEnergy);
        updatePaths();
      },
      remove: function () {
        m.maxEnergy -= 5;
        m.energy = Math.min(m.energy, m.maxEnergy);
      },
    });

    registerTech({
      name: "fire",
      description: icons.fire + "<strong class='color-h'>Fire</strong><br>Attune to the element of <strong>fire</strong>. Grants <strong>+10% damage</strong> and unlocks the <em>fire weapon path</em>.<br><em style='color:#888'>Incompatible with other elements.</em>",
      isSkin: true,
      frequency: 0, frequencyDefault: 0,
      allowed: function () { return !anyElementChosen(); },
      effect: function () {
        m.damageDone *= 1.10;
        updatePaths();
      },
      remove: function () { m.damageDone /= 1.10; },
    });

    registerTech({
      name: "air",
      description: icons.air + "<strong class='color-h'>Air</strong><br>Attune to the element of <strong>air</strong>. Grants <strong>+1 air jump</strong> and unlocks the <em>air weapon path</em>.<br><em style='color:#888'>Incompatible with other elements.</em>",
      isSkin: true,
      frequency: 0, frequencyDefault: 0,
      allowed: function () { return !anyElementChosen(); },
      effect: function () {
        m.coyoteCycles = (m.coyoteCycles || 0) + 30;
        updatePaths();
      },
      remove: function () { m.coyoteCycles = Math.max(0, (m.coyoteCycles || 30) - 30); },
    });

    // ── EARTH PATH ───────────────────────────────────────────
    registerTech({
      name: "stone skin",
      description: icons.earth + "<strong class='color-h'>Stone Skin</strong> <em>[Earth I]</em><br>The earth hardens around you. <strong>+10 max health</strong> and <strong>−15% knockback received</strong>.",
      allowed: function () { return hasElement("earth") && !getTech("stone skin").count; },
      effect: function () {
        m.maxHealth += 10;
        m.health = Math.min(m.health + 10, m.maxHealth);
        if (typeof m.knockback !== "undefined") m.knockback *= 0.85;
      },
      remove: function () {
        m.maxHealth -= 10;
        m.health = Math.min(m.health, m.maxHealth);
        if (typeof m.knockback !== "undefined") m.knockback /= 0.85;
      },
    });
    registerTech({
      name: "seismic pulse",
      description: icons.earth + "<strong class='color-h'>Seismic Pulse</strong> <em>[Earth II]</em><br>Channel tectonic force. Grants <strong>grenades</strong> and <strong>+20% damage</strong>.",
      allowed: function () { var s = getTech("stone skin"); return s && s.count > 0 && !getTech("seismic pulse").count; },
      effect: function () { b.giveGuns("grenades"); m.damageDone *= 1.20; },
      remove: function () { m.damageDone /= 1.20; },
    });
    registerTech({
      name: "iron core",
      description: icons.earth + "<strong class='color-h'>Iron Core</strong> <em>[Earth III]</em><br>You become one with bedrock. <strong>+25 max health</strong> and projectiles have <strong>+40% more mass</strong>.",
      allowed: function () { var s = getTech("seismic pulse"); return s && s.count > 0 && !getTech("iron core").count; },
      effect: function () {
        m.maxHealth += 25;
        m.health = Math.min(m.health + 25, m.maxHealth);
        if (typeof m.bulletMass !== "undefined") m.bulletMass *= 1.4;
      },
      remove: function () {
        m.maxHealth -= 25;
        m.health = Math.min(m.health, m.maxHealth);
        if (typeof m.bulletMass !== "undefined") m.bulletMass /= 1.4;
      },
    });

    // ── WATER PATH ───────────────────────────────────────────
    registerTech({
      name: "fluid motion",
      description: icons.water + "<strong class='color-h'>Fluid Motion</strong> <em>[Water I]</em><br>Flow like water. <strong>+10 max energy</strong> and <strong>energy regen +20%</strong>.",
      allowed: function () { return hasElement("water") && !getTech("fluid motion").count; },
      effect: function () {
        m.maxEnergy += 10;
        if (typeof m.energyRegen !== "undefined") m.energyRegen *= 1.20;
      },
      remove: function () {
        m.maxEnergy -= 10;
        if (typeof m.energyRegen !== "undefined") m.energyRegen /= 1.20;
      },
    });
    registerTech({
      name: "tidal force",
      description: icons.water + "<strong class='color-h'>Tidal Force</strong> <em>[Water II]</em><br>Harness the pull of the tides. Grants the <strong>harpoon</strong> and <strong>+25% damage</strong>.",
      allowed: function () { var s = getTech("fluid motion"); return s && s.count > 0 && !getTech("tidal force").count; },
      effect: function () { b.giveGuns("harpoon"); m.damageDone *= 1.25; },
      remove: function () { m.damageDone /= 1.25; },
    });
    registerTech({
      name: "abyssal form",
      description: icons.water + "<strong class='color-h'>Abyssal Form</strong> <em>[Water III]</em><br>Descend into the deep. <strong>+20 max energy</strong> and <strong>weapon energy drain −40%</strong>.",
      allowed: function () { var s = getTech("tidal force"); return s && s.count > 0 && !getTech("abyssal form").count; },
      effect: function () {
        m.maxEnergy += 20;
        if (typeof m.energyDrain !== "undefined") m.energyDrain *= 0.60;
      },
      remove: function () {
        m.maxEnergy -= 20;
        if (typeof m.energyDrain !== "undefined") m.energyDrain /= 0.60;
      },
    });

    // ── FIRE PATH ────────────────────────────────────────────
    registerTech({
      name: "kindling",
      description: icons.fire + "<strong class='color-h'>Kindling</strong> <em>[Fire I]</em><br>Ignite your shots. <strong>+15% damage</strong> but <strong>ammo use +10%</strong>.",
      allowed: function () { return hasElement("fire") && !getTech("kindling").count; },
      effect: function () {
        m.damageDone *= 1.15;
        if (typeof m.ammoUsage !== "undefined") m.ammoUsage *= 1.10;
      },
      remove: function () {
        m.damageDone /= 1.15;
        if (typeof m.ammoUsage !== "undefined") m.ammoUsage /= 1.10;
      },
    });
    registerTech({
      name: "inferno",
      description: icons.fire + "<strong class='color-h'>Inferno</strong> <em>[Fire II]</em><br>Unleash a firestorm. Grants <strong>missiles</strong> and <strong>+20% damage</strong>.",
      allowed: function () { var s = getTech("kindling"); return s && s.count > 0 && !getTech("inferno").count; },
      effect: function () { b.giveGuns("missiles"); m.damageDone *= 1.20; },
      remove: function () { m.damageDone /= 1.20; },
    });
    registerTech({
      name: "solar core",
      description: icons.fire + "<strong class='color-h'>Solar Core</strong> <em>[Fire III]</em><br>Burn like a star. <strong>+30% damage</strong>, <strong>fire rate ×1.3</strong>, but <strong>ammo use ×1.5</strong>.",
      allowed: function () { var s = getTech("inferno"); return s && s.count > 0 && !getTech("solar core").count; },
      effect: function () {
        m.damageDone *= 1.30;
        if (typeof m.fireRate !== "undefined") m.fireRate *= 1.30;
        if (typeof m.ammoUsage !== "undefined") m.ammoUsage *= 1.50;
      },
      remove: function () {
        m.damageDone /= 1.30;
        if (typeof m.fireRate !== "undefined") m.fireRate /= 1.30;
        if (typeof m.ammoUsage !== "undefined") m.ammoUsage /= 1.50;
      },
    });

    // ── AIR PATH ─────────────────────────────────────────────
    registerTech({
      name: "updraft",
      description: icons.air + "<strong class='color-h'>Updraft</strong> <em>[Air I]</em><br>Ride the wind. <strong>Jump height ×1.2</strong> and <strong>move speed +10%</strong>.",
      allowed: function () { return hasElement("air") && !getTech("updraft").count; },
      effect: function () {
        if (typeof m.jumpHeight !== "undefined") m.jumpHeight *= 1.20; else m.jumpHeight = 1.20;
        if (typeof m.speed !== "undefined") m.speed *= 1.10; else m.speed = 1.10;
      },
      remove: function () {
        if (typeof m.jumpHeight !== "undefined") m.jumpHeight /= 1.20;
        if (typeof m.speed !== "undefined") m.speed /= 1.10;
      },
    });
    registerTech({
      name: "cyclone",
      description: icons.air + "<strong class='color-h'>Cyclone</strong> <em>[Air II]</em><br>Summon a vortex of force. Grants the <strong>wave</strong> gun and <strong>bullet speed +25%</strong>.",
      allowed: function () { var s = getTech("updraft"); return s && s.count > 0 && !getTech("cyclone").count; },
      effect: function () {
        b.giveGuns("wave");
        if (typeof m.bulletSpeed !== "undefined") m.bulletSpeed *= 1.25;
      },
      remove: function () {
        if (typeof m.bulletSpeed !== "undefined") m.bulletSpeed /= 1.25;
      },
    });
    registerTech({
      name: "eye of the storm",
      description: icons.air + "<strong class='color-h'>Eye of the Storm</strong> <em>[Air III]</em><br>Transcend the tempest. <strong>+2 air jumps</strong>, <strong>move speed +20%</strong>, and <strong>bullet spread −30%</strong>.",
      allowed: function () { var s = getTech("cyclone"); return s && s.count > 0 && !getTech("eye of the storm").count; },
      effect: function () {
        m.coyoteCycles = (m.coyoteCycles || 0) + 60;
        if (typeof m.speed !== "undefined") m.speed *= 1.20; else m.speed = 1.20;
        if (typeof m.bulletSpread !== "undefined") m.bulletSpread *= 0.70;
      },
      remove: function () {
        m.coyoteCycles = Math.max(0, (m.coyoteCycles || 60) - 60);
        if (typeof m.speed !== "undefined") m.speed /= 1.20;
        if (typeof m.bulletSpread !== "undefined") m.bulletSpread /= 0.70;
      },
    });

    // ── path name lists (for setFrequency calls) ─────────────
    var _EARTH_PATH = ["stone skin", "seismic pulse", "iron core"];
    var _WATER_PATH = ["fluid motion", "tidal force", "abyssal form"];
    var _FIRE_PATH  = ["kindling", "inferno", "solar core"];
    var _AIR_PATH   = ["updraft", "cyclone", "eye of the storm"];

    // ── Intercept powerUps.tech.effect ───────────────────────
    //
    // When no element is chosen yet:
    //   1. Temporarily enable all 4 gate techs (freq = 1)
    //   2. Set tech.extraChoices = 1  →  4 slots show
    //   3. Temporarily hide ALL other non-elemental tech (freq = 0)
    //   4. Call the original effect() — it now picks exactly the 4 gates
    //   5. Restore everything after a microtask (the draft is displayed by then)
    //
    // When an element is already chosen: original behaviour, no changes.

    var _origEffect = powerUps.tech.effect.bind(powerUps.tech);

    powerUps.tech.effect = function () {
      if (!anyElementChosen()) {
        // --- snapshot frequencies of all NON-elemental techs ---
        var snapshots = []; // { index, frequency, frequencyDefault }
        for (var i = 0; i < tech.tech.length; i++) {
          var t = tech.tech[i];
          var isElem = ELEMENT_NAMES.indexOf(t.name) !== -1;
          if (!isElem) {
            snapshots.push({ i: i, f: t.frequency, fd: t.frequencyDefault });
            t.frequency = 0; // hide all non-elemental
            t.frequencyDefault = 0;
          }
        }

        // --- enable the 4 gate techs ---
        setFrequency(ELEMENT_NAMES, 1);

        // --- add 1 extra choice slot so we get 4 cards ---
        var prevExtra = tech.extraChoices || 0;
        tech.extraChoices = prevExtra + 1;

        // --- call the original draft builder ---
        _origEffect();

        // --- restore after the draft HTML is built (next microtask) ---
        setTimeout(function () {
          tech.extraChoices = prevExtra;
          // restore non-elemental frequencies
          for (var j = 0; j < snapshots.length; j++) {
            tech.tech[snapshots[j].i].frequency = snapshots[j].f;
            tech.tech[snapshots[j].i].frequencyDefault = snapshots[j].fd;
          }
          // hide gate techs again (they'll only be shown via this intercept)
          setFrequency(ELEMENT_NAMES, 0);
        }, 0);

      } else {
        _origEffect();
      }
    };

    console.log("[elemental_upgrades] Loaded — 4-slot elemental gate + 12 path techs.");
  }

})();
