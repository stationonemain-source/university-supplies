(function(){
  var TEL = "+14054359509";
  function store(k, v){ try{ if(v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); }catch(e){ return null; } }

  // ---- entry check (21+ on the smoke shop, patients on the dispensary page).
  // Remembered per browser: a view preference, not a record.
  var gate = document.getElementById("gate");
  if(gate){
    var key = gate.dataset.key;
    if(store(key) !== "1"){
      gate.hidden = false; document.body.style.overflow = "hidden";
      var yes = gate.querySelector('[data-gate="yes"]'); if(yes) yes.focus();
    }
    gate.addEventListener("click", function(ev){
      var b = ev.target.closest("[data-gate]"); if(!b) return;
      if(b.dataset.gate === "yes"){ store(key, "1"); gate.hidden = true; document.body.style.overflow = ""; }
      else { gate.querySelector("[data-gate-msg]").hidden = false; }
    });
  }

  // ---- open 10 AM to 3 AM every day, Norman time
  function nowMin(){
    var p = new Intl.DateTimeFormat("en-US",{timeZone:"America/Chicago",hour:"numeric",minute:"numeric",hourCycle:"h23"}).formatToParts(new Date()), o = {};
    p.forEach(function(x){ o[x.type] = x.value; }); return (+o.hour % 24) * 60 + (+o.minute);
  }
  function clock(){
    return new Intl.DateTimeFormat("en-US",{timeZone:"America/Chicago",hour:"numeric",minute:"2-digit"}).format(new Date());
  }
  function renderStatus(){
    var m = nowMin(), open = (m >= 600 || m < 180);
    var msg = open ? ((m < 180 || m >= 1320) ? "Open late · until 3 AM" : "Open now · until 3 AM") : "Closed · opens today at 10 AM";
    document.querySelectorAll("[data-status]").forEach(function(el){
      el.classList.toggle("is-open", open); el.querySelector("[data-status-text]").textContent = msg;
    });
  }
  renderStatus(); setInterval(renderStatus, 60000);
  var yr = document.querySelector("[data-year]"); if(yr) yr.textContent = new Date().getFullYear();

  // ---- what's in: board, staff demo, hold list
  var board = document.getElementById("stock");
  if(!board) return;
  // Phones: start with only the first group open so the board isn't a wall of rows.
  if(window.matchMedia && window.matchMedia("(max-width:640px)").matches){
    board.querySelectorAll("[data-grp]").forEach(function(d, i){ if(i > 0) d.open = false; });
  }
  var LABEL = {in:"In", low:"Low", out:"Out"};
  var demoState = {};
  try{ demoState = JSON.parse(store("usStockDemo") || "{}"); }catch(e){ demoState = {}; }
  var held = [];

  function applyRow(row, st){
    row.dataset.st = st;
    var pill = row.querySelector(".pill");
    pill.className = "pill " + st; pill.textContent = LABEL[st];
    row.querySelectorAll(".set button").forEach(function(b){ b.setAttribute("aria-pressed", b.dataset.set === st ? "true" : "false"); });
    var h = row.querySelector(".hold");
    h.disabled = (st === "out");
    if(st === "out" && h.getAttribute("aria-pressed") === "true"){ toggleHold(row, false); }
  }
  board.querySelectorAll(".row").forEach(function(row){
    if(demoState[row.dataset.id]) applyRow(row, demoState[row.dataset.id]);
  });
  var upd = document.querySelector("[data-updated]");
  if(upd && store("usStockDemoAt")) upd.innerHTML = "Updated <b>" + store("usStockDemoAt") + "</b> on this device (demo).";

  function itemName(row){ return row.dataset.name; }
  function toggleHold(row, on){
    var name = itemName(row), b = row.querySelector(".hold");
    b.setAttribute("aria-pressed", on ? "true" : "false");
    b.textContent = on ? "Held" : "Hold";
    held = held.filter(function(n){ return n !== name; });
    if(on) held.push(name);
    renderSheet();
  }

  board.addEventListener("click", function(ev){
    var h = ev.target.closest(".hold");
    if(h){ var row = h.closest(".row"); toggleHold(row, h.getAttribute("aria-pressed") !== "true"); return; }
    var s = ev.target.closest(".set button");
    if(s){
      var r = s.closest(".row"); applyRow(r, s.dataset.set);
      demoState[r.dataset.id] = s.dataset.set; store("usStockDemo", JSON.stringify(demoState));
      var t = clock(); store("usStockDemoAt", t);
      if(upd) upd.innerHTML = "Updated <b>" + t + "</b> on this device (demo).";
    }
  });

  var staffBtn = document.querySelector("[data-staff]");
  if(staffBtn) staffBtn.addEventListener("click", function(){
    var on = staffBtn.getAttribute("aria-pressed") !== "true";
    staffBtn.setAttribute("aria-pressed", on ? "true" : "false");
    staffBtn.textContent = on ? "Back to the customer view" : "Try the staff side";
    board.classList.toggle("staff", on);
  });

  // hold sheet
  var sheet = document.getElementById("sheet");
  var countEl = sheet.querySelector("[data-count]"), list = sheet.querySelector("ol"), body = sheet.querySelector(".sheet-body");
  var toggleBody = sheet.querySelector("[data-review]"), sms = sheet.querySelector("[data-sms]"), copyBtn = sheet.querySelector("[data-copy]");
  var nameIn = sheet.querySelector("#hold-name"), whenIn = sheet.querySelector("#hold-when"), copied = sheet.querySelector("[data-copied]");

  function message(){
    var who = (nameIn.value || "").trim();
    return "Hi University Supplies, can you hold these for me?\n" +
      held.map(function(n){ return "- " + n; }).join("\n") +
      "\nPickup: " + whenIn.value + (who ? "\nName: " + who : "") + "\n(Sent from your website)";
  }
  function renderSheet(){
    sheet.hidden = held.length === 0;
    document.body.classList.toggle("has-sheet", held.length > 0);
    if(!held.length){ body.hidden = true; toggleBody.setAttribute("aria-expanded","false"); toggleBody.textContent = "Review & send"; }
    countEl.textContent = held.length + (held.length === 1 ? " item to hold" : " items to hold");
    list.innerHTML = "";
    held.forEach(function(n){ var li = document.createElement("li"); li.textContent = n; list.appendChild(li); });
    sms.href = "sms:" + TEL + "?&body=" + encodeURIComponent(message());
    copied.hidden = true;
  }
  toggleBody.addEventListener("click", function(){
    var open = body.hidden; body.hidden = !open;
    toggleBody.setAttribute("aria-expanded", open ? "true" : "false");
    toggleBody.textContent = open ? "Hide" : "Review & send";
  });
  [nameIn, whenIn].forEach(function(el){ el.addEventListener("input", function(){ sms.href = "sms:" + TEL + "?&body=" + encodeURIComponent(message()); }); });
  copyBtn.addEventListener("click", function(){
    var txt = message();
    var done = function(){ copied.hidden = false; };
    if(navigator.clipboard && navigator.clipboard.writeText){ navigator.clipboard.writeText(txt).then(done, function(){}); }
  });
  sheet.querySelector("[data-clear]").addEventListener("click", function(){
    board.querySelectorAll('.hold[aria-pressed="true"]').forEach(function(b){ b.setAttribute("aria-pressed","false"); b.textContent = "Hold"; });
    held = []; renderSheet();
  });
})();
