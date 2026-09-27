/**
 * HTTP server entry point.
 *
 * Starts the Express application created in `./app` on the configured port so the
 * process stays alive and serves requests.
 */
import app from './app';

/** TCP port to listen on, taken from the environment with a 3000 fallback. */
const PORT = process.env.PORT || 3000;

/** Logs the bound address once the server starts accepting connections. */
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});