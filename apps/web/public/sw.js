self.addEventListener("push", (event) => {
  let data = {};
  try { data = event.data.json(); } catch {}
  const title = data.title || "DatePage";
  const body = data.body || "You have an update.";
  const url = data.url || "/";

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      data: { url },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(clients.openWindow(url));
});
