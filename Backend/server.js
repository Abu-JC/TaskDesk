import http from 'http'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import pool from './db.js'
import 'dotenv/config'
import { 
  CreateTaskRequestDTO, 
  UpdateTaskRequestDTO, 
  toTaskResponseDTO 
} from './taskDTO.js'
const PORT = process.env.SERVER_PORT || 8000

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
    "access-control-allow-methods": "GET, POST, DELETE, PUT, OPTIONS",
    "access-control-allow-headers": "Content-Type"
  }

  if (req.method === "OPTIONS") {
    res.writeHead(204, headers)
    res.end()
    return
  }

  // GET ALL TODOS (WITH PAGINATION AND STATUS FILTERING)
// GET ALL TODOS (WITH PAGINATION, STATUS FILTERING, AND SORTING)
if (req.url.startsWith("/todos") && req.method === "GET" && !req.url.startsWith("/todos/")) {
  try {
    const parsedUrl = new URL(req.url, `http://${req.headers.host}`)
    const page = parseInt(parsedUrl.searchParams.get("page")) || 1
    const limit = parseInt(parsedUrl.searchParams.get("limit")) || 10
    const status = parsedUrl.searchParams.get("status")
    const order = parsedUrl.searchParams.get("order") === "ASC" ? "ASC" : "DESC"
    const offset = (page - 1) * limit

    let countQuery = "SELECT COUNT(*) FROM tasks"
    let dataQuery = "SELECT * FROM tasks"
    let countParams = []
    let dataParams = [limit, offset]

    // Apply status filter if provided and not 'all'
    if (status && status !== "all") {
      countQuery += " WHERE status = $1"
      countParams.push(status)
      dataQuery += ` WHERE status = $1 ORDER BY id ${order} LIMIT $2 OFFSET $3`
      dataParams = [status, limit, offset]
    } else {
      dataQuery += ` ORDER BY id ${order} LIMIT $1 OFFSET $2`
    }

    const countResult = await pool.query(countQuery, countParams)
    const totalTasks = parseInt(countResult.rows[0].count)
    const totalPages = Math.ceil(totalTasks / limit) || 1

    const result = await pool.query(dataQuery, dataParams)
    const taskDTOs = result.rows.map(toTaskResponseDTO)

    res.writeHead(200, headers)
    res.end(JSON.stringify({
      tasks: taskDTOs,
      currentPage: page,
      totalPages: totalPages
    }))
  } catch (err) {
    res.writeHead(500, headers)
    res.end(JSON.stringify({ error: err.message }))
  }
}

  // CREATE TODO
  else if (req.url === "/todos" && req.method === "POST") {
    let body = ""

    req.on("data", chunk => {
      body += chunk.toString()
    })

    req.on("end", async () => {
      try {
        const rawData = JSON.parse(body)
        
        // Instantiate and validate Request DTO
        const taskRequest = new CreateTaskRequestDTO(rawData)
        taskRequest.validate()

        const result = await pool.query(
          "INSERT INTO tasks (title, description, status) VALUES ($1, $2, $3) RETURNING *",
          [taskRequest.title, taskRequest.description, taskRequest.status]
        )

        // Return the clean Response DTO
        res.writeHead(201, headers)
        res.end(JSON.stringify(toTaskResponseDTO(result.rows[0])))
      } catch (err) {
        res.writeHead(400, headers)
        res.end(JSON.stringify({ error: err.message }))
      }
    })
  }

  // UPDATE TODO using UUID
else if (req.url.startsWith("/todos/") && req.method === "PUT") {
  const publicId = req.url.split("/")[2] // This is now the UUID from the frontend
  let body = ""

  req.on("data", chunk => { body += chunk.toString() })

  req.on("end", async () => {
    try {
      const rawData = JSON.parse(body)
      const taskRequest = new UpdateTaskRequestDTO(rawData)

      const result = await pool.query(
        `UPDATE tasks 
         SET title = COALESCE($1, title), 
             description = COALESCE($2, description), 
             status = COALESCE($3, status) 
         WHERE uuid = $4 RETURNING *`,
        [
          taskRequest.title ?? null, 
          taskRequest.description ?? null, 
          taskRequest.status ?? null, 
          publicId
        ]
      )

      if (result.rowCount === 0) {
        res.writeHead(404, headers)
        res.end(JSON.stringify({ error: "Task not found" }))
      } else {
        res.writeHead(200, headers)
        res.end(JSON.stringify(toTaskResponseDTO(result.rows[0])))
      }
    } catch (err) {
      res.writeHead(400, headers)
      res.end(JSON.stringify({ error: err.message }))
    }
  })
}

  // DELETE TODO
  else if (req.url.startsWith("/todos/") && req.method === "DELETE") {
    const publicId = req.url.split("/")[2] // This is the uuid sent by the frontend
    try {
      const result = await pool.query(
        "DELETE FROM tasks WHERE uuid = $1 RETURNING *", [publicId]
      )
      if (result.rowCount === 0) {
        res.writeHead(404, headers)
        res.end(JSON.stringify({ error: "Task not found" }))
      } else {
        res.writeHead(200, headers)
        res.end(JSON.stringify({ message: "Task deleted successfully" }))
      }
    } catch (err) {
      res.writeHead(500, headers)
      res.end(JSON.stringify({ error: err.message }))
    }
  }

  // SERVE STATIC FRONTEND FILES
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