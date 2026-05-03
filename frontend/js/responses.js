const API = "/feedback";

function timeAgo(iso) {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const sec = Math.floor((now - then) / 1000);
  if (sec < 60) return `${sec} second${sec === 1 ? "" : "s"} ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} minute${min === 1 ? "" : "s"} ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} hour${hr === 1 ? "" : "s"} ago`;
  const day = Math.floor(hr / 24);
  return `${day} day${day === 1 ? "" : "s"} ago`;
}

function initial(name) {
  const c = (name || "?").trim().charAt(0);
  return c ? c.toUpperCase() : "?";
}

/** Safe text node — avoids XSS when rendering user content */
function setText(el, text) {
  el.textContent = text;
}

async function load() {
  const root = document.getElementById("submissions-root");

  try {
    const res = await fetch(API);
    if (!res.ok) throw new Error(String(res.status));
    const items = await res.json();

    if (!items.length) {
      root.innerHTML = '<p class="empty-state">No messages yet. When someone uses the form, they will show up here.</p>';
      return;
    }

    const list = document.createElement("ol");
    list.className = "submission-feed";

    items.forEach((item, index) => {
      const rank = String(index + 1).padStart(2, "0");

      const li = document.createElement("li");
      li.className = "submission-feed-item";

      const indexEl = document.createElement("span");
      indexEl.className = "feed-index";
      indexEl.setAttribute("aria-hidden", "true");
      setText(indexEl, rank);

      const body = document.createElement("div");
      body.className = "feed-item-body";

      const toolbar = document.createElement("div");
      toolbar.className = "feed-toolbar";

      const chip = document.createElement("span");
      chip.className = "feed-chip";
      setText(chip, initial(item.name));

      const meta = document.createElement("div");
      meta.className = "feed-meta";

      const nameSpan = document.createElement("span");
      nameSpan.className = "feed-name";
      setText(nameSpan, item.name);

      const emailSpan = document.createElement("span");
      emailSpan.className = "feed-email";
      setText(emailSpan, item.email);

      meta.append(nameSpan, emailSpan);

      const timeEl = document.createElement("time");
      timeEl.className = "feed-time";
      timeEl.dateTime = item.created_at;
      setText(timeEl, timeAgo(item.created_at));

      toolbar.append(chip, meta, timeEl);

      const messageEl = document.createElement("p");
      messageEl.className = "feed-message";
      setText(messageEl, item.message);

      body.append(toolbar, messageEl);
      li.append(indexEl, body);
      list.append(li);
    });

    root.replaceChildren(list);
  } catch {
    root.innerHTML =
      '<p class="empty-state">Could not load messages. Check that the server is running and refresh.</p>';
  }
}

load();
