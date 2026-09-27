const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret) {
  throw new Error('JWT_SECRET must be set before starting the API');
}

export default {
  jwtSecret,
  frontendOrigin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
};
