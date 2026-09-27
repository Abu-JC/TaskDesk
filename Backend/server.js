import http from 'http'
import pool from './db.js'
import 'dotenv/config'

const PORT = process.env.SERVER_PORT

const server = http.createServer(async (req, res) => {
    // Common CORS Headers
    const headers = {
        "content-type": "application/json",
        "access-control-allow-origin": "*",
        "access-control-allow-methods": "GET, POST, OPTIONS",
        "access-control-allow-headers": "Content-Type"
    }

    // Handle CORS preflight checkA
    if (req.method === "OPTIONS") {
        res.writeHead(204, headers)
        res.end()
        return
    }

    // GET /todos
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
    // POST /todos
    else if (req.url === "/todos" && req.method === "POST") {
    let body = ""

    req.on("data", chunk => {
      body += chunk.toString()
    })

    req.on("end", async () => {
      try {
        // Parse raw body string into a JavaScript object
        const parsedData = JSON.parse(body)
        const title = parsedData.title

        const result = await pool.query(
          "INSERT INTO tasks (title) VALUES ($1) RETURNING *",
          [title]
        )

        // Only send 201 if JSON parsing AND database query succeed
        res.writeHead(201, {
          "content-type": "application/json",
          "access-control-allow-origin": "*"
        })
        res.end(JSON.stringify(result.rows[0]))
      } catch (err) {
        // Send 400 Bad Request if JSON parsing fails
        res.writeHead(400, {
          "content-type": "application/json",
          "access-control-allow-origin": "*"
        })
        res.end(JSON.stringify({ error: err.message }))
      }
    })
  }
    
    else {
        res.writeHead(404, headers)
        res.end(JSON.stringify({ error: "Route not found" }))
    }
})

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
})