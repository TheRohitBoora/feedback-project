const API = "/feedback";

const form = document.getElementById("feedback-form");
const submitBtn = document.getElementById("submit-btn");
const messageEl = document.getElementById("form-message");

function showMessage(kind, text) {
  messageEl.hidden = false;
  messageEl.className = `alert ${kind}`;
  messageEl.textContent = text;
}

function clearMessage() {
  messageEl.hidden = true;
  messageEl.textContent = "";
  messageEl.className = "alert";
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearMessage();

  const name = form.name.value.trim();
  const email = form.email.value.trim();
  const message = form.message.value.trim();

  if (!name || !email || !message) {
    showMessage("error", "Please fill in all fields.");
    return;
  }

  submitBtn.disabled = true;

  try {
    const res = await fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, message }),
    });

    const data = await res.json().catch(() => ({}));

    if (res.ok && data.ok) {
      showMessage("success", "Thanks — your feedback was sent successfully.");
      form.reset();
    } else {
      const err = data.error || `Something went wrong (${res.status}).`;
      showMessage("error", err);
    }
  } catch {
    showMessage("error", "Network error. Is the server running?");
  } finally {
    submitBtn.disabled = false;
  }
});
