import { Game } from './gameCore.js';

// Game initialization
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const game = new Game(canvas, ctx);

// Level selection
const levelSelect = document.getElementById('levelSelect');
const levelButtons = document.getElementById('levelButtons');

async function loadLevelList() {
    try {
        const response = await fetch('levels/levelList.json');
        const levels = await response.json();
        
        levelButtons.innerHTML = '';
        levels.forEach(level => {
            const button = document.createElement('button');
            button.textContent = level.name;
            button.onclick = () => {
                game.loadLevel(`levels/${level.file}`);
                levelSelect.style.display = 'none';
            };
            levelButtons.appendChild(button);
        });
        
        // Show level select by default
        levelSelect.style.display = 'block';
    } catch (error) {
        console.error('Error loading level list:', error);
        // Load default level if list fails
        game.loadLevel('levels/level1.json');
    }
}

// ESC key to show level select
window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        levelSelect.style.display = levelSelect.style.display === 'none' ? 'block' : 'none';
    }
});

// Start the game
loadLevelList();
