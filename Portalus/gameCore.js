export class Game {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        
        // Game state
        this.player = {
            x: canvas.width / 2,
            y: canvas.height / 2,
            radius: 15,
            speed: 3,
            dx: 0,
            dy: 0,
            angle: 0,
            teleportCooldown: 0
        };
        
        this.portals = {
            blue: null,
            orange: null
        };
        
        this.walls = [];
        this.keys = {};
        this.mouse = { x: 0, y: 0 };
        
        // Event listeners
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            
            const p = this.player;
            p.dx = 0;
            p.dy = 0;
            
            if (this.keys['w'] || this.keys['arrowup']) p.dy = -p.speed;
            if (this.keys['s'] || this.keys['arrowdown']) p.dy = p.speed;
            if (this.keys['a'] || this.keys['arrowleft']) p.dx = -p.speed;
            if (this.keys['d'] || this.keys['arrowright']) p.dx = p.speed;
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
            
            const p = this.player;
            if ((e.key === 'w' || e.key === 'ArrowUp') && p.dy < 0) p.dy = 0;
            if ((e.key === 's' || e.key === 'ArrowDown') && p.dy > 0) p.dy = 0;
            if ((e.key === 'a' || e.key === 'ArrowLeft') && p.dx < 0) p.dx = 0;
            if ((e.key === 'd' || e.key === 'ArrowRight') && p.dx > 0) p.dx = 0;
        });

        window.addEventListener('mousemove', (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
        });

        window.addEventListener('mousedown', (e) => {
            // Calculate where the player is aiming
            const angle = this.player.angle;
            const startX = this.player.x + Math.cos(angle) * this.player.radius;
            const startY = this.player.y + Math.sin(angle) * this.player.radius;
            
            // Cast a ray to find where to place the portal
            let rayX = startX;
            let rayY = startY;
            let hit = false;
            
            for (let i = 0; i < 1000; i++) {
                rayX += Math.cos(angle) * 5;
                rayY += Math.sin(angle) * 5;
                
                if (this.pointInWall(rayX, rayY)) {
                    hit = true;
                    break;
                }
                
                // Stop if we go off screen
                if (rayX < 0 || rayX > this.canvas.width || rayY < 0 || rayY > this.canvas.height) {
                    break;
                }
            }
            
            if (hit) {
                if (e.button === 0) { // Left click for blue portal
                    this.placePortal('blue', rayX, rayY);
                } else if (e.button === 2) { // Right click for orange portal
                    this.placePortal('orange', rayX, rayY);
                }
            }
        });

        window.addEventListener('contextmenu', (e) => {
            e.preventDefault(); // Prevent right-click menu
        });

        window.addEventListener('resize', () => {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        });
    }
    
    async loadLevel(levelFile) {
        try {
            const response = await fetch(levelFile);
            const levelData = await response.json();
            
            // Reset game state
            this.walls = [];
            this.portals.blue = null;
            this.portals.orange = null;
            
            // Load walls
            this.walls = levelData.walls.map(wall => ({
                x: wall.x,
                y: wall.y,
                width: wall.width,
                height: wall.height
            }));
            
            // Set player position
            this.player.x = levelData.player.x || this.canvas.width / 2;
            this.player.y = levelData.player.y || this.canvas.height / 2;
            this.player.dx = 0;
            this.player.dy = 0;
            
            // Start game loop if not already running
            if (!this.gameLoopRunning) {
                this.gameLoop();
                this.gameLoopRunning = true;
            }
        } catch (error) {
            console.error('Error loading level:', error);
        }
    }
    
    // Game mechanics methods
    checkCollision(x, y) {
        for (const wall of this.walls) {
            if (x + this.player.radius > wall.x &&
                x - this.player.radius < wall.x + wall.width &&
                y + this.player.radius > wall.y &&
                y - this.player.radius < wall.y + wall.height) {
                return true;
            }
        }
        return false;
    }
    
    pointInWall(x, y) {
        for (const wall of this.walls) {
            if (x > wall.x && x < wall.x + wall.width &&
                y > wall.y && y < wall.y + wall.height) {
                return wall;
            }
        }
        return null;
    }
    
    findWallEdge(wall, x, y) {
        const leftDist = Math.abs(x - wall.x);
        const rightDist = Math.abs(x - (wall.x + wall.width));
        const topDist = Math.abs(y - wall.y);
        const bottomDist = Math.abs(y - (wall.y + wall.height));

        const minDist = Math.min(leftDist, rightDist, topDist, bottomDist);

        if (minDist === leftDist) return { x: wall.x, y: y, normal: { x: -1, y: 0 } };
        if (minDist === rightDist) return { x: wall.x + wall.width, y: y, normal: { x: 1, y: 0 } };
        if (minDist === topDist) return { x: x, y: wall.y, normal: { x: 0, y: -1 } };
        return { x: x, y: wall.y + wall.height, normal: { x: 0, y: 1 } };
    }
    
    placePortal(color, x, y) {
        const wall = this.pointInWall(x, y);
        if (!wall) return false;

        const edge = this.findWallEdge(wall, x, y);
        
        this.portals[color] = {
            x: edge.x,
            y: edge.y,
            normal: edge.normal,
            radius: 30
        };

        return true;
    }
    
    checkPortalEnter() {
        const p = this.player;
        
        if (p.teleportCooldown > 0) return null;
        
        for (const color in this.portals) {
            const portal = this.portals[color];
            if (!portal) continue;
            
            const dx = p.x - portal.x;
            const dy = p.y - portal.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < p.radius + portal.radius) {
                return color;
            }
        }
        
        return null;
    }
    
    teleportPlayer(enteredColor) {
        if (!this.portals.blue || !this.portals.orange) return;
        
        const exitColor = enteredColor === 'blue' ? 'orange' : 'blue';
        const exitPortal = this.portals[exitColor];
        const p = this.player;
        
        const speed = Math.sqrt(p.dx * p.dx + p.dy * p.dy);
        
        p.x = exitPortal.x + exitPortal.normal.x * (p.radius + 5);
        p.y = exitPortal.y + exitPortal.normal.y * (p.radius + 5);
        
        if (exitPortal.normal.x !== 0) {
            p.dx = exitPortal.normal.x * speed;
            p.dy = 0;
        } else {
            p.dx = 0;
            p.dy = exitPortal.normal.y * speed;
        }
        
        p.teleportCooldown = 10;
    }
    
    update() {
        const p = this.player;
        
        if (p.teleportCooldown > 0) {
            p.teleportCooldown--;
        }
        
        let newX = p.x + p.dx;
        let newY = p.y + p.dy;
        
        if (!this.checkCollision(newX, p.y)) {
            p.x = newX;
        }
        if (!this.checkCollision(p.x, newY)) {
            p.y = newY;
        }
        
        if (p.teleportCooldown === 0) {
            const enteredPortal = this.checkPortalEnter();
            if (enteredPortal) {
                this.teleportPlayer(enteredPortal);
            }
        }
        
        p.angle = Math.atan2(this.mouse.y - p.y, this.mouse.x - p.x);
    }
    
    draw() {
        this.ctx.fillStyle = '#111';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = '#555';
        for (const wall of this.walls) {
            this.ctx.fillRect(wall.x, wall.y, wall.width, wall.height);
        }
        
        if (this.portals.blue) {
            this.ctx.fillStyle = '#00a2ff';
            this.ctx.beginPath();
            this.ctx.arc(this.portals.blue.x, this.portals.blue.y, this.portals.blue.radius, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        if (this.portals.orange) {
            this.ctx.fillStyle = '#ff7b00';
            this.ctx.beginPath();
            this.ctx.arc(this.portals.orange.x, this.portals.orange.y, this.portals.orange.radius, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        this.ctx.fillStyle = '#fff';
        this.ctx.beginPath();
        this.ctx.arc(this.player.x, this.player.y, this.player.radius, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(this.player.x, this.player.y);
        this.ctx.lineTo(
            this.player.x + Math.cos(this.player.angle) * 50,
            this.player.y + Math.sin(this.player.angle) * 50
        );
        this.ctx.stroke();
    }
    
    gameLoop() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
}
