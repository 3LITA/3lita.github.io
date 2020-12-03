var server = require('./server')

require('./api/favourites');
require('./api/weather');

server.app.listen(3000, () => console.info("Server running on port 3000"));
