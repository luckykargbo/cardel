const { initDatabase, run } = require('./database/db');

async function clean() {
  await initDatabase();
  run("DELETE FROM reviews");
  console.log("Cleared old reviews table!");
}

clean();
