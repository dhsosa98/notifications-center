import {createConnection} from 'cloudflare-mysql';


const getDevices = async (config, userId) => {
	const query = 'SELECT * FROM device where userId = ?';
	const results = await new Promise((resolve) => {
		const connection = createConnection({
			host: config.MYSQL_HOST,
			user: config.MYSQL_USER,
			database: config.MYSQL_DB,
			password: config.MYSQL_PASSWORD,
			port: config.MYSQL_PORT
		});

		connection.connect((error) => {
			if(error)
				throw new Error(error.message);

			connection.query(query, [ userId ], (error, rows, fields) => {
				connection.end();

				resolve({ fields, rows });
			});
		});
	});
	const { rows, fields } = results;
	return [rows, fields];
}


const deviceRepository = {
	getDevices,
};

export default deviceRepository;
