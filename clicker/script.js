let score = 0;

// Get DOM elements
const scoreElement = document.getElementById("score");
const clickButton = document.getElementById("clickButton");
const saveButton = document.getElementById("saveButton");
const loadButton = document.getElementById("loadButton");

// Update score display
function updateScore() {
  scoreElement.textContent = score;
}

// Increment score on click
clickButton.addEventListener("click", () => {
  score++;
  updateScore();
});

// Encrypt score to Base64
function encryptScore(score) {
  return btoa(score.toString()); // Convert score to Base64
}

// Decrypt score from Base64
function decryptScore(encryptedScore) {
  return parseInt(atob(encryptedScore), 10); // Convert Base64 back to number
}

// Save score as a downloadable file
saveButton.addEventListener("click", () => {
  const encryptedScore = encryptScore(score);
  const blob = new Blob([encryptedScore], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "score.scr"; // File name
  a.click();
  URL.revokeObjectURL(url);
  alert("Score saved!");
});

// Load score from file
loadButton.addEventListener("click", () => {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "text/plain";
  input.onchange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const encryptedScore = e.target.result;
        try {
          score = decryptScore(encryptedScore);
          updateScore();
          alert("Score loaded!");
        } catch (error) {
          alert("Invalid file or corrupted score.");
        }
      };
      reader.readAsText(file);
    }
  };
  input.click();
});

// Initialize score display
updateScore();