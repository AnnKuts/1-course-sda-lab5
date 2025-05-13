document.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById("canvas");
    const ctx = canvas.getContext("2d");

    //parametres
    const seed = 4111;
    const n3 = 1;
    const n4 = 1;
    const n = 10 + n3;
    const k = 1.0 - n3 * 0.02 - n4 * 0.005 - 0.25; // 0.725

   //Park–Miller's algorythm
    function genRand(seed) {
        const MOD = 2147483647;
        let val = seed % MOD;
        return function () {
            val = (val * 16807) % MOD;
            return (val - 1) / MOD;
        };
    }

    const rand = genRand(seed);

   //matrix generation
    function genDirMatrix(k) {
        const raw = Array.from({length: n}, () =>
            Array.from({length: n}, () => rand() * 2)
        );
        const dir = raw.map(row => row.map(v => (v * k >= 1 ? 1 : 0)));

    //if a bidirectional edge exists, randomly remove one arrow
        for (let i = 0; i < n; i++) {
            for (let j = i + 1; j < n; j++) {
                if (dir[i][j] && dir[j][i]) {
                    if (rand() < 0.5) dir[i][j] = 0;
                    else dir[j][i] = 0;
                }
            }
        }
        return dir;
    }

    function genUndirMatrix(dir) {
        const undir = Array.from({length: n}, () => Array(n).fill(0));
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                if (dir[i][j] || dir[j][i]) undir[i][j] = undir[j][i] = 1;
            }
        }
        return undir;
    }

   //console print
    function printMatrix(matrix, title) {
        console.log(`\n${title}:`);
        matrix.forEach(row => console.log(row.join(" ")));
    }

    const w = canvas.width;
    const h = canvas.height;
    const RAD = 20;
    const centerX = w / 2;
    const centerY = h / 2;
    const radius = 280;

    const positions = Array.from({length: n}, (_, i) => {
        const angle = (2 * Math.PI * i) / n - Math.PI / 2;
        return {
            x: centerX + radius * Math.cos(angle),
            y: centerY + radius * Math.sin(angle)
        };
    });

    function distanceToLine(p1, p2, p) {
        const A = p.x - p1.x, B = p.y - p1.y;
        const C = p2.x - p1.x, D = p2.y - p1.y;
        const dot = A * C + B * D, len2 = C * C + D * D;
        const param = dot / len2;
        let xx, yy;
        if (param < 0) {
            xx = p1.x;
            yy = p1.y;
        } else if (param > 1) {
            xx = p2.x;
            yy = p2.y;
        } else {
            xx = p1.x + param * C;
            yy = p1.y + param * D;
        }
        const dx = p.x - xx, dy = p.y - yy;
        return Math.hypot(dx, dy);
    }

    function drawArrow(p1, p2, cp = null) {
        let angle;
        if (cp) {
            const t = 0.95;
            const x = (1 - t) ** 2 * p1.x + 2 * (1 - t) * t * cp.x + t ** 2 * p2.x;
            const y = (1 - t) ** 2 * p1.y + 2 * (1 - t) * t * cp.y + t ** 2 * p2.y;
            const dx = 2 * (1 - t) * (cp.x - p1.x) + 2 * t * (p2.x - cp.x);
            const dy = 2 * (1 - t) * (cp.y - p1.y) + 2 * t * (p2.y - cp.y);
            angle = Math.atan2(dy, dx);
            p2 = {x, y};
        } else {
            const dx = p2.x - p1.x, dy = p2.y - p1.y;
            angle = Math.atan2(dy, dx);
            p2 = {
                x: p2.x - RAD * Math.cos(angle),
                y: p2.y - RAD * Math.sin(angle)
            };
        }

        ctx.beginPath();
        ctx.moveTo(p2.x, p2.y);
        ctx.lineTo(
            p2.x - 10 * Math.cos(angle - Math.PI / 8),
            p2.y - 10 * Math.sin(angle - Math.PI / 8)
        );
        ctx.lineTo(
            p2.x - 10 * Math.cos(angle + Math.PI / 8),
            p2.y - 10 * Math.sin(angle + Math.PI / 8)
        );
        ctx.closePath();
        ctx.fill();
    }

    function drawSelfLoop(nodeX, nodeY, directed) {
        const arcR = RAD * 0.75;           // радіус петлі
        const offset = RAD + 10;     // відступ від центру вершини


        const dx = nodeX - centerX;
        const dy = nodeY - centerY;
        let theta = Math.atan2(dy, dx) * 180 / Math.PI; // градуси
        if (theta < 0) theta += 360;
        let cx, cy, start, end;
        if (theta >= 315 || theta < 45) {
            // right
            cx = nodeX + offset;
            cy = nodeY;
            start = -135;
            end = 135;
        } else if (theta >= 45 && theta < 135) {
            // down
            cx = nodeX;
            cy = nodeY + offset;
            start = 225;
            end = 135;
        } else if (theta >= 135 && theta < 225) {
            // left
            cx = nodeX - offset;
            cy = nodeY;
            start = Math.PI / 4;
            end = -45;
        } else {
            // up
            cx = nodeX;
            cy = nodeY - offset;
            start = Math.PI / 4;
            end = -Math.PI / 4;
        }
       //into radians
        const s = start * Math.PI / 180;
        const e = end * Math.PI / 180;

        ctx.beginPath();
        ctx.arc(cx, cy, arcR, s, end, false);
        ctx.stroke();

        if (!directed) return;

        const ax = cx + arcR * Math.cos(e);
        const ay = cy + arcR * Math.sin(e);
        const arrowAngle = Math.atan2(nodeY - ay, nodeX - ax);
        const L = 0.55 * arcR;

        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(
            ax - L * Math.cos(arrowAngle - Math.PI / 6),
            ay - L * Math.sin(arrowAngle - Math.PI / 6)
        );
        ctx.lineTo(
            ax - L * Math.cos(arrowAngle + Math.PI / 6),
            ay - L * Math.sin(arrowAngle + Math.PI / 6)
        );
        ctx.closePath();
        ctx.fill();
    }


    //draw
    function drawGraph(matrix, directed) {
        ctx.clearRect(0, 0, w, h);
        ctx.strokeStyle = "#333";
        ctx.fillStyle = "#000";

        // edges
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                if (!matrix[i][j]) continue;
                if (!directed && j < i) continue;

                if (i === j) {
                    drawSelfLoop(positions[i].x, positions[i].y, directed, i);
                    continue;
                }

                const p1 = positions[i], p2 = positions[j];
                let curved = false, cp = null;
                for (let k2 = 0; k2 < n; k2++) {
                    if (k2 === i || k2 === j) continue;
                    if (distanceToLine(p1, p2, positions[k2]) < 25) {
                        curved = true;
                        const mid = {x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2};
                        const perp = {x: -(p2.y - p1.y), y: p2.x - p1.x};
                        const len = Math.hypot(perp.x, perp.y);
                        const dirSign = i < j ? 1 : -1;
                        cp = {
                            x: mid.x + dirSign * (perp.x / len) * 90,
                            y: mid.y + dirSign * (perp.y / len) * 90
                        };
                        break;
                    }
                }

                ctx.beginPath();
                ctx.moveTo(p1.x, p1.y);
                if (curved) ctx.quadraticCurveTo(cp.x, cp.y, p2.x, p2.y);
                else ctx.lineTo(p2.x, p2.y);
                ctx.stroke();

                if (directed) drawArrow(p1, p2, curved ? cp : null);
            }
        }

        // verticles
        for (let i = 0; i < n; i++) {
            ctx.beginPath();
            ctx.fillStyle = "#fff";
            ctx.arc(positions[i].x, positions[i].y, RAD, 0, 2 * Math.PI);
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = "#000";
            ctx.font = "14px Times New Roman";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(i + 1, positions[i].x, positions[i].y);
        }
    }

    //initialize
    const dirMatrix = genDirMatrix(k);
    const undirMatrix = genUndirMatrix(dirMatrix);

    document.getElementById("btnDirected").onclick = () => {
        console.clear();
        printMatrix(dirMatrix, "Directed Matrix (Adir)");
        drawGraph(dirMatrix, true);
    };

    document.getElementById("btnUndirected").onclick = () => {
        console.clear();
        printMatrix(undirMatrix, "Undirected Matrix (Aundir)");
        drawGraph(undirMatrix, false);
    };
});
