// ============================================================
// ELEMENTAL UPGRADES MOD for N-Gon
// ============================================================
// Adds 4 elemental "skin"-style upgrades: Earth, Water, Fire, Air.
//
// SPECIAL BEHAVIOUR:
//   When no element has been chosen yet, the tech pick screen is
//   intercepted: instead of a 3-slot random draft, the player sees
//   all 4 elements at once and must choose one.  After an element is
//   chosen the screen returns to normal 3-slot behaviour, and the
//   other elements are permanently locked for that run.
//
// INSTALLATION:
//   1. Copy this file into your fork's js/ folder.
//   2. In index.html, add AFTER all other <script> tags (before </body>):
//        <script src="js/elemental_upgrades.js"></script>
// ============================================================

(function () {
  "use strict";

  // ── 0. Wait for game objects ──────────────────────────────
  function waitForGame(cb) {
    if (typeof tech !== "undefined" && tech.tech && typeof powerUps !== "undefined") {
      cb();
    } else {
      setTimeout(function() { waitForGame(cb); }, 200);
    }
  }
  waitForGame(init);

  // ── 1. Helpers ────────────────────────────────────────────
  function hasElement(name) {
    var t = tech.tech.find(function(x) { return x.name === name; });
    return t ? t.count > 0 : false;
  }
  function anyElementChosen() {
    return ["earth","water","fire","air"].some(hasElement);
  }
  function addTech(options) {
    tech.tech.push(Object.assign({
      count: 0, maxCount: 1,
      frequency: 1, frequencyDefault: 1,
      allowed: function() { return true; },
      requires: "",
      effect: function() {}, remove: function() {},
    }, options));
  }

  // ── 2. SVG icons ──────────────────────────────────────────
  var icons = {
    earth: "<svg width='75' height='75' viewBox='0 0 75 75' xmlns='http://www.w3.org/2000/svg'><polygon points='37,8 67,62 7,62' fill='none' stroke='#6b4' stroke-width='3'/><polygon points='37,22 55,55 19,55' fill='#6b4' opacity='0.35'/></svg>",
    water: "<svg width='75' height='75' viewBox='0 0 75 75' xmlns='http://www.w3.org/2000/svg'><path d='M37 10 Q55 38 37 62 Q19 38 37 10Z' fill='none' stroke='#4af' stroke-width='3'/><path d='M37 24 Q48 42 37 57 Q26 42 37 24Z' fill='#4af' opacity='0.35'/></svg>",
    fire:  "<svg width='75' height='75' viewBox='0 0 75 75' xmlns='http://www.w3.org/2000/svg'><path d='M37 10 C50 28 62 36 52 55 C44 68 30 68 23 55 C13 36 24 28 37 10Z' fill='none' stroke='#f64' stroke-width='3'/><path d='M37 26 C44 36 50 42 44 52 C40 59 34 59 30 52 C24 42 30 36 37 26Z' fill='#f64' opacity='0.35'/></svg>",
    air:   "<svg width='75' height='75' viewBox='0 0 75 75' xmlns='http://www.w3.org/2000/svg'><circle cx='37' cy='37' r='26' fill='none' stroke='#adf' stroke-width='3'/><path d='M20 37 Q37 20 54 37 Q37 54 20 37Z' fill='#adf' opacity='0.35'/></svg>",
  };

  // ── 3. Main init ──────────────────────────────────────────
  function init() {

    // ─ 3a. Register gate techs (frequency=0 → never appear in normal pool) ─

    addTech({
      name: "earth",
      description: icons.earth + "<strong class='color-h'>Earth</strong><br>Attune to the element of <strong>earth</strong>. Grants <strong>+5 max health</strong> and unlocks the <em>earth weapon path</em>.<br><em style='color:#888'>Incompatible with other elements.</em>",
      frequency: 0, frequencyDefault: 0,
      allowed: function() { return !anyElementChosen(); },
      effect: function() {
        m.maxHealth += 5;
        m.health = Math.min(m.health + 5, m.maxHealth);
        _updatePaths();
      },
      remove: function() {
        m.maxHealth -= 5;
        m.health = Math.min(m.health, m.maxHealth);
      },
    });

    addTech({
      name: "water",
      description: icons.water + "<strong class='color-h'>Water</strong><br>Attune to the element of <strong>water</strong>. Grants <strong>+5 max energy</strong> and unlocks the <em>water weapon path</em>.<br><em style='color:#888'>Incompatible with other elements.</em>",
      frequency: 0, frequencyDefault: 0,
      allowed: function() { return !anyElementChosen(); },
      effect: function() {
        m.maxEnergy += 5;
        m.energy = Math.min(m.energy + 5, m.maxEnergy);
        _updatePaths();
      },
      remove: function() {
        m.maxEnergy -= 5;
        m.energy = Math.min(m.energy, m.maxEnergy);
      },
    });

    addTech({
      name: "fire",
      description: icons.fire + "<strong class='color-h'>Fire</strong><br>Attune to the element of <strong>fire</strong>. Grants <strong>+10% damage</strong> and unlocks the <em>fire weapon path</em>.<br><em style='color:#888'>Incompatible with other elements.</em>",
      frequency: 0, frequencyDefault: 0,
      allowed: function() { return !anyElementChosen(); },
      effect: function() {
        m.damageDone *= 1.10;
        _updatePaths();
      },
      remove: function() { m.damageDone /= 1.10; },
    });

    addTech({
      name: "air",
      description: icons.air + "<strong class='color-h'>Air</strong><br>Attune to the element of <strong>air</strong>. Grants <strong>+1 air jump</strong> and unlocks the <em>air weapon path</em>.<br><em style='color:#888'>Incompatible with other elements.</em>",
      frequency: 0, frequencyDefault: 0,
      allowed: function() { return !anyElementChosen(); },
      effect: function() {
        m.coyoteCycles += 30;
        _updatePaths();
      },
      remove: function() { m.coyoteCycles = Math.max(0, m.coyoteCycles - 30); },
    });

    // ─ 3b. Earth path ─────────────────────────────────────────
    addTech({
      name: "stone skin",
      description: icons.earth + "<strong class='color-h'>Stone Skin</strong> <em>[Earth I]</em><br>The earth hardens around you. <strong>+10 max health</strong> and <strong>−15% knockback received</strong>.",
      frequency: 0, frequencyDefault: 0,
      allowed: function() { return hasElement("earth") && !hasElement("stone skin"); },
      effect: function() {
        m.maxHealth += 10;
        m.health = Math.min(m.health + 10, m.maxHealth);
        m.knockback = (m.knockback != null ? m.knockback : 1) * 0.85;
      },
      remove: function() {
        m.maxHealth -= 10;
        m.health = Math.min(m.health, m.maxHealth);
        m.knockback = (m.knockback != null ? m.knockback : 0.85) / 0.85;
      },
    });
    addTech({
      name: "seismic pulse",
      description: icons.earth + "<strong class='color-h'>Seismic Pulse</strong> <em>[Earth II]</em><br>Channel tectonic force. Grants <strong>grenades</strong> and <strong>+20% damage</strong>.",
      frequency: 0, frequencyDefault: 0,
      allowed: function() { return hasElement("stone skin") && !hasElement("seismic pulse"); },
      effect: function() { b.giveGuns("grenades"); m.damageDone *= 1.20; },
      remove: function() { m.damageDone /= 1.20; },
    });
    addTech({
      name: "iron core",
      description: icons.earth + "<strong class='color-h'>Iron Core</strong> <em>[Earth III]</em><br>You become one with bedrock. <strong>+25 max health</strong> and projectiles have <strong>+40% more mass</strong>.",
      frequency: 0, frequencyDefault: 0,
      allowed: function() { return hasElement("seismic pulse") && !hasElement("iron core"); },
      effect: function() {
        m.maxHealth += 25;
        m.health = Math.min(m.health + 25, m.maxHealth);
        m.bulletMass = (m.bulletMass != null ? m.bulletMass : 1) * 1.4;
      },
      remove: function() {
        m.maxHealth -= 25;
        m.health = Math.min(m.health, m.maxHealth);
        m.bulletMass = (m.bulletMass != null ? m.bulletMass : 1.4) / 1.4;
      },
    });

    // ─ 3c. Water path ─────────────────────────────────────────
    addTech({
      name: "fluid motion",
      description: icons.water + "<strong class='color-h'>Fluid Motion</strong> <em>[Water I]</em><br>Flow like water. <strong>+10 max energy</strong> and <strong>energy regen +20%</strong>.",
      frequency: 0, frequencyDefault: 0,
      allowed: function() { return hasElement("water") && !hasElement("fluid motion"); },
      effect: function() {
        m.maxEnergy += 10;
        m.energyRegen = (m.energyRegen != null ? m.energyRegen : 1) * 1.20;
      },
      remove: function() {
        m.maxEnergy -= 10;
        m.energyRegen = (m.energyRegen != null ? m.energyRegen : 1.20) / 1.20;
      },
    });
    addTech({
      name: "tidal force",
      description: icons.water + "<strong class='color-h'>Tidal Force</strong> <em>[Water II]</em><br>Harness the pull of the tides. Grants the <strong>harpoon</strong> and <strong>+25% damage</strong>.",
      frequency: 0, frequencyDefault: 0,
      allowed: function() { return hasElement("fluid motion") && !hasElement("tidal force"); },
      effect: function() { b.giveGuns("harpoon"); m.damageDone *= 1.25; },
      remove: function() { m.damageDone /= 1.25; },
    });
    addTech({
      name: "abyssal form",
      description: icons.water + "<strong class='color-h'>Abyssal Form</strong> <em>[Water III]</em><br>Descend into the deep. <strong>+20 max energy</strong> and <strong>weapon energy drain −40%</strong>.",
      frequency: 0, frequencyDefault: 0,
      allowed: function() { return hasElement("tidal force") && !hasElement("abyssal form"); },
      effect: function() {
        m.maxEnergy += 20;
        m.energyDrain = (m.energyDrain != null ? m.energyDrain : 1) * 0.60;
      },
      remove: function() {
        m.maxEnergy -= 20;
        m.energyDrain = (m.energyDrain != null ? m.energyDrain : 0.60) / 0.60;
      },
    });

    // ─ 3d. Fire path ──────────────────────────────────────────
    addTech({
      name: "kindling",
      description: icons.fire + "<strong class='color-h'>Kindling</strong> <em>[Fire I]</em><br>Ignite your shots. <strong>+15% damage</strong> but <strong>ammo use +10%</strong>.",
      frequency: 0, frequencyDefault: 0,
      allowed: function() { return hasElement("fire") && !hasElement("kindling"); },
      effect: function() {
        m.damageDone *= 1.15;
        m.ammoUsage = (m.ammoUsage != null ? m.ammoUsage : 1) * 1.10;
      },
      remove: function() {
        m.damageDone /= 1.15;
        m.ammoUsage = (m.ammoUsage != null ? m.ammoUsage : 1.10) / 1.10;
      },
    });
    addTech({
      name: "inferno",
      description: icons.fire + "<strong class='color-h'>Inferno</strong> <em>[Fire II]</em><br>Unleash a firestorm. Grants <strong>missiles</strong> and <strong>+20% damage</strong>.",
      frequency: 0, frequencyDefault: 0,
      allowed: function() { return hasElement("kindling") && !hasElement("inferno"); },
      effect: function() { b.giveGuns("missiles"); m.damageDone *= 1.20; },
      remove: function() { m.damageDone /= 1.20; },
    });
    addTech({
      name: "solar core",
      description: icons.fire + "<strong class='color-h'>Solar Core</strong> <em>[Fire III]</em><br>Burn like a star. <strong>+30% damage</strong>, <strong>fire rate ×1.3</strong>, but <strong>ammo use ×1.5</strong>.",
      frequency: 0, frequencyDefault: 0,
      allowed: function() { return hasElement("inferno") && !hasElement("solar core"); },
      effect: function() {
        m.damageDone *= 1.30;
        m.fireRate = (m.fireRate != null ? m.fireRate : 1) * 1.30;
        m.ammoUsage = (m.ammoUsage != null ? m.ammoUsage : 1) * 1.50;
      },
      remove: function() {
        m.damageDone /= 1.30;
        m.fireRate = (m.fireRate != null ? m.fireRate : 1.30) / 1.30;
        m.ammoUsage = (m.ammoUsage != null ? m.ammoUsage : 1.50) / 1.50;
      },
    });

    // ─ 3e. Air path ───────────────────────────────────────────
    addTech({
      name: "updraft",
      description: icons.air + "<strong class='color-h'>Updraft</strong> <em>[Air I]</em><br>Ride the wind. <strong>Jump height ×1.2</strong> and <strong>move speed +10%</strong>.",
      frequency: 0, frequencyDefault: 0,
      allowed: function() { return hasElement("air") && !hasElement("updraft"); },
      effect: function() {
        m.jumpHeight = (m.jumpHeight != null ? m.jumpHeight : 1) * 1.20;
        m.speed = (m.speed != null ? m.speed : 1) * 1.10;
      },
      remove: function() {
        m.jumpHeight = (m.jumpHeight != null ? m.jumpHeight : 1.20) / 1.20;
        m.speed = (m.speed != null ? m.speed : 1.10) / 1.10;
      },
    });
    addTech({
      name: "cyclone",
      description: icons.air + "<strong class='color-h'>Cyclone</strong> <em>[Air II]</em><br>Summon a vortex of force. Grants the <strong>wave</strong> gun and <strong>bullet speed +25%</strong>.",
      frequency: 0, frequencyDefault: 0,
      allowed: function() { return hasElement("updraft") && !hasElement("cyclone"); },
      effect: function() {
        b.giveGuns("wave");
        m.bulletSpeed = (m.bulletSpeed != null ? m.bulletSpeed : 1) * 1.25;
      },
      remove: function() { m.bulletSpeed = (m.bulletSpeed != null ? m.bulletSpeed : 1.25) / 1.25; },
    });
    addTech({
      name: "eye of the storm",
      description: icons.air + "<strong class='color-h'>Eye of the Storm</strong> <em>[Air III]</em><br>Transcend the tempest. <strong>+2 air jumps</strong>, <strong>move speed +20%</strong>, and <strong>bullet spread −30%</strong>.",
      frequency: 0, frequencyDefault: 0,
      allowed: function() { return hasElement("cyclone") && !hasElement("eye of the storm"); },
      effect: function() {
        m.coyoteCycles += 60;
        m.speed = (m.speed != null ? m.speed : 1) * 1.20;
        m.bulletSpread = (m.bulletSpread != null ? m.bulletSpread : 1) * 0.70;
      },
      remove: function() {
        m.coyoteCycles = Math.max(0, m.coyoteCycles - 60);
        m.speed = (m.speed != null ? m.speed : 1.20) / 1.20;
        m.bulletSpread = (m.bulletSpread != null ? m.bulletSpread : 0.70) / 0.70;
      },
    });

    // ─ 3f. Path frequency toggle ──────────────────────────────
    var _EARTH_PATH = ["stone skin","seismic pulse","iron core"];
    var _WATER_PATH = ["fluid motion","tidal force","abyssal form"];
    var _FIRE_PATH  = ["kindling","inferno","solar core"];
    var _AIR_PATH   = ["updraft","cyclone","eye of the storm"];

    function _updatePaths() {
      function setFreq(names, on) {
        names.forEach(function(name) {
          var t = tech.tech.find(function(x) { return x.name === name; });
          if (t) { t.frequency = on ? 1 : 0; t.frequencyDefault = on ? 1 : 0; }
        });
      }
      setFreq(_EARTH_PATH, hasElement("earth"));
      setFreq(_WATER_PATH, hasElement("water"));
      setFreq(_FIRE_PATH,  hasElement("fire"));
      setFreq(_AIR_PATH,   hasElement("air"));
    }

    // ─ 3g. Intercept powerUps.tech.effect ────────────────────
    var _origTechEffect = powerUps.tech.effect.bind(powerUps.tech);

    powerUps.tech.effect = function() {
      if (anyElementChosen()) {
        // Element already chosen — normal 3-slot draft
        return _origTechEffect();
      }
      // First time — show the 4-element picker
      _showElementalDraft(_origTechEffect);
    };

    // ─ 3h. Custom 4-slot elemental draft overlay ─────────────
    function _showElementalDraft(origEffect) {
      // Pause game simulation
      if (typeof simulation !== "undefined" && typeof simulation.pause === "function") {
        simulation.pause();
      }

      var ELEMENTS = ["earth","water","fire","air"];

      // Backdrop
      var overlay = document.createElement("div");
      overlay.id = "elemental-draft-overlay";
      var os = overlay.style;
      os.position       = "fixed";
      os.top            = "0";
      os.left           = "0";
      os.right          = "0";
      os.bottom         = "0";
      os.display        = "flex";
      os.flexDirection  = "column";
      os.alignItems     = "center";
      os.justifyContent = "center";
      os.background     = "rgba(0,0,0,0.78)";
      os.zIndex         = "9999";
      os.fontFamily     = "Arial, sans-serif";
      os.color          = "#ccc";

      // Header
      var header = document.createElement("div");
      header.innerHTML = "choose your <strong style='color:#fff;letter-spacing:1px'>element</strong>";
      header.style.fontSize     = "20px";
      header.style.marginBottom = "18px";
      overlay.appendChild(header);

      // 4 cards in a row
      var row = document.createElement("div");
      row.style.display = "flex";
      row.style.gap     = "12px";

      ELEMENTS.forEach(function(elemName) {
        var techObj = tech.tech.find(function(x) { return x.name === elemName; });
        if (!techObj) return;

        var card = document.createElement("div");
        var cs = card.style;
        cs.width        = "155px";
        cs.minHeight    = "215px";
        cs.background   = "#1a1a1a";
        cs.border       = "2px solid #444";
        cs.borderRadius = "6px";
        cs.padding      = "12px";
        cs.cursor       = "pointer";
        cs.display      = "flex";
        cs.flexDirection= "column";
        cs.alignItems   = "center";
        cs.textAlign    = "center";
        cs.fontSize     = "13px";
        cs.lineHeight   = "1.45";
        cs.transition   = "border-color 0.12s, background 0.12s";

        // Inject the tech description HTML (contains the SVG + text)
        card.innerHTML = techObj.description;

        card.addEventListener("mouseover", function() {
          card.style.borderColor = "#aaa";
          card.style.background  = "#262626";
        });
        card.addEventListener("mouseout", function() {
          card.style.borderColor = "#444";
          card.style.background  = "#1a1a1a";
        });
        card.addEventListener("click", function() {
          techObj.count++;
          techObj.effect();
          overlay.remove();
          if (typeof simulation !== "undefined" && typeof simulation.resume === "function") {
            simulation.resume();
          }
        });

        row.appendChild(card);
      });
      overlay.appendChild(row);

      // Button row
      var btnRow = document.createElement("div");
      btnRow.style.marginTop = "16px";
      btnRow.style.display   = "flex";
      btnRow.style.gap       = "10px";

      // Reroll: spend 1 research → get a normal 3-slot draft instead
      var rerollBtn = document.createElement("button");
      rerollBtn.textContent = "reroll (1 research)";
      styleBtn(rerollBtn, "#444");
      rerollBtn.addEventListener("click", function() {
        var res = powerUps.research;
        if (res && res.count > 0) {
          res.count--;
          overlay.remove();
          if (typeof simulation !== "undefined" && typeof simulation.resume === "function") {
            simulation.resume();
          }
          origEffect(); // original 3-slot draft
        } else {
          rerollBtn.textContent = "no research!";
          rerollBtn.style.color = "#f55";
          setTimeout(function() {
            rerollBtn.textContent = "reroll (1 research)";
            rerollBtn.style.color = "#ccc";
          }, 1300);
        }
      });

      // Cancel: close without picking
      var cancelBtn = document.createElement("button");
      cancelBtn.textContent = "cancel";
      styleBtn(cancelBtn, "#622");
      cancelBtn.addEventListener("click", function() {
        overlay.remove();
        if (typeof simulation !== "undefined" && typeof simulation.resume === "function") {
          simulation.resume();
        }
      });

      btnRow.appendChild(rerollBtn);
      btnRow.appendChild(cancelBtn);
      overlay.appendChild(btnRow);

      document.body.appendChild(overlay);
    }

    function styleBtn(btn, bg) {
      var bs = btn.style;
      bs.background   = bg;
      bs.border       = "none";
      bs.borderRadius = "4px";
      bs.color        = "#ccc";
      bs.cursor       = "pointer";
      bs.fontSize     = "13px";
      bs.padding      = "6px 14px";
      btn.addEventListener("mouseover", function() { btn.style.opacity = "0.8"; });
      btn.addEventListener("mouseout",  function() { btn.style.opacity = "1"; });
    }

    console.log("[elemental_upgrades] Loaded — 4-slot elemental gate + 12 path techs.");
  } // end init()

})();
