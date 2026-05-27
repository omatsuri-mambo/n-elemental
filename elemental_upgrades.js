// ============================================================
// ELEMENTAL UPGRADES MOD for N-Gon
// ============================================================
// Adds 4 elemental "skin"-style upgrades: Earth, Water, Fire, Air.
// - Only ONE element can be chosen per run; the others are locked out.
// - Each element unlocks a path of 3 elemental weapons/techs.
// - Drop this file into js/ and add a <script> tag in index.html
//   AFTER all other game scripts, e.g.:
//     <script src="js/elemental_upgrades.js"></script>
// ============================================================
// CONSOLE COMMANDS
// ============================================================
// - tech.giveTech("earth")
// - tech.giveTech("water")
// - tech.giveTech("air")
// - tech.giveTech("fire")
// ============================================================


(function () {
  "use strict";

  // ── helpers ──────────────────────────────────────────────

  /** Returns true if the player has already chosen a specific element. */
  function hasElement(name) {
    const t = tech.tech.find(x => x.name === name);
    return t ? t.count > 0 : false;
  }

  /** Returns true if ANY element has been chosen. */
  function anyElementChosen() {
    return ["earth", "water", "fire", "air"].some(hasElement);
  }

  /**
   * Adds a tech entry using the community-documented structure.
   * `options` may override any defaults.
   */
  function addTech(options) {
    tech.tech.push(Object.assign({
      count: 0,
      maxCount: 1,
      frequency: 1,
      frequencyDefault: 1,
      allowed: () => true,
      requires: "",
      effect() {},
      remove() {},
    }, options));
  }

  // ── SVG icons (inline, 75×75) ─────────────────────────────
  // These use the same SVG-in-description pattern the vanilla game uses.

  const icons = {
    earth: `<svg width='75' height='75' viewBox='0 0 75 75' xmlns='http://www.w3.org/2000/svg'>
      <polygon points='37,8 67,62 7,62' fill='none' stroke='#6b4' stroke-width='3'/>
      <polygon points='37,22 55,55 19,55' fill='#6b4' opacity='0.35'/>
    </svg>`,

    water: `<svg width='75' height='75' viewBox='0 0 75 75' xmlns='http://www.w3.org/2000/svg'>
      <path d='M37 10 Q55 38 37 62 Q19 38 37 10Z' fill='none' stroke='#4af' stroke-width='3'/>
      <path d='M37 24 Q48 42 37 57 Q26 42 37 24Z' fill='#4af' opacity='0.35'/>
    </svg>`,

    fire: `<svg width='75' height='75' viewBox='0 0 75 75' xmlns='http://www.w3.org/2000/svg'>
      <path d='M37 10 C50 28 62 36 52 55 C44 68 30 68 23 55 C13 36 24 28 37 10Z'
            fill='none' stroke='#f64' stroke-width='3'/>
      <path d='M37 26 C44 36 50 42 44 52 C40 59 34 59 30 52 C24 42 30 36 37 26Z'
            fill='#f64' opacity='0.35'/>
    </svg>`,

    air: `<svg width='75' height='75' viewBox='0 0 75 75' xmlns='http://www.w3.org/2000/svg'>
      <circle cx='37' cy='37' r='26' fill='none' stroke='#adf' stroke-width='3'/>
      <path d='M20 37 Q37 20 54 37 Q37 54 20 37Z' fill='#adf' opacity='0.35'/>
    </svg>`,
  };

  // ── locked-description helper ────────────────────────────

  function lockedDesc(element) {
    const chosen = ["earth","water","fire","air"].find(hasElement);
    return `<em style='color:#888'>Locked — you have already chosen the <strong>${chosen}</strong> path. Start a new game to choose a different element.</em>`;
  }

  // ── ELEMENT GATE TECHS ────────────────────────────────────
  // These are "skin"-like: choosing one locks the others for the whole run.

  addTech({
    name: "earth",
    description: `${icons.earth}<strong class='color-h'>Earth</strong><br>
      Attune to the element of <strong>earth</strong>. Grants minor passive stability
      (<strong>+5 max health</strong>) and unlocks the <em>earth weapon path</em>.<br>
      <em style='color:#888'>Incompatible with other elements.</em>`,
    maxCount: 1,
    allowed() {
      if (hasElement("earth")) return false;   // already have it — hide repeats
      if (anyElementChosen()) return false;     // another element was chosen
      return true;
    },
    effect() {
      m.maxHealth += 5;
      m.health = Math.min(m.health + 5, m.maxHealth);
      // Unlock earth weapons now that the path is open
      _updateElementalWeaponVisibility();
    },
    remove() {
      m.maxHealth -= 5;
      m.health = Math.min(m.health, m.maxHealth);
    },
  });

  addTech({
    name: "water",
    description: `${icons.water}<strong class='color-h'>Water</strong><br>
      Attune to the element of <strong>water</strong>. Grants minor passive recovery
      (<strong>+5 max energy</strong>) and unlocks the <em>water weapon path</em>.<br>
      <em style='color:#888'>Incompatible with other elements.</em>`,
    maxCount: 1,
    allowed() {
      if (hasElement("water")) return false;
      if (anyElementChosen()) return false;
      return true;
    },
    effect() {
      m.maxEnergy += 5;
      m.energy = Math.min(m.energy + 5, m.maxEnergy);
      _updateElementalWeaponVisibility();
    },
    remove() {
      m.maxEnergy -= 5;
      m.energy = Math.min(m.energy, m.maxEnergy);
    },
  });

  addTech({
    name: "fire",
    description: `${icons.fire}<strong class='color-h'>Fire</strong><br>
      Attune to the element of <strong>fire</strong>. Grants minor offensive spark
      (<strong>+10% damage</strong>) and unlocks the <em>fire weapon path</em>.<br>
      <em style='color:#888'>Incompatible with other elements.</em>`,
    maxCount: 1,
    allowed() {
      if (hasElement("fire")) return false;
      if (anyElementChosen()) return false;
      return true;
    },
    effect() {
      m.damageDone *= 1.10;
      _updateElementalWeaponVisibility();
    },
    remove() {
      m.damageDone /= 1.10;
    },
  });

  addTech({
    name: "air",
    description: `${icons.air}<strong class='color-h'>Air</strong><br>
      Attune to the element of <strong>air</strong>. Grants minor passive agility
      (<strong>+1 air jump</strong>) and unlocks the <em>air weapon path</em>.<br>
      <em style='color:#888'>Incompatible with other elements.</em>`,
    maxCount: 1,
    allowed() {
      if (hasElement("air")) return false;
      if (anyElementChosen()) return false;
      return true;
    },
    effect() {
      m.coyoteCycles += 30; // extra coyote-time ticks ≈ one extra air jump
      _updateElementalWeaponVisibility();
    },
    remove() {
      m.coyoteCycles = Math.max(0, m.coyoteCycles - 30);
    },
  });

  // ── ELEMENTAL WEAPON PATHS ────────────────────────────────
  // Each element has 3 weapon/tech upgrades that are ONLY visible after
  // the corresponding element is chosen.  They appear as normal tech picks.

  // ---------- EARTH PATH ----------
  // Tier 1: Stone Skin — passive defense boost
  addTech({
    name: "stone skin",
    description: `${icons.earth}<strong class='color-h'>Stone Skin</strong> <em>[Earth I]</em><br>
      The earth hardens around you. <strong>+10 max health</strong> and
      <strong>−15% knockback received</strong>.`,
    maxCount: 1,
    requires: "earth",
    allowed() { return hasElement("earth") && !hasElement("stone skin"); },
    effect() {
      m.maxHealth += 10;
      m.health = Math.min(m.health + 10, m.maxHealth);
      m.knockback = (m.knockback ?? 1) * 0.85;
    },
    remove() {
      m.maxHealth -= 10;
      m.health = Math.min(m.health, m.maxHealth);
      m.knockback = (m.knockback ?? 0.85) / 0.85;
    },
  });

  // Tier 2: Seismic Pulse — unlocks grenade-style earth burst weapon
  addTech({
    name: "seismic pulse",
    description: `${icons.earth}<strong class='color-h'>Seismic Pulse</strong> <em>[Earth II]</em><br>
      Channel tectonic force into your weapons.
      Adds the <strong>grenades</strong> launcher to your arsenal with
      <strong>+20% explosion damage</strong>.`,
    maxCount: 1,
    requires: "stone skin",
    allowed() { return hasElement("stone skin") && !hasElement("seismic pulse"); },
    effect() {
      b.giveGuns("grenades");
      m.damageDone *= 1.20;
    },
    remove() {
      m.damageDone /= 1.20;
      // Note: guns cannot cleanly be removed mid-run; effect stays
    },
  });

  // Tier 3: Iron Core — massive health + bullets become heavy/slow
  addTech({
    name: "iron core",
    description: `${icons.earth}<strong class='color-h'>Iron Core</strong> <em>[Earth III]</em><br>
      You become one with bedrock. <strong>+25 max health</strong>,
      and your projectiles carry <strong>+40% more mass</strong> (greater knockback on enemies).`,
    maxCount: 1,
    requires: "seismic pulse",
    allowed() { return hasElement("seismic pulse") && !hasElement("iron core"); },
    effect() {
      m.maxHealth += 25;
      m.health = Math.min(m.health + 25, m.maxHealth);
      m.bulletMass = (m.bulletMass ?? 1) * 1.4;
    },
    remove() {
      m.maxHealth -= 25;
      m.health = Math.min(m.health, m.maxHealth);
      m.bulletMass = (m.bulletMass ?? 1.4) / 1.4;
    },
  });

  // ---------- WATER PATH ----------
  // Tier 1: Fluid Motion — energy regeneration boost
  addTech({
    name: "fluid motion",
    description: `${icons.water}<strong class='color-h'>Fluid Motion</strong> <em>[Water I]</em><br>
      Flow like water. <strong>Energy regenerates 20% faster</strong> and
      <strong>+10 max energy</strong>.`,
    maxCount: 1,
    requires: "water",
    allowed() { return hasElement("water") && !hasElement("fluid motion"); },
    effect() {
      m.maxEnergy += 10;
      m.energyRegen = (m.energyRegen ?? 1) * 1.20;
    },
    remove() {
      m.maxEnergy -= 10;
      m.energyRegen = (m.energyRegen ?? 1.20) / 1.20;
    },
  });

  // Tier 2: Tidal Force — unlocks harpoon with bonus range
  addTech({
    name: "tidal force",
    description: `${icons.water}<strong class='color-h'>Tidal Force</strong> <em>[Water II]</em><br>
      Harness the pull of the tides. Grants the <strong>harpoon</strong> and
      enemies caught by it take <strong>+25% bonus damage</strong>.`,
    maxCount: 1,
    requires: "fluid motion",
    allowed() { return hasElement("fluid motion") && !hasElement("tidal force"); },
    effect() {
      b.giveGuns("harpoon");
      m.damageDone *= 1.25;
    },
    remove() {
      m.damageDone /= 1.25;
    },
  });

  // Tier 3: Abyssal Form — near-invulnerability to energy drain
  addTech({
    name: "abyssal form",
    description: `${icons.water}<strong class='color-h'>Abyssal Form</strong> <em>[Water III]</em><br>
      Descend into the deep. <strong>Energy drain from weapons reduced by 40%</strong>
      and <strong>+20 max energy</strong>.`,
    maxCount: 1,
    requires: "tidal force",
    allowed() { return hasElement("tidal force") && !hasElement("abyssal form"); },
    effect() {
      m.maxEnergy += 20;
      m.energyDrain = (m.energyDrain ?? 1) * 0.60;
    },
    remove() {
      m.maxEnergy -= 20;
      m.energyDrain = (m.energyDrain ?? 0.60) / 0.60;
    },
  });

  // ---------- FIRE PATH ----------
  // Tier 1: Kindling — ammo burns hotter, boosting damage
  addTech({
    name: "kindling",
    description: `${icons.fire}<strong class='color-h'>Kindling</strong> <em>[Fire I]</em><br>
      Ignite your shots. <strong>+15% damage</strong> but
      <strong>ammo consumption +10%</strong>.`,
    maxCount: 1,
    requires: "fire",
    allowed() { return hasElement("fire") && !hasElement("kindling"); },
    effect() {
      m.damageDone *= 1.15;
      m.ammoUsage = (m.ammoUsage ?? 1) * 1.10;
    },
    remove() {
      m.damageDone /= 1.15;
      m.ammoUsage = (m.ammoUsage ?? 1.10) / 1.10;
    },
  });

  // Tier 2: Inferno — unlocks missiles with burn damage multiplier
  addTech({
    name: "inferno",
    description: `${icons.fire}<strong class='color-h'>Inferno</strong> <em>[Fire II]</em><br>
      Unleash a firestorm. Grants the <strong>missiles</strong> launcher and
      <strong>+20% explosion damage</strong>.`,
    maxCount: 1,
    requires: "kindling",
    allowed() { return hasElement("kindling") && !hasElement("inferno"); },
    effect() {
      b.giveGuns("missiles");
      m.damageDone *= 1.20;
    },
    remove() {
      m.damageDone /= 1.20;
    },
  });

  // Tier 3: Solar Core — massive damage, fire rate boost, heavy ammo use
  addTech({
    name: "solar core",
    description: `${icons.fire}<strong class='color-h'>Solar Core</strong> <em>[Fire III]</em><br>
      Burn like a star. <strong>+30% damage</strong> and <strong>fire rate ×1.3</strong>,
      but <strong>ammo use ×1.5</strong>.`,
    maxCount: 1,
    requires: "inferno",
    allowed() { return hasElement("inferno") && !hasElement("solar core"); },
    effect() {
      m.damageDone *= 1.30;
      m.fireRate = (m.fireRate ?? 1) * 1.30;
      m.ammoUsage = (m.ammoUsage ?? 1) * 1.50;
    },
    remove() {
      m.damageDone /= 1.30;
      m.fireRate = (m.fireRate ?? 1.30) / 1.30;
      m.ammoUsage = (m.ammoUsage ?? 1.50) / 1.50;
    },
  });

  // ---------- AIR PATH ----------
  // Tier 1: Updraft — jump boost and movement speed
  addTech({
    name: "updraft",
    description: `${icons.air}<strong class='color-h'>Updraft</strong> <em>[Air I]</em><br>
      Ride the wind. <strong>Jump height ×1.2</strong> and
      <strong>movement speed +10%</strong>.`,
    maxCount: 1,
    requires: "air",
    allowed() { return hasElement("air") && !hasElement("updraft"); },
    effect() {
      m.jumpHeight = (m.jumpHeight ?? 1) * 1.20;
      m.speed = (m.speed ?? 1) * 1.10;
    },
    remove() {
      m.jumpHeight = (m.jumpHeight ?? 1.20) / 1.20;
      m.speed = (m.speed ?? 1.10) / 1.10;
    },
  });

  // Tier 2: Cyclone — unlocks wave gun with piercing wind bonus
  addTech({
    name: "cyclone",
    description: `${icons.air}<strong class='color-h'>Cyclone</strong> <em>[Air II]</em><br>
      Summon a vortex of force. Grants the <strong>wave</strong> gun and
      projectile speed is <strong>+25% faster</strong>.`,
    maxCount: 1,
    requires: "updraft",
    allowed() { return hasElement("updraft") && !hasElement("cyclone"); },
    effect() {
      b.giveGuns("wave");
      m.bulletSpeed = (m.bulletSpeed ?? 1) * 1.25;
    },
    remove() {
      m.bulletSpeed = (m.bulletSpeed ?? 1.25) / 1.25;
    },
  });

  // Tier 3: Eye of the Storm — extreme mobility + projectile spread
  addTech({
    name: "eye of the storm",
    description: `${icons.air}<strong class='color-h'>Eye of the Storm</strong> <em>[Air III]</em><br>
      Transcend the tempest. <strong>+2 extra air jumps</strong>,
      movement speed <strong>+20%</strong>, and bullet spread <strong>−30%</strong>.`,
    maxCount: 1,
    requires: "cyclone",
    allowed() { return hasElement("cyclone") && !hasElement("eye of the storm"); },
    effect() {
      m.coyoteCycles += 60; // ~2 extra air jumps
      m.speed = (m.speed ?? 1) * 1.20;
      m.bulletSpread = (m.bulletSpread ?? 1) * 0.70;
    },
    remove() {
      m.coyoteCycles = Math.max(0, m.coyoteCycles - 60);
      m.speed = (m.speed ?? 1.20) / 1.20;
      m.bulletSpread = (m.bulletSpread ?? 0.70) / 0.70;
    },
  });

  // ── VISIBILITY UPDATE HOOK ────────────────────────────────
  // Elemental weapon-path techs start with frequency = 0 and are only
  // bumped to 1 once the matching element gate is chosen.

  const _EARTH_PATH = ["stone skin", "seismic pulse", "iron core"];
  const _WATER_PATH = ["fluid motion", "tidal force", "abyssal form"];
  const _FIRE_PATH  = ["kindling", "inferno", "solar core"];
  const _AIR_PATH   = ["updraft", "cyclone", "eye of the storm"];
  const _ALL_PATHS  = [..._EARTH_PATH, ..._WATER_PATH, ..._FIRE_PATH, ..._AIR_PATH];

  // Initially hide all weapon-path techs (frequency 0 = not offered)
  _ALL_PATHS.forEach(name => {
    const t = tech.tech.find(x => x.name === name);
    if (t) { t.frequency = 0; t.frequencyDefault = 0; }
  });

  function _updateElementalWeaponVisibility() {
    const earthOn = hasElement("earth");
    const waterOn = hasElement("water");
    const fireOn  = hasElement("fire");
    const airOn   = hasElement("air");

    function setFreq(names, on) {
      names.forEach(name => {
        const t = tech.tech.find(x => x.name === name);
        if (t) { t.frequency = on ? 1 : 0; t.frequencyDefault = on ? 1 : 0; }
      });
    }

    setFreq(_EARTH_PATH, earthOn);
    setFreq(_WATER_PATH, waterOn);
    setFreq(_FIRE_PATH,  fireOn);
    setFreq(_AIR_PATH,   airOn);
  }

  // ── LOCK DISPLAY: patch element techs that are now impossible ────────────
  // After ANY element is picked the other three should show as greyed-out
  // rather than disappearing entirely, so players know they're locked.
  // We do this by monkey-patching their `allowed` to return false AND
  // injecting a locked description when they'd otherwise appear.
  // (Because allowed() = false already hides them from the pool,
  //  this primarily affects the "currently shown but un-choosable" case.)

  // The `allowed` functions above already handle this — returning false
  // prevents the tech from being offered, which is the correct UX for n-gon.

  console.log("[elemental_upgrades] Loaded: earth, water, fire, air paths.");
})();
