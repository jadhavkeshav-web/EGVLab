(function () {
  "use strict";
  var shell = window.EGShell;
  if (!shell) { if (window.parent !== window) bridge(); return; }
  var stage = shell.stage;
  var LS_SOUND = "eg_tour_sound", LS_SEEN = "eg_tour_seen";
  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function shown(el) { return !!(el && el.getClientRects().length); }

  var app = {};
  function post(msg) { msg.egt = 1; try { stage.contentWindow.postMessage(msg, "*"); } catch (e) {} }
  window.addEventListener("message", function (ev) {
    if (ev.source !== stage.contentWindow) return;
    var m = ev.data;
    if (!m || m.egt !== 1) return;
    if (m.type === "state") app = { st: m.st, key: m.key, rect: m.rect, at: Date.now() };
    else if (m.cmd === "go") shell.go(String(m.id));
    else if (m.cmd === "tour") shell.startTour();
  });
  stage.addEventListener("load", function () { app = {}; });
  function appSt() { return (app.st && Date.now() - app.at < 1500) ? app.st : null; }
  function inCurves() { var s = appSt(); return !!(s && s.curves) && shell.current() === "curves"; }
  function cycloidIndex() { var s = appSt(); return s ? s.cyc : -1; }

  function inShell(sel) { return function () { var el = document.querySelector(sel); return shown(el) ? { el: el, frame: false } : null; }; }
  function inApp(key) {
    var f = function () {
      if (!inCurves() || app.key !== key || !app.rect || app.rect.w < 1) return null;
      return { rect: app.rect, frame: true, key: key };
    };
    f.key = key;
    return f;
  }

  var ALL_STEPS = [
    { title: "Welcome!",
      text: "This short tour shows you how to use the simulator with a real problem: drawing a cycloid. A pointer shows you where to click. Do what it shows, or press Next. You can switch my voice off with the Sound button." },
    { title: "Choose a topic",
      text: "The five topics are listed along the top. Click Engineering Curves.",
      target: inShell("#tab-curves"), click: true,
      done: function () { return shell.current() === "curves" && inCurves(); } },
    { title: "Choose a problem",
      text: function () { var i = cycloidIndex(); return "Each topic has its own list of problems. Here is Problem " + (i >= 0 ? i + 1 : 7) + ", the cycloid. Click Solve this problem."; },
      target: inApp("cycloid"), click: true,
      done: function () { var s = appSt(); return inCurves() && s.prob === s.cyc && s.solve; } },
    { title: "The given data",
      text: "These are the given values. You can change any of them, for example the diameter of the circle, and the whole solution is worked out again for your numbers. Let's keep them as they are.",
      target: inApp("given") },
    { title: "Start drawing",
      text: "Click Start drawing.",
      target: inApp("start"), click: true,
      done: function () { var s = appSt(); return !!s && s.started === true; } },
    { title: "Read each step",
      text: "Every step is explained here, and the drawing shows it. Step 1 explains what a cycloid is, and shows the starting position: a circle about to roll along a straight line, carrying the point P.",
      target: inApp("viewport") },
    { title: "Go to the next step",
      text: "Click Next.",
      target: inApp("next"), click: true,
      done: function () { var s = appSt(); return !!s && s.step >= 2; } },
    { title: "See how the curve is made",
      text: "Watch the animation: the circle rolls without slipping, and the point P traces the cycloid. Seeing the idea first makes the construction easy to follow.",
      target: inApp("canvas") },
    { title: "Construct it",
      text: "Now the construction begins. Click Next again. Each step is drawn with the instruments, the scale, compass and protractor, just as you would draw it on paper.",
      target: inApp("next"), click: true,
      done: function () { var s = appSt(); return !!s && s.step >= 3; } },
    { title: "Go back or start again",
      text: "Missed something? Previous takes you back one step, and Restart starts the problem again from the beginning.",
      target: inApp("prev") },
    { title: "Drawing speed",
      text: "Choose how fast the instruments move: slow, normal, fast or very fast.",
      target: inApp("speed") },
    { title: "Voice",
      text: "The simulator reads every step aloud. Switch that voice on or off here. It is paused while this tour is speaking.",
      target: inApp("voice") },
    { title: "Zoom and move",
      text: "Zoom in and out with the minus and plus buttons, or with the Control key and the mouse wheel. On a phone, pinch with two fingers. Drag the drawing to move it, and Fit view brings it back.",
      target: inApp("zoom") },
    { title: "The finished drawing",
      text: "Click Show all to jump straight to the finished drawing.",
      target: inApp("showall"), click: true,
      done: function () { var s = appSt(); return !!(s && s.step && s.n && s.step >= s.n); } },
    { title: "Results",
      text: "Here is the finished cycloid. The final results are listed below the steps.",
      target: inApp("results") },
    { title: "Full screen",
      text: "Full screen gives the drawing the whole screen, which is useful on a phone or a projector. Click Full screen. To come back, click Exit full screen, or press the Escape key.",
      target: inApp("fs"), click: true,
      done: function () { var s = appSt(); return !!s && s.fs; } },
    { title: "Leave full screen",
      text: "In full screen, Previous and Next are at the top of the screen. Click Exit full screen to come back.",
      target: inApp("fs"), click: true,
      done: function () { var s = appSt(); return inCurves() && !s.fs; } },
    { title: "Other problems",
      text: "All problems takes you back to the list of problems in this topic.",
      target: inApp("back") },
    { title: "Other topics",
      text: "The other topics work in exactly the same way: choose a problem, click Start drawing, and go step by step with Next.",
      target: inShell("#tabs") },
    { title: "Faculty: follow your students",
      text: "Accounts are optional. A faculty member who wants to follow their students signs up here, with a Google account or an email and password. Students sign up too and choose their faculty, and the faculty dashboard then shows the problems each student has solved and the time spent on each topic.",
      target: inShell("#eg-account"),
      only: function () { return !!(window.EG && window.EG.apiBase()); } },
    { title: "That's it!",
      text: "You can take this tour again at any time with How to use. Enjoy drawing!",
      target: inShell("#tour-btn"), last: true }
  ];

  var STEPS = ALL_STEPS;

  var synth = ("speechSynthesis" in window) ? window.speechSynthesis : null;
  var sound = lsGet(LS_SOUND) !== "off";
  var voice = null;
  function pickVoice() {
    if (!synth) return null;
    var en = synth.getVoices().filter(function (v) { return v.lang && v.lang.toLowerCase().indexOf("en") === 0; });
    function find(f) { for (var i = 0; i < en.length; i++) if (f(en[i])) return en[i]; return null; }
    return find(function (v) { return /natural/i.test(v.name) && v.lang === "en-IN"; })
        || find(function (v) { return /natural/i.test(v.name); })
        || find(function (v) { return /google/i.test(v.name) && v.lang === "en-IN"; })
        || find(function (v) { return /google/i.test(v.name); })
        || find(function (v) { return v.lang === "en-IN"; })
        || en[0] || null;
  }
  if (synth) { synth.getVoices(); synth.addEventListener && synth.addEventListener("voiceschanged", function () { voice = pickVoice(); }); }
  function hush() { if (synth) try { synth.cancel(); } catch (e) {} }
  function speak(text) {
    hush();
    if (!synth || !sound) return;
    var u = new SpeechSynthesisUtterance(text);
    u.rate = 0.95;
    if (!voice) voice = pickVoice();
    if (voice) u.voice = voice;
    setTimeout(function () { try { synth.speak(u); } catch (e) {} }, 40);
  }
  function muteApp(on) { post({ cmd: "mute", on: on }); }

  var css = [
    "#egt{position:fixed;inset:0;z-index:2147483000;pointer-events:none;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;}",
    "#egt .egt-shade{position:absolute;inset:0;background:rgba(12,22,36,.52);}",
    "#egt .egt-hole{position:absolute;border-radius:10px;box-shadow:0 0 0 200vmax rgba(12,22,36,.52);outline:3px solid #f0a35e;outline-offset:2px;",
    "  transition:left .45s ease,top .45s ease,width .45s ease,height .45s ease;animation:egtPulse 1.6s ease-in-out infinite;}",
    "@keyframes egtPulse{0%,100%{outline-color:rgba(240,163,94,1)}50%{outline-color:rgba(240,163,94,.35)}}",
    "#egt .egt-cursor{position:absolute;width:30px;height:34px;transition:left .7s cubic-bezier(.4,.1,.2,1),top .7s cubic-bezier(.4,.1,.2,1);filter:drop-shadow(0 2px 3px rgba(0,0,0,.45));}",
    "#egt.egt-tap .egt-cursor svg{animation:egtTap 1.5s ease-in-out infinite;transform-origin:3px 2px;}",
    "@keyframes egtTap{0%,55%,100%{transform:scale(1)}65%{transform:scale(.82)}75%{transform:scale(1)}}",
    "#egt .egt-ripple{position:absolute;width:44px;height:44px;margin:-22px 0 0 -22px;border-radius:50%;border:3px solid #f0a35e;opacity:0;",
    "  transition:left .7s cubic-bezier(.4,.1,.2,1),top .7s cubic-bezier(.4,.1,.2,1);}",
    "#egt.egt-tap .egt-ripple{animation:egtRipple 1.5s ease-out infinite;}",
    "@keyframes egtRipple{0%,60%{opacity:0;transform:scale(.3)}66%{opacity:.9;transform:scale(.4)}100%{opacity:0;transform:scale(1.35)}}",
    "#egt .egt-card{position:absolute;pointer-events:auto;width:340px;max-width:calc(100vw - 24px);background:#fff;color:#1c2833;border-radius:14px;",
    "  box-shadow:0 12px 40px rgba(0,0,0,.35);padding:14px 16px 12px;transition:left .35s ease,top .35s ease;}",
    "#egt .egt-top{display:flex;align-items:center;gap:8px;margin-bottom:4px;}",
    "#egt .egt-count{font-size:.74rem;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:#c96a2b;margin-right:auto;}",
    "#egt .egt-card h3{margin:0 0 4px;font-size:1.05rem;color:#16344f;}",
    "#egt .egt-card p{margin:0 0 12px;font-size:.92rem;line-height:1.45;}",
    "#egt .egt-actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap;}",
    "#egt .egt-hint{font-size:.84rem;color:#6b7686;margin-right:auto;}",
    "#egt button{font:600 .85rem/1 inherit;font-family:inherit;border-radius:8px;cursor:pointer;padding:8px 12px;border:1px solid #dfe5ec;background:#fff;color:#16344f;}",
    "#egt button:hover{border-color:#2a5a86;}",
    "#egt button:focus-visible{outline:2px solid #2a5a86;outline-offset:2px;}",
    "#egt .egt-next{background:#c96a2b;border-color:#c96a2b;color:#fff;margin-left:auto;}",
    "#egt .egt-next:hover{background:#b35c22;}",
    "#egt .egt-sound{padding:6px 10px;font-size:.78rem;}",
    "#egt .egt-sound[aria-pressed=false]{color:#6b7686;}",
    "#egt .egt-close{padding:5px 9px;font-size:.9rem;line-height:1;}",
    "#egt .egt-welcome p{margin-bottom:14px;}"
  ].join("\n");

  var root, shade, hole, cursor, ripple, card, elCount, elTitle, elText, elHint, btnNext, btnSkip, btnSound;
  function build() {
    if (root) return;
    var st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);
    root = document.createElement("div"); root.id = "egt"; root.hidden = true;
    root.innerHTML =
      '<div class="egt-shade"></div><div class="egt-hole"></div>' +
      '<div class="egt-ripple"></div>' +
      '<div class="egt-cursor"><svg viewBox="0 0 30 34" width="30" height="34" aria-hidden="true">' +
      '<path d="M3 2 L3 26 L9.5 20 L14 30.5 L18.6 28.5 L14.2 18.3 L23 18.3 Z" fill="#fff" stroke="#16344f" stroke-width="2" stroke-linejoin="round"/></svg></div>' +
      '<div class="egt-card" role="dialog" aria-modal="false" aria-labelledby="egt-title">' +
      '  <div class="egt-top"><span class="egt-count"></span>' +
      '    <button type="button" class="egt-sound"></button>' +
      '    <button type="button" class="egt-close" aria-label="End the tour" title="End the tour">&#x2715;</button></div>' +
      '  <h3 id="egt-title"></h3><p aria-live="polite"></p>' +
      '  <div class="egt-actions"><span class="egt-hint"></span>' +
      '    <button type="button" class="egt-skip">Do it for me</button>' +
      '    <button type="button" class="egt-next">Next &#9654;</button></div>' +
      '</div>';
    document.body.appendChild(root);
    shade = root.querySelector(".egt-shade"); hole = root.querySelector(".egt-hole");
    cursor = root.querySelector(".egt-cursor"); ripple = root.querySelector(".egt-ripple");
    card = root.querySelector(".egt-card"); elCount = root.querySelector(".egt-count");
    elTitle = root.querySelector("h3"); elText = root.querySelector(".egt-card p"); elHint = root.querySelector(".egt-hint");
    btnNext = root.querySelector(".egt-next"); btnSkip = root.querySelector(".egt-skip"); btnSound = root.querySelector(".egt-sound");
    root.querySelector(".egt-close").addEventListener("click", end);
    btnSound.addEventListener("click", function () {
      sound = !sound; lsSet(LS_SOUND, sound ? "on" : "off"); syncSound();
      if (sound && mode === "tour") speak(currentSpeech); else hush();
    });
    syncSound();
  }
  function syncSound() {
    btnSound.textContent = sound ? "ðŸ”Š Sound on" : "ðŸ”‡ Sound off";
    btnSound.setAttribute("aria-pressed", String(sound));
    btnSound.title = sound ? "Switch the voice off" : "Switch the voice on";
  }

  var mode = null;
  var idx = 0, poll = 0, moving = false, currentSpeech = "";

  function textOf(st) { return typeof st.text === "function" ? st.text() : st.text; }

  function showStep(n) {
    idx = n; moving = false;
    var st = STEPS[idx], text = textOf(st);
    elCount.textContent = "How to use Â· " + (idx + 1) + " of " + STEPS.length;
    elTitle.textContent = st.title;
    elText.textContent = text;
    btnSkip.hidden = !st.click; btnSkip.textContent = "Do it for me";
    elHint.hidden = !st.click;
    elHint.textContent = st.click ? "Click where the pointer shows" : "";
    btnNext.hidden = !!st.click;
    btnNext.innerHTML = st.last ? "Finish" : "Next &#9654;";
    btnNext.onclick = function () { if (st.last) end(); else showStep(idx + 1); };
    btnSkip.onclick = function () {
      if (st.target && st.target.key) post({ cmd: "click", key: st.target.key });
      else { var t = st.target && st.target(); if (t) t.el.click(); }
    };
    root.classList.toggle("egt-tap", !!st.click);
    currentSpeech = st.title + ". " + text;
    speak(currentSpeech);
    place();
  }

  function tick() {
    if (mode !== "tour") return;
    muteApp(true);
    var st = STEPS[idx];
    post({ cmd: "watch", key: (st.target && st.target.key) || "", idx: idx });
    if (st.click && st.done && !moving && st.done()) {
      moving = true;
      root.classList.remove("egt-tap");
      setTimeout(function () { if (mode === "tour" && STEPS[idx] === st) showStep(idx + 1); }, 650);
    }
    place();
  }

  function rectOf(t) {
    if (!t.frame) { var b = t.el.getBoundingClientRect(); return { l: b.left, t: b.top, w: b.width, h: b.height }; }
    var f = stage.getBoundingClientRect();
    return { l: t.rect.l + f.left, t: t.rect.t + f.top, w: t.rect.w, h: t.rect.h };
  }

  function place() {
    var vw = window.innerWidth, vh = window.innerHeight, m = 12;
    var st = mode === "tour" ? STEPS[idx] : null;
    var t = st && st.target ? st.target() : null;
    var r = t ? rectOf(t) : null;
    if (r && (r.w < 1 || r.h < 1 || r.t > vh || r.t + r.h < 0)) r = null;

    var cw = card.offsetWidth, ch = card.offsetHeight, left, top;
    if (!r) {
      shade.hidden = false; hole.hidden = true; cursor.hidden = true; ripple.hidden = true;
      left = (vw - cw) / 2; top = Math.max(m, (vh - ch) / 2);
    } else {
      shade.hidden = true; hole.hidden = false; cursor.hidden = false; ripple.hidden = false;
      var pad = 6;
      hole.style.left = (r.l - pad) + "px"; hole.style.top = (r.t - pad) + "px";
      hole.style.width = (r.w + 2 * pad) + "px"; hole.style.height = (r.h + 2 * pad) + "px";
      var tx = st.click ? r.l + Math.min(r.w * 0.62, r.w - 6) : r.l + r.w - 2,
          ty = st.click ? r.t + Math.min(r.h * 0.62, r.h - 4) : r.t + r.h - 2;
      cursor.style.left = (tx - 3) + "px"; cursor.style.top = (ty - 2) + "px";
      ripple.style.left = tx + "px"; ripple.style.top = ty + "px";
      if (vw < 640) {
        left = m;
        top = (r.t + r.h / 2 > vh / 2) ? m + 4 : vh - ch - m;
      } else if (r.h > vh * 0.45) {
        top = Math.max(m, Math.min(vh - ch - m, r.t + 16));
        if (r.l >= cw * 0.6) left = Math.max(m, r.l - 16 - cw);
        else if (vw - (r.l + r.w) >= cw * 0.6) left = Math.min(vw - cw - m, r.l + r.w + 16);
        else { left = Math.max(m, r.l + 16); top = Math.max(m, Math.min(vh - ch - m, r.t + r.h - ch - 16)); }
      } else {
        var below = r.t + r.h + 36, above = r.t - ch - 16;
        top = (below + ch <= vh - m) ? below : (above >= m ? above : Math.max(m, vh - ch - m));
        left = Math.min(vw - cw - m, Math.max(m, r.l + r.w / 2 - cw / 2));
      }
    }
    card.style.left = Math.round(left) + "px";
    card.style.top = Math.round(top) + "px";
  }

  function start() {
    build();
    lsSet(LS_SEEN, "1");
    mode = "tour";
    root.hidden = false;
    card.classList.remove("egt-welcome");
    cursor.style.left = (window.innerWidth / 2) + "px"; cursor.style.top = (window.innerHeight / 2) + "px";
    ripple.style.left = cursor.style.left; ripple.style.top = cursor.style.top;
    STEPS = ALL_STEPS.filter(function (s) { return !s.only || s.only(); });
    if (shell.current() !== "home") shell.go("home");
    clearInterval(poll);
    poll = setInterval(tick, 150);
    window.addEventListener("resize", place);
    showStep(0);
  }

  function end() {
    mode = null;
    clearInterval(poll);
    window.removeEventListener("resize", place);
    hush();
    muteApp(false);
    if (root) root.hidden = true;
  }

  function welcome() {
    build();
    mode = "welcome";
    root.hidden = false; root.classList.remove("egt-tap");
    card.classList.add("egt-welcome");
    elCount.textContent = "Welcome";
    elTitle.textContent = "New to the simulator?";
    elText.textContent = "Take a short guided tour. It opens a real problem, the cycloid, and a pointer shows you where to click, with every step explained aloud.";
    elHint.hidden = true;
    btnSkip.hidden = false; btnSkip.textContent = "Not now";
    btnSkip.onclick = function () { lsSet(LS_SEEN, "1"); end(); };
    btnNext.hidden = false; btnNext.innerHTML = "Start the tour &#9654;";
    btnNext.onclick = start;
    place();
  }

  shell.startTour = function () { end(); start(); };
  var headerBtn = document.getElementById("tour-btn");
  if (headerBtn) headerBtn.addEventListener("click", shell.startTour);

  if (shell.wantTour) setTimeout(shell.startTour, 400);
  else if (!lsGet(LS_SEEN) && shell.current() === "home") setTimeout(welcome, 700);

  function bridge() {
    var FIND = {
      given: "#given-grid", start: "#startButton", viewport: "#step-viewport", next: "#nextButton",
      canvas: "#projectionCanvas", prev: "#prevButton", speed: "#speedSel", voice: "#voiceBtn",
      zoom: "#zoom-toolbar", results: "#results", fs: "#fsBtn", back: "#backBtn",
      cycloid: function () {
        var card = Array.prototype.filter.call(document.querySelectorAll("#screen-list .prob-card"), function (c) {
          var h = c.querySelector("h3"); return h && /cycloid/i.test(h.textContent);
        })[0];
        return card ? card.querySelector("button") : null;
      },
      showall: function () {
        return Array.prototype.filter.call(document.querySelectorAll(".btn-group button"), function (b) { return b.textContent.trim() === "Show all"; })[0];
      }
    };
    function find(key) {
      var f = FIND[key]; if (!f) return null;
      var el = (typeof f === "string") ? document.querySelector(f) : f();
      return (el && el.getClientRects().length) ? el : null;
    }
    function G(expr) { try { return (0, eval)(expr); } catch (e) { return undefined; } }
    var muted = false;
    function mute(on) {
      var s = window.speechSynthesis, fw = document.getElementById("canvas-wrapper");
      if (on && !muted) {
        muted = true;
        if (s) { s.speak = function () {}; s.cancel = function () {}; }
        if (fw) { fw.requestFullscreen = null; fw.webkitRequestFullscreen = null; }
      } else if (!on && muted) {
        muted = false;
        if (s) { delete s.speak; delete s.cancel; }
        if (fw) { delete fw.requestFullscreen; delete fw.webkitRequestFullscreen; }
      }
    }
    var scrolledFor = -1;
    window.addEventListener("message", function (ev) {
      if (ev.source !== window.parent) return;
      var m = ev.data;
      if (!m || m.egt !== 1) return;
      if (m.cmd === "mute") { mute(!!m.on); return; }
      var el = m.key ? find(m.key) : null;
      if (m.cmd === "click") { if (el) el.click(); return; }
      if (m.cmd !== "watch") return;
      if (el && m.idx !== scrolledFor) {
        scrolledFor = m.idx;
        try { el.scrollIntoView({ block: "center", inline: "nearest", behavior: "smooth" }); } catch (e) { el.scrollIntoView(); }
      }
      var r = el ? el.getBoundingClientRect() : null;
      var solve = document.getElementById("screen-solve"), fw = document.getElementById("canvas-wrapper");
      window.parent.postMessage({
        egt: 1, type: "state", key: m.key,
        rect: r ? { l: r.left, t: r.top, w: r.width, h: r.height } : null,
        st: {
          curves: /EngineeringCurves_App\.html$/i.test(location.pathname) && G("typeof openProblem") === "function",
          prob: G("probIndex"), cyc: G("PROBLEMS.findIndex(function(p){ return /cycloid/i.test(p.title); })"),
          started: G("started") === true, step: G("currentStep"), n: G("P ? P.steps.length : 0"),
          solve: !!(solve && solve.getClientRects().length), fs: !!(fw && fw.classList.contains("fs-on"))
        }
      }, "*");
    });
  }
})();
