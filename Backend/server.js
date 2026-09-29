import http from 'http'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import pool from './db.js'
import 'dotenv/config'

const PORT = process.env.SERVER_PORT || 5000

// 1. Resolve directory paths for ES Modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const FRONTEND_DIR = path.join(__dirname, '../Frontend')

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon'
}

const server = http.createServer(async (req, res) => {

  const headers = {
    "content-type": "application/json",
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET, POST, DELETE, OPTIONS",
    "access-control-allow-headers": "Content-Type"
  }

  if (req.method === "OPTIONS") {
    res.writeHead(204, headers)
    res.end()
    return
  }


  if (req.url === "/todos" && req.method === "GET") {
    try {
      const result = await pool.query(
        "SELECT * FROM tasks ORDER BY id DESC"
      )
      res.writeHead(200, headers)
      res.end(JSON.stringify(result.rows))
    } catch (err) {
      res.writeHead(500, headers)
      res.end(JSON.stringify({ error: err.message }))
    }
  }

  else if (req.url === "/todos" && req.method === "POST") {
    let body = ""

    req.on("data", chunk => {
      body += chunk.toString()
    })

    req.on("end", async () => {
      try {
        const parsedData = JSON.parse(body)
        const title = parsedData.title

        const result = await pool.query(
          "INSERT INTO tasks (title) VALUES ($1) RETURNING *",
          [title]
        )

        res.writeHead(201, headers);
        res.end(JSON.stringify(result.rows[0]))
      } catch (err) {
        res.writeHead(400, headers);
        res.end(JSON.stringify({ error: err.message }))
      }
    })
  }

  else if (req.url.startsWith("/todos/") && req.method === "DELETE") {
    const id = req.url.split("/")[2];
    try {
      const result = await pool.query(
        "DELETE FROM tasks WHERE id = $1 RETURNING *", [id]
      );
      if (result.rowCount === 0) {
        res.writeHead(404, headers);
        res.end(JSON.stringify({ error: "Task not Found" }));
      } else {
        res.writeHead(200, headers);
        res.end(JSON.stringify({ message: "Task deleted successfully" }))
      }
    } catch (err) {
      res.writeHead(500, headers);
      res.end(JSON.stringify({ error: err.message }))
    }
  }
  
  else {
    let filePath = req.url === '/' 
      ? path.join(FRONTEND_DIR, 'to-do.html') 
      : path.join(FRONTEND_DIR, req.url)

    const ext = path.extname(filePath).toLowerCase()
    const contentType = MIME_TYPES[ext] || 'application/octet-stream'

    fs.readFile(filePath, (err, content) => {
      if (err) {
        if (err.code === 'ENOENT') {
          res.writeHead(404, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: 'File or Route not found' }))
        } else {
          res.writeHead(500, { 'Content-Type': 'text/plain' })
          res.end(`Server Error: ${err.code}`)
        }
      } else {
        res.writeHead(200, { 'Content-Type': contentType })
        res.end(content)
      }
    })
  }
})

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})