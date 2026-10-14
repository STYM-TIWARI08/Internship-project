(() => {
  const storeKey = "cartshare.rooms.v1";
  const userKey = "cartshare.user.v1";
  const activityKey = "cartshare.activity.v1";
  const roomEmojis = ["🛒", "🥑", "🧃", "🧺", "🍕", "🏠"];
  let currentRoomId = null;
  let toastTimer;
  let rooms = readStore(storeKey, []);
  let userName = localStorage.getItem(userKey) || "Satyam";
  let activities = readStore(activityKey, []);

  const byId = (id) => document.getElementById(id);
  const money = (value) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(value || 0);
  const safeText = (value) => String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
  function readStore(key, fallback) {
    try { const value = JSON.parse(localStorage.getItem(key)); return Array.isArray(fallback) && !Array.isArray(value) ? fallback : (value ?? fallback); }
    catch { return fallback; }
  }
  function saveRooms() { localStorage.setItem(storeKey, JSON.stringify(rooms)); }
  function saveActivities() { localStorage.setItem(activityKey, JSON.stringify(activities.slice(0, 80))); }
  function makeId() { return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`; }
  function makeCode() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    do { code = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join(""); }
    while (rooms.some((room) => room.code === code));
    return code;
  }
  function activeRoom() { return rooms.find((room) => room.id === currentRoomId); }
  function showToast(message) {
    const toast = byId("toast");
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 2500);
  }
  function switchView(name) {
    document.querySelectorAll(".view").forEach((view) => view.classList.remove("active-view"));
    const view = byId(`${name}View`);
    if (view) view.classList.add("active-view");
    document.querySelectorAll(".nav-link").forEach((link) => link.classList.toggle("active", link.dataset.view === name));
    byId("crumbText").textContent = name === "home" ? "Overview" : name === "room" ? "Shared cart" : "Activity";
    if (name === "home") renderRooms();
    if (name === "room") renderRoom();
    if (name === "activity") renderAllActivity();
  }
  function addActivity(room, action, detail) {
    activities.unshift({ id: makeId(), roomId: room?.id || "", roomName: room?.name || "Workspace", user: userName, action, detail, time: Date.now() });
    activities = activities.slice(0, 80);
    saveActivities();
    renderActivity();
  }
  function createRoom(name) {
    const room = { id: makeId(), name: name.trim(), code: makeCode(), emoji: roomEmojis[Math.floor(Math.random() * roomEmojis.length)], members: [userName], items: [], createdAt: Date.now() };
    rooms.unshift(room);
    saveRooms();
    addActivity(room, "created", `created the room <strong>${safeText(room.name)}</strong>`);
    openRoom(room.id);
    showToast("Your room is ready. Share the code with your group!");
  }
  function joinRoom(code) {
    const cleanCode = code.trim().toUpperCase();
    const room = rooms.find((entry) => entry.code === cleanCode);
    if (!room) { showToast("We couldn't find that room on this browser. Create it here or open the same shared browser data."); return; }
    if (!room.members.includes(userName)) room.members.push(userName);
    saveRooms();
    addActivity(room, "joined", `joined <strong>${safeText(room.name)}</strong>`);
    openRoom(room.id);
    showToast(`You're in ${room.name}!`);
  }
  function openRoom(roomId) { currentRoomId = roomId; switchView("room"); }
  function renderRooms() {
    const grid = byId("roomsGrid");
    byId("roomCount").textContent = `${rooms.length} ${rooms.length === 1 ? "room" : "rooms"}`;
    if (!rooms.length) {
      grid.innerHTML = '<div class="empty-state"><div class="empty-emoji">🛒</div><strong>No rooms just yet</strong><p>Create a room for your next shared shop.</p></div>';
      return;
    }
    grid.innerHTML = rooms.map((room) => {
      const total = room.items.reduce((sum, item) => sum + item.price * item.qty, 0);
      return `<article class="room-card" tabindex="0" role="button" data-open-room="${room.id}"><div class="room-card-top"><div class="room-emoji">${room.emoji}</div><span class="muted-count">${room.code}</span></div><h3>${safeText(room.name)}</h3><p>${room.members.length} ${room.members.length === 1 ? "person" : "people"} · ${room.items.length} items</p><div class="room-card-bottom"><span>Estimated total</span><strong>${money(total)}</strong></div></article>`;
    }).join("");
  }
  function renderRoom() {
    const room = activeRoom();
    if (!room) { switchView("home"); return; }
    byId("activeRoomName").textContent = room.name;
    byId("activeRoomCode").textContent = room.code;
    const total = room.items.reduce((sum, item) => sum + item.price * item.qty, 0);
    byId("statItems").textContent = room.items.reduce((sum, item) => sum + item.qty, 0);
    byId("statTotal").textContent = money(total);
    byId("statPeople").textContent = room.members.length;
    byId("cartItemCount").textContent = room.items.length;
    byId("cartTotal").textContent = money(total);
    const list = byId("cartItems");
    if (!room.items.length) {
      list.innerHTML = '<div class="empty-state" style="margin-top:12px;padding:24px 10px"><div class="empty-emoji">🥬</div><strong>Your cart is waiting</strong><p>Add the first item and let the group build the list.</p></div>';
    } else {
      list.innerHTML = room.items.map((item) => `<div class="cart-item"><div class="item-name">${safeText(item.name)} <span class="item-qty">×${item.qty}</span></div><div class="item-owner"><span class="mini-avatar">${safeText(item.by.slice(0, 1).toUpperCase())}</span><span>${safeText(item.by)}</span></div><div class="item-price">${money(item.price * item.qty)}</div><button class="remove-item" data-remove-item="${item.id}" aria-label="Remove ${safeText(item.name)}">×</button></div>`).join("");
    }
    renderActivity();
  }
  function activityMarkup(entry) {
    const icon = entry.action === "added" ? "+" : entry.action === "removed" ? "−" : entry.action === "joined" ? "↗" : entry.action === "created" ? "✦" : "✓";
    const ago = formatAgo(entry.time);
    return `<div class="activity-entry"><div class="activity-icon">${icon}</div><div class="activity-copy"><strong>${safeText(entry.user)}</strong> ${entry.detail}<span class="activity-time">${ago} · ${safeText(entry.roomName)}</span></div></div>`;
  }
  function formatAgo(time) {
    const seconds = Math.max(0, Math.floor((Date.now() - time) / 1000));
    if (seconds < 10) return "Just now";
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return new Date(time).toLocaleDateString();
  }
  function renderActivity() {
    const room = activeRoom();
    const list = activities.filter((entry) => !room || entry.roomId === room.id).slice(0, 7);
    byId("activityList").innerHTML = list.length ? list.map(activityMarkup).join("") : '<div class="empty-state" style="padding:22px 8px"><strong>No activity yet</strong><p>Add an item to start the story.</p></div>';
  }
  function renderAllActivity() {
    const list = byId("allActivityList");
    list.innerHTML = activities.length ? activities.map(activityMarkup).join("") : '<div class="empty-state"><div class="empty-emoji">✦</div><strong>Nothing happening yet</strong><p>Your room updates will show up here.</p></div>';
  }
  function addItem(event) {
    event.preventDefault();
    const room = activeRoom();
    if (!room) return;
    const name = byId("itemName").value.trim();
    const price = Number(byId("itemPrice").value);
    const qty = Number(byId("itemQty").value);
    if (!name || !Number.isFinite(price) || price < 0 || !Number.isInteger(qty) || qty < 1) { showToast("Check the item name, price, and quantity."); return; }
    room.items.push({ id: makeId(), name, price, qty, by: userName, addedAt: Date.now() });
    saveRooms();
    addActivity(room, "added", `added <strong>${safeText(name)}</strong> to the cart`);
    byId("addItemForm").reset();
    byId("itemQty").value = "1";
    renderRoom();
    showToast("Item added to the shared cart.");
  }
  function removeItem(itemId) {
    const room = activeRoom();
    if (!room) return;
    const item = room.items.find((entry) => entry.id === itemId);
    if (!item) return;
    room.items = room.items.filter((entry) => entry.id !== itemId);
    saveRooms();
    addActivity(room, "removed", `removed <strong>${safeText(item.name)}</strong> from the cart`);
    renderRoom();
    showToast("Item removed.");
  }
  function updateUserName() {
    const answer = prompt("What should we call you?", userName);
    if (answer === null) return;
    const nextName = answer.trim().slice(0, 30);
    if (!nextName) { showToast("Please enter a name."); return; }
    userName = nextName;
    localStorage.setItem(userKey, userName);
    byId("sideUserName").textContent = userName;
    byId("userAvatar").textContent = userName.slice(0, 1).toUpperCase();
    rooms.forEach((room) => { if (room.members.includes("Satyam") && userName !== "Satyam") room.members = room.members.map((member) => member === "Satyam" ? userName : member); });
    saveRooms();
    showToast(`Profile updated to ${userName}.`);
    renderRooms();
    renderRoom();
  }
  document.querySelectorAll(".nav-link").forEach((link) => link.addEventListener("click", () => switchView(link.dataset.view)));
  byId("createRoomForm").addEventListener("submit", (event) => { event.preventDefault(); const name = byId("newRoomName").value.trim(); if (name) { createRoom(name); byId("newRoomName").value = ""; } });
  byId("joinRoomForm").addEventListener("submit", (event) => { event.preventDefault(); joinRoom(byId("roomCodeInput").value); });
  byId("addItemForm").addEventListener("submit", addItem);
  byId("roomsGrid").addEventListener("click", (event) => { const card = event.target.closest("[data-open-room]"); if (card) openRoom(card.dataset.openRoom); });
  byId("roomsGrid").addEventListener("keydown", (event) => { const card = event.target.closest("[data-open-room]"); if (card && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); openRoom(card.dataset.openRoom); } });
  byId("cartItems").addEventListener("click", (event) => { const button = event.target.closest("[data-remove-item]"); if (button) removeItem(button.dataset.removeItem); });
  byId("backHome").addEventListener("click", () => switchView("home"));
  byId("copyRoomCode").addEventListener("click", async () => { const room = activeRoom(); if (!room) return; try { await navigator.clipboard.writeText(room.code); showToast("Room code copied."); } catch { showToast(`Room code: ${room.code}`); } });
  byId("clearCartButton").addEventListener("click", () => { const room = activeRoom(); if (!room || !room.items.length) { showToast("The cart is already empty."); return; } if (!confirm("Remove every item from this shared cart?")) return; room.items = []; saveRooms(); addActivity(room, "cleared", "cleared the shared cart"); renderRoom(); showToast("Cart cleared."); });
  byId("printReceipt").addEventListener("click", () => { if (!activeRoom()) return; window.print(); });
  byId("profileButton").addEventListener("click", updateUserName);

  window.addEventListener("storage", (event) => {
    if ([storeKey, activityKey, userKey].includes(event.key)) {
      rooms = readStore(storeKey, []);
      activities = readStore(activityKey, []);
      userName = localStorage.getItem(userKey) || userName;
      byId("sideUserName").textContent = userName;
      byId("userAvatar").textContent = userName.slice(0, 1).toUpperCase();
      renderRooms();
      if (byId("roomView").classList.contains("active-view")) renderRoom();
      if (byId("activityView").classList.contains("active-view")) renderAllActivity();
    }
  });
  byId("sideUserName").textContent = userName;
  byId("userAvatar").textContent = userName.slice(0, 1).toUpperCase();
  renderRooms();
})();