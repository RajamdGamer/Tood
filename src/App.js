import React, { useEffect, useRef, useState } from "react";

const CANVAS_WIDTH = 900;
const CANVAS_HEIGHT = 600;
const COLUMN_WIDTH = CANVAS_WIDTH / 3;
const ROW_HEIGHT = 60;
const GAP = 16;

const columns = [
  { key: "incompleted", label: "Incompleted" },
  { key: "ongoing", label: "Ongoing" },
  { key: "completed", label: "Completed" },
];

function initialTasks() {
  return [
    { id: 1, title: "Do dishes", status: "incompleted" },
    { id: 2, title: "Read book", status: "ongoing" },
    { id: 3, title: "Buy milk", status: "completed" },
    { id: 4, title: "Learn React", status: "incompleted" }
  ];
}

function App() {
  const canvasRef = useRef(null);
  const [tasks, setTasks] = useState(initialTasks);
  const [drag, setDrag] = useState(null); 
  // drag = { taskId, offsetX, offsetY, x, y }

  // Store rectangles for hit-testing
  const rectsRef = useRef([]);

  useEffect(() => {
    draw();
    // eslint-disable-next-line
  }, [tasks, drag]);

  const draw = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    rectsRef.current = [];

    columns.forEach((col, colIdx) => {
      // Draw column background
      ctx.fillStyle = "#f0f0f0";
      ctx.fillRect(colIdx * COLUMN_WIDTH, 0, COLUMN_WIDTH, CANVAS_HEIGHT);

      // Draw column label
      ctx.fillStyle = "#222";
      ctx.font = "bold 22px sans-serif";
      ctx.fillText(
        col.label,
        colIdx * COLUMN_WIDTH + 24,
        36
      );

      // Get tasks in this column
      const colTasks = tasks.filter((t) => t.status === col.key);

      colTasks.forEach((task, rowIdx) => {
        // If dragging this task, skip—draw it on top
        if (drag && drag.taskId === task.id) return;

        const x = colIdx * COLUMN_WIDTH + GAP;
        const y = 50 + rowIdx * (ROW_HEIGHT + GAP);

        // Box
        ctx.fillStyle = "#fff";
        ctx.strokeStyle = "#aaa";
        ctx.lineWidth = 2;
        ctx.shadowColor = "rgba(0,0,0,0.08)";
        ctx.shadowBlur = 6;
        ctx.fillRect(x, y, COLUMN_WIDTH - 2 * GAP, ROW_HEIGHT);
        ctx.strokeRect(x, y, COLUMN_WIDTH - 2 * GAP, ROW_HEIGHT);
        ctx.shadowBlur = 0;

        // Text
        ctx.fillStyle = "#333";
        ctx.font = "18px sans-serif";
        ctx.fillText(task.title, x + 18, y + 36);

        // Store for hit-test
        rectsRef.current.push({
          ...task,
          x, y, w: COLUMN_WIDTH - 2 * GAP, h: ROW_HEIGHT,
          colKey: col.key
        });
      });
    });

    // Draw dragging task (on top)
    if (drag) {
      const task = tasks.find(t => t.id === drag.taskId);
      if (task) {
        ctx.globalAlpha = 0.8;
        ctx.fillStyle = "#e3f7fa";
        ctx.strokeStyle = "#41b8c3";
        ctx.lineWidth = 2;
        ctx.shadowColor = "rgba(66, 152, 238, 0.22)";
        ctx.shadowBlur = 10;
        ctx.fillRect(
          drag.x - drag.offsetX,
          drag.y - drag.offsetY,
          COLUMN_WIDTH - 2 * GAP,
          ROW_HEIGHT);
        ctx.strokeRect(
          drag.x - drag.offsetX,
          drag.y - drag.offsetY,
          COLUMN_WIDTH - 2 * GAP,
          ROW_HEIGHT);
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
        ctx.fillStyle = "#2299aa";
        ctx.font = "18px sans-serif";
        ctx.fillText(
          task.title,
          drag.x - drag.offsetX + 18,
          drag.y - drag.offsetY + 36
        );
      }
    }
  };

  // Get mouse position relative to canvas
  const getMousePos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / (rect.width / CANVAS_WIDTH),
      y: (e.clientY - rect.top) / (rect.height / CANVAS_HEIGHT),
    };
  };

  // Find task under mouse
  const hitTask = (mouse) => {
    return rectsRef.current.find(
      (r) => mouse.x > r.x && mouse.x < r.x + r.w &&
             mouse.y > r.y && mouse.y < r.y + r.h
    );
  };

  // -- Drag Handlers --
  const handleMouseDown = (e) => {
    const mouse = getMousePos(e);
    const hit = hitTask(mouse);
    if (hit) {
      setDrag({
        taskId: hit.id,
        offsetX: mouse.x - hit.x,
        offsetY: mouse.y - hit.y,
        x: mouse.x,
        y: mouse.y
      });
    }
  };

  const handleMouseUp = (e) => {
    if (drag) {
      const mouse = getMousePos(e);
      // Figure out which column we landed on
      const colIdx = Math.floor(mouse.x / COLUMN_WIDTH);
      const col = columns[colIdx];
      if (col && col.key) {
        setTasks((ts) =>
          ts.map(t =>
            t.id === drag.taskId
              ? { ...t, status: col.key }
              : t
          )
        );
      }
      setDrag(null);
    }
  };

  const handleMouseMove = (e) => {
    if (drag) {
      const mouse = getMousePos(e);
      setDrag(d => ({
        ...d,
        x: mouse.x,
        y: mouse.y
      }));
    }
  };

  // Optional: Disable text selection while dragging
  useEffect(() => {
    if (drag) document.body.style.userSelect = "none";
    else document.body.style.userSelect = "";
  }, [drag]);

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center', 
      height: '100vh',
      background: '#f5f9fa' 
    }}>
      <h1>Canvas Todo Drag &amp; Drop</h1>
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        style={{
          border: "1.5px solid #bbb",
          background: "#fafcff",
          boxShadow: "0 5px 28px #ccddef44",
          borderRadius: "12px",
          margin: "12px"
        }}
        tabIndex={0}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
      />
      <div style={{marginTop: 24, color: "#666", fontSize: 15}}>
        <strong>Tip:</strong> Drag tasks between columns!
      </div>
    </div>
  );
}

export default App;
