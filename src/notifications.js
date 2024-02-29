// import config from "./config.js";
import {createConnection} from 'cloudflare-mysql';

const getNotifications = async (config) => {
	const query = 'SELECT * FROM notification where active = 1';
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

			connection.query(query, (error, rows, fields) => {
				connection.end();

				resolve({ fields, rows });
			});
		});
	});
	const { rows, fields } = results;
	return [rows, fields];
}

const updateSentAt = async (config, id) => {
	const sentAt = new Date().toISOString().slice(0, 19).replace('T', ' ');
	console.log('sentAt', sentAt);
	const query = 'UPDATE notification SET sentAt = ? WHERE notificationId = ?';
	const result = await new Promise((resolve) => {
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

			connection.query(query, [sentAt, id], (error, rows, fields) => {
				connection.end();

				resolve({ rows, fields });
			});
		});
	});
	return [result];
}

const notificationRepository = {
	getNotifications,
	updateSentAt,
};


export default notificationRepository;
