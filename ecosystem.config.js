module.exports = {
  apps : [{
    name   : "run_server",
    script : "./run_server.sh",
    interpreter: "/usr/bin/bash",
    ignore_watch: ["node_modules", ".git"],
    watch_delay: 1000
  }]
}
