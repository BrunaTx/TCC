const dateLabel = document.getElementById("dateLabel");

if (dateLabel) {
  const today = new Date();
  dateLabel.textContent = today.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}